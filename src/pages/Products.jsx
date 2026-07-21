import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw as ArrowClockwise, ArrowRight, ArrowUpRight, Package, Tag, WifiOff as WifiSlash } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { renderIcon } from '../lib/icons';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import { productsData } from '../data/productsData';
import ProductSourceToggle from '../components/ProductSourceToggle';

function ProductSkeleton() {
  return (
    <Card className="product-card product-skeleton-card" aria-hidden="true">
      <CardHeader>
        <div className="product-card-topline">
          <div className="skeleton product-icon-skeleton" />
          <div className="skeleton product-badge-skeleton" />
        </div>
        <div className="skeleton product-title-skeleton" />
        <div className="skeleton product-copy-skeleton" />
        <div className="skeleton product-copy-skeleton product-copy-skeleton-short" />
      </CardHeader>
      <CardFooter>
        <div className="skeleton product-button-skeleton" />
      </CardFooter>
    </Card>
  );
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

    if (source === 'mock') {
      setProducts(productsData);
      setLoading(false);
      return;
    }

    setLoading(true);
    api.get('/api/products')
      .then((data) => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [source]);

  const changeSource = (nextSource) => {
    setSearchParams(nextSource === 'mock' ? { source: 'mock' } : {}, { replace: true });
  };

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return (
    <main className="products-page page-content">
      <section className="products-intro animate-slide-up" aria-labelledby="products-heading">
        <div className="products-kicker">
          <span className="products-status-dot" aria-hidden="true" />
          {t('products.kicker')}
        </div>
        <div className="products-intro-grid">
          <div>
            <h1 id="products-heading">{t('products.headline')}</h1>
          </div>
          <div className="products-intro-copy">
            <p>{t('products.title')} — {t('products.intro')}</p>
            <a href="https://t.me/kryptoncodes" target="_blank" rel="noopener noreferrer">
              {t('products.request')}
              <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
            </a>
          </div>
        </div>
        <Separator className="products-separator" />
        <div className="products-meta">
          <span>{t('products.curated')}</span>
          <ProductSourceToggle
            source={source}
            onChange={changeSource}
            label={t('products.dataSource')}
            liveLabel={t('products.liveApi')}
            mockLabel={t('products.mockData')}
          />
          <span>{loading ? t('products.loadingCollection') : `${products.length} ${t('products.available')}`}</span>
        </div>
      </section>

      {loading ? (
        <section className="products-grid" aria-label={t('products.loadingLabel')} aria-busy="true">
          {[1, 2, 3, 4].map((item) => <ProductSkeleton key={item} />)}
        </section>
      ) : error ? (
        <section className="products-error-shell" role="alert" aria-labelledby="products-error-title">
          <Card className="products-error-card">
            <CardHeader>
              <div className="products-error-topline">
                <div className="products-state-icon products-error-icon">
                  <WifiSlash size={22} weight="duotone" aria-hidden="true" />
                </div>
                <Badge variant="outline">{t('products.apiUnavailable')}</Badge>
              </div>
              <CardTitle id="products-error-title">{t('products.offlineTitle')}</CardTitle>
              <CardDescription>{t('products.offlineDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="products-error-route" aria-label={t('products.failedPath')}>
                <div>
                  <span className="products-error-node">{t('products.you')}</span>
                  <small>{t('products.browser')}</small>
                </div>
                <span className="products-error-line" aria-hidden="true"><i /></span>
                <div>
                  <span className="products-error-node products-error-node-muted">{t('products.api')}</span>
                  <small>{t('products.unreachable')}</small>
                </div>
              </div>
              <div className="products-error-detail">
                <span>{t('products.errorDetail')}</span>
                <code>{error}</code>
              </div>
            </CardContent>
            <CardFooter className="products-error-actions">
              <Button onClick={loadProducts}>
                <ArrowClockwise data-icon="inline-start" aria-hidden="true" />
                {t('products.tryAgain')}
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                {t('products.backHome')}
              </Button>
            </CardFooter>
          </Card>
          <p className="products-error-note">{t('products.safeRetry')}</p>
        </section>
      ) : products.length === 0 ? (
        <Card className="products-state-card">
          <CardHeader>
            <div className="products-state-icon"><Package size={22} weight="duotone" aria-hidden="true" /></div>
            <CardTitle>{t('products.emptyTitle')}</CardTitle>
            <CardDescription>{t('products.emptyDesc')}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <section className="products-grid" aria-label={t('products.collectionLabel')}>
          {products.map((item, index) => (
            <Card key={item.id || index} className={`product-card animate-slide-up delay-${Math.min((index + 1) * 100, 500)}`}>
              <CardHeader className="product-card-header">
                <div className="product-card-topline">
                  <div className="product-card-icon" aria-hidden="true">{renderIcon(item.icon_name)}</div>
                  <Badge variant="outline">
                    <Tag aria-hidden="true" />
                    {item.type}
                  </Badge>
                </div>
                <div className="product-card-copy">
                  <div className="product-card-company">{item.company}</div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.desc}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="product-card-meta">
                <Separator />
                <div className="product-card-detail">
                  <span>{t('products.digitalProduct')}</span>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                </div>
              </CardContent>
              <CardFooter className="product-card-footer">
                <Button className="product-card-button" onClick={() => navigate(`/product/${item.id}${source === 'mock' ? '?source=mock' : ''}`)}>
                  {t('products.viewDetails')}
                  <ArrowRight data-icon="inline-end" aria-hidden="true" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </section>
      )}
    </main>
  );
}
