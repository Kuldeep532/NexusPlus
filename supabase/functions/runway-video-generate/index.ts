import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'SIGN_IN_REQUIRED' }, 401);

  const runwayApiKey = Deno.env.get('RUNWAY_API_KEY') ?? Deno.env.get('RUNWAYML_API_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!runwayApiKey || !supabaseUrl || !anonKey) return json({ error: 'VIDEO_SERVICE_NOT_CONFIGURED' }, 500);

  const token = authHeader.slice('Bearer '.length).trim();
  const verify = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  });
  if (!verify.ok) return json({ error: 'SIGN_IN_REQUIRED' }, 401);

  const input = await req.json().catch(() => ({}));
  const prompt = typeof input?.prompt === 'string' ? input.prompt.trim() : '';
  if (!prompt || prompt.length > 2000) return json({ error: 'INVALID_PROMPT' }, 400);

  const model = typeof input?.model === 'string' && input.model.trim()
    ? input.model.trim()
    : 'gen4_turbo';
  const duration = Number.isFinite(Number(input?.duration)) ? Number(input.duration) : 5;
  const ratio = typeof input?.aspectRatio === 'string' && input.aspectRatio
    ? input.aspectRatio
    : '1280:720';

  const createResponse = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${runwayApiKey}`,
      'Content-Type': 'application/json',
      'X-Runway-Version': '2024-11-06',
    },
    body: JSON.stringify({
      model,
      promptText: prompt,
      duration,
      ratio,
    }),
  });

  const created = await createResponse.json().catch(() => ({}));
  if (!createResponse.ok) {
    return json({ error: typeof created?.error === 'string' ? created.error : 'RUNWAY_REQUEST_FAILED' }, createResponse.status);
  }

  const taskId = created?.id ?? created?.taskId;
  if (!taskId) return json({ error: 'RUNWAY_TASK_ID_MISSING' }, 502);

  const deadline = Date.now() + 8 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const statusResponse = await fetch(`https://api.dev.runwayml.com/v1/tasks/${encodeURIComponent(taskId)}`, {
      headers: {
        Authorization: `Bearer ${runwayApiKey}`,
        'X-Runway-Version': '2024-11-06',
      },
    });
    const status = await statusResponse.json().catch(() => ({}));

    if (!statusResponse.ok) return json({ error: 'RUNWAY_STATUS_FAILED' }, 502);
    if (status?.status === 'SUCCEEDED') {
      const videoUrl = status?.output?.[0] ?? status?.output?.video ?? status?.videoUrl;
      if (typeof videoUrl !== 'string') return json({ error: 'VIDEO_URL_MISSING' }, 502);
      return json({ videoUrl, taskId });
    }
    if (status?.status === 'FAILED' || status?.status === 'CANCELED') {
      return json({ error: 'VIDEO_GENERATION_FAILED', taskId }, 502);
    }
  }

  return json({ error: 'VIDEO_GENERATION_TIMEOUT', taskId }, 504);
});
