import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRightLeft,
  Filter,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import {
  Language,
  EarlyStockoutReport,
  StockForecastItem,
  EarlyStockoutWarning,
} from '../types';
import { useTranslation } from '../i18n/translations';

interface DemandForecastViewProps {
  language: Language;
  onOpenRebalanceModal?: (centreId: string, centreName: string, drugName: string) => void;
}

export const DemandForecastView: React.FC<DemandForecastViewProps> = ({
  language,
  onOpenRebalanceModal,
}) => {
  const t = useTranslation(language);
  const [loading, setLoading] = useState(true);
  const [warningsReport, setWarningsReport] = useState<EarlyStockoutReport | null>(null);
  const [forecasts, setForecasts] = useState<StockForecastItem[]>([]);
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'immediate' | 'imminent' | 'warning'>('all');
  const [activeTab, setActiveTab] = useState<'early_warnings' | '30d_forecast'>('early_warnings');

  useEffect(() => {
    let isMounted = true;
    const fetchForecastData = async () => {
      try {
        const [warnRes, foreRes] = await Promise.all([
          fetch('/api/v1/inventory/early-warnings'),
          fetch('/api/v1/inventory/forecast'),
        ]);

        if (warnRes.ok && isMounted) {
          const warnData: EarlyStockoutReport = await warnRes.json();
          setWarningsReport(warnData);
        }
        if (foreRes.ok && isMounted) {
          const foreData: StockForecastItem[] = await foreRes.json();
          setForecasts(foreData);
        }
      } catch {
        // Fallback or offline
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchForecastData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredWarnings = (warningsReport?.warnings || []).filter((w) => {
    if (urgencyFilter === 'all') return true;
    return w.urgency === urgencyFilter;
  });

  return (
    <div className="demand-forecast-view" role="region" aria-label={t.demandForecast}>
      {/* Header & Sub-Nav */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-amber)',
            }}
          >
            <TrendingUp size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {t.demandForecast}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              AI Burn Rate Projections, Early Stockout Radar & 30-Day Epidemiological Demand
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={`btn ${activeTab === 'early_warnings' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('early_warnings')}
            style={{ fontSize: '0.82rem' }}
          >
            <AlertTriangle size={15} />
            <span>Early Warning Radar ({warningsReport?.total_warning_items ?? 0})</span>
          </button>
          <button
            type="button"
            className={`btn ${activeTab === '30d_forecast' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('30d_forecast')}
            style={{ fontSize: '0.82rem' }}
          >
            <Calendar size={15} />
            <span>30-Day Demand Forecast ({forecasts.length})</span>
          </button>
        </div>
      </div>

      {/* Gemini Epidemiological Advisory Banner */}
      {warningsReport && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(168, 85, 247, 0.08)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--accent-purple)',
              fontWeight: 700,
              fontSize: '0.9rem',
              marginBottom: '6px',
            }}
          >
            <Sparkles size={18} />
            <span>Gemini AI District Epidemiological Advisory & Advance Indent Guidance</span>
          </div>
          <p style={{ fontSize: '0.88rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
            {language === 'hi'
              ? warningsReport.gemini_epidemiology_advisory_hi
              : warningsReport.gemini_epidemiology_advisory}
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              marginTop: '12px',
              fontSize: '0.82rem',
              borderTop: '1px solid rgba(168, 85, 247, 0.15)',
              paddingTop: '10px',
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Critical Depletion (&lt;3d): </span>
              <strong style={{ color: 'var(--accent-rose)' }}>{warningsReport.critical_immediate_count} drugs</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Imminent Stockout (&lt;7d): </span>
              <strong style={{ color: 'var(--accent-amber)' }}>{warningsReport.imminent_7d_count} drugs</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Forecast Algorithm: </span>
              <strong style={{ color: 'var(--accent-cyan)' }}>C-SUM Burn Rate + Seasonal Vector Multiplier</strong>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid rgba(245, 158, 11, 0.2)',
              borderTopColor: 'var(--accent-amber)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px auto',
            }}
          />
          <p>Compiling 90-day time-series telemetry and calculating forward demand buffers...</p>
        </div>
      )}

      {/* TAB 1: Early Stockout Warning Countdown Radar */}
      {!loading && activeTab === 'early_warnings' && (
        <div>
          {/* Urgency Filter */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              <Filter size={16} />
              <span>Filter Urgency:</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['all', 'immediate', 'imminent', 'warning'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  className={`btn ${urgencyFilter === lvl ? 'active' : ''}`}
                  onClick={() => setUrgencyFilter(lvl)}
                  style={{
                    padding: '4px 12px',
                    fontSize: '0.78rem',
                    textTransform: 'capitalize',
                  }}
                >
                  {lvl === 'immediate'
                    ? 'Immediate (< 3 days)'
                    : lvl === 'imminent'
                    ? 'Imminent (< 7 days)'
                    : lvl === 'warning'
                    ? 'Warning (< 14 days)'
                    : 'All Depleting'}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px',
            }}
          >
            {filteredWarnings.map((warn: EarlyStockoutWarning, idx: number) => {
              const isZero = warn.current_stock === 0;
              const isImmediate = warn.urgency === 'immediate';

              return (
                <div
                  key={`${warn.centre_id}-${warn.drug_name}-${idx}`}
                  className="glass-panel"
                  style={{
                    padding: '18px',
                    borderRadius: 'var(--radius-md)',
                    border: isImmediate
                      ? '1px solid rgba(244, 63, 94, 0.4)'
                      : '1px solid var(--border-color)',
                    background: isImmediate
                      ? 'rgba(244, 63, 94, 0.04)'
                      : 'var(--bg-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    {/* Urgency Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: isImmediate
                            ? 'rgba(244, 63, 94, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                          color: isImmediate
                            ? 'var(--accent-rose)'
                            : 'var(--accent-amber)',
                        }}
                      >
                        {isZero
                          ? 'Active Stockout'
                          : isImmediate
                          ? '🚨 Critical (< 3d)'
                          : '⚠️ Imminent (< 7d)'}
                      </span>

                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <Clock size={13} />
                        <strong>
                          {isZero ? '0 days remaining' : `Stockout in ${warn.stockout_in_days}d`}
                        </strong>
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {language === 'hi' ? warn.drug_name_hi : warn.drug_name}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      {language === 'hi' ? warn.centre_name_hi : warn.centre_name} ({warn.block} Block)
                    </p>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        fontSize: '0.8rem',
                        padding: '10px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-secondary)',
                        marginBottom: '14px',
                      }}
                    >
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Current Stock:</span>
                        <p style={{ fontWeight: 700, color: isZero ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                          {warn.current_stock} units
                        </p>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>{t.burnRate}:</span>
                        <p style={{ fontWeight: 700 }}>
                          ~{warn.daily_burn_rate} /day
                        </p>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>{t.daysRemaining}:</span>
                        <p style={{ fontWeight: 700, color: isImmediate ? 'var(--accent-rose)' : 'var(--accent-amber)' }}>
                          {warn.days_of_supply_remaining} days
                        </p>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>{t.recommendedProcurement}:</span>
                        <p style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>
                          +{warn.recommended_order_quantity}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rebalance Action */}
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%', fontSize: '0.82rem', justifyContent: 'center' }}
                    onClick={() => {
                      if (onOpenRebalanceModal) {
                        onOpenRebalanceModal(warn.centre_id, warn.centre_name, warn.drug_name);
                      }
                    }}
                  >
                    <ArrowRightLeft size={14} />
                    <span>Trigger Lateral Rebalance</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: 30-Day Forward Demand Forecast Table */}
      {!loading && activeTab === '30d_forecast' && (
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" aria-label="30-Day Demand Projections">
              <thead>
                <tr>
                  <th>Medicine / Vaccine</th>
                  <th>Category</th>
                  <th>Current District Stock</th>
                  <th>Predicted 30-Day Demand</th>
                  <th>Advance Indent Rec.</th>
                  <th>Epidemiological Risk</th>
                  <th>Clinical Rationale</th>
                </tr>
              </thead>
              <tbody>
                {forecasts.map((fc: StockForecastItem, idx: number) => {
                  const isHigh = fc.risk_level === 'high';
                  const isMedium = fc.risk_level === 'medium';

                  return (
                    <tr key={`${fc.drug_name}-${idx}`}>
                      <td>
                        <strong>{language === 'hi' ? fc.drug_name_hi : fc.drug_name}</strong>
                      </td>
                      <td>
                        <span style={{ textTransform: 'capitalize', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {fc.category.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <strong>{fc.current_district_stock}</strong>
                      </td>
                      <td>
                        <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
                          {fc.predicted_monthly_consumption}
                        </span>
                      </td>
                      <td>
                        {fc.procurement_recommendation > 0 ? (
                          <span style={{ color: 'var(--accent-rose)', fontWeight: 700 }}>
                            +{fc.procurement_recommendation}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14} />
                            Adequate
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: isHigh
                              ? 'rgba(244, 63, 94, 0.15)'
                              : isMedium
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(16, 185, 129, 0.15)',
                            color: isHigh
                              ? 'var(--accent-rose)'
                              : isMedium
                              ? 'var(--accent-amber)'
                              : 'var(--accent-emerald)',
                          }}
                        >
                          {fc.risk_level}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '280px' }}>
                        {fc.rationale}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
