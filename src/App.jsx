import React, { useState } from 'react';
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
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

function AppContent() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const { t } = useLanguage();

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <div className="background-wrapper"></div>
      <BackgroundGlow />
      {showSplash && <WelcomeSplash onComplete={() => setShowSplash(false)} />}
      <div className="app-container" style={{ opacity: showSplash ? 0 : 1, transition: 'opacity 0.8s ease-in' }}>
        {/* Navbar */}
        <nav className="navbar">
          <Link to="/" style={{ textDecoration: 'none' }} onClick={closeMenu}>
            <div className="logo" style={{ color: '#C0C0C0' }}>
              <img src="/splash-logo.png" alt="logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
              KryptonCode
            </div>
          </Link>
          
          <button
            className="mobile-menu-btn"
            type="button"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="primary-navigation"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={26} weight="bold" aria-hidden="true" /> : <List size={26} weight="bold" aria-hidden="true" />}
          </button>
          
          <div id="primary-navigation" className={`nav-content ${isMobileMenuOpen ? 'open' : ''}`}>
            <div className="nav-links">
              <NavLink to="/products" className="nav-item-clean" onClick={closeMenu}>{t('nav.products')}</NavLink>
              <span className="nav-separator"> </span>
              <NavLink to="/community" className="nav-item-clean" onClick={closeMenu}>{t('nav.community')}</NavLink>
            </div>
            
            <a href="https://t.me/kryptoncodes" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }} onClick={closeMenu}>
              <button className="btn-white-pill nav-try-btn">
                Try Agent <ArrowUpRight size={18} weight="bold" />
              </button>
            </a>
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
              <p>Practical tools and automation for a faster digital workflow.</p>
            </div>

            <nav className="footer-nav" aria-label="Footer navigation">
              <p className="footer-label">Explore</p>
              <Link to="/products">{t('nav.products')}</Link>
              <Link to="/community">{t('nav.community')}</Link>
            </nav>

            <div className="footer-connect">
              <p className="footer-label">Connect</p>
              <a href="https://t.me/kryptoncodes" target="_blank" rel="noopener noreferrer">
                Telegram
                <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} KryptonCode</span>
            <span className="footer-status"><i aria-hidden="true" />{t('footer')}</span>
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
