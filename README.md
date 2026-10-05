# Deandra Wahyudrian — Portfolio

Personal portfolio of Deandra Wahyudrian, Web Developer and Information Systems graduate (S.Kom) from Bandung, Indonesia.

Live: https://portofolio-dw.vercel.app

## What is inside

- Monochrome editorial design with scroll-driven motion, an animated profile section, and a pinned horizontal project showcase
- Project cards and the certificate list are built from `data/portfolio.json`; images open in a zoomable viewer
- Music section: a left/right cover slider with a Web Audio visualizer, synced lyrics, and bass-reactive vibration
- Portfolio Assistant: a chat widget that answers questions about the portfolio. It uses Claude through `api/chat.js` when an API key is set, and falls back to a built-in engine (`chatbot/chatbot-engine.js`) when it is not

## Tech

HTML, CSS, vanilla JavaScript, Three.js (hero background), Web Audio API, and a Vercel serverless function (Node.js).

## Run locally

Static site only (the assistant uses its built-in fallback):

```bash
python3 -m http.server 8000
```

With the AI backend:

```bash
npm i -g vercel
vercel dev
```

## Deploy

Import the repository in Vercel (framework preset: Other, no build command). To enable the Claude-powered assistant, add the environment variable `ANTHROPIC_API_KEY` in Project Settings, Environment Variables, then redeploy. See `.env.example`. Never commit the key.

The contact form (`api/contact.js`) emails messages to your inbox through [Resend](https://resend.com). Add `RESEND_API_KEY` (and optionally `CONTACT_TO_EMAIL`) the same way. On Resend's free plan without a verified domain, emails can only go to the address used to sign up.

## Featured project

Toko Sepeda Sentosa V1 — an operational information system for a bicycle shop: https://github.com/deandraw/toko-sepeda-sentosav1
