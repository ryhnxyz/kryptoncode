import React from 'react';
import { 
  TelegramLogo, 
  DiscordLogo, 
  WhatsappLogo, 
  InstagramLogo, 
  TwitterLogo, 
  Robot
} from '@phosphor-icons/react';

export const productsData = [
  {
    id: 'tg-auto-responder',
    company: 'Telegram Auto-Responder',
    icon: <TelegramLogo weight="fill" />,
    type: 'Bot Automation',
    title: 'Auto-Responder Group Setup',
    desc: 'Bot untuk membalas pesan otomatis 24/7 di grup Telegram Anda dengan deteksi keyword dan delay natural.',
    features: ['Deteksi Keyword Pintar', 'Anti-Spam Filter', 'Log Aktivitas Grup', 'Bisa dijalankan di VPS 1GB'],
    projectLink: 'https://t.me/kryptoncodes'
  },
  {
    id: 'dc-invite-tracker',
    company: 'Discord Tracker',
    icon: <DiscordLogo weight="fill" />,
    type: 'Server Tool',
    title: 'Member Invite Tracker',
    desc: 'Lacak undangan dan member baru secara real-time. Berikan role otomatis kepada inviter teratas.',
    features: ['Real-time Tracking', 'Role Otomatis', 'Sistem Leaderboard', 'Mencegah Fake Invites'],
    projectLink: 'https://discord.com/'
  },
  {
    id: 'wa-blast-pro',
    company: 'WhatsApp Blast',
    icon: <WhatsappLogo weight="fill" />,
    type: 'API Service',
    title: 'WhatsApp Broadcast Pro',
    desc: 'Kirim pesan massal tanpa blokir dengan delay cerdas dan rotasi nomor untuk keamanan pengiriman.',
    features: ['Anti-Banned Delay System', 'Multi-Session Support', 'Impor dari CSV/Excel', 'Kirim Gambar/Video'],
    projectLink: '#'
  },
  {
    id: 'ig-target-scraper',
    company: 'IG Scraper',
    icon: <InstagramLogo weight="fill" />,
    type: 'Data Extractor',
    title: 'Instagram Target Scraper',
    desc: 'Ambil data publik dari hashtag dan profil target secara massal, simpan langsung ke file CSV.',
    features: ['Scrape Berdasarkan Hashtag', 'Extract Username & Bio', 'Simpan Otomatis ke CSV', 'Support Proxy Rotator'],
    projectLink: '#'
  },
  {
    id: 'tw-engagement-bot',
    company: 'Twitter Auto-Like',
    icon: <TwitterLogo weight="fill" />,
    type: 'Engagement Bot',
    title: 'Twitter Engagement Bot',
    desc: 'Bot pintar untuk melakukan like, retweet, dan reply secara otomatis pada hashtag tertentu.',
    features: ['Auto-Retweet by Keyword', 'Randomized Delay Interval', 'Custom Auto-Reply List', 'Bypass Rate Limits'],
    projectLink: '#'
  },
  {
    id: 'web-flow-automator',
    company: 'Selenium Automator',
    icon: <Robot weight="fill" />,
    type: 'Browser Tool',
    title: 'Web Flow Automator',
    desc: 'Template Selenium Python untuk mengotomatisasi klik, login, dan pengisian form di berbagai website.',
    features: ['Headless Browser Support', 'Bypass Captcha Sederhana', 'Manajemen Cookies', 'Laporan Gagal/Sukses'],
    projectLink: '#'
  }
];
