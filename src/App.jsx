import React from 'react';
import { Routes, Route, Link, NavLink } from 'react-router-dom';
import { TerminalWindow, ArrowUpRight } from '@phosphor-icons/react';
import './index.css';

import Home from './pages/Home';
import Scripts from './pages/Scripts';
import PremiumAccess from './pages/PremiumAccess';
import Community from './pages/Community';

function App() {
  return (
    <>
      <div className="background-wrapper"></div>
      <div className="app-container">
        {/* Navbar */}
        <nav className="navbar">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div className="logo">
              <TerminalWindow weight="bold" className="logo-icon" size={24} />
              kryptoncode
            </div>
          </Link>
          
          <div className="nav-links">
            <NavLink to="/scripts" className="nav-item">/scripts</NavLink>
            <NavLink to="/premium" className="nav-item">/premium</NavLink>
            <NavLink to="/community" className="nav-item">/komunitas</NavLink>
          </div>
          
          <Link to="/community" style={{ textDecoration: 'none' }}>
            <button className="btn-secondary" style={{ borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              gabung /telegram <ArrowUpRight weight="bold" />
            </button>
          </Link>
        </nav>

        {/* Dynamic Pages */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scripts" element={<Scripts />} />
          <Route path="/premium" element={<PremiumAccess />} />
          <Route path="/community" element={<Community />} />
        </Routes>

        {/* Indie Footer */}
        <footer style={{ 
          marginTop: 'auto', 
          borderTop: '1px dashed var(--border)', 
          paddingTop: '20px', 
          textAlign: 'center', 
          color: 'var(--text-secondary)', 
          fontFamily: 'var(--font-mono)', 
          fontSize: '0.85rem' 
        }}>
          [ <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none' }}>twitter</a> ] 
          [ <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none' }}>telegram</a> ] 
          — dibangun secara independen oleh kryptoncode 
        </footer>
      </div>
    </>
  );
}

export default App;
