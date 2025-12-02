#!/bin/bash
# Mirror CI execution locally for debugging
# Usage: ./scripts/ci-local.sh

set -e

echo "=========================================="
echo "   HYVVE Local CI Pipeline"
echo "=========================================="
echo ""

# Lint
echo "[1/4] Running linter..."
pnpm turbo lint || { echo "Lint failed"; exit 1; }
echo "Lint passed"
echo ""

# Build
echo "[2/4] Building packages..."
pnpm turbo build || { echo "Build failed"; exit 1; }
echo "Build passed"
echo ""

# Tests
echo "[3/4] Running E2E tests..."
pnpm --filter @hyvve/web test:e2e || { echo "Tests failed"; exit 1; }
echo "Tests passed"
echo ""

# Burn-in (reduced iterations for local)
echo "[4/4] Running burn-in (3 iterations)..."
for i in {1..3}; do
  echo "----------------------------------------"
  echo "Burn-in iteration $i/3"
  echo "----------------------------------------"
  pnpm --filter @hyvve/web test:e2e || { echo "Burn-in failed at iteration $i"; exit 1; }
done
echo "Burn-in passed"
echo ""

echo "=========================================="
echo "   Local CI Pipeline PASSED"
echo "=========================================="
