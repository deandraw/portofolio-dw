/* ============================================================
   PORTFOLIO ASSISTANT — CHATBOT ENGINE (demo / offline mode)
   Pure logic, no DOM access. Works fully client-side so the
   assistant is always testable, even without an AI backend.
   ============================================================ */

'use strict';

window.PortfolioAssistantEngine = (function () {

  /* ---------- language detection ---------- */
  const ID_HINTS = [
    'apa', 'apakah', 'siapa', 'bisa', 'gimana', 'bagaimana', 'kamu', 'dia',
    'nya', 'dong', 'kah', 'nih', 'yang', 'dengan', 'kah', 'punya', 'buat',
    'kerjakan', 'dapat', 'proyek', 'kemampuan', 'pengalaman', 'hubungi',
    'kontak', 'tolong', 'saya', 'aku', 'gua', 'gimana', 'berapa', 'kapan',
    'halo', 'hai', 'pagi', 'siang', 'sore', 'malam', 'terima kasih'
  ];

  function detectLang(text) {
    const t = text.toLowerCase();
    let score = 0;
    ID_HINTS.forEach((w) => {
      if (new RegExp('\\b' + w + '\\b').test(t)) score++;
    });
    return score > 0 ? 'id' : 'en';
  }

  /* ---------- helpers ---------- */
  function pick(lang, en, id) {
    return lang === 'id' ? id : en;
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Short tokens (e.g. "hi", "ui", "php") use strict word-boundary matching so
  // they never match as a mere substring inside unrelated words ("which", "build").
  // Longer roots use plain substring matching, since Indonesian prefixes/suffixes
  // attach directly to the root with no space (e.g. "menghubunginya" contains "hubungi").
  function containsKeyword(text, keyword) {
    if (keyword.length <= 3 && keyword.indexOf(' ') === -1) {
      const pattern = new RegExp('(?:^|[^a-z0-9])' + escapeRegex(keyword) + '(?:$|[^a-z0-9])', 'i');
      return pattern.test(text);
    }
    return text.includes(keyword);
  }

  function scoreKeywords(text, keywords) {
    let score = 0;
    keywords.forEach((k) => {
      if (containsKeyword(text, k)) score++;
    });
    return score;
  }

  /* ---------- intent keyword sets ---------- */
  // Order matters for tie-breaking: more specific intents are listed first,
  // since equal-score ties keep whichever intent was evaluated first.
  const INTENTS = {
    aitools: ['ai tool', 'ai tools', 'tools ai', 'chatgpt', 'codex', 'antigravity', 'pakai ai', 'ai apa', 'ai yang', 'artificial intelligence'],
    certificates: ['certificate', 'certificates', 'certification', 'sertifikat', 'sertifikasi', 'toefl', 'ccna', 'bnsp', 'ujikom', 'certified', 'kompetensi', 'cisco', 'gemini'],
    education: ['education', 'pendidikan', 'kuliah', 'university', 'universitas', 'unikom', 'gpa', 'ipk', 'lulusan', 'graduate', 'graduated', 'lulus', 'degree', 'gelar', 's.kom'],
    phpExperience: ['php'],
    capability: ['can he build', 'can you build', 'bisa bikin', 'bisa buat', 'bisa membuat', 'help me build', 'bantu buat', 'i need', 'saya butuh', 'saya perlu', 'i want a', 'i want to build', 'looking for a developer', 'cari developer'],
    contact: ['contact', 'kontak', 'hubungi', 'email', 'e-mail', 'whatsapp', 'nomor', 'telepon', 'linkedin', 'github', 'reach him', 'get in touch'],
    tools: ['xampp', 'laragon', 'tools', 'tool apa', 'software', 'aplikasi yang digunakan', 'pakai aplikasi', 'text editor'],
    skills: ['skill', 'skills', 'kemampuan', 'kompetensi', 'bisa apa', 'jago apa', 'menguasai', 'technology', 'technologies', 'teknologi', 'tech stack', 'stack apa', 'kuasai'],
    projects: ['project', 'projects', 'proyek', 'karya', 'portfolio', 'portofolio', 'pernah buat', 'pernah bikin', 'show me his work', 'contoh kerja'],
    experience: ['experience', 'pengalaman', 'magang', 'internship', 'kerja apa aja', 'riwayat'],
    about: ['siapa deandra', 'siapa itu deandra', 'who is deandra', 'about him', 'about deandra', 'tentang deandra', 'tentang dia', 'perkenalkan', 'ceritakan tentang', 'kenalan dengan'],
    greeting: ['hi', 'hello', 'hey', 'halo', 'hai', 'pagi', 'siang', 'sore', 'malam']
  };

  function matchIntent(text) {
    let best = null;
    let bestScore = 0;
    Object.keys(INTENTS).forEach((intent) => {
      const s = scoreKeywords(text, INTENTS[intent]);
      if (s > bestScore) {
        bestScore = s;
        best = intent;
      }
    });
    return bestScore > 0 ? best : null;
  }

  function findRelevantProject(text, data) {
    let best = null;
    let bestScore = 0;
    const ver = (text.match(/\bv\s?(\d)\b/) || [])[1];
    data.projects.forEach((p) => {
      let s = scoreKeywords(text, p.keywords || []);
      if (containsKeyword(text, p.name.toLowerCase())) s += 3;
      if (ver && /toko sepeda/i.test(p.name)) s += p.version && p.version.toLowerCase() === 'v' + ver ? 6 : -6;
      if (s > bestScore) {
        bestScore = s;
        best = p;
      }
    });
    return bestScore > 0 ? best : null;
  }

  /* ---------- response builders ---------- */
  function buildSkillsReply(lang, data) {
    const hard = data.skills.hard.slice(0, 10).join(', ');
    return pick(
      lang,
      `Deandra's core skills include ${hard}, and more. He mainly works across web development, UI/UX design, databases, and data analysis.`,
      `Skill utama Deandra meliputi ${hard}, dan beberapa lainnya. Fokusnya ada di web development, UI/UX design, database, dan data analysis.`
    );
  }

  function buildToolsReply(lang, data) {
    const tools = data.tools.join(', ');
    return pick(
      lang,
      `He usually works with ${tools}.`,
      `Dia biasa menggunakan ${tools}.`
    );
  }

  function buildAboutReply(lang, data) {
    return `${data.name} — ${pick(lang, data.role.en, data.role.id)}, ${data.location}. ${pick(lang, data.bio.en, data.bio.id)}`;
  }

  function buildProjectsListReply(lang, data) {
    const names = data.projects.map((p) => p.name).join(', ');
    return pick(
      lang,
      `Deandra has worked on a few projects: ${names}. Ask me about any of them, or tell me what you need and I'll suggest the best fit!`,
      `Deandra sudah mengerjakan beberapa proyek: ${names}. Tanyakan salah satunya, atau ceritakan kebutuhanmu dan aku akan rekomendasikan yang paling cocok!`
    );
  }

  function buildProjectDetailReply(lang, project) {
    const desc = pick(lang, project.description.en, project.description.id);
    const tags = project.tags.join(', ');
    return `**${project.name}** — ${desc} ${pick(lang, 'Tech used', 'Teknologi yang dipakai')}: ${tags}.${project.github ? ' GitHub: ' + project.github : ''}`;
  }

  function buildAiReply(lang, data) {
    const t = (data.aiTools || []).join(', ');
    if (!t) return buildToolsReply(lang, data);
    return pick(lang, `The AI tools Deandra uses most often are ${t}.`, `AI yang paling sering digunakan Deandra adalah ${t}.`);
  }

  function buildCertReply(lang, data, text) {
    const c = data.certificates || [];
    if (!c.length) return buildAboutReply(lang, data);
    const hit = c.filter((x) => (text || '').includes(x.id.split('-')[0]) || (/ujikom|bnsp/.test(text || '') && x.id === 'bnsp-web'));
    if (hit.length) return hit.map((x) => `**${x.title}** — ${x.issuer}, ${x.date}. ${x.detail}`).join(' ');
    const list = c.map((x) => `${x.title} (${x.issuer}, ${x.year})`).join('; ');
    return pick(lang, `Deandra holds ${c.length} certificates: ${list}.`, `Deandra memiliki ${c.length} sertifikat: ${list}.`);
  }

  function buildEduReply(lang, data) {
    const ed = (data.education || [])[0];
    if (!ed) return buildAboutReply(lang, data);
    return pick(lang, `Deandra graduated with a ${ed.degree.en} from ${ed.school} (${ed.period}), GPA ${ed.gpa}.`, `Deandra lulus ${ed.degree.id} dari ${ed.school} (${ed.period}), IPK ${ed.gpa}.`);
  }

  function buildExperienceReply(lang, data) {
    const items = data.experience.map((e) => `${e.role} @ ${e.org} (${e.type})`).join('; ');
    return pick(
      lang,
      `Some of his experience: ${items}.`,
      `Beberapa pengalamannya: ${items}.`
    );
  }

  function buildContactReply(lang, data) {
    return pick(
      lang,
      `You can reach Deandra via email at ${data.contact.email}, or connect on LinkedIn / GitHub — links are in the Contact section below.`,
      `Kamu bisa menghubungi Deandra lewat email di ${data.contact.email}, atau lewat LinkedIn / GitHub — tautannya ada di bagian Contact di bawah.`
    );
  }

  function buildPhpReply(lang, data) {
    const phpProjects = data.projects.filter((p) => p.tags.includes('PHP')).map((p) => p.name).join(', ');
    return pick(
      lang,
      `Yes — Deandra has hands-on PHP & MySQL experience, used in projects like ${phpProjects}.`,
      `Ya — Deandra punya pengalaman langsung dengan PHP & MySQL, dipakai di proyek seperti ${phpProjects}.`
    );
  }

  function buildCapabilityReply(lang, project, data) {
    if (project) {
      const desc = pick(lang, project.description.en, project.description.id);
      return pick(
        lang,
        `Based on your needs, Deandra's "${project.name}" project is the most relevant example. ${desc}`,
        `Berdasarkan kebutuhanmu, proyek "${project.name}" milik Deandra adalah contoh yang paling relevan. ${desc}`
      );
    }
    const services = pick(lang, data.services.en, data.services.id).join(', ');
    return pick(
      lang,
      `Deandra can help with things like: ${services}. Tell me a bit more about what you need and I'll point you to the best example.`,
      `Deandra bisa bantu hal-hal seperti: ${services}. Ceritakan sedikit lebih detail kebutuhanmu, nanti aku arahkan ke contoh yang paling cocok.`
    );
  }

  function buildFallbackReply(lang) {
    return pick(
      lang,
      "I can help you learn more about Deandra's skills, projects, technologies, and web development capabilities. Try asking about his skills or projects!",
      'Aku bisa bantu kamu mengenal lebih jauh soal skill, proyek, teknologi, dan kemampuan web development Deandra. Coba tanya soal skill atau proyeknya!'
    );
  }

  function buildGreetingReply(lang, data) {
    return pick(
      lang,
      `Hi there! I'm Portfolio Assistant. Ask me anything about ${data.name.split(' ')[0]}'s skills, projects, or how he can help with your idea.`,
      `Halo! Aku Portfolio Assistant. Tanya apa saja soal skill, proyek, atau bagaimana ${data.name.split(' ')[0]} bisa bantu ide kamu.`
    );
  }

  /* ---------- main entry point ---------- */
  function projectAction(lang, p) {
    if (!p || !p.anchorId) return null;
    const a = { type: 'viewProject', anchorId: p.anchorId, projectId: p.id, label: pick(lang, 'View Project', 'Lihat Proyek') };
    if (p.github) a.github = p.github;
    return a;
  }

  function getResponse(rawText, data) {
    const text = rawText.toLowerCase().trim();
    const lang = detectLang(text);

    if (!text) {
      return { text: buildFallbackReply(lang), action: null };
    }

    // Direct project name / needs-based match takes priority
    const relevantProject = findRelevantProject(text, data) ||
      ((/(latest|newest|recent|terbaru|terakhir)/.test(text) && /(project|proyek|karya|work)/.test(text)) ? (data.projects.find((p) => p.featured) || null) : null);
    const intent = matchIntent(text);

    if (/toko sepeda/.test(text) && !/\bv\s?\d\b|sentosav\d|2\.0|github|repo/.test(text)) {
      const fam = data.projects.filter((p) => /toko sepeda/i.test(p.name));
      if (fam.length > 1) {
        return {
          text: pick(lang, `There are ${fam.length} Toko Sepeda Sentosa projects: `, `Ada ${fam.length} proyek Toko Sepeda Sentosa: `) +
            fam.map((p) => `**${p.name}** (${(p.category || {})[lang] || ''})`).join('; ') +
            pick(lang, '. The newest is V1, a full operational information system.', '. Yang terbaru adalah V1, sistem informasi operasional lengkap.'),
          action: projectAction(lang, fam[0])
        };
      }
    }

    if (/(github|repositor|\brepo\b|source code|kode sumber)/.test(text) && !/(linkedin|e-?mail|kontak|contact)/.test(text)) {
      const list = relevantProject && relevantProject.github ? [relevantProject] : data.projects.filter((p) => p.github);
      if (list.length) {
        return {
          text: pick(lang, 'Here is the GitHub repository: ', 'Ini repository GitHub-nya: ') + list.map((p) => `**${p.name}** — ${p.github}`).join('; '),
          action: projectAction(lang, list[0])
        };
      }
    }

    if (/\b(project|proyek|made|built|buat|bikin|use|uses|used|pakai|menggunakan)\b/.test(text) && intent !== 'capability') {
      const techs = [...new Set(data.projects.reduce((a, p) => a.concat(p.tags), []))].filter((t) => containsKeyword(text, t.toLowerCase()));
      if (techs.length) {
        const hits = data.projects.filter((p) => techs.some((t) => p.tags.includes(t)));
        return {
          text: pick(lang, `Projects using ${techs.join(', ')}: `, `Proyek yang memakai ${techs.join(', ')}: `) + hits.map((p) => p.name).join(', ') + '.',
          action: projectAction(lang, hits[0])
        };
      }
    }

    if (intent === 'capability' || (relevantProject && (intent === null || intent === 'projects'))) {
      const reply = (intent !== 'capability' && relevantProject) ? buildProjectDetailReply(lang, relevantProject) : buildCapabilityReply(lang, relevantProject, data);
      return {
        text: reply,
        action: projectAction(lang, relevantProject)
      };
    }

    switch (intent) {
      case 'greeting':
        return { text: buildGreetingReply(lang, data), action: null };
      case 'about':
        return { text: buildAboutReply(lang, data), action: null };
      case 'skills':
        return { text: buildSkillsReply(lang, data), action: null };
      case 'tools':
        return { text: buildToolsReply(lang, data), action: null };
      case 'projects':
        return { text: buildProjectsListReply(lang, data), action: { type: 'scrollSection', anchorId: 'projects', label: pick(lang, 'See Projects', 'Lihat Proyek') } };
      case 'aitools':
        return { text: buildAiReply(lang, data), action: { type: 'scrollSection', anchorId: 'skills', label: pick(lang, 'View Skills', 'Lihat Skill') } };
      case 'certificates':
        return { text: buildCertReply(lang, data, text), action: { type: 'scrollSection', anchorId: 'certificates', label: pick(lang, 'View Certificates', 'Lihat Sertifikat') } };
      case 'education':
        return { text: buildEduReply(lang, data), action: { type: 'scrollSection', anchorId: 'experience', label: pick(lang, 'See Education', 'Lihat Pendidikan') } };
      case 'experience':
        return { text: buildExperienceReply(lang, data), action: null };
      case 'contact':
        return { text: buildContactReply(lang, data), action: { type: 'scrollSection', anchorId: 'contact', label: pick(lang, 'Go to Contact', 'Ke Bagian Kontak') } };
      case 'phpExperience':
        return { text: buildPhpReply(lang, data), action: null };
      default:
        if (relevantProject) {
          return {
            text: buildProjectDetailReply(lang, relevantProject),
            action: projectAction(lang, relevantProject)
          };
        }
        return { text: buildFallbackReply(lang), action: null };
    }
  }

  return { getResponse, detectLang };
})();
