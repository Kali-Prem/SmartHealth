import React from 'react';
import { Languages, Eye, Sun, Moon, Sparkles, Play } from 'lucide-react';
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
  onLaunchDemo?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  theme = 'light',
  onThemeChange,
  highContrast,
  onToggleContrast,
  onOpenCopilot,
  onLaunchDemo,
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
          {/* Trilingual Switcher (English -> Hindi -> Marathi) */}
          <button
            type="button"
            className="btn"
            onClick={() => {
              const next: Record<Language, Language> = { en: 'hi', hi: 'mr', mr: 'en' };
              onLanguageChange(next[language] || 'en');
            }}
            aria-label={`Change language, currently ${language === 'en' ? 'English' : language === 'hi' ? 'Hindi' : 'Marathi'}`}
            title="Cycle Language (English / हिन्दी / मराठी)"
          >
            <Languages size={17} aria-hidden="true" />
            <span>{language === 'en' ? 'हिन्दी' : language === 'hi' ? 'मराठी' : 'English'}</span>
          </button>

          {/* Interactive Demo Mode Button for Evaluators */}
          {onLaunchDemo && (
            <button
              type="button"
              className="btn"
              onClick={onLaunchDemo}
              aria-label="Launch Interactive Demo Mode"
              title="Launch End-to-End Problem to Resolution Demo"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderColor: 'var(--brand-primary)',
                color: 'var(--brand-primary)',
                fontWeight: 700,
              }}
            >
              <Play size={14} fill="currentColor" />
              <span>{t.demoMode || 'Demo Mode'}</span>
            </button>
          )}

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
            <span>
              {language === 'mr'
                ? 'जेमिनी आरोग्य सल्लागार'
                : language === 'hi'
                ? 'जेमिनी स्वास्थ्य सलाहकार'
                : 'Gemini AI Health Advisor'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
