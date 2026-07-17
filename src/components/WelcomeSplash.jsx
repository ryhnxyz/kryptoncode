import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

export default function WelcomeSplash({ onComplete }) {
  const [stage, setStage] = useState('intro'); // intro -> lang-select -> done
  const { changeLanguage } = useLanguage();

  const titleText = "KryptonCode".split('');

  useEffect(() => {
    const savedLang = localStorage.getItem('app_language');
    const timer = setTimeout(() => {
      if (savedLang) {
        setStage('done');
        setTimeout(onComplete, 1200);
      } else {
        setStage('lang-select');
      }
    }, 2800);
    
    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleSelectLanguage = (lang) => {
    changeLanguage(lang);
    setStage('done');
    setTimeout(onComplete, 1200);
  };

  return (
    <AnimatePresence>
      {stage !== 'done' && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'var(--bg-color)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden'
          }}
        >
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <div style={{ 
              position: 'relative', 
              width: '140px', 
              height: '140px', 
              marginBottom: stage === 'lang-select' ? '40px' : '0', 
              transition: 'margin 0.6s cubic-bezier(0.4, 0, 0.2, 1)' 
            }}>
              {/* Static pure logo underneath */}
              <img 
                src={stage === 'intro' ? "/logo-dark.png" : "/splash-logo.png"} 
                alt="logo" 
                style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, objectFit: 'contain', transition: 'all 0.5s ease' }} 
              />
              
              {/* Animated Chromia effect that fades out smoothly */}
              <motion.div 
                className="fx-chrome-logo" 
                initial={{ opacity: 1 }}
                animate={{ opacity: stage === 'intro' ? 1 : 0 }}
                transition={{ duration: 0.6 }}
                style={{ 
                  width: '100%', height: '100%', position: 'absolute', top: 0, left: 0,
                  WebkitMaskImage: stage === 'intro' ? 'url(/logo-dark.png)' : undefined,
                  maskImage: stage === 'intro' ? 'url(/logo-dark.png)' : undefined
                }} 
              />
            </div>
          </motion.div>

          {stage === 'lang-select' && (
            <motion.div
              key="lang-select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '30px'
              }}
            >
              <motion.h2 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-primary)', fontWeight: 500, fontSize: '1.4rem' }}
              >
                Select System Language
              </motion.h2>
              
              <div style={{ display: 'flex', gap: '20px' }}>
                {[{id: 'id', label: 'Indonesia'}, {id: 'en', label: 'English'}].map((lang, idx) => (
                  <motion.button
                    key={lang.id}
                    className="btn-dark"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
                    onClick={() => handleSelectLanguage(lang.id)}
                  >
                    {lang.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
