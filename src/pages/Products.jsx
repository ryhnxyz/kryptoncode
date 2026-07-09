import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag } from '@phosphor-icons/react';
import { supabase } from '../lib/supabase';
import { renderIcon } from '../lib/icons';

function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProducts() {
      if (!supabase) {
        setError('Supabase client tidak dikonfigurasi. Pastikan .env sudah diatur.');
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('id', { ascending: true });
          
        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);
  
  return (
    <div className="page-content">
      <h1 className="page-title animate-slide-up">Koleksi Produk</h1>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Memuat produk dari Supabase...</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
          Error: {error}<br/><br/>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Note: Anda perlu membuat tabel "products" di Supabase dan memasukkan VITE_SUPABASE_URL ke .env
          </span>
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
