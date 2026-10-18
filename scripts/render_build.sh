#!/usr/bin/env bash
# ==============================================================================
# SmartHealth: Render Native Build Script
# ==============================================================================
set -e

echo "--> [1/2] Installing backend Python requirements..."
pip install --upgrade pip
pip install -r requirements.txt

echo "--> [2/2] Building production React frontend..."
cd frontend
npm ci || npm install
npm run build
cd ..

echo "--> ✓ Render build completed successfully!"
