#!/bin/bash
# Standalone burn-in execution for flaky test detection
# Usage: ./scripts/burn-in.sh [iterations]
#
# Examples:
#   ./scripts/burn-in.sh        # Default 10 iterations
#   ./scripts/burn-in.sh 5      # 5 iterations for quick check
#   ./scripts/burn-in.sh 100    # 100 iterations for high confidence

set -e

ITERATIONS=${1:-10}

echo "=========================================="
echo "   HYVVE Burn-In Loop"
echo "   Iterations: $ITERATIONS"
echo "=========================================="
echo ""

for i in $(seq 1 $ITERATIONS); do
  echo "----------------------------------------"
  echo "Burn-in iteration $i/$ITERATIONS"
  echo "----------------------------------------"
  pnpm --filter @hyvve/web test:e2e || {
    echo ""
    echo "=========================================="
    echo "   FLAKY TEST DETECTED"
    echo "   Failed at iteration: $i/$ITERATIONS"
    echo "=========================================="
    echo ""
    echo "Review test-results/ for failure artifacts"
    exit 1
  }
done

echo ""
echo "=========================================="
echo "   Burn-In PASSED"
echo "   $ITERATIONS iterations with no failures"
echo "=========================================="
