import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Lightning, ArrowLeft, Copy, Check, Wallet } from '@phosphor-icons/react';
import QRCode from 'qrcode';
import { api } from '../lib/api';

export default function BuyAccess() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState('pending');
  const [seed, setSeed] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [qrData, setQrData] = useState(null);

  useEffect(() => {
    api.get('/api/plans').then(data => {
      const found = (data.plans || []).find(p => p.id === planId);
      if (found) {
        setPlan(found);
        const saved = localStorage.getItem(`order_${planId}`);
        if (saved) {
          fetchOrder(saved);
        } else {
          createOrder(found.id);
        }
      } else {
        setError('Plan not found');
      }
      setLoading(false);
    }).catch(() => {
      setError('Failed to load plan');
      setLoading(false);
    });
  }, [planId]);

  const fetchOrder = async (orderId) => {
    try {
      const data = await api.get(`/api/payments/order/${orderId}`);
      if (data.order) {
        setOrder(data.order);
        if (data.order.status === 'confirmed') {
          setStatus('confirmed');
        } else {
          startPolling(orderId);
        }
      }
    } catch {
      sessionStorage.removeItem(`order_${planId}`);
      createOrder(planId);
    }
  };

  const createOrder = async (pid) => {
    setCreating(true);
    try {
      const data = await api.post('/api/payments/create-order', { plan_id: pid });
      if (data.order) {
        setOrder(data.order);
        sessionStorage.setItem(`order_${pid}`, data.order.id);
        const qrString = data.order.wallet_address;
        const qr = await QRCode.toDataURL(qrString, { width: 240, margin: 1 });
        setQrData(qr);
        startPolling(data.order.id);
      }
    } catch (err) {
      setError(err.message);
    }
    setCreating(false);
  };

  const startPolling = (orderId) => {
    const interval = setInterval(async () => {
      try {
        const data = await api.get(`/api/payments/check-payment/${orderId}`);
        if (data.status === 'confirmed') {
          setStatus('confirmed');
          setSeed(data.seed || null);
          setLicenseKey(data.license_key || null);
          clearInterval(interval);
        } else if (data.status === 'expired') {
          setStatus('expired');
          clearInterval(interval);
        }
      } catch {}
    }, 10000);
  };

  const copyAddress = () => {
    if (order?.wallet_address) {
      navigator.clipboard.writeText(order.wallet_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="page-content" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <p style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</p>
        <button className="btn-light" onClick={() => navigate('/premium')}>Back to plans</button>
      </div>
    );
  }

  if (status === 'confirmed' && licenseKey) {
    return (
      <div className="page-content" style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 20px' }}>
        <div className="ref-card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', margin: '0 auto 24px', background: 'rgba(34,197,94,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={32} weight="bold" color="#22c55e" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', marginBottom: '8px' }}>Payment Confirmed</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Your license key is ready</p>
          
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px dashed var(--border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>LICENSE KEY</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, letterSpacing: '1px' }}>{licenseKey}</div>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Redeem this key to get your Krypton Seed (8 words) for login.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn-light" onClick={() => navigate('/premium')}>Redeem Key</button>
            {plan?.bot_id && (
              <a href="https://awdex.kryptoncode.xyz" target="_blank" rel="noopener noreferrer">
                <button className="btn-dark" style={{ borderRadius: '100px', padding: '10px 24px' }}>Go to AWDEX</button>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 20px' }}>
      <button onClick={() => navigate('/premium')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '24px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <ArrowLeft size={16} /> back
      </button>

      <div className="ref-card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Lightning size={28} weight="fill" />
          <div>
            <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem' }}>{plan?.name || 'Access'}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{plan?.duration_days} day access</p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 800 }}>${plan?.price_usd}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>USDC Base</div>
          </div>
        </div>

        {creating ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Creating order...</div>
        ) : order ? (
          <>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Wallet size={16} weight="bold" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600 }}>SEND USDC ON BASE NETWORK</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>WALLET ADDRESS</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', wordBreak: 'break-all', flex: 1 }}>{order.wallet_address}</code>
                <button onClick={copyAddress} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                </button>
              </div>
              <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>EXACT AMOUNT</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                ${order.amount_usd} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 400 }}>USDC</span>
              </div>
              <div style={{ marginTop: '6px', fontSize: '0.7rem', color: '#ef4444', fontFamily: 'var(--font-mono)' }}>
                wajib transfer jumlah PERSIS — tidak boleh kurang atau lebih
              </div>
            </div>

            {qrData && (
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <img src={qrData} alt="Payment QR" style={{ borderRadius: '12px', maxWidth: '220px', width: '100%', display: 'block', margin: '0 auto' }} />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>scan — auto-fills address + exact amount on Base</p>
              </div>
            )}

            <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(245,158,11,0.05)', borderRadius: '12px', border: '1px dashed rgba(245,158,11,0.3)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', animation: 'pulse 2s infinite' }} />
                Waiting for payment...
              </div>
              <p style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Transfer <strong style={{ color: 'var(--text-primary)' }}>${order.amount_usd} USDC</strong> exactly. No rounding.
              </p>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Failed to create order</div>
        )}
      </div>
    </div>
  );
}
