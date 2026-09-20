# ==========================================
# Step 1: Build Java Spring Boot Application
# ==========================================
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder
WORKDIR /app

# 1. Copy pom.xml & Maven configs for dependency caching
# This layer is cached and will NOT re-download dependencies unless pom.xml changes
COPY pom.xml .
COPY .mvn ./.mvn
RUN --mount=type=cache,target=/root/.m2 mvn dependency:go-offline -B

# 2. Copy source code and compile using multi-threading
COPY src ./src
RUN if [ ! -f src/main/resources/application.yml ]; then cp src/main/resources/application.yml.example src/main/resources/application.yml; fi
RUN --mount=type=cache,target=/root/.m2 mvn package -DskipTests -T 1C

# 3. Extract Spring Boot layered JAR
RUN java -Djarmode=layertools -jar target/*.jar extract

# ==========================================
# Step 2: Lightweight Runtime Container
# ==========================================
FROM eclipse-temurin:17-jre-alpine AS runtime
WORKDIR /app

# Copy layered jar directories:
# Third-party dependencies (~60MB) remain cached; only application (~100KB) updates on code changes
COPY --from=builder /app/dependencies/ ./
COPY --from=builder /app/spring-boot-loader/ ./
COPY --from=builder /app/snapshot-dependencies/ ./
COPY --from=builder /app/application/ ./

EXPOSE 8080
ENV PORT=8080
ENV JAVA_OPTS="-XX:+UseSerialGC -Xss512k -XX:MaxRAMPercentage=50.0 -XX:MaxMetaspaceSize=128m -XX:ReservedCodeCacheSize=48m -XX:+ExitOnOutOfMemoryError"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]
