
pipeline {
    agent any

    parameters {
        booleanParam(
            name: 'SKIP_TESTS',
            defaultValue: false,
            description: 'Skip Maven tests'
        )
    }

    environment {
        DOCKER_HUB_CREDS_ID = 'dockerhub-credentials'
        SWARM_SSH_KEY_ID = 'swarm-manager-ssh'
        SWARM_MANAGER_IP_ID = 'swarm-manager-ip'
        MAVEN_OPTS = '-Xmx1024m -XX:MaxMetaspaceSize=512m'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 90, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm

                script {
                    def commit = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()

                    env.IMAGE_TAG = "${env.BUILD_NUMBER}-${commit}"
                }

                echo "Building image tag: ${env.IMAGE_TAG}"

                sh '''
                    set -e
                    java -version
                    mvn -version
                    node -v
                    npm -v
                    docker version --format '{{.Client.Version}}'
                '''
            }
        }

        stage('Build Backend') {
            steps {
                script {
                    def skip = params.SKIP_TESTS ? '-DskipTests=true' : ''

                    sh """
                        set -e
                        # Purge corrupted/partial Maven downloads and .lastUpdated lock files in Jenkins agent
                        echo "Cleaning corrupt Maven artifacts in ~/.m2/repository..."
                        find ~/.m2/repository -name "*.lastUpdated" -delete 2>/dev/null || true
                        find ~/.m2/repository -name "_remote.repositories" -delete 2>/dev/null || true
                        
                        # If spring-boot core jar is missing or corrupted, remove springframework dir for clean redownload
                        if [ ! -s ~/.m2/repository/org/springframework/boot/spring-boot/3.3.5/spring-boot-3.3.5.jar ]; then
                            echo "Spring Boot jar missing or empty in ~/.m2, purging cached org/springframework..."
                            rm -rf ~/.m2/repository/org/springframework ~/.m2/repository/org/projectlombok || true
                        fi

                        for dir in services/auth-service services/user-service services/appointment-service services/meeting-service services/notification-service services/chat-service; do
                            echo "========================================="
                            echo "Compiling and packaging \${dir} ..."
                            echo "========================================="
                            (cd "\${dir}" && mvn -B -U clean package ${skip})
                        done
                    """
                }
            }
            post {
                always {
                    junit(
                        testResults: 'services/*/target/surefire-reports/TEST-*.xml',
                        allowEmptyResults: true
                    )
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: env.DOCKER_HUB_CREDS_ID,
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh '''
                        set -e

                        # Six backend microservices
                        docker build -t "$DOCKER_USER/auth-service:$IMAGE_TAG" \
                          -f services/auth-service/Dockerfile services/auth-service

                        docker build -t "$DOCKER_USER/user-service:$IMAGE_TAG" \
                          -f services/user-service/Dockerfile services/user-service

                        docker build -t "$DOCKER_USER/appointment-service:$IMAGE_TAG" \
                          -f services/appointment-service/Dockerfile services/appointment-service

                        docker build -t "$DOCKER_USER/meeting-service:$IMAGE_TAG" \
                          -f services/meeting-service/Dockerfile services/meeting-service

                        docker build -t "$DOCKER_USER/notification-service:$IMAGE_TAG" \
                          -f services/notification-service/Dockerfile services/notification-service

                        docker build -t "$DOCKER_USER/chat-service:$IMAGE_TAG" \
                          -f services/chat-service/Dockerfile services/chat-service

                        # Frontends and gateway
                        docker build -t "$DOCKER_USER/frontend:$IMAGE_TAG" frontend/

                        docker build -t "$DOCKER_USER/admin-frontend:$IMAGE_TAG" admin-frontend/

                        docker build -t "$DOCKER_USER/gateway:$IMAGE_TAG" docker/nginx/
                    '''
                }
            }
        }

        stage('Push Docker Images') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: env.DOCKER_HUB_CREDS_ID,
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh '''
                        set -e

                        echo "$DOCKER_PASS" | docker login \
                          --username "$DOCKER_USER" --password-stdin

                        for service in \
                          auth-service \
                          user-service \
                          appointment-service \
                          meeting-service \
                          notification-service \
                          chat-service \
                          frontend \
                          admin-frontend \
                          gateway
                        do
                            docker push "$DOCKER_USER/$service:$IMAGE_TAG"
                        done

                        docker logout
                    '''
                }
            }
        }

        stage('Deploy to Swarm - RDS') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: env.DOCKER_HUB_CREDS_ID,
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    ),
                    string(
                        credentialsId: env.SWARM_MANAGER_IP_ID,
                        variable: 'SWARM_MANAGER_IP'
                    )
                ]) {
                    sshagent(credentials: [env.SWARM_SSH_KEY_ID]) {
                        sh '''
                            set -e

                            # Copy RDS stack file to manager
                            scp -o StrictHostKeyChecking=yes \
                              docker-stack-rds.yml \
                              ubuntu@"$SWARM_MANAGER_IP":~/docker-stack-rds.yml

                            # Authenticate Docker Hub on manager.
                            # Password is sent through stdin, not command arguments.
                            printf '%s' "$DOCKER_PASS" | ssh \
                              -o StrictHostKeyChecking=yes \
                              ubuntu@"$SWARM_MANAGER_IP" \
                              "docker login --username '$DOCKER_USER' --password-stdin"

                            # Deploy using the manager's existing environment file.
                            ssh -o StrictHostKeyChecking=yes \
                              ubuntu@"$SWARM_MANAGER_IP" \
                              "export DOCKER_HUB_USERNAME='$DOCKER_USER' IMAGE_TAG='$IMAGE_TAG'; bash -s" <<'REMOTE'
                            set -eu

                            ENV_FILE="$HOME/Lawino-Meet/.env.aws"
                            STACK_FILE="$HOME/docker-stack-rds.yml"

                            if [ ! -f "$ENV_FILE" ]; then
                                echo "ERROR: Environment file not found: $ENV_FILE"
                                exit 1
                            fi

                            if [ ! -f "$STACK_FILE" ]; then
                                echo "ERROR: RDS stack file not found"
                                exit 1
                            fi

                            set -a
                            . "$ENV_FILE"
                            set +a

                            : "${MYSQL_HOST:?MYSQL_HOST is missing}"
                            : "${MYSQL_USER:?MYSQL_USER is missing}"
                            : "${MYSQL_PASSWORD:?MYSQL_PASSWORD is missing}"
                            : "${JWT_SECRET:?JWT_SECRET is missing}"

                            docker stack deploy \
                              --with-registry-auth \
                              -c "$STACK_FILE" \
                              lawino

                            echo "RDS stack deployment command completed."
                            REMOTE
                        '''
                    }
                }
            }
        }

        stage('Smoke Test') {
            steps {
                withCredentials([
                    string(
                        credentialsId: env.SWARM_MANAGER_IP_ID,
                        variable: 'SWARM_MANAGER_IP'
                    )
                ]) {
                    sh '''
                        set -e

                        echo "Checking frontend availability..."

                        curl --fail --silent --show-error \
                          --retry 12 \
                          --retry-delay 5 \
                          --retry-connrefused \
                          "http://$SWARM_MANAGER_IP/" \
                          -o /dev/null

                        echo "Frontend smoke test passed."
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "LawinoMeet deployed successfully. Image tag: ${env.IMAGE_TAG}"
        }

        failure {
            echo "Pipeline failed. Check the Jenkins console output."
        }

        always {
            echo "Pipeline execution finished."
        }
    }
}
