/* ============================================================
   PORTFOLIO ASSISTANT — CHATBOT WIDGET (UI layer)
   Builds the floating button + chat window, and orchestrates:
     1) optional AI backend (/api/chat) when available
     2) local rule-based engine (chatbot-engine.js) as fallback
   Does not touch any existing site markup/logic.
   ============================================================ */

(function () {
  'use strict';

  const DATA_URL = 'data/portfolio.json';
  const API_URL = 'api/chat';

  // Small built-in fallback in case data/portfolio.json can't be fetched
  // (e.g. opened directly from the filesystem without a server).
  const FALLBACK_DATA = {
    name: 'Deandra Wahyudrian',
    role: { en: 'Web Developer & Information Systems Graduate', id: 'Web Developer & Lulusan Sarjana Sistem Informasi' },
    location: 'Majalaya, Kabupaten Bandung, Indonesia',
    bio: { en: 'Information Systems graduate focused on web development, UI/UX, and data.', id: 'Lulusan Sarjana Sistem Informasi yang fokus pada web development, UI/UX, dan data.' },
    skills: { hard: ['HTML', 'CSS', 'JavaScript', 'PHP', 'MySQL', 'Figma'], soft: ['Teamwork', 'Communication'] },
    tools: ['VS Code', 'XAMPP', 'Figma', 'GitHub'],
    projects: [],
    experience: [],
    services: { en: ['Web development', 'UI/UX design'], id: ['Web development', 'UI/UX design'] },
    contact: { email: 'deandrawahyudrian15@gmail.com', phone: '', linkedin: '', github: '' }
  };

  const QUICK_QUESTIONS = [
    { en: 'What are his skills?', id: 'Apa saja skill-nya?' },
    { en: 'Show me his projects', id: 'Lihat proyeknya' },
    { en: 'What can he build?', id: 'Apa yang bisa dia buat?' },
    { en: 'What certificates does he have?', id: 'Apa saja sertifikatnya?' },
    { en: 'How can I contact him?', id: 'Bagaimana cara menghubunginya?' }
  ];

  let portfolioData = null;
  let apiAvailable = null; // null = unknown, true/false once tested
  let messages = [];

  /* ---------- DOM building ---------- */
  function buildWidget() {
    const root = document.createElement('div');
    root.id = 'pa-root';
    root.innerHTML = `
      <div class="pa-window" role="dialog" aria-label="Portfolio Assistant chat">
        <div class="pa-header">
          <div class="pa-avatar"><i class="fa-solid fa-robot"></i></div>
          <div class="pa-header-text">
            <div class="pa-header-name">Portfolio Assistant</div>
            <div class="pa-header-status"><span class="pa-dot-online"></span> Online</div>
          </div>
          <button class="pa-close-btn" id="paCloseBtn" aria-label="Close chat"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="pa-messages" id="paMessages"></div>
        <div class="pa-quick-replies" id="paQuickReplies"></div>
        <div class="pa-input-area">
          <input type="text" class="pa-input" id="paInput" placeholder="Ask about skills, projects..." autocomplete="off" />
          <button class="pa-send-btn" id="paSendBtn" aria-label="Send message"><i class="fa-solid fa-paper-plane"></i></button>
        </div>
      </div>
      <button class="pa-toggle" id="paToggleBtn" aria-label="Open Portfolio Assistant">
        <i class="fa-solid fa-message pa-icon-open"></i>
        <i class="fa-solid fa-xmark pa-icon-close"></i>
        <span class="pa-ping" id="paPing"></span>
      </button>
    `;
    document.body.appendChild(root);
    return root;
  }

  /* ---------- cursor integration (matches site's custom cursor) ---------- */
  function bindCustomCursor(el) {
    const cursor = document.getElementById('cursor');
    const follower = document.getElementById('cursorFollower');
    if (!cursor || !follower) return;
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('hover');
      follower.classList.add('hover');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('hover');
      follower.classList.remove('hover');
    });
  }

  /* ---------- message rendering ---------- */
  function scrollToBottom(container) {
    container.scrollTop = container.scrollHeight;
  }

  function renderMessage(container, msg) {
    const row = document.createElement('div');
    row.className = 'pa-msg-row ' + (msg.role === 'user' ? 'pa-user' : 'pa-bot');

    const avatar = document.createElement('div');
    avatar.className = 'pa-msg-avatar';
    avatar.innerHTML = msg.role === 'user' ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-robot"></i>';

    const bubble = document.createElement('div');
    bubble.className = 'pa-bubble';
    bubble.innerHTML = formatText(msg.text);

    if (msg.action) {
      const btn = document.createElement('button');
      btn.className = 'pa-action-btn';
      btn.innerHTML = `<i class="fa-solid fa-arrow-up-right-from-square"></i> ${msg.action.label}`;
      btn.addEventListener('click', () => handleAction(msg.action));
      bindCustomCursor(btn);
      let extra = null;
      if (msg.action.github) {
        extra = document.createElement('button');
        extra.className = 'pa-action-btn';
        extra.innerHTML = '<i class="fa-brands fa-github"></i> ' + (msg.action.label === 'Lihat Proyek' ? 'Lihat GitHub' : 'View GitHub');
        extra.addEventListener('click', () => window.open(msg.action.github, '_blank', 'noopener'));
        bindCustomCursor(extra);
      }
      const wrap = document.createElement('div');
      wrap.appendChild(bubble);
      wrap.appendChild(document.createElement('br'));
      wrap.appendChild(btn);
      if (extra) wrap.appendChild(extra);
      row.appendChild(avatar);
      row.appendChild(wrap);
      container.appendChild(row);
      scrollToBottom(container);
      return;
    }

    row.appendChild(avatar);
    row.appendChild(bubble);
    container.appendChild(row);
    scrollToBottom(container);
  }

  function formatText(text) {
    // minimal, safe markdown: **bold** only
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  function showTyping(container) {
    const row = document.createElement('div');
    row.className = 'pa-msg-row pa-bot';
    row.id = 'paTypingRow';
    row.innerHTML = `
      <div class="pa-msg-avatar"><i class="fa-solid fa-robot"></i></div>
      <div class="pa-bubble pa-typing"><span></span><span></span><span></span></div>
    `;
    container.appendChild(row);
    scrollToBottom(container);
  }

  function hideTyping(container) {
    const row = container.querySelector('#paTypingRow');
    if (row) row.remove();
  }

  /* ---------- actions (scroll / highlight) ---------- */
  function handleAction(action) {
    if (!action) return;
    const targetId = action.anchorId;
    if (window.__edGo && window.__edGo(targetId)) return;
    const el = document.getElementById(targetId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('pa-highlight-target');
    setTimeout(() => el.classList.remove('pa-highlight-target'), 1900);
  }

  /* ---------- quick replies ---------- */
  function renderQuickReplies(container, lang) {
    container.innerHTML = '';
    QUICK_QUESTIONS.forEach((q) => {
      const btn = document.createElement('button');
      btn.className = 'pa-quick-btn';
      btn.textContent = lang === 'id' ? q.id : q.en;
      btn.addEventListener('click', () => sendMessage(btn.textContent));
      bindCustomCursor(btn);
      container.appendChild(btn);
    });
  }

  /* ---------- AI backend + fallback orchestration ---------- */
  async function getAIReply(userText) {
    if (apiAvailable === false) {
      return window.PortfolioAssistantEngine.getResponse(userText, portfolioData);
    }
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: messages.slice(-8).map((m) => ({ role: m.role, text: m.text }))
        })
      });
      if (!res.ok) throw new Error('API not available');
      const data = await res.json();
      apiAvailable = true;
      return { text: data.reply, action: data.action || null };
    } catch (err) {
      apiAvailable = false; // stop retrying the network for this session
      return window.PortfolioAssistantEngine.getResponse(userText, portfolioData);
    }
  }

  /* ---------- send flow ---------- */
  async function sendMessage(text) {
    const trimmed = (text || '').trim();
    if (!trimmed) return;

    const messagesEl = document.getElementById('paMessages');
    const quickRepliesEl = document.getElementById('paQuickReplies');
    const input = document.getElementById('paInput');
    const sendBtn = document.getElementById('paSendBtn');

    quickRepliesEl.innerHTML = '';
    messages.push({ role: 'user', text: trimmed });
    renderMessage(messagesEl, { role: 'user', text: trimmed });
    input.value = '';
    input.disabled = true;
    sendBtn.disabled = true;

    showTyping(messagesEl);

    let reply;
    try {
      reply = await getAIReply(trimmed);
    } catch (err) {
      reply = {
        text: "Sorry, something went wrong on my end. Please try again, or reach out directly via the Contact section.",
        action: null
      };
    }

    hideTyping(messagesEl);
    messages.push({ role: 'assistant', text: reply.text });
    renderMessage(messagesEl, { role: 'assistant', text: reply.text, action: reply.action });

    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
  }

  /* ---------- open / close ---------- */
  function toggleWindow(root) {
    const isOpen = root.classList.toggle('pa-open');
    const ping = document.getElementById('paPing');
    if (isOpen) {
      if (ping) ping.style.display = 'none';
      setTimeout(() => document.getElementById('paInput').focus(), 250);
    }
  }

  /* ---------- init ---------- */
  async function init() {
    const root = buildWidget();
    const toggleBtn = document.getElementById('paToggleBtn');
    const closeBtn = document.getElementById('paCloseBtn');
    const sendBtn = document.getElementById('paSendBtn');
    const input = document.getElementById('paInput');
    const messagesEl = document.getElementById('paMessages');
    const quickRepliesEl = document.getElementById('paQuickReplies');

    bindCustomCursor(toggleBtn);
    bindCustomCursor(closeBtn);
    bindCustomCursor(sendBtn);

    toggleBtn.addEventListener('click', () => toggleWindow(root));
    closeBtn.addEventListener('click', () => toggleWindow(root));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && root.classList.contains('pa-open')) {
        toggleWindow(root);
      }
    });

    sendBtn.addEventListener('click', () => sendMessage(input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendMessage(input.value);
    });

    // Load portfolio data (with graceful fallback)
    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error('data fetch failed');
      portfolioData = await res.json();
    } catch (err) {
      portfolioData = FALLBACK_DATA;
    }

    const browserLang = (navigator.language || 'en').startsWith('id') ? 'id' : 'en';
    const greetingEn = "Hi! 👋 I'm Deandra's AI Portfolio Assistant. You can ask me about his skills, projects, experience, or what he can build.";
    const greetingId = "Hai! 👋 Aku AI Portfolio Assistant milik Deandra. Kamu bisa tanya soal skill, proyek, pengalaman, atau apa yang bisa dia buat.";

    renderMessage(messagesEl, { role: 'assistant', text: browserLang === 'id' ? greetingId : greetingEn });
    renderQuickReplies(quickRepliesEl, browserLang);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
