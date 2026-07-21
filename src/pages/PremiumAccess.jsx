import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Crown, CopySimple, Check, ShieldCheck, Wallet, Robot, QrCode, Spinner } from '@phosphor-icons/react';
import { api, API_BASE } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';

export default function PremiumAccess() {
  const { t } = useLanguage();
  const [plans, setPlans] = useState([]);
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [orderResult, setOrderResult] = useState(null);
  const [orderingId, setOrderingId] = useState(null);
  const [copied, setCopied] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [polling, setPolling] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    Promise.all([
      api.get('/api/plans'),
      api.get('/api/bots/public'),
    ]).then(([plansData, botsData]) => {
      setPlans(plansData.plans || []);
      setBots(botsData.bots || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const startPolling = (orderId) => {
    setPolling(true);
    setPaymentStatus('pending');
    
    pollRef.current = setInterval(async () => {
      try {
        const data = await api.get(`/api/payments/check-payment/${orderId}`);
        if (data.success && data.status === 'confirmed') {
          setPaymentStatus('confirmed');
          setPolling(false);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {}
    }, 10000);
  };

  const botName = (botId) => {
    const bot = bots.find(b => b.id === botId);
    return bot ? bot.bot_name : t('common.unknownBot');
  };

  const handleOrder = async (plan) => {
    setSelectedPlan(plan);
    setOrderingId(plan.id);
    try {
      const data = await api.post('/api/payments/create-order', { plan_id: plan.id });
      if (data.success) {
        setOrderResult(data.order);
        startPolling(data.order.id);
      } else {
        alert(t('premium.errorCreate') + (data.error || t('premium.unknownError')));
      }
    } catch (err) {
      alert(t('premium.errorNetwork') + err.message);
    } finally {
      setOrderingId(null);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const qrData = orderResult
    ? `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220">
          <rect width="220" height="220" fill="#1c1917" rx="16"/>
          <text x="110" y="40" text-anchor="middle" fill="#f59e0b" font-size="11" font-family="monospace" font-weight="bold">USDC BASE</text>
          <text x="110" y="120" text-anchor="middle" fill="#faf7f2" font-size="9" font-family="monospace">${orderResult.wallet_address.slice(0, 10)}...${orderResult.wallet_address.slice(-8)}</text>
          <text x="110" y="150" text-anchor="middle" fill="#22c55e" font-size="20" font-family="monospace" font-weight="bold">${orderResult.price_usd} USDC</text>
          <text x="110" y="180" text-anchor="middle" fill="#f59e0b" font-size="14" font-family="monospace" font-weight="bold">MEMO: ${orderResult.memo}</text>
          <text x="110" y="205" text-anchor="middle" fill="#78716c" font-size="8" font-family="monospace">${t('premium.qrWalletHint')}</text>
        </svg>`
      )}`
    : null;

  if (orderResult) {
    return (
      <div className="page-content animate-fade-in" style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 16px' }}>
        {paymentStatus === 'confirmed' && (
          <div style={{ background: '#16241c', border: '1px solid #22c55e', borderRadius: '16px', padding: '24px', marginBottom: '24px', textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <CheckCircle size={40} weight="fill" color="#22c55e" style={{ marginBottom: '8px' }} />
            <h3 style={{ color: '#22c55e', fontSize: '1.2rem', marginBottom: '8px' }}>{t('premium.confirmed')}</h3>
            <p style={{ color: '#86efac', fontSize: '0.85rem' }}>{t('premium.confirmedDesc')}</p>
          </div>
        )}

        <div className="ref-card" style={{ padding: '40px', textAlign: 'center' }}>
          <Wallet size={48} weight="duotone" color="var(--text-primary)" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.8rem', marginBottom: '8px', color: 'var(--text-primary)' }}>{t('premium.instruction')}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            {t('premium.instructionDesc')}
          </p>

          {qrData && (
            <div style={{ marginBottom: '24px' }}>
              <img src={qrData} alt={t('common.paymentQr')} style={{ borderRadius: '12px', maxWidth: '220px', width: '100%' }} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>{t('premium.scanDesc')}</p>
            </div>
          )}

          <div style={{ background: '#1c1917', borderRadius: '12px', padding: '16px', marginBottom: '16px', textAlign: 'left' }}>
            <div style={{ fontSize: '0.75rem', color: '#78716c', marginBottom: '8px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{t('premium.walletLabel')}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <code style={{ color: '#faf7f2', fontSize: '0.85rem', wordBreak: 'break-all' }}>{orderResult.wallet_address}</code>
              <button onClick={() => copyToClipboard(orderResult.wallet_address, 'wallet')} style={{ background: 'transparent', border: 'none', color: '#78716c', cursor: 'pointer', flexShrink: 0, padding: '4px' }}>
                {copied === 'wallet' ? <Check size={18} color="#22c55e" /> : <CopySimple size={18} />}
              </button>
            </div>
          </div>

          <div style={{ background: '#1c1917', borderRadius: '12px', padding: '16px', marginBottom: '16px', textAlign: 'left' }}>
            <div style={{ fontSize: '0.75rem', color: '#78716c', marginBottom: '8px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{t('premium.amountLabel')}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <code style={{ color: '#faf7f2', fontSize: '1.2rem', fontWeight: 'bold' }}>{orderResult.price_usd} USDC</code>
              <button onClick={() => copyToClipboard(String(orderResult.price_usd), 'amount')} style={{ background: 'transparent', border: 'none', color: '#78716c', cursor: 'pointer', padding: '4px' }}>
                {copied === 'amount' ? <Check size={18} color="#22c55e" /> : <CopySimple size={18} />}
              </button>
            </div>
          </div>

          <div style={{ background: '#1c1917', borderRadius: '12px', padding: '16px', marginBottom: '24px', textAlign: 'left', border: '1px solid #f59e0b' }}>
            <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginBottom: '8px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontWeight: 'bold' }}>{t('premium.memoLabel')}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <code style={{ color: '#faf7f2', fontSize: '1.4rem', fontWeight: 'bold', letterSpacing: '2px' }}>{orderResult.memo}</code>
              <button onClick={() => copyToClipboard(orderResult.memo, 'memo')} style={{ background: 'transparent', border: 'none', color: '#78716c', cursor: 'pointer', padding: '4px' }}>
                {copied === 'memo' ? <Check size={18} color="#22c55e" /> : <CopySimple size={18} />}
              </button>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '8px' }}>{t('premium.memoDesc')}</div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '16px', marginBottom: '24px', textAlign: 'left', border: paymentStatus === 'confirmed' ? '1px solid #22c55e' : '1px dashed var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{t('premium.keyLabel')}</span>
              {polling && (
                <span style={{ fontSize: '0.75rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Spinner size={12} /> {t('premium.waiting')}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <code style={{ color: paymentStatus === 'confirmed' ? '#22c55e' : 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: '1px' }}>{orderResult.license_key}</code>
              <button onClick={() => copyToClipboard(orderResult.license_key, 'key')} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
                {copied === 'key' ? <Check size={18} color="#22c55e" /> : <CopySimple size={18} />}
              </button>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
              {paymentStatus === 'confirmed' 
                ? <span style={{ color: '#22c55e' }}>{t('premium.keyActive')}{orderResult.license_key}{t('premium.inBot')}</span>
                : <>{t('premium.keyPending')}</>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
            <button className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '0.95rem', justifyContent: 'center' }} onClick={() => { setOrderResult(null); setSelectedPlan(null); setPaymentStatus('pending'); if (pollRef.current) clearInterval(pollRef.current); }}>
              {t('premium.backToPlans')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content animate-fade-in" style={{ padding: '40px 16px', maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 className="page-title animate-slide-up">{t('premium.title')}</h1>
        <p className="animate-slide-up delay-100" style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
          {t('premium.subtitle')}
        </p>

        <div className="animate-slide-up delay-200" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', padding: '8px 16px', borderRadius: '100px', marginTop: '16px', border: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <ShieldCheck weight="fill" size={16} /> {t('premium.paymentNetwork')}
        </div>
      </div>

      {loading ? (
        <div className="cards-grid">
          {[1, 2, 3].map((n) => (
            <div key={n} className="ref-card" style={{ padding: '40px', textAlign: 'center', boxShadow: 'none', borderColor: 'transparent' }}>
              <div className="skeleton skeleton-icon" />
              <div className="skeleton skeleton-text" style={{ width: '40%', margin: '0 auto 8px auto' }} />
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-title" style={{ height: '48px', marginBottom: '24px' }} />
              <div className="skeleton skeleton-text" style={{ width: '80%', margin: '0 auto 32px auto' }} />
              <div className="skeleton skeleton-btn" />
            </div>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>{t('premium.noPlans')}</div>
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
                {plan.duration_days ? `${plan.duration_days} ${t('premium.days')}` : t('premium.lifetime')}
              </div>
              {plan.description && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>{plan.description}</p>
              )}
              <ul style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', color: 'var(--text-secondary)', listStyleType: 'none', padding: 0 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle weight="fill" color="var(--accent)" size={20} /> {t('premium.featAccess')}</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle weight="fill" color="var(--accent)" size={20} /> {t('premium.featUpdate')}</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle weight="fill" color="var(--accent)" size={20} /> {t('premium.featSupport')}</li>
              </ul>
              <button
                className="btn-primary"
                disabled={orderingId === plan.id}
                onClick={() => handleOrder(plan)}
                style={{ width: '100%', fontSize: '1rem', padding: '14px', justifyContent: 'center' }}
              >
                {orderingId === plan.id ? t('premium.processing') : t('premium.buyNow')}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="animate-slide-up delay-300" style={{ marginTop: '64px', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.3rem', marginBottom: '24px', color: 'var(--text-primary)' }}>{t('premium.howItWorks')}</h3>
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { step: '01', title: t('premium.step1Title'), desc: t('premium.step1Desc') },
            { step: '02', title: t('premium.step2Title'), desc: t('premium.step2Desc') },
            { step: '03', title: t('premium.step3Title'), desc: t('premium.step3Desc') },
            { step: '04', title: t('premium.step4Title'), desc: t('premium.step4Desc') },
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
