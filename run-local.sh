#!/usr/bin/env bash
set -euo pipefail

echo "============================================="
echo "  Starting AI Platform Real-Time Fraud Hub   "
echo "============================================="

# Ensure backend python virtual environment exists and is populated
if [ ! -d "backend/venv" ]; then
  echo "Setting up Python virtual environment..."
  python3 -m venv backend/venv
  echo "Installing Python dependencies..."
  backend/venv/bin/pip install -r backend/requirements.txt
fi

# Ensure frontends dependencies are installed
echo "Installing pnpm dependencies..."
pnpm install

# Start development environment
echo "Starting frontend, admin dashboard, and backend..."
pnpm dev