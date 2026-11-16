# =========================================================================
# LawinoMeet - Docker Swarm Cluster Deployment Automation (Phase 10)
# =========================================================================

param (
    [string]$StackName = "lawino",
    [string]$ComposeFile = "docker-stack.yml"
)

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "  LawinoMeet - Deploying Docker Swarm Production Stack  " -ForegroundColor Yellow
Write-Host "=========================================================" -ForegroundColor Cyan

# 1. Check Docker Swarm status
$swarmState = (docker info --format '{{.Swarm.LocalNodeState}}')
if ($swarmState -ne "active") {
    Write-Host "[1/4] Docker Swarm is not initialized. Initializing..." -ForegroundColor Yellow
    docker swarm init
} else {
    Write-Host "[1/4] Docker Swarm is active." -ForegroundColor Green
}

# 2. Check / Create Overlay Network
Write-Host "[2/4] Ensuring overlay network exists..." -ForegroundColor Green
$networkExists = (docker network ls --filter name=lawino-overlay -q)
if (-not $networkExists) {
    docker network create --driver overlay --attachable lawino-overlay
    Write-Host "Created overlay network: lawino-overlay" -ForegroundColor DarkGreen
} else {
    Write-Host "Overlay network 'lawino-overlay' is ready." -ForegroundColor DarkGreen
}

# 3. Deploy Stack
Write-Host "[3/4] Deploying stack '$StackName' from $ComposeFile..." -ForegroundColor Green
docker stack deploy --with-registry-auth -c $ComposeFile $StackName

# 4. Check services status
Write-Host "[4/4] Verifying Swarm Services..." -ForegroundColor Green
Start-Sleep -Seconds 3
docker stack services $StackName

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "  Swarm Deployment Initiated Successfully!              " -ForegroundColor Green
Write-Host "  Run 'docker stack ps $StackName' to check replica status" -ForegroundColor White
Write-Host "=========================================================" -ForegroundColor Cyan
