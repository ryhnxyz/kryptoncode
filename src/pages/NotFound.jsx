import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WarningCircle, ArrowLeft } from '@phosphor-icons/react';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="page-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <WarningCircle size={80} color="var(--accent)" weight="duotone" style={{ marginBottom: '24px' }} />
      <h1 style={{ fontSize: '4rem', marginBottom: '16px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', color: 'var(--text-secondary)' }}>Halaman Tidak Ditemukan</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', maxWidth: '400px', lineHeight: '1.6' }}>
        Direktori atau file yang Anda cari mungkin sudah dihapus, dipindahkan, atau Anda salah mengetikkan URL (path).
      </p>
      <button className="btn-primary" onClick={() => navigate('/')}>
        <ArrowLeft weight="bold" /> Kembali ke Base
      </button>
    </div>
  );
}

export default NotFound;
