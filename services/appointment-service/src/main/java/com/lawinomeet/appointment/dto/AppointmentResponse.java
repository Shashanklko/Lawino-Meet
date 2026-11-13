package com.lawinomeet.appointment.dto;

import com.lawinomeet.appointment.entity.Appointment;
import com.lawinomeet.appointment.entity.AppointmentStatus;
import com.lawinomeet.appointment.entity.ConsultationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentResponse {

    private String publicId;
    private String clientUserPublicId;
    private String clientUsername;
    private String lawyerUserPublicId;
    private String lawyerUsername;
    private String firmPublicId;
    private Long serviceId;
    private AvailabilitySlotResponse slot;
    private ConsultationType consultationType;
    private String consultationReason;
    private AppointmentStatus appointmentStatus;
    private Instant requestedAt;
    private Instant responseDeadline;
    private Instant acceptedAt;
    private Instant rejectedAt;
    private String rejectionReason;
    private Instant cancelledAt;
    private String cancellationReason;
    private Instant completedAt;
    private Instant createdAt;

    public static AppointmentResponse fromEntity(Appointment appointment) {
        if (appointment == null) {
            return null;
        }
        return AppointmentResponse.builder()
                .publicId(appointment.getPublicId())
                .clientUserPublicId(appointment.getClientUserPublicId())
                .clientUsername(appointment.getClientUsername())
                .lawyerUserPublicId(appointment.getLawyerUserPublicId())
                .lawyerUsername(appointment.getLawyerUsername())
                .firmPublicId(appointment.getFirmPublicId())
                .serviceId(appointment.getServiceId())
                .slot(AvailabilitySlotResponse.fromEntity(appointment.getSlot()))
                .consultationType(appointment.getConsultationType())
                .consultationReason(appointment.getConsultationReason())
                .appointmentStatus(appointment.getAppointmentStatus())
                .requestedAt(appointment.getRequestedAt())
                .responseDeadline(appointment.getResponseDeadline())
                .acceptedAt(appointment.getAcceptedAt())
                .rejectedAt(appointment.getRejectedAt())
                .rejectionReason(appointment.getRejectionReason())
                .cancelledAt(appointment.getCancelledAt())
                .cancellationReason(appointment.getCancellationReason())
                .completedAt(appointment.getCompletedAt())
                .createdAt(appointment.getCreatedAt())
                .build();
    }
}
