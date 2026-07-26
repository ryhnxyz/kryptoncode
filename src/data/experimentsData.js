// ─────────────────────────────────────────────────────────────────────────────
// Katalog Krypton Lab — berbentuk PERPUSTAKAAN (library).
// Semua entri di bawah masih PLACEHOLDER — ganti/tambah lewat file ini saja.
//
// Struktur satu item:
//   id          : id unik internal
//   slug        : dipakai di URL halaman detail → /experiment/<slug>
//   category    : salah satu id dari experimentCategories di bawah
//   status      : 'live' | 'wip' | 'archived'
//   year        : label tahun di kartu
//   tags        : label kecil di kartu & halaman detail
//   desc_id/_en : deskripsi singkat (kartu + halaman detail)
//   preview     : path/URL gambar cover (null = placeholder pattern otomatis)
//                 contoh: '/experiments/krypton-poster-001/cover.png' (taruh di /public)
//   previewUrl  : link "Live Preview" di halaman detail (null = tombol nonaktif)
//   downloadUrl : link unduh aset/file (null = tombol nonaktif)
//   prompt      : prompt yang dipakai membuat karya ini (null = blok prompt disembunyikan)
// ─────────────────────────────────────────────────────────────────────────────

// Kategori rak perpustakaan. `soon: true` = rak terkunci (belum dibuka).
export const experimentCategories = [
  { id: 'design', soon: false },
  { id: 'motion', soon: false },
  { id: 'audio', soon: false },
  { id: 'tooling', soon: false },
];

export const experimentsData = [
  // ── DESIGN ─────────────────────────────────────────────────────────────────
  {
    id: 'exp-d01',
    slug: 'lab-welcome-choreography',
    title: 'Lab Welcome Choreography',
    category: 'design',
    status: 'live',
    year: '2026',
    tags: ['splash', 'framer-motion'],
    desc_id:
      'Layar pembuka Krypton Lab bergaya labs.google — blob organik monokrom mekar di sekitar brand, menahan sejenak, lalu berpencar menyerahkan layar ke katalog.',
    desc_en:
      'The labs.google-style opening for Krypton Lab — monochrome organic blobs bloom around the brand, hold a beat, then drift apart handing the screen to the catalog.',
    preview: null,
    previewUrl: 'https://www.kryptoncode.xyz/experiment?intro=1',
    downloadUrl: null,
    prompt:
      'Design a cinematic welcome screen in the spirit of labs.google: five monochrome organic blobs blooming around a centered wordmark on a warm paper canvas, a thin HUD frame with "KRYPTON — LAB" and the year, a timed progress line, then an exit where every blob drifts to its own corner while the copy lifts away. Palette: krypton dark #08090b on cream #e9e5de. Easing [0.16, 1, 0.3, 1].',
  },
  {
    id: 'exp-d02',
    slug: 'krypton-poster-001',
    title: 'Krypton Poster — 001',
    category: 'design',
    status: 'wip',
    year: '2026',
    tags: ['poster', 'identity'],
    desc_id:
      'Studi poster identitas: wordmark KryptonCode dirender ulang sebagai grid titik dot-matrix di atas kanvas gelap, dengan denyut cahaya yang berjalan.',
    desc_en:
      'An identity poster study: the KryptonCode wordmark re-rendered as a dot-matrix grid on a dark canvas, with a traveling pulse of light.',
    preview: null,
    previewUrl: null,
    downloadUrl: null,
    prompt:
      'A minimal tech poster on a near-black canvas (#08090b): the word "KRYPTON" sampled into a dot-matrix grid, cream dots (#faf7f2) with a single green pulse wave traveling through, generous margins, small mono captions in the corners — index number, year, "KRYPTON / LAB". Print-ready, 3:4.',
  },
  {
    id: 'exp-d03',
    slug: 'dot-grid-wallpaper-pack',
    title: 'Dot Grid Wallpaper Pack',
    category: 'design',
    status: 'live',
    year: '2026',
    tags: ['wallpaper', '4k'],
    desc_id:
      'Paket wallpaper desktop & mobile dari sistem dot-grid Krypton — varian gelap, terang, dan aksen hijau. Siap unduh saat file diunggah.',
    desc_en:
      'Desktop & mobile wallpaper pack built from the Krypton dot-grid system — dark, light, and green-accent variants. Downloadable once files are uploaded.',
    preview: null,
    previewUrl: null,
    downloadUrl: null,
    prompt:
      'A calm engineering-desk wallpaper: a faint dot grid over #08090b, one corner holding a tiny mono label "kryptoncode — lab", one dot glowing green (#22c55e) like a status light. Variants: 4K desktop (16:9), phone (9:19.5), light mode on #e9e5de.',
  },
  {
    id: 'exp-d04',
    slug: 'hero-typography-study',
    title: 'Hero Typography Study',
    category: 'design',
    status: 'archived',
    year: '2025',
    tags: ['typography', 'layout'],
    desc_id:
      'Eksplorasi awal tipografi hero situs — pairing Clash Display × Geist Mono, skala, dan ritme spasi sebelum arah final dipilih.',
    desc_en:
      'Early explorations of the site hero typography — Clash Display × Geist Mono pairing, scale, and spacing rhythm before the final direction was chosen.',
    preview: null,
    previewUrl: null,
    downloadUrl: null,
    prompt:
      'Explore 6 hero lockups for a dev-studio landing page: oversized display headline (Clash Display), tiny mono kicker in brackets, index numbers as hairline-stroked ghosts, cream on near-black. Keep one accent only. Grid: 12-col, generous top offset for a floating pill navbar.',
  },

  // ── MOTION ─────────────────────────────────────────────────────────────────
  {
    id: 'exp-001',
    slug: 'dot-matrix-engine',
    title: 'Dot Matrix Engine',
    category: 'motion',
    status: 'live',
    year: '2026',
    tags: ['canvas', 'motion'],
    desc_id:
      'Mesin render teks dot-matrix yang dipakai di marquee situs ini — sampling piksel jadi grid titik dengan gelombang denyut.',
    desc_en:
      'The dot-matrix text renderer behind this site’s marquee — pixel sampling into a dot grid with a traveling pulse wave.',
    preview: null,
    previewUrl: null,
    downloadUrl: null,
    prompt: null,
  },

  // ── AUDIO ──────────────────────────────────────────────────────────────────
  {
    id: 'exp-002',
    slug: 'signal-playground',
    title: 'Signal Playground',
    category: 'audio',
    status: 'wip',
    year: '2026',
    tags: ['audio', 'webgl'],
    desc_id:
      'Eksperimen visualisasi sinyal real-time: spectrum, waveform, dan partikel yang bereaksi terhadap input suara.',
    desc_en:
      'Real-time signal visualization experiments: spectrum, waveform, and particles reacting to audio input.',
    preview: null,
    previewUrl: null,
    downloadUrl: null,
    prompt: null,
  },

  // ── TOOLING ────────────────────────────────────────────────────────────────
  {
    id: 'exp-003',
    slug: 'voice-spectrum-bot',
    title: 'Voice Spectrum Bot',
    category: 'tooling',
    status: 'wip',
    year: '2026',
    tags: ['telegram', 'ai'],
    desc_id:
      'Bot Telegram yang mengubah pesan suara jadi ringkasan teks plus visual spectrum sebagai gambar balasan.',
    desc_en:
      'A Telegram bot that turns voice notes into text summaries plus a spectrum visual as the reply image.',
    preview: null,
    previewUrl: null,
    downloadUrl: null,
    prompt: null,
  },
  {
    id: 'exp-004',
    slug: 'auto-poster-lab',
    title: 'Auto Poster Lab',
    category: 'tooling',
    status: 'archived',
    year: '2025',
    tags: ['automation'],
    desc_id:
      'Uji coba pipeline poster otomatis: template dinamis diisi data lalu dirender jadi gambar siap unggah.',
    desc_en:
      'Automated poster pipeline trial: dynamic templates filled with data and rendered into ready-to-post images.',
    preview: null,
    previewUrl: null,
    downloadUrl: null,
    prompt: null,
  },
  {
    id: 'exp-005',
    slug: 'latency-probe',
    title: 'Latency Probe',
    category: 'tooling',
    status: 'live',
    year: '2026',
    tags: ['infra', 'monitoring'],
    desc_id:
      'Probe kecil untuk memetakan latensi endpoint AI Pool dari beberapa region secara berkala.',
    desc_en:
      'A small probe mapping AI Pool endpoint latency from multiple regions on a schedule.',
    preview: null,
    previewUrl: null,
    downloadUrl: null,
    prompt: null,
  },
  {
    id: 'exp-006',
    slug: 'prompt-bench',
    title: 'Prompt Bench',
    category: 'tooling',
    status: 'wip',
    year: '2026',
    tags: ['ai', 'tooling'],
    desc_id:
      'Meja uji prompt: bandingkan beberapa model dan konfigurasi berdampingan dengan skor cepat.',
    desc_en:
      'A prompt workbench: compare multiple models and configs side by side with quick scoring.',
    preview: null,
    previewUrl: null,
    downloadUrl: null,
    prompt: null,
  },
];

// Helper kecil — dipakai halaman library & detail.
export const getExperimentBySlug = (slug) =>
  experimentsData.find((e) => e.slug === slug) || null;

export const getCategoryCount = (categoryId) =>
  experimentsData.filter((e) => e.category === categoryId).length;
