import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'SIGN_IN_REQUIRED' }, 401);

  const runway = Deno.env.get('RUNWAY_API_KEY') ?? Deno.env.get('RUNWAYML_API_SECRET');
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!runway || !url || !anon || !service) {
    return json({ error: 'VIDEO_SERVICE_NOT_CONFIGURED' }, 500);
  }

  const token = authHeader.slice(7).trim();
  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error: userError } = await userClient.auth.getUser(token);
  if (userError || !user) return json({ error: 'SIGN_IN_REQUIRED' }, 401);

  const admin = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const input = await req.json().catch(() => ({}));
  const prompt = typeof input?.prompt === 'string' ? input.prompt.trim() : '';
  if (!prompt || prompt.length > 2000) return json({ error: 'INVALID_PROMPT' }, 400);

  const model = typeof input?.model === 'string' && input.model.trim()
    ? input.model.trim()
    : 'gen4_turbo';
  const duration = Math.min(
    10,
    Math.max(5, Number.isFinite(Number(input?.duration)) ? Number(input.duration) : 5),
  );
  const ratio = typeof input?.aspectRatio === 'string' && input.aspectRatio
    ? input.aspectRatio
    : '1280:720';

  const units = model === 'gen4_turbo'
    ? Math.ceil(20 * duration)
    : model === 'gen4.5'
      ? Math.ceil(48 * duration)
      : 100;

  const { error: debitError } = await admin.rpc('debit_ai_credits', {
    p_user_id: user.id,
    p_feature_code: 'video_generator',
    p_units: units,
    p_reference_id: `runway:${model}:${duration}s`,
  });

  if (debitError) {
    const message = debitError.message ?? '';
    if (message.includes('INSUFFICIENT_CREDITS')) return json({ error: 'INSUFFICIENT_CREDITS' }, 402);
    if (message.includes('ACTIVE_SUBSCRIPTION_REQUIRED')) return json({ error: 'ACTIVE_SUBSCRIPTION_REQUIRED' }, 403);
    return json({ error: 'CREDIT_CHECK_FAILED' }, 500);
  }

  const refund = async (reason: string, referenceId: string | null) => {
    await admin.rpc('refund_ai_credits', {
      p_user_id: user.id,
      p_feature_code: 'video_generator',
      p_units: units,
      p_reference_id: referenceId ?? reason,
    });
  };

  const createResponse = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${runway}`,
      'Content-Type': 'application/json',
      'X-Runway-Version': '2024-11-06',
    },
    body: JSON.stringify({ model, promptText: prompt, duration, ratio }),
  });

  const created = await createResponse.json().catch(() => ({}));
  if (!createResponse.ok) {
    await refund('RUNWAY_REQUEST_FAILED', created?.id ?? null);
    return json(
      { error: typeof created?.error === 'string' ? created.error : 'RUNWAY_REQUEST_FAILED' },
      createResponse.status,
    );
  }

  const taskId = created?.id ?? created?.taskId;
  if (!taskId) {
    await refund('RUNWAY_TASK_ID_MISSING', null);
    return json({ error: 'RUNWAY_TASK_ID_MISSING' }, 502);
  }

  const deadline = Date.now() + 8 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const statusResponse = await fetch(
      `https://api.dev.runwayml.com/v1/tasks/${encodeURIComponent(taskId)}`,
      {
        headers: {
          Authorization: `Bearer ${runway}`,
          'X-Runway-Version': '2024-11-06',
        },
      },
    );
    const status = await statusResponse.json().catch(() => ({}));

    if (!statusResponse.ok) {
      await refund('RUNWAY_STATUS_FAILED', taskId);
      return json({ error: 'RUNWAY_STATUS_FAILED', taskId }, 502);
    }

    if (status?.status === 'SUCCEEDED') {
      const videoUrl = status?.output?.[0] ?? status?.output?.video ?? status?.videoUrl;
      if (typeof videoUrl !== 'string') {
        await refund('VIDEO_URL_MISSING', taskId);
        return json({ error: 'VIDEO_URL_MISSING', taskId }, 502);
      }

      return json({
        videoUrl,
        taskId,
        creditsCharged: units,
        model,
        duration,
        ratio,
      });
    }

    if (status?.status === 'FAILED' || status?.status === 'CANCELED') {
      await refund('VIDEO_GENERATION_FAILED', taskId);
      return json({ error: 'VIDEO_GENERATION_FAILED', taskId }, 502);
    }
  }

  await refund('VIDEO_GENERATION_TIMEOUT', taskId);
  return json({ error: 'VIDEO_GENERATION_TIMEOUT', taskId }, 504);
});
