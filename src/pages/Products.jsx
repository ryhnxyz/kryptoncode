import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag } from '@phosphor-icons/react';
import { renderIcon } from '../lib/icons';
import { api } from '../lib/api';

function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/products').then(data => {
      setProducts(data.products || []);
      setLoading(false);
    }).catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, []);
  
  return (
    <div className="page-content">
      <h1 className="page-title animate-slide-up">Koleksi Produk</h1>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Memuat produk...</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
          Error: {error}
        </div>
      ) : (
        <div className="cards-grid">
          {products.map((item, idx) => {
            const delayClass = `delay-${Math.min((idx + 1) * 100, 500)}`;
            return (
              <div key={item.id || idx} className={`ref-card animate-slide-up ${delayClass}`}>
                <div className="ref-card-header">
                  <div className="ref-card-logo">
                    <div className="ref-card-icon">{renderIcon(item.icon_name)}</div>
                    {item.company}
                  </div>
                </div>
                
                <div className="ref-info-blocks">
                  <div className="ref-info-box" style={{ flex: 'none', width: 'fit-content', paddingRight: '20px' }}>
                    <div className="ref-info-label">
                      <Tag weight="bold" size={14} />
                      Kategori
                    </div>
                    <div className="ref-info-value">{item.type}</div>
                  </div>
                </div>
                
                <h3 className="ref-card-title">{item.title}</h3>
                <p className="ref-card-desc">{item.desc}</p>
                
                <div className="ref-card-actions">
                  <button className="btn-light" onClick={() => navigate('/product/' + item.id)}>Lihat detail</button>
                  <button className="btn-dark" onClick={() => navigate('/product/' + item.id)}>Buka Proyek</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Products;
