import React, { useState } from 'react';
import { Routes, Route, Link, NavLink } from 'react-router-dom';
import { TerminalWindow, ArrowUpRight, List, X } from '@phosphor-icons/react';
import './index.css';

import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import BuyAccess from './pages/BuyAccess';
import Community from './pages/Community';
import NotFound from './pages/NotFound';

import SoulCursor from './components/SoulCursor';
import WelcomeSplash from './components/WelcomeSplash';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

function AppContent() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const { language, changeLanguage, t } = useLanguage();

  const closeMenu = () => setIsMobileMenuOpen(false);

  const toggleLanguage = () => {
    changeLanguage(language === 'id' ? 'en' : 'id');
  };

  return (
    <>
      <SoulCursor />
      {showSplash && <WelcomeSplash onComplete={() => setShowSplash(false)} />}
      
      <div className="background-wrapper"></div>
      <div className="app-container" style={{ opacity: showSplash ? 0 : 1, transition: 'opacity 0.8s ease-in' }}>
        {/* Navbar */}
        <nav className="navbar">
          <Link to="/" style={{ textDecoration: 'none' }} onClick={closeMenu}>
            <div className="logo">
              <img src="/logo.png" alt="logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
              KryptonCode
            </div>
          </Link>
          
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={28} weight="bold" /> : <List size={28} weight="bold" />}
          </button>
          
          <div className={`nav-content ${isMobileMenuOpen ? 'open' : ''}`}>
            <div className="nav-links">
              <NavLink to="/products" className="nav-item" onClick={closeMenu}>{t('nav.products')}</NavLink>
              <NavLink to="/community" className="nav-item" onClick={closeMenu}>{t('nav.community')}</NavLink>
            </div>
            
            <a href="https://t.me/kryptoncodes" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }} onClick={closeMenu}>
              <button className="btn-secondary btn-sm nav-telegram-btn">
                {t('nav.joinTelegram')} <ArrowUpRight weight="bold" />
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

        {/* Indie Footer */}
        <footer style={{ 
          marginTop: 'auto', 
          borderTop: '1px dashed var(--border)', 
          paddingTop: '20px', 
          paddingBottom: '20px',
          textAlign: 'center', 
          color: 'var(--text-secondary)', 
          fontFamily: 'var(--font-mono)', 
          fontSize: '0.85rem' 
        }}>
          [ <a href="https://t.me/kryptoncodes" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>telegram</a> ] 
          — {t('footer')}
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
