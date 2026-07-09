import React from 'react';
import { ArrowUpRight } from '@phosphor-icons/react';

function Community() {
  return (
    <main className="hero-section" style={{ marginTop: '80px', paddingBottom: '40px' }}>
      <h1 className="hero-title animate-slide-up" style={{ fontSize: '3.5rem', marginBottom: '16px' }}>
        Join the <span className="highlight">Community</span>
      </h1>
      <p className="hero-subtitle animate-slide-up delay-100">
        Bergabung dengan ribuan pengembang dan otomatisator lainnya di channel Telegram kami.
      </p>
      
      <div className="ref-card-actions animate-slide-up delay-200" style={{ marginTop: '40px' }}>
        <a href="https://t.me/kryptoncodes" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <button className="btn-dark" style={{ fontSize: '1rem', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Buka Telegram <ArrowUpRight weight="bold" size={18} />
          </button>
        </a>
      </div>
    </main>
  );
}

export default Community;
