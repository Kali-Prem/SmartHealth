import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRightLeft,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Pill,
  Send,
} from 'lucide-react';
import {
  Language,
  RebalanceCandidate,
  RebalanceOptimizationResponse,
  ExecuteRebalanceResponse,
} from '../types';
import { useTranslation } from '../i18n/translations';
import { useToast } from './Toast';

interface LateralRebalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCentreId: string;
  targetCentreName: string;
  drugName: string;
  language: Language;
  onTransferComplete?: (res: ExecuteRebalanceResponse) => void;
}

export const LateralRebalanceModal: React.FC<LateralRebalanceModalProps> = ({
  isOpen,
  onClose,
  targetCentreId,
  targetCentreName,
  drugName,
  language,
  onTransferComplete,
}) => {
  const t = useTranslation(language);
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RebalanceOptimizationResponse | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<RebalanceCandidate | null>(null);
  const [transferQty, setTransferQty] = useState<number>(10);
  const [transferReason, setTransferReason] = useState<string>('District Emergency Lateral Stock Rebalancing');
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecuteRebalanceResponse | null>(null);

  // Fetch optimization on open
  useEffect(() => {
    if (!isOpen || !targetCentreId || !drugName) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setExecutionResult(null);

    const fetchOptimization = async () => {
      try {
        const res = await fetch('/api/v1/inventory/rebalance/optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target_centre_id: targetCentreId,
            drug_name: drugName,
            language: language,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Server returned HTTP ${res.status}`);
        }

        const optData: RebalanceOptimizationResponse = await res.json();
        if (isMounted) {
          setData(optData);
          if (optData.top_donor) {
            setSelectedCandidate(optData.top_donor);
            setTransferQty(optData.top_donor.recommended_transfer_quantity);
          } else if (optData.candidates.length > 0) {
            setSelectedCandidate(optData.candidates[0]);
            setTransferQty(optData.candidates[0].recommended_transfer_quantity);
          } else {
            setSelectedCandidate(null);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to calculate redistribution optimization');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOptimization();

    return () => {
      isMounted = false;
    };
  }, [isOpen, targetCentreId, drugName, language]);

  const handleExecute = async () => {
    if (!selectedCandidate) return;

    setExecuting(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/inventory/rebalance/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_centre_id: selectedCandidate.donor_centre_id,
          target_centre_id: targetCentreId,
          drug_name: drugName,
          quantity: transferQty,
          reason: transferReason,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Execution failed with HTTP ${res.status}`);
      }

      const result: ExecuteRebalanceResponse = await res.json();
      setExecutionResult(result);
      showToast(
        language === 'hi'
          ? `सफलतापूर्वक पुनर्संतुलन आदेश प्रेषित: ${result.quantity_transferred} ${result.drug_name}`
          : `Lateral transfer dispatched: ${result.quantity_transferred} ${result.drug_name} to ${targetCentreName}`,
        'success'
      );
      if (onTransferComplete) {
        onTransferComplete(result);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Execution error during lateral transfer');
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
      aria-labelledby="rebalance-modal-title"
      style={{ zIndex: 1000 }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '720px',
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
                background: 'rgba(6, 182, 212, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-teal)',
              }}
            >
              <ArrowRightLeft size={22} />
            </div>
            <div>
              <h2
                id="rebalance-modal-title"
                style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}
              >
                {t.rebalanceModalTitle}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {drugName} • {targetCentreName}
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

        {/* Algorithm Badge */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '16px',
            fontSize: '0.78rem',
          }}
        >
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
            📍 {t.haversineDistance} (R = 6371.0 km)
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
            ✨ {t.geminiExplanationTitle}
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

        {/* Error message */}
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

        {/* Loading State */}
        {loading && (
          <div
            style={{
              padding: '40px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                border: '3px solid rgba(56, 189, 248, 0.2)',
                borderTopColor: 'var(--accent-cyan)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px auto',
              }}
            />
            <p style={{ fontWeight: 600 }}>Calculating Haversine distance matrix & querying Gemini reasoning...</p>
          </div>
        )}

        {/* Success Execution Result */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)', marginBottom: '10px' }}>
              <CheckCircle2 size={24} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t.transferDone}</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
              {executionResult.message}
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
                fontSize: '0.82rem',
                marginTop: '12px',
                color: 'var(--text-secondary)',
              }}
            >
              <div><strong>Transfer ID:</strong> {executionResult.transfer_id}</div>
              <div><strong>Quantity:</strong> {executionResult.quantity_transferred} units</div>
              <div><strong>Donor New Balance:</strong> {executionResult.source_new_stock}</div>
              <div><strong>Target New Balance:</strong> {executionResult.target_new_stock}</div>
            </div>
          </div>
        )}

        {/* Content Body when loaded */}
        {!loading && data && !executionResult && (
          <>
            {/* Deficit Banner */}
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
                <span style={{ fontSize: '0.78rem', color: 'var(--accent-rose)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Deficit Centre
                </span>
                <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  {language === 'hi' ? data.target_centre_name_hi : data.target_centre_name} ({data.target_block} Block)
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Estimated Deficit</span>
                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-rose)' }}>
                  {data.deficit_quantity} units
                </p>
              </div>
            </div>

            {/* Candidate Donors Section */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
                {t.closestDonor} ({data.candidates.length} candidate facilities evaluated by Haversine distance):
              </h3>

              {data.candidates.length === 0 ? (
                <div
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card)',
                    border: '1px dashed var(--border-color)',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: '0.88rem',
                  }}
                >
                  No surplus stock available across any district facility. Central medical store warehouse replenishment is required.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {data.candidates.map((cand, idx) => {
                    const isSelected = selectedCandidate?.donor_centre_id === cand.donor_centre_id;
                    const isTop = idx === 0;

                    return (
                      <div
                        key={cand.donor_centre_id}
                        onClick={() => {
                          setSelectedCandidate(cand);
                          setTransferQty(cand.recommended_transfer_quantity);
                        }}
                        style={{
                          padding: '14px',
                          borderRadius: 'var(--radius-md)',
                          background: isSelected
                            ? 'rgba(6, 182, 212, 0.08)'
                            : 'var(--bg-card)',
                          border: isSelected
                            ? '2px solid var(--accent-cyan)'
                            : '1px solid var(--border-color)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setSelectedCandidate(cand);
                            setTransferQty(cand.recommended_transfer_quantity);
                          }
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Pill size={16} color="var(--accent-teal)" />
                            <strong style={{ fontSize: '0.92rem' }}>
                              {language === 'hi' ? cand.donor_centre_name_hi : cand.donor_centre_name}
                            </strong>
                            {isTop && (
                              <span
                                style={{
                                  fontSize: '0.72rem',
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.84rem' }}>
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

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                            gap: '8px',
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            marginTop: '8px',
                          }}
                        >
                          <div>
                            Current Stock: <strong style={{ color: 'var(--text-primary)' }}>{cand.current_stock}</strong>
                          </div>
                          <div>
                            Surplus Available: <strong style={{ color: 'var(--accent-emerald)' }}>+{cand.surplus_available}</strong>
                          </div>
                          <div>
                            Recommended: <strong style={{ color: 'var(--accent-teal)' }}>{cand.recommended_transfer_quantity}</strong>
                          </div>
                          <div>
                            Retained Stock: <strong style={{ color: 'var(--text-primary)' }}>{cand.donor_remaining_stock}</strong> (≥ MRL {cand.reorder_level})
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Gemini Clinical & Logistical Justification Box */}
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
                <span>{t.geminiExplanationTitle}</span>
              </div>
              <p
                style={{
                  fontSize: '0.88rem',
                  lineHeight: '1.6',
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-line',
                }}
              >
                {language === 'hi' ? data.gemini_explanation_hi : data.gemini_explanation}
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '10px',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}
              >
                <ShieldCheck size={14} color="var(--accent-emerald)" />
                <span>
                  Safety Guarantee: Distance computed via Haversine great-circle formula. Donor safety threshold strictly enforced (Surplus - Transfer Qty ≥ MRL).
                </span>
              </div>
            </div>

            {/* Execution Controls */}
            {selectedCandidate && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label htmlFor="rebalance-qty" style={{ fontSize: '0.86rem', fontWeight: 600 }}>
                      Transfer Quantity:
                    </label>
                    <input
                      id="rebalance-qty"
                      type="number"
                      min={1}
                      max={selectedCandidate.surplus_available}
                      value={transferQty}
                      onChange={(e) => setTransferQty(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{
                        width: '80px',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        fontWeight: 700,
                      }}
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      (Max surplus: {selectedCandidate.surplus_available})
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={executing || transferQty <= 0}
                      onClick={handleExecute}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
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
                          <span>{t.executing}</span>
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          <span>{t.executeTransfer}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label htmlFor="rebalance-reason" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Reason:
                  </label>
                  <input
                    id="rebalance-reason"
                    type="text"
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Close Button when execution done */}
        {executionResult && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
