import React, { useState } from 'react';
import { Users, Clock, Stethoscope, FlaskConical, AlertTriangle, Sparkles, UserCheck } from 'lucide-react';
import { DailyFootfall, DoctorAttendance, LabTestAudit, Language } from '../types';
import { useTranslation } from '../i18n/translations';

interface OperationsViewProps {
  footfallLogs: DailyFootfall[];
  attendanceLogs: DoctorAttendance[];
  testAudits: LabTestAudit[];
  language: Language;
  onOpenDeputationModal?: (centreId?: string, centreName?: string) => void;
}

export const OperationsView: React.FC<OperationsViewProps> = ({
  footfallLogs,
  attendanceLogs,
  testAudits,
  language,
  onOpenDeputationModal,
}) => {
  const t = useTranslation(language);
  const [subTab, setSubTab] = useState<'footfall' | 'attendance' | 'tests'>('footfall');

  return (
    <div className="operations-view" role="region" aria-label="Operations Ledger">
      {/* Sub-navigation */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          type="button"
          className={`btn ${subTab === 'footfall' ? 'btn-primary' : ''}`}
          onClick={() => setSubTab('footfall')}
        >
          <Users size={18} />
          <span>{t.patientFootfallTrend}</span>
        </button>

        <button
          type="button"
          className={`btn ${subTab === 'attendance' ? 'btn-primary' : ''}`}
          onClick={() => setSubTab('attendance')}
        >
          <Stethoscope size={18} />
          <span>{t.doctorRoster}</span>
        </button>

        <button
          type="button"
          className={`btn ${subTab === 'tests' ? 'btn-primary' : ''}`}
          onClick={() => setSubTab('tests')}
        >
          <FlaskConical size={18} />
          <span>{t.labTestAudits}</span>
        </button>
      </div>

      {/* 1. Footfall Subtab */}
      {subTab === 'footfall' && (
        <>
          {/* Desktop & Tablet Table (>=640px) */}
          <div className="footfall-desktop-table glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
            <div className="data-table-wrapper">
              <table className="data-table" aria-label={t.patientFootfallTrend}>
                <thead>
                  <tr>
                    <th>Health Facility</th>
                    <th>Date</th>
                    <th>Total OPD Visits</th>
                    <th>Casualty / Emergency</th>
                    <th>Maternal & Child</th>
                    <th>NCD Clinic</th>
                    <th>Avg Wait Time</th>
                    <th>Capacity Saturation</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {footfallLogs.slice(0, 30).map((log) => {
                    const isOvercrowded = log.capacity_saturation_percent > 120.0;
                    return (
                      <tr key={log.id}>
                        <td>
                          <strong style={{ color: 'var(--text-primary)' }}>{log.centre_name || log.centre_id}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.block} Block</div>
                        </td>
                        <td>{log.date}</td>
                        <td>
                          <strong style={{ fontSize: '1rem', color: isOvercrowded ? 'var(--accent-rose)' : 'inherit' }}>
                            {log.total_opd_visits}
                          </strong>
                        </td>
                        <td>{log.emergency_visits}</td>
                        <td>{log.maternal_child_visits}</td>
                        <td>{log.ncd_visits}</td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={14} color="var(--accent-teal)" />
                            {log.average_wait_time_minutes} {t.minutes}
                          </span>
                        </td>
                        <td>
                          <strong
                            style={{
                              color: isOvercrowded ? 'var(--accent-rose)' : log.capacity_saturation_percent > 90 ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                            }}
                          >
                            {log.capacity_saturation_percent}%
                          </strong>
                        </td>
                        <td>
                          {isOvercrowded ? (
                            <span className="badge badge-critical">Overcrowded (Surge)</span>
                          ) : log.capacity_saturation_percent >= 90 ? (
                            <span className="badge badge-warning">High</span>
                          ) : (
                            <span className="badge badge-optimal">Normal</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Adaptive Mobile Cards (<640px) with semantic markup and ARIA labels */}
          <ul className="footfall-mobile-cards" role="list" aria-label={t.patientFootfallTrend}>
            {footfallLogs.slice(0, 30).map((log) => {
              const isOvercrowded = log.capacity_saturation_percent > 120.0;
              return (
                <li key={`mobile-${log.id}`} role="listitem">
                  <article
                    className="glass-panel"
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      border: isOvercrowded
                        ? '1px solid rgba(244, 63, 94, 0.4)'
                        : '1px solid var(--border-color)',
                      background: isOvercrowded
                        ? 'rgba(244, 63, 94, 0.05)'
                        : 'var(--bg-card)',
                    }}
                    aria-label={`Footfall card for ${log.centre_name || log.centre_id} on ${log.date}`}
                  >
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                          {log.centre_name || log.centre_id}
                        </h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                          {log.block} Block • <time dateTime={log.date}>{log.date}</time>
                        </p>
                      </div>
                      <div>
                        {isOvercrowded ? (
                          <span className="badge badge-critical" aria-label="Status: Overcrowded">Overcrowded (Surge)</span>
                        ) : log.capacity_saturation_percent >= 90 ? (
                          <span className="badge badge-warning" aria-label="Status: High Capacity">High</span>
                        ) : (
                          <span className="badge badge-optimal" aria-label="Status: Normal Capacity">Normal</span>
                        )}
                      </div>
                    </header>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '10px',
                        fontSize: '0.82rem',
                        paddingTop: '10px',
                        borderTop: '1px solid var(--border-color)',
                      }}
                    >
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Total OPD Visits:</span>
                        <div>
                          <strong style={{ fontSize: '1.15rem', color: isOvercrowded ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                            {log.total_opd_visits}
                          </strong>
                        </div>
                      </div>

                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Capacity Saturation:</span>
                        <div>
                          <strong
                            style={{
                              fontSize: '1.15rem',
                              color: isOvercrowded
                                ? 'var(--accent-rose)'
                                : log.capacity_saturation_percent > 90
                                ? 'var(--accent-amber)'
                                : 'var(--accent-emerald)',
                            }}
                          >
                            {log.capacity_saturation_percent}%
                          </strong>
                        </div>
                      </div>

                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Casualty / Emergency:</span>
                        <div><strong style={{ color: 'var(--text-primary)' }}>{log.emergency_visits}</strong></div>
                      </div>

                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Avg Wait Time:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} color="var(--accent-teal)" aria-hidden="true" />
                          <strong style={{ color: 'var(--text-primary)' }}>{log.average_wait_time_minutes} {t.minutes}</strong>
                        </div>
                      </div>

                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Maternal & Child:</span>
                        <div><strong style={{ color: 'var(--text-primary)' }}>{log.maternal_child_visits}</strong></div>
                      </div>

                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>NCD Clinic:</span>
                        <div><strong style={{ color: 'var(--text-primary)' }}>{log.ncd_visits}</strong></div>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* 2. Doctor Attendance Subtab */}
      {subTab === 'attendance' && (
        <>
          <div
            className="glass-panel"
            style={{
              padding: '16px 20px',
              marginBottom: '16px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
              border: '1px solid rgba(14, 165, 233, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(14, 165, 233, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-cyan)',
                }}
              >
                <Stethoscope size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {language === 'hi' ? 'स्मार्ट डॉक्टर प्रतिनियुक्ति सहायक' : 'Smart Doctor Deputation Assistant'}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  {language === 'hi'
                    ? 'अति-कमी वाले केंद्रों (जैसे नारायणगाव, शिक्रापूर) के लिए निकटतम CHC से दूरी-अनुकूलित प्रतिनियुक्ति'
                    : 'Detects acute doctor shortages (>=40% absence) and identifies nearest surplus CHC donor physicians.'}
                </p>
              </div>
            </div>

            {onOpenDeputationModal && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onOpenDeputationModal()}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Sparkles size={16} />
                <span>{language === 'hi' ? 'प्रतिनियुक्ति योजना बनाएँ' : 'Launch Deputation Assistant'}</span>
              </button>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Health Facility</th>
                    <th>Roster Date</th>
                    <th>Sanctioned Doctors</th>
                    <th>Doctors On Duty</th>
                    <th>Absence Rate</th>
                    <th>Shift Status</th>
                    <th>Doctor Names & Shifts</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceLogs.slice(0, 25).map((att) => {
                    const isHighAbsence = att.absence_rate_percent >= 50.0;
                    return (
                      <tr key={att.id}>
                        <td>
                          <strong style={{ color: 'var(--text-primary)' }}>{att.centre_name || att.centre_id}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{att.block} Block</div>
                        </td>
                        <td>{att.date}</td>
                        <td>{att.doctors_sanctioned}</td>
                        <td>
                          <strong style={{ color: isHighAbsence ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                            {att.doctors_present_today}
                          </strong>
                        </td>
                        <td>
                          <strong style={{ color: isHighAbsence ? 'var(--accent-rose)' : 'inherit' }}>
                            {att.absence_rate_percent}%
                          </strong>
                        </td>
                        <td>
                          {isHighAbsence ? (
                            <span className="badge badge-critical">
                              <AlertTriangle size={12} />
                              Critical Shortage
                            </span>
                          ) : (
                            <span className="badge badge-optimal">Staffed</span>
                          )}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                            {att.doctors && att.doctors.length > 0 ? (
                              att.doctors.map((d, i) => (
                                <div key={i} style={{ color: d.status === 'present' ? '#93c5fd' : '#fca5a5' }}>
                                  • {d.name} ({d.designation}): <strong>{d.status.toUpperCase()}</strong>
                                </div>
                              ))
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>1 MO on duty</span>
                            )}
                          </div>
                        </td>
                        <td>
                          {isHighAbsence && onOpenDeputationModal ? (
                            <button
                              type="button"
                              className="btn"
                              style={{
                                fontSize: '0.75rem',
                                padding: '4px 10px',
                                background: 'rgba(244, 63, 94, 0.15)',
                                borderColor: 'rgba(244, 63, 94, 0.4)',
                                color: '#fda4af',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap',
                              }}
                              onClick={() => onOpenDeputationModal(att.centre_id, att.centre_name)}
                            >
                              <UserCheck size={14} />
                              <span>{language === 'hi' ? 'प्रतिनियुक्त करें' : 'Depute'}</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 3. Lab Test Audits Subtab */}
      {subTab === 'tests' && (
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Health Facility</th>
                  <th>Audit Date</th>
                  <th>Total Audited Tests</th>
                  <th>Available Diagnostic Tests</th>
                  <th>Readiness Rate</th>
                  <th>Key Test Kits In-Stock</th>
                </tr>
              </thead>
              <tbody>
                {testAudits.slice(0, 25).map((audit) => {
                  const isLow = audit.availability_rate_percent < 80.0;
                  return (
                    <tr key={audit.id}>
                      <td>
                        <strong style={{ color: 'var(--text-primary)' }}>{audit.centre_name || audit.centre_id}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{audit.block} Block</div>
                      </td>
                      <td>{audit.audit_date}</td>
                      <td>{audit.total_audited_tests} tests</td>
                      <td>
                        <strong>{audit.available_tests} available</strong>
                      </td>
                      <td>
                        <strong style={{ color: isLow ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                          {audit.availability_rate_percent}%
                        </strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {audit.tests && audit.tests.length > 0 ? (
                            audit.tests.map((t, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background:
                                    t.status === 'available'
                                      ? 'rgba(16, 185, 129, 0.15)'
                                      : 'rgba(244, 63, 94, 0.2)',
                                  color: t.status === 'available' ? '#6ee7b7' : '#fda4af',
                                }}
                              >
                                {t.test_name}: {t.status === 'available' ? `${t.kits_remaining} kits` : 'OUT OF STOCK'}
                              </span>
                            ))
                          ) : (
                            <span>All essential diagnostic tests ready</span>
                          )}
                        </div>
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
