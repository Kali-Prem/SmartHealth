import React, { useState, useEffect } from 'react';
import { Header, AppTheme } from './components/Header';
import { Navigation, TabKey } from './components/Navigation';
import { KpiScorecard } from './components/KpiScorecard';
import { UnderperformingAlertBanner } from './components/UnderperformingAlertBanner';
import { TopPrioritiesPanel } from './components/TopPrioritiesPanel';
import { ToastProvider } from './components/Toast';
import { FacilitiesView } from './components/FacilitiesView';
import { DistrictMapView } from './components/DistrictMapView';
import { InventoryView } from './components/InventoryView';
import { OperationsView } from './components/OperationsView';
import { AiCopilotModal } from './components/AiCopilotModal';
import { LateralRebalanceModal } from './components/LateralRebalanceModal';
import { DemandForecastView } from './components/DemandForecastView';
import { DoctorDeputationModal } from './components/DoctorDeputationModal';
import { InteractiveDemoModal } from './components/InteractiveDemoModal';
import { LoginPage } from './components/LoginPage';
import { AccessDeniedView } from './components/AccessDeniedView';
import { useTranslation } from './i18n/translations';
import {
  Language,
  Centre,
  StockItem,
  DailyFootfall,
  DoctorAttendance,
  LabTestAudit,
  OperationsSummary,
  AuthUser,
} from './types';

import { INITIAL_CENTRES, INITIAL_MEDICINES } from './data/initialData';

const DEFAULT_DEMO_USER: AuthUser = {
  username: 'admin@smarthealth.demo',
  role: 'district_admin',
  name: 'Dr. Rajesh Sharma, DHO',
  facility_name: 'Pune District Command Center',
  district: 'Pune',
  token: 'demo-admin-token',
};

export const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');
  const t = useTranslation(language);

  // Authentication & Demo Persona State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('smarthealth-auth-user');
        if (saved) return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return DEFAULT_DEMO_USER;
  });

  const [isLoginViewOpen, setIsLoginViewOpen] = useState(false);

  const handleLoginSuccess = (user: AuthUser, targetDashboard: 'operations' | 'dashboard') => {
    setCurrentUser(user);
    setIsLoginViewOpen(false);
    setActiveTab(targetDashboard);
  };

  const handleSwitchRole = () => {
    setIsLoginViewOpen(true);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('smarthealth-auth-user');
      localStorage.removeItem('smarthealth-auth-token');
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setIsLoginViewOpen(true);
  };

  // Theme state: 'light' (default), 'dark', or 'high-contrast'
  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('smarthealth-theme') as AppTheme | null;
        if (saved === 'dark' || saved === 'high-contrast' || saved === 'light') {
          return saved;
        }
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          return 'dark';
        }
      }
    } catch {
      // Default to light
    }
    return 'light';
  });

  const [highContrast, setHighContrast] = useState(theme === 'high-contrast');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('smarthealth-theme', theme);
    } catch {
      // Ignore in restricted environments
    }
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.toggle('theme-dark', theme === 'dark');
    document.body.classList.toggle('high-contrast', theme === 'high-contrast');
    setHighContrast(theme === 'high-contrast');
  }, [theme]);

  const toggleContrast = () => {
    setTheme((prev) => (prev === 'high-contrast' ? 'light' : 'high-contrast'));
  };

  const handleThemeChange = (newTheme: AppTheme) => {
    setTheme(newTheme);
  };

  const [centres, setCentres] = useState<Centre[]>(INITIAL_CENTRES);
  const [stockItems, setStockItems] = useState<StockItem[]>(INITIAL_MEDICINES);
  const [summary, setSummary] = useState<OperationsSummary | null>(null);
  const [rebalanceModal, setRebalanceModal] = useState<{
    isOpen: boolean;
    centreId: string;
    centreName: string;
    drugName: string;
  } | null>(null);
  const [deputationModal, setDeputationModal] = useState<{
    isOpen: boolean;
    centreId?: string;
    centreName?: string;
  } | null>(null);

  const [loadingInventory, setLoadingInventory] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  const enrichStockItems = (items: StockItem[], centresList: Centre[]): StockItem[] => {
    const centreMap = new Map(centresList.map((c) => [c.id, c]));
    return items.map((item) => {
      const centre = centreMap.get(item.centre_id);
      return {
        ...item,
        centre_name: item.centre_name || centre?.name || item.centre_id,
        block: item.block || centre?.block || '',
      };
    });
  };

  const refreshInventory = async () => {
    setLoadingInventory(true);
    setInventoryError(null);
    try {
      const [invRes, sumRes] = await Promise.all([
        fetch('/api/v1/inventory'),
        fetch('/api/v1/operations/summary'),
      ]);
      if (!invRes.ok) {
        throw new Error(`Inventory API returned HTTP ${invRes.status}`);
      }
      const invData = await invRes.json();
      if (Array.isArray(invData)) {
        setStockItems(enrichStockItems(invData, centres));
      }
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData);
      }
    } catch (err: unknown) {
      setInventoryError(err instanceof Error ? err.message : 'Failed to refresh medicine inventory');
    } finally {
      setLoadingInventory(false);
    }
  };

  const [footfallLogs, setFootfallLogs] = useState<DailyFootfall[]>([
    {
      id: 'footfall_phc_001_latest',
      centre_id: 'phc_001',
      centre_name: 'Wagholi PHC',
      block: 'Haveli',
      date: '2026-10-18',
      total_opd_visits: 221,
      emergency_visits: 24,
      maternal_child_visits: 58,
      ncd_visits: 48,
      average_wait_time_minutes: 56,
      capacity_saturation_percent: 221.0,
      status: 'overcrowded',
    },
    {
      id: 'footfall_chc_001_latest',
      centre_id: 'chc_001',
      centre_name: 'Baramati CHC',
      block: 'Baramati',
      date: '2026-10-18',
      total_opd_visits: 340,
      emergency_visits: 32,
      maternal_child_visits: 85,
      ncd_visits: 75,
      average_wait_time_minutes: 24,
      capacity_saturation_percent: 113.3,
      status: 'high',
    },
  ]);

  const [attendanceLogs, setAttendanceLogs] = useState<DoctorAttendance[]>([
    {
      id: 'att_phc_005_latest',
      centre_id: 'phc_005',
      centre_name: 'Narayangaon PHC',
      block: 'Junnar',
      date: '2026-10-18',
      doctors_sanctioned: 2,
      doctors_present_today: 1,
      absence_rate_percent: 50.0,
      doctors: [
        {
          doctor_id: 'doc_narayan_1',
          name: 'Dr. Mahesh Jadhav',
          designation: 'Medical Officer In-Charge',
          shift: 'morning',
          status: 'unnotified_absent',
        },
        {
          doctor_id: 'doc_narayan_2',
          name: 'Dr. Pooja Shinde',
          designation: 'Medical Officer',
          shift: 'morning',
          status: 'present',
          check_in_time: '09:15:00',
        },
      ],
    },
  ]);

  const [testAudits, setTestAudits] = useState<LabTestAudit[]>([
    {
      id: 'audit_phc_001_latest',
      centre_id: 'phc_001',
      centre_name: 'Wagholi PHC',
      block: 'Haveli',
      audit_date: '2026-10-18',
      total_audited_tests: 5,
      available_tests: 4,
      availability_rate_percent: 80.0,
      tests: [
        { test_name: 'Hemoglobin (Hb)', category: 'haematology', status: 'available', kits_remaining: 85, equipment_functional: true },
        { test_name: 'Rapid Malaria Antigen', category: 'communicable', status: 'available', kits_remaining: 60, equipment_functional: true },
        { test_name: 'Blood Glucose (RBS)', category: 'biochemistry', status: 'available', kits_remaining: 120, equipment_functional: true },
        { test_name: 'Pregnancy Test (UPT)', category: 'maternal', status: 'available', kits_remaining: 45, equipment_functional: true },
        { test_name: 'Sputum Microscopy (TB)', category: 'communicable', status: 'equipment_down', kits_remaining: 0, equipment_functional: false },
      ],
    },
  ]);

  // Load backend telemetry if server running
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, centresRes, invRes, footRes, attRes, testRes] = await Promise.all([
          fetch('/api/v1/operations/summary'),
          fetch('/api/v1/centres'),
          fetch('/api/v1/inventory'),
          fetch('/api/v1/operations/footfall/phc_001?limit=30'),
          fetch('/api/v1/operations/attendance/phc_005'),
          fetch('/api/v1/operations/tests/phc_001'),
        ]);

        if (sumRes.ok) {
          const sumData = await sumRes.json();
          setSummary(sumData);
        }
        if (centresRes.ok) {
          const centresData = await centresRes.json();
          if (centresData.length > 0) setCentres(centresData);
        }
        if (invRes.ok) {
          const invData = await invRes.json();
          if (Array.isArray(invData) && invData.length > 0) {
            setStockItems(enrichStockItems(invData, centres));
          }
        }
        if (footRes.ok) {
          const footData = await footRes.json();
          if (footData.length > 0) setFootfallLogs(footData);
        }
        if (attRes.ok) {
          const attData = await attRes.json();
          setAttendanceLogs([attData]);
        }
        if (testRes.ok) {
          const testData = await testRes.json();
          setTestAudits([testData]);
        }
      } catch {
        // Fallback already pre-loaded
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <ToastProvider>
      <div className="app-container">
        {/* Header */}
        <Header
          language={language}
          onLanguageChange={setLanguage}
          theme={theme}
          onThemeChange={handleThemeChange}
          highContrast={highContrast}
          onToggleContrast={toggleContrast}
          onOpenCopilot={() => setIsCopilotOpen(true)}
          onLaunchDemo={() => setIsDemoOpen(true)}
          currentUser={currentUser}
          onSwitchRole={handleSwitchRole}
          onLogout={handleLogout}
        />

        <div className="app-shell">
          {/* Navigation: Desktop Left Sidebar + Mobile Bottom Nav */}
          <Navigation
            activeTab={activeTab}
            onTabChange={(tab) => {
              if (tab === 'copilot') {
                setIsCopilotOpen(true);
              } else {
                setActiveTab(tab);
              }
            }}
            language={language}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          />

          <main className="main-content" id="main-content">
            {isLoginViewOpen ? (
              <LoginPage
                language={language}
                onLoginSuccess={handleLoginSuccess}
                onClose={currentUser ? () => setIsLoginViewOpen(false) : undefined}
              />
            ) : (
              <>
                {/* Persistent State Viewer Read-Only Notice */}
                {currentUser?.role === 'state_viewer' && (
                  <div
                    className="state-readonly-banner"
                    role="status"
                    style={{ marginBottom: '16px' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="readonly-pill-tag">{t.readOnlyBadge}</span>
                      <span>{t.stateReadOnlyNotice}</span>
                    </span>
                    <button
                      type="button"
                      className="btn"
                      onClick={handleSwitchRole}
                      style={{ padding: '3px 8px', fontSize: '0.75rem', fontWeight: 700 }}
                      aria-label={t.switchRole}
                    >
                      {t.switchRole}
                    </button>
                  </div>
                )}

                {/* Role-Based Access Restriction: Health Worker restricted from Forecasting */}
                {currentUser?.role === 'health_worker' && activeTab === 'forecasting' ? (
                  <AccessDeniedView
                    language={language}
                    currentUser={currentUser}
                    attemptedSection={t.demandForecast}
                    onNavigateAllowed={() => setActiveTab('operations')}
                    onSwitchRole={handleSwitchRole}
                  />
                ) : (
                  <>
                    {/* Dashboard View */}
                    {activeTab === 'dashboard' && (
                      <>
                        {/* Compact Top Priorities Today Panel */}
                        <TopPrioritiesPanel
                          language={language}
                          onOpenInventory={() => setActiveTab('inventory')}
                          onOpenDeputation={(cId) => {
                            const found = centres.find((c) => c.id === cId);
                            setDeputationModal({
                              isOpen: true,
                              centreId: cId,
                              centreName: found
                                ? language === 'hi'
                                  ? found.name_hi || found.name
                                  : found.name
                                : undefined,
                            });
                          }}
                          onSelectCentre={(_id) => setActiveTab('facilities')}
                        />

                        <KpiScorecard
                          summary={summary}
                          language={language}
                          onSelectAlertTab={() => setActiveTab('facilities')}
                        />

                        <UnderperformingAlertBanner
                          vulnerableCentres={summary?.top_vulnerable_centres || []}
                          language={language}
                          onSelectCentre={(_id) => setActiveTab('facilities')}
                          onOpenInventory={() => setActiveTab('inventory')}
                          onOpenDeputation={(cId) => {
                            const found = centres.find((c) => c.id === cId);
                            setDeputationModal({
                              isOpen: true,
                              centreId: cId,
                              centreName: found
                                ? language === 'hi'
                                  ? found.name_hi || found.name
                                  : found.name
                                : undefined,
                            });
                          }}
                          onOpenForecast={() => setActiveTab('forecasting')}
                        />

                        <FacilitiesView
                          centres={centres}
                          language={language}
                          onSelectCentre={(_id) => setActiveTab('operations')}
                          onViewOnMap={(_id) => setActiveTab('map')}
                        />
                      </>
                    )}

                    {/* District Map (Google Maps) */}
                    {activeTab === 'map' && (
                      <DistrictMapView
                        centres={centres}
                        language={language}
                        onOpenRebalanceModal={(cId, cName, drug) => {
                          setRebalanceModal({
                            isOpen: true,
                            centreId: cId,
                            centreName: cName,
                            drugName: drug,
                          });
                        }}
                        onSelectCentre={(_id) => setActiveTab('operations')}
                      />
                    )}

                    {/* Facilities View */}
                    {activeTab === 'facilities' && (
                      <FacilitiesView
                        centres={centres}
                        language={language}
                        onSelectCentre={(_id) => setActiveTab('operations')}
                        onViewOnMap={(_id) => setActiveTab('map')}
                      />
                    )}

                    {/* Inventory View */}
                    {activeTab === 'inventory' && (
                      <InventoryView
                        stockItems={stockItems}
                        language={language}
                        onRefreshStock={refreshInventory}
                        isLoading={loadingInventory}
                        error={inventoryError}
                      />
                    )}

                    {/* AI Demand Forecasting & Early Stockout Warnings View */}
                    {activeTab === 'forecasting' && (
                      <DemandForecastView
                        language={language}
                        onOpenRebalanceModal={(cId, cName, drug) => {
                          setRebalanceModal({
                            isOpen: true,
                            centreId: cId,
                            centreName: cName,
                            drugName: drug,
                          });
                        }}
                      />
                    )}

                    {/* Operations View */}
                    {activeTab === 'operations' && (
                      <OperationsView
                        footfallLogs={footfallLogs}
                        attendanceLogs={attendanceLogs}
                        testAudits={testAudits}
                        language={language}
                        onOpenDeputationModal={(cId, cName) => {
                          setDeputationModal({
                            isOpen: true,
                            centreId: cId,
                            centreName: cName,
                          });
                        }}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </main>
        </div>

      {/* Gemini AI Copilot Modal */}
      <AiCopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        language={language}
      />

      {/* Lateral Rebalance Modal (Triggered from Map, Facilities or Forecasting) */}
      {rebalanceModal && rebalanceModal.isOpen && (
        <LateralRebalanceModal
          isOpen={rebalanceModal.isOpen}
          onClose={() => setRebalanceModal(null)}
          targetCentreId={rebalanceModal.centreId}
          targetCentreName={rebalanceModal.centreName}
          drugName={rebalanceModal.drugName}
          language={language}
          onTransferComplete={refreshInventory}
        />
      )}

      {/* Doctor Deputation Modal (Triggered from Operations or Alerts) */}
      {deputationModal && deputationModal.isOpen && (
        <DoctorDeputationModal
          isOpen={deputationModal.isOpen}
          onClose={() => setDeputationModal(null)}
          targetCentreId={deputationModal.centreId}
          targetCentreName={deputationModal.centreName}
          language={language}
          onDeputationExecuted={() => {
            fetch('/api/v1/operations/summary')
              .then((r) => r.ok && r.json())
              .then((data) => data && setSummary(data))
              .catch(() => {});
          }}
        />
      )}
      {/* Evaluator Interactive Demo Modal */}
      <InteractiveDemoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        language={language}
        onExecuteSuccess={(_msg) => {
          refreshInventory();
          fetch('/api/v1/operations/summary')
            .then((r) => r.ok && r.json())
            .then((data) => data && setSummary(data))
            .catch(() => {});
        }}
      />
    </div>
  </ToastProvider>
  );
};
