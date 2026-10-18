"""Synthetic 90-Day District Health Network Data Generator for SmartHealth.

Generates:
- 1 District: Pune District, Maharashtra
- 12 Centres: 8 PHCs and 4 CHCs across 6 administrative blocks
- 40 Essential Medicines (EDL India with bilingual English/Hindi names)
- 90 Days of daily historical records:
  * Daily patient footfall & wait times
  * Daily doctor shift attendance
  * Daily inpatient bed occupancy
  * Daily diagnostic test availability audits
  * Current inventory batches with stockout indicators

Deliberately planted problems:
1. Chronic Stockouts (3 centres):
   - phc_003 (Ghogargaon PHC - Tribal): Antivenom, Rabies Vaccine, ORS, Ringer Lactate zero stock.
   - phc_007 (Alandi PHC): Antibiotics, Metformin, Paracetamol zero stock.
   - phc_008 (Manchar PHC): Oxytocin, IFA, Magnesium Sulphate zero stock.
2. High Doctor Absence (2 centres):
   - phc_005 (Narayangaon PHC): Doctor absence rate 65-75% over 90 days.
   - phc_006 (Shikrapur PHC): Doctor absence rate 55-65% with recurring unnotified absences.
3. Overloaded Centre (1 centre):
   - phc_001 (Wagholi PHC): Footfall 200%-260% of capacity, wait times 45-65 mins, bed occupancy 105%-125%.
"""

import random
from datetime import datetime, timedelta
from typing import Any

# ---------------------------------------------------------------------------
# 12 Health Centres (Pune District)
# ---------------------------------------------------------------------------
DISTRICT_CENTRES = [
    {
        "id": "phc_001",
        "name": "Wagholi Primary Health Centre",
        "name_hi": "वाघोली प्राथमिक स्वास्थ्य केंद्र",
        "facility_type": "PHC",
        "district": "Pune",
        "block": "Haveli",
        "pincode": "412207",
        "latitude": 18.5808,
        "longitude": 73.9787,
        "catchment_population": 48500,
        "in_charge_doctor": "Dr. Priya Deshmukh, MBBS",
        "phone_number": "+91 20 2705 1102",
        "operational_status": "warning",  # OVERLOADED CENTRE
        "problem_type": "overloaded",
        "staffing": {
            "medical_officers_sanctioned": 2,
            "medical_officers_in_position": 2,
            "specialists_sanctioned": 0,
            "specialists_in_position": 0,
            "staff_nurses_sanctioned": 5,
            "staff_nurses_in_position": 5,
            "pharmacists_in_position": 1,
            "lab_technicians_in_position": 1,
            "anm_in_position": 8,
            "asha_workers": 22,
        },
        "infrastructure": {
            "beds_total": 8,
            "beds_occupied": 9,  # Overcrowded beds!
            "cold_chain_functional": True,
            "cold_chain_temperature_c": 4.1,
            "power_backup_functional": True,
            "water_supply_24x7": True,
            "ambulance_available": True,
            "lab_testing_active": True,
        },
    },
    {
        "id": "chc_002",
        "name": "Uruli Kanchan Community Health Centre",
        "name_hi": "उरुळी कांचन सामुदायिक स्वास्थ्य केंद्र",
        "facility_type": "CHC",
        "district": "Pune",
        "block": "Haveli",
        "pincode": "412202",
        "latitude": 18.4862,
        "longitude": 74.1332,
        "catchment_population": 115000,
        "in_charge_doctor": "Dr. Anand Kulkarni, MS (Surgeon)",
        "phone_number": "+91 20 2692 6301",
        "operational_status": "normal",
        "problem_type": "none",
        "staffing": {
            "medical_officers_sanctioned": 4,
            "medical_officers_in_position": 4,
            "specialists_sanctioned": 4,
            "specialists_in_position": 4,
            "staff_nurses_sanctioned": 12,
            "staff_nurses_in_position": 12,
            "pharmacists_in_position": 2,
            "lab_technicians_in_position": 2,
            "anm_in_position": 16,
            "asha_workers": 35,
        },
        "infrastructure": {
            "beds_total": 30,
            "beds_occupied": 21,
            "cold_chain_functional": True,
            "cold_chain_temperature_c": 3.8,
            "power_backup_functional": True,
            "water_supply_24x7": True,
            "ambulance_available": True,
            "lab_testing_active": True,
        },
    },
    {
        "id": "phc_003",
        "name": "Ghogargaon Primary Health Centre",
        "name_hi": "घोगरगाव प्राथमिक स्वास्थ्य केंद्र",
        "facility_type": "PHC",
        "district": "Pune",
        "block": "Ambegaon (Tribal)",
        "pincode": "410503",
        "latitude": 19.0412,
        "longitude": 73.8115,
        "catchment_population": 22100,
        "in_charge_doctor": "Dr. Sandeep Borde, MBBS",
        "phone_number": "+91 2133 2410 88",
        "operational_status": "critical",  # CHRONIC STOCKOUTS
        "problem_type": "chronic_stockout",
        "staffing": {
            "medical_officers_sanctioned": 2,
            "medical_officers_in_position": 1,
            "specialists_sanctioned": 0,
            "specialists_in_position": 0,
            "staff_nurses_sanctioned": 4,
            "staff_nurses_in_position": 2,
            "pharmacists_in_position": 0,
            "lab_technicians_in_position": 1,
            "anm_in_position": 4,
            "asha_workers": 11,
        },
        "infrastructure": {
            "beds_total": 6,
            "beds_occupied": 4,
            "cold_chain_functional": True,
            "cold_chain_temperature_c": 5.4,
            "power_backup_functional": False,
            "water_supply_24x7": False,
            "ambulance_available": True,
            "lab_testing_active": True,
        },
    },
    {
        "id": "phc_004",
        "name": "Baramati Rural PHC",
        "name_hi": "बारामती ग्रामीण प्राथमिक स्वास्थ्य केंद्र",
        "facility_type": "PHC",
        "district": "Pune",
        "block": "Baramati",
        "pincode": "413102",
        "latitude": 18.1517,
        "longitude": 74.5771,
        "catchment_population": 28400,
        "in_charge_doctor": "Dr. Sunita Patil, MBBS, DGO",
        "phone_number": "+91 2112 2221 45",
        "operational_status": "normal",
        "problem_type": "none",
        "staffing": {
            "medical_officers_sanctioned": 2,
            "medical_officers_in_position": 2,
            "specialists_sanctioned": 1,
            "specialists_in_position": 1,
            "staff_nurses_sanctioned": 5,
            "staff_nurses_in_position": 5,
            "pharmacists_in_position": 1,
            "lab_technicians_in_position": 1,
            "anm_in_position": 7,
            "asha_workers": 18,
        },
        "infrastructure": {
            "beds_total": 10,
            "beds_occupied": 6,
            "cold_chain_functional": True,
            "cold_chain_temperature_c": 3.6,
            "power_backup_functional": True,
            "water_supply_24x7": True,
            "ambulance_available": True,
            "lab_testing_active": True,
        },
    },
    {
        "id": "phc_005",
        "name": "Narayangaon Primary Health Centre",
        "name_hi": "नारायणगाव प्राथमिक स्वास्थ्य केंद्र",
        "facility_type": "PHC",
        "district": "Pune",
        "block": "Junnar",
        "pincode": "410504",
        "latitude": 19.1234,
        "longitude": 73.9812,
        "catchment_population": 31200,
        "in_charge_doctor": "Dr. Mahesh Jadhav, MBBS",
        "phone_number": "+91 2132 2420 19",
        "operational_status": "critical",  # HIGH DOCTOR ABSENCE
        "problem_type": "high_doctor_absence",
        "staffing": {
            "medical_officers_sanctioned": 2,
            "medical_officers_in_position": 2,
            "specialists_sanctioned": 0,
            "specialists_in_position": 0,
            "staff_nurses_sanctioned": 4,
            "staff_nurses_in_position": 3,
            "pharmacists_in_position": 1,
            "lab_technicians_in_position": 1,
            "anm_in_position": 6,
            "asha_workers": 15,
        },
        "infrastructure": {
            "beds_total": 6,
            "beds_occupied": 3,
            "cold_chain_functional": True,
            "cold_chain_temperature_c": 4.5,
            "power_backup_functional": True,
            "water_supply_24x7": True,
            "ambulance_available": True,
            "lab_testing_active": True,
        },
    },
    {
        "id": "phc_006",
        "name": "Shikrapur Primary Health Centre",
        "name_hi": "शिक्रापूर प्राथमिक स्वास्थ्य केंद्र",
        "facility_type": "PHC",
        "district": "Pune",
        "block": "Shirur",
        "pincode": "412208",
        "latitude": 18.7345,
        "longitude": 74.1209,
        "catchment_population": 38900,
        "in_charge_doctor": "Dr. Anita Shinde, MBBS",
        "phone_number": "+91 2137 2862 30",
        "operational_status": "warning",  # HIGH DOCTOR ABSENCE
        "problem_type": "high_doctor_absence",
        "staffing": {
            "medical_officers_sanctioned": 2,
            "medical_officers_in_position": 2,
            "specialists_sanctioned": 0,
            "specialists_in_position": 0,
            "staff_nurses_sanctioned": 5,
            "staff_nurses_in_position": 4,
            "pharmacists_in_position": 1,
            "lab_technicians_in_position": 1,
            "anm_in_position": 8,
            "asha_workers": 20,
        },
        "infrastructure": {
            "beds_total": 8,
            "beds_occupied": 4,
            "cold_chain_functional": True,
            "cold_chain_temperature_c": 3.9,
            "power_backup_functional": True,
            "water_supply_24x7": True,
            "ambulance_available": True,
            "lab_testing_active": True,
        },
    },
    {
        "id": "phc_007",
        "name": "Alandi Primary Health Centre",
        "name_hi": "आळंदी प्राथमिक स्वास्थ्य केंद्र",
        "facility_type": "PHC",
        "district": "Pune",
        "block": "Khed",
        "pincode": "412105",
        "latitude": 18.6775,
        "longitude": 73.8964,
        "catchment_population": 41200,
        "in_charge_doctor": "Dr. Suresh More, MBBS",
        "phone_number": "+91 20 2718 5220",
        "operational_status": "critical",  # CHRONIC STOCKOUTS
        "problem_type": "chronic_stockout",
        "staffing": {
            "medical_officers_sanctioned": 2,
            "medical_officers_in_position": 2,
            "specialists_sanctioned": 0,
            "specialists_in_position": 0,
            "staff_nurses_sanctioned": 5,
            "staff_nurses_in_position": 4,
            "pharmacists_in_position": 1,
            "lab_technicians_in_position": 1,
            "anm_in_position": 8,
            "asha_workers": 19,
        },
        "infrastructure": {
            "beds_total": 6,
            "beds_occupied": 5,
            "cold_chain_functional": True,
            "cold_chain_temperature_c": 4.2,
            "power_backup_functional": True,
            "water_supply_24x7": True,
            "ambulance_available": True,
            "lab_testing_active": True,
        },
    },
    {
        "id": "phc_008",
        "name": "Manchar Primary Health Centre",
        "name_hi": "मंचर प्राथमिक स्वास्थ्य केंद्र",
        "facility_type": "PHC",
        "district": "Pune",
        "block": "Ambegaon",
        "pincode": "410503",
        "latitude": 19.0067,
        "longitude": 73.9422,
        "catchment_population": 36700,
        "in_charge_doctor": "Dr. Kavita Joshi, MBBS",
        "phone_number": "+91 2133 2231 10",
        "operational_status": "critical",  # CHRONIC STOCKOUTS
        "problem_type": "chronic_stockout",
        "staffing": {
            "medical_officers_sanctioned": 2,
            "medical_officers_in_position": 2,
            "specialists_sanctioned": 0,
            "specialists_in_position": 0,
            "staff_nurses_sanctioned": 4,
            "staff_nurses_in_position": 3,
            "pharmacists_in_position": 1,
            "lab_technicians_in_position": 1,
            "anm_in_position": 7,
            "asha_workers": 16,
        },
        "infrastructure": {
            "beds_total": 6,
            "beds_occupied": 4,
            "cold_chain_functional": True,
            "cold_chain_temperature_c": 4.0,
            "power_backup_functional": True,
            "water_supply_24x7": True,
            "ambulance_available": True,
            "lab_testing_active": True,
        },
    },
    {
        "id": "chc_009",
        "name": "Malegaon Community Health Centre",
        "name_hi": "माळेगाव सामुदायिक स्वास्थ्य केंद्र",
        "facility_type": "CHC",
        "district": "Pune",
        "block": "Baramati",
        "pincode": "413115",
        "latitude": 18.1722,
        "longitude": 74.4981,
        "catchment_population": 98000,
        "in_charge_doctor": "Dr. Nitin Deshpande, MD",
        "phone_number": "+91 2112 2541 20",
        "operational_status": "normal",
        "problem_type": "none",
        "staffing": {
            "medical_officers_sanctioned": 4,
            "medical_officers_in_position": 4,
            "specialists_sanctioned": 3,
            "specialists_in_position": 3,
            "staff_nurses_sanctioned": 10,
            "staff_nurses_in_position": 10,
            "pharmacists_in_position": 2,
            "lab_technicians_in_position": 2,
            "anm_in_position": 12,
            "asha_workers": 28,
        },
        "infrastructure": {
            "beds_total": 30,
            "beds_occupied": 18,
            "cold_chain_functional": True,
            "cold_chain_temperature_c": 3.7,
            "power_backup_functional": True,
            "water_supply_24x7": True,
            "ambulance_available": True,
            "lab_testing_active": True,
        },
    },
    {
        "id": "chc_010",
        "name": "Junnar Rural Hospital / CHC",
        "name_hi": "जुन्नर ग्रामीण रुग्णालय / सीएचसी",
        "facility_type": "CHC",
        "district": "Pune",
        "block": "Junnar",
        "pincode": "410502",
        "latitude": 19.2064,
        "longitude": 73.8767,
        "catchment_population": 125000,
        "in_charge_doctor": "Dr. Arvind Pawar, MS",
        "phone_number": "+91 2132 2220 50",
        "operational_status": "normal",
        "problem_type": "none",
        "staffing": {
            "medical_officers_sanctioned": 5,
            "medical_officers_in_position": 5,
            "specialists_sanctioned": 4,
            "specialists_in_position": 3,
            "staff_nurses_sanctioned": 14,
            "staff_nurses_in_position": 13,
            "pharmacists_in_position": 2,
            "lab_technicians_in_position": 2,
            "anm_in_position": 18,
            "asha_workers": 40,
        },
        "infrastructure": {
            "beds_total": 40,
            "beds_occupied": 27,
            "cold_chain_functional": True,
            "cold_chain_temperature_c": 3.5,
            "power_backup_functional": True,
            "water_supply_24x7": True,
            "ambulance_available": True,
            "lab_testing_active": True,
        },
    },
    {
        "id": "chc_011",
        "name": "Shirur Rural CHC",
        "name_hi": "शिरूर ग्रामीण सामुदायिक स्वास्थ्य केंद्र",
        "facility_type": "CHC",
        "district": "Pune",
        "block": "Shirur",
        "pincode": "412210",
        "latitude": 18.8267,
        "longitude": 74.3789,
        "catchment_population": 110000,
        "in_charge_doctor": "Dr. Hemant Kadam, MS",
        "phone_number": "+91 2137 2221 00",
        "operational_status": "normal",
        "problem_type": "none",
        "staffing": {
            "medical_officers_sanctioned": 4,
            "medical_officers_in_position": 4,
            "specialists_sanctioned": 3,
            "specialists_in_position": 3,
            "staff_nurses_sanctioned": 12,
            "staff_nurses_in_position": 11,
            "pharmacists_in_position": 2,
            "lab_technicians_in_position": 2,
            "anm_in_position": 14,
            "asha_workers": 30,
        },
        "infrastructure": {
            "beds_total": 30,
            "beds_occupied": 22,
            "cold_chain_functional": True,
            "cold_chain_temperature_c": 3.9,
            "power_backup_functional": True,
            "water_supply_24x7": True,
            "ambulance_available": True,
            "lab_testing_active": True,
        },
    },
    {
        "id": "phc_012",
        "name": "Daund Rural PHC",
        "name_hi": "दौंड ग्रामीण प्राथमिक स्वास्थ्य केंद्र",
        "facility_type": "PHC",
        "district": "Pune",
        "block": "Daund",
        "pincode": "413801",
        "latitude": 18.4689,
        "longitude": 74.5822,
        "catchment_population": 34100,
        "in_charge_doctor": "Dr. Rajesh Chavan, MBBS",
        "phone_number": "+91 2117 2623 44",
        "operational_status": "normal",
        "problem_type": "none",
        "staffing": {
            "medical_officers_sanctioned": 2,
            "medical_officers_in_position": 2,
            "specialists_sanctioned": 0,
            "specialists_in_position": 0,
            "staff_nurses_sanctioned": 5,
            "staff_nurses_in_position": 4,
            "pharmacists_in_position": 1,
            "lab_technicians_in_position": 1,
            "anm_in_position": 7,
            "asha_workers": 17,
        },
        "infrastructure": {
            "beds_total": 8,
            "beds_occupied": 5,
            "cold_chain_functional": True,
            "cold_chain_temperature_c": 4.1,
            "power_backup_functional": True,
            "water_supply_24x7": True,
            "ambulance_available": True,
            "lab_testing_active": True,
        },
    },
]

# ---------------------------------------------------------------------------
# 40 Essential Medicines (EDL India)
# ---------------------------------------------------------------------------
ESSENTIAL_MEDICINES = [
    {
        "name": "Polyvalent Snake Antivenom",
        "name_hi": "पॉलीवैलेंट सर्पदंश रोधी विष (एंटी-वेनम)",
        "category": "anti_venom",
        "unit": "vials",
        "mrl": 15,
        "cold": True,
        "critical": True,
    },
    {
        "name": "Rabies Vaccine (ARV)",
        "name_hi": "रेबीज रोधी टीका (ARV)",
        "category": "vaccine",
        "unit": "vials",
        "mrl": 25,
        "cold": True,
        "critical": True,
    },
    {
        "name": "Oral Rehydration Salts (ORS)",
        "name_hi": "ओरल रिहाइड्रेशन सॉल्ट (ORS)",
        "category": "emergency",
        "unit": "packets",
        "mrl": 300,
        "cold": False,
        "critical": False,
    },
    {
        "name": "Paracetamol 500mg",
        "name_hi": "पैरासिटामोल 500 मि.ग्रा.",
        "category": "analgesic",
        "unit": "tablets",
        "mrl": 800,
        "cold": False,
        "critical": False,
    },
    {
        "name": "Amoxicillin 500mg",
        "name_hi": "एमोक्सिसिलिन 500 मि.ग्रा.",
        "category": "antibiotic",
        "unit": "capsules",
        "mrl": 400,
        "cold": False,
        "critical": False,
    },
    {
        "name": "Azithromycin 500mg",
        "name_hi": "एज़िथ्रोमाइसिन 500 मि.ग्रा.",
        "category": "antibiotic",
        "unit": "tablets",
        "mrl": 250,
        "cold": False,
        "critical": False,
    },
    {
        "name": "Ciprofloxacin 500mg",
        "name_hi": "सिप्रोफ्लोक्सासिन 500 मि.ग्रा.",
        "category": "antibiotic",
        "unit": "tablets",
        "mrl": 300,
        "cold": False,
        "critical": False,
    },
    {
        "name": "Metronidazole 400mg",
        "name_hi": "मेट्रोनिडाजोल 400 मि.ग्रा.",
        "category": "antibiotic",
        "unit": "tablets",
        "mrl": 400,
        "cold": False,
        "critical": False,
    },
    {
        "name": "Ringer Lactate 500ml",
        "name_hi": "रिंगर लैक्टेट 500 मि.ली.",
        "category": "iv_fluid",
        "unit": "bottles",
        "mrl": 120,
        "cold": False,
        "critical": True,
    },
    {
        "name": "Normal Saline 0.9% 500ml",
        "name_hi": "नॉर्मल सलाइन 0.9% 500 मि.ली.",
        "category": "iv_fluid",
        "unit": "bottles",
        "mrl": 150,
        "cold": False,
        "critical": False,
    },
    {
        "name": "Dextrose 5% 500ml",
        "name_hi": "डेक्सट्रोज 5% 500 मि.ली.",
        "category": "iv_fluid",
        "unit": "bottles",
        "mrl": 80,
        "cold": False,
        "critical": False,
    },
    {
        "name": "Oxytocin Injection 5 IU",
        "name_hi": "ऑक्सीटोसिन इंजेक्शन 5 IU",
        "category": "maternal_care",
        "unit": "ampoules",
        "mrl": 50,
        "cold": True,
        "critical": True,
    },
    {
        "name": "Methylergometrine 0.2mg",
        "name_hi": "मिथाइलएर्गोमेट्रिन 0.2 मि.ग्रा.",
        "category": "maternal_care",
        "unit": "ampoules",
        "mrl": 40,
        "cold": True,
        "critical": False,
    },
    {
        "name": "Magnesium Sulphate 50%",
        "name_hi": "मैग्नीशियम सल्फेट 50%",
        "category": "maternal_care",
        "unit": "ampoules",
        "mrl": 30,
        "cold": False,
        "critical": True,
    },
    {
        "name": "Iron Folic Acid (IFA) Large",
        "name_hi": "आयरन फोलिक एसिड (IFA) बड़ी",
        "category": "maternal_care",
        "unit": "tablets",
        "mrl": 1000,
        "cold": False,
        "critical": False,
    },
    {
        "name": "Calcium + Vitamin D3",
        "name_hi": "कैल्शियम + विटामिन D3",
        "category": "maternal_care",
        "unit": "tablets",
        "mrl": 800,
        "cold": False,
        "critical": False,
    },
    {
        "name": "Albendazole 400mg",
        "name_hi": "एल्बेंडाजोल 400 मि.ग्रा.",
        "category": "emergency",
        "unit": "tablets",
        "mrl": 500,
        "cold": False,
        "critical": False,
    },
    {
        "name": "Zinc Sulphate 20mg",
        "name_hi": "जिंक सल्फेट 20 मि.ग्रा.",
        "category": "emergency",
        "unit": "tablets",
        "mrl": 400,
        "cold": False,
        "critical": False,
    },
    {
        "name": "Artesunate Injection 60mg",
        "name_hi": "आर्टेसुनेट इंजेक्शन 60 मि.ग्रा.",
        "category": "emergency",
        "unit": "vials",
        "mrl": 25,
        "cold": False,
        "critical": True,
    },
    {
        "name": "Artemether-Lumefantrine",
        "name_hi": "आर्टेमेथर-लुमेफैंट्रिन",
        "category": "emergency",
        "unit": "strips",
        "mrl": 100,
        "cold": False,
        "critical": False,
    },
    {
        "name": "Chloroquine Phosphate 250mg",
        "name_hi": "क्लोरोक्विन फॉस्फेट 250 मि.ग्रा.",
        "category": "emergency",
        "unit": "tablets",
        "mrl": 350,
        "cold": False,
        "critical": False,
    },
    {
        "name": "Primaquine 7.5mg",
        "name_hi": "प्राइमाक्विन 7.5 मि.ग्रा.",
        "category": "emergency",
        "unit": "tablets",
        "mrl": 200,
        "cold": False,
        "critical": False,
    },
    {
        "name": "Insulin Regular (Human)",
        "name_hi": "इंसुलिन रेगुलर (ह्यूमन)",
        "category": "chronic_ncd",
        "unit": "vials",
        "mrl": 30,
        "cold": True,
        "critical": True,
    },
    {
        "name": "Metformin 500mg",
        "name_hi": "मेटफॉर्मिन 500 मि.ग्रा.",
        "category": "chronic_ncd",
        "unit": "tablets",
        "mrl": 1200,
        "cold": False,
        "critical": False,
    },
    {
        "name": "Glimepiride 1mg",
        "name_hi": "ग्लिमेपिराइड 1 मि.ग्रा.",
        "category": "chronic_ncd",
        "unit": "tablets",
        "mrl": 600,
        "cold": False,
        "critical": False,
    },
    {
        "name": "Amlodipine 5mg",
        "name_hi": "एम्लोडिपिन 5 मि.ग्रा.",
        "category": "chronic_ncd",
        "unit": "tablets",
        "mrl": 1000,
        "cold": False,
        "critical": False,
    },
    {
        "name": "Telmisartan 40mg",
        "name_hi": "टेल्मिसार्टन 40 मि.ग्रा.",
        "category": "chronic_ncd",
        "unit": "tablets",
        "mrl": 800,
        "cold": False,
        "critical": False,
    },
    {
        "name": "Atenolol 50mg",
        "name_hi": "एटेनोलोल 50 मि.ग्रा.",
        "category": "chronic_ncd",
        "unit": "tablets",
        "mrl": 500,
        "cold": False,
        "critical": False,
    },
    {
        "name": "Atorvastatin 10mg",
        "name_hi": "एटोरवास्टेटिन 10 मि.ग्रा.",
        "category": "chronic_ncd",
        "unit": "tablets",
        "mrl": 700,
        "cold": False,
        "critical": False,
    },
    {
        "name": "Salbutamol Inhaler",
        "name_hi": "सालबुटामोल इनहेलर",
        "category": "emergency",
        "unit": "canisters",
        "mrl": 40,
        "cold": False,
        "critical": False,
    },
    {
        "name": "Cetirizine 10mg",
        "name_hi": "सेटिरिजिन 10 मि.ग्रा.",
        "category": "analgesic",
        "unit": "tablets",
        "mrl": 600,
        "cold": False,
        "critical": False,
    },
    {
        "name": "Omeprazole 20mg",
        "name_hi": "ओमेप्राजोल 20 मि.ग्रा.",
        "category": "analgesic",
        "unit": "capsules",
        "mrl": 800,
        "cold": False,
        "critical": False,
    },
    {
        "name": "Pantoprazole 40mg",
        "name_hi": "पेंटोप्राजोल 40 मि.ग्रा.",
        "category": "analgesic",
        "unit": "tablets",
        "mrl": 600,
        "cold": False,
        "critical": False,
    },
    {
        "name": "Diclofenac Sodium 75mg Inj",
        "name_hi": "डाइक्लोफेनाक सोडियम इंजेक्शन",
        "category": "analgesic",
        "unit": "ampoules",
        "mrl": 80,
        "cold": False,
        "critical": False,
    },
    {
        "name": "Tramadol 50mg Inj",
        "name_hi": "ट्रामाडोल 50 मि.ग्रा. इंजेक्शन",
        "category": "analgesic",
        "unit": "ampoules",
        "mrl": 40,
        "cold": False,
        "critical": False,
    },
    {
        "name": "Tetanus Toxoid (TT) / Td",
        "name_hi": "टिटनेस टॉक्साइड (TT/Td टीका)",
        "category": "vaccine",
        "unit": "vials",
        "mrl": 60,
        "cold": True,
        "critical": True,
    },
    {
        "name": "Pentavalent Vaccine",
        "name_hi": "पेंटावेलेंट टीका (DPT-HepB-Hib)",
        "category": "vaccine",
        "unit": "vials",
        "mrl": 50,
        "cold": True,
        "critical": True,
    },
    {
        "name": "BCG Vaccine",
        "name_hi": "बीसीजी टीका (BCG)",
        "category": "vaccine",
        "unit": "vials",
        "mrl": 40,
        "cold": True,
        "critical": True,
    },
    {
        "name": "Measles-Rubella (MR) Vaccine",
        "name_hi": "खसरा-रूबेला टीका (MR)",
        "category": "vaccine",
        "unit": "vials",
        "mrl": 45,
        "cold": True,
        "critical": True,
    },
    {
        "name": "Rotavirus Vaccine",
        "name_hi": "रोटावायरस टीका (Rotavirus)",
        "category": "vaccine",
        "unit": "vials",
        "mrl": 40,
        "cold": True,
        "critical": True,
    },
]


def generate_90_day_history() -> dict[str, list[dict[str, Any]]]:
    """Generate 90 days of synthetic records for 12 centres, 40 medicines with planted anomalies."""
    random.seed(42)  # Deterministic reproduction
    end_date = datetime.strptime("2026-10-18", "%Y-%m-%d")
    start_date = end_date - timedelta(days=89)  # Exactly 90 days

    all_footfall: list[dict[str, Any]] = []
    all_attendance: list[dict[str, Any]] = []
    all_bed_status: list[dict[str, Any]] = []
    all_test_audits: list[dict[str, Any]] = []
    all_inventory: list[dict[str, Any]] = []

    # 1. Generate Inventory for 40 medicines x 12 centres
    for centre in DISTRICT_CENTRES:
        c_id = centre["id"]
        prob = centre["problem_type"]

        for idx, med in enumerate(ESSENTIAL_MEDICINES):
            m_id = f"stock_{c_id}_{idx + 1:03d}"
            mrl = int(str(med["mrl"]))

            # Plant chronic stockouts
            if prob == "chronic_stockout":
                if c_id == "phc_003" and med["name"] in [
                    "Polyvalent Snake Antivenom",
                    "Rabies Vaccine (ARV)",
                    "Oral Rehydration Salts (ORS)",
                    "Ringer Lactate 500ml",
                ]:
                    stock = 0
                elif c_id == "phc_007" and med["name"] in [
                    "Amoxicillin 500mg",
                    "Metformin 500mg",
                    "Paracetamol 500mg",
                    "Normal Saline 0.9% 500ml",
                ]:
                    stock = 0
                elif c_id == "phc_008" and med["name"] in [
                    "Oxytocin Injection 5 IU",
                    "Iron Folic Acid (IFA) Large",
                    "Magnesium Sulphate 50%",
                ]:
                    stock = 0
                else:
                    stock = int(mrl * random.uniform(0.8, 1.6))
            elif centre["facility_type"] == "CHC":
                # CHCs maintain healthy surplus (for rebalancing demo)
                stock = int(mrl * random.uniform(2.5, 4.0))
            else:
                stock = int(mrl * random.uniform(1.2, 2.2))

            exp_days = random.randint(180, 540)
            if idx == 4 and c_id == "phc_005":
                exp_days = 25  # Expiring soon item for demo!

            exp_date = (end_date + timedelta(days=exp_days)).strftime("%Y-%m-%d")

            all_inventory.append(
                {
                    "id": m_id,
                    "centre_id": c_id,
                    "drug_name": med["name"],
                    "drug_name_hi": med["name_hi"],
                    "category": med["category"],
                    "batch_number": f"BATCH-{2026}-B{random.randint(10, 99)}",
                    "unit": med["unit"],
                    "current_stock": stock,
                    "minimum_reorder_level": mrl,
                    "expiry_date": exp_date,
                    "is_cold_chain": med["cold"],
                    "storage_temp_range": "2°C - 8°C" if med["cold"] else None,
                }
            )

    # 2. Generate 90 days time series
    for day_offset in range(90):
        current_day = start_date + timedelta(days=day_offset)
        date_str = current_day.strftime("%Y-%m-%d")
        weekday = current_day.weekday()  # 0=Monday (peak OPD day in India)

        for centre in DISTRICT_CENTRES:
            c_id = centre["id"]
            c_name = centre["name"]
            block = centre["block"]
            prob = centre["problem_type"]
            is_chc = centre["facility_type"] == "CHC"

            # --- (a) Daily Footfall ---
            base_capacity = 300 if is_chc else 100
            if prob == "overloaded" and c_id == "phc_001":
                # Overloaded: 200% - 260% saturation!
                multiplier = random.uniform(2.1, 2.6) if weekday == 0 else random.uniform(1.9, 2.3)
                wait_time = int(random.uniform(48, 65))
            else:
                multiplier = (
                    random.uniform(0.9, 1.25) if weekday == 0 else random.uniform(0.7, 1.05)
                )
                wait_time = int(random.uniform(15, 30))

            total_opd = int(base_capacity * multiplier)
            emergencies = int(total_opd * random.uniform(0.06, 0.12))
            maternal = int(total_opd * random.uniform(0.20, 0.28))
            ncd = int(total_opd * random.uniform(0.18, 0.25))
            saturation = round((total_opd / base_capacity) * 100.0, 1)

            footfall_status = (
                "overcrowded"
                if saturation > 120.0
                else ("high" if saturation >= 90.0 else "normal")
            )

            all_footfall.append(
                {
                    "id": f"footfall_{c_id}_{date_str.replace('-', '')}",
                    "centre_id": c_id,
                    "centre_name": c_name,
                    "block": block,
                    "date": date_str,
                    "total_opd_visits": total_opd,
                    "emergency_visits": emergencies,
                    "maternal_child_visits": maternal,
                    "ncd_visits": ncd,
                    "average_wait_time_minutes": wait_time,
                    "capacity_saturation_percent": saturation,
                    "status": footfall_status,
                }
            )

            # --- (b) Daily Bed Status ---
            infra = centre.get("infrastructure", {})  # type: ignore[union-attr]
            total_beds = int(infra.get("beds_total", 6)) if isinstance(infra, dict) else 6
            if prob == "overloaded" and c_id == "phc_001":
                # Beds overflowing (100% - 125% saturation)
                occupied = min(
                    total_beds + 2, max(total_beds, int(total_beds * random.uniform(1.0, 1.25)))
                )
            elif is_chc:
                occupied = int(total_beds * random.uniform(0.60, 0.85))
            else:
                occupied = int(total_beds * random.uniform(0.40, 0.70))

            bed_occ_pct = round((occupied / total_beds) * 100.0, 1) if total_beds > 0 else 0.0

            all_bed_status.append(
                {
                    "id": f"bed_{c_id}_{date_str.replace('-', '')}",
                    "centre_id": c_id,
                    "date": date_str,
                    "total": total_beds,
                    "occupied": occupied,
                    "available": max(0, total_beds - occupied),
                    "occupancy_percent": bed_occ_pct,
                }
            )

            # --- (c) Doctor Attendance ---
            sanctioned_docs = 4 if is_chc else 2
            doc_entries = []

            if prob == "high_doctor_absence":
                # High absence: only 1 present or 0 present!
                # 60% - 75% absence rate over 90 days
                doctors_present = 0 if (weekday in [0, 4] and random.random() < 0.6) else 1
            else:
                # Normal high attendance (90-100%)
                doctors_present = (
                    sanctioned_docs if random.random() < 0.85 else (sanctioned_docs - 1)
                )

            for d_idx in range(sanctioned_docs):
                is_pres = d_idx < doctors_present
                status = (
                    "present"
                    if is_pres
                    else ("on_leave" if random.random() < 0.3 else "unnotified_absent")
                )
                check_in = (
                    f"0{random.randint(8, 9)}:{random.randint(10, 59):02d}:00" if is_pres else None
                )

                doc_entries.append(
                    {
                        "doctor_id": f"doc_{c_id}_{d_idx + 1}",
                        "name": f"Dr. Staff Physician {d_idx + 1}",
                        "designation": "Medical Officer",
                        "shift": "morning" if d_idx == 0 else "evening",
                        "status": status,
                        "check_in_time": check_in,
                    }
                )

            abs_rate = round(
                max(0.0, ((sanctioned_docs - doctors_present) / sanctioned_docs) * 100.0), 1
            )

            all_attendance.append(
                {
                    "id": f"att_{c_id}_{date_str.replace('-', '')}",
                    "centre_id": c_id,
                    "centre_name": c_name,
                    "block": block,
                    "date": date_str,
                    "doctors": doc_entries,
                    "doctors_sanctioned": sanctioned_docs,
                    "doctors_present_today": doctors_present,
                    "absence_rate_percent": abs_rate,
                }
            )

            # --- (d) Diagnostic Test Availability Audits ---
            if day_offset % 7 == 0 or day_offset == 89:  # Weekly audits or latest
                test_entries = [
                    {
                        "test_name": "Dengue NS1 Antigen RDT",
                        "category": "communicable",
                        "status": "available",
                        "kits_remaining": random.randint(20, 80),
                        "equipment_functional": True,
                    },
                    {
                        "test_name": "Malaria Rapid Diagnostic Test (RDT)",
                        "category": "communicable",
                        "status": "available",
                        "kits_remaining": random.randint(30, 90),
                        "equipment_functional": True,
                    },
                    {
                        "test_name": "Complete Blood Count (CBC)",
                        "category": "haematology",
                        "status": "available",
                        "kits_remaining": random.randint(25, 100),
                        "equipment_functional": True,
                    },
                    {
                        "test_name": "Blood Glucose (Glucometer)",
                        "category": "biochemistry",
                        "status": "available",
                        "kits_remaining": random.randint(50, 200),
                        "equipment_functional": True,
                    },
                    {
                        "test_name": "Urine Albumin / Pregnancy Test (UPT)",
                        "category": "maternal",
                        "status": "available",
                        "kits_remaining": random.randint(40, 120),
                        "equipment_functional": True,
                    },
                ]

                # Plant diagnostic downtime in chronic stockout centre
                if prob == "chronic_stockout" and c_id == "phc_003":
                    test_entries[0]["status"] = "low_reagent"
                    test_entries[0]["kits_remaining"] = 3
                    test_entries[2]["status"] = "equipment_down"
                    test_entries[2]["equipment_functional"] = False

                avail_count = sum(
                    1
                    for t in test_entries
                    if t["status"] == "available" and t["equipment_functional"]
                )
                total_t = len(test_entries)
                avail_pct = round((avail_count / total_t) * 100.0, 1)

                all_test_audits.append(
                    {
                        "id": f"lab_{c_id}_{date_str.replace('-', '')}",
                        "centre_id": c_id,
                        "centre_name": c_name,
                        "block": block,
                        "audit_date": date_str,
                        "tests": test_entries,
                        "total_audited_tests": total_t,
                        "available_tests": avail_count,
                        "availability_rate_percent": avail_pct,
                    }
                )

    return {
        "centres": DISTRICT_CENTRES,
        "inventory": all_inventory,
        "footfall": all_footfall,
        "attendance": all_attendance,
        "beds": all_bed_status,
        "test_audits": all_test_audits,
    }
