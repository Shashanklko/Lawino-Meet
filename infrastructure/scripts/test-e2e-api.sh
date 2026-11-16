#!/usr/bin/env bash
# =========================================================================
# LawinoMeet - Automated End-to-End API Health & Smoke Verification (Bash)
# =========================================================================

set -e

GATEWAY_URL="${1:-http://localhost:80}"

echo "========================================================="
echo "  LawinoMeet End-to-End Microservice Verification Suite  "
echo "========================================================="
echo "Gateway URL: $GATEWAY_URL"
echo ""

PASSED=0
FAILED=0

assert_endpoint() {
    NAME="$1"
    URL="$2"
    EXPECTED_STATUS="${3:-200}"

    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" || echo "000")
    if [ "$STATUS" = "$EXPECTED_STATUS" ]; then
        echo "  [PASS] $NAME ($STATUS)"
        PASSED=$((PASSED + 1))
    else
        echo "  [FAIL] $NAME (Expected $EXPECTED_STATUS, got $STATUS)"
        FAILED=$((FAILED + 1))
    fi
}

echo "--- 1. Gateway & Web Portals ---"
assert_endpoint "Gateway Root Proxy (/)" "$GATEWAY_URL/" "200"

echo "--- 2. Microservice Health Actuators ---"
assert_endpoint "Auth Service Health" "$GATEWAY_URL:8081/actuator/health" "200"
assert_endpoint "User Service Health" "$GATEWAY_URL:8082/actuator/health" "200"
assert_endpoint "Appointment Service Health" "$GATEWAY_URL:8083/actuator/health" "200"
assert_endpoint "Meeting Service Health" "$GATEWAY_URL:8084/actuator/health" "200"
assert_endpoint "Notification Service Health" "$GATEWAY_URL:8085/actuator/health" "200"
assert_endpoint "Chat Service Health" "$GATEWAY_URL:8086/actuator/health" "200"

echo "--- 3. Public Directory ---"
assert_endpoint "Specializations API (/api/specializations)" "$GATEWAY_URL/api/specializations" "200"

echo ""
echo "========================================================="
echo "  E2E Test Execution Summary: Passed: $PASSED | Failed: $FAILED"
echo "========================================================="
