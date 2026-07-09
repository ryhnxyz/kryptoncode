import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  return (
    <main className="hero-section">
      <h1 className="hero-title animate-slide-up">
        Solusi <span className="highlight">otomatisasi</span> cerdas<br/>
        biar kerjamu makin santai.
      </h1>
      
      <p className="hero-subtitle animate-slide-up delay-100">
        Kryptoncode hadir bantu ngurusin tugas berulang kamu. Temukan berbagai script bot untuk Telegram, Discord, dan Web yang simpel, super cepat, dan siap pakai!
      </p>
      
      <div className="hero-actions animate-slide-up delay-200">
        <button className="btn-primary" onClick={() => navigate('/products')}>cd ./products</button>
        <a href="https://t.me/kryptoncodes" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <button className="btn-secondary">cat /telegram</button>
        </a>
      </div>
    </main>
  );
}

export default Home;
