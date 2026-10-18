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
import {
  Language,
  Centre,
  StockItem,
  DailyFootfall,
  DoctorAttendance,
  LabTestAudit,
  OperationsSummary,
} from './types';

// Realistic fallback synthetic data matching the backend generator
const INITIAL_CENTRES: Centre[] = [
  {
    id: 'phc_001',
    name: 'Wagholi Primary Health Centre',
    name_hi: 'वाघोली प्राथमिक स्वास्थ्य केंद्र',
    facility_type: 'PHC',
    district: 'Pune',
    block: 'Haveli',
    pincode: '412207',
    latitude: 18.5793,
    longitude: 73.9814,
    catchment_population: 58400,
    in_charge_doctor: 'Dr. Rahul Deshmukh, MBBS, DNB',
    phone_number: '+91 20 2705 1200',
    operational_status: 'critical',
    problem_type: 'overloaded',
    staffing: {
      medical_officers_sanctioned: 2,
      medical_officers_in_position: 2,
      specialists_sanctioned: 0,
      specialists_in_position: 0,
      staff_nurses_in_position: 4,
      pharmacists_in_position: 1,
      lab_technicians_in_position: 1,
      anm_in_position: 8,
      asha_workers: 24,
    },
    infrastructure: {
      beds_total: 8,
      beds_occupied: 9,
      cold_chain_functional: true,
      cold_chain_temperature_c: 4.2,
      power_backup_functional: true,
      water_supply_24x7: true,
      ambulance_available: true,
      lab_testing_active: true,
    },
  },
  {
    id: 'phc_002',
    name: 'Khadakwasla Primary Health Centre',
    name_hi: 'खडकवासला प्राथमिक स्वास्थ्य केंद्र',
    facility_type: 'PHC',
    district: 'Pune',
    block: 'Haveli',
    pincode: '411024',
    latitude: 18.4385,
    longitude: 73.7658,
    catchment_population: 34200,
    in_charge_doctor: 'Dr. Priya Kulkarni, MBBS',
    phone_number: '+91 20 2438 9011',
    operational_status: 'optimal',
    infrastructure: {
      beds_total: 6,
      beds_occupied: 3,
      cold_chain_functional: true,
      cold_chain_temperature_c: 3.8,
      power_backup_functional: true,
      water_supply_24x7: true,
      ambulance_available: true,
      lab_testing_active: true,
    },
  },
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
    infrastructure: {
      beds_total: 6,
      beds_occupied: 4,
      cold_chain_functional: true,
      cold_chain_temperature_c: 4.1,
      power_backup_functional: false,
      water_supply_24x7: false,
      ambulance_available: true,
      lab_testing_active: true,
    },
  },
  {
    id: 'phc_004',
    name: 'Ghodegaon Primary Health Centre',
    name_hi: 'घोडेगाव प्राथमिक स्वास्थ्य केंद्र',
    facility_type: 'PHC',
    district: 'Pune',
    block: 'Ambegaon',
    pincode: '412408',
    latitude: 19.0432,
    longitude: 73.8219,
    catchment_population: 29800,
    in_charge_doctor: 'Dr. Archana Thorat, MBBS',
    phone_number: '+91 2133 2622 15',
    operational_status: 'optimal',
    infrastructure: {
      beds_total: 6,
      beds_occupied: 2,
      cold_chain_functional: true,
      cold_chain_temperature_c: 4.0,
      power_backup_functional: true,
      water_supply_24x7: true,
      ambulance_available: true,
      lab_testing_active: true,
    },
  },
  {
    id: 'phc_005',
    name: 'Narayangaon Primary Health Centre',
    name_hi: 'नारायणगाव प्राथमिक स्वास्थ्य केंद्र',
    facility_type: 'PHC',
    district: 'Pune',
    block: 'Junnar',
    pincode: '410504',
    latitude: 19.1234,
    longitude: 73.9812,
    catchment_population: 31200,
    in_charge_doctor: 'Dr. Mahesh Jadhav, MBBS',
    phone_number: '+91 2132 2420 19',
    operational_status: 'critical',
    problem_type: 'high_doctor_absence',
    infrastructure: {
      beds_total: 6,
      beds_occupied: 3,
      cold_chain_functional: true,
      cold_chain_temperature_c: 4.5,
      power_backup_functional: true,
      water_supply_24x7: true,
      ambulance_available: true,
      lab_testing_active: true,
    },
  },
  {
    id: 'phc_006',
    name: 'Shikrapur Primary Health Centre',
    name_hi: 'शिक्रापूर प्राथमिक स्वास्थ्य केंद्र',
    facility_type: 'PHC',
    district: 'Pune',
    block: 'Shirur',
    pincode: '412208',
    latitude: 18.7345,
    longitude: 74.1209,
    catchment_population: 38900,
    in_charge_doctor: 'Dr. Anita Shinde, MBBS',
    phone_number: '+91 2137 2862 30',
    operational_status: 'warning',
    problem_type: 'high_doctor_absence',
    infrastructure: {
      beds_total: 6,
      beds_occupied: 3,
      cold_chain_functional: true,
      cold_chain_temperature_c: 4.0,
      power_backup_functional: true,
      water_supply_24x7: true,
      ambulance_available: true,
      lab_testing_active: true,
    },
  },
  {
    id: 'phc_007',
    name: 'Alandi Primary Health Centre',
    name_hi: 'आळंदी प्राथमिक स्वास्थ्य केंद्र',
    facility_type: 'PHC',
    district: 'Pune',
    block: 'Khed',
    pincode: '412105',
    latitude: 18.6771,
    longitude: 73.8967,
    catchment_population: 41200,
    in_charge_doctor: 'Dr. Deepak Bhosale, MBBS',
    phone_number: '+91 20 2718 5220',
    operational_status: 'critical',
    problem_type: 'chronic_stockout',
    infrastructure: {
      beds_total: 8,
      beds_occupied: 5,
      cold_chain_functional: true,
      cold_chain_temperature_c: 3.9,
      power_backup_functional: true,
      water_supply_24x7: true,
      ambulance_available: true,
      lab_testing_active: true,
    },
  },
  {
    id: 'phc_008',
    name: 'Manchar Primary Health Centre',
    name_hi: 'मंचर प्राथमिक स्वास्थ्य केंद्र',
    facility_type: 'PHC',
    district: 'Pune',
    block: 'Ambegaon',
    pincode: '410503',
    latitude: 19.0012,
    longitude: 73.9456,
    catchment_population: 36500,
    in_charge_doctor: 'Dr. Kavita Wagh, MBBS',
    phone_number: '+91 2133 2233 44',
    operational_status: 'warning',
    problem_type: 'chronic_stockout',
    infrastructure: {
      beds_total: 6,
      beds_occupied: 4,
      cold_chain_functional: true,
      cold_chain_temperature_c: 4.3,
      power_backup_functional: true,
      water_supply_24x7: true,
      ambulance_available: true,
      lab_testing_active: true,
    },
  },
  {
    id: 'chc_001',
    name: 'Baramati Community Health Centre',
    name_hi: 'बारामती सामुदायिक स्वास्थ्य केंद्र',
    facility_type: 'CHC',
    district: 'Pune',
    block: 'Baramati',
    pincode: '413102',
    latitude: 18.1519,
    longitude: 74.5772,
    catchment_population: 125000,
    in_charge_doctor: 'Dr. Ramesh Pawar, MS (General Surgery)',
    phone_number: '+91 2112 2224 10',
    operational_status: 'optimal',
    infrastructure: {
      beds_total: 30,
      beds_occupied: 22,
      cold_chain_functional: true,
      cold_chain_temperature_c: 4.0,
      power_backup_functional: true,
      water_supply_24x7: true,
      ambulance_available: true,
      lab_testing_active: true,
    },
  },
  {
    id: 'chc_002',
    name: 'Chakan Community Health Centre',
    name_hi: 'चाकण सामुदायिक स्वास्थ्य केंद्र',
    facility_type: 'CHC',
    district: 'Pune',
    block: 'Khed',
    pincode: '410501',
    latitude: 18.7587,
    longitude: 73.8589,
    catchment_population: 110000,
    in_charge_doctor: 'Dr. Sunita Kadam, MD (Gynae)',
    phone_number: '+91 2135 2490 80',
    operational_status: 'optimal',
    infrastructure: {
      beds_total: 30,
      beds_occupied: 24,
      cold_chain_functional: true,
      cold_chain_temperature_c: 3.7,
      power_backup_functional: true,
      water_supply_24x7: true,
      ambulance_available: true,
      lab_testing_active: true,
    },
  },
  {
    id: 'chc_003',
    name: 'Junnar Rural Hospital / CHC',
    name_hi: 'जुन्नर ग्रामीण रुग्णालय / सा.आ.के.',
    facility_type: 'CHC',
    district: 'Pune',
    block: 'Junnar',
    pincode: '410502',
    latitude: 19.2067,
    longitude: 73.8761,
    catchment_population: 98000,
    in_charge_doctor: 'Dr. Ajay More, MD (Medicine)',
    phone_number: '+91 2132 2221 00',
    operational_status: 'optimal',
    infrastructure: {
      beds_total: 30,
      beds_occupied: 19,
      cold_chain_functional: true,
      cold_chain_temperature_c: 4.1,
      power_backup_functional: true,
      water_supply_24x7: true,
      ambulance_available: true,
      lab_testing_active: true,
    },
  },
  {
    id: 'chc_004',
    name: 'Shirur Sub-District Hospital / CHC',
    name_hi: 'शिरूर उप-जिल्हा रुग्णालय / सा.आ.के.',
    facility_type: 'CHC',
    district: 'Pune',
    block: 'Shirur',
    pincode: '412210',
    latitude: 18.8267,
    longitude: 74.3789,
    catchment_population: 140000,
    in_charge_doctor: 'Dr. Vandana Jagtap, MS (Obstetrics)',
    phone_number: '+91 2137 2220 50',
    operational_status: 'optimal',
    infrastructure: {
      beds_total: 30,
      beds_occupied: 26,
      cold_chain_functional: true,
      cold_chain_temperature_c: 4.0,
      power_backup_functional: true,
      water_supply_24x7: true,
      ambulance_available: true,
      lab_testing_active: true,
    },
  },
];

const INITIAL_MEDICINES: StockItem[] = [
  {
    id: 'phc_003_anti_venom',
    centre_id: 'phc_003',
    centre_name: 'Ghogargaon PHC (Tribal)',
    block: 'Ambegaon',
    item_name: 'Snake Antivenom Polyvalent IP',
    item_name_hi: 'सर्पदंश विषरोधी इंजेक्शन',
    category: 'anti_venom',
    current_stock: 0,
    unit: 'vials',
    reorder_level: 10,
    expiry_date: '2027-08-31',
    status: 'stockout',
    days_of_supply_remaining: 0,
  },
  {
    id: 'phc_003_rabies_vaccine',
    centre_id: 'phc_003',
    centre_name: 'Ghogargaon PHC (Tribal)',
    block: 'Ambegaon',
    item_name: 'Rabies Vaccine Human IP',
    item_name_hi: 'रेबीज रोधी टीका',
    category: 'vaccine',
    current_stock: 0,
    unit: 'vials',
    reorder_level: 25,
    expiry_date: '2027-06-30',
    status: 'stockout',
    days_of_supply_remaining: 0,
  },
  {
    id: 'phc_007_amoxicillin',
    centre_id: 'phc_007',
    centre_name: 'Alandi PHC',
    block: 'Khed',
    item_name: 'Amoxicillin 500mg Capsules',
    item_name_hi: 'अमोक्सिसिलिन ५०० मि.ग्रा.',
    category: 'antibiotic',
    current_stock: 0,
    unit: 'strips',
    reorder_level: 150,
    expiry_date: '2027-04-30',
    status: 'stockout',
    days_of_supply_remaining: 0,
  },
  {
    id: 'phc_008_oxytocin',
    centre_id: 'phc_008',
    centre_name: 'Manchar PHC',
    block: 'Ambegaon',
    item_name: 'Oxytocin Injection 5 IU/ml',
    item_name_hi: 'ऑक्सीटोसिन इंजेक्शन ५ IU',
    category: 'maternal_health',
    current_stock: 0,
    unit: 'ampoules',
    reorder_level: 40,
    expiry_date: '2027-09-30',
    status: 'stockout',
    days_of_supply_remaining: 0,
  },
  {
    id: 'phc_001_paracetamol',
    centre_id: 'phc_001',
    centre_name: 'Wagholi PHC',
    block: 'Haveli',
    item_name: 'Paracetamol 500mg Tablets',
    item_name_hi: 'पैरासिटामोल ५०० मि.ग्रा.',
    category: 'analgesic',
    current_stock: 450,
    unit: 'strips',
    reorder_level: 200,
    expiry_date: '2028-01-31',
    status: 'normal',
    days_of_supply_remaining: 18,
  },
  {
    id: 'chc_002_anti_venom',
    centre_id: 'chc_002',
    centre_name: 'Chakan CHC',
    block: 'Khed',
    item_name: 'Snake Antivenom Polyvalent IP',
    item_name_hi: 'सर्पदंश विषरोधी इंजेक्शन',
    category: 'anti_venom',
    current_stock: 45,
    unit: 'vials',
    reorder_level: 15,
    expiry_date: '2027-11-30',
    status: 'normal',
    days_of_supply_remaining: 45,
  },
];

export const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');

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
    } catch (err: any) {
      setInventoryError(err?.message || 'Failed to refresh medicine inventory');
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
    </div>
  </ToastProvider>
  );
};
