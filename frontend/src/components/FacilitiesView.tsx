import React, { useState } from 'react';
import { Search, MapPin, Phone, BedDouble, Stethoscope } from 'lucide-react';
import { Centre, Language } from '../types';
import { useTranslation } from '../i18n/translations';

interface FacilitiesViewProps {
  centres: Centre[];
  language: Language;
  onSelectCentre: (centreId: string) => void;
  onViewOnMap?: (centreId: string) => void;
}

export const FacilitiesView: React.FC<FacilitiesViewProps> = ({
  centres,
  language,
  onSelectCentre,
  onViewOnMap,
}) => {
  const t = useTranslation(language);
  const [search, setSearch] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const blocks = Array.from(new Set(centres.map((c) => c.block))).sort();

  const filtered = centres.filter((c) => {
    const nameMatch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.name_hi.toLowerCase().includes(search.toLowerCase()) ||
      c.block.toLowerCase().includes(search.toLowerCase());
    const blockMatch = selectedBlock === 'all' || c.block === selectedBlock;
    const typeMatch = selectedType === 'all' || c.facility_type === selectedType;
    return nameMatch && blockMatch && typeMatch;
  });

  return (
    <div className="facilities-view" role="region" aria-label="Health Facilities Directory">
      {/* Controls Bar */}
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
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search
            size={18}
            style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            className="btn"
            style={{
              width: '100%',
              paddingLeft: '38px',
              textAlign: 'left',
              background: 'var(--bg-secondary)',
              cursor: 'text',
            }}
            placeholder={language === 'hi' ? 'केंद्र खोजें (नाम या ब्लॉक)...' : 'Search centres by name or block...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search centres"
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            className="btn"
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            aria-label={t.filterByBlock}
            style={{ background: 'var(--bg-secondary)', cursor: 'pointer' }}
          >
            <option value="all">{t.allBlocks}</option>
            {blocks.map((b) => (
              <option key={b} value={b}>
                {b} Block
              </option>
            ))}
          </select>

          <select
            className="btn"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            aria-label="Filter by Facility Type"
            style={{ background: 'var(--bg-secondary)', cursor: 'pointer' }}
          >
            <option value="all">{t.allTypes}</option>
            <option value="PHC">Primary Health Centres (PHC)</option>
            <option value="CHC">Community Health Centres (CHC)</option>
          </select>
        </div>
      </div>

      {/* Facilities Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '18px',
        }}
      >
        {filtered.map((c) => {
          const isOverloaded = c.problem_type === 'overloaded';
          const isChronic = c.problem_type === 'chronic_stockout';
          const isAbsenteeism = c.problem_type === 'high_doctor_absence';

          let statusBadgeClass = 'badge-optimal';
          let statusText = 'Optimal Ops';

          if (c.operational_status === 'critical' || isOverloaded || isChronic) {
            statusBadgeClass = 'badge-critical';
            statusText = isOverloaded
              ? 'Overloaded (221%)'
              : isChronic
              ? 'Critical Stockout'
              : isAbsenteeism
              ? 'Doctor Deficit'
              : 'Critical Deficit';
          } else if (c.operational_status === 'warning') {
            statusBadgeClass = 'badge-warning';
            statusText = isAbsenteeism ? 'High Absenteeism' : 'Warning';
          }

          return (
            <div
              key={c.id}
              className="glass-panel"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft:
                  c.operational_status === 'critical'
                    ? '4px solid var(--accent-rose)'
                    : c.operational_status === 'warning'
                    ? '4px solid var(--accent-amber)'
                    : '4px solid var(--accent-emerald)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span className={`badge ${statusBadgeClass}`}>{statusText}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    {c.facility_type} • {c.block}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {language === 'hi' ? c.name_hi : c.name}
                </h3>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="var(--accent-teal)" />
                  <span>Lat: {c.latitude.toFixed(4)}, Lng: {c.longitude.toFixed(4)} • Pop: {c.catchment_population.toLocaleString()}</span>
                </p>

                <div
                  style={{
                    background: 'var(--bg-surface-subtle)',
                    border: '1px solid var(--border-subtle)',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '14px',
                    fontSize: '0.84rem',
                    lineHeight: '1.6',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Stethoscope size={14} color="var(--accent-cyan)" />
                    <strong>{t.inCharge}:</strong>
                  </div>
                  <div style={{ color: 'var(--text-primary)', marginLeft: '20px' }}>{c.in_charge_doctor}</div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    <BedDouble size={14} color="var(--accent-indigo)" />
                    <strong>{t.beds}:</strong>
                    <span>
                      {c.infrastructure?.beds_occupied ?? 4} / {c.infrastructure?.beds_total ?? 6} occupied
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <Phone size={14} color="var(--text-muted)" />
                    <span>{c.phone_number}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => onSelectCentre(c.id)}
                >
                  <span>{t.viewDetails}</span>
                </button>
                {onViewOnMap && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ justifyContent: 'center', padding: '8px 12px' }}
                    onClick={() => onViewOnMap(c.id)}
                    aria-label={`View ${c.name} on District Map`}
                  >
                    <MapPin size={16} />
                    <span>Map</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
