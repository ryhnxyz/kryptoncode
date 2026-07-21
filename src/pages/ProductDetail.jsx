import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Check, Link, TriangleAlert } from 'lucide-react';
import { renderIcon } from '../lib/icons';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import { productsData } from '../data/productsData';
import ProductSourceToggle from '../components/ProductSourceToggle';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLanguage();
  const source = searchParams.get('source') === 'mock' ? 'mock' : 'live';
  const collectionPath = source === 'mock' ? '/products?source=mock' : '/products';
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true); setError(null); setProduct(null);
      if (source === 'mock') { setProduct(productsData.find((item) => item.id === id) || null); setLoading(false); return; }
      try { const data = await api.get(`/api/products/${id}`); setProduct(data.product); }
      catch (requestError) { setError(requestError.message); }
      finally { setLoading(false); }
    }
    fetchProduct();
  }, [id, source]);

  const changeSource = (next) => setSearchParams(next === 'mock' ? { source: 'mock' } : {}, { replace: true });

  if (loading) return <main className="product-detail-page page-content" aria-busy="true"><div className="skeleton detail-toolbar-skeleton" /><article className="detail-hero-card liquid-panel"><div className="detail-hero"><span className="skeleton detail-icon-skeleton" /><div className="detail-heading-copy"><span className="skeleton detail-line-sm" /><span className="skeleton detail-line-lg" /><span className="skeleton detail-line-md" /></div></div></article></main>;

  if (error || !product) return <main className="product-detail-page page-content"><article className="detail-state liquid-panel"><TriangleAlert aria-hidden="true" /><h1>{t('product.notFound')}</h1>{error && <p>{error}</p>}<button className="product-button product-button-primary" onClick={() => navigate(collectionPath)}><ArrowLeft aria-hidden="true" />{t('product.backToCollection')}</button></article></main>;

  let features = [];
  try { features = typeof product.features === 'string' ? JSON.parse(product.features) : product.features || []; } catch { features = []; }

  return <main className="product-detail-page page-content animate-fade-in">
    <div className="product-detail-toolbar"><button className="product-detail-back" onClick={() => navigate(collectionPath)}><ArrowLeft aria-hidden="true" />{t('product.back')}</button><ProductSourceToggle source={source} onChange={changeSource} label={t('products.dataSource')} liveLabel={t('products.liveApi')} mockLabel={t('products.mockData')} /></div>
    <article className="detail-layout">
      <section className="detail-hero-card liquid-panel"><div className="detail-hero"><span className="detail-product-icon" aria-hidden="true">{renderIcon(product.icon_name)}</span><div className="detail-heading-copy"><div className="detail-eyebrow"><span className="product-badge">{product.type}</span><span>{t('common.by')} {product.company}</span></div><h1>{product.title}</h1><p>{product.desc}</p></div></div></section>
      <div className="detail-content-grid">
        <section className="detail-section-card" aria-labelledby="features-title"><header className="detail-section-heading"><span className="detail-section-index">01</span><h2 id="features-title">{t('product.mainFeatures')}</h2></header><ul>{features.map((feature) => <li key={feature}><span className="detail-check"><Check aria-hidden="true" /></span><span>{feature}</span></li>)}</ul></section>
        <section className="detail-section-card detail-link-card" aria-labelledby="project-link-title"><header className="detail-section-heading"><span className="detail-section-index">02</span><h2 id="project-link-title"><Link aria-hidden="true" />{t('product.projectLink')}</h2></header><p>{t('product.projectDesc')}</p><a href={product.project_link} target="_blank" rel="noreferrer">{t('product.visitProject')}<ArrowUpRight aria-hidden="true" /></a></section>
      </div>
      <footer className="detail-action-card liquid-panel"><div className="detail-action-copy"><span>{product.type}</span><strong>{product.title}</strong></div><div className="detail-action-buttons"><button className="product-button product-button-primary" onClick={() => window.open(product.project_link, '_blank', 'noopener,noreferrer')}>{t('product.buyFullAccess')}<ArrowUpRight aria-hidden="true" /></button><button className="product-button">{t('product.viewDocs')}</button></div></footer>
    </article>
  </main>;
}
