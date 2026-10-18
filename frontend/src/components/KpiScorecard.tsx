import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  BedDouble,
  FlaskConical,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Language, OperationsSummary } from '../types';
import { useTranslation } from '../i18n/translations';

interface KpiScorecardProps {
  summary: OperationsSummary | null;
  language: Language;
  onSelectAlertTab: () => void;
}

// Lightweight smooth count-up hook
function useCountUp(target: number, duration: number = 800): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = target;
    if (start === end) return;

    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const current = Math.round(start + (end - start) * (1 - Math.pow(1 - progress, 3)));
      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    const animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [target, duration]);

  return count;
}

// SVG Mini Circular Progress Ring Component
const ProgressRing: React.FC<{
  percentage: number;
  color: string;
  size?: number;
}> = ({ percentage, color, size = 36 }) => {
  const stroke = 3.5;
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(Math.max(percentage, 0), 100) / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="var(--border-subtle)"
        strokeWidth={stroke}
        fill="transparent"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        fill="transparent"
        style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
      />
    </svg>
  );
};

// SVG Micro Sparkline Component
const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 24;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }} aria-hidden="true">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

export const KpiScorecard: React.FC<KpiScorecardProps> = ({
  summary,
  language,
  onSelectAlertTab,
}) => {
  const t = useTranslation(language);

  // Default values
  const footfallTarget = summary?.total_daily_opd_footfall ?? 1420;
  const waitTime = summary?.average_district_wait_time_mins ?? 28;
  const doctorAttTarget = summary?.district_doctor_attendance_percent ?? 78.5;
  const doctorsDuty = summary?.doctors_on_duty_today ?? 22;
  const doctorsSanctioned = summary?.doctors_sanctioned_total ?? 28;
  const bedOccTarget = summary?.district_bed_occupancy_percent ?? 72.5;
  const bedsOcc = summary?.total_beds_occupied ?? 87;
  const bedsAvail = summary?.total_beds_available ?? 120;
  const testAvailTarget = summary?.district_test_availability_percent ?? 83.3;
  const vulnerableCount = summary?.underperforming_centres_count ?? 4;

  // Animated Numbers
  const animatedFootfall = useCountUp(footfallTarget);
  const animatedDoctorAtt = useCountUp(Math.round(doctorAttTarget));
  const animatedBedOcc = useCountUp(Math.round(bedOccTarget));
  const animatedTestAvail = useCountUp(Math.round(testAvailTarget));
  const animatedVulnerable = useCountUp(vulnerableCount);

  return (
    <div className="kpi-grid" role="region" aria-label="District Key Performance Indicators">
      {/* 1. Footfall */}
      <div className="kpi-card">
        <div className="kpi-header">
          <div>
            <div className="kpi-title">{t.dailyFootfall}</div>
            <span className="kpi-trend-chip up">
              <TrendingUp size={12} />
              +8.4%
            </span>
          </div>
          <div className="kpi-icon-circle" style={{ background: 'var(--tint-cyan)', color: 'var(--accent-cyan)' }}>
            <Users size={20} />
          </div>
        </div>
        <div className="kpi-value-row">
          <div className="kpi-value" style={{ color: 'var(--accent-cyan)' }}>
            {animatedFootfall.toLocaleString()}
          </div>
          <Sparkline data={[1150, 1220, 1290, 1380, 1340, 1420]} color="var(--accent-cyan)" />
        </div>
        <div className="kpi-sub">
          {t.waitTime}: <strong>{waitTime} {t.minutes}</strong>
        </div>
      </div>

      {/* 2. Doctor Attendance */}
      <div className="kpi-card">
        <div className="kpi-header">
          <div>
            <div className="kpi-title">{t.doctorAttendance}</div>
            <span className="kpi-trend-chip down">
              <TrendingDown size={12} />
              -3.8%
            </span>
          </div>
          <div
            className="kpi-icon-circle"
            style={{
              background: doctorAttTarget < 80 ? 'var(--tint-amber)' : 'var(--tint-emerald)',
              color: doctorAttTarget < 80 ? 'var(--accent-amber)' : 'var(--accent-emerald)',
            }}
          >
            <UserCheck size={20} />
          </div>
        </div>
        <div className="kpi-value-row" style={{ justifyContent: 'space-between' }}>
          <div
            className="kpi-value"
            style={{
              color: doctorAttTarget < 80 ? 'var(--accent-amber)' : 'var(--accent-emerald)',
            }}
          >
            {animatedDoctorAtt}%
          </div>
          <ProgressRing
            percentage={doctorAttTarget}
            color={doctorAttTarget < 80 ? 'var(--accent-amber)' : 'var(--accent-emerald)'}
          />
        </div>
        <div className="kpi-sub">
          <strong>{doctorsDuty}</strong> / {doctorsSanctioned} {t.doctors} on duty
        </div>
      </div>

      {/* 3. Bed Saturation */}
      <div className="kpi-card">
        <div className="kpi-header">
          <div>
            <div className="kpi-title">{t.bedSaturation}</div>
            <span className="kpi-trend-chip up">
              <TrendingUp size={12} />
              +5.2%
            </span>
          </div>
          <div className="kpi-icon-circle" style={{ background: 'var(--tint-indigo)', color: 'var(--accent-indigo)' }}>
            <BedDouble size={20} />
          </div>
        </div>
        <div className="kpi-value-row" style={{ justifyContent: 'space-between' }}>
          <div className="kpi-value" style={{ color: 'var(--accent-indigo)' }}>
            {animatedBedOcc}%
          </div>
          <ProgressRing percentage={bedOccTarget} color="var(--accent-indigo)" />
        </div>
        <div className="kpi-sub">
          <strong>{bedsOcc}</strong> / {bedsAvail} {t.beds} occupied
        </div>
      </div>

      {/* 4. Diagnostic Readiness */}
      <div className="kpi-card">
        <div className="kpi-header">
          <div>
            <div className="kpi-title">{t.testReadiness}</div>
            <span className="kpi-trend-chip up">
              <TrendingUp size={12} />
              +2.1%
            </span>
          </div>
          <div className="kpi-icon-circle" style={{ background: 'var(--tint-emerald)', color: 'var(--accent-emerald)' }}>
            <FlaskConical size={20} />
          </div>
        </div>
        <div className="kpi-value-row" style={{ justifyContent: 'space-between' }}>
          <div className="kpi-value" style={{ color: 'var(--accent-emerald)' }}>
            {animatedTestAvail}%
          </div>
          <ProgressRing percentage={testAvailTarget} color="var(--accent-emerald)" />
        </div>
        <div className="kpi-sub">Diagnostic test availability</div>
      </div>

      {/* 5. Vulnerable Flagged */}
      <div
        className="kpi-card"
        style={{
          cursor: 'pointer',
          borderColor: 'rgba(220, 38, 38, 0.3)',
          borderLeft: '4px solid var(--accent-rose)',
        }}
        onClick={onSelectAlertTab}
        tabIndex={0}
        role="button"
        aria-label="View underperforming facilities"
      >
        <div className="kpi-header">
          <div>
            <div className="kpi-title" style={{ color: 'var(--accent-rose)' }}>
              {t.vulnerableCentres}
            </div>
            <span className="kpi-trend-chip down">
              <AlertTriangle size={12} />
              Action Needed
            </span>
          </div>
          <div className="kpi-icon-circle" style={{ background: 'var(--tint-rose)', color: 'var(--accent-rose)' }}>
            <AlertTriangle size={20} />
          </div>
        </div>
        <div className="kpi-value-row">
          <div className="kpi-value" style={{ color: 'var(--accent-rose)' }}>
            {animatedVulnerable}
          </div>
          <Sparkline data={[2, 3, 3, 4, 4, vulnerableCount]} color="var(--accent-rose)" />
        </div>
        <div className="kpi-sub" style={{ color: 'var(--accent-rose)', fontWeight: 600 }}>
          {language === 'hi' ? 'तत्काल ध्यान देने की आवश्यकता है' : 'Immediate district intervention required'}
        </div>
      </div>
    </div>
  );
};
