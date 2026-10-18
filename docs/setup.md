# SmartHealth Local Setup & Deployment Guide

## Prerequisites
- Python 3.12+ (or 3.14)
- Node.js v20+ / npm v10+
- Docker (optional for containerized deployment)

## 1. Local Backend Setup

```bash
# 1. Create and activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 3. Copy environment configuration
cp .env.example .env

# 4. Start the FastAPI development server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive OpenAPI documentation is available at: `http://localhost:8000/docs`.

## 2. Local Frontend Setup (React + Vite + TypeScript)

```bash
cd frontend
npm install
npm run dev
```

The frontend development server runs on `http://localhost:5173`.

## 3. Running Test Suite

```bash
# Run all tests with coverage analysis
PYTHONPATH=. pytest --cov=backend/app --cov-report=term-missing --cov-fail-under=80

# Check code linting and formatting
ruff check backend/
ruff format --check backend/
```

## 4. Docker Container Build & Run

```bash
docker build -t smarthealth:latest .
docker run -p 8000:8000 -e USE_MOCK_DB=true smarthealth:latest
```
