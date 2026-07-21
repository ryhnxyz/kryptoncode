import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Check, Link, TriangleAlert } from 'lucide-react';
import { renderIcon } from '../lib/icons';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import { productsData } from '../data/productsData';
import ProductSourceToggle from '../components/ProductSourceToggle';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';

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
      setLoading(true);
      setError(null);
      setProduct(null);
      if (source === 'mock') {
        setProduct(productsData.find((item) => item.id === id) || null);
        setLoading(false);
        return;
      }
      try {
        const data = await api.get(`/api/products/${id}`);
        setProduct(data.product);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id, source]);

  const changeSource = (nextSource) => setSearchParams(nextSource === 'mock' ? { source: 'mock' } : {}, { replace: true });

  if (loading) {
    return (
      <main className="product-detail-page page-content" aria-busy="true">
        <Skeleton className="detail-toolbar-skeleton" />
        <Card className="detail-shell liquid-panel">
          <CardHeader className="detail-hero"><Skeleton className="detail-icon-skeleton" /><div><Skeleton className="h-4 w-28" /><Skeleton className="mt-3 h-9 w-64 max-w-full" /></div></CardHeader>
          <CardContent><Skeleton className="h-4 w-full" /><Skeleton className="mt-3 h-4 w-4/5" /></CardContent>
        </Card>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="product-detail-page page-content">
        <Card className="detail-state liquid-panel">
          <CardHeader><TriangleAlert aria-hidden="true" /><CardTitle>{t('product.notFound')}</CardTitle><CardDescription>{error}</CardDescription></CardHeader>
          <CardFooter><Button size="sm" onClick={() => navigate(collectionPath)}><ArrowLeft data-icon="inline-start" />{t('product.backToCollection')}</Button></CardFooter>
        </Card>
      </main>
    );
  }

  let features = [];
  try { features = typeof product.features === 'string' ? JSON.parse(product.features) : product.features || []; } catch { features = []; }

  return (
    <main className="product-detail-page page-content animate-fade-in">
      <div className="product-detail-toolbar">
        <Button variant="ghost" size="sm" className="product-detail-back" onClick={() => navigate(collectionPath)}><ArrowLeft data-icon="inline-start" />{t('product.back')}</Button>
        <ProductSourceToggle source={source} onChange={changeSource} label={t('products.dataSource')} liveLabel={t('products.liveApi')} mockLabel={t('products.mockData')} />
      </div>

      <Card className="detail-shell liquid-panel">
        <CardHeader className="detail-hero">
          <div className="detail-product-icon" aria-hidden="true">{renderIcon(product.icon_name)}</div>
          <div className="detail-heading-copy">
            <div className="detail-eyebrow"><Badge>{product.type}</Badge><span>{t('common.by')} {product.company}</span></div>
            <CardTitle>{product.title}</CardTitle>
            <CardDescription>{product.desc}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="detail-content-grid">
          <section className="detail-section" aria-labelledby="features-title">
            <span className="detail-section-index">01</span>
            <h2 id="features-title">{t('product.mainFeatures')}</h2>
            <ul>{features.map((feature) => <li key={feature}><span><Check aria-hidden="true" /></span>{feature}</li>)}</ul>
          </section>
          <section className="detail-section detail-link-section" aria-labelledby="project-link-title">
            <span className="detail-section-index">02</span>
            <h2 id="project-link-title"><Link aria-hidden="true" />{t('product.projectLink')}</h2>
            <p>{t('product.projectDesc')}</p>
            <a href={product.project_link} target="_blank" rel="noreferrer">{t('product.visitProject')}<ArrowUpRight aria-hidden="true" /></a>
          </section>
        </CardContent>

        <CardFooter className="detail-actions">
          <Button onClick={() => window.open(product.project_link, '_blank', 'noopener,noreferrer')}>{t('product.buyFullAccess')}<ArrowUpRight data-icon="inline-end" /></Button>
          <Button variant="outline">{t('product.viewDocs')}</Button>
        </CardFooter>
      </Card>
    </main>
  );
}
