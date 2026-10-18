import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Compass,
  Play,
  RotateCcw,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import { Language } from '../types';

interface InteractiveDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onExecuteSuccess?: (message: string) => void;
}

export const InteractiveDemoModal: React.FC<InteractiveDemoModalProps> = ({
  isOpen,
  onClose,
  language,
  onExecuteSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [transferId, setTransferId] = useState<string>('');

  if (!isOpen) return null;

  const handleApprove = () => {
    const generatedId = `TRF-DEMO-${Date.now().toString().slice(-6)}`;
    setTransferId(generatedId);
    setIsApproved(true);
    setCurrentStep(4);
    if (onExecuteSuccess) {
      onExecuteSuccess(`Demo Transfer ${generatedId} Approved: 15 Antivenom Vials dispatched to Ghogargaon PHC!`);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setIsApproved(false);
    setTransferId('');
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-lg)',
          padding: '28px',
          color: 'var(--text-primary)',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--brand-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Play size={20} fill="#fff" />
            </div>
            <div>
              <h2 id="demo-modal-title" style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                {language === 'mr'
                  ? 'परस्परसंवादी डेमो मोड: संपूर्ण समस्या निराकरण'
                  : language === 'hi'
                  ? 'इंटरएक्टिव डेमो मोड: संपूर्ण समाधान प्रवाह'
                  : 'Interactive Demo Flow: Real-time Problem to Resolution'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                Stockout Detected → Alert Raised → Haversine & AI Optimization → Admin Transfer Order
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            aria-label="Close Demo"
            style={{ padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Step Progress Tracker */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            marginBottom: '24px',
          }}
        >
          {[
            { num: 1, label: '1. Stockout' },
            { num: 2, label: '2. Alert' },
            { num: 3, label: '3. AI Plan' },
            { num: 4, label: '4. Approval' },
          ].map((st) => {
            const isCompleted = currentStep > st.num || (st.num === 4 && isApproved);
            const isCurrent = currentStep === st.num;
            return (
              <div
                key={st.num}
                style={{
                  padding: '10px 8px',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center',
                  background: isCurrent
                    ? 'var(--brand-primary-tint)'
                    : isCompleted
                    ? 'var(--tint-emerald)'
                    : 'var(--bg-surface-subtle)',
                  border: isCurrent
                    ? '2px solid var(--brand-primary)'
                    : isCompleted
                    ? '1px solid var(--accent-emerald)'
                    : '1px solid var(--border-subtle)',
                  color: isCurrent
                    ? 'var(--brand-primary)'
                    : isCompleted
                    ? 'var(--accent-emerald)'
                    : 'var(--text-muted)',
                  fontWeight: isCurrent || isCompleted ? 700 : 500,
                  fontSize: '0.82rem',
                }}
              >
                {st.label}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div style={{ marginBottom: '24px' }}>
          {/* STEP 1: Stockout Detection */}
          {currentStep === 1 && (
            <div
              style={{
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span className="badge badge-critical">Step 1: Anomaly Triggered</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PHC Telemetry Ping</span>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
                Zero Antivenom Detected at Ghogargaon Tribal PHC
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                During real-time midnight telemetry synchronization, <strong>Ghogargaon PHC (Ambegaon Block)</strong> reported
                an inventory level of <strong>0 vials of Polyvalent Snake Antivenom</strong> (Reorder Threshold: 10 vials).
                This facility serves a remote tribal population of 24,600 with elevated viper bite incidence during monsoon corridors.
              </p>
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '0.85rem' }}>
                <div style={{ background: 'var(--bg-card)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Current Stock:</span> <strong>0 vials (Stockout)</strong>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Catchment Pop:</span> <strong>24,600 Tribal Residents</strong>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Real-time Alert */}
          {currentStep === 2 && (
            <div
              style={{
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span className="badge badge-critical">
                  <AlertTriangle size={14} /> Step 2: District Alert Active
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Severity: CRITICAL P1</span>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
                Command Center Automated Flagging
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                The surveillance engine automatically categorized Ghogargaon PHC as a <strong>Critical Operational Deficit</strong>.
                An alert was propagated to the District Health Officer (DHO) and Pune Chief Medical Officer (CMO) dashboard with
                telemetry priority ranking.
              </p>
              <div
                style={{
                  marginTop: '14px',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  borderLeft: '4px solid var(--accent-rose)',
                  fontSize: '0.85rem',
                }}
              >
                <strong>System Flag:</strong> Critical Life-Saving Medicine Deficit | Facility: Ghogargaon PHC | Days of Supply: 0 Days
              </div>
            </div>
          )}

          {/* STEP 3: Haversine & AI Optimization */}
          {currentStep === 3 && (
            <div
              style={{
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span className="badge badge-optimal">
                  <Compass size={14} /> Step 3: Optimization Matrix
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Haversine Vector + Gemini Flash</span>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
                Donor Facility Identified: Chakan CHC (18.4 km)
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                The mathematical Haversine routing engine evaluated all 11 alternative facilities in Pune District.
                <strong> Chakan Community Health Centre</strong> possesses <strong>45 vials</strong> (30 surplus above safe buffer).
              </p>
              <div
                style={{
                  marginTop: '14px',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--brand-primary-tint)',
                  borderLeft: '4px solid var(--brand-primary)',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Sparkles size={16} color="var(--brand-primary)" />
                  <strong>Gemini AI Clinical Rationale:</strong>
                </div>
                <em>
                  "Chakan CHC is connected via SH-54 corridor with minimal road elevation delay. Transferring 15 vials leaves
                  Chakan with 30 vials (200% of MRL), resolving Ghogargaon's stockout within 45 minutes of ambulance dispatch."
                </em>
              </div>
            </div>
          )}

          {/* STEP 4: Admin Approval & Transfer Order */}
          {currentStep === 4 && (
            <div
              style={{
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span className="badge badge-optimal">
                  <CheckCircle2 size={14} /> Step 4: Order Executed
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Audit Verified</span>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
                Emergency Lateral Stock Transfer Order Issued
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                The district medical administrator has authorized the emergency stock transfer. An atomic transaction has updated
                both facility ledgers and generated an immutable dispatch order.
              </p>

              <div
                style={{
                  marginTop: '16px',
                  padding: '16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px dashed var(--border-subtle)', paddingBottom: '6px' }}>
                  <span><strong>Audit Tracking ID:</strong></span>
                  <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>{transferId || 'TRF-DEMO-849102'}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div><strong>Donor Facility:</strong> Chakan CHC</div>
                  <div><strong>Recipient:</strong> Ghogargaon PHC (Tribal)</div>
                  <div><strong>Item Dispatched:</strong> Snake Antivenom (15 vials)</div>
                  <div><strong>Transit Route:</strong> SH-54 Express Corridor</div>
                  <div><strong>Estimated Arrival:</strong> 42 Minutes</div>
                  <div><strong>Status:</strong> DISPATCHED IN-TRANSIT</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleReset}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RotateCcw size={15} />
            <span>Restart Demo</span>
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            {currentStep < 3 && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>Next Step</span>
                <ArrowRight size={16} />
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="button"
                className="btn btn-gemini-advisor"
                onClick={handleApprove}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Truck size={17} />
                <span>Approve & Execute Lateral Transfer</span>
              </button>
            )}

            {currentStep === 4 && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onClose}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <CheckCircle2 size={16} />
                <span>Finish & Return to Dashboard</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
