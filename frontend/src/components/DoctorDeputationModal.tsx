import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Send,
  Building2,
} from 'lucide-react';
import {
  Language,
  DeputationRecommendation,
  DeputationCandidate,
  ExecuteDeputationResponse,
} from '../types';
import { useTranslation } from '../i18n/translations';
import { useToast } from './Toast';

interface DoctorDeputationModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCentreId?: string;
  targetCentreName?: string;
  language: Language;
  onDeputationExecuted?: () => void;
}

export const DoctorDeputationModal: React.FC<DoctorDeputationModalProps> = ({
  isOpen,
  onClose,
  targetCentreId,
  language,
  onDeputationExecuted,
}) => {
  const t = useTranslation(language);
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<DeputationRecommendation[]>([]);
  const [selectedRecIndex, setSelectedRecIndex] = useState(0);
  const [selectedCandidate, setSelectedCandidate] = useState<DeputationCandidate | null>(null);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecuteDeputationResponse | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setExecutionResult(null);

    const fetchRecommendations = async () => {
      try {
        const url = targetCentreId
          ? `/api/v1/operations/deputation/recommendations?target_centre_id=${targetCentreId}`
          : '/api/v1/operations/deputation/recommendations';

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to load recommendations (HTTP ${res.status})`);
        }
        const data: DeputationRecommendation[] = await res.json();
        if (isMounted) {
          setRecommendations(data);
          if (data.length > 0) {
            setSelectedRecIndex(0);
            setSelectedCandidate(data[0].top_candidate);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error fetching deputation recommendations');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRecommendations();
    return () => {
      isMounted = false;
    };
  }, [isOpen, targetCentreId]);

  const activeRec = recommendations[selectedRecIndex] || null;

  const handleExecute = async () => {
    if (!activeRec || !selectedCandidate) return;

    setExecuting(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/operations/deputation/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_centre_id: activeRec.target_centre_id,
          donor_centre_id: selectedCandidate.donor_centre_id,
          doctor_id: selectedCandidate.doctor_id,
          doctor_name: selectedCandidate.doctor_name,
          date: new Date().toISOString().split('T')[0],
          reason: 'Emergency absenteeism load rebalancing',
        }),
      });

      if (!res.ok) {
        throw new Error(`Execution failed (HTTP ${res.status})`);
      }

      const result: ExecuteDeputationResponse = await res.json();
      setExecutionResult(result);
      showToast(
        language === 'hi'
          ? `डॉक्टर प्रतिनियुक्ति आदेश सफलतापूर्वक जारी: डॉ. ${selectedCandidate.doctor_name}`
          : `Doctor Deputation Order Issued: Dr. ${selectedCandidate.doctor_name} deployed`,
        'success'
      );
      if (onDeputationExecuted) {
        onDeputationExecuted();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to issue deputation order');
    } finally {
      setExecuting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deputation-modal-title"
      style={{ zIndex: 1000 }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '740px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-indigo)',
              }}
            >
              <UserCheck size={22} />
            </div>
            <div>
              <h2
                id="deputation-modal-title"
                style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}
              >
                {t.deputationModalTitle}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Haversine Spatial Doctor Relocation & Emergency Coverage Dispatch
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            aria-label="Close modal"
            style={{ padding: '6px', minHeight: 'auto' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Algorithm Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', fontSize: '0.78rem' }}>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: 'var(--accent-cyan)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              fontWeight: 600,
            }}
          >
            📍 Haversine Corridor Matching
          </span>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              background: 'rgba(168, 85, 247, 0.15)',
              color: 'var(--accent-purple)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              fontWeight: 600,
            }}
          >
            ✨ Gemini Clinical Staffing Rationale
          </span>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--accent-emerald)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontWeight: 600,
            }}
          >
            🛡️ Zero-External API Cost
          </span>
        </div>

        {/* Error notification */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: 'var(--accent-rose)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.88rem',
            }}
          >
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                border: '3px solid rgba(99, 102, 241, 0.2)',
                borderTopColor: 'var(--accent-indigo)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 12px auto',
              }}
            />
            <p>Scanning district doctor rosters & calculating Haversine corridor proximity...</p>
          </div>
        )}

        {/* Success notification */}
        {executionResult && (
          <div
            style={{
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)', marginBottom: '8px' }}>
              <CheckCircle2 size={24} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t.deputationSuccess}</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
              {executionResult.message}
            </p>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Deputation ID: <strong>{executionResult.deputation_id}</strong> • Date: {executionResult.date}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        {!loading && !executionResult && recommendations.length > 0 && activeRec && (
          <>
            {/* Target Facility Selector if multiple shortage centres exist */}
            {recommendations.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
                {recommendations.map((rec, i) => (
                  <button
                    key={rec.target_centre_id}
                    type="button"
                    className={`btn ${selectedRecIndex === i ? 'btn-primary' : ''}`}
                    onClick={() => {
                      setSelectedRecIndex(i);
                      setSelectedCandidate(rec.top_candidate);
                    }}
                    style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                  >
                    <span>{language === 'hi' ? rec.target_centre_name_hi : rec.target_centre_name}</span>
                    <span style={{ opacity: 0.8, marginLeft: '4px' }}>({rec.absence_rate_percent}% Abs)</span>
                  </button>
                ))}
              </div>
            )}

            {/* Target Shortage Card */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(244, 63, 94, 0.08)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-rose)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Critical Absence Centre
                </span>
                <p style={{ fontWeight: 800, fontSize: '1rem' }}>
                  {language === 'hi' ? activeRec.target_centre_name_hi : activeRec.target_centre_name} ({activeRec.target_block} Block)
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Absence Rate</span>
                <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-rose)' }}>
                  {activeRec.absence_rate_percent}%
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {activeRec.doctors_present} of {activeRec.doctors_sanctioned} doctors on duty
                </span>
              </div>
            </div>

            {/* Candidate Donor Doctors List */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '10px' }}>
                Candidate Doctors for Temporary Deputation ({activeRec.candidates.length} evaluated):
              </h3>

              {activeRec.candidates.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No available doctors with surplus cover identified within district radius.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeRec.candidates.map((cand, idx) => {
                    const isSelected = selectedCandidate?.doctor_id === cand.doctor_id;
                    const isTop = idx === 0;

                    return (
                      <div
                        key={`${cand.donor_centre_id}-${cand.doctor_id}`}
                        onClick={() => setSelectedCandidate(cand)}
                        style={{
                          padding: '14px',
                          borderRadius: 'var(--radius-md)',
                          background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-card)',
                          border: isSelected ? '2px solid var(--accent-indigo)' : '1px solid var(--border-color)',
                          cursor: 'pointer',
                        }}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setSelectedCandidate(cand);
                          }
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Stethoscope size={16} color="var(--accent-indigo)" />
                            <strong style={{ fontSize: '0.92rem' }}>{cand.doctor_name}</strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>({cand.designation})</span>
                            {isTop && (
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '2px 8px',
                                  borderRadius: '999px',
                                  background: 'rgba(16, 185, 129, 0.2)',
                                  color: 'var(--accent-emerald)',
                                  fontWeight: 700,
                                }}
                              >
                                Top Match
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.82rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-cyan)' }}>
                              <MapPin size={14} />
                              <strong>{cand.distance_km} km</strong>
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                              <Clock size={14} />
                              ~{cand.estimated_transit_mins} mins
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Building2 size={13} />
                            {language === 'hi' ? cand.donor_centre_name_hi : cand.donor_centre_name} ({cand.donor_block} Block)
                          </span>
                          <span>
                            Donor On-Duty Cover: <strong style={{ color: 'var(--text-primary)' }}>{cand.doctors_on_duty_at_donor} MOs</strong> (Safe to depute 1)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Gemini Clinical Justification */}
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
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
                  fontSize: '0.88rem',
                  marginBottom: '8px',
                }}
              >
                <Sparkles size={18} />
                <span>Clinical & Operational Justification (Gemini Rationale)</span>
              </div>
              <p style={{ fontSize: '0.88rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                {language === 'hi' ? activeRec.gemini_justification_hi : activeRec.gemini_justification}
              </p>
            </div>

            {/* Execution Controls */}
            {selectedCandidate && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={executing}
                  onClick={handleExecute}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {executing ? (
                    <>
                      <div
                        style={{
                          width: '14px',
                          height: '14px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#fff',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                        }}
                      />
                      <span>Issuing Order...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>{t.executeDeputation}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {!loading && recommendations.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
            All district health facilities currently maintain adequate doctor shift attendance (&gt; 60% on-duty presence).
          </div>
        )}
      </div>
    </div>
  );
};
