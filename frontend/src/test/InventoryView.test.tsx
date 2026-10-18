import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InventoryView } from '../components/InventoryView';
import { StockItem } from '../types';

describe('InventoryView & Medicine Stock Regression Suite', () => {
  // Real backend payload structure from /api/v1/inventory (has drug_name, NO item_name)
  const backendFormattedStock: StockItem[] = [
    {
      id: 'stock_phc_003_001',
      centre_id: 'phc_003',
      centre_name: 'Ghogargaon PHC (Tribal)',
      block: 'Ambegaon',
      drug_name: 'Polyvalent Snake Antivenom',
      drug_name_hi: 'पॉलीवैलेंट सर्पदंश रोधी विष',
      category: 'anti_venom',
      batch_number: 'BATCH-2026-B93',
      unit: 'vials',
      current_stock: 0,
      minimum_reorder_level: 15,
      expiry_date: '2027-05-11',
      is_cold_chain: true,
      storage_temp_range: '2°C - 8°C',
      days_to_expiry: 204,
      days_of_stock_remaining: 0,
      stock_status: 'stockout',
    } as any,
    {
      id: 'stock_phc_001_002',
      centre_id: 'phc_001',
      centre_name: 'Wagholi PHC',
      block: 'Haveli',
      drug_name: 'Paracetamol 500mg Tablets',
      drug_name_hi: 'पैरासिटामोल ५०० मि.ग्रा.',
      category: 'analgesic',
      batch_number: 'BATCH-2026-B12',
      unit: 'strips',
      current_stock: 250,
      minimum_reorder_level: 100,
      expiry_date: '2028-01-31',
      days_to_expiry: 400,
      days_of_stock_remaining: 35,
      stock_status: 'adequate',
    } as any,
  ];

  it('renders backend-formatted stock items without throwing undefined errors', () => {
    render(<InventoryView stockItems={backendFormattedStock} language="en" />);

    // Should display both drug names rendered from drug_name fallback
    expect(screen.getAllByText('Polyvalent Snake Antivenom').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Paracetamol 500mg Tablets').length).toBeGreaterThan(0);

    // Reorder button for stockout item should exist
    expect(
      screen.getByRole('button', { name: /Rebalance Polyvalent Snake Antivenom/i })
    ).toBeInTheDocument();
  });

  it('filters stock items by search query without crashing on missing item_name', () => {
    render(<InventoryView stockItems={backendFormattedStock} language="en" />);

    const searchInput = screen.getByPlaceholderText(/Search medicines/i);
    fireEvent.change(searchInput, { target: { value: 'Snake' } });

    expect(screen.getAllByText('Polyvalent Snake Antivenom').length).toBeGreaterThan(0);
    expect(screen.queryByText('Paracetamol 500mg Tablets')).not.toBeInTheDocument();
  });

  it('filters stock items by category selector', () => {
    render(<InventoryView stockItems={backendFormattedStock} language="en" />);

    const categorySelect = screen.getByLabelText(/Filter by Drug Category/i);
    fireEvent.change(categorySelect, { target: { value: 'anti_venom' } });

    expect(screen.getAllByText('Polyvalent Snake Antivenom').length).toBeGreaterThan(0);
    expect(screen.queryByText('Paracetamol 500mg Tablets')).not.toBeInTheDocument();
  });

  it('renders accessible loading state when isLoading is true', () => {
    render(
      <InventoryView
        stockItems={[]}
        language="en"
        isLoading={true}
      />
    );

    const statusRegion = screen.getByRole('status');
    expect(statusRegion).toBeInTheDocument();
    expect(screen.getByText(/Loading medicine & vaccine inventory/i)).toBeInTheDocument();
  });

  it('renders accessible error state with retry button when error is provided', () => {
    const handleRetry = vi.fn();
    render(
      <InventoryView
        stockItems={[]}
        language="en"
        error="Failed to connect to inventory telemetry service"
        onRefreshStock={handleRetry}
      />
    );

    const alertRegion = screen.getByRole('alert');
    expect(alertRegion).toBeInTheDocument();
    expect(screen.getByText(/Unable to Load Inventory Data/i)).toBeInTheDocument();
    expect(
      screen.getByText('Failed to connect to inventory telemetry service')
    ).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Retry loading inventory/i });
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no stock items are available', () => {
    render(<InventoryView stockItems={[]} language="en" />);

    expect(screen.getByText(/No Inventory Records Found/i)).toBeInTheDocument();
    expect(
      screen.getByText(/No stock items were found in the health centre database/i)
    ).toBeInTheDocument();
  });

  it('renders empty search state with Reset Filters button when filter has no matches', () => {
    render(<InventoryView stockItems={backendFormattedStock} language="en" />);

    const searchInput = screen.getByPlaceholderText(/Search medicines/i);
    fireEvent.change(searchInput, { target: { value: 'NonExistentDrug123' } });

    expect(screen.getByText(/No Matching Medicines Found/i)).toBeInTheDocument();

    const resetBtn = screen.getByRole('button', { name: /Reset Filters/i });
    expect(resetBtn).toBeInTheDocument();

    fireEvent.click(resetBtn);
    expect(screen.getAllByText('Polyvalent Snake Antivenom').length).toBeGreaterThan(0);
  });
});
