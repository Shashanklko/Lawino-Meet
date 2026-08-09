package com.LawEZY.consultation.repository;

import com.LawEZY.consultation.entity.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, Long> {
    Optional<Consultation> findByMeetingCode(String meetingCode);
    List<Consultation> findByClientId(Long clientId);
    List<Consultation> findByLawyerId(Long lawyerId);
}
