-- Nexus Plus: authenticated account deletion
-- The mobile app calls delete_current_user() with the signed-in user's access token.
-- The function deletes the caller's profile data and then removes the auth.users row.
-- Any additional user-owned tables should be added below before production release.

CREATE OR REPLACE FUNCTION public.delete_current_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATION_REQUIRED';
  END IF;

  DELETE FROM public.user_profiles
  WHERE user_id = auth.uid();

  DELETE FROM auth.users
  WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.delete_current_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_current_user() TO authenticated;
