-- NexusPlus voice-download protection
-- IMPORTANT: never store a production app token in plaintext in the database.
-- This migration assumes a trusted Postgres/Supervisor RPC layer.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS global_download_tracker (
    id SMALLINT PRIMARY KEY DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_downloads INTEGER NOT NULL DEFAULT 0 CHECK (total_downloads >= 0)
);

INSERT INTO global_download_tracker (id, window_start, total_downloads)
VALUES (1, NOW(), 0)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS app_security_config (
    id SMALLINT PRIMARY KEY DEFAULT 1,
    token_sha256 TEXT NOT NULL,
    config_version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ip_blacklist (
    ip_address INET PRIMARY KEY,
    banned_until TIMESTAMPTZ,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security_evidence_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,
    event_type TEXT NOT NULL,
    device_info JSONB,
    ip_address INET,
    payload JSONB,
    severity TEXT NOT NULL DEFAULT 'HIGH',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    active_downloads INTEGER NOT NULL DEFAULT 0 CHECK (active_downloads >= 0),
    last_download_reset TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_request_time TIMESTAMPTZ,
    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    is_honeypot_account BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS security_evidence_logs_created_at_idx
ON security_evidence_logs (created_at DESC);

CREATE OR REPLACE FUNCTION try_start_download(
    p_user_id UUID,
    p_app_token_sha256 TEXT,
    p_device_info JSONB DEFAULT NULL,
    p_ip INET DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile profiles%ROWTYPE;
    v_security app_security_config%ROWTYPE;
    v_global global_download_tracker%ROWTYPE;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    SELECT * INTO v_security
    FROM app_security_config
    WHERE id = 1;

    IF v_security.token_sha256 IS NULL
       OR p_app_token_sha256 IS NULL
       OR encode(digest(p_app_token_sha256, 'sha256'), 'hex') <> v_security.token_sha256 THEN
        INSERT INTO security_evidence_logs (user_id, event_type, device_info, ip_address, payload, severity)
        VALUES (
            p_user_id,
            'INVALID_APP_TOKEN',
            p_device_info,
            p_ip,
            jsonb_build_object('token_present', p_app_token_sha256 IS NOT NULL),
            'CRITICAL'
        );
        RETURN jsonb_build_object('success', FALSE, 'reason', 'Unauthorized request.');
    END IF;

    IF p_ip IS NOT NULL AND EXISTS (
        SELECT 1 FROM ip_blacklist
        WHERE ip_address = p_ip AND (banned_until IS NULL OR banned_until > v_now)
    ) THEN
        RETURN jsonb_build_object('success', FALSE, 'reason', 'Access denied.');
    END IF;

    SELECT * INTO v_profile
    FROM profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'reason', 'Profile not found.');
    END IF;

    IF v_profile.is_banned OR v_profile.is_honeypot_account THEN
        RETURN jsonb_build_object('success', FALSE, 'reason', 'Access denied.');
    END IF;

    -- Per-user concurrent download limit: 100 active operations.
    IF v_profile.active_downloads >= 100 THEN
        INSERT INTO security_evidence_logs (user_id, event_type, device_info, ip_address, payload, severity)
        VALUES (
            p_user_id,
            'USER_DOWNLOAD_LIMIT_REACHED',
            p_device_info,
            p_ip,
            jsonb_build_object('active_downloads', v_profile.active_downloads),
            'WARN'
        );
        RETURN jsonb_build_object('success', FALSE, 'reason', 'Too many active downloads.');
    END IF;

    -- Global 100 operations per minute. Row lock makes the increment atomic.
    SELECT * INTO v_global
    FROM global_download_tracker
    WHERE id = 1
    FOR UPDATE;

    IF v_global.window_start <= v_now - INTERVAL '1 minute' THEN
        UPDATE global_download_tracker
        SET window_start = v_now, total_downloads = 1
        WHERE id = 1;
    ELSIF v_global.total_downloads >= 100 THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'reason', 'Voice downloads are temporarily busy. Please try again shortly.'
        );
    ELSE
        UPDATE global_download_tracker
        SET total_downloads = total_downloads + 1
        WHERE id = 1;
    END IF;

    UPDATE profiles
    SET active_downloads = active_downloads + 1,
        last_request_time = v_now
    WHERE id = p_user_id;

    RETURN jsonb_build_object('success', TRUE, 'message', 'Download allowed.');
END;
$$;

CREATE OR REPLACE FUNCTION finish_download(
    p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE profiles
    SET active_downloads = GREATEST(0, active_downloads - 1)
    WHERE id = p_user_id;
END;
$$;

-- Keep this privileged: clients should call only the RPC functions above.
REVOKE ALL ON FUNCTION try_start_download(UUID, TEXT, JSONB, INET) FROM PUBLIC;
REVOKE ALL ON FUNCTION finish_download(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION try_start_download(UUID, TEXT, JSONB, INET) TO authenticated;
GRANT EXECUTE ON FUNCTION finish_download(UUID) TO authenticated;
