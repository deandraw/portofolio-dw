/* ============================================================
   PORTFOLIO ASSISTANT — AI BACKEND (Vercel Serverless Function)
   Optional: only used if ANTHROPIC_API_KEY is configured in the
   Vercel project's environment variables. If it's not set, or
   this function isn't reachable, the frontend automatically
   falls back to the local demo engine (chatbot-engine.js).

   Endpoint: POST /api/chat
   Body:     { message: string, history: [{role, text}] }
   Response: { reply: string, action: null | { type, anchorId, projectId, label } }
   ============================================================ */

const fs = require('fs');
const path = require('path');

let portfolioData = null;
function loadPortfolioData() {
  if (portfolioData) return portfolioData;
  const filePath = path.join(process.cwd(), 'data', 'portfolio.json');
  portfolioData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return portfolioData;
}

function buildSystemPrompt(data) {
  return `You are "Portfolio Assistant", a friendly, professional, concise virtual assistant embedded on ${data.name}'s portfolio website.

Your job is to help visitors learn about ${data.name}: his skills, tools, projects, experience, and the services he can help build. Answer ONLY using the portfolio data provided below. Never invent skills, projects, experience, or facts that are not in this data.

Reply in the same language the visitor used (English or Bahasa Indonesia). Keep answers short, natural, and informative — a few sentences at most.

If a visitor describes a need (e.g. "I need an online store"), recommend the most relevant project or skill from the data below, and briefly explain why it fits.

If a question is unrelated to ${data.name}'s portfolio, politely redirect the visitor back to what you can help with (his skills, projects, technologies, and web development capabilities).

When you recommend a specific project that has an "anchorId", include this exact JSON on its own final line (nothing else on that line):
ACTION::{"type":"viewProject","anchorId":"<anchorId>","projectId":"<id>","label":"View Project"}
If that project has a "github" field, also add "github":"<github url>" inside the ACTION JSON. Only include this ACTION line when recommending a specific project with a non-null anchorId. Omit it otherwise.

PORTFOLIO DATA:
${JSON.stringify(data, null, 2)}`;
}

function parseAction(text) {
  const match = text.match(/ACTION::(\{.*\})\s*$/);
  if (!match) return { reply: text.trim(), action: null };
  try {
    const action = JSON.parse(match[1]);
    const reply = text.slice(0, match.index).trim();
    return { reply, action };
  } catch (e) {
    return { reply: text.trim(), action: null };
  }
}

const MAX_MESSAGE = 500;   // characters accepted from the visitor
const MAX_HISTORY = 8;     // previous turns sent to the model
const MAX_HISTORY_ITEM = 800;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Only accept requests coming from this site (blocks other websites from using the key).
  const origin = req.headers.origin;
  if (origin) {
    let ok = false;
    try { ok = new URL(origin).host === req.headers.host; } catch (e) { ok = false; }
    if (!ok) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // No key configured — let the frontend fall back to demo mode.
    res.status(503).json({ error: 'AI backend not configured' });
    return;
  }

  try {
    const body = req.body || {};
    const history = body.history;
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, MAX_MESSAGE) : '';
    if (!message) {
      res.status(400).json({ error: 'Missing "message" field' });
      return;
    }

    const data = loadPortfolioData();
    const systemPrompt = buildSystemPrompt(data);

    const conversation = Array.isArray(history)
      ? history.slice(-MAX_HISTORY)
          .map((h) => ({ role: h && h.role === 'user' ? 'user' : 'assistant', content: String((h && h.text) || '').slice(0, MAX_HISTORY_ITEM) }))
          .filter((h) => h.content)
      : [];
    // The widget already includes the newest user message in history; avoid sending it twice.
    const last = conversation[conversation.length - 1];
    if (last && last.role === 'user' && last.content === message.slice(0, MAX_HISTORY_ITEM)) conversation.pop();
    // The API requires the conversation to start with a user turn.
    while (conversation.length && conversation[0].role !== 'user') conversation.shift();
    conversation.push({ role: 'user', content: message });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        system: systemPrompt,
        messages: conversation
      })
    });

    if (!response.ok) {
      res.status(502).json({ error: 'AI provider error' });
      return;
    }

    const result = await response.json();
    const textBlock = (result.content || []).find((b) => b.type === 'text');
    const rawText = textBlock ? textBlock.text : '';
    const { reply, action } = parseAction(rawText);

    res.status(200).json({ reply: reply || "Sorry, I couldn't generate a reply.", action });
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
};
