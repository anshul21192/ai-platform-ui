#!/usr/bin/env bash
set -euo pipefail

detect_compose() {
  # Prefer podman over docker
  for bin in podman docker; do
    if command -v "$bin" &> /dev/null; then
      echo "$bin compose"
      return
    fi
    # Windows: check for .exe suffix
    if command -v "${bin}.exe" &> /dev/null; then
      echo "${bin}.exe compose"
      return
    fi
  done

  # Fallback to standalone compose binaries
  for bin in podman-compose docker-compose; do
    if command -v "$bin" &> /dev/null; then
      echo "$bin"
      return
    fi
  done

  echo ""
}

COMPOSE_CMD=$(detect_compose)

if [ -z "$COMPOSE_CMD" ]; then
  echo "Error: Neither podman nor docker found in PATH"
  exit 1
fi

echo "Using: $COMPOSE_CMD"
echo "Building all services..."

$COMPOSE_CMD build
