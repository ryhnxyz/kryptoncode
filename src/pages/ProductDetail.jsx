import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { renderIcon } from '../lib/icons';
import { ArrowLeft, CheckCircle, LinkSimple, ArrowUpRight } from '@phosphor-icons/react';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const data = await api.get('/api/products/' + id);
        setProduct(data.product);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="page-content" style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text-secondary)' }}>
        {t('product.loading')}
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="page-content" style={{ textAlign: 'center', marginTop: '100px' }}>
        <h2 style={{ color: '#ef4444' }}>{t('product.notFound')}</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        <button className="btn-light" style={{ marginTop: '20px' }} onClick={() => navigate('/products')}>
          <ArrowLeft /> {t('product.backToCollection')}
        </button>
      </div>
    );
  }

  let features = [];
  try {
    features = typeof product.features === 'string' ? JSON.parse(product.features) : product.features || [];
  } catch {
    features = [];
  }

  return (
    <div className="page-content animate-fade-in" style={{ paddingBottom: '80px', padding: '0 16px' }}>
      <button 
        onClick={() => navigate('/products')} 
        style={{ 
          background: 'transparent', 
          border: 'none', 
          color: 'var(--text-secondary)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          cursor: 'pointer',
          marginBottom: '32px',
          fontFamily: 'var(--font-sans)',
          fontSize: '0.9rem',
          padding: 0
        }}
      >
        <ArrowLeft weight="bold" /> {t('product.back')}
      </button>

      <div className="ref-card" style={{ padding: '40px' }}>
        <div className="detail-header" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <div style={{ 
            fontSize: '3rem', 
            background: 'var(--bg-secondary)', 
            padding: '20px', 
            borderRadius: '24px',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            display: 'flex'
          }}>
            {renderIcon(product.icon_name)}
          </div>
          <div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{ 
                background: 'var(--text-primary)', 
                color: 'var(--bg-color)', 
                padding: '4px 12px', 
                borderRadius: '100px', 
                fontSize: '0.8rem',
                fontWeight: '600',
                fontFamily: 'var(--font-mono)'
              }}>
                {product.type}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
                {t('product.by')} {product.company}
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--text-primary)', lineHeight: '1.2' }}>{product.title}</h1>
          </div>
        </div>

        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '40px' }}>
          {product.desc}
        </p>

        <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-primary)' }}>{t('product.mainFeatures')}</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {features.map((feat, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-secondary)' }}>
                  <CheckCircle weight="fill" color="var(--text-primary)" size={20} style={{ flexShrink: 0, marginTop: '2px' }} /> 
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LinkSimple /> {t('product.projectLink')}
            </h3>
            <div style={{ 
              background: '#1c1917', 
              color: '#a8a29e', 
              padding: '24px', 
              borderRadius: '12px',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              border: '1px solid var(--border)'
            }}>
              {t('product.projectDesc')}
              <br/><br/>
              <a href={product.project_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                {t('product.visitProject')} <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
        </div>
        
        <div className="ref-card-actions detail-actions" style={{ marginTop: '40px', borderTop: '1px dashed var(--border)', paddingTop: '32px' }}>
          <button className="btn-dark" onClick={() => window.open(product.project_link, '_blank')}>{t('product.buyFullAccess')}</button>
          <button className="btn-light">{t('product.viewDocs')}</button>
        </div>
      </div>
    </div>
  );
}
