# SmartHealth Architecture Documentation

## Overview
SmartHealth is a multilingual, accessible AI platform for District Health Administrators (Chief Medical Officers, DHOs) and Primary / Community Health Centre (PHC/CHC) Medical Officers in India.

## High-Level Architecture

```
                  ┌───────────────────────────────────────────────┐
                  │   Accessible Frontend (React + Vite + TS)     │
                  │   - WCAG 2.1 AA, High Contrast, Screen Reader │
                  │   - Web Speech API (Voice in English & Hindi) │
                  │   - i18n Translation Engine (Devanagari/En)   │
                  └───────────────────────┬───────────────────────┘
                                          │ HTTPS / REST (JWT Bearer)
                                          ▼
                  ┌───────────────────────────────────────────────┐
                  │          FastAPI Backend Gateway              │
                  │   - Security Headers (CSP, HSTS, X-Frame)     │
                  │   - Sliding-Window Rate Limiter               │
                  │   - Role-Based Access Control (Admin / Staff) │
                  │   - Pydantic v2 Input Validation & Redaction  │
                  └───────────────┬───────────────────────────────┘
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│     Classical Algorithms        │       │       Google Gemini AI          │
│ - Days-of-Supply (Burn Rate)    │       │ - Context-Grounded District     │
│ - Distance-Constrained Matching │       │   Copilot (Live Telemetry)      │
│ - C-SUM / Z-Score Epidemics     │       │ - Bilingual Outbreak Advisories │
│ - Composite Vulnerability Index │       │ - Epidemiological Rationale     │
│ - Bcrypt + HMAC-SHA256          │       │ - TTLCache (1-hour TTL)         │
└────────────────┬────────────────┘       └────────────────┬────────────────┘
                 │                                         │
                 └────────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌───────────────────────────────────────────────┐
                  │             Data & Cloud Layer                │
                  │ - Google Cloud Firestore (Async + In-Memory)  │
                  │ - Google Cloud Secret Manager                 │
                  │ - Google Cloud Run (Container Deployment)     │
                  └───────────────────────────────────────────────┘
```

## Repository Pattern
To maintain clean separation of concerns and allow seamless swapping between live Cloud Firestore and testing/mock stores, SmartHealth implements a strict **Repository Pattern**:
- `CentreRepository`: Facility profiles, bed capacity, staffing.
- `MedicineStockRepository`: Drug inventory, batches, expiry dates, lateral rebalancing.
- `DailyFootfallRepository`: Outpatient traffic, overcrowding saturation.
- `BedStatusRepository`: Real-time bed occupancy, maternity/emergency bed availability.
- `DoctorAttendanceRepository`: Daily shift roster, biometric punches, absenteeism rates.
- `TestAvailabilityRepository`: Diagnostic test kit readiness and equipment uptime.
