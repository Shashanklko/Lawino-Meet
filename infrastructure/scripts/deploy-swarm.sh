#!/usr/bin/env bash
# =========================================================================
# LawinoMeet - Docker Swarm Cluster Deployment Automation (Bash)
# =========================================================================

set -e

STACK_NAME="${1:-lawino}"
COMPOSE_FILE="${2:-docker-stack.yml}"

echo "========================================================="
echo "  LawinoMeet - Deploying Docker Swarm Production Stack  "
echo "========================================================="

# 1. Swarm Init check
SWARM_STATE=$(docker info --format '{{.Swarm.LocalNodeState}}' 2>/dev/null || echo "inactive")
if [ "$SWARM_STATE" != "active" ]; then
    echo "[1/4] Initializing Docker Swarm Manager..."
    docker swarm init
else
    echo "[1/4] Docker Swarm is active."
fi

# 2. Overlay Network
echo "[2/4] Ensuring overlay network exists..."
if ! docker network ls --filter name=^lawino-overlay$ -q | grep -q .; then
    docker network create --driver overlay --attachable lawino-overlay
    echo "Created overlay network: lawino-overlay"
else
    echo "Overlay network 'lawino-overlay' is ready."
fi

# 3. Deploy Stack
echo "[3/4] Deploying stack '$STACK_NAME' from $COMPOSE_FILE..."
docker stack deploy --with-registry-auth -c "$COMPOSE_FILE" "$STACK_NAME"

# 4. Check services
echo "[4/4] Verifying Swarm Services..."
sleep 3
docker stack services "$STACK_NAME"

echo "========================================================="
echo "  Swarm Deployment Initiated Successfully!              "
echo "  Run 'docker stack ps $STACK_NAME' to inspect containers"
echo "========================================================="
