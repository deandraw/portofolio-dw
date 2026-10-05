/* ============================================================
   CONTACT FORM -> EMAIL (Vercel Serverless Function)
   Endpoint: POST /api/contact
   Body:     { name, email, message, website }   (website = honeypot)
   Sends the message to CONTACT_TO_EMAIL through the Resend API.

   Environment variables (Vercel > Settings > Environment Variables):
     RESEND_API_KEY     required
     CONTACT_TO_EMAIL   optional, defaults to the address below
     CONTACT_FROM       optional, defaults to Resend's test sender
   ============================================================ */

const TO = process.env.CONTACT_TO_EMAIL || 'deandrawahyudrian15@gmail.com';
const FROM = process.env.CONTACT_FROM || 'Portfolio <onboarding@resend.dev>';

// Best-effort rate limit per server instance: 3 messages per IP every 10 minutes.
const hits = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 3;
function limited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= MAX_HITS) { hits.set(ip, list); return true; }
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 500) hits.clear();
  return false;
}

const clean = (s, max) => String(s || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
const oneLine = (s) => s.replace(/[\r\n]+/g, ' ');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Only accept requests coming from this site.
  const origin = req.headers.origin;
  if (origin) {
    let ok = false;
    try { ok = new URL(origin).host === req.headers.host; } catch (e) { ok = false; }
    if (!ok) { res.status(403).json({ error: 'Forbidden' }); return; }
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'Email service not configured' });
    return;
  }

  try {
    const b = req.body || {};
    if (b.website) { res.status(200).json({ ok: true }); return; } // honeypot: bots fill hidden fields

    const name = oneLine(clean(b.name, 80));
    const email = oneLine(clean(b.email, 120));
    const message = clean(b.message, 2000);
    if (!name || message.length < 5 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Invalid input' });
      return;
    }

    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    if (limited(ip)) { res.status(429).json({ error: 'Too many requests' }); return; }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: email,
        subject: `New portfolio message from ${name}`.slice(0, 150),
        text: `Name: ${name}\nEmail: ${email}\n\n${message}\n`
      })
    });

    if (!response.ok) { res.status(502).json({ error: 'Email provider error' }); return; }
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
};
