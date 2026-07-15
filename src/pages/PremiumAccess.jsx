import React, { useState, useEffect } from 'react';
import { CheckCircle, Crown, CopySimple, Check, ShieldCheck, Wallet, Robot } from '@phosphor-icons/react';
import { api } from '../lib/api';

function PremiumAccess() {
  const [plans, setPlans] = useState([]);
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [orderResult, setOrderResult] = useState(null);
  const [orderingId, setOrderingId] = useState(null);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/api/plans'),
      api.get('/api/bots'),
    ]).then(([plansData, botsData]) => {
      setPlans(plansData.plans || []);
      setBots(botsData.bots || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const botName = (botId) => {
    const bot = bots.find(b => b.id === botId);
    return bot ? bot.bot_name : 'Unknown Bot';
  };

  const handleOrder = async (plan) => {
    setSelectedPlan(plan);
    setOrderingId(plan.id);
    try {
      const data = await api.post('/api/payments/create-order', { plan_id: plan.id });
      if (data.success) {
        setOrderResult(data.order);
      } else {
        alert('Gagal membuat order: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    } finally {
      setOrderingId(null);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  if (orderResult) {
    return (
      <div className="page-content animate-fade-in" style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 16px' }}>
        <div className="ref-card" style={{ padding: '40px', textAlign: 'center' }}>
          <Wallet size={48} weight="duotone" color="var(--text-primary)" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.8rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Instruksi Pembayaran</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Kirim USDC di jaringan <strong>Base</strong> ke alamat berikut
          </p>

          <div style={{ background: '#1c1917', borderRadius: '12px', padding: '16px', marginBottom: '16px', textAlign: 'left' }}>
            <div style={{ fontSize: '0.75rem', color: '#78716c', marginBottom: '8px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Alamat Wallet (Base Network)</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <code style={{ color: '#faf7f2', fontSize: '0.85rem', wordBreak: 'break-all' }}>{orderResult.wallet_address}</code>
              <button onClick={() => copyToClipboard(orderResult.wallet_address, 'wallet')} style={{ background: 'transparent', border: 'none', color: '#78716c', cursor: 'pointer', flexShrink: 0, padding: '4px' }}>
                {copied === 'wallet' ? <Check size={18} color="#22c55e" /> : <CopySimple size={18} />}
              </button>
            </div>
          </div>

          <div style={{ background: '#1c1917', borderRadius: '12px', padding: '16px', marginBottom: '16px', textAlign: 'left' }}>
            <div style={{ fontSize: '0.75rem', color: '#78716c', marginBottom: '8px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Jumlah</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <code style={{ color: '#faf7f2', fontSize: '1.2rem', fontWeight: 'bold' }}>{orderResult.price_usd} USDC</code>
              <button onClick={() => copyToClipboard(String(orderResult.price_usd), 'amount')} style={{ background: 'transparent', border: 'none', color: '#78716c', cursor: 'pointer', padding: '4px' }}>
                {copied === 'amount' ? <Check size={18} color="#22c55e" /> : <CopySimple size={18} />}
              </button>
            </div>
          </div>

          <div style={{ background: '#1c1917', borderRadius: '12px', padding: '16px', marginBottom: '24px', textAlign: 'left', border: '1px solid #f59e0b' }}>
            <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginBottom: '8px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontWeight: 'bold' }}>Memo / Catatan (WAJIB)</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <code style={{ color: '#faf7f2', fontSize: '1.4rem', fontWeight: 'bold', letterSpacing: '2px' }}>{orderResult.memo}</code>
              <button onClick={() => copyToClipboard(orderResult.memo, 'memo')} style={{ background: 'transparent', border: 'none', color: '#78716c', cursor: 'pointer', padding: '4px' }}>
                {copied === 'memo' ? <Check size={18} color="#22c55e" /> : <CopySimple size={18} />}
              </button>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '8px' }}>Sertikan memo ini di catatan transaksi agar pembayaran terdeteksi</div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '16px', marginBottom: '24px', textAlign: 'left', border: '1px dashed var(--border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>License Key (simpan ini!)</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <code style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: '1px' }}>{orderResult.license_key}</code>
              <button onClick={() => copyToClipboard(orderResult.license_key, 'key')} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
                {copied === 'key' ? <Check size={18} color="#22c55e" /> : <CopySimple size={18} />}
              </button>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Gunakan key ini di bot Telegram dengan perintah <code>/activate {'<key>'}</code></div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
            <button className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '0.95rem', justifyContent: 'center' }} onClick={() => { setOrderResult(null); setSelectedPlan(null); }}>
              Kembali ke Paket
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content animate-fade-in" style={{ padding: '40px 16px', maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 className="page-title animate-slide-up">Premium Access</h1>
        <p className="animate-slide-up delay-100" style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
          Pilih paket untuk bot atau produk yang kamu inginkan. Bayar dengan USDC, dapatkan license key.
        </p>

        <div className="animate-slide-up delay-200" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', padding: '8px 16px', borderRadius: '100px', marginTop: '16px', border: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <ShieldCheck weight="fill" size={16} /> Pembayaran via USDC di Base Network
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Memuat paket...</div>
      ) : plans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Belum ada paket tersedia.</div>
      ) : (
        <div className="cards-grid">
          {plans.map(plan => (
            <div key={plan.id} className="ref-card animate-slide-up" style={{ padding: '40px', textAlign: 'center' }}>
              <Robot size={40} weight="duotone" color="var(--text-primary)" style={{ marginBottom: '16px' }} />
              <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: '8px', textTransform: 'uppercase' }}>
                {botName(plan.bot_id)}
              </div>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '8px', color: 'var(--text-primary)' }}>{plan.name}</h2>
              <div style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>
                ${plan.price_usd} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: '400' }}>USDC</span>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                {plan.duration_days ? `${plan.duration_days} hari` : 'Lifetime'}
              </div>
              {plan.description && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>{plan.description}</p>
              )}
              <ul style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', color: 'var(--text-secondary)', listStyleType: 'none', padding: 0 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle weight="fill" color="var(--accent)" size={20} /> Akses penuh ke bot ini</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle weight="fill" color="var(--accent)" size={20} /> Update gratis</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle weight="fill" color="var(--accent)" size={20} /> Support via Telegram</li>
              </ul>
              <button
                className="btn-primary"
                disabled={ordering}
                onClick={() => handleOrder(plan)}
                style={{ width: '100%', fontSize: '1rem', padding: '14px', justifyContent: 'center' }}
              >
                {ordering ? 'Memproses...' : 'Beli Sekarang'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="animate-slide-up delay-300" style={{ marginTop: '64px', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.3rem', marginBottom: '24px', color: 'var(--text-primary)' }}>Cara Kerja</h3>
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { step: '01', title: 'Pilih Paket', desc: 'Pilih paket untuk bot yang kamu mau' },
            { step: '02', title: 'Bayar USDC', desc: 'Transfer USDC di Base Network dengan memo unik' },
            { step: '03', title: 'Dapatkan Key', desc: 'License key otomatis disiapkan untuk Anda' },
            { step: '04', title: 'Aktivasi Bot', desc: 'Ketik /activate <key> di bot Telegram' },
          ].map((item) => (
            <div key={item.step} style={{ flex: '1', minWidth: '180px', maxWidth: '200px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>{item.step}</div>
              <div style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{item.title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PremiumAccess;
