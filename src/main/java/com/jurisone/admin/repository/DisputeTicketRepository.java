package com.jurisone.admin.repository;

import com.jurisone.admin.entity.DisputeTicket;
import com.jurisone.admin.enums.DisputeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisputeTicketRepository extends JpaRepository<DisputeTicket, Long> {
    List<DisputeTicket> findByStatus(DisputeStatus status);
    List<DisputeTicket> findByRaisedByUserId(Long userId);
}
