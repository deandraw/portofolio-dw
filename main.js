/* ============================================================
   DEANDRA WAHYUDRIAN – PORTFOLIO JAVASCRIPT
   Three.js hero background + scroll reveals + interactions
   ============================================================ */

'use strict';

// ── Custom Cursor ──────────────────────────────────────────
const cursor = document.getElementById('cursor');
const cursorFollower = document.getElementById('cursorFollower');
let mouseX = 0, mouseY = 0;
let followerX = 0, followerY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
});

function animateCursor() {
    followerX += (mouseX - followerX) * 0.12;
    followerY += (mouseY - followerY) * 0.12;
    cursorFollower.style.left = followerX + 'px';
    cursorFollower.style.top = followerY + 'px';
    requestAnimationFrame(animateCursor);
}
animateCursor();

// Hover classes for interactive elements
const hoverTargets = document.querySelectorAll('a, button, .skill-card, .project-card');
hoverTargets.forEach(el => {
    el.addEventListener('mouseenter', () => {
        cursor.classList.add('hover');
        cursorFollower.classList.add('hover');
    });
    el.addEventListener('mouseleave', () => {
        cursor.classList.remove('hover');
        cursorFollower.classList.remove('hover');
    });
});

// ── Navbar ─────────────────────────────────────────────────
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
const navLinkItems = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    updateActiveNav();
});

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
});

// Close mobile menu on link click
navLinkItems.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
    });
});

// Active nav link based on scroll position
function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 120;
        if (window.scrollY >= sectionTop) {
            current = section.getAttribute('id');
        }
    });
    navLinkItems.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

// ── Three.js Hero Background ───────────────────────────────
(function initThreeJS() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, canvas.offsetWidth / canvas.offsetHeight, 0.1, 1000);
    camera.position.z = 5;

    // ── Particle system ──
    const PARTICLE_COUNT = 1800;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);

    const colorA = new THREE.Color('#d4d4d4'); // accent blue
    const colorB = new THREE.Color('#8c8c8c'); // accent purple
    const colorC = new THREE.Color('#ffffff'); // white

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 24;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 12;

        const t = Math.random();
        let col;
        if (t < 0.45) col = colorA;
        else if (t < 0.7) col = colorB;
        else col = colorC;

        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;

        sizes[i] = Math.random() * 2.5 + 0.8;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
        size: 0.04,
        vertexColors: true,
        transparent: true,
        opacity: 0.65,
        sizeAttenuation: true,
    });

    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    // ── Lines / connections ──
    const linePositions = [];
    const lineCount = 80;
    for (let i = 0; i < lineCount; i++) {
        const x1 = (Math.random() - 0.5) * 20;
        const y1 = (Math.random() - 0.5) * 12;
        const z1 = (Math.random() - 0.5) * 8;
        const x2 = x1 + (Math.random() - 0.5) * 3;
        const y2 = y1 + (Math.random() - 0.5) * 3;
        const z2 = z1 + (Math.random() - 0.5) * 2;
        linePositions.push(x1, y1, z1, x2, y2, z2);
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.12, transparent: true });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // ── Mouse parallax ──
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;

    document.addEventListener('mousemove', (e) => {
        targetX = (e.clientX / window.innerWidth - 0.5) * 0.8;
        targetY = -(e.clientY / window.innerHeight - 0.5) * 0.5;
    });

    // ── Resize handler ──
    window.addEventListener('resize', () => {
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });

    // ── Animation loop ──
    let clock = 0;
    function animate() {
        requestAnimationFrame(animate);
        clock += 0.003;

        // Gentle auto rotation
        particles.rotation.y = clock * 0.08;
        particles.rotation.x = Math.sin(clock * 0.4) * 0.05;
        lines.rotation.y = clock * 0.03;

        // Mouse parallax
        currentX += (targetX - currentX) * 0.05;
        currentY += (targetY - currentY) * 0.05;
        scene.rotation.y = currentX * 0.3;
        scene.rotation.x = currentY * 0.2;

        renderer.render(scene, camera);
    }
    animate();
})();

// ── Scroll Reveal ──────────────────────────────────────────
const revealElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
            // Stagger siblings
            const siblings = entry.target.parentElement.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
            let delay = 0;
            siblings.forEach((sib, idx) => {
                if (sib === entry.target) delay = idx * 80;
            });
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, delay);
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

revealElements.forEach(el => revealObserver.observe(el));

// ── Smooth Scroll for Anchor Links ────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// ── Skill Bar Animation ────────────────────────────────────
const skillBarsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const bars = entry.target.querySelectorAll('.soft-fill');
            bars.forEach(bar => {
                bar.style.animationPlayState = 'running';
            });
            skillBarsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.3 });

const skillsSection = document.getElementById('skills');
if (skillsSection) {
    // Pause animations initially
    document.querySelectorAll('.soft-fill').forEach(bar => {
        bar.style.animationPlayState = 'paused';
        bar.style.width = '0';
    });
    skillBarsObserver.observe(skillsSection);
}

// Trigger width transition when bars are visible
const softFillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const fill = entry.target;
            const targetWidth = fill.style.getPropertyValue('--w');
            setTimeout(() => {
                fill.style.transition = 'width 1.4s cubic-bezier(0.4,0,0.2,1)';
                fill.style.width = targetWidth;
            }, 200);
            softFillObserver.unobserve(fill);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.soft-fill').forEach(fill => {
    softFillObserver.observe(fill);
});

// ── Contact Form ───────────────────────────────────────────
const form = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');
const submitBtn = document.getElementById('submitBtn');

if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = form.querySelector('#name').value.trim();
        const email = form.querySelector('#email').value.trim();
        const message = form.querySelector('#message').value.trim();

        if (!name || !email || !message) return;

        // Simulate sending
        const btnSpan = submitBtn.querySelector('span');
        const btnIcon = submitBtn.querySelector('i');
        btnSpan.textContent = 'Sending...';
        btnIcon.className = 'fa-solid fa-spinner fa-spin';
        submitBtn.disabled = true;

        setTimeout(() => {
            btnSpan.textContent = 'Send Message';
            btnIcon.className = 'fa-solid fa-paper-plane';
            submitBtn.disabled = false;
            form.reset();
            formSuccess.classList.add('show');
            setTimeout(() => formSuccess.classList.remove('show'), 5000);
        }, 1800);
    });
}

// ── Skill Card Tilt Effect ─────────────────────────────────
document.querySelectorAll('.skill-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const midX = rect.width / 2;
        const midY = rect.height / 2;
        const rotX = ((y - midY) / midY) * 8;
        const rotY = ((x - midX) / midX) * -8;
        card.style.transform = `perspective(300px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
    });
});

// ── Project Card Tilt Effect ───────────────────────────────
document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const midX = rect.width / 2;
        const midY = rect.height / 2;
        const rotX = ((y - midY) / midY) * 4;
        const rotY = ((x - midX) / midX) * -4;
        card.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.4s ease, border-color 0.35s, box-shadow 0.35s';
    });
});

// ── Number Counter Animation ───────────────────────────────
function animateCounter(el, target, duration = 1500) {
    let start = 0;
    const startTime = performance.now();
    const isPlus = target.includes('+');
    const num = parseInt(target);
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * num);
        el.textContent = current + (isPlus ? '+' : '');
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNums = entry.target.querySelectorAll('.stat-num');
            statNums.forEach(el => {
                const target = el.textContent.trim();
                animateCounter(el, target);
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) statsObserver.observe(heroStats);

// ── Page Load Animation ────────────────────────────────────
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.6s ease';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.body.style.opacity = '1';
        });
    });

    // Hero elements stagger
    const heroReveal = document.querySelectorAll('.hero .reveal-up');
    heroReveal.forEach((el, i) => {
        setTimeout(() => {
            el.classList.add('visible');
        }, 300 + i * 150 + (window.__edHeroDelay || 0));
    });
});

// ── My Favorite Songs Showcase – Interactive Player & Lyrics ─────────
(function initMusicPlayer() {
    const rawSongs = [
        {
            title: "My Showcase", artist: "Deandra Wahyudrian",
            cover: "assets/music/cover.jpg",
            audioFile: "", 
            lrcFile: "" 
        },
        {
            title: "Toronto 2014", artist: "Daniel Caesar",
            cover: "assets/music/ab67616d0000b2737c68face1dc58127f3a7b1cc.jpg",
            audioFile: "assets/audio/toronto-2014.mp3",
            lrcFile: "assets/lyrics/toronto-2014.lrc"
        },
        {
            title: "Firasat", artist: "Marcell",
            cover: "assets/music/ab67616d0000b273df28df674016bb665fec81ef.jpg",
            audioFile: "assets/audio/firasat.mp3",
            lrcFile: "assets/lyrics/firasat.lrc"
        },
        {
            title: "None Of Ur Friends Business", artist: "Ginuwine",
            cover: "assets/music/ab67616d0000b273c3271cf84b2d68263ac5e00d.jpg",
            audioFile: "assets/audio/none-of-ur-friends.mp3",
            lrcFile: "assets/lyrics/none-of-ur-friends.lrc"
        },
        {
            title: "Incomplete", artist: "SisQó",
            cover: "assets/music/ab67616d0000b27335c2d8953ae07e7ba62518f6.jpg",
            audioFile: "assets/audio/incomplete.mp3",
            lrcFile: "assets/lyrics/incomplete.lrc"
        },
        {
            title: "Kiss of Life", artist: "Sade",
            cover: "assets/music/images.jpg",
            audioFile: "assets/audio/kiss-of-life.mp3",
            lrcFile: "assets/lyrics/kiss-of-life.lrc"
        },
        {
            title: "Can't Hold Us", artist: "Macklemore & Ryan Lewis",
            cover: "assets/music/ab67616d00001e022a6b364528b128a4a17d100d.jpg",
            audioFile: "assets/audio/cant-hold-us.mp3",
            lrcFile: "assets/lyrics/cant-hold-us.lrc"
        },
        {
            title: "Let Me Love You", artist: "Mario",
            cover: "assets/music/ab67616d0000b273ba8db944ef3e2846ba9efa57.jpg",
            audioFile: "assets/audio/let-me-love-you.mp3",
            lrcFile: "assets/lyrics/let-me-love-you.lrc"
        },
        {
            title: "This Love", artist: "Maroon 5",
            cover: "assets/music/ab67616d0000b27392f2d790c6a97b195f66d51e.jpg",
            audioFile: "assets/audio/this-love.mp3",
            lrcFile: "assets/lyrics/this-love.lrc"
        },
        {
            title: "Creep", artist: "Radiohead",
            cover: "assets/music/ab67616d0000b273ec548c00d3ac2f10be73366d.jpg",
            audioFile: "assets/audio/creep.mp3",
            lrcFile: "assets/lyrics/creep.lrc"
        },
        {
            title: "The Man Who Can't Be Moved", artist: "The Script",
            cover: "assets/music/The-Script-English-2008-500x500.jpg",
            audioFile: "assets/audio/the-man-who-cant-be-moved.mp3",
            lrcFile: "assets/lyrics/the-man-who-cant-be-moved.lrc"
        },
        {
            title: "How Deep Is Your Love", artist: "Bee Gees",
            cover: "assets/music/ab67616d0000b27352038992fc6d7868f31d23b7.jpg",
            audioFile: "assets/audio/how-deep-is-your-love.mp3",
            lrcFile: "assets/lyrics/how-deep-is-your-love.lrc"
        },
        {
            title: "Fair Trade", artist: "Drake",
            cover: "assets/music/ab67616d0000b273cd945b4e3de57edd28481a3f.jpg",
            audioFile: "assets/audio/fair-trade.mp3",
            lrcFile: "assets/lyrics/fair-trade.lrc"
        },
        {
            title: "Tarot", artist: "Feast",
            cover: "assets/music/ab67616d0000b273c800b90e2092a5328f699117.jpg",
            audioFile: "assets/audio/tarot.mp3",
            lrcFile: "assets/lyrics/tarot.lrc"
        },
        {
            title: "Those Eyes", artist: "New West",
            cover: "assets/music/ab67616d0000b273eeeff1ce49d705b0351b6675.jpg",
            audioFile: "assets/audio/those-eyes.mp3",
            lrcFile: "assets/lyrics/those-eyes.lrc"
        }
    ];

    // Grid 5 x 3 Setup (15 Items)
    const gridPositions = [
        // Row 1
        {x: '15%', y: '18%'}, {x: '32.5%', y: '18%'}, {x: '50%', y: '18%'}, {x: '67.5%', y: '18%'}, {x: '85%', y: '18%'},
        // Row 2 (Center is idx 7)
        {x: '15%', y: '50%'}, {x: '32.5%', y: '50%'}, {x: '50%', y: '50%'}, {x: '67.5%', y: '50%'}, {x: '85%', y: '50%'},
        // Row 3
        {x: '15%', y: '82%'}, {x: '32.5%', y: '82%'}, {x: '50%', y: '82%'}, {x: '67.5%', y: '82%'}, {x: '85%', y: '82%'}
    ];

    const otherPositions = gridPositions.filter((p, i) => i !== 7); // total 14 positions

    const songs = rawSongs.map((song, idx) => {
        if (idx === 0) return { ...song, pos: gridPositions[7] }; // Center (My Showcase Cover)
        return { ...song, pos: otherPositions[idx - 1] }; // Surroundings
    });

    let currentIdx = 0;
    let parsedLyrics = [];

    // DOM Elements
    const showcaseSection = document.getElementById('favsong');
    const grid = document.getElementById('showcaseGrid');
    const audio = document.getElementById('audioPlayer');
    
    const lyricsScroll = document.getElementById('lyricsScroll');
    const scTitle = document.getElementById('scSongTitle');
    const scArtist = document.getElementById('scSongArtist');

    const btnPlay = document.getElementById('scPlay');
    const btnPlayIcon = document.getElementById('scPlayIcon');
    const btnPrev = document.getElementById('scPrev');
    const btnNext = document.getElementById('scNext');

    const timeCurrent = document.getElementById('scTimeCurrent');
    const timeTotal = document.getElementById('scTimeDuration');
    const scrubber = document.getElementById('scScrubber');
    const scrubberFill = document.getElementById('scScrubberFill');
    
    // Bottom player controls bar wrapper
    const controlsContainer = document.querySelector('.sc-controls-container');

    let introPlayed = false;
    let coverElements = [];

    // Web Audio Variables
    const spectrumCanvas = document.getElementById('spectrumCanvas');
    const starsCanvas = document.getElementById('starsCanvas');
    let ctxSpec = spectrumCanvas ? spectrumCanvas.getContext('2d') : null;
    let ctxStars = starsCanvas ? starsCanvas.getContext('2d') : null;
    let audioCtx, analyser, dataArray, source, bufLen;
    let visualizerInitialized = false;
    let stars = [];

    if (!showcaseSection || !grid || !audio) return;

    // ── 1. Left/right slider ──
    const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let vib = 0, baseBass = 0, sx = null, dragMoved = false;
    const countEl = document.createElement('span');
    countEl.className = 'sc-count';
    showcaseSection.appendChild(countEl);

    function layout() {
        const n = songs.length, cw = Math.max(190, Math.min(innerHeight * 0.36, 340)), narrow = innerWidth < 700;
        grid.style.setProperty('--cw', cw + 'px');
        coverElements.forEach((el, i) => {
            let o = i - currentIdx;
            if (o > n / 2) o -= n;
            if (o < -n / 2) o += n;
            const a = Math.abs(o), k = Math.min(a, 2), vis = a <= (narrow ? 1 : 2);
            el._a = a;
            el.style.transform = `translate(-50%, -50%) translateX(${Math.sign(o) * [0, 0.92, 1.62][k] * cw}px) scale(${[1, 0.72, 0.5][k]})`;
            el.style.opacity = vis ? [1, 0.55, 0.2][k] : 0;
            el.style.pointerEvents = vis ? 'auto' : 'none';
            el.style.setProperty('--z', 10 - Math.min(a, 9));
            el.classList.toggle('is-active', a === 0);
            if (a === 0) el.removeAttribute('data-cursor'); else el.setAttribute('data-cursor', 'LISTEN');
            if (a > 1) { el.firstElementChild.style.transform = ''; el.firstElementChild.style.boxShadow = ''; }
        });
        countEl.innerHTML = `<b>${String(currentIdx + 1).padStart(2, '0')}</b> / ${String(n).padStart(2, '0')}`;
    }

    function initCovers() {
        grid.innerHTML = '';
        coverElements = songs.map((song, idx) => {
            const el = document.createElement('div');
            el.className = 'sc-cover-item';
            el.innerHTML = `<div class="sc-vib"><img src="${song.cover}" alt="${song.title}" draggable="false"></div>`;
            el.style.transform = 'translate(-50%, -50%) scale(0.6)';
            el.style.opacity = '0';
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                if (dragMoved) return;
                if (idx === currentIdx) togglePlay(); else selectSong(idx);
            });
            grid.appendChild(el);
            return el;
        });

        const main = grid.parentElement;
        [['sc-prev', 'fa-arrow-left', 'Previous cover', 'PREV', -1], ['sc-next', 'fa-arrow-right', 'Next cover', 'NEXT', 1]].forEach(([cls, ic, label, cur, step]) => {
            const btn = document.createElement('button');
            btn.className = 'sc-nav ' + cls;
            btn.setAttribute('aria-label', label);
            btn.dataset.cursor = cur;
            btn.innerHTML = `<i class="fa-solid ${ic}"></i>`;
            btn.addEventListener('click', (e) => { e.stopPropagation(); selectSong(currentIdx + step); });
            main.appendChild(btn);
        });

        main.addEventListener('pointerdown', (e) => {
            if (e.target.closest('.sc-controls-container, .sc-nav')) return;
            sx = e.clientX; dragMoved = false;
        });
        addEventListener('pointerup', (e) => {
            if (sx === null) return;
            const dx = e.clientX - sx;
            sx = null;
            if (Math.abs(dx) > 50) { dragMoved = true; selectSong(currentIdx + (dx < 0 ? 1 : -1)); }
        });
        addEventListener('keydown', (e) => {
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
            if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
            const r = showcaseSection.getBoundingClientRect();
            if (r.top > innerHeight * 0.5 || r.bottom < innerHeight * 0.5) return;
            selectSong(currentIdx + (e.key === 'ArrowRight' ? 1 : -1));
        });
        addEventListener('resize', layout);

        new IntersectionObserver((entries, obs) => {
            if (entries[0].isIntersecting && !introPlayed) {
                introPlayed = true;
                obs.disconnect();
                setTimeout(() => { layout(); loadSongInfo(0, false); }, 300);
            }
        }, { threshold: 0.4 }).observe(showcaseSection);
    }

    if (controlsContainer) controlsContainer.addEventListener('click', (e) => e.stopPropagation());

    function selectSong(idx) {
        const n = songs.length;
        idx = ((idx % n) + n) % n;
        if (idx === currentIdx) return;
        currentIdx = idx;
        layout();
        loadSongInfo(currentIdx, true);
    }

    // Vibration: bass energy above its own recent average makes the covers shake
    function vibrate() {
        const bass = (dataArray[0] + dataArray[1] + dataArray[2]) / 765;
        baseBass = baseBass * 0.97 + bass * 0.03;
        const target = Math.min(1, Math.max(0, (bass - baseBass) * 5)) * 0.85 + bass * 0.15;
        vib = Math.max(target, vib * 0.85);
        if (REDUCED) return;
        coverElements.forEach((el) => {
            if (el._a > 1) return;
            const v = vib * (el._a === 0 ? 1 : 0.35), w = el.firstElementChild;
            const jx = (Math.random() - 0.5) * v * 14, jy = (Math.random() - 0.5) * v * 14, r = (Math.random() - 0.5) * v * 2;
            w.style.transform = `translate(${jx.toFixed(1)}px, ${jy.toFixed(1)}px) rotate(${r.toFixed(2)}deg) scale(${(1 + v * 0.06).toFixed(3)})`;
            if (el._a === 0) w.style.boxShadow = `0 0 0 ${(vib * 16).toFixed(1)}px rgba(255,255,255,${(vib * 0.12).toFixed(3)}), 0 30px 70px rgba(0,0,0,.8)`;
        });
        showcaseSection.style.setProperty('--vib', vib.toFixed(3));
    }

    // Helper to encode only the filename part and NOT the slashes
    function encodePath(pathStr) {
        if (!pathStr) return '';
        return pathStr.split('/').map(segment => encodeURIComponent(segment)).join('/');
    }

    // ── 2. Playback & LRC Parsing ──
    async function loadSongInfo(idx, autoplay = false) {
        const song = songs[idx];
        scTitle.textContent = song.title;
        scArtist.textContent = song.artist;
        
        parsedLyrics = [];
        lyricsScroll.innerHTML = '<p class="sc-lyric-line active">Memuat lirik...</p>';
        lyricsScroll.style.transform = `translateY(60px)`;

        if (!song.audioFile) {
            // Placeholder cover case
            audio.pause();
            audio.src = "";
            lyricsScroll.innerHTML = '<p class="sc-lyric-line active">♪ Choose a song to play...</p>';
            updatePlayState(false);
            
            // Hide the controls
            if(controlsContainer) {
                controlsContainer.style.opacity = '0';
                controlsContainer.style.pointerEvents = 'none';
            }
            return;
        }

        // Show controls again when an active song is picked
        if(controlsContainer) {
            controlsContainer.style.opacity = '1';
            controlsContainer.style.pointerEvents = 'auto';
        }

        // Encode each part of the URI so spaces and special chars work without breaking the folder slashes
        audio.src = encodePath(song.audioFile);
        
        try {
            const res = await fetch(encodePath(song.lrcFile));
            if (res.ok) {
                const text = await res.text();
                parsedLyrics = parseLRC(text);
                renderLyrics();
            } else {
                lyricsScroll.innerHTML = '<p class="sc-lyric-line active">♪ Instrumental / Lirik tidak tersedia</p>';
            }
        } catch(e) {
            console.error("Lyrics fetch error:", e);
            lyricsScroll.innerHTML = '<p class="sc-lyric-line active">♪ Instrumental / Lirik tidak tersedia</p>';
        }

        if (autoplay) {
            if (!visualizerInitialized) initAudioVisualizer();
            if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
            
            audio.play().then(() => {
                updatePlayState(true);
            }).catch(e => {
                console.warn("Audio play blocked or failed:", e);
                updatePlayState(false);
            });
        }
    }

    function parseLRC(lrcText) {
        const lines = lrcText.split('\n');
        const lp = [];
        // Extract exact timestamps from lyrics
        const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
        lines.forEach(line => {
            const match = timeRegex.exec(line);
            if(match) {
                const min = parseInt(match[1]);
                const sec = parseInt(match[2]);
                const ms = parseInt(match[3].padEnd(3, '0'));
                const time = min * 60 + sec + ms / 1000;
                const text = line.replace(timeRegex, '').trim();
                // We keep text even if it's empty to respect instrumental gaps
                if(text) lp.push({time, text});
            }
        });
        return lp.sort((a,b) => a.time - b.time);
    }

    function renderLyrics() {
        lyricsScroll.innerHTML = '';
        if (parsedLyrics.length === 0) {
            lyricsScroll.innerHTML = '<p class="sc-lyric-line active">♪ Instrumental / No Lyrics</p>';
            return;
        }
        parsedLyrics.forEach((lyric, i) => {
            const p = document.createElement('p');
            p.className = 'sc-lyric-line';
            p.textContent = lyric.text;
            p.dataset.index = i;
            lyricsScroll.appendChild(p);
        });
        lyricsScroll.style.transform = `translateY(60px)`;
    }

    function syncLyrics(time) {
        if (!parsedLyrics.length) return;
        
        let activeIdx = -1;
        for (let i = 0; i < parsedLyrics.length; i++) {
            if (time >= parsedLyrics[i].time - 0.2) {
                activeIdx = i;
            } else {
                break;
            }
        }

        if (activeIdx !== -1) {
            const lines = lyricsScroll.querySelectorAll('.sc-lyric-line');
            lines.forEach((line, i) => {
                if (i === activeIdx) {
                    if (!line.classList.contains('active')) {
                        line.classList.add('active');
                    }
                } else {
                    line.classList.remove('active');
                }
            });
            
            const activeEl = lines[activeIdx];
            if(activeEl) {
                // Determine container half height
                const containerH = lyricsScroll.parentElement.clientHeight || 120;
                // Calculate precise offset to center the text
                const offset = activeEl.offsetTop + (activeEl.clientHeight / 2); 
                const scrollY = (containerH / 2) - offset;
                lyricsScroll.style.transform = `translateY(${scrollY}px)`;
            }
        }
    }

    // ── 3. Visualizer & Canvas Effects ──
    function initAudioVisualizer() {
        if (visualizerInitialized) return;
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioCtx.createAnalyser();
            source = audioCtx.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioCtx.destination);
            
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.55; 
            bufLen = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufLen);
            
            visualizerInitialized = true;
            resizeCanvases();
            initStars();
            drawFrame();
        } catch(e) {
            console.error("Audio API init failed:", e);
        }
    }

    function initStars() {
        stars = [];
        for(let i=0; i<150; i++){
            stars.push({
                x: Math.random() * starsCanvas.width,
                y: Math.random() * starsCanvas.height,
                r: Math.random() * 2 + 0.5,
                baseAlpha: Math.random() * 0.5 + 0.1,
                speed: Math.random() * 0.5 + 0.2
            });
        }
    }

    function resizeCanvases() {
        if (spectrumCanvas) { spectrumCanvas.width = window.innerWidth; spectrumCanvas.height = 180; }
        if (starsCanvas) { starsCanvas.width = window.innerWidth; starsCanvas.height = window.innerHeight; }
    }
    window.addEventListener('resize', resizeCanvases);

    function drawFrame() {
        requestAnimationFrame(drawFrame);
        if (!visualizerInitialized || !ctxSpec || !ctxStars) return;

        analyser.getByteFrequencyData(dataArray);
        vibrate();

        // ── Draw Spectrum ──
        ctxSpec.clearRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);
        const w = spectrumCanvas.width;
        const barW = (w / bufLen) * 2;
        let x = 0;
        
        ctxSpec.beginPath();
        ctxSpec.moveTo(0, spectrumCanvas.height);
        for(let i = 0; i < bufLen/2; i++) {
            const barH = dataArray[i] * 0.7;
            const y = spectrumCanvas.height - barH;
            
            if (i === 0) ctxSpec.moveTo(x, y);
            else ctxSpec.lineTo(x, y);
            x += barW;
        }
        ctxSpec.lineTo(w, spectrumCanvas.height);
        
        const grad = ctxSpec.createLinearGradient(0, spectrumCanvas.height, 0, 0);
        grad.addColorStop(0, 'rgba(160, 160, 160, 0.4)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctxSpec.fillStyle = grad;
        ctxSpec.fill();
        
        ctxSpec.strokeStyle = 'rgba(255,255,255,0.4)';
        ctxSpec.lineWidth = 2;
        ctxSpec.stroke();

        // ── Draw Stars ──
        ctxStars.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
        let sum = 0;
        for(let i=0; i<bufLen; i++) sum += dataArray[i];
        let avg = sum / bufLen;
        let beatPulse = Math.max(0, (avg - 80) / 100);

        stars.forEach(s => {
            s.y -= s.speed + (beatPulse * 2);
            if (s.y < 0) {
                s.y = starsCanvas.height;
                s.x = Math.random() * starsCanvas.width;
            }
            
            ctxStars.beginPath();
            ctxStars.arc(s.x, s.y, s.r + (beatPulse * 1.5), 0, Math.PI*2);
            ctxStars.fillStyle = `rgba(255, 255, 255, ${Math.min(1, s.baseAlpha + beatPulse)})`;
            ctxStars.fill();
        });
    }

    // ── 4. Controls ──
    function togglePlay() {
        if (songs[currentIdx].audioFile === "") return; // Disable play on placeholder

        if (!visualizerInitialized) initAudioVisualizer();
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        
        if (audio.paused) {
            audio.play();
            updatePlayState(true);
        } else {
            audio.pause();
            updatePlayState(false);
        }
    }

    function updatePlayState(playing) {
        btnPlayIcon.className = playing ? 'fa-solid fa-pause' : 'fa-solid fa-play';
    }

    function playPrev() {
        let nIdx = (currentIdx - 1 + songs.length) % songs.length;
        if (nIdx === 0) nIdx = songs.length - 1; // Skip the placeholder if we wrap around backwards
        selectSong(nIdx);
    }
    
    function playNext() {
        let nIdx = (currentIdx + 1) % songs.length;
        if (nIdx === 0) nIdx = 1; // Skip placeholder on next
        selectSong(nIdx);
    }

    function formatTime(sec) {
        if(isNaN(sec)) return '0:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        const pct = (audio.currentTime / audio.duration) * 100;
        scrubber.value = pct;
        scrubberFill.style.width = pct + '%';
        timeCurrent.textContent = formatTime(audio.currentTime);
        timeTotal.textContent = formatTime(audio.duration);
        syncLyrics(audio.currentTime);
    });

    audio.addEventListener('ended', playNext);
    audio.addEventListener('play', () => updatePlayState(true));
    audio.addEventListener('pause', () => updatePlayState(false));

    scrubber.addEventListener('input', (e) => {
        if (audio.duration) {
            const t = (e.target.value / 100) * audio.duration;
            audio.currentTime = t;
            scrubberFill.style.width = e.target.value + '%';
        }
    });

    btnPlay.addEventListener('click', togglePlay);
    btnPrev.addEventListener('click', playPrev);
    btnNext.addEventListener('click', playNext);

    // Bootstrap
    initCovers();

})();
