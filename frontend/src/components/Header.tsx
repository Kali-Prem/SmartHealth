import React from 'react';
import { Languages, Eye, Sun, Moon, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { useTranslation } from '../i18n/translations';

export type AppTheme = 'light' | 'dark' | 'high-contrast';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  theme?: AppTheme;
  onThemeChange?: (theme: AppTheme) => void;
  highContrast: boolean;
  onToggleContrast: () => void;
  onOpenCopilot: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  theme = 'light',
  onThemeChange,
  highContrast,
  onToggleContrast,
  onOpenCopilot,
}) => {
  const t = useTranslation(language);

  const handleSelectTheme = (newTheme: AppTheme) => {
    if (onThemeChange) {
      onThemeChange(newTheme);
    } else {
      if (newTheme === 'high-contrast' || theme === 'high-contrast') {
        onToggleContrast();
      }
    }
  };

  return (
    <header className="app-header" role="banner">
      <div className="header-inner">
        <div className="brand-section">
          <img
            src="/assets/logo.jpg"
            alt="SmartHealth Emblem"
            className="brand-logo-img"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div>
            <h1 className="brand-title">
              {t.appTitle}
              <span className="live-indicator" title="Live Health Centre Network Telemetry Active" />
            </h1>
            <p className="brand-subtitle">
              {t.subtitle} • <strong>{t.district}</strong>, {t.state}
            </p>
          </div>
        </div>

        <div className="header-controls">
          {/* Language Switcher */}
          <button
            type="button"
            className="btn"
            onClick={() => onLanguageChange(language === 'en' ? 'hi' : 'en')}
            aria-label={`Change language, currently ${language === 'en' ? 'English' : 'Hindi'}`}
          >
            <Languages size={17} aria-hidden="true" />
            <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>

          {/* Theme Selector: Light / Dark / High Contrast */}
          <div className="theme-toggle-group" role="group" aria-label="Theme selection">
            <button
              type="button"
              className={`theme-toggle-btn ${theme === 'light' && !highContrast ? 'active' : ''}`}
              onClick={() => handleSelectTheme('light')}
              aria-label="Light Mode"
              title="Light Mode (Default)"
            >
              <Sun size={17} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`theme-toggle-btn ${theme === 'dark' && !highContrast ? 'active' : ''}`}
              onClick={() => handleSelectTheme('dark')}
              aria-label="Dark Mode"
              title="Dark Mode"
            >
              <Moon size={17} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`theme-toggle-btn ${highContrast || theme === 'high-contrast' ? 'active' : ''}`}
              onClick={onToggleContrast}
              aria-pressed={highContrast}
              aria-label={t.highContrast}
              title={t.highContrast}
            >
              <Eye size={17} aria-hidden="true" />
            </button>
          </div>

          {/* Gemini AI Health Advisor Gradient CTA Button */}
          <button
            type="button"
            className="btn btn-gemini-advisor"
            onClick={onOpenCopilot}
            aria-label={t.copilot}
          >
            <Sparkles size={17} aria-hidden="true" />
            <span>{language === 'hi' ? 'जेमिनी स्वास्थ्य सलाहकार' : 'Gemini AI Health Advisor'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
