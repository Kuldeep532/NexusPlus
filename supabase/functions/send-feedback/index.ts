import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const feedbackEmail = Deno.env.get('FEEDBACK_EMAIL') ?? 'info@nexusweb.co.in';
  const resendKey = Deno.env.get('RESEND_API_KEY');

  if (!supabaseUrl || !serviceRole) return json({ error: 'FEEDBACK_SERVICE_NOT_CONFIGURED' }, 500);

  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return json({ error: 'AUTH_REQUIRED' }, 401);

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return json({ error: 'AUTH_REQUIRED' }, 401);

  const payload = await request.json().catch(() => null) as { title?: string; name?: string; message?: string } | null;
  const title = String(payload?.title ?? '').trim();
  const name = String(payload?.name ?? '').trim();
  const message = String(payload?.message ?? '').trim();
  const email = userData.user.email ?? null;

  if (title.length < 1 || title.length > 160) return json({ error: 'FEEDBACK_INVALID_TITLE' }, 400);
  if (name.length < 1 || name.length > 120) return json({ error: 'FEEDBACK_INVALID_NAME' }, 400);
  if (message.length < 1 || message.length > 5000) return json({ error: 'FEEDBACK_INVALID_MESSAGE' }, 400);

  const { error: insertError } = await admin.from('user_feedback').insert({
    user_id: userData.user.id,
    title,
    name,
    message,
    email,
  });
  if (insertError) return json({ error: 'FEEDBACK_SAVE_FAILED' }, 500);

  if (resendKey) {
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: Deno.env.get('FEEDBACK_FROM_EMAIL') ?? 'Nexus Plus <onboarding@resend.dev>',
        to: [feedbackEmail],
        reply_to: email ? [email] : undefined,
        subject: `Nexus Plus Feedback: ${title}`,
        text: `Name: ${name}\nEmail: ${email ?? 'Not provided'}\n\n${message}`,
      }),
    });

    if (!emailResponse.ok) {
      return json({ saved: true, emailSent: false });
    }
    return json({ saved: true, emailSent: true });
  }

  return json({ saved: true, emailSent: false });
});
