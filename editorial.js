/* Editorial motion layer: loader, profile, cursor labels, data-driven projects. */
(() => {
  'use strict';
  const D = document, $ = (s, r = D) => r.querySelector(s), $$ = (s, r = D) => [...r.querySelectorAll(s)];
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const wide = () => innerWidth >= 1024;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* Loader: logo -> name -> curtain -> hero (main.js reads __edHeroDelay) */
  const ld = $('#loader');
  let seen = false;
  try { seen = sessionStorage.getItem('dw-ld') === '1'; } catch (e) {}
  if (ld && !seen && !rm) {
    window.__edHeroDelay = 2300;
    D.documentElement.style.overflow = 'hidden';
    setTimeout(() => {
      ld.classList.add('out');
      D.documentElement.style.overflow = '';
      try { sessionStorage.setItem('dw-ld', '1'); } catch (e) {}
    }, 2300);
    setTimeout(() => ld.remove(), 3500);
  } else if (ld) ld.remove();

  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.25 });

  /* Cursor label (desktop, fine pointer only) */
  const cf = $('#cursorFollower'), cd = $('#cursor');
  if (cf && cd && fine) {
    D.addEventListener('mouseover', (e) => {
      const t = e.target.closest && e.target.closest('[data-cursor]');
      if (t) { cf.setAttribute('data-label', t.dataset.cursor.replace('|', '\n')); cf.classList.add('label'); cd.classList.add('label'); }
      else { cf.classList.remove('label'); cd.classList.remove('label'); }
    });
  }

  /* Profile */
  const pf = $('#profile');
  if (pf) {
    io.observe(pf);
    const par = $('.pf-par', pf), med = $('.pf-media', pf), tilt = $('.pf-tilt', pf), fl = $$('.pf-float', pf), rs = $$('.pf-roles span', pf);
    let ri = 0;
    if (!rm && rs.length > 1) {
      setInterval(() => {
        const o = rs[ri];
        o.classList.remove('on'); o.classList.add('off');
        setTimeout(() => o.classList.remove('off'), 1100);
        ri = (ri + 1) % rs.length;
        rs[ri].classList.add('on');
      }, 3400);
    }
    let tk = 0;
    const upd = () => {
      tk = 0;
      const r = pf.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight || rm) return;
      const p = clamp((r.top + r.height / 2 - innerHeight / 2) / innerHeight, -1, 1), amp = wide() ? 15 : 6;
      par.style.transform = `translate3d(0,${(-p * amp).toFixed(1)}px,0)`;
      if (wide()) fl.forEach((f, i) => f.style.setProperty('--fy', (p * (i % 2 ? -1 : 1) * (18 + i * 8)).toFixed(1) + 'px'));
    };
    addEventListener('scroll', () => { if (!tk) tk = requestAnimationFrame(upd); }, { passive: true });
    upd();
    if (fine && wide() && !rm) {
      med.addEventListener('mousemove', (e) => {
        const b = med.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - 0.5, y = (e.clientY - b.top) / b.height - 0.5;
        tilt.style.transform = `perspective(1000px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) scale(1.03)`;
      });
      med.addEventListener('mouseleave', () => { tilt.style.transform = ''; });
    }
    if (!fine) med.addEventListener('click', () => med.classList.toggle('col'));
  }

  /* Projects: rendered from data/portfolio.json (same source as the AI assistant) */
  const sec = $('#projects');
  if (!sec) return;
  fetch('data/portfolio.json').then((r) => r.json()).then(build).catch(() => {});

  function build(d) {
    const box = $('.container', sec), grid = box && $('.projects-grid', box);
    if (!grid || !d.projects || !d.projects.length) return;
    const ps = d.projects, t = (k) => (k && (k.en || k)) || '';
    const card = (p, i) => {
      const href = p.url || p.github, name = (p.family || p.name).toUpperCase().split(' ');
      const h = p.family ? esc(name.slice(0, -1).join(' ')) + '<br>' + esc(name.slice(-1)[0]) : esc(name.join(' '));
      const kin = p.family ? ps.filter((q) => q.family === p.family) : [];
      const media = p.image
        ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">`
        : `<span class="pj-ph" aria-hidden="true">${esc(p.name.split(' ').filter((w) => /^[A-Za-z]/.test(w)).map((w) => w[0]).join('').slice(0, 3).toUpperCase())}</span>`;
      const feat = p.featured && p.features ? `<ul class="pj-feat">${p.features.en.slice(0, 8).map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : '';
      const rel = kin.length > 1 ? `<p class="pj-rel">${kin.map((q) => `<span class="${q === p ? 'cur' : ''}">${esc(q.version)} ${esc(t(q.versionNote))}</span>`).join('')}</p>` : '';
      const acts = (href ? `<a class="pj-btn solid" href="${esc(href)}" target="_blank" rel="noopener">View project</a>` : '') +
        (p.github ? `<a class="pj-btn" href="${esc(p.github)}" target="_blank" rel="noopener">GitHub</a>` : '');
      return `<article class="pj${p.featured ? ' pj-ft' : ''}" id="${esc(p.anchorId || p.id)}"${href ? ' data-cursor="VIEW|PROJECT"' : ''}>
        <div class="pj-media"${p.image ? ` data-zoom="${esc(p.image)}" data-cap="${esc(p.name)}" data-cursor="ZOOM" role="button" tabindex="0" aria-label="Zoom image: ${esc(p.name)}"` : ''}>${media}</div>
        <div class="pj-info"><p class="pj-idx">Project ${String(i + 1).padStart(2, '0')}${p.version ? ' / ' + esc(p.version) : ''}${p.badge ? ' / ' + esc(t(p.badge)) : ''}</p>
        <h3 class="pj-title">${h}</h3><p class="pj-cat">${esc(t(p.category))}</p><p class="pj-desc">${esc(t(p.description))}</p>${feat}
        <ul class="pj-tags">${p.tags.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>${rel}<div class="pj-act">${acts}</div></div></article>`;
    };
    const stick = D.createElement('div'); stick.className = 'p-stick';
    box.before(stick); stick.appendChild(box);
    const vp = D.createElement('div'); vp.className = 'p-viewport';
    vp.innerHTML = `<div class="p-track">${ps.map(card).join('')}</div>`;
    grid.replaceWith(vp);
    const pr = D.createElement('div'); pr.className = 'p-prog'; pr.innerHTML = '<i></i>'; stick.appendChild(pr);
    const tr = $('.p-track', vp), bar = $('i', pr);
    $$('.pj', tr).forEach((c) => io.observe(c));

    let hs = false, dist = 0, tk = 0;
    const setup = () => {
      hs = wide() && !rm;
      sec.classList.toggle('hs', hs);
      tr.style.transform = '';
      if (!hs) { sec.style.height = ''; return; }
      dist = Math.max(0, tr.offsetWidth - innerWidth);
      sec.style.height = (dist + innerHeight) + 'px';
    };
    const run = () => {
      tk = 0;
      if (!hs) return;
      const p = clamp(-sec.getBoundingClientRect().top / Math.max(1, dist), 0, 1);
      tr.style.transform = `translate3d(${(-p * dist).toFixed(1)}px,0,0)`;
      bar.style.width = (p * 100).toFixed(1) + '%';
    };
    addEventListener('scroll', () => { if (!tk) tk = requestAnimationFrame(run); }, { passive: true });
    addEventListener('resize', () => { setup(); run(); });
    setup(); run();

    /* The AI assistant calls this to jump to a project card (also works while pinned) */
    window.__edGo = (id) => {
      const el = D.getElementById(id);
      if (!el || !el.classList.contains('pj')) return false;
      if (hs) scrollTo({ top: sec.offsetTop + clamp((el.offsetLeft - innerWidth * 0.08) / Math.max(1, dist), 0, 1) * dist, behavior: 'smooth' });
      else el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('pa-highlight-target');
      setTimeout(() => el.classList.remove('pa-highlight-target'), 1900);
      return true;
    };
  }
})();


/* Lightbox: zoom and pan for project and certificate images */
(() => {
  const D = document, clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  let lb, img, capEl, zl, list = [], idx = 0, cap = '', s = 1, x = 0, y = 0, opener = null, moved = false;
  const pts = new Map(); let pd = 0;
  const open$ = () => lb && !lb.hidden;
  const apply = () => {
    const mx = Math.max(0, (img.offsetWidth * s - innerWidth) / 2 + 80), my = Math.max(0, (img.offsetHeight * s - innerHeight) / 2 + 80);
    x = clamp(x, -mx, mx); y = clamp(y, -my, my);
    img.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
    zl.textContent = Math.round(s * 100) + '%';
    img.dataset.cursor = s > 1 ? 'ZOOM|OUT' : 'ZOOM|IN';
  };
  const zoom = (ns, cx = 0, cy = 0) => {
    ns = clamp(ns, 1, 6);
    x = cx - (cx - x) * ns / s; y = cy - (cy - y) * ns / s; s = ns;
    if (s === 1) { x = 0; y = 0; }
    apply();
  };
  const show = (i) => {
    idx = (i + list.length) % list.length;
    s = 1; x = 0; y = 0;
    img.src = list[idx]; img.alt = cap;
    capEl.textContent = cap + (list.length > 1 ? `  ${idx + 1} / ${list.length}` : '');
    lb.classList.toggle('multi', list.length > 1);
    apply();
  };
  const close = () => {
    lb.classList.remove('on');
    D.documentElement.style.overflow = '';
    setTimeout(() => { lb.hidden = true; img.removeAttribute('src'); }, 280);
    if (opener && opener.focus) opener.focus();
  };
  const build = () => {
    lb = D.createElement('div');
    lb.className = 'lb'; lb.hidden = true;
    lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Image viewer');
    lb.innerHTML = '<div class="lb-stage"><img class="lb-img" alt="" draggable="false"></div><p class="lb-cap"></p><button class="lb-x" aria-label="Close">&times;</button><button class="lb-p" aria-label="Previous">&lsaquo;</button><button class="lb-n" aria-label="Next">&rsaquo;</button><div class="lb-bar"><button data-z="-" aria-label="Zoom out">&minus;</button><span class="lb-z">100%</span><button data-z="+" aria-label="Zoom in">+</button><button data-z="0">Reset</button></div>';
    D.body.appendChild(lb);
    img = lb.querySelector('.lb-img'); capEl = lb.querySelector('.lb-cap'); zl = lb.querySelector('.lb-z');
    const stage = lb.querySelector('.lb-stage'), cx = (e) => e.clientX - innerWidth / 2, cy = (e) => e.clientY - innerHeight / 2;
    lb.querySelector('.lb-x').onclick = close;
    lb.querySelector('.lb-p').onclick = () => show(idx - 1);
    lb.querySelector('.lb-n').onclick = () => show(idx + 1);
    lb.querySelector('.lb-bar').onclick = (e) => {
      const z = e.target.dataset.z;
      if (z === '+') zoom(s * 1.4); else if (z === '-') zoom(s / 1.4); else if (z === '0') zoom(1);
    };
    stage.addEventListener('wheel', (e) => { e.preventDefault(); zoom(s * (e.deltaY < 0 ? 1.15 : 1 / 1.15), cx(e), cy(e)); }, { passive: false });
    stage.addEventListener('pointerdown', (e) => {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = false;
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pd = Math.hypot(a.x - b.x, a.y - b.y); }
      img.classList.add('drag'); stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener('pointermove', (e) => {
      const p = pts.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      if (pts.size === 2) {
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const [a, b] = [...pts.values()], nd = Math.hypot(a.x - b.x, a.y - b.y);
        if (pd) zoom(s * nd / pd, (a.x + b.x) / 2 - innerWidth / 2, (a.y + b.y) / 2 - innerHeight / 2);
        pd = nd; moved = true; return;
      }
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      if (s > 1) { x += dx; y += dy; apply(); }
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    });
    const up = (e) => {
      pts.delete(e.pointerId); pd = 0;
      if (pts.size) return;
      img.classList.remove('drag');
      if (moved) return;
      if (e.target === img) zoom(s > 1 ? 1 : 2.5, cx(e), cy(e)); else close();
    };
    stage.addEventListener('pointerup', up);
    stage.addEventListener('pointercancel', (e) => { pts.delete(e.pointerId); img.classList.remove('drag'); });
  };
  const openLb = (urls, caption, from) => {
    if (!lb) build();
    list = urls; cap = caption; opener = from;
    lb.hidden = false; show(0);
    D.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(() => { lb.classList.add('on'); lb.querySelector('.lb-x').focus(); });
  };
  D.addEventListener('click', (e) => {
    const t = e.target.closest && e.target.closest('[data-zoom]');
    if (!t) return;
    e.preventDefault();
    openLb(t.dataset.zoom.split('|'), t.dataset.cap || '', t);
  });
  D.addEventListener('keydown', (e) => {
    if (!open$()) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-zoom][role=button]')) { e.preventDefault(); e.target.click(); }
      return;
    }
    const k = e.key;
    if (k === 'Escape') close();
    else if (k === 'ArrowRight') show(idx + 1);
    else if (k === 'ArrowLeft') show(idx - 1);
    else if (k === '+' || k === '=') zoom(s * 1.4);
    else if (k === '-') zoom(s / 1.4);
    else if (k === '0') zoom(1);
    else if (k !== 'Tab') return;
    if (k === 'Tab') { e.preventDefault(); lb.querySelector('.lb-x').focus(); }
    e.stopPropagation();
  }, true);
})();
