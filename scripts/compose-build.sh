#!/usr/bin/env bash
set -euo pipefail

# Detect container runtime: prefer podman, fall back to docker
if command -v podman &> /dev/null; then
  COMPOSE_CMD="podman compose"
elif command -v docker &> /dev/null; then
  COMPOSE_CMD="docker compose"
else
  echo "Error: Neither podman nor docker found in PATH"
  exit 1
fi

echo "Using: $COMPOSE_CMD"
echo "Building all services..."

$COMPOSE_CMD build
