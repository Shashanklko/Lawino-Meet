// =========================================================================
// LawinoMeet - Enterprise Jenkins Declarative CI/CD Pipeline
// Automated Build, Test, Containerization, Docker Hub Push & Swarm Deploy
// Supports both Mode A (Docker MySQL) and Mode B (AWS RDS MySQL)
// =========================================================================

pipeline {
    agent any

    parameters {
        choice(name: 'DB_MODE', choices: ['rds', 'mysql'], description: 'Swarm Database Mode: rds (AWS RDS MySQL) or mysql (Swarm Container MySQL)')
        booleanParam(name: 'SKIP_TESTS', defaultValue: false, description: 'Skip Maven unit and integration tests')
    }

    environment {
        DOCKER_HUB_CREDS_ID   = 'docker-hub-credentials'
        SWARM_SSH_KEY_ID      = 'swarm-ssh-key'
        SWARM_MANAGER_IP_ID   = 'swarm-manager-ip'
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
        // STAGE 1: Code Checkout & Metadata Generation
        // =====================================================================
        stage('Checkout & Lint') {
            steps {
                checkout scm
                script {
                    def shortCommit = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    env.IMAGE_TAG = "${env.BUILD_NUMBER}-${shortCommit}"
                    echo "Checked out commit ${shortCommit}. Build Image Tag: ${env.IMAGE_TAG}"
                }
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
                script {
                    def testFlag = params.SKIP_TESTS ? '-DskipTests=true' : '-DskipTests=false'
                    echo "Compiling and packaging all 6 microservices with ${testFlag}..."
                    sh "mvn clean package ${testFlag} --batch-mode"
                }
            }
            post {
                always {
                    junit testResults: '**/target/surefire-reports/*.xml', allowEmptyResults: true
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
                            sh 'npm install'
                            sh 'npm run build'
                        }
                    }
                }
                stage('Build Admin & Firm Portal') {
                    steps {
                        dir('admin-frontend') {
                            sh 'npm install'
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
                withCredentials([usernamePassword(credentialsId: env.DOCKER_HUB_CREDS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    script {
                        echo "Building Docker container images for registry '${DOCKER_USER}' with tag: ${env.IMAGE_TAG}..."
                        sh """
                            docker build -t ${DOCKER_USER}/auth-service:${env.IMAGE_TAG} -t ${DOCKER_USER}/auth-service:latest -f services/auth-service/Dockerfile .
                            docker build -t ${DOCKER_USER}/user-service:${env.IMAGE_TAG} -t ${DOCKER_USER}/user-service:latest -f services/user-service/Dockerfile .
                            docker build -t ${DOCKER_USER}/appointment-service:${env.IMAGE_TAG} -t ${DOCKER_USER}/appointment-service:latest -f services/appointment-service/Dockerfile .
                            docker build -t ${DOCKER_USER}/meeting-service:${env.IMAGE_TAG} -t ${DOCKER_USER}/meeting-service:latest -f services/meeting-service/Dockerfile .
                            docker build -t ${DOCKER_USER}/notification-service:${env.IMAGE_TAG} -t ${DOCKER_USER}/notification-service:latest -f services/notification-service/Dockerfile .
                            docker build -t ${DOCKER_USER}/chat-service:${env.IMAGE_TAG} -t ${DOCKER_USER}/chat-service:latest -f services/chat-service/Dockerfile .
                            docker build -t ${DOCKER_USER}/frontend:${env.IMAGE_TAG} -t ${DOCKER_USER}/frontend:latest frontend/
                            docker build -t ${DOCKER_USER}/admin-frontend:${env.IMAGE_TAG} -t ${DOCKER_USER}/admin-frontend:latest admin-frontend/
                            docker build -t ${DOCKER_USER}/gateway:${env.IMAGE_TAG} -t ${DOCKER_USER}/gateway:latest docker/nginx/
                        """
                    }
                }
            }
        }

        // =====================================================================
        // STAGE 5: Push Images to Docker Hub Registry
        // =====================================================================
        stage('Push Docker Images') {
            steps {
                withCredentials([usernamePassword(credentialsId: env.DOCKER_HUB_CREDS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh """
                        echo "\${DOCKER_PASS}" | docker login -u "\${DOCKER_USER}" --password-stdin
                        docker push ${DOCKER_USER}/auth-service:${env.IMAGE_TAG}
                        docker push ${DOCKER_USER}/auth-service:latest
                        docker push ${DOCKER_USER}/user-service:${env.IMAGE_TAG}
                        docker push ${DOCKER_USER}/user-service:latest
                        docker push ${DOCKER_USER}/appointment-service:${env.IMAGE_TAG}
                        docker push ${DOCKER_USER}/appointment-service:latest
                        docker push ${DOCKER_USER}/meeting-service:${env.IMAGE_TAG}
                        docker push ${DOCKER_USER}/meeting-service:latest
                        docker push ${DOCKER_USER}/notification-service:${env.IMAGE_TAG}
                        docker push ${DOCKER_USER}/notification-service:latest
                        docker push ${DOCKER_USER}/chat-service:${env.IMAGE_TAG}
                        docker push ${DOCKER_USER}/chat-service:latest
                        docker push ${DOCKER_USER}/frontend:${env.IMAGE_TAG}
                        docker push ${DOCKER_USER}/frontend:latest
                        docker push ${DOCKER_USER}/admin-frontend:${env.IMAGE_TAG}
                        docker push ${DOCKER_USER}/admin-frontend:latest
                        docker push ${DOCKER_USER}/gateway:${env.IMAGE_TAG}
                        docker push ${DOCKER_USER}/gateway:latest
                    """
                }
            }
        }

        // =====================================================================
        // STAGE 6: Zero-Downtime Swarm Cluster Deployment
        // =====================================================================
        stage('Deploy to Docker Swarm') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([
                    usernamePassword(credentialsId: env.DOCKER_HUB_CREDS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS'),
                    string(credentialsId: env.SWARM_MANAGER_IP_ID, variable: 'SWARM_MANAGER_IP')
                ]) {
                    sshagent([env.SWARM_SSH_KEY_ID]) {
                        script {
                            def stackFile = params.DB_MODE == 'mysql' ? 'docker-stack-mysql.yml' : 'docker-stack-rds.yml'
                            echo "Deploying to Swarm Manager (${SWARM_MANAGER_IP}) using ${stackFile} (Mode: ${params.DB_MODE})..."
                            sh """
                                scp -o StrictHostKeyChecking=no ${stackFile} ubuntu@${SWARM_MANAGER_IP}:~/docker-stack.yml
                                ssh -o StrictHostKeyChecking=no ubuntu@${SWARM_MANAGER_IP} "
                                    set -a
                                    [ -f ~/.env.aws ] && source ~/.env.aws
                                    set +a
                                    export DOCKER_HUB_USERNAME=${DOCKER_USER}
                                    export IMAGE_TAG=${env.IMAGE_TAG}
                                    echo '${DOCKER_PASS}' | docker login -u '${DOCKER_USER}' --password-stdin
                                    docker stack deploy --with-registry-auth -c ~/docker-stack.yml lawino
                                "
                            """
                        }
                    }
                }
            }
        }

        // =====================================================================
        // STAGE 7: Verification & Health Probe
        // =====================================================================
        stage('Smoke Test & Health Probe') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([string(credentialsId: env.SWARM_MANAGER_IP_ID, variable: 'SWARM_MANAGER_IP')]) {
                    echo "Verifying application availability on Swarm ingress..."
                    sh """
                        echo "Waiting 25 seconds for Swarm service convergence..."
                        sleep 25
                        curl -s -f -o /dev/null http://${SWARM_MANAGER_IP}/ || {
                            echo 'Smoke test failed: Frontend portal did not respond with 200 OK.'
                            exit 1
                        }
                        curl -s -f -o /dev/null http://${SWARM_MANAGER_IP}/api/users/lawyers || {
                            echo 'Smoke test warning: Backend API probe failed.'
                            exit 1
                        }
                        echo "Smoke test passed successfully."
                    """
                }
            }
        }
    }

    post {
        success {
            echo "LawinoMeet Build #${BUILD_NUMBER} Deployed Successfully to Docker Swarm!"
        }
        failure {
            echo "LawinoMeet Build #${BUILD_NUMBER} FAILED. Review console output for details."
        }
    }
}
