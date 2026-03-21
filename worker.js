const ALLOWED_ORIGIN = 'https://loganthein.github.io';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    const url = new URL(request.url);
    if (url.pathname !== '/oracle' || request.method !== 'POST') {
      return new Response('Not Found', { status: 404, headers: CORS_HEADERS });
    }

    const body = await request.json();
    const key = env.ANTHROPIC_KEY;
    if (!key) {
      return new Response(JSON.stringify({error: 'NO KEY FOUND'}), { status: 500, headers: CORS_HEADERS });
    }

    const anthropicResp = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: body.system,
        messages: body.messages,
      }),
    });

    const data = await anthropicResp.text();
    return new Response(data, {
      status: anthropicResp.status,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  },
};