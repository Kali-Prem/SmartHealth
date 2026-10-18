export type Language = 'en' | 'hi' | 'mr';

export type FacilityType = 'PHC' | 'CHC';

export type OperationalStatus = 'optimal' | 'normal' | 'warning' | 'critical';

export interface Centre {
  id: string;
  name: string;
  name_hi: string;
  name_mr?: string;
  facility_type: FacilityType;
  district: string;
  block: string;
  pincode: string;
  latitude: number;
  longitude: number;
  catchment_population: number;
  in_charge_doctor: string;
  phone_number: string;
  operational_status: OperationalStatus;
  problem_type?: string;
  staffing?: {
    medical_officers_sanctioned: number;
    medical_officers_in_position: number;
    specialists_sanctioned: number;
    specialists_in_position: number;
    staff_nurses_in_position: number;
    pharmacists_in_position: number;
    lab_technicians_in_position: number;
    anm_in_position: number;
    asha_workers: number;
  };
  infrastructure?: {
    beds_total: number;
    beds_occupied: number;
    cold_chain_functional: boolean;
    cold_chain_temperature_c: number;
    power_backup_functional: boolean;
    water_supply_24x7: boolean;
    ambulance_available: boolean;
    lab_testing_active: boolean;
  };
}

export type StockStatus = 'normal' | 'low_stock' | 'stockout' | 'adequate' | 'low' | 'expiring_soon';

export interface StockItem {
  id: string;
  centre_id: string;
  item_name?: string;
  drug_name?: string;
  item_name_hi?: string;
  drug_name_hi?: string;
  category: string;
  current_stock: number;
  unit: string;
  reorder_level?: number;
  minimum_reorder_level?: number;
  expiry_date: string;
  batch_number?: string;
  status?: StockStatus;
  stock_status?: StockStatus;
  days_of_supply_remaining?: number;
  days_of_stock_remaining?: number;
  centre_name?: string;
  block?: string;
  is_cold_chain?: boolean;
  storage_temp_range?: string;
}

export interface DailyFootfall {
  id: string;
  centre_id: string;
  centre_name: string;
  block: string;
  date: string;
  total_opd_visits: number;
  emergency_visits: number;
  maternal_child_visits: number;
  ncd_visits: number;
  average_wait_time_minutes: number;
  capacity_saturation_percent: number;
  status: 'normal' | 'high' | 'overcrowded';
}

export interface BedStatus {
  centre_id: string;
  date: string;
  total: number;
  occupied: number;
  available: number;
  occupancy_percent: number;
  centre_name?: string;
  block?: string;
}

export interface DoctorAttendanceEntry {
  doctor_id: string;
  name: string;
  designation: string;
  shift: string;
  status: 'present' | 'on_leave' | 'emergency_deputation' | 'unnotified_absent';
  check_in_time?: string;
}

export interface DoctorAttendance {
  id: string;
  centre_id: string;
  centre_name: string;
  block: string;
  date: string;
  doctors_sanctioned: number;
  doctors_present_today: number;
  absence_rate_percent: number;
  doctors: DoctorAttendanceEntry[];
}

export interface LabTestEntry {
  test_name: string;
  category: string;
  status: 'available' | 'low_reagent' | 'out_of_stock' | 'equipment_down';
  kits_remaining: number;
  equipment_functional: boolean;
}

export interface LabTestAudit {
  id: string;
  centre_id: string;
  centre_name: string;
  block: string;
  audit_date: string;
  total_audited_tests: number;
  available_tests: number;
  availability_rate_percent: number;
  tests: LabTestEntry[];
}

export interface FacilityVulnerabilityScore {
  centre_id: string;
  centre_name: string;
  centre_name_hi: string;
  block: string;
  facility_type: string;
  vulnerability_score: number;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  contributing_factors: string[];
  recommended_interventions: string[];
  stockout_rate: number;
  doctor_absence_rate: number;
  bed_saturation_rate: number;
  test_stockout_rate: number;
  immunization_dropout_rate: number;
}

export interface OperationsSummary {
  total_daily_opd_footfall: number;
  average_district_wait_time_mins: number;
  district_bed_occupancy_percent: number;
  total_beds_occupied: number;
  total_beds_available: number;
  district_doctor_attendance_percent: number;
  doctors_on_duty_today: number;
  doctors_sanctioned_total: number;
  district_test_availability_percent: number;
  underperforming_centres_count: number;
  top_vulnerable_centres: FacilityVulnerabilityScore[];
}

export interface RebalanceCandidate {
  donor_centre_id: string;
  donor_centre_name: string;
  donor_centre_name_hi: string;
  donor_block: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  estimated_transit_mins: number;
  current_stock: number;
  reorder_level: number;
  surplus_available: number;
  recommended_transfer_quantity: number;
  donor_remaining_stock: number;
  expiry_date: string;
  suitability_score: number;
}

export interface RebalanceOptimizationResponse {
  target_centre_id: string;
  target_centre_name: string;
  target_centre_name_hi: string;
  target_block: string;
  drug_name: string;
  deficit_quantity: number;
  top_donor: RebalanceCandidate | null;
  candidates: RebalanceCandidate[];
  distance_algorithm: string;
  gemini_explanation: string;
  gemini_explanation_hi: string;
  generated_at: string;
}

export interface ExecuteRebalanceRequest {
  source_centre_id: string;
  target_centre_id: string;
  drug_name: string;
  quantity: number;
  reason?: string;
}

export interface ExecuteRebalanceResponse {
  transfer_id: string;
  status: string;
  drug_name: string;
  quantity_transferred: number;
  source_centre_id: string;
  source_new_stock: number;
  target_centre_id: string;
  target_new_stock: number;
  message: string;
}

// ---------------------------------------------------------------------------
// Milestone 3: Forecasting, Early Warnings & Staff Deputations
// ---------------------------------------------------------------------------

export interface StockForecastItem {
  drug_name: string;
  drug_name_hi: string;
  category: string;
  current_district_stock: number;
  predicted_monthly_consumption: number;
  procurement_recommendation: number;
  risk_level: 'high' | 'medium' | 'safe';
  rationale: string;
}

export interface EarlyStockoutWarning {
  centre_id: string;
  centre_name: string;
  centre_name_hi: string;
  block: string;
  drug_name: string;
  drug_name_hi: string;
  category: string;
  current_stock: number;
  daily_burn_rate: number;
  days_of_supply_remaining: number;
  stockout_in_days: number;
  urgency: 'immediate' | 'imminent' | 'warning';
  recommended_order_quantity: number;
}

export interface EarlyStockoutReport {
  total_warning_items: number;
  critical_immediate_count: number;
  imminent_7d_count: number;
  warnings: EarlyStockoutWarning[];
  gemini_epidemiology_advisory: string;
  gemini_epidemiology_advisory_hi: string;
}

export interface DeputationCandidate {
  donor_centre_id: string;
  donor_centre_name: string;
  donor_centre_name_hi: string;
  donor_block: string;
  doctor_id: string;
  doctor_name: string;
  designation: string;
  distance_km: number;
  estimated_transit_mins: number;
  doctors_on_duty_at_donor: number;
}

export interface DeputationRecommendation {
  target_centre_id: string;
  target_centre_name: string;
  target_centre_name_hi: string;
  target_block: string;
  absence_rate_percent: number;
  doctors_present: number;
  doctors_sanctioned: number;
  top_candidate: DeputationCandidate | null;
  candidates: DeputationCandidate[];
  distance_algorithm: string;
  gemini_justification: string;
  gemini_justification_hi: string;
}

export interface ExecuteDeputationRequest {
  target_centre_id: string;
  donor_centre_id: string;
  doctor_id: string;
  doctor_name: string;
  date: string;
  reason?: string;
}

export interface ExecuteDeputationResponse {
  deputation_id: string;
  status: string;
  target_centre_id: string;
  donor_centre_id: string;
  doctor_name: string;
  date: string;
  message: string;
}

