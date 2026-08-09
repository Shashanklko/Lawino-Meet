package com.lawinomeet.admin.repository;

import com.lawinomeet.admin.entity.DisputeTicket;
import com.lawinomeet.admin.enums.DisputeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisputeTicketRepository extends JpaRepository<DisputeTicket, Long> {
    List<DisputeTicket> findByStatus(DisputeStatus status);
    List<DisputeTicket> findByRaisedByUserId(Long userId);
}
