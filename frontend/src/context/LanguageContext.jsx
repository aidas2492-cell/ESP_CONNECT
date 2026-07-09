import React, { createContext, useContext, useState } from 'react';
import fr from '../i18n/fr';
import en from '../i18n/en';

const dictionaries = { fr, en };
const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('espconnect_lang') || 'fr');

  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('espconnect_lang', newLang);
  };

  const t = (key) => dictionaries[lang]?.[key] ?? dictionaries.fr[key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
