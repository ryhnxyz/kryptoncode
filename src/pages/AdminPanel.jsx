import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Robot, CurrencyDollar, Key, Users, ChartBar,
  Plus, Trash, Copy, Check, ArrowClockwise, Eye, EyeSlash,
  SignOut, CheckCircle, Warning, CopySimple
} from '@phosphor-icons/react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: ChartBar },
  { id: 'bots', label: 'Bots', icon: Robot },
  { id: 'plans', label: 'Plans', icon: CurrencyDollar },
  { id: 'payments', label: 'Payments', icon: CurrencyDollar },
  { id: 'keys', label: 'License Keys', icon: Key },
];

function AdminPanel() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_pw');
    if (saved) { setPassword(saved); setAuthed(true); }
  }, []);

  const api = useCallback(async (url, method = 'GET', body = null) => {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Admin-Password': password }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    return res.json();
  }, [password]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('admin_pw', password);
        setAuthed(true);
      } else {
        setAuthError(data.error || 'Password salah');
      }
    } catch { setAuthError('Network error'); }
    finally { setAuthLoading(false); }
  };

  const logout = () => {
    sessionStorage.removeItem('admin_pw');
    setAuthed(false);
    setPassword('');
  };

  if (!authed) {
    return (
      <div className="page-content animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <div className="ref-card" style={{ padding: '40px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <ShieldCheck size={48} weight="duotone" color="var(--text-primary)" style={{ marginBottom: '16px' }} />
          <h2 style={{ marginBottom: '24px', color: 'var(--text-primary)' }}>Admin Login</h2>
          <form onSubmit={handleLogin}>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Admin Password" autoFocus
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)',
                background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem', marginBottom: '16px', boxSizing: 'border-box', outline: 'none' }} />
            {authError && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '12px' }}>{authError}</div>}
            <button type="submit" className="btn-dark" disabled={authLoading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
              {authLoading ? 'Verifying...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content animate-fade-in" style={{ padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontSize: '1.4rem' }}>
          <ShieldCheck weight="bold" size={20} style={{ marginRight: '8px' }} />admin/panel
        </h2>
        <button onClick={logout} className="btn-light" style={{ fontSize: '0.8rem', padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <SignOut size={14} /> Logout
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
              cursor: 'pointer', border: '1px solid', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
              background: activeTab === tab.id ? 'var(--text-primary)' : 'transparent',
              color: activeTab === tab.id ? 'var(--bg-color)' : 'var(--text-secondary)',
              borderColor: activeTab === tab.id ? 'var(--text-primary)' : 'var(--border)',
            }}>
            <tab.icon size={14} weight="bold" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'dashboard' && <DashboardTab api={api} />}
      {activeTab === 'bots' && <BotsTab api={api} />}
      {activeTab === 'plans' && <PlansTab api={api} />}
      {activeTab === 'payments' && <PaymentsTab api={api} />}
      {activeTab === 'keys' && <KeysTab api={api} />}
    </div>
  );
}

// ==================== DASHBOARD ====================
function DashboardTab({ api }) {
  const [stats, setStats] = useState(null);
  const load = useCallback(async () => {
    const data = await api('/api/admin/stats');
    setStats(data);
  }, [api]);
  useEffect(() => { load(); }, [load]);

  if (!stats) return <Loader />;
  const cards = [
    { label: 'Total Users', value: stats.total_users },
    { label: 'Active Bots', value: stats.total_bots },
    { label: 'Total Payments', value: stats.total_payments },
    { label: 'Pending', value: stats.pending_payments, warn: true },
    { label: 'Active Keys', value: stats.active_keys },
    { label: 'Revenue (USD)', value: `$${stats.total_revenue || 0}` },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
      {cards.map(c => (
        <div key={c.label} className="ref-card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: c.warn ? '#f59e0b' : 'var(--text-secondary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: '8px' }}>{c.label}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

// ==================== BOTS ====================
function BotsTab({ api }) {
  const [bots, setBots] = useState([]);
  const [form, setForm] = useState({ bot_name: '', bot_username: '', description: '' });
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState(null);

  const load = useCallback(async () => {
    const data = await api('/api/admin/bots');
    setBots(data.bots || []);
  }, [api]);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.bot_name) return;
    await api('/api/admin/bots', 'POST', form);
    setForm({ bot_name: '', bot_username: '', description: '' });
    setShowForm(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Hapus bot ini? Semua plan terkait juga akan terhapus.')) return;
    await api('/api/admin/bots', 'DELETE', { id });
    load();
  };

  const copy = (text, id) => { navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 2000); };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>Registered Bots</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-dark" style={{ fontSize: '0.8rem', padding: '8px 16px', borderRadius: '8px' }}>
          <Plus size={14} weight="bold" /> Add Bot
        </button>
      </div>

      {showForm && (
        <div className="ref-card" style={{ padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gap: '10px' }}>
            <Input label="Nama Bot" value={form.bot_name} onChange={v => setForm({ ...form, bot_name: v })} placeholder="Contoh: Auto Responder Bot" />
            <Input label="Username Telegram" value={form.bot_username} onChange={v => setForm({ ...form, bot_username: v })} placeholder="@botusername" />
            <Input label="Deskripsi" value={form.description} onChange={v => setForm({ ...form, description: v })} placeholder="Opsional" />
            <button onClick={create} className="btn-dark" style={{ padding: '10px', borderRadius: '8px', justifyContent: 'center' }}>Create Bot & Generate API Key</button>
          </div>
        </div>
      )}

      {bots.map(bot => (
        <div key={bot.id} className="ref-card" style={{ padding: '16px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>{bot.bot_name || bot.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                {bot.bot_username ? `@${bot.bot_username}` : 'No username'} • {bot.is_active ? '🟢 Active' : '🔴 Inactive'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1c1917', padding: '8px 12px', borderRadius: '8px' }}>
                <code style={{ color: '#a8a29e', fontSize: '0.75rem', wordBreak: 'break-all', flex: 1 }}>{bot.key}</code>
                <button onClick={() => copy(bot.key, bot.id)} style={{ background: 'none', border: 'none', color: '#78716c', cursor: 'pointer', padding: '2px' }}>
                  {copied === bot.id ? <Check size={14} color="#22c55e" /> : <CopySimple size={14} />}
                </button>
              </div>
            </div>
            <button onClick={() => remove(bot.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}>
              <Trash size={18} />
            </button>
          </div>
        </div>
      ))}
      {bots.length === 0 && <EmptyState text="Belum ada bot terdaftar" />}
    </div>
  );
}

// ==================== PLANS ====================
function PlansTab({ api }) {
  const [plans, setPlans] = useState([]);
  const [bots, setBots] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', type: 'per_bot', price_usd: '', bot_id: '', duration_days: '', description: '' });

  const load = useCallback(async () => {
    const [p, b] = await Promise.all([api('/api/admin/manage-plans'), api('/api/admin/bots')]);
    setPlans(p.plans || []);
    setBots(b.bots || []);
  }, [api]);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.id || !form.name || !form.price_usd) return;
    await api('/api/admin/manage-plans', 'POST', {
      ...form,
      price_usd: parseFloat(form.price_usd),
      bot_id: form.type === 'global' ? null : form.bot_id || null,
      duration_days: form.duration_days ? parseInt(form.duration_days) : null
    });
    setForm({ id: '', name: '', type: 'per_bot', price_usd: '', bot_id: '', duration_days: '', description: '' });
    setShowForm(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Hapus plan ini?')) return;
    await api('/api/admin/manage-plans', 'DELETE', { id });
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>Plans</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-dark" style={{ fontSize: '0.8rem', padding: '8px 16px', borderRadius: '8px' }}>
          <Plus size={14} weight="bold" /> Add Plan
        </button>
      </div>

      {showForm && (
        <div className="ref-card" style={{ padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gap: '10px' }}>
            <Input label="Plan ID (slug)" value={form.id} onChange={v => setForm({ ...form, id: v })} placeholder="contoh: bot-autoresponder" />
            <Input label="Nama" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Telegram Auto-Responder" />
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>Tipe</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                <option value="per_bot">Per Bot</option>
                <option value="global">Global (VIP)</option>
              </select>
            </div>
            {form.type === 'per_bot' && (
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>Tautkan ke Bot</label>
                <select value={form.bot_id} onChange={e => setForm({ ...form, bot_id: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                  <option value="">-- Pilih Bot --</option>
                  {bots.map(b => <option key={b.id} value={b.id}>{b.bot_name || b.name}</option>)}
                </select>
              </div>
            )}
            <Input label="Harga (USD)" value={form.price_usd} onChange={v => setForm({ ...form, price_usd: v })} placeholder="15" type="number" />
            <Input label="Durasi (hari, kosong = lifetime)" value={form.duration_days} onChange={v => setForm({ ...form, duration_days: v })} placeholder="30 atau kosong" type="number" />
            <Input label="Deskripsi" value={form.description} onChange={v => setForm({ ...form, description: v })} placeholder="Opsional" />
            <button onClick={create} className="btn-dark" style={{ padding: '10px', borderRadius: '8px', justifyContent: 'center' }}>Create Plan</button>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px dashed var(--border)' }}>
              {['ID', 'Nama', 'Tipe', 'Bot', 'Harga', 'Durasi', ''].map(h => (
                <th key={h} style={{ padding: '10px 8px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '500', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plans.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px dashed var(--border)' }}>
                <td style={tdStyle}><code>{p.id}</code></td>
                <td style={tdStyle}>{p.name}</td>
                <td style={tdStyle}><Badge text={p.type} color={p.type === 'global' ? '#f59e0b' : '#3b82f6'} /></td>
                <td style={tdStyle}>{p.bot_name || '—'}</td>
                <td style={tdStyle}>${p.price_usd}</td>
                <td style={tdStyle}>{p.duration_days ? `${p.duration_days}d` : '∞'}</td>
                <td style={tdStyle}><button onClick={() => remove(p.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {plans.length === 0 && <EmptyState text="Belum ada plan" />}
    </div>
  );
}

// ==================== PAYMENTS ====================
function PaymentsTab({ api }) {
  const [payments, setPayments] = useState([]);
  const [copied, setCopied] = useState(null);

  const load = useCallback(async () => {
    const data = await api('/api/admin/payments');
    setPayments(data.payments || []);
  }, [api]);
  useEffect(() => { load(); }, [load]);

  const confirm = async (id) => {
    await api('/api/admin/payments', 'POST', { id });
    load();
  };

  const copy = (text, id) => { navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 2000); };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>Payments</h3>
        <button onClick={load} className="btn-light" style={{ fontSize: '0.8rem', padding: '8px 12px', borderRadius: '8px' }}><ArrowClockwise size={14} /></button>
      </div>

      {payments.map(p => (
        <div key={p.id} className="ref-card" style={{ padding: '16px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Badge text={p.status} color={p.status === 'confirmed' ? '#22c55e' : p.status === 'pending' ? '#f59e0b' : '#ef4444'} />
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{p.plan_name}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span>💰 {p.amount_usd} {p.crypto_currency} ({p.chain})</span>
                {p.memo && <span>📝 Memo: <strong>{p.memo}</strong></span>}
                {p.license_key && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    🔑 {p.license_key}
                    <button onClick={() => copy(p.license_key, p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0' }}>
                      {copied === p.id ? <Check size={12} color="#22c55e" /> : <CopySimple size={12} />}
                    </button>
                  </span>
                )}
                <span>📅 {new Date(p.created_at).toLocaleString('id-ID')}</span>
              </div>
            </div>
            {p.status === 'pending' && (
              <button onClick={() => confirm(p.id)} className="btn-dark" style={{ fontSize: '0.75rem', padding: '6px 14px', borderRadius: '8px' }}>
                <CheckCircle size={14} weight="bold" /> Confirm
              </button>
            )}
          </div>
        </div>
      ))}
      {payments.length === 0 && <EmptyState text="Belum ada pembayaran" />}
    </div>
  );
}

// ==================== LICENSE KEYS ====================
function KeysTab({ api }) {
  const [keys, setKeys] = useState([]);

  const load = useCallback(async () => {
    const data = await api('/api/admin/keys');
    setKeys(data.keys || []);
  }, [api]);
  useEffect(() => { load(); }, [load]);

  const revoke = async (id) => {
    if (!confirm('Revoke key ini?')) return;
    await api('/api/admin/keys', 'POST', { action: 'revoke', id });
    load();
  };

  return (
    <div>
      <h3 style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginBottom: '16px' }}>License Keys</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px dashed var(--border)' }}>
              {['Key', 'Plan', 'Tipe', 'User', 'Status', 'Tanggal', ''].map(h => (
                <th key={h} style={{ padding: '10px 6px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '500', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.map(k => (
              <tr key={k.id} style={{ borderBottom: '1px dashed var(--border)' }}>
                <td style={tdStyle}><code style={{ fontSize: '0.7rem' }}>{k.key}</code></td>
                <td style={tdStyle}>{k.plan_name}</td>
                <td style={tdStyle}><Badge text={k.plan_type} color={k.plan_type === 'global' ? '#f59e0b' : '#3b82f6'} /></td>
                <td style={tdStyle}>{k.user_telegram || '—'}</td>
                <td style={tdStyle}><Badge text={k.status} color={k.status === 'active' ? '#22c55e' : k.status === 'unused' ? '#6b7280' : '#ef4444'} /></td>
                <td style={tdStyle}>{new Date(k.created_at).toLocaleDateString('id-ID')}</td>
                <td style={tdStyle}>
                  {(k.status === 'active' || k.status === 'unused') && (
                    <button onClick={() => revoke(k.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.7rem' }}>Revoke</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {keys.length === 0 && <EmptyState text="Belum ada license key" />}
    </div>
  );
}

// ==================== SHARED COMPONENTS ====================
const tdStyle = { padding: '10px 6px', color: 'var(--text-primary)', whiteSpace: 'nowrap' };

function Input({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '4px' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)',
          background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
          fontSize: '0.85rem', boxSizing: 'border-box', outline: 'none' }} />
    </div>
  );
}

function Badge({ text, color }) {
  return (
    <span style={{ background: color + '20', color: color, padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>
      {text}
    </span>
  );
}

function Loader() { return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Memuat...</div>; }
function EmptyState({ text }) { return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{text}</div>; }

export default AdminPanel;
