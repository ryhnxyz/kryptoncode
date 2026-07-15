import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Lightning, Copy, Check, Wallet, ArrowsClockwise, Spinner } from '@phosphor-icons/react';
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
  const [licenseKey, setLicenseKey] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [checking, setChecking] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    api.get('/api/plans').then(data => {
      const found = (data.plans || []).find(p => p.id === planId);
      if (found) {
        setPlan(found);
        const saved = localStorage.getItem(`order_${planId}`);
        if (saved) {
          restoreOrder(saved);
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
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [planId]);

  const restoreOrder = async (orderId) => {
    try {
      const data = await api.get(`/api/payments/order/${orderId}`);
      if (data.order) {
        setOrder(data.order);
        const qr = await QRCode.toDataURL(data.order.wallet_address, { width: 240, margin: 1 });
        setQrData(qr);
        if (data.order.status === 'confirmed') {
          setStatus('confirmed');
          checkSeed(orderId);
          localStorage.removeItem(`order_${planId}`);
        } else if (data.order.status === 'expired') {
          localStorage.removeItem(`order_${planId}`);
          setStatus('expired');
        } else {
          startPolling(orderId);
        }
      }
    } catch {
      localStorage.removeItem(`order_${planId}`);
      setStatus('expired');
    }
  };

  const createOrder = async (pid) => {
    setCreating(true);
    setError(null);
    try {
      const data = await api.post('/api/payments/create-order', { plan_id: pid });
      if (data.order) {
        setOrder(data.order);
        localStorage.setItem(`order_${pid}`, data.order.id);
        const qr = await QRCode.toDataURL(data.order.wallet_address, { width: 240, margin: 1 });
        setQrData(qr);
        startPolling(data.order.id);
      }
    } catch (err) {
      setError(err.message || 'Failed to create order');
    }
    setCreating(false);
  };

  const startPolling = (orderId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    const check = async () => {
      try {
        const data = await api.get(`/api/payments/check-payment/${orderId}`);
        if (data.status === 'confirmed') {
          setStatus('confirmed');
          if (data.seed) setSeed(data.seed);
          if (data.license_key) setLicenseKey(data.license_key);
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (data.status === 'expired') {
          setStatus('expired');
          localStorage.removeItem(`order_${planId}`);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {}
    };
    check();
    pollRef.current = setInterval(check, 5000);
  };

  const manualCheck = async () => {
    if (!order) return;
    setChecking(true);
    try {
      const data = await api.get(`/api/payments/check-payment/${order.id}`);
      if (data.status === 'confirmed') {
        setStatus('confirmed');
        if (data.seed) setSeed(data.seed);
        if (data.license_key) setLicenseKey(data.license_key);
        localStorage.removeItem(`order_${planId}`);
        if (pollRef.current) clearInterval(pollRef.current);
      } else if (data.status === 'expired') {
        setStatus('expired');
        localStorage.removeItem(`order_${planId}`);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch {}
    setChecking(false);
  };

  const checkSeed = async (orderId) => {
    try {
      const data = await api.get(`/api/payments/check-payment/${orderId}`);
      if (data.seed) setSeed(data.seed);
      if (data.license_key) setLicenseKey(data.license_key);
    } catch {}
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
      </div>
    );
  }

  if (status === 'confirmed' && seed) {
    return (
      <div className="page-content" style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 20px' }}>
        <div className="ref-card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', margin: '0 auto 24px', background: 'rgba(34,197,94,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={32} weight="bold" color="#22c55e" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', marginBottom: '8px' }}>Payment Confirmed</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Save your Krypton Seed below</p>

          <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '24px', marginBottom: '24px', border: '2px dashed var(--green)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '12px', fontFamily: 'var(--font-mono)' }}>KRYPTON SEED (8 WORDS)</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, lineHeight: 2, color: 'var(--green)' }}>
              {seed.join ? seed.join(' ') : seed}
            </div>
            <div style={{ marginTop: '12px', fontSize: '0.7rem', color: '#ef4444', fontFamily: 'var(--font-mono)' }}>
              SIMPAN SEED INI. TIDAK AKAN MUNCUL LAGI.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {plan?.bot_id && (
              <a href="https://awdex.kryptoncode.xyz" target="_blank" rel="noopener noreferrer">
                <button className="btn-dark" style={{ borderRadius: '100px', padding: '12px 28px' }}>Login to AWDEX</button>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="page-content" style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 20px' }}>
        <div className="ref-card" style={{ padding: '40px', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', marginBottom: '12px' }}>Order Expired</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Your order has expired. Create a new one.</p>
          <button className="btn-dark" style={{ borderRadius: '100px', padding: '12px 28px' }} onClick={() => { localStorage.removeItem(`order_${planId}`); setStatus('pending'); setOrder(null); createOrder(planId); }}>Create New Order</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 20px' }}>
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
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>scan — auto-fills address on Base</p>
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
              <button onClick={manualCheck} disabled={checking} className="btn-light" style={{ marginTop: '12px', borderRadius: '100px', padding: '8px 20px', fontSize: '0.8rem' }}>
                {checking ? 'checking...' : 'check payment'}
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Failed to create order</div>
        )}
      </div>
    </div>
  );
}
