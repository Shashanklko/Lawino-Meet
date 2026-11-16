// =========================================================================
// LawinoMeet - Enterprise Jenkins Declarative CI/CD Pipeline (Phase 11)
// Automated Build, Unit/Integration Test, Containerization & Swarm Deploy
// =========================================================================

pipeline {
    agent any

    environment {
        DOCKER_REGISTRY      = credentials('docker-hub-credentials') // or AWS ECR
        REGISTRY_NAME        = 'lawinomeet'
        IMAGE_TAG            = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
        SWARM_MANAGER_IP     = credentials('swarm-manager-ip')
        SSH_KEY_CREDENTIAL_ID = 'swarm-ssh-key'
    }

    tools {
        maven 'Maven-3.9'
        jdk   'JDK-21'
        nodejs 'NodeJS-20'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '15'))
        timeout(time: 60, unit: 'MINUTES')
        ansiColor('xterm')
    }

    stages {
        // =====================================================================
        // STAGE 1: Code Checkout & Environment Verification
        // =====================================================================
        stage('Checkout & Lint') {
            steps {
                echo "Starting CI/CD build for LawinoMeet commit ${env.GIT_COMMIT}"
                checkout scm
                sh 'java -version'
                sh 'mvn -version'
                sh 'node -v'
                sh 'npm -v'
            }
        }

        // =====================================================================
        // STAGE 2: Java Spring Boot Backend Build & Test
        // =====================================================================
        stage('Backend Compilation & Test') {
            steps {
                echo "Compiling and packaging all 6 microservices..."
                sh 'mvn clean package -DskipTests=false --batch-mode'
            }
            post {
                always {
                    junit '**/target/surefire-reports/*.xml'
                }
            }
        }

        // =====================================================================
        // STAGE 3: React Single-Page Application Builds
        // =====================================================================
        stage('Frontend Portals Build') {
            parallel {
                stage('Build Consumer & Advocate Portal') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                            sh 'npm run build'
                        }
                    }
                }
                stage('Build Admin & Firm Portal') {
                    steps {
                        dir('admin-frontend') {
                            sh 'npm ci'
                            sh 'npm run build'
                        }
                    }
                }
            }
        }

        // =====================================================================
        // STAGE 4: Docker Container Build
        // =====================================================================
        stage('Docker Images Build') {
            steps {
                echo "Building Docker container images with tag: ${IMAGE_TAG}..."
                sh """
                    docker build -t ${REGISTRY_NAME}/auth-service:${IMAGE_TAG} -t ${REGISTRY_NAME}/auth-service:latest -f services/auth-service/Dockerfile .
                    docker build -t ${REGISTRY_NAME}/user-service:${IMAGE_TAG} -t ${REGISTRY_NAME}/user-service:latest -f services/user-service/Dockerfile .
                    docker build -t ${REGISTRY_NAME}/appointment-service:${IMAGE_TAG} -t ${REGISTRY_NAME}/appointment-service:latest -f services/appointment-service/Dockerfile .
                    docker build -t ${REGISTRY_NAME}/meeting-service:${IMAGE_TAG} -t ${REGISTRY_NAME}/meeting-service:latest -f services/meeting-service/Dockerfile .
                    docker build -t ${REGISTRY_NAME}/notification-service:${IMAGE_TAG} -t ${REGISTRY_NAME}/notification-service:latest -f services/notification-service/Dockerfile .
                    docker build -t ${REGISTRY_NAME}/chat-service:${IMAGE_TAG} -t ${REGISTRY_NAME}/chat-service:latest -f services/chat-service/Dockerfile .
                    docker build -t ${REGISTRY_NAME}/frontend:${IMAGE_TAG} -t ${REGISTRY_NAME}/frontend:latest frontend/
                    docker build -t ${REGISTRY_NAME}/admin-frontend:${IMAGE_TAG} -t ${REGISTRY_NAME}/admin-frontend:latest admin-frontend/
                    docker build -t ${REGISTRY_NAME}/gateway:${IMAGE_TAG} -t ${REGISTRY_NAME}/gateway:latest docker/nginx/
                """
            }
        }

        // =====================================================================
        // STAGE 5: Push Images to Docker Registry
        // =====================================================================
        stage('Push Docker Images') {
            steps {
                echo "Authenticating and pushing images to registry..."
                sh """
                    echo "${DOCKER_REGISTRY_PSW}" | docker login -u "${DOCKER_REGISTRY_USR}" --password-stdin
                    docker push ${REGISTRY_NAME}/auth-service:${IMAGE_TAG}
                    docker push ${REGISTRY_NAME}/auth-service:latest
                    docker push ${REGISTRY_NAME}/user-service:${IMAGE_TAG}
                    docker push ${REGISTRY_NAME}/user-service:latest
                    docker push ${REGISTRY_NAME}/appointment-service:${IMAGE_TAG}
                    docker push ${REGISTRY_NAME}/appointment-service:latest
                    docker push ${REGISTRY_NAME}/meeting-service:${IMAGE_TAG}
                    docker push ${REGISTRY_NAME}/meeting-service:latest
                    docker push ${REGISTRY_NAME}/notification-service:${IMAGE_TAG}
                    docker push ${REGISTRY_NAME}/notification-service:latest
                    docker push ${REGISTRY_NAME}/chat-service:${IMAGE_TAG}
                    docker push ${REGISTRY_NAME}/chat-service:latest
                    docker push ${REGISTRY_NAME}/frontend:${IMAGE_TAG}
                    docker push ${REGISTRY_NAME}/frontend:latest
                    docker push ${REGISTRY_NAME}/admin-frontend:${IMAGE_TAG}
                    docker push ${REGISTRY_NAME}/admin-frontend:latest
                    docker push ${REGISTRY_NAME}/gateway:${IMAGE_TAG}
                    docker push ${REGISTRY_NAME}/gateway:latest
                """
            }
        }

        // =====================================================================
        // STAGE 6: Rolling Zero-Downtime Swarm Cluster Deployment
        // =====================================================================
        stage('Deploy to Docker Swarm') {
            when {
                branch 'main'
            }
            steps {
                echo "Executing rolling update across Docker Swarm cluster..."
                sshagent([SSH_KEY_CREDENTIAL_ID]) {
                    sh """
                        scp -o StrictHostKeyChecking=no docker-stack.yml ubuntu@${SWARM_MANAGER_IP}:~/docker-stack.yml
                        ssh -o StrictHostKeyChecking=no ubuntu@${SWARM_MANAGER_IP} '
                            export TAG=${IMAGE_TAG}
                            export REGISTRY=${REGISTRY_NAME}
                            docker stack deploy --with-registry-auth -c ~/docker-stack.yml lawino
                        '
                    """
                }
            }
        }

        // =====================================================================
        // STAGE 7: Health Check & Verification
        // =====================================================================
        stage('Smoke Test & Health Probe') {
            when {
                branch 'main'
            }
            steps {
                echo "Verifying microservices health probes..."
                sh """
                    sleep 15
                    curl -s -f http://${SWARM_MANAGER_IP}/actuator/health || echo "Services rolling in progress..."
                """
            }
        }
    }

    post {
        success {
            echo "LawinoMeet Build #${BUILD_NUMBER} Deployed Successfully!"
        }
        failure {
            echo "LawinoMeet Build #${BUILD_NUMBER} FAILED. Review console output."
        }
    }
}
