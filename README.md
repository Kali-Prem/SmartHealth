# SmartHealth (स्मार्टहेल्थ)
### Multilingual AI Health Command Platform for District Administrators & PHC/CHC Networks in India

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19_TypeScript-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Python](https://img.shields.io/badge/Python-3.12_%7C_3.14-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![Google Cloud](https://img.shields.io/badge/Google_Cloud-Firestore_%26_Run-4285F4?style=flat&logo=googlecloud&logoColor=white)](https://cloud.google.com)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75C2?style=flat&logo=googlegemini&logoColor=white)](https://ai.google.dev)
[![Coverage](https://img.shields.io/badge/Pytest_Coverage-93%25-brightgreen?style=flat&logo=pytest&logoColor=white)](https://pytest.org)
[![Accessibility](https://img.shields.io/badge/WCAG-2.1_AA_Compliant-blue?style=flat)](https://www.w3.org/WAI/WCAG21/AA)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat)](LICENSE)

---

## 📌 Executive Summary & Hackathon Pitch

In India's public health delivery network, **Primary Health Centres (PHCs)** and **Community Health Centres (CHCs)** form the backbone of rural and peri-urban healthcare. However, district health administrators (Chief Medical Officers, District Health Officers) face severe operational blind spots:

1. **Catastrophic Stockouts**: Tribal and rural PHCs frequently run out of life-saving medicines (e.g. Polyvalent Snake Antivenom, Rabies Vaccines, ORS) while neighboring facilities hold excess stock.
2. **Unmanaged Patient Footfall Surges**: Urban and peri-urban PHCs face up to **221% patient overcrowding** with 56+ minute wait times, causing systemic collapse.
3. **Chronic Doctor Absenteeism**: Remote facilities experience up to **58% unnotified physician absences**, leaving emergency casualty shifts completely unmanned.
4. **Slow Administrative Reaction**: Inter-facility transfers and staff deputations take days of paperwork because there is no unified GIS-enabled platform.

**SmartHealth** solves this by providing a unified, bilingual (**English & Devanagari Hindi**), voice-enabled District Health Command Center. It couples **pure mathematical algorithms (Haversine formula, C-SUM burn-rates, capacity saturation vectors)** with **Google Gemini 2.5 Flash** for qualitative clinical justification and district-wide resource redistribution.

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    subgraph UI ["Accessible Multilingual Client (React 19 + TypeScript + Vite)"]
        H[Header: Lang Switcher, High Contrast, Voice Mic]
        NAV[Tab Navigation: Dashboard | District Map | Facilities | Inventory | Forecast | Operations | Copilot]
        MAP[Google Maps JS Engine: 12 Color-Coded Facility Pins & Drawers]
        REBAL[Lateral Rebalance Modal & Doctor Deputation Assistant]
        VOICE[Web Speech API: en-IN & hi-IN Speech Recognition]
    end

    subgraph BackendGateway ["FastAPI Backend (Security & Performance Layer)"]
        SEC[Security Headers: CSP, HSTS, X-Frame-Options]
        RL[Sliding-Window Rate Limiter: 120 req/min]
        AUTH[JWT Role-Based Access: district_admin & centre_staff]
        PYD[Pydantic v2 Schema Validation & Redaction Engine]
    end

    subgraph Algorithms ["Classical Computational Layer (Zero API Cost)"]
        HAV[Haversine Great-Circle Distance Engine (R=6371km)]
        BURN[Daily Burn-Rate & Days-to-Zero Stockout Radar]
        DEP[Staff Deputation Matcher with Donor Safety Buffers]
        CVI[Composite Vulnerability Index (CVI) Multi-Factor Scorer]
    end

    subgraph AI ["Google Gemini 2.5 Flash Layer (Context-Grounded)"]
        GEM_EXP[Clinical & Logistical Redistribution Justifications]
        GEM_ADV[District Epidemiological Advisories & Seasonal Outbreak Guidance]
        GEM_COP[District AI Health Copilot with Telemetry Grounding]
        CACHE[TTLCache (1-Hour In-Memory Result Caching)]
    end

    subgraph Storage ["Cloud & Data Persistence Layer"]
        FS[Google Cloud Firestore / High-Speed Mock In-Memory DB]
        GSM[Google Cloud Secret Manager]
        RUN[Google Cloud Run Container (asia-south1)]
    end

    UI -->|HTTPS / REST + JWT| BackendGateway
    BackendGateway --> Algorithms
    Algorithms --> AI
    BackendGateway --> Storage
    AI --> Storage
```

---

## 🚀 Key Innovations

### 1. Zero-Cost Spatial Redistribution Optimizer (Haversine Formula)
Instead of paying for expensive external routing APIs, SmartHealth calculates great-circle spherical distances using the pure **Haversine formula**:
$$d = 2R \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)} \right)$$
- Identifies the nearest donor facility with sufficient safety surplus ($Stock - Quantity \ge ReorderLevel$).
- Gemini 2.5 Flash adds bilingual clinical justifications (transit corridors like SH-54, temperature sensitivity, retained donor buffer).

### 2. Early Stockout Countdown Radar & Burn-Rate Forecasting
- Computes daily burn rates: $\max(1.0, MRL / 10.0)$.
- Categorizes inventory into:
  - 🚨 **Immediate (< 3 days)**: Instant lateral transfer order.
  - ⚠️ **Imminent (< 7 days)**: Cluster advance indent.
  - 📋 **Warning (< 14 days)**: State Medical Corporation (MSMSCL) bulk indent.
- Gemini provides epidemiology advisories for monsoon snakebite surges, seasonal vector-borne diseases, and pediatric gastroenteritis.

### 3. Smart Doctor Deputation Assistant
- Automatically audits attendance registers and triggers alerts when absenteeism exceeds **40%**.
- Identifies nearest CHC facilities with on-duty physician surpluses ($\ge 2$ remaining on duty, $\le 25\%$ donor absence).
- Issues atomic cross-deputation orders with unique audit IDs.

### 4. Multilingual Web Speech API Voice Input
- Built-in speech-to-text in **English (`en-IN`)** and **Hindi (`hi-IN`)**.
- Visual pulse indicator, error recovery, and hands-free interaction for busy Medical Officers in the field.

### 5. WCAG 2.1 AA Certified Accessibility
- High Contrast mode toggle (`[data-contrast="high"]`) with stark black/yellow borders for visually impaired staff.
- ARIA landmarks, screen reader announceable live regions, focus indicators, and touch targets exceeding $44 \times 44\text{px}$.

---

## 🎯 The 6 Planted Problems Demo (Walkthrough for Judges)

The synthetic data generator seeds **1 district (Pune), 12 health centres, 40 medicines, and 90 days of telemetry** with 6 intentionally planted real-world operational deficits. Here is how judges can verify them:

| # | Facility Name | Type | Block | Planted Problem | Demo Action & Result |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **1** | **Ghogargaon PHC (Tribal)** | PHC | Ambegaon | **0 Polyvalent Snake Antivenom** vials (Critical Tribal Stockout) | Click **"Lateral Stock Rebalance"** $\to$ Auto-selects Chakan CHC (18.4 km) $\to$ Dispatches 15 vials via SH-54 corridor with Gemini justification. |
| **2** | **Alandi PHC** | PHC | Khed | **Chronic Antibiotic Depletion** (Amoxicillin, Azithromycin, Metformin at 0) | Early Stockout Radar flags 0-day countdown $\to$ Triggers cluster buffer rebalance. |
| **3** | **Manchar PHC** | PHC | Ambegaon | **Zero Oxytocin & IFA** (Maternal Health Deficit) | Flagged in Maternal Health & Early Warnings with emergency indent suggestion. |
| **4** | **Narayangaon PHC** | PHC | Junnar | **58.3% Doctor Absenteeism** (Casualty shift unstaffed) | Click **"Depute"** in Operations $\to$ Auto-selects Dr. Ajay More from Junnar CHC (14.8 km) $\to$ Generates Deputation Order. |
| **5** | **Shikrapur PHC** | PHC | Shirur | **57.8% Doctor Absenteeism** | Flagged in Absenteeism Deficits $\to$ Cross-deputation from Shirur Rural CHC (12.2 km). |
| **6** | **Wagholi PHC (Peri-Urban)** | PHC | Haveli | **221% OPD Overload** (Capacity exceeded, 56 min wait time, 112.5% beds) | Flagged as Critical Overload $\to$ Recommends patient triaging and ambulatory diversion to Loni Kand sub-center. |

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/readyz` | System readiness & Firestore connection status |
| `GET` | `/healthz` | Container liveness probe |
| `GET` | `/api/v1/centres` | List all 12 PHC/CHC facilities with coordinates & telemetry |
| `GET` | `/api/v1/centres/{id}` | Detailed facility profile, bed capacity, staffing |
| `GET` | `/api/v1/inventory` | Medicine stock list with search & category filters |
| `POST` | `/api/v1/inventory/rebalance/optimize` | Haversine distance-ranked redistribution recommendations |
| `POST` | `/api/v1/inventory/rebalance/execute` | Atomically execute and log an inter-facility transfer |
| `GET` | `/api/v1/inventory/early-warnings` | Stockout countdown radar, burn rates & Gemini advisory |
| `GET` | `/api/v1/inventory/forecast` | 30-day forward demand projections & advance indents |
| `GET` | `/api/v1/operations/summary` | District-wide KPI scorecard & top vulnerable facilities |
| `GET` | `/api/v1/operations/footfall/{id}` | 90-day daily footfall, casualty, wait time telemetry |
| `GET` | `/api/v1/operations/attendance/{id}` | Doctor roster attendance punch records & absence rates |
| `GET` | `/api/v1/operations/tests/{id}` | Diagnostic test availability & lab kit stock |
| `GET` | `/api/v1/operations/deputation/recommendations` | Haversine staff shortage matcher for acute absenteeism |
| `POST` | `/api/v1/operations/deputation/execute` | Issue and persist temporary physician deputation order |
| `POST` | `/api/v1/ai/copilot` | Context-grounded Gemini conversational query endpoint |

Interactive Swagger documentation is available at: `http://localhost:8000/docs`.

---

## 🧪 Testing & Code Quality Metrics

```bash
# Run complete automated verification script:
./scripts/verify_project.sh
```

### Verified Test Results
- **Backend Tests (Pytest)**: **69 / 69 Passed (100%)**
- **Test Coverage**: **93% Total Coverage** (exceeds non-negotiable 80% rule)
- **Frontend Tests (Vitest)**: **26 / 26 Passed (100%)**
- **WCAG 2.1 AA Accessibility Audit**: **100% Passed (4/4 Suites)**
- **TypeScript Build**: `tsc -b && vite build` $\to$ **0 Errors**
- **Frontend Linting (ESLint)**: `eslint .` $\to$ **0 Errors, 0 Warnings**
- **Python Linting (Ruff)**: **39 / 39 Files Formatted & Linted (0 Errors)**

---

## 💻 Local Setup & Execution Guide

### Prerequisites
- Python 3.12+ (or 3.14)
- Node.js v20+ / npm v10+
- (Optional) Docker

### 1. Run with Docker (Fastest - 1 Command)
```bash
docker build -t smarthealth:latest .
docker run -p 8000:8000 -e USE_MOCK_DB=true smarthealth:latest
```
Visit `http://localhost:8000` for the complete application (FastAPI serves both backend API and the built React frontend).

### 2. Manual Development Setup

#### Backend Setup:
```bash
# 1. Virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. Dependencies
pip install -r requirements.txt

# 3. Start development server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend Setup:
```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 3000
```
Open `http://localhost:3000` in your browser.

---

## ☁️ Google Cloud Deployment (Cloud Run)

The repository includes a ready-to-use [`cloudbuild.yaml`](cloudbuild.yaml) for automated container compilation and deployment to Google Cloud Run:

```bash
# Deploy to Google Cloud Run (Mumbai Region: asia-south1)
gcloud builds submit --config=cloudbuild.yaml .
```

---

## ⚠️ Known Limitations & Architectural Trade-offs

1. **In-Memory Rate Limiter (Single-Instance Assumption)**:
   - **Current Implementation**: The FastAPI rate-limiting middleware (`backend/app/middleware/rate_limiter.py`) tracks client IP request buckets in local process memory using a sliding window.
   - **Trade-off & Constraint**: In-memory state assumes a **single-instance deployment**. If multiple container replicas run concurrently behind a load balancer, each instance maintains independent counters, effectively multiplying the allowed request quota.
   - **Mitigation in Cloud Run**: The deployment configuration in [`cloudbuild.yaml`](cloudbuild.yaml) explicitly sets `--max-instances=1` to guarantee consistent enforcement across all incoming traffic.
   - **Production Roadmap**: For high-concurrency horizontal scaling, replace the in-memory dictionary with a distributed store such as **Google Cloud Memorystore for Redis** or a sliding-window token bucket in Firestore.

2. **Web Speech API Browser Dependence**:
   - **Current Implementation**: Real-time voice interaction in the Gemini Health Assistant utilizes the browser-native W3C Web Speech API (`webkitSpeechRecognition` / `SpeechRecognition`).
   - **Trade-off & Constraint**: Browser support varies. While Google Chrome, Microsoft Edge, and Safari have native support, other browsers (such as Mozilla Firefox on specific platforms or older mobile browsers) lack full Web Speech API coverage.
   - **Resilience & Graceful Fallback**: The frontend performs feature detection on mount; if speech recognition is unavailable, the microphone trigger displays an informative fallback tooltip and prompts the user to use the text input or one-click preset prompts.
   - **Production Roadmap**: Implement server-side streaming audio transcription using the **Google Cloud Speech-to-Text API (v2)** over WebSockets for 100% universal browser and device compatibility.

---

## 👥 Contributors & Hackathon Team
- **Built for**: Google Cloud / Gemini AI Hackathon
- **Architecture**: Domain-Driven Design (FastAPI + React 19 + TypeScript + Google Gemini + Cloud Firestore)
- **Author**: Antigravity Pair-Programming Team

