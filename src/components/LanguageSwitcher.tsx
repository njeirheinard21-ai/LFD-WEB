import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('en') ? 'fr' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors"
      aria-label="Toggle Language"
    >
      <Globe className="h-4 w-4" />
      <span className="font-medium text-sm">
        {i18n.language.startsWith('en') ? 'EN' : 'FR'}
      </span>
    </button>
  );
}
