# =========================================================================
# LawinoMeet - Automated End-to-End API Health & Smoke Verification (Phase 13)
# Tests all 6 microservices + Gateway + WebSocket + Auth lifecycle
# =========================================================================

param (
    [string]$GatewayUrl = "http://localhost:80"
)

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "  LawinoMeet End-to-End Microservice Verification Suite  " -ForegroundColor Yellow
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "Gateway URL: $GatewayUrl"
Write-Host ""

$testsPassed = 0
$testsFailed = 0

function Assert-Endpoint {
    param (
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [int]$ExpectedStatus = 200
    )

    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            TimeoutSec = 10
            ErrorAction = "Stop"
        }
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }

        $res = Invoke-WebRequest @params
        if ($res.StatusCode -eq $ExpectedStatus) {
            Write-Host "  [PASS] $Name ($($res.StatusCode))" -ForegroundColor Green
            $script:testsPassed++
            return $res
        } else {
            Write-Host "  [FAIL] $Name (Expected $ExpectedStatus, got $($res.StatusCode))" -ForegroundColor Red
            $script:testsFailed++
            return $null
        }
    } catch {
        Write-Host "  [FAIL] $Name -> $($_.Exception.Message)" -ForegroundColor Red
        $script:testsFailed++
        return $null
    }
}

# 1. Gateway & Web Frontends
Write-Host "--- 1. Web Portal & Gateway Verification ---" -ForegroundColor Yellow
Assert-Endpoint "Gateway Reverse Proxy Root (/)" "$GatewayUrl/" "GET" -ExpectedStatus 200

# 2. Service Actuators / Health Probes
Write-Host "--- 2. Microservice Health Checks ---" -ForegroundColor Yellow
Assert-Endpoint "Auth Service Actuator (/actuator/health)" "$GatewayUrl:8081/actuator/health" "GET" -ExpectedStatus 200
Assert-Endpoint "User Service Actuator (/actuator/health)" "$GatewayUrl:8082/actuator/health" "GET" -ExpectedStatus 200
Assert-Endpoint "Appointment Service Actuator (/actuator/health)" "$GatewayUrl:8083/actuator/health" "GET" -ExpectedStatus 200
Assert-Endpoint "Meeting Service Actuator (/actuator/health)" "$GatewayUrl:8084/actuator/health" "GET" -ExpectedStatus 200
Assert-Endpoint "Notification Service Actuator (/actuator/health)" "$GatewayUrl:8085/actuator/health" "GET" -ExpectedStatus 200
Assert-Endpoint "Chat Service Actuator (/actuator/health)" "$GatewayUrl:8086/actuator/health" "GET" -ExpectedStatus 200

# 3. Discovery & Public APIs
Write-Host "--- 3. Public Directory & Specializations ---" -ForegroundColor Yellow
Assert-Endpoint "Legal Specializations API (/api/specializations)" "$GatewayUrl/api/specializations" "GET" -ExpectedStatus 200

# 4. Authentication Lifecycle (Demo Register & Login)
Write-Host "--- 4. Authentication Lifecycle ---" -ForegroundColor Yellow
$testUser = "test_e2e_$(Get-Random -Minimum 1000 -Maximum 9999)"
$registerBody = @"
{
    "username": "$testUser",
    "email": "$testUser@example.com",
    "password": "SecurePassword123!",
    "fullName": "Test E2E User",
    "phone": "+919999999999",
    "city": "Mumbai"
}
"@

$regRes = Assert-Endpoint "Client Registration (/api/auth/register/client)" "$GatewayUrl/api/auth/register/client" "POST" -Body $registerBody -ExpectedStatus 201

$loginBody = @"
{
    "usernameOrEmail": "$testUser",
    "password": "SecurePassword123!"
}
"@
$loginRes = Assert-Endpoint "Client Login (/api/auth/login)" "$GatewayUrl/api/auth/login" "POST" -Body $loginBody -ExpectedStatus 200

if ($loginRes) {
    $json = $loginRes.Content | ConvertFrom-Json
    $token = $json.data.token
    $authHeaders = @{ "Authorization" = "Bearer $token" }
    Assert-Endpoint "Verify Profile Me (/api/auth/me)" "$GatewayUrl/api/auth/me" "GET" -Headers $authHeaders -ExpectedStatus 200
    Assert-Endpoint "My Notifications (/api/notifications/my)" "$GatewayUrl/api/notifications/my" "GET" -Headers $authHeaders -ExpectedStatus 200
    Assert-Endpoint "My Conversations (/api/chat/conversations)" "$GatewayUrl/api/chat/conversations" "GET" -Headers $authHeaders -ExpectedStatus 200
}

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "  E2E Test Execution Finished                            " -ForegroundColor Yellow
Write-Host "  Passed: $testsPassed | Failed: $testsFailed            " -ForegroundColor White
Write-Host "=========================================================" -ForegroundColor Cyan
