package com.jurisone.common.repository;

import com.jurisone.common.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByEventTypeOrderByTimestampDesc(String eventType);
}
