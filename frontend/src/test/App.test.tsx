import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from '../App';
import { translations } from '../i18n/translations';

describe('SmartHealth Frontend UI Suite', () => {
  it('renders application brand title and Pune district banner', () => {
    render(<App />);
    expect(screen.getByText('SmartHealth')).toBeInTheDocument();
    expect(screen.getByText(/Pune District/i)).toBeInTheDocument();
  });

  it('cycles language across English, Hindi, and Marathi', () => {
    render(<App />);

    const langBtn = screen.getByRole('button', { name: /Change language/i });

    // Step 1: English -> Hindi
    fireEvent.click(langBtn);
    expect(screen.getByText('स्मार्टहेल्थ')).toBeInTheDocument();
    expect(screen.getByText(/पुणे जिला/i)).toBeInTheDocument();

    // Step 2: Hindi -> Marathi
    fireEvent.click(langBtn);
    expect(screen.getByText('पुणे जिल्हा')).toBeInTheDocument();

    // Step 3: Marathi -> English
    fireEvent.click(langBtn);
    expect(screen.getByText('SmartHealth')).toBeInTheDocument();
    expect(screen.getByText(/Pune District/i)).toBeInTheDocument();
  });

  it('toggles high contrast mode complying with WCAG 2.1 AA', () => {
    render(<App />);
    const contrastBtn = screen.getByRole('button', { name: /High Contrast Mode/i });

    // Initial state
    expect(document.body.classList.contains('high-contrast')).toBe(false);

    // Toggle ON
    fireEvent.click(contrastBtn);
    expect(document.body.classList.contains('high-contrast')).toBe(true);

    // Toggle OFF
    fireEvent.click(contrastBtn);
    expect(document.body.classList.contains('high-contrast')).toBe(false);
  });

  it('renders KPI Scorecard metrics', () => {
    render(<App />);
    expect(screen.getByText(/Daily Patient Footfall/i)).toBeInTheDocument();
    expect(screen.getByText(/Doctor Attendance Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Inpatient Bed Saturation/i)).toBeInTheDocument();
    expect(screen.getByText(/Diagnostic Test Readiness/i)).toBeInTheDocument();
  });

  it('renders planted problems hotspot banner with the 6 flagged facilities', () => {
    render(<App />);
    expect(screen.getByText(/Critical Operational Alerts & Deficits Flagged/i)).toBeInTheDocument();
    expect(screen.getByText(/Ghogargaon PHC/i)).toBeInTheDocument();
    expect(screen.getByText(/Alandi PHC/i)).toBeInTheDocument();
    expect(screen.getByText(/Manchar PHC/i)).toBeInTheDocument();
    expect(screen.getByText(/Narayangaon PHC/i)).toBeInTheDocument();
    expect(screen.getByText(/Shikrapur PHC/i)).toBeInTheDocument();
    expect(screen.getByText(/Wagholi PHC/i)).toBeInTheDocument();
  });

  it('navigates through views: Facilities, Inventory, and Operations', () => {
    render(<App />);

    // Click on Medicine Stock & Redistribution tab
    const inventoryTab = screen.getByRole('tab', { name: /Medicine Stock/i });
    fireEvent.click(inventoryTab);
    expect(screen.getByPlaceholderText(/Search medicines/i)).toBeInTheDocument();

    // Click on Daily Operations & Attendance tab
    const opsTab = screen.getByRole('tab', { name: /Daily Operations/i });
    fireEvent.click(opsTab);
    expect(screen.getByText(/90-Day Footfall Trend/i)).toBeInTheDocument();
  });

  it('verifies translation completeness between English, Hindi, and Marathi', () => {
    const enKeys = Object.keys(translations.en).sort();
    const hiKeys = Object.keys(translations.hi).sort();
    const mrKeys = Object.keys(translations.mr).sort();
    expect(enKeys).toEqual(hiKeys);
    expect(enKeys).toEqual(mrKeys);
  });

  it('launches Interactive Demo Mode and steps through the 4-step evaluator workflow', () => {
    render(<App />);
    const demoBtn = screen.getByRole('button', { name: /Interactive Demo/i });
    expect(demoBtn).toBeInTheDocument();
    fireEvent.click(demoBtn);

    // Modal opens with Step 1
    expect(screen.getByText(/Stockout Detected/i)).toBeInTheDocument();
    expect(screen.getByText(/Ghogargaon PHC \(Ambegaon Block\)/i)).toBeInTheDocument();

    // Advance to Step 2
    const nextBtn1 = screen.getByRole('button', { name: /Next Step/i });
    fireEvent.click(nextBtn1);
    expect(screen.getByText(/Command Center Automated Flagging/i)).toBeInTheDocument();

    // Advance to Step 3
    const nextBtn2 = screen.getByRole('button', { name: /Next Step/i });
    fireEvent.click(nextBtn2);
    expect(screen.getByText(/Donor Facility Identified: Chakan CHC/i)).toBeInTheDocument();

    // Execute Step 4 approval
    const approveBtn = screen.getByRole('button', { name: /Approve & Execute Lateral Transfer/i });
    fireEvent.click(approveBtn);
    expect(screen.getByText(/Emergency Lateral Stock Transfer Order Issued/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Finish & Return to Dashboard/i })).toBeInTheDocument();
  });
});
