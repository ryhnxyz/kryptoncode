import React from 'react';
import { ArrowUpRight } from '@phosphor-icons/react';

function Community() {
  return (
    <main className="hero-section" style={{ marginTop: '80px', paddingBottom: '40px' }}>
      <h1 className="hero-title" style={{ fontSize: '3.5rem', marginBottom: '16px' }}>
        Join the <span className="highlight">Community</span>
      </h1>
      <p className="hero-subtitle">
        Bergabung dengan ribuan pengembang dan otomatisator lainnya di channel Telegram kami.
      </p>
      
      <div className="ref-card-actions" style={{ marginTop: '40px' }}>
        <button className="btn-dark" style={{ fontSize: '1rem', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Buka Telegram <ArrowUpRight weight="bold" size={18} />
        </button>
      </div>
    </main>
  );
}

export default Community;
