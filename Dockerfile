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
RUN --mount=type=cache,target=/root/.m2 mvn package -DskipTests

# ==========================================
# Step 2: Lightweight Runtime Container
# ==========================================
FROM eclipse-temurin:17-jre-alpine AS runtime
WORKDIR /app

# Copy the built jar from the builder stage
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080
ENV PORT=8080
ENV JAVA_OPTS="-XX:+UseSerialGC -Xss512k -XX:MaxRAMPercentage=50.0 -XX:MaxMetaspaceSize=128m -XX:ReservedCodeCacheSize=48m -XX:+ExitOnOutOfMemoryError"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
