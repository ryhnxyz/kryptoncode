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

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <SoulCursor />
      <div className="background-wrapper"></div>
      <div className="app-container">
        {/* Navbar */}
        <nav className="navbar">
          <Link to="/" style={{ textDecoration: 'none' }} onClick={closeMenu}>
            <div className="logo">
              <TerminalWindow weight="bold" className="logo-icon" size={24} />
              kryptoncode
            </div>
          </Link>
          
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={28} weight="bold" /> : <List size={28} weight="bold" />}
          </button>
          
          <div className={`nav-content ${isMobileMenuOpen ? 'open' : ''}`}>
            <div className="nav-links">
              <NavLink to="/products" className="nav-item" onClick={closeMenu}>/products</NavLink>
              <NavLink to="/community" className="nav-item" onClick={closeMenu}>/komunitas</NavLink>
            </div>
            
            <a href="https://t.me/kryptoncodes" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }} onClick={closeMenu}>
              <button className="btn-secondary nav-telegram-btn" style={{ borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                gabung /telegram <ArrowUpRight weight="bold" />
              </button>
            </a>
          </div>
        </nav>

        {/* Dynamic Pages */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/premium" element={<PremiumAccess />} />
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
          — dibangun secara independen oleh kryptoncode 
        </footer>
      </div>
    </>
  );
}

export default App;
