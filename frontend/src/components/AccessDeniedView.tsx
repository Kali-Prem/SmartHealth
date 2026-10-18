import React from 'react';
import { ShieldAlert, ArrowLeft, UserCheck } from 'lucide-react';
import { Language, AuthUser } from '../types';
import { useTranslation } from '../i18n/translations';

interface AccessDeniedViewProps {
  language: Language;
  currentUser: AuthUser | null;
  onNavigateAllowed: () => void;
  onSwitchRole: () => void;
  attemptedSection?: string;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  language,
  currentUser,
  onNavigateAllowed,
  onSwitchRole,
  attemptedSection,
}) => {
  const t = useTranslation(language);

  const getRoleLabel = () => {
    if (!currentUser) return 'Guest';
    switch (currentUser.role) {
      case 'health_worker':
        return t.roleHealthWorker;
      case 'state_viewer':
        return t.roleStateViewer;
      case 'district_admin':
        return t.roleDistrictAdmin;
      default:
        return currentUser.role;
    }
  };

  const getAllowedDestinationName = () => {
    if (currentUser?.role === 'health_worker') {
      return t.operations;
    }
    return t.dashboard;
  };

  return (
    <div
      className="access-denied-container"
      role="region"
      aria-labelledby="access-denied-title"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '480px',
        padding: '3rem 1.5rem',
        margin: '2rem auto',
        maxWidth: '720px',
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-md)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ef4444',
          marginBottom: '1.5rem',
        }}
        aria-hidden="true"
      >
        <ShieldAlert size={40} />
      </div>

      <span
        style={{
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: '9999px',
          background: 'rgba(239, 68, 68, 0.12)',
          color: '#dc2626',
          fontSize: '0.8125rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.75rem',
        }}
      >
        HTTP 403 • Role Restricted
      </span>

      <h2
        id="access-denied-title"
        style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '0.75rem',
        }}
      >
        {t.accessDeniedTitle}
      </h2>

      <p
        style={{
          fontSize: '0.975rem',
          color: 'var(--text-secondary)',
          maxWidth: '540px',
          lineHeight: 1.6,
          marginBottom: '1.5rem',
        }}
      >
        {t.accessDeniedDesc}
        {attemptedSection && (
          <span style={{ display: 'block', marginTop: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Attempted Module: <em>{attemptedSection}</em>
          </span>
        )}
      </p>

      {currentUser && (
        <div
          style={{
            padding: '1rem 1.25rem',
            background: 'var(--bg-surface-subtle)',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            marginBottom: '2rem',
            width: '100%',
            maxWidth: '500px',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {t.currentRole}:
            </span>
            <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              {getRoleLabel()}
            </strong>
          </div>
          {currentUser.centre_id && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Assigned Facility:
              </span>
              <strong style={{ fontSize: '0.875rem', color: 'var(--brand-primary)' }}>
                {currentUser.facility_name || currentUser.centre_id}
              </strong>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Authorized Scope:
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              {currentUser.role === 'health_worker'
                ? 'Assigned PHC/CHC Daily Operations'
                : currentUser.role === 'state_viewer'
                ? 'Read-Only State Overview'
                : 'District Administrative Command'}
            </span>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <button
          type="button"
          className="btn btn-primary"
          onClick={onNavigateAllowed}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.625rem 1.25rem',
            fontWeight: 600,
          }}
          aria-label={`${t.goToAllowed} (${getAllowedDestinationName()})`}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>
            {t.goToAllowed} ({getAllowedDestinationName()})
          </span>
        </button>

        <button
          type="button"
          className="btn"
          onClick={onSwitchRole}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.625rem 1.25rem',
            fontWeight: 600,
            borderColor: 'var(--brand-primary, #0284c7)',
            color: 'var(--brand-primary, #0284c7)',
          }}
          aria-label={t.switchRole}
        >
          <UserCheck size={16} aria-hidden="true" />
          <span>{t.switchRole}</span>
        </button>
      </div>
    </div>
  );
};
