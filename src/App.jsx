import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, NavLink } from 'react-router-dom';
import { ArrowUpRight, List, X } from '@phosphor-icons/react';
import './index.css';

import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import BuyAccess from './pages/BuyAccess';
import Community from './pages/Community';
import NotFound from './pages/NotFound';

import WelcomeSplash from './components/WelcomeSplash';
import BackgroundGlow from './components/BackgroundGlow';
import LanguageSelector from './components/LanguageSelector';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

function AppContent() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const { t } = useLanguage();

  const closeMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 28);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('mobile-menu-open', isMobileMenuOpen);

    const handleEscape = (event) => {
      if (event.key === 'Escape') closeMenu();
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.classList.remove('mobile-menu-open');
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <div className="background-wrapper"></div>
      <BackgroundGlow />
      {showSplash && <WelcomeSplash onComplete={() => setShowSplash(false)} />}
      <div className="app-container" style={{ opacity: showSplash ? 0 : 1, transition: 'opacity 0.8s ease-in' }}>
        {/* Navbar */}
        <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
          <Link to="/" style={{ textDecoration: 'none' }} onClick={closeMenu}>
            <div className="logo" style={{ color: '#C0C0C0' }}>
              <img src="/splash-logo.png" alt="logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
              KryptonCode
            </div>
          </Link>
          
          <button
            className="mobile-menu-btn"
            type="button"
            aria-label={isMobileMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={isMobileMenuOpen}
            aria-controls="primary-navigation"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={26} weight="bold" aria-hidden="true" /> : <List size={26} weight="bold" aria-hidden="true" />}
          </button>
          
          <div id="primary-navigation" className={`nav-content ${isMobileMenuOpen ? 'open' : ''}`}>
            <div className="nav-links">
              <NavLink to="/products" className="nav-item-clean" onClick={closeMenu}>
                <span className="nav-index">01</span>
                <span>{t('nav.products')}</span>
                <ArrowUpRight className="nav-link-arrow" size={22} weight="bold" aria-hidden="true" />
              </NavLink>
              <span className="nav-separator"> </span>
              <NavLink to="/community" className="nav-item-clean" onClick={closeMenu}>
                <span className="nav-index">02</span>
                <span>{t('nav.community')}</span>
                <ArrowUpRight className="nav-link-arrow" size={22} weight="bold" aria-hidden="true" />
              </NavLink>
            </div>

            <div className="mobile-menu-meta" aria-hidden={!isMobileMenuOpen}>
              <span>KryptonCode / {t('nav.navigation')}</span>
              <span>{t('common.studio')}</span>
            </div>
            
            <div className="nav-actions">
              <LanguageSelector />
              <a className="btn-white-pill nav-try-btn" href="https://t.me/kryptoncodes" target="_blank" rel="noopener noreferrer" onClick={closeMenu}>
                {t('nav.tryAgent')} <ArrowUpRight size={18} weight="bold" aria-hidden="true" />
              </a>
            </div>
          </div>
        </nav>

        {/* Dynamic Pages */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/buy/:planId" element={<BuyAccess />} />
          <Route path="/community" element={<Community />} />
          <Route path="*" element={<NotFound />} />
        </Routes>

        <footer className="site-footer">
          <div className="footer-main">
            <div className="footer-brand">
              <Link className="footer-logo" to="/" onClick={closeMenu}>
                <img src="/splash-logo.png" alt="" width="32" height="32" />
                <span>KryptonCode</span>
              </Link>
              <p>{t('footer.description')}</p>
            </div>

            <nav className="footer-nav" aria-label={t('footer.navigationLabel')}>
              <p className="footer-label">{t('footer.explore')}</p>
              <Link to="/products">{t('nav.products')}</Link>
              <Link to="/community">{t('nav.community')}</Link>
            </nav>

            <div className="footer-connect">
              <p className="footer-label">{t('footer.connect')}</p>
              <a href="https://t.me/kryptoncodes" target="_blank" rel="noopener noreferrer">
                Telegram
                <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} KryptonCode</span>
            <span className="footer-status"><i aria-hidden="true" />{t('footer.status')}</span>
          </div>
        </footer>
      </div>
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
