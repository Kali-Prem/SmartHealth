import React from 'react';
import { Zap, Pill, UserX, Activity, ArrowRight } from 'lucide-react';
import { Language } from '../types';

interface TopPrioritiesPanelProps {
  language: Language;
  onOpenInventory: () => void;
  onOpenDeputation: (centreId: string) => void;
  onSelectCentre: (centreId: string) => void;
}

export const TopPrioritiesPanel: React.FC<TopPrioritiesPanelProps> = ({
  language,
  onOpenInventory,
  onOpenDeputation,
  onSelectCentre,
}) => {
  const priorities = [
    {
      id: 'priority_1',
      icon: <Pill size={16} color="var(--accent-rose)" />,
      type: 'Stockout',
      typeBadgeClass: 'problem-tag stockout',
      facility: language === 'hi' ? 'घोगरगाव केंद्र' : 'Ambegaon Tribal Centre',
      detail: language === 'hi' ? '0 एंटीवेनम शीशियां (आदिवासी ब्लॉक)' : '0 Antivenom Vials Remaining',
      actionText: language === 'hi' ? 'पुनर्संतुलन' : 'Rebalance',
      action: onOpenInventory,
    },
    {
      id: 'priority_2',
      icon: <UserX size={16} color="var(--accent-amber)" />,
      type: 'Staffing',
      typeBadgeClass: 'problem-tag absence',
      facility: language === 'hi' ? 'नारायणगाव केंद्र' : 'Junnar Casualty Unit',
      detail: language === 'hi' ? '58% डॉक्टर अनुपस्थिति (1 बिना सूचना)' : '58% Doctor Absence (Casualty)',
      actionText: language === 'hi' ? 'प्रतिनियुक्ति' : 'Depute',
      action: () => onOpenDeputation('phc_005'),
    },
    {
      id: 'priority_3',
      icon: <Activity size={16} color="var(--accent-indigo)" />,
      type: 'Overload',
      typeBadgeClass: 'problem-tag overloaded',
      facility: language === 'hi' ? 'वाघोली केंद्र' : 'Haveli Triage Hub',
      detail: language === 'hi' ? '221% क्षमता अधिभार (56 मिनट प्रतीक्षा)' : '221% OPD Saturation (56m wait)',
      actionText: language === 'hi' ? 'निरीक्षण' : 'Monitor',
      action: () => onSelectCentre('phc_001'),
    },
  ];

  return (
    <section className="priority-strip" aria-label="Top Priorities Today">
      <div className="priority-header">
        <div className="priority-title">
          <Zap size={18} color="var(--brand-primary)" aria-hidden="true" />
          <span>{language === 'hi' ? 'आज की शीर्ष प्राथमिकताएं' : 'Top Priorities Today'}</span>
          <span className="live-indicator" style={{ width: '7px', height: '7px' }} />
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {language === 'hi' ? 'वास्तविक समय जिला स्वचालित विश्लेषण' : 'Autonomous Real-time Triage'}
        </span>
      </div>

      <div className="priority-cards-grid">
        {priorities.map((item) => (
          <div key={item.id} className="priority-item-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {item.icon}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                    {item.facility}
                  </strong>
                  <span className={item.typeBadgeClass} style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                    {item.type}
                  </span>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{item.detail}</div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: '6px 10px', fontSize: '0.78rem', minHeight: '34px', color: 'var(--brand-primary)', fontWeight: 700 }}
              onClick={item.action}
              aria-label={`${item.actionText} for ${item.facility}`}
            >
              <span>{item.actionText}</span>
              <ArrowRight size={13} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
