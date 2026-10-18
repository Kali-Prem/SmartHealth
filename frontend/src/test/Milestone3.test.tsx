import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../App';
import { DemandForecastView } from '../components/DemandForecastView';
import { DoctorDeputationModal } from '../components/DoctorDeputationModal';
import { OperationsView } from '../components/OperationsView';
import { AiCopilotModal } from '../components/AiCopilotModal';
import { EarlyStockoutReport, OperationsSummary } from '../types';

// Mock Web Speech API SpeechRecognition
class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = 'en-IN';
  onresult: any = null;
  onerror: any = null;
  onend: any = null;
  start = vi.fn();
  stop = vi.fn();
}

const MOCK_OPERATIONS_SUMMARY: OperationsSummary = {
  total_daily_opd_footfall: 1420,
  average_district_wait_time_mins: 38,
  district_bed_occupancy_percent: 68.4,
  total_beds_occupied: 78,
  total_beds_available: 114,
  district_doctor_attendance_percent: 74.2,
  doctors_on_duty_today: 32,
  doctors_sanctioned_total: 44,
  district_test_availability_percent: 81.5,
  underperforming_centres_count: 3,
  top_vulnerable_centres: [],
};

beforeEach(() => {
  (window as any).SpeechRecognition = MockSpeechRecognition;
  (window as any).webkitSpeechRecognition = MockSpeechRecognition;
});

describe('Milestone 3 - Demand Forecasting, Deputations & Voice Input Suite', () => {
  it('navigates to Demand Forecast tab and displays early stockout radar and burn rates', async () => {
    const mockReport: EarlyStockoutReport = {
      total_warning_items: 2,
      critical_immediate_count: 1,
      imminent_7d_count: 1,
      gemini_epidemiology_advisory: 'District Early Stockout Warning: Antivenom depletion alert in Ambegaon tribal block.',
      gemini_epidemiology_advisory_hi: 'जिला प्रारंभिक स्टॉकआउट चेतावनी: आंबेगाव ब्लॉक में एंटीवेनम की कमी।',
      warnings: [
        {
          centre_id: 'phc_003',
          centre_name: 'Ghogargaon Primary Health Centre (Tribal)',
          centre_name_hi: 'घोगरगाव प्राथमिक स्वास्थ्य केंद्र',
          block: 'Ambegaon',
          drug_name: 'Polyvalent Snake Antivenom',
          drug_name_hi: 'पॉलीवैलेंट स्नेक एंटीवेनम',
          category: 'antidote',
          current_stock: 0,
          daily_burn_rate: 2.0,
          days_of_supply_remaining: 0,
          stockout_in_days: 0,
          urgency: 'immediate',
          recommended_order_quantity: 60,
        },
        {
          centre_id: 'phc_007',
          centre_name: 'Alandi Primary Health Centre',
          centre_name_hi: 'आळंदी प्राथमिक स्वास्थ्य केंद्र',
          block: 'Khed',
          drug_name: 'Amoxicillin 500mg',
          drug_name_hi: 'अमोक्सिसिलिन 500 मि.ग्रा.',
          category: 'antibiotic',
          current_stock: 12,
          daily_burn_rate: 3.0,
          days_of_supply_remaining: 4,
          stockout_in_days: 4,
          urgency: 'imminent',
          recommended_order_quantity: 90,
        },
      ],
    };

    vi.spyOn(globalThis, 'fetch').mockImplementation((input: any) => {
      const url = typeof input === 'string' ? input : input.url || '';
      if (url.includes('/inventory/early-warnings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockReport),
        } as Response);
      }
      if (url.includes('/inventory/forecast')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response);
      }
      if (url.includes('/operations/summary')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_OPERATIONS_SUMMARY),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);
    });

    render(<App />);

    // Click on the Demand Forecast tab
    const forecastTab = screen.getByRole('tab', { name: /Demand Forecast/i });
    expect(forecastTab).toBeInTheDocument();
    fireEvent.click(forecastTab);

    // Verify view region is rendered
    expect(screen.getByRole('region', { name: /AI Demand Forecasting & Warnings/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Antivenom depletion alert in Ambegaon tribal block/i)).toBeInTheDocument();
      expect(screen.getByText(/Ghogargaon Primary Health Centre/i)).toBeInTheDocument();
      expect(screen.getByText(/Polyvalent Snake Antivenom/i)).toBeInTheDocument();
      expect(screen.getByText(/0 days remaining/i)).toBeInTheDocument();
    });
  });

  it('filters early warnings by urgency and triggers lateral rebalance modal', async () => {
    const onOpenRebalance = vi.fn();
    const mockReport: EarlyStockoutReport = {
      total_warning_items: 1,
      critical_immediate_count: 1,
      imminent_7d_count: 0,
      gemini_epidemiology_advisory: 'Advisory notice.',
      gemini_epidemiology_advisory_hi: 'सलाह सूचना।',
      warnings: [
        {
          centre_id: 'phc_003',
          centre_name: 'Ghogargaon PHC',
          centre_name_hi: 'घोगरगाव पीएचसी',
          block: 'Ambegaon',
          drug_name: 'Polyvalent Snake Antivenom',
          drug_name_hi: 'पॉलीवैलेंट स्नेक एंटीवेनम',
          category: 'antidote',
          current_stock: 0,
          daily_burn_rate: 2.0,
          days_of_supply_remaining: 0,
          stockout_in_days: 0,
          urgency: 'immediate',
          recommended_order_quantity: 60,
        },
      ],
    };

    vi.spyOn(globalThis, 'fetch').mockImplementation((input: any) => {
      const url = typeof input === 'string' ? input : input.url || '';
      if (url.includes('/inventory/early-warnings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockReport),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);
    });

    render(
      <DemandForecastView
        language="en"
        onOpenRebalanceModal={onOpenRebalance}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Ghogargaon PHC/i)).toBeInTheDocument();
    });

    // Click on lateral rebalance button inside the early warning card
    const rebalanceBtn = screen.getByRole('button', { name: /Trigger Lateral Rebalance/i });
    fireEvent.click(rebalanceBtn);

    expect(onOpenRebalance).toHaveBeenCalledWith('phc_003', 'Ghogargaon PHC', 'Polyvalent Snake Antivenom');
  });

  it('renders OperationsView attendance subtab with doctor deputation banner and button', () => {
    const onOpenDeputation = vi.fn();
    const mockAttendance = [
      {
        id: 'att_phc_005',
        centre_id: 'phc_005',
        centre_name: 'Narayangaon Primary Health Centre',
        block: 'Junnar',
        date: '2026-10-18',
        doctors_sanctioned: 2,
        doctors_present_today: 1,
        absence_rate_percent: 50.0,
        doctors: [
          {
            doctor_id: 'doc_1',
            name: 'Dr. Mahesh Jadhav',
            designation: 'MO In-Charge',
            shift: 'morning',
            status: 'unnotified_absent' as const,
          },
        ],
      },
    ];

    render(
      <OperationsView
        footfallLogs={[]}
        attendanceLogs={mockAttendance}
        testAudits={[]}
        language="en"
        onOpenDeputationModal={onOpenDeputation}
      />
    );

    // Switch to doctor attendance subtab
    const attTab = screen.getByRole('button', { name: /Doctor Shift Attendance Punch Ledger/i });
    fireEvent.click(attTab);

    // Deputation banner must be visible
    expect(screen.getByText(/Smart Doctor Deputation Assistant/i)).toBeInTheDocument();

    // Click on launch deputation assistant button
    const launchBtn = screen.getByRole('button', { name: /Launch Deputation Assistant/i });
    fireEvent.click(launchBtn);
    expect(onOpenDeputation).toHaveBeenCalled();

    // Row-level Depute button for critical shortage
    const rowDeputeBtn = screen.getByRole('button', { name: /Depute/i });
    fireEvent.click(rowDeputeBtn);
    expect(onOpenDeputation).toHaveBeenCalledWith('phc_005', 'Narayangaon Primary Health Centre');
  });

  it('renders DoctorDeputationModal with Haversine ranking and Gemini justification', async () => {
    const mockRecommendations = [
      {
        target_centre_id: 'phc_005',
        target_centre_name: 'Narayangaon Primary Health Centre',
        target_centre_name_hi: 'नारायणगाव प्राथमिक स्वास्थ्य केंद्र',
        target_block: 'Junnar',
        absence_rate_percent: 50.0,
        doctors_present: 1,
        doctors_sanctioned: 2,
        distance_algorithm: 'Haversine (Great-Circle)',
        gemini_justification: 'Immediate cross-deputation from Junnar CHC restores emergency shift.',
        gemini_justification_hi: 'जुन्नर सा.आ.के. से तत्काल प्रतिनियुक्ति आपातकालीन सेवा बहाल करेगी।',
        top_candidate: {
          donor_centre_id: 'chc_003',
          donor_centre_name: 'Junnar Rural Hospital / CHC',
          donor_centre_name_hi: 'जुन्नर ग्रामीण रुग्णालय',
          donor_block: 'Junnar',
          doctor_id: 'doc_chc_003_1',
          doctor_name: 'Dr. Ajay More',
          designation: 'Medical Officer',
          distance_km: 14.8,
          estimated_transit_mins: 28,
          doctors_on_duty_at_donor: 3,
        },
        candidates: [
          {
            donor_centre_id: 'chc_003',
            donor_centre_name: 'Junnar Rural Hospital / CHC',
            donor_centre_name_hi: 'जुन्नर ग्रामीण रुग्णालय',
            donor_block: 'Junnar',
            doctor_id: 'doc_chc_003_1',
            doctor_name: 'Dr. Ajay More',
            designation: 'Medical Officer',
            distance_km: 14.8,
            estimated_transit_mins: 28,
            doctors_on_duty_at_donor: 3,
          },
        ],
      },
    ];

    vi.spyOn(globalThis, 'fetch').mockImplementation((input: any) => {
      const url = typeof input === 'string' ? input : input.url || '';
      if (url.includes('/deputation/recommendations')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRecommendations),
        } as Response);
      }
      if (url.includes('/deputation/execute')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              deputation_id: 'dep_test_123',
              status: 'completed',
              target_centre_id: 'phc_005',
              donor_centre_id: 'chc_003',
              doctor_name: 'Dr. Ajay More',
              date: '2026-10-18',
              message: 'Deputation order issued successfully.',
            }),
        } as Response);
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response);
    });

    const onClose = vi.fn();
    const onExecuted = vi.fn();

    render(
      <DoctorDeputationModal
        isOpen={true}
        onClose={onClose}
        targetCentreId="phc_005"
        language="en"
        onDeputationExecuted={onExecuted}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Smart Doctor Deputation Optimizer/i)).toBeInTheDocument();
      expect(screen.getByText(/Dr. Ajay More/i)).toBeInTheDocument();
      expect(screen.getByText(/14.8 km/i)).toBeInTheDocument();
      expect(screen.getByText(/Immediate cross-deputation from Junnar CHC/i)).toBeInTheDocument();
    });

    // Execute deputation
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Issue Deputation Order/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText(/Doctor deputation order issued successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/dep_test_123/i)).toBeInTheDocument();
    });
  });

  it('supports voice input toggle in AiCopilotModal in English and Hindi', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <AiCopilotModal
        isOpen={true}
        onClose={onClose}
        language="en"
      />
    );

    // Initial placeholder in English
    expect(screen.getByPlaceholderText(/Ask District AI Copilot/i)).toBeInTheDocument();

    // Find voice button and toggle listening on
    const voiceBtn = screen.getByTitle(/Voice Input/i);
    expect(voiceBtn).toBeInTheDocument();
    fireEvent.click(voiceBtn);

    // Listening placeholder appears
    expect(screen.getByPlaceholderText(/Listening\.\.\./i)).toBeInTheDocument();

    // Toggle off
    fireEvent.click(voiceBtn);
    expect(screen.getByPlaceholderText(/Ask District AI Copilot/i)).toBeInTheDocument();

    // Switch to Hindi and verify translated placeholder
    rerender(
      <AiCopilotModal
        isOpen={true}
        onClose={onClose}
        language="hi"
      />
    );

    expect(screen.getByPlaceholderText(/जिला एआई सहायक से पूछें/i)).toBeInTheDocument();
  });
});
