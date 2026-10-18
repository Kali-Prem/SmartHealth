import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertOctagon,
  UserX,
  Activity,
  ArrowRight,
  Eye,
  ChevronDown,
  ChevronUp,
  MapPin,
} from 'lucide-react';
import { Language, FacilityVulnerabilityScore } from '../types';
import { useTranslation } from '../i18n/translations';

interface UnderperformingAlertBannerProps {
  vulnerableCentres?: FacilityVulnerabilityScore[];
  language: Language;
  onSelectCentre: (centreId: string) => void;
  onOpenInventory: () => void;
  onOpenDeputation?: (centreId: string) => void;
  onOpenForecast?: () => void;
}

type DeficitFilter = 'all' | 'stockout' | 'absence' | 'overloaded';

export const UnderperformingAlertBanner: React.FC<UnderperformingAlertBannerProps> = ({
  language,
  onSelectCentre,
  onOpenInventory,
  onOpenDeputation,
  onOpenForecast,
}) => {
  const t = useTranslation(language);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<DeficitFilter>('all');

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const plantedProblems = [
    {
      id: 'phc_003',
      name: language === 'hi' ? 'घोगरगाव प्राथमिक स्वास्थ्य केंद्र (Ghogargaon PHC)' : 'Ghogargaon PHC (Tribal)',
      block: 'Ambegaon Block',
      type: 'stockout' as const,
      priority: 'P1 Urgent',
      title: t.chronicStockout,
      details:
        language === 'hi'
          ? 'शून्य एंटीवेनम, रेबीज वैक्सीन, ओआरएस एवं रिंगर लैक्टेट। 14 दवाएं पूर्णतः समाप्त। आदिवासी क्षेत्र में सर्पदंश का उच्च जोखिम।'
          : 'Depleted Antivenom, Rabies Vaccine, ORS & Ringer Lactate. 14 critical drugs at 0 stock in high-risk tribal belt.',
      tag: 'Critical Stockout (35% Depletion)',
      actionText: t.lateralRebalance,
      action: onOpenForecast || onOpenInventory,
    },
    {
      id: 'phc_007',
      name: language === 'hi' ? 'आळंदी प्राथमिक स्वास्थ्य केंद्र (Alandi PHC)' : 'Alandi PHC',
      block: 'Khed Block',
      type: 'stockout' as const,
      priority: 'P1 Urgent',
      title: t.chronicStockout,
      details:
        language === 'hi'
          ? 'शून्य अमोक्सिसिलिन, एज़िथ्रोमाइसिन, मेटफॉर्मिन एवं इंसुलिन। प्राथमिक औषधालय में दैनिक एंटीबायोटिक कमी।'
          : 'Depleted Amoxicillin, Azithromycin, Metformin & Insulin Regular. High chronic NCD and infection vulnerability.',
      tag: 'Chronic Antibiotic Deficit',
      actionText: t.lateralRebalance,
      action: onOpenForecast || onOpenInventory,
    },
    {
      id: 'phc_008',
      name: language === 'hi' ? 'मंचर प्राथमिक स्वास्थ्य केंद्र (Manchar PHC)' : 'Manchar PHC',
      block: 'Ambegaon Block',
      type: 'stockout' as const,
      priority: 'P1 Urgent',
      title: t.chronicStockout,
      details:
        language === 'hi'
          ? 'शून्य ऑक्सीटोसिन, आयरन फोलिक एसिड (IFA) एवं ओरल सिरप। मातृ स्वास्थ्य एवं प्रसव पूर्व देखभाल में जोखिम।'
          : 'Zero Oxytocin, Iron Folic Acid (IFA) & pediatric antibiotics. Acute maternal health risk for institutional deliveries.',
      tag: 'Maternal Stockout (0 Oxytocin)',
      actionText: t.lateralRebalance,
      action: onOpenForecast || onOpenInventory,
    },
    {
      id: 'phc_005',
      name: language === 'hi' ? 'नारायणगाव प्राथमिक स्वास्थ्य केंद्र (Narayangaon PHC)' : 'Narayangaon PHC',
      block: 'Junnar Block',
      type: 'absence' as const,
      priority: 'P2 Staffing',
      title: t.highDoctorAbsence,
      details:
        language === 'hi'
          ? '58.3% डॉक्टर अनुपस्थिति दर। मुख्य चिकित्सा अधिकारी बिना सूचना अनुपस्थित, 1 डॉक्टर लंबी छुट्टी पर।'
          : '58.3% doctor absence rate. 1 MO unnotified absent, 1 on extended leave. Casualty shift unstaffed.',
      tag: 'Absenteeism Deficit (58%)',
      actionText: language === 'hi' ? 'ड्यूटी प्रतिनियुक्ति' : 'Cross-Deputation',
      action: () => (onOpenDeputation ? onOpenDeputation('phc_005') : onSelectCentre('phc_005')),
    },
    {
      id: 'phc_006',
      name: language === 'hi' ? 'शिक्रापूर प्राथमिक स्वास्थ्य केंद्र (Shikrapur PHC)' : 'Shikrapur PHC',
      block: 'Shirur Block',
      type: 'absence' as const,
      priority: 'P2 Staffing',
      title: t.highDoctorAbsence,
      details:
        language === 'hi'
          ? '57.8% डॉक्टर अनुपस्थिति दर। ग्रामीण आपातकालीन शिफ्ट रिक्त, केवल नर्सों द्वारा ओपीडी संचालन।'
          : '57.8% doctor absence rate. Emergency casualty shifts unstaffed, OPD operated by staff nurses only.',
      tag: 'Medical Staffing Deficit',
      actionText: language === 'hi' ? 'ड्यूटी प्रतिनियुक्ति' : 'Cross-Deputation',
      action: () => (onOpenDeputation ? onOpenDeputation('phc_006') : onSelectCentre('phc_006')),
    },
    {
      id: 'phc_001',
      name: language === 'hi' ? 'वाघोली प्राथमिक स्वास्थ्य केंद्र (Wagholi PHC)' : 'Wagholi PHC (Peri-Urban)',
      block: 'Haveli Block',
      type: 'overloaded' as const,
      priority: 'P2 Surge',
      title: t.facilityOverloaded,
      details:
        language === 'hi'
          ? '221% ओपीडी क्षमता संतृप्ति, 112.5% बेड अधिभोग। औसत प्रतीक्षा समय 56 मिनट। अतिरिक्त डॉक्टरों की तत्काल आवश्यकता।'
          : '221% OPD saturation, 112.5% bed capacity overflow. Avg wait time 56 mins. Immediate patient diversion needed.',
      tag: 'Capacity Overload (221%)',
      actionText: language === 'hi' ? 'भार संतुलन' : 'Triage Load Balancing',
      action: () => onSelectCentre('phc_001'),
    },
  ];

  const filteredProblems = plantedProblems.filter(
    (p) => activeFilter === 'all' || p.type === activeFilter
  );

  const filterOptions: { key: DeficitFilter; label: string; count: number }[] = [
    {
      key: 'all',
      label: language === 'mr' ? 'सर्व' : language === 'hi' ? 'सभी' : 'All Deficits',
      count: 6,
    },
    {
      key: 'stockout',
      label: language === 'mr' ? 'औषध तुटवडा' : language === 'hi' ? 'दवा स्टॉकआउट' : 'Medicine Stockout',
      count: 3,
    },
    {
      key: 'absence',
      label: language === 'mr' ? 'डॉक्टर गैरहजेरी' : language === 'hi' ? 'डॉक्टर अनुपस्थिति' : 'Doctor Absence',
      count: 2,
    },
    {
      key: 'overloaded',
      label: language === 'mr' ? 'अतिभारित' : language === 'hi' ? 'अतिभारित' : 'Overcrowding',
      count: 1,
    },
  ];

  return (
    <section
      className="alerts-banner-container"
      role="region"
      aria-label="Critical Operational Alerts & Deficits Flagged"
    >
      <div className="alerts-header">
        <div className="alerts-header-left">
          <div className="alerts-icon-wrap" aria-hidden="true">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h2 className="alerts-title">{t.alertsTitle}</h2>
            <p className="alerts-subtitle">
              <span className="live-status-pulse" aria-hidden="true" />
              <span>
                {language === 'mr'
                  ? 'तातडीच्या हस्तक्षेपाची गरज असलेली ६ आरोग्य केंद्रे • सक्रिय नियंत्रण कक्ष'
                  : language === 'hi'
                  ? 'तत्काल प्रशासनिक हस्तक्षेप की आवश्यकता वाले 6 केंद्र • सक्रिय नियंत्रण कक्ष'
                  : '6 facilities requiring immediate intervention • Live Telemetry Surveillance'}
              </span>
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="alerts-filter-group" role="group" aria-label="Filter Deficits">
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`alerts-filter-btn ${activeFilter === opt.key ? 'active' : ''}`}
              onClick={() => setActiveFilter(opt.key)}
              aria-pressed={activeFilter === opt.key}
            >
              <span>{opt.label}</span>
              <span className="filter-count-badge">{opt.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="planted-problems-list">
        {filteredProblems.map((prob) => {
          const isExpanded = expandedId === prob.id;

          return (
            <article
              key={prob.id}
              className={`problem-card ${prob.type}`}
              aria-label={`${prob.name}: ${prob.tag}`}
            >
              {/* Row 1: Category Tag & Priority Pill */}
              <div className="problem-meta-top">
                <span className={`problem-tag ${prob.type}`}>
                  {prob.type === 'stockout' && <AlertOctagon size={13} aria-hidden="true" />}
                  {prob.type === 'absence' && <UserX size={13} aria-hidden="true" />}
                  {prob.type === 'overloaded' && <Activity size={13} aria-hidden="true" />}
                  <span>{prob.tag}</span>
                </span>
                <span className={`problem-priority-pill ${prob.type}`}>
                  {prob.priority}
                </span>
              </div>

              {/* Row 2: Facility Name & Block */}
              <div className="problem-centre-info">
                <h3 className="problem-centre-name">{prob.name}</h3>
                <div className="problem-location-badge">
                  <MapPin size={13} aria-hidden="true" />
                  <span>{prob.block}</span>
                </div>
              </div>

              {/* Row 3: Description with clamp & toggle */}
              <div className="problem-body">
                <p
                  className="problem-description"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: isExpanded ? 'unset' : 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: isExpanded ? 'visible' : 'hidden',
                  }}
                >
                  {prob.details}
                </p>
                <button
                  type="button"
                  onClick={() => toggleExpand(prob.id)}
                  className="problem-expand-btn"
                  aria-expanded={isExpanded}
                >
                  <span>{isExpanded ? 'Show less' : 'View details'}</span>
                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>

              {/* Row 4: Professional Action Buttons */}
              <div className="problem-card-actions">
                <button
                  type="button"
                  className="btn btn-primary problem-action-btn"
                  onClick={prob.action}
                  aria-label={`${prob.actionText} for ${prob.name}`}
                >
                  <span>{prob.actionText}</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost problem-view-btn"
                  onClick={() => onSelectCentre(prob.id)}
                  aria-label={`View facility details for ${prob.name}`}
                  title="View Facility Details"
                >
                  <Eye size={14} aria-hidden="true" />
                  <span>View</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
