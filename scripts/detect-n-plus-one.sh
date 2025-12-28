#!/bin/bash
#
# N+1 Query Detection Script
# ===========================
# This script detects potential N+1 query patterns in the codebase.
# Run as part of CI to catch these issues before merge.
#
# Patterns detected:
# 1. Prisma/database calls inside for/while loops
# 2. await inside map/forEach without Promise.all
# 3. Sequential queries in loops
#
# Usage: ./scripts/detect-n-plus-one.sh [path]
# Exit code: 0 if no issues, 1 if potential N+1 patterns found

set -e

TARGET_PATH="${1:-apps/api/src}"
FOUND_ISSUES=0

echo "=========================================="
echo "N+1 Query Detection"
echo "=========================================="
echo "Scanning: $TARGET_PATH"
echo ""

# Pattern 1: prisma calls inside for loops
echo "Checking for Prisma calls inside for loops..."
PATTERN1=$(grep -rn --include="*.ts" -E "for\s*\([^)]+\)\s*\{[^}]*prisma\." "$TARGET_PATH" 2>/dev/null || true)
if [ -n "$PATTERN1" ]; then
    echo "WARNING: Potential N+1 - Prisma call inside for loop:"
    echo "$PATTERN1"
    echo ""
    FOUND_ISSUES=1
fi

# Pattern 2: prisma calls inside while loops
echo "Checking for Prisma calls inside while loops..."
PATTERN2=$(grep -rn --include="*.ts" -E "while\s*\([^)]+\)\s*\{[^}]*prisma\." "$TARGET_PATH" 2>/dev/null || true)
if [ -n "$PATTERN2" ]; then
    echo "WARNING: Potential N+1 - Prisma call inside while loop:"
    echo "$PATTERN2"
    echo ""
    FOUND_ISSUES=1
fi

# Pattern 3: await inside .map() without Promise.all (potential sequential queries)
echo "Checking for await inside .map() without Promise.all..."
PATTERN3=$(grep -rn --include="*.ts" -E "\.map\s*\(\s*async" "$TARGET_PATH" 2>/dev/null | grep -v "Promise.all" || true)
if [ -n "$PATTERN3" ]; then
    echo "INFO: async .map() found - verify Promise.all wrapper exists:"
    echo "$PATTERN3"
    echo "(This is only a problem if queries run sequentially without Promise.all)"
    echo ""
fi

# Pattern 4: forEach with await (always sequential, potential N+1)
echo "Checking for await inside .forEach()..."
PATTERN4=$(grep -rn --include="*.ts" -E "\.forEach\s*\(\s*async" "$TARGET_PATH" 2>/dev/null || true)
if [ -n "$PATTERN4" ]; then
    echo "WARNING: async .forEach() detected - forEach doesn't wait for promises:"
    echo "$PATTERN4"
    echo "(Use for...of or Promise.all with .map() instead)"
    echo ""
    FOUND_ISSUES=1
fi

# Pattern 5: Multiple queries in sequence pattern (heuristic)
echo "Checking for potential query sequences in loops..."
PATTERN5=$(grep -rn --include="*.ts" -B2 -A2 "for.*of\|for.*in" "$TARGET_PATH" 2>/dev/null | grep -E "await.*prisma\.|await.*findMany|await.*findFirst|await.*findUnique" || true)
if [ -n "$PATTERN5" ]; then
    echo "INFO: Queries found near for...of loops - review for N+1 patterns:"
    echo "$PATTERN5"
    echo ""
fi

# Pattern 6: Prisma include with nested relations (can cause cartesian explosion)
echo "Checking for deep nested Prisma includes..."
PATTERN6=$(grep -rn --include="*.ts" -E "include:\s*\{[^}]*include:\s*\{[^}]*include:" "$TARGET_PATH" 2>/dev/null || true)
if [ -n "$PATTERN6" ]; then
    echo "INFO: Triple-nested Prisma includes detected - verify query performance:"
    echo "$PATTERN6"
    echo ""
fi

echo "=========================================="
if [ $FOUND_ISSUES -eq 1 ]; then
    echo "RESULT: Potential N+1 patterns detected!"
    echo "Review the warnings above and refactor if necessary."
    echo ""
    echo "Common fixes:"
    echo "1. Use batch queries: prisma.findMany({ where: { id: { in: ids } } })"
    echo "2. Use Promise.all with .map() for parallel execution"
    echo "3. Pre-fetch data before loops and use in-memory lookups"
    echo "=========================================="
    exit 1
else
    echo "RESULT: No obvious N+1 patterns detected."
    echo "=========================================="
    exit 0
fi
