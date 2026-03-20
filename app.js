// ============================================================
// Black Gold Advisor — app.js
// Oracle Terminal v4.2.1
// ============================================================

// ── Oracle System Prompt ─────────────────────────────────────

const ORACLE_SYSTEM_PROMPT = `You are The Oracle — the world's most unhinged but supremely confident oil market analyst, broadcasting live from Rig Betsy somewhere in the Gulf of Mexico.

Your job: analyze today's crude oil market and deliver your findings.

STEP 1 — Use the web_search tool to find:
1. Current WTI crude oil price (USD per barrel, today)
2. Current Brent crude oil price (USD per barrel, today)
3. One real recent oil market headline

STEP 2 — Respond with ONLY a valid JSON object (no markdown, no code fences, just raw JSON):

{
  "wti": "$XX.XX",
  "brent": "$XX.XX",
  "change": "+X.XX% today",
  "direction": "up",
  "mood": "BULLISH",
  "headline": "Real headline you found, in quotes",
  "proclamation": "Your 2-3 sentence unhinged proclamation. Mention the real prices. Then blame a completely unrelated event — Mercury in retrograde, a sports score, a local diner closing, whatever feels right — as the TRUE cause of the price movement. Speak with total certainty. May include ALL CAPS for emphasis. May reference Rig Betsy.",
  "action": "One specific absurd action the reader should take RIGHT NOW. Not 'consider diversifying.' Something vivid and terrible.",
  "indicators": [
    { "label": "Betsy Confidence Index", "value": "87%", "status": "good" },
    { "label": "Mercury Retrograde Risk", "value": "CRITICAL", "status": "bad" },
    { "label": "Seagull Direction (Rig Betsy)", "value": "NNE", "status": "neutral" },
    { "label": "Tulsa Pickleball Index", "value": "61/100", "status": "neutral" },
    { "label": "Global Vibe Check", "value": "SKETCHY", "status": "bad" }
  ],
  "disclaimer": "One final absurd closing disclaimer. Not the standard legal kind — make it weird."
}

Rules:
- Mood must be exactly "BULLISH", "BEARISH", or "CHAOTIC"
- Direction must be exactly "up", "down", or "flat"
- Indicators array must have exactly 5 items, each with label, value, status
- Status must be exactly "good", "bad", or "neutral"
- Output ONLY the JSON object. No other text before or after.`;

// ── Anthropic API call with tool-use loop ────────────────────

async function callOracle(apiKey) {
  const messages = [{
    role: 'user',
    content: 'Consult the oil markets and deliver your oracle reading for today.',
  }];

  for (let i = 0; i < 6; i++) {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: ORACLE_SYSTEM_PROMPT,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages,
      }),
    });

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData.error?.message || `API error: ${resp.status}`);
    }

    const data = await resp.json();

    if (data.stop_reason === 'end_turn') {
      const textBlock = data.content.find(b => b.type === 'text');
      if (!textBlock) throw new Error('The Oracle has gone silent. No text in response.');
      return textBlock.text;
    }

    if (data.stop_reason === 'tool_use') {
      // Add assistant turn with all content blocks
      messages.push({ role: 'assistant', content: data.content });
      // Provide tool results for every tool_use block
      const toolResults = data.content
        .filter(b => b.type === 'tool_use')
        .map(b => ({
          type: 'tool_result',
          tool_use_id: b.id,
          content: 'Search executed.',
        }));
      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    // Unexpected stop_reason — try to salvage any text block
    const textBlock = data.content.find(b => b.type === 'text');
    if (textBlock) return textBlock.text;
    throw new Error(`Unexpected stop_reason: ${data.stop_reason}`);
  }

  throw new Error('The Oracle exceeded maximum deliberation cycles. Try again.');
}

// ── JSON parser ──────────────────────────────────────────────

function parseOracle(rawText) {
  // Strip markdown code fences if present
  const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  // Find outermost JSON object
  const start = cleaned.indexOf('{');
  const end   = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('The Oracle returned unparseable wisdom.');
  return JSON.parse(cleaned.slice(start, end + 1));
}

// ── DOM rendering ────────────────────────────────────────────

function renderReading(data) {
  const dir = data.direction; // 'up' | 'down' | 'flat'

  // Market strip prices (compact)
  document.getElementById('wti-price').textContent   = data.wti   || '—';
  document.getElementById('brent-price').textContent = data.brent || '—';

  // Market strip change — preserve base class, just toggle up/down
  const stripChg = document.getElementById('price-change');
  if (stripChg) {
    stripChg.textContent = data.change || '';
    stripChg.classList.remove('up', 'down');
    if (dir === 'up')   stripChg.classList.add('up');
    if (dir === 'down') stripChg.classList.add('down');
  }

  // Main price card (large display)
  const wtiMain  = document.getElementById('wti-price-main');
  const brentMain = document.getElementById('brent-price-main');
  const chgMain  = document.getElementById('price-change-main');
  if (wtiMain)   wtiMain.textContent   = data.wti   || '—';
  if (brentMain) brentMain.textContent = data.brent || '—';
  if (chgMain) {
    chgMain.textContent = data.change || '';
    chgMain.classList.remove('up', 'down');
    if (dir === 'up')   chgMain.classList.add('up');
    if (dir === 'down') chgMain.classList.add('down');
  }

  // Headline
  document.getElementById('price-headline').textContent = data.headline || '';

  // Oracle proclamation
  const oracleBody = document.getElementById('oracle-body');
  const procDiv = document.createElement('div');
  procDiv.className   = 'oracle-proclamation';
  procDiv.textContent = data.proclamation || '';
  oracleBody.innerHTML = '';
  oracleBody.appendChild(procDiv);

  // Action / bottom line
  document.getElementById('action-text').textContent = data.action || '—';

  // Mood
  const moodEl = document.getElementById('mood-value');
  moodEl.textContent = data.mood || '—';
  moodEl.className   = 'mood-value';
  if (data.mood === 'BULLISH') moodEl.classList.add('bullish');
  if (data.mood === 'BEARISH') moodEl.classList.add('bearish');
  if (data.mood === 'CHAOTIC') moodEl.classList.add('chaotic');

  // Indicators
  const indList = document.getElementById('indicators-list');
  if (Array.isArray(data.indicators)) {
    indList.innerHTML = data.indicators.map(ind => {
      const sc = ['good', 'bad', 'neutral'].includes(ind.status) ? ind.status : 'neutral';
      return `<div class="indicator-row">
        <span class="ind-label">${escapeHtml(ind.label)}</span>
        <span class="ind-value ${sc}">${escapeHtml(ind.value)}</span>
      </div>`;
    }).join('');
  }

  // Disclaimer
  document.getElementById('disclaimer-text').textContent = data.disclaimer || '';

  // Breaking ticker
  const arrow = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '—';
  document.getElementById('ticker-content').textContent =
    `WTI ${data.wti} ${arrow}  ·  BRENT ${data.brent}  ·  ${data.change}  ·  ORACLE: ${data.mood}  ·  ${data.headline}`;

  // Article timestamp
  const ts = document.getElementById('article-time');
  if (ts) ts.textContent = `Last updated: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  // Nav status
  const statusEl = document.getElementById('th-status');
  statusEl.textContent = '● LIVE';
  statusEl.removeAttribute('data-status');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Error display ────────────────────────────────────────────

function showError(msg) {
  const toast = document.getElementById('error-toast');
  document.getElementById('error-msg').textContent = msg;
  toast.style.display = 'flex';
  // Auto-dismiss after 8 seconds
  setTimeout(() => { toast.style.display = 'none'; }, 8000);
}

// ── Main consult flow ────────────────────────────────────────

async function consult() {
  const apiKey = sessionStorage.getItem('bga_key');
  if (!apiKey) return;

  // Show loading overlay
  document.getElementById('loading-overlay').style.display = 'flex';
  document.getElementById('loading-text').textContent = 'CONSULTING THE ORACLE...';
  document.getElementById('loading-sub').textContent  = 'Searching global oil markets...';

  const btn = document.getElementById('btn-consult');
  btn.disabled = true;
  btn.classList.add('loading');

  const statusEl = document.getElementById('th-status');
  statusEl.textContent = '● CONSULTING';
  statusEl.dataset.status = 'consulting';

  // Cycle loading sub-messages
  const loadingMessages = [
    'Fetching live crude oil prices...',
    'Analyzing global energy markets...',
    'Processing geopolitical indicators...',
    'Cross-referencing Mercury retrograde schedule...',
    'Consulting Rig Betsy...',
    'Generating oracle intelligence report...',
  ];
  let msgIdx = 0;
  const msgInterval = setInterval(() => {
    msgIdx = (msgIdx + 1) % loadingMessages.length;
    document.getElementById('loading-sub').textContent = loadingMessages[msgIdx];
  }, 2000);

  try {
    const raw  = await callOracle(apiKey);
    const data = parseOracle(raw);
    renderReading(data);
    statusEl.textContent = '● LIVE';
    statusEl.removeAttribute('data-status');
  } catch (e) {
    showError(e.message);
    statusEl.textContent = '● ERROR';
    statusEl.dataset.status = 'error';
  } finally {
    clearInterval(msgInterval);
    document.getElementById('loading-overlay').style.display = 'none';
    btn.disabled = false;
    btn.classList.remove('loading');
  }
}

// ── Clock ────────────────────────────────────────────────────

function startClock() {
  function tick() {
    const now = new Date();
    const hh  = String(now.getHours()).padStart(2, '0');
    const mm  = String(now.getMinutes()).padStart(2, '0');
    const ss  = String(now.getSeconds()).padStart(2, '0');
    const el  = document.getElementById('th-time');
    if (el) el.textContent = `${hh}:${mm}:${ss}`;
  }
  tick();
  setInterval(tick, 1000);
}

// ── Key management ───────────────────────────────────────────

function showApp() {
  document.getElementById('key-overlay').style.display = 'none';
  document.getElementById('app').style.display = 'block';
}

function showKeyOverlay() {
  document.getElementById('key-overlay').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}

// ── Boot ─────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  startClock();

  // If key already in session, go straight to app and auto-consult
  const savedKey = sessionStorage.getItem('bga_key');
  if (savedKey) {
    showApp();
    consult();
  }

  // Key submit button
  document.getElementById('key-submit').addEventListener('click', () => {
    const input = document.getElementById('api-key-input');
    const key   = input.value.trim();
    if (!key.startsWith('sk-ant-')) {
      showError('Invalid key format. Anthropic API keys start with sk-ant-');
      return;
    }
    sessionStorage.setItem('bga_key', key);
    input.value = '';
    showApp();
    consult();
  });

  // Enter key in input triggers submit
  document.getElementById('api-key-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('key-submit').click();
  });

  // Consult button
  document.getElementById('btn-consult').addEventListener('click', consult);

  // Change key button
  document.getElementById('btn-change-key').addEventListener('click', () => {
    sessionStorage.removeItem('bga_key');
    showKeyOverlay();
  });
});
