// ============================================================
// Black Gold Advisor — app.js
// Oracle Terminal v4.2.1
// ============================================================

// ── Oracle System Prompt ─────────────────────────────────────

const ORACLE_SYSTEM_PROMPT = `You are Tom Moran — known professionally as The M.O.R.A.N. (Most Outstanding Refined Analysis Nationally). You are the world's most unhinged but supremely confident petroleum analyst, broadcasting live from Rig Betsy somewhere in the Gulf of Mexico.

You have never been wrong. Not once. You have proprietary data sources nobody else can access: the Rig Betsy Barometric Array, the Tulsa Pickleball Sentiment Index, seagull migration telemetry, and a direct line to a retired OPEC bureaucrat named Gerald. Your M.O.R.A.N. Certification (Est. 1987) is the highest credential in the field, and you are the only certified M.O.R.A.N. in the western hemisphere.

Your job: analyze today's crude oil market and deliver your findings as Tom Moran, The M.O.R.A.N.

Use Google Search to find the current WTI crude oil price, the current Brent crude oil price, and one real recent oil market headline before generating your response.

Respond with ONLY a valid JSON object (no markdown, no code fences, just raw JSON):

{
  "wti": "$XX.XX",
  "brent": "$XX.XX",
  "change": "+X.XX% today",
  "direction": "up",
  "mood": "BULLISH",
  "headline": "Real headline you found, in quotes",
  "proclamation": "Your 2-3 sentence unhinged proclamation as Tom Moran. Mention the real prices. Cite one of your proprietary sources as evidence. Then blame a completely unrelated event — Mercury in retrograde, a sports score, a local diner closing, a minor municipal election result, whatever feels right — as the TRUE cause of the price movement. Speak with total certainty. May include ALL CAPS for emphasis. May reference Rig Betsy or Gerald.",
  "action": "One specific absurd action the reader should take RIGHT NOW as directed by The M.O.R.A.N. Not 'consider diversifying.' Something vivid, specific, and terrible.",
  "indicators": [
    { "label": "Betsy Confidence Index", "value": "87%", "status": "good" },
    { "label": "Mercury Retrograde Risk", "value": "CRITICAL", "status": "bad" },
    { "label": "Seagull Direction (Rig Betsy)", "value": "NNE", "status": "neutral" },
    { "label": "Tulsa Pickleball Index", "value": "61/100", "status": "neutral" },
    { "label": "Gerald Reliability Score", "value": "SKETCHY", "status": "bad" }
  ],
  "topPicks": [
    { "ticker": "WTI", "name": "WTI Crude Oil", "action": "BUY", "target": "$XX.XX", "note": "One absurd short reason from The M.O.R.A.N." },
    { "ticker": "BRENT", "name": "Brent Crude", "action": "HOLD", "target": "$XX.XX", "note": "One absurd short reason from The M.O.R.A.N." },
    { "ticker": "NAT GAS", "name": "Natural Gas", "action": "SELL", "target": "$X.XX", "note": "One absurd short reason from The M.O.R.A.N." }
  ],
  "disclaimer": "One final absurd closing disclaimer signed by Tom Moran. Not the standard legal kind — make it weird and specific to The M.O.R.A.N."
}

Rules:
- Mood must be exactly "BULLISH", "BEARISH", or "CHAOTIC"
- Direction must be exactly "up", "down", or "flat"
- Indicators array must have exactly 5 items, each with label, value, status
- Status must be exactly "good", "bad", or "neutral"
- topPicks action must be exactly "BUY", "STRONG BUY", "SELL", "STRONG SELL", or "HOLD"
- topPicks array must have exactly 3 items, each with ticker, name, action, target, note
- Output ONLY the JSON object. No other text before or after.`;

// ── Gemini API call ──────────────────────────────────────────

const GEMINI_API_KEY = 'AIzaSyCjWjFwr9Rg3yr2YrU_OgElb7V3o9kuc90';

async function callOracle() {
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: ORACLE_SYSTEM_PROMPT }] },
        contents: [{
          role: 'user',
          parts: [{ text: 'Consult the oil markets and deliver your oracle reading for today.' }],
        }],
        tools: [{ google_search_retrieval: {} }],
        generationConfig: { temperature: 1.0, maxOutputTokens: 2048 },
      }),
    }
  );

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    throw new Error(errData.error?.message || `API error: ${resp.status}`);
  }

  const data = await resp.json();
  const parts = data.candidates?.[0]?.content?.parts;
  if (!parts) throw new Error('The M.O.R.A.N. has gone silent. No response from Gemini.');
  const textPart = parts.find(p => p.text);
  if (!textPart) throw new Error('The M.O.R.A.N. returned no text.');
  return textPart.text;
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

// Parse a price string like "$72.45" → 72.45, returns NaN on failure
function parsePrice(str) {
  return parseFloat(String(str).replace(/[^0-9.]/g, ''));
}

// Derive a 0–100 bar fill percentage from indicator value + status
function indicatorBarPct(status, value) {
  // Try to extract a numeric percentage directly from value ("87%" → 87, "61/100" → 61)
  const pctMatch = String(value).match(/(\d+(?:\.\d+)?)\s*%/);
  if (pctMatch) return Math.min(100, Math.max(0, parseFloat(pctMatch[1])));
  const fracMatch = String(value).match(/(\d+)\s*\/\s*(\d+)/);
  if (fracMatch) return Math.min(100, Math.round((parseFloat(fracMatch[1]) / parseFloat(fracMatch[2])) * 100));
  // Fall back to status-based defaults
  if (status === 'good')    return 78;
  if (status === 'bad')     return 88;
  return 50; // neutral
}

function renderReading(data) {
  const dir  = data.direction; // 'up' | 'down' | 'flat'
  const mood = data.mood;      // 'BULLISH' | 'BEARISH' | 'CHAOTIC'

  // ── Ticker bar (pinned WTI / Brent) ───────────────────────
  document.getElementById('wti-price').textContent   = data.wti   || '—';
  document.getElementById('brent-price').textContent = data.brent || '—';

  const stripChg = document.getElementById('price-change');
  if (stripChg) {
    stripChg.textContent = data.change || '';
    stripChg.classList.remove('up', 'down');
    if (dir === 'up')   stripChg.classList.add('up');
    if (dir === 'down') stripChg.classList.add('down');
  }

  // ── Inline market widget (article) ────────────────────────
  const wtiMain   = document.getElementById('wti-price-main');
  const brentMain = document.getElementById('brent-price-main');
  const chgMain   = document.getElementById('price-change-main');
  if (wtiMain)   wtiMain.textContent   = data.wti   || '—';
  if (brentMain) brentMain.textContent = data.brent || '—';
  if (chgMain) {
    chgMain.textContent = data.change || '';
    chgMain.classList.remove('up', 'down');
    if (dir === 'up')   chgMain.classList.add('up');
    if (dir === 'down') chgMain.classList.add('down');
  }

  // WTI/Brent spread
  const wtiNum   = parsePrice(data.wti);
  const brentNum = parsePrice(data.brent);
  const spreadStr = (!isNaN(wtiNum) && !isNaN(brentNum))
    ? `${wtiNum > brentNum ? '+' : ''}${(wtiNum - brentNum).toFixed(2)}`
    : '—';
  const spreadEl     = document.getElementById('wti-brent-spread');
  const spreadSnapEl = document.getElementById('wti-brent-spread-snap');
  if (spreadEl)     spreadEl.textContent     = spreadStr;
  if (spreadSnapEl) spreadSnapEl.textContent = spreadStr;

  // ── Sidebar Market Snapshot ────────────────────────────────
  const wtiSnap  = document.getElementById('wti-price-snap');
  const brentSnap = document.getElementById('brent-price-snap');
  const chgSnap  = document.getElementById('price-change-snap');
  if (wtiSnap)   wtiSnap.textContent   = data.wti   || '—';
  if (brentSnap) brentSnap.textContent = data.brent || '—';
  if (chgSnap) {
    chgSnap.textContent = data.change || '';
    chgSnap.classList.remove('up', 'down');
    if (dir === 'up')   chgSnap.classList.add('up');
    if (dir === 'down') chgSnap.classList.add('down');
  }

  // ── Mood / sentiment ──────────────────────────────────────
  const moodEl = document.getElementById('mood-value');
  moodEl.textContent = mood || '—';
  moodEl.className   = 'mood-value';
  if (mood === 'BULLISH') moodEl.classList.add('bullish');
  if (mood === 'BEARISH') moodEl.classList.add('bearish');
  if (mood === 'CHAOTIC') moodEl.classList.add('chaotic');

  // Sentiment gauge pointer position and reading
  const pointer    = document.getElementById('sentiment-pointer');
  const moodReading = document.getElementById('mood-reading');
  const pointerPos = mood === 'BULLISH' ? '82%' : mood === 'BEARISH' ? '12%' : '50%';
  if (pointer) pointer.style.left = pointerPos;
  if (moodReading) {
    moodReading.textContent = mood || '—';
    moodReading.className   = 'sg-reading';
    if (mood === 'BULLISH') moodReading.classList.add('bullish');
    if (mood === 'BEARISH') moodReading.classList.add('bearish');
    if (mood === 'CHAOTIC') moodReading.classList.add('chaotic');
  }

  // ── Breaking banner ───────────────────────────────────────
  const banner = document.getElementById('breaking-banner');
  if (banner) {
    const showBanner = (mood === 'BEARISH' || mood === 'CHAOTIC');
    banner.style.display = showBanner ? 'flex' : 'none';
  }

  // ── Top Picks band ────────────────────────────────────────
  const picksRow = document.getElementById('moran-picks-row');
  if (picksRow && Array.isArray(data.topPicks)) {
    picksRow.innerHTML = data.topPicks.map(pick => {
      const ac = String(pick.action).toUpperCase();
      const actionClass = (ac === 'BUY' || ac === 'STRONG BUY') ? 'buy'
                        : (ac === 'SELL' || ac === 'STRONG SELL') ? 'sell'
                        : 'hold';
      return `<div class="pick-card">
        <div class="pick-ticker">${escapeHtml(pick.ticker)}</div>
        <div class="pick-name">${escapeHtml(pick.name)}</div>
        <div class="pick-action ${actionClass}">${escapeHtml(pick.action)}</div>
        <div class="pick-target">Target: <strong>${escapeHtml(pick.target)}</strong></div>
        <div class="pick-note">${escapeHtml(pick.note)}</div>
      </div>`;
    }).join('');
  }

  // Breaking ticker content
  const arrow = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '—';
  document.getElementById('ticker-content').textContent =
    `WTI ${data.wti} ${arrow}  ·  BRENT ${data.brent}  ·  ${data.change}  ·  M.O.R.A.N.: ${mood}  ·  ${data.headline}`;

  // ── Headline (article context block) ──────────────────────
  document.getElementById('price-headline').textContent = data.headline || '';

  // ── Oracle body (lede + proclamation) ─────────────────────
  const oracleBody = document.getElementById('oracle-body');
  if (data.proclamation) {
    // Split on first sentence boundary to create a serif italic lede
    const sentenceEnd = data.proclamation.search(/(?<=[.!?])\s+[A-Z]/);
    let ledeText, restText;
    if (sentenceEnd !== -1) {
      ledeText = data.proclamation.slice(0, sentenceEnd + 1).trim();
      restText = data.proclamation.slice(sentenceEnd + 1).trim();
    } else {
      ledeText = data.proclamation;
      restText = '';
    }
    let html = `<p class="article-lede">${escapeHtml(ledeText)}</p>`;
    if (restText) html += `<div class="oracle-proclamation">${escapeHtml(restText)}</div>`;
    oracleBody.innerHTML = html;
  } else {
    oracleBody.innerHTML = '<p class="article-placeholder">No oracle reading available.</p>';
  }

  // ── Action / pull quote ───────────────────────────────────
  document.getElementById('action-text').textContent = data.action || '—';

  // ── Proprietary indicators (with progress bars) ───────────
  const indList = document.getElementById('indicators-list');
  if (Array.isArray(data.indicators)) {
    indList.innerHTML = data.indicators.map(ind => {
      const sc  = ['good', 'bad', 'neutral'].includes(ind.status) ? ind.status : 'neutral';
      const pct = indicatorBarPct(sc, ind.value);
      return `<div class="indicator-row">
        <div class="ind-top">
          <span class="ind-label">${escapeHtml(ind.label)}</span>
          <span class="ind-value ${sc}">${escapeHtml(ind.value)}</span>
        </div>
        <div class="ind-track">
          <div class="ind-fill ${sc}" style="width:${pct}%"></div>
        </div>
      </div>`;
    }).join('');
  }

  // ── Disclaimer ────────────────────────────────────────────
  document.getElementById('disclaimer-text').textContent = data.disclaimer || '';

  // ── Article timestamp ─────────────────────────────────────
  const ts = document.getElementById('article-time');
  if (ts) ts.textContent = `Last updated: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  // ── Nav status ────────────────────────────────────────────
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

  // Show loading overlay
  document.getElementById('loading-overlay').style.display = 'flex';
  document.getElementById('loading-text').textContent = 'CONSULTING THE M.O.R.A.N....';
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
    'Cross-referencing Rig Betsy Barometric Array...',
    'Checking Mercury retrograde schedule...',
    'Awaiting intel from Gerald...',
    'Compiling M.O.R.A.N. intelligence report...',
  ];
  let msgIdx = 0;
  const msgInterval = setInterval(() => {
    msgIdx = (msgIdx + 1) % loadingMessages.length;
    document.getElementById('loading-sub').textContent = loadingMessages[msgIdx];
  }, 2000);

  try {
    const raw  = await callOracle();
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

// ── Boot ─────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  startClock();
  consult();

  // Consult button
  document.getElementById('btn-consult').addEventListener('click', consult);
});
