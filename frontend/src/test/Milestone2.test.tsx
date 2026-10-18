import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../App';
import { DistrictMapView } from '../components/DistrictMapView';
import { LateralRebalanceModal } from '../components/LateralRebalanceModal';
import { Centre } from '../types';

const MOCK_CENTRES: Centre[] = [
  {
    id: 'phc_003',
    name: 'Ghogargaon Primary Health Centre (Tribal)',
    name_hi: 'घोगरगाव प्राथमिक स्वास्थ्य केंद्र (आदिवासी)',
    facility_type: 'PHC',
    district: 'Pune',
    block: 'Ambegaon',
    pincode: '410503',
    latitude: 19.0621,
    longitude: 73.7412,
    catchment_population: 24600,
    in_charge_doctor: 'Dr. Sandeep Borde, MBBS',
    phone_number: '+91 2133 2841 02',
    operational_status: 'critical',
    problem_type: 'chronic_stockout',
  },
  {
    id: 'chc_002',
    name: 'Chakan Community Health Centre',
    name_hi: 'चाकण सामुदायिक स्वास्थ्य केंद्र',
    facility_type: 'CHC',
    district: 'Pune',
    block: 'Khed',
    pincode: '410501',
    latitude: 18.7612,
    longitude: 73.8594,
    catchment_population: 86400,
    in_charge_doctor: 'Dr. Suresh Patil, MS, Surgeon',
    phone_number: '+91 2135 2490 20',
    operational_status: 'optimal',
  },
];

describe('Milestone 2 - Google Maps & Haversine Redistribution Suite', () => {
  it('navigates to District Map tab and renders Google Maps container and facilities', () => {
    render(<App />);

    // Click on District Map tab in header
    const mapTab = screen.getByRole('tab', { name: /District Map/i });
    expect(mapTab).toBeInTheDocument();
    fireEvent.click(mapTab);

    // Verify map region and Google Maps container are in document
    expect(screen.getByRole('region', { name: /District Health Map/i })).toBeInTheDocument();
    expect(screen.getByTestId('google-maps-container')).toBeInTheDocument();
    expect(screen.getByText(/Google Maps JS Engine/i)).toBeInTheDocument();
  });

  it('renders DistrictMapView with filter controls and centre details drawer', () => {
    const onOpenRebalance = vi.fn();
    render(
      <DistrictMapView
        centres={MOCK_CENTRES}
        language="en"
        onOpenRebalanceModal={onOpenRebalance}
      />
    );

    // Verify block filter and status filter
    expect(screen.getByLabelText(/Filter by Block/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Filter by operational status/i)).toBeInTheDocument();

    // Verify facility card in details drawer
    expect(screen.getByText(/Ghogargaon Primary Health Centre/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Ambegaon Block/i).length).toBeGreaterThanOrEqual(1);

    // Click Lateral Rebalance button
    const rebalanceBtn = screen.getByRole('button', { name: /Lateral Stock Rebalance/i });
    fireEvent.click(rebalanceBtn);
    expect(onOpenRebalance).toHaveBeenCalledWith(
      'phc_003',
      'Ghogargaon Primary Health Centre (Tribal)',
      'Polyvalent Snake Antivenom'
    );
  });

  it('renders LateralRebalanceModal with Haversine distance and Gemini explanation', async () => {
    // Mock the optimize API response
    const mockOptimizationResponse = {
      target_centre_id: 'phc_003',
      target_centre_name: 'Ghogargaon PHC (Tribal)',
      target_centre_name_hi: 'घोगरगाव प्राथमिक स्वास्थ्य केंद्र',
      target_block: 'Ambegaon',
      drug_name: 'Polyvalent Snake Antivenom',
      deficit_quantity: 15,
      distance_algorithm: 'Haversine (Great-Circle)',
      gemini_explanation:
        'Immediate lateral dispatch from Chakan CHC is recommended. Transit via SH-54 requires approximately 35 minutes across 18.4 km. Chakan retains 30 safety vials exceeding minimum reorder level.',
      gemini_explanation_hi:
        'चाकण सामुदायिक स्वास्थ्य केंद्र से तत्काल पार्श्व प्रेषण की सिफारिश की जाती है।',
      generated_at: '2026-10-18 11:30:00',
      top_donor: {
        donor_centre_id: 'chc_002',
        donor_centre_name: 'Chakan CHC',
        donor_centre_name_hi: 'चाकण सामुदायिक स्वास्थ्य केंद्र',
        donor_block: 'Khed',
        latitude: 18.7612,
        longitude: 73.8594,
        distance_km: 18.4,
        estimated_transit_mins: 35,
        current_stock: 45,
        reorder_level: 15,
        surplus_available: 30,
        recommended_transfer_quantity: 15,
        donor_remaining_stock: 30,
        expiry_date: '2027-11-30',
        suitability_score: 1.55,
      },
      candidates: [
        {
          donor_centre_id: 'chc_002',
          donor_centre_name: 'Chakan CHC',
          donor_centre_name_hi: 'चाकण सामुदायिक स्वास्थ्य केंद्र',
          donor_block: 'Khed',
          latitude: 18.7612,
          longitude: 73.8594,
          distance_km: 18.4,
          estimated_transit_mins: 35,
          current_stock: 45,
          reorder_level: 15,
          surplus_available: 30,
          recommended_transfer_quantity: 15,
          donor_remaining_stock: 30,
          expiry_date: '2027-11-30',
          suitability_score: 1.55,
        },
      ],
    };

    // Spy on global fetch
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: RequestInfo | URL) => {
      const urlStr = typeof url === 'string' ? url : (url as URL).href || '';
      if (urlStr.includes('/api/v1/inventory/rebalance/optimize')) {
        return {
          ok: true,
          json: async () => mockOptimizationResponse,
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    render(
      <LateralRebalanceModal
        isOpen={true}
        onClose={vi.fn()}
        targetCentreId="phc_003"
        targetCentreName="Ghogargaon PHC (Tribal)"
        drugName="Polyvalent Snake Antivenom"
        language="en"
      />
    );

    // Wait for optimization data to render
    await waitFor(() => {
      expect(screen.getAllByText(/Haversine Great-Circle Distance/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/18.4 km/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/35 mins/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Immediate lateral dispatch from Chakan CHC/i)).toBeInTheDocument();
    });

    fetchSpy.mockRestore();
  });
});
