#!/usr/bin/env bash
#
# HYVVE Platform Load Test Runner
#
# Runs k6 load tests for the HYVVE platform.
# Supports individual test or full suite execution.
#
# Usage:
#   ./run-load-tests.sh [OPTIONS] [TEST_TYPE]
#
# Test Types:
#   a2a       - A2A protocol endpoints (discovery, RPC)
#   dashboard - Dashboard user flow simulation
#   ccr       - CCR routing and quota checks
#   all       - Run all tests sequentially (default)
#
# Options:
#   -e, --env        Environment (development, staging, production)
#   -u, --base-url   Base URL for AgentOS (default: http://localhost:7777)
#   -w, --web-url    Base URL for Web app (default: http://localhost:3000)
#   -c, --ccr-url    Base URL for CCR (default: http://localhost:3456)
#   -t, --token      Authentication token for protected endpoints
#   -o, --output     Output directory for results (default: tests/load/results)
#   -v, --vus        Override virtual users count
#   -d, --duration   Override test duration (e.g., "1m", "5m")
#   --dry-run        Print commands without executing
#   -h, --help       Show this help message
#
# Examples:
#   ./run-load-tests.sh a2a
#   ./run-load-tests.sh --env staging dashboard
#   ./run-load-tests.sh --base-url http://staging:7777 all
#   ./run-load-tests.sh --vus 100 --duration 5m a2a
#
# @see docs/modules/bm-dm/stories/dm-09-6-load-testing-infrastructure.md
#

set -euo pipefail

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
LOAD_TEST_DIR="${PROJECT_ROOT}/tests/load"
K6_DIR="${LOAD_TEST_DIR}/k6"
RESULTS_DIR="${LOAD_TEST_DIR}/results"

# Default configuration
ENVIRONMENT="development"
BASE_URL="http://localhost:7777"
WEB_URL="http://localhost:3000"
CCR_URL="http://localhost:3456"
AUTH_TOKEN=""
WORKSPACE_ID="load-test-workspace"
VUS_OVERRIDE=""
DURATION_OVERRIDE=""
DRY_RUN=false
TEST_TYPE="all"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# HELPER FUNCTIONS
# ============================================

print_header() {
    echo ""
    echo -e "${BLUE}======================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}======================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

show_help() {
    cat << EOF
HYVVE Platform Load Test Runner

Usage:
    $(basename "$0") [OPTIONS] [TEST_TYPE]

Test Types:
    a2a         A2A protocol endpoints (discovery, RPC)
    dashboard   Dashboard user flow simulation
    ccr         CCR routing and quota checks
    all         Run all tests sequentially (default)

Options:
    -e, --env        Environment (development, staging, production)
    -u, --base-url   Base URL for AgentOS (default: http://localhost:7777)
    -w, --web-url    Base URL for Web app (default: http://localhost:3000)
    -c, --ccr-url    Base URL for CCR (default: http://localhost:3456)
    -t, --token      Authentication token for protected endpoints
    -o, --output     Output directory for results (default: tests/load/results)
    -v, --vus        Override virtual users count
    -d, --duration   Override test duration (e.g., "1m", "5m")
    --dry-run        Print commands without executing
    -h, --help       Show this help message

Examples:
    $(basename "$0") a2a
    $(basename "$0") --env staging dashboard
    $(basename "$0") --base-url http://staging:7777 all
    $(basename "$0") --vus 100 --duration 5m a2a

EOF
}

check_k6_installed() {
    if ! command -v k6 &> /dev/null; then
        print_error "k6 is not installed."
        echo ""
        echo "Install k6:"
        echo "  macOS:   brew install k6"
        echo "  Linux:   sudo apt-get install k6"
        echo "  Docker:  docker pull grafana/k6"
        echo ""
        echo "See: https://k6.io/docs/get-started/installation/"
        exit 1
    fi
    print_success "k6 is installed: $(k6 version)"
}

check_target_health() {
    local url="$1/health"
    print_info "Checking target health: $url"

    if command -v curl &> /dev/null; then
        if curl -s --fail --connect-timeout 5 "$url" > /dev/null 2>&1; then
            print_success "Target is healthy: $1"
            return 0
        else
            print_warning "Target health check failed: $url"
            return 1
        fi
    else
        print_warning "curl not available, skipping health check"
        return 0
    fi
}

ensure_results_dir() {
    if [[ ! -d "$RESULTS_DIR" ]]; then
        print_info "Creating results directory: $RESULTS_DIR"
        mkdir -p "$RESULTS_DIR"
    fi
}

# ============================================
# TEST EXECUTION
# ============================================

run_k6_test() {
    local test_name="$1"
    local test_file="$2"
    local timestamp
    timestamp=$(date +%Y%m%d-%H%M%S)

    print_header "Running: $test_name"

    # Build k6 command using arrays (safe from injection)
    local -a k6_args=("run")

    # Environment variables (passed as env vars, not command line for sensitive data)
    k6_args+=("-e" "BASE_URL=${BASE_URL}")
    k6_args+=("-e" "WEB_URL=${WEB_URL}")
    k6_args+=("-e" "CCR_URL=${CCR_URL}")
    k6_args+=("-e" "ENVIRONMENT=${ENVIRONMENT}")
    k6_args+=("-e" "WORKSPACE_ID=${WORKSPACE_ID}")

    # Override options if provided
    if [[ -n "$VUS_OVERRIDE" ]]; then
        k6_args+=("--vus" "${VUS_OVERRIDE}")
    fi

    if [[ -n "$DURATION_OVERRIDE" ]]; then
        k6_args+=("--duration" "${DURATION_OVERRIDE}")
    fi

    # Output options
    k6_args+=("--out" "json=${RESULTS_DIR}/${test_name}-${timestamp}.json")

    # Test file
    k6_args+=("${test_file}")

    # Print command (mask AUTH_TOKEN for security)
    print_info "Command: k6 ${k6_args[*]}"
    if [[ -n "$AUTH_TOKEN" ]]; then
        print_info "  (AUTH_TOKEN passed via environment variable)"
    fi
    echo ""

    if [[ "$DRY_RUN" == "true" ]]; then
        print_warning "Dry run - not executing"
        return 0
    fi

    # Execute with AUTH_TOKEN as environment variable (not command line)
    # This prevents token from appearing in process listings
    if AUTH_TOKEN="${AUTH_TOKEN}" k6 "${k6_args[@]}"; then
        print_success "Test completed: $test_name"
        return 0
    else
        print_error "Test failed: $test_name"
        return 1
    fi
}

run_a2a_test() {
    run_k6_test "a2a-endpoints" "${K6_DIR}/a2a-endpoints.js"
}

run_dashboard_test() {
    run_k6_test "dashboard-flow" "${K6_DIR}/dashboard-flow.js"
}

run_ccr_test() {
    run_k6_test "ccr-routing" "${K6_DIR}/ccr-routing.js"
}

run_all_tests() {
    local failed=0

    run_a2a_test || ((failed++))
    echo ""

    run_dashboard_test || ((failed++))
    echo ""

    run_ccr_test || ((failed++))

    if [[ $failed -gt 0 ]]; then
        print_error "$failed test(s) failed"
        return 1
    fi

    print_success "All tests completed successfully"
    return 0
}

# ============================================
# ARGUMENT PARSING
# ============================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -e|--env)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -u|--base-url)
                BASE_URL="$2"
                shift 2
                ;;
            -w|--web-url)
                WEB_URL="$2"
                shift 2
                ;;
            -c|--ccr-url)
                CCR_URL="$2"
                shift 2
                ;;
            -t|--token)
                AUTH_TOKEN="$2"
                shift 2
                ;;
            -o|--output)
                RESULTS_DIR="$2"
                shift 2
                ;;
            -v|--vus)
                VUS_OVERRIDE="$2"
                shift 2
                ;;
            -d|--duration)
                DURATION_OVERRIDE="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            a2a|dashboard|ccr|all)
                TEST_TYPE="$1"
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# ============================================
# MAIN
# ============================================

main() {
    parse_args "$@"

    print_header "HYVVE Load Test Runner"

    # Print configuration
    echo "Configuration:"
    echo "  Environment:  $ENVIRONMENT"
    echo "  Base URL:     $BASE_URL"
    echo "  Web URL:      $WEB_URL"
    echo "  CCR URL:      $CCR_URL"
    echo "  Workspace:    $WORKSPACE_ID"
    echo "  Results Dir:  $RESULTS_DIR"
    echo "  Test Type:    $TEST_TYPE"
    if [[ -n "$VUS_OVERRIDE" ]]; then
        echo "  VUs Override: $VUS_OVERRIDE"
    fi
    if [[ -n "$DURATION_OVERRIDE" ]]; then
        echo "  Duration Override: $DURATION_OVERRIDE"
    fi
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "  Mode:         DRY RUN"
    fi
    echo ""

    # Pre-flight checks
    check_k6_installed
    ensure_results_dir

    if [[ "$DRY_RUN" != "true" ]]; then
        check_target_health "$BASE_URL" || true
    fi

    echo ""

    # Run tests
    case "$TEST_TYPE" in
        a2a)
            run_a2a_test
            ;;
        dashboard)
            run_dashboard_test
            ;;
        ccr)
            run_ccr_test
            ;;
        all)
            run_all_tests
            ;;
        *)
            print_error "Unknown test type: $TEST_TYPE"
            exit 1
            ;;
    esac

    exit_code=$?

    print_header "Load Test Complete"
    echo "Results saved to: $RESULTS_DIR"
    echo ""

    exit $exit_code
}

# Run main function
main "$@"
