import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  return (
    <main className="hero-section">
      <h1 className="hero-title">
        Solusi <span className="highlight">otomatisasi</span> cerdas<br/>
        biar kerjamu makin santai.
      </h1>
      
      <p className="hero-subtitle">
        Kryptoncode hadir bantu ngurusin tugas berulang kamu. Temukan berbagai script bot untuk Telegram, Discord, dan Web yang simpel, super cepat, dan siap pakai!
      </p>
      
      <div className="hero-actions">
        <button className="btn-primary" onClick={() => navigate('/scripts')}>cd ./scripts</button>
        <button className="btn-secondary">cat /telegram</button>
      </div>
    </main>
  );
}

export default Home;
