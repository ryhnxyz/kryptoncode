import React, { createContext, useContext, useState, useEffect } from 'react';
import id from '../locales/id.json';
import en from '../locales/en.json';

const translations = { id, en };
const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('id');

  useEffect(() => {
    const savedLang = localStorage.getItem('app_language');
    if (savedLang && translations[savedLang]) {
      setLanguage(savedLang);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === 'id' ? 'id' : 'en';
  }, [language]);

  const changeLanguage = (lang) => {
    if (!translations[lang]) return;
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    for (const k of keys) {
      if (value[k] === undefined) {
        // Fallback to id if key missing
        let fallbackValue = translations['id'];
        for (const fk of keys) {
          if (fallbackValue[fk] === undefined) return key;
          fallbackValue = fallbackValue[fk];
        }
        return fallbackValue;
      }
      value = value[k];
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
