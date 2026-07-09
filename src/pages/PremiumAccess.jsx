import React from 'react';
import { CheckCircle } from '@phosphor-icons/react';

function PremiumAccess() {
  return (
    <main className="hero-section" style={{ marginTop: '80px', paddingBottom: '40px' }}>
      <h1 className="hero-title" style={{ fontSize: '3.5rem', marginBottom: '16px' }}>
        Premium <span className="highlight">Access</span>
      </h1>
      <p className="hero-subtitle">
        Buka kunci semua limitasi. Akses seluruh koleksi script VIP kami.
      </p>
      
      <div className="ref-card" style={{ maxWidth: '400px', marginTop: '40px', alignItems: 'center' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Lifetime Pass</h2>
        <div style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '24px', color: 'var(--text-primary)' }}>
          $99 <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/sekali bayar</span>
        </div>
        <ul style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', color: 'var(--text-secondary)', listStyleType: 'none', padding: 0 }}>
          <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle weight="fill" color="var(--accent)" size={20} /> Akses ke semua script saat ini</li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle weight="fill" color="var(--accent)" size={20} /> Update script gratis selamanya</li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle weight="fill" color="var(--accent)" size={20} /> Prioritas support via Telegram</li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle weight="fill" color="var(--accent)" size={20} /> Request script kustom (diskon 50%)</li>
        </ul>
        <div className="ref-card-actions" style={{ width: '100%' }}>
          <button className="btn-dark" style={{ width: '100%', fontSize: '1rem', padding: '14px' }}>Beli Sekarang</button>
        </div>
      </div>
    </main>
  );
}

export default PremiumAccess;
