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

  it('toggles language between English and Hindi', () => {
    render(<App />);

    // Click Hindi switch
    const langBtn = screen.getByRole('button', { name: /Change language/i });
    fireEvent.click(langBtn);

    // Should now display Hindi title and Hindi text
    expect(screen.getByText('स्मार्टहेल्थ')).toBeInTheDocument();
    expect(screen.getByText(/पुणे जिला/i)).toBeInTheDocument();

    // Toggle back to English
    fireEvent.click(langBtn);
    expect(screen.getByText('SmartHealth')).toBeInTheDocument();
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

  it('verifies translation completeness between English and Hindi', () => {
    const enKeys = Object.keys(translations.en).sort();
    const hiKeys = Object.keys(translations.hi).sort();
    expect(enKeys).toEqual(hiKeys);
  });
});
