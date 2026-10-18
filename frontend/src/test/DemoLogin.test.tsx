import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginPage } from '../components/LoginPage';
import { App } from '../App';

describe('Demo Login & Role-Based Access Frontend Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders the 3 Try Demo cards with instant login buttons and target dashboards', () => {
    render(<LoginPage language="en" onLoginSuccess={vi.fn()} />);

    // Check headings
    expect(screen.getByText(/Try Demo/i)).toBeInTheDocument();

    // Check all 3 buttons are rendered
    expect(screen.getByRole('button', { name: /Login as Health Worker/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login as District Admin/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login as State Viewer/i })).toBeInTheDocument();

    // Check facilities mentioned
    expect(screen.getAllByText(/Ghogargaon PHC/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Pune District Command Center/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Maharashtra State Health Directorate/i).length).toBeGreaterThanOrEqual(1);
  });

  it('displays the credentials reference table for evaluators and judges', () => {
    render(<LoginPage language="en" onLoginSuccess={vi.fn()} />);

    expect(
      screen.getByText(/Demo Credentials Reference for Evaluators & Judges/i)
    ).toBeInTheDocument();

    // Verify email addresses and passwords in table
    expect(screen.getAllByText('worker@smarthealth.demo').length).toBeGreaterThan(0);
    expect(screen.getAllByText('admin@smarthealth.demo').length).toBeGreaterThan(0);
    expect(screen.getAllByText('state@smarthealth.demo').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Demo@1234').length).toBeGreaterThanOrEqual(3);
  });

  it('triggers instant 1-click login for Health Worker and redirects to operations', async () => {
    const handleLoginSuccess = vi.fn();
    render(<LoginPage language="en" onLoginSuccess={handleLoginSuccess} />);

    const workerBtn = screen.getByRole('button', { name: /Login as Health Worker/i });
    fireEvent.click(workerBtn);

    await waitFor(() => {
      expect(handleLoginSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'health_worker',
          centre_id: 'phc_003',
        }),
        'operations'
      );
    });
  });

  it('triggers instant 1-click login for District Admin and redirects to dashboard', async () => {
    const handleLoginSuccess = vi.fn();
    render(<LoginPage language="en" onLoginSuccess={handleLoginSuccess} />);

    const adminBtn = screen.getByRole('button', { name: /Login as District Admin/i });
    fireEvent.click(adminBtn);

    await waitFor(() => {
      expect(handleLoginSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'district_admin',
        }),
        'dashboard'
      );
    });
  });

  it('triggers instant 1-click login for State Viewer and redirects to dashboard', async () => {
    const handleLoginSuccess = vi.fn();
    render(<LoginPage language="en" onLoginSuccess={handleLoginSuccess} />);

    const stateBtn = screen.getByRole('button', { name: /Login as State Viewer/i });
    fireEvent.click(stateBtn);

    await waitFor(() => {
      expect(handleLoginSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'state_viewer',
        }),
        'dashboard'
      );
    });
  });

  it('supports full trilingual rendering (Hindi & Marathi)', () => {
    const { rerender } = render(<LoginPage language="hi" onLoginSuccess={vi.fn()} />);
    expect(screen.getByRole('button', { name: /स्वास्थ्य कार्यकर्ता लॉगिन/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /जिला व्यवस्थापक लॉगिन/i })).toBeInTheDocument();

    rerender(<LoginPage language="mr" onLoginSuccess={vi.fn()} />);
    expect(screen.getByRole('button', { name: /आरोग्य सेवक लॉगिन/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /जिल्हा प्रशासक लॉगिन/i })).toBeInTheDocument();
  });

  it('allows switching roles from the navbar shortcut in App', async () => {
    render(<App />);

    // Navbar should have "Switch Role" button
    const switchRoleBtn = screen.getByRole('button', { name: /Switch Role/i });
    expect(switchRoleBtn).toBeInTheDocument();

    // Clicking "Switch Role" opens the LoginPage
    fireEvent.click(switchRoleBtn);
    expect(screen.getByText(/Try Demo/i)).toBeInTheDocument();

    // Click "Login as Health Worker"
    const workerBtn = screen.getByRole('button', { name: /Login as Health Worker/i });
    fireEvent.click(workerBtn);

    // Navbar badge updates to Health Worker
    await waitFor(() => {
      expect(screen.getByText(/Health Worker/i)).toBeInTheDocument();
    });
  });
});
