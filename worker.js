const ALLOWED_ORIGIN = 'https://loganthein.github.io';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname !== '/oracle' || request.method !== 'POST') {
      return new Response('Not Found', { status: 404, headers: CORS_HEADERS });
    }

    const body = await request.text();

    const geminiResp = await fetch(`${GEMINI_URL}?key=${env.GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    const data = await geminiResp.text();

    return new Response(data, {
      status: geminiResp.status,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
    });
  },
};
