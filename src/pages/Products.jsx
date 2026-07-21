import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Package, Tag } from '@phosphor-icons/react';
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
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/products')
      .then((data) => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <main className="products-page page-content">
      <section className="products-intro animate-slide-up" aria-labelledby="products-heading">
        <div className="products-kicker">
          <span className="products-status-dot" aria-hidden="true" />
          Product collection
        </div>
        <div className="products-intro-grid">
          <div>
            <h1 id="products-heading">Tools made for real workflows.</h1>
          </div>
          <div className="products-intro-copy">
            <p>{t('products.title')} — focused utilities, automation, and digital products built to remove friction from everyday work.</p>
            <a href="https://t.me/kryptoncodes" target="_blank" rel="noopener noreferrer">
              Request a custom tool
              <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
            </a>
          </div>
        </div>
        <Separator className="products-separator" />
        <div className="products-meta">
          <span>Curated by KryptonCode</span>
          <span>{loading ? 'Loading collection' : `${products.length} products available`}</span>
        </div>
      </section>

      {loading ? (
        <section className="products-grid" aria-label="Loading products" aria-busy="true">
          {[1, 2, 3, 4].map((item) => <ProductSkeleton key={item} />)}
        </section>
      ) : error ? (
        <Card className="products-state-card" role="alert">
          <CardHeader>
            <div className="products-state-icon"><Package size={22} weight="duotone" aria-hidden="true" /></div>
            <CardTitle>{t('products.error')}</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => window.location.reload()}>Try again</Button>
          </CardFooter>
        </Card>
      ) : products.length === 0 ? (
        <Card className="products-state-card">
          <CardHeader>
            <div className="products-state-icon"><Package size={22} weight="duotone" aria-hidden="true" /></div>
            <CardTitle>No products yet</CardTitle>
            <CardDescription>The next KryptonCode release is currently being prepared.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <section className="products-grid" aria-label="Product collection">
          {products.map((item, index) => (
            <Card key={item.id || index} className={`product-card animate-slide-up delay-${Math.min((index + 1) * 100, 500)}`}>
              <CardHeader>
                <div className="product-card-topline">
                  <div className="product-card-icon" aria-hidden="true">{renderIcon(item.icon_name)}</div>
                  <Badge variant="outline">
                    <Tag size={13} weight="bold" aria-hidden="true" />
                    {item.type}
                  </Badge>
                </div>
                <div className="product-card-company">{item.company}</div>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Separator />
                <div className="product-card-detail">
                  <span>Digital product</span>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="product-card-button" onClick={() => navigate(`/product/${item.id}`)}>
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
