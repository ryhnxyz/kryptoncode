import React from 'react';
import { 
  TelegramLogo, 
  DiscordLogo, 
  WhatsappLogo, 
  InstagramLogo, 
  TwitterLogo, 
  Robot,
  Tag
} from '@phosphor-icons/react';

function Scripts() {
  const scripts = [
    {
      company: 'Telegram Auto-Responder',
      icon: <TelegramLogo weight="fill" />,
      level: 'medium',
      levelText: 'Medium 5/10',
      type: 'Bot Script',
      title: 'Auto-Responder Group Setup',
      desc: 'Bot untuk membalas pesan otomatis 24/7 di grup Telegram Anda dengan deteksi keyword dan delay natural.'
    },
    {
      company: 'Discord Tracker',
      icon: <DiscordLogo weight="fill" />,
      level: 'medium',
      levelText: 'Medium 5/10',
      type: 'Server Tool',
      title: 'Member Invite Tracker',
      desc: 'Lacak undangan dan member baru secara real-time. Berikan role otomatis kepada inviter teratas.'
    },
    {
      company: 'WhatsApp Blast',
      icon: <WhatsappLogo weight="fill" />,
      level: 'medium',
      levelText: 'Medium 5/10',
      type: 'API Script',
      title: 'WhatsApp Broadcast Pro',
      desc: 'Kirim pesan massal tanpa blokir dengan delay cerdas dan rotasi nomor untuk keamanan pengiriman.'
    },
    {
      company: 'IG Scraper',
      icon: <InstagramLogo weight="fill" />,
      level: 'high',
      levelText: 'High 8/10',
      type: 'Scraping Bot',
      title: 'Instagram Target Scraper',
      desc: 'Ambil data publik dari hashtag dan profil target secara massal, simpan langsung ke file CSV.'
    },
    {
      company: 'Twitter Auto-Like',
      icon: <TwitterLogo weight="fill" />,
      level: 'high',
      levelText: 'High 8/10',
      type: 'Engagement Bot',
      title: 'Twitter Engagement Bot',
      desc: 'Bot pintar untuk melakukan like, retweet, dan reply secara otomatis pada hashtag tertentu.'
    },
    {
      company: 'Selenium Automator',
      icon: <Robot weight="fill" />,
      type: 'Browser Tool',
      title: 'Web Flow Automator',
      desc: 'Template Selenium Python untuk mengotomatisasi klik, login, dan pengisian form di berbagai website.'
    }
  ];

  return (
    <div className="page-content">
      <h1 className="page-title">Koleksi Script Bot</h1>
      
      <div className="cards-grid">
        {scripts.map((item, idx) => (
          <div key={idx} className="ref-card">
            <div className="ref-card-header">
              <div className="ref-card-logo">
                <div className="ref-card-icon">{item.icon}</div>
                {item.company}
              </div>
            </div>
            
            <div className="ref-info-blocks">
              <div className="ref-info-box" style={{ flex: 'none', width: 'fit-content', paddingRight: '20px' }}>
                <div className="ref-info-label">
                  <Tag weight="bold" size={14} />
                  Tipe
                </div>
                <div className="ref-info-value">{item.type}</div>
              </div>
            </div>
            
            <h3 className="ref-card-title">{item.title}</h3>
            <p className="ref-card-desc">{item.desc}</p>
            
            <div className="ref-card-actions">
              <button className="btn-light">Lihat detail</button>
              <button className="btn-dark">Buka</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Scripts;
