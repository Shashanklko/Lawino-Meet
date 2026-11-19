FROM maven:3.9.9-eclipse-temurin-21-alpine
WORKDIR /app

RUN addgroup -S appgroup 2>/dev/null || true && adduser -S appuser -G appgroup 2>/dev/null || true
USER appuser

COPY target/*.jar app.jar

ENV PORT=8086
EXPOSE 8086

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8086/actuator/health || exit 1

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
