import React, { useState } from 'react';
import { Search, AlertOctagon, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { StockItem, Language, StockStatus, ExecuteRebalanceResponse } from '../types';
import { useTranslation } from '../i18n/translations';
import { LateralRebalanceModal } from './LateralRebalanceModal';

interface InventoryViewProps {
  stockItems: StockItem[];
  language: Language;
  onRefreshStock?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  stockItems,
  language,
  onRefreshStock,
  isLoading = false,
  error = null,
}) => {
  const t = useTranslation(language);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | StockStatus>('all');
  const [transferModalItem, setTransferModalItem] = useState<StockItem | null>(null);

  // Field normalization helpers
  const getItemName = (item: StockItem): string =>
    item.item_name || item.drug_name || 'Unknown Drug';

  const getItemNameHi = (item: StockItem): string =>
    item.item_name_hi || item.drug_name_hi || item.item_name || item.drug_name || '';

  const getReorderLevel = (item: StockItem): number =>
    item.reorder_level ?? item.minimum_reorder_level ?? 0;

  const getDaysSupply = (item: StockItem, isZero: boolean): number =>
    item.days_of_supply_remaining ??
    item.days_of_stock_remaining ??
    (isZero ? 0 : Math.round(item.current_stock / 5));

  const getNormalizedStatus = (item: StockItem): 'stockout' | 'low_stock' | 'normal' => {
    const isZero = item.current_stock <= 0;
    if (isZero) return 'stockout';
    const rawStatus = (item.status || item.stock_status || '').toLowerCase();
    if (rawStatus === 'stockout') return 'stockout';
    const reorder = getReorderLevel(item);
    if (item.current_stock < reorder || rawStatus === 'low' || rawStatus === 'low_stock') {
      return 'low_stock';
    }
    return 'normal';
  };

  const safeStockItems = Array.isArray(stockItems) ? stockItems : [];

  const categories = Array.from(
    new Set(safeStockItems.map((s) => s?.category).filter(Boolean))
  ).sort();

  const filtered = safeStockItems.filter((item) => {
    if (!item) return false;
    const name = getItemName(item);
    const nameHi = getItemNameHi(item);
    const centre = item.centre_name || item.centre_id || '';
    const searchLower = (searchTerm || '').trim().toLowerCase();

    const matchName =
      !searchLower ||
      name.toLowerCase().includes(searchLower) ||
      nameHi.toLowerCase().includes(searchLower) ||
      centre.toLowerCase().includes(searchLower);

    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
    const normStat = getNormalizedStatus(item);
    const matchStat =
      statusFilter === 'all' ||
      normStat === statusFilter ||
      (statusFilter === 'normal' &&
        (item.status === 'adequate' || item.stock_status === 'adequate')) ||
      (statusFilter === 'low_stock' &&
        (item.status === 'low' || item.stock_status === 'low'));

    return matchName && matchCat && matchStat;
  });

  const handleTransferComplete = (_result: ExecuteRebalanceResponse) => {
    if (onRefreshStock) {
      onRefreshStock();
    }
  };

  return (
    <div className="inventory-view" role="region" aria-label="Medicine Inventory Management">
      {/* Controls Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
          <Search
            size={18}
            style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            className="btn"
            style={{
              width: '100%',
              paddingLeft: '38px',
              textAlign: 'left',
              background: 'var(--bg-secondary)',
              cursor: 'text',
            }}
            placeholder={t.searchMedicine}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search medicines"
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            className="btn"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter by Drug Category"
            style={{ background: 'var(--bg-secondary)', cursor: 'pointer' }}
          >
            <option value="all">{t.allCategories}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>

          <select
            className="btn"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            aria-label="Filter by Stock Status"
            style={{ background: 'var(--bg-secondary)', cursor: 'pointer' }}
          >
            <option value="all">{t.stockStatus}: All</option>
            <option value="stockout">{t.stockout}</option>
            <option value="low_stock">{t.lowStock}</option>
            <option value="normal">{t.normalStock}</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          className="glass-panel"
          style={{
            padding: '48px 24px',
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
          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {language === 'hi'
              ? 'दवा और वैक्सीन इन्वेंट्री लोड हो रही है...'
              : 'Loading medicine & vaccine inventory...'}
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {language === 'hi'
              ? 'प्राथमिक स्वास्थ्य केंद्रों से डेटा सिंक हो रहा है'
              : 'Synchronizing real-time telemetry from health centres'}
          </p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div
          role="alert"
          className="glass-panel"
          style={{
            padding: '32px 24px',
            textAlign: 'center',
            borderColor: 'rgba(244, 63, 94, 0.3)',
            background: 'rgba(244, 63, 94, 0.08)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.2)',
              color: 'var(--accent-rose)',
              marginBottom: '12px',
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <h3
            style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '6px',
            }}
          >
            {language === 'hi'
              ? 'इन्वेंट्री डेटा लोड करने में त्रुटि'
              : 'Unable to Load Inventory Data'}
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            {error}
          </p>
          {onRefreshStock && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onRefreshStock}
              aria-label="Retry loading inventory"
            >
              <span>{language === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}</span>
            </button>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filtered.length === 0 && (
        <div
          className="glass-panel"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(148, 163, 184, 0.1)',
              color: 'var(--text-muted)',
              marginBottom: '12px',
            }}
          >
            <Search size={22} />
          </div>
          <h3
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '6px',
            }}
          >
            {safeStockItems.length === 0
              ? language === 'hi'
                ? 'कोई इन्वेंट्री रिकॉर्ड उपलब्ध नहीं है'
                : 'No Inventory Records Found'
              : language === 'hi'
                ? 'कोई मिलान वाली दवा नहीं मिली'
                : 'No Matching Medicines Found'}
          </h3>
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              maxWidth: '420px',
              margin: '0 auto 16px auto',
            }}
          >
            {safeStockItems.length === 0
              ? language === 'hi'
                ? 'जिला स्वास्थ्य डेटाबेस में वर्तमान में कोई दवा स्टॉक रिकॉर्ड नहीं मिला।'
                : 'No stock items were found in the health centre database.'
              : language === 'hi'
                ? 'कृपया अपने खोज शब्द या फ़िल्टर मानदंड को बदलकर पुनः प्रयास करें।'
                : 'No medicines match your current search query or filter selection. Try adjusting or clearing your filters.'}
          </p>
          {safeStockItems.length > 0 &&
            (searchTerm || selectedCategory !== 'all' || statusFilter !== 'all') && (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setStatusFilter('all');
                }}
              >
                {language === 'hi' ? 'फ़िल्टर रीसेट करें' : 'Reset Filters'}
              </button>
            )}
        </div>
      )}

      {/* Stock Radar Table */}
      {!isLoading && !error && filtered.length > 0 && (
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Medicine / Essential Drug</th>
                  <th>Category</th>
                  <th>Health Centre</th>
                  <th>Current Stock</th>
                  <th>Reorder Level</th>
                  <th>Days of Supply</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map((item) => {
                  const isZero = item.current_stock <= 0;
                  const reorderLevel = getReorderLevel(item);
                  const isLow = item.current_stock < reorderLevel && !isZero;
                  const daysSupply = getDaysSupply(item, isZero);
                  const itemName = getItemName(item);
                  const itemNameHi = getItemNameHi(item);

                  return (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {language === 'hi' ? itemNameHi : itemName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {itemName}
                        </div>
                      </td>
                      <td>
                        <span style={{ textTransform: 'capitalize', color: 'var(--accent-teal)' }}>
                          {(item.category || '').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.centre_name || item.centre_id}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {item.block || '-'}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: '1rem',
                            color: isZero
                              ? 'var(--accent-rose)'
                              : isLow
                                ? 'var(--accent-amber)'
                                : 'inherit',
                          }}
                        >
                          {item.current_stock} {item.unit}
                        </span>
                      </td>
                      <td>
                        {reorderLevel} {item.unit}
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 600,
                            color: isZero
                              ? 'var(--accent-rose)'
                              : daysSupply < 7
                                ? 'var(--accent-amber)'
                                : 'var(--accent-emerald)',
                          }}
                        >
                          {daysSupply} days
                        </span>
                      </td>
                      <td>{item.expiry_date}</td>
                      <td>
                        {isZero ? (
                          <span className="badge badge-critical">
                            <AlertOctagon size={12} />
                            Stockout
                          </span>
                        ) : isLow ? (
                          <span className="badge badge-warning">Low Stock</span>
                        ) : (
                          <span className="badge badge-optimal">Adequate</span>
                        )}
                      </td>
                      <td>
                        {isZero ? (
                          <button
                            type="button"
                            className="btn btn-rose"
                            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                            onClick={() => setTransferModalItem(item)}
                            aria-label={`Rebalance ${itemName}`}
                          >
                            <ArrowRightLeft size={14} />
                            <span>Rebalance</span>
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lateral Rebalance Modal (Haversine + Gemini reasoning) */}
      {transferModalItem && (
        <LateralRebalanceModal
          isOpen={Boolean(transferModalItem)}
          onClose={() => setTransferModalItem(null)}
          targetCentreId={transferModalItem.centre_id}
          targetCentreName={transferModalItem.centre_name || transferModalItem.centre_id}
          drugName={getItemName(transferModalItem)}
          language={language}
          onTransferComplete={handleTransferComplete}
        />
      )}
    </div>
  );
};
