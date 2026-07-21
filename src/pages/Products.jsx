import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw, ArrowRight, ArrowUpRight, Package, Tag, WifiOff } from 'lucide-react';
import { renderIcon } from '../lib/icons';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import { productsData } from '../data/productsData';
import ProductSourceToggle from '../components/ProductSourceToggle';

function LiquidGlassLayers() {
  return <div className="product-liquid-effects" aria-hidden="true"><span className="product-liquid-blob" /><span className="product-liquid-refraction" /><span className="product-liquid-shine" /></div>;
}

function ProductSkeleton({ index }) {
  return <article className="product-card product-skeleton-card" style={{ '--liquid-index': index }} aria-hidden="true"><LiquidGlassLayers /><div className="product-card-header"><div className="product-card-topline"><span className="skeleton product-icon-skeleton" /><span className="skeleton product-badge-skeleton" /></div><div className="product-card-copy"><span className="skeleton product-title-skeleton" /><span className="skeleton product-copy-skeleton" /><span className="skeleton product-copy-skeleton product-copy-skeleton-short" /></div></div><div className="product-card-footer"><span className="skeleton product-button-skeleton" /></div></article>;
}

export default function Products() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLanguage();
  const source = searchParams.get('source') === 'mock' ? 'mock' : 'live';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProducts = useCallback(() => {
    setError(null);
    if (source === 'mock') { setProducts(productsData); setLoading(false); return; }
    setLoading(true);
    api.get('/api/products').then((data) => { setProducts(data.products || []); setLoading(false); }).catch((err) => { setError(err.message); setLoading(false); });
  }, [source]);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  const changeSource = (next) => setSearchParams(next === 'mock' ? { source: 'mock' } : {}, { replace: true });

  return <main className="products-page page-content">
    <section className="products-intro animate-slide-up" aria-labelledby="products-heading">
      <div className="products-kicker"><span className="products-status-dot" aria-hidden="true" />{t('products.kicker')}</div>
      <div className="products-intro-grid"><h1 id="products-heading">{t('products.headline')}</h1><div className="products-intro-copy"><p>{t('products.title')} — {t('products.intro')}</p><a href="https://t.me/kryptoncodes" target="_blank" rel="noopener noreferrer">{t('products.request')}<ArrowUpRight aria-hidden="true" /></a></div></div>
      <div className="products-separator" />
      <div className="products-meta"><span>{t('products.curated')}</span><ProductSourceToggle source={source} onChange={changeSource} label={t('products.dataSource')} liveLabel={t('products.liveApi')} mockLabel={t('products.mockData')} /><span>{loading ? t('products.loadingCollection') : `${products.length} ${t('products.available')}`}</span></div>
    </section>

    {loading ? <section className="products-grid" aria-label={t('products.loadingLabel')} aria-busy="true">{[1,2,3,4].map((n) => <ProductSkeleton key={n} index={n} />)}</section>
    : error ? <section className="products-error-shell" role="alert" aria-labelledby="products-error-title"><article className="products-error-card"><header><div className="products-error-topline"><span className="products-state-icon products-error-icon"><WifiOff aria-hidden="true" /></span><span className="product-badge">{t('products.apiUnavailable')}</span></div><h2 id="products-error-title">{t('products.offlineTitle')}</h2><p>{t('products.offlineDesc')}</p></header><div className="products-error-detail"><span>{t('products.errorDetail')}</span><code>{error}</code></div><footer className="products-error-actions"><button className="product-button product-button-primary" onClick={loadProducts}><RefreshCw aria-hidden="true" />{t('products.tryAgain')}</button><button className="product-button" onClick={() => navigate('/')}>{t('products.backHome')}</button></footer></article></section>
    : products.length === 0 ? <article className="products-state-card"><span className="products-state-icon"><Package aria-hidden="true" /></span><h2>{t('products.emptyTitle')}</h2><p>{t('products.emptyDesc')}</p></article>
    : <section className="products-grid" aria-label={t('products.collectionLabel')}>{products.map((item, index) => <article key={item.id || index} className={`product-card animate-slide-up delay-${Math.min((index + 1) * 100, 500)}`} style={{ '--liquid-index': index + 1 }}><LiquidGlassLayers /><header className="product-card-header"><div className="product-card-topline"><span className="product-card-icon" aria-hidden="true">{renderIcon(item.icon_name)}</span><span className="product-badge"><Tag aria-hidden="true" />{item.type}</span></div><div className="product-card-copy"><span className="product-card-company">{item.company}</span><h2>{item.title}</h2><p>{item.desc}</p></div></header><div className="product-card-meta"><div className="product-card-divider" /><div className="product-card-detail"><span>{t('products.digitalProduct')}</span><span>{String(index + 1).padStart(2, '0')}</span></div></div><footer className="product-card-footer"><button className="product-button product-button-primary product-card-button" onClick={() => navigate(`/product/${item.id}${source === 'mock' ? '?source=mock' : ''}`)}>{t('products.viewDetails')}<ArrowRight aria-hidden="true" /></button></footer></article>)}</section>}
  </main>;
}
