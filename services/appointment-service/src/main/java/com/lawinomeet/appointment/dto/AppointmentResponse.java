package com.lawinomeet.appointment.dto;

import com.lawinomeet.appointment.entity.Appointment;
import com.lawinomeet.appointment.entity.AppointmentStatus;
import com.lawinomeet.appointment.entity.ConsultationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentResponse {

    private String publicId;
    private String shortUid;
    private String clientUserPublicId;
    private String clientUsername;
    private String lawyerUserPublicId;
    private String lawyerUsername;
    private String firmPublicId;
    private Long serviceId;
    private BigDecimal fee;
    private AvailabilitySlotResponse slot;
    private Instant startTime;
    private Instant endTime;
    private String alternativeSlotPublicId;
    private String preferredSlotsJson;
    private ConsultationType consultationType;
    private String consultationReason;
    private AppointmentStatus appointmentStatus;
    private String paymentStatus;
    private String paymentMethod;
    private Instant paidAt;
    private String meetingRoomPublicId;
    private String chatConversationPublicId;

    // In-Chamber address fields (Unveiled post-payment)
    private String chamberAddress;
    private String directionsInstructions;
    private boolean chamberAddressRevealed;

    private Instant requestedAt;
    private Instant responseDeadline;
    private Instant acceptedAt;
    private Instant rejectedAt;
    private String rejectionReason;
    private Instant cancelledAt;
    private String cancellationReason;
    private Instant completionRequestedAt;
    private Instant autoReleaseAt;
    private Instant clientConfirmedAt;
    private Instant completedAt;
    private Instant settledAt;
    private String settlementStatus;
    private Instant createdAt;

    public static AppointmentResponse fromEntity(Appointment appointment) {
        return fromEntity(appointment, null);
    }

    public static AppointmentResponse fromEntity(Appointment appointment, String requestingUserPublicId) {
        if (appointment == null) {
            return null;
        }

        boolean isPaid = "PAID".equalsIgnoreCase(appointment.getPaymentStatus()) ||
                appointment.getAppointmentStatus() == AppointmentStatus.CONFIRMED ||
                appointment.getAppointmentStatus() == AppointmentStatus.IN_PROGRESS ||
                appointment.getAppointmentStatus() == AppointmentStatus.COMPLETION_REQUESTED ||
                appointment.getAppointmentStatus() == AppointmentStatus.COMPLETED;

        boolean isLawyerUser = requestingUserPublicId != null &&
                requestingUserPublicId.equals(appointment.getLawyerUserPublicId());

        String revealedChamberAddress = null;
        String revealedDirections = null;
        boolean isRevealed = false;

        if (appointment.getConsultationType() == ConsultationType.IN_PERSON) {
            if (isPaid || isLawyerUser) {
                revealedChamberAddress = appointment.getChamberAddress() != null && !appointment.getChamberAddress().isBlank()
                        ? appointment.getChamberAddress()
                        : "Advocate Chambers, High Court Complex, New Delhi - 110001";
                revealedDirections = appointment.getDirectionsInstructions() != null
                        ? appointment.getDirectionsInstructions()
                        : "Report to Chamber Reception 10 minutes prior with your appointment reference and valid ID proof.";
                isRevealed = isPaid;
            } else {
                revealedChamberAddress = "Chamber address and entry instructions will be revealed upon payment verification.";
                revealedDirections = "Address locked until retainer payment is completed.";
                isRevealed = false;
            }
        }

        Instant effectiveStart = appointment.getStartTime() != null
                ? appointment.getStartTime()
                : (appointment.getSlot() != null ? appointment.getSlot().getStartTime() : null);
        Instant effectiveEnd = appointment.getEndTime() != null
                ? appointment.getEndTime()
                : (appointment.getSlot() != null ? appointment.getSlot().getEndTime() : null);

        return AppointmentResponse.builder()
                .publicId(appointment.getPublicId())
                .shortUid(appointment.getShortUid())
                .clientUserPublicId(appointment.getClientUserPublicId())
                .clientUsername(appointment.getClientUsername())
                .lawyerUserPublicId(appointment.getLawyerUserPublicId())
                .lawyerUsername(appointment.getLawyerUsername())
                .firmPublicId(appointment.getFirmPublicId())
                .serviceId(appointment.getServiceId())
                .fee(appointment.getFee() != null ? appointment.getFee() : new BigDecimal("1500.00"))
                .slot(appointment.getSlot() != null ? AvailabilitySlotResponse.fromEntity(appointment.getSlot()) : null)
                .startTime(effectiveStart)
                .endTime(effectiveEnd)
                .alternativeSlotPublicId(appointment.getAlternativeSlotPublicId())
                .preferredSlotsJson(appointment.getPreferredSlotsJson())
                .consultationType(appointment.getConsultationType())
                .consultationReason(appointment.getConsultationReason())
                .appointmentStatus(appointment.getAppointmentStatus())
                .paymentStatus(appointment.getPaymentStatus())
                .paymentMethod(appointment.getPaymentMethod())
                .paidAt(appointment.getPaidAt())
                .meetingRoomPublicId(appointment.getMeetingRoomPublicId())
                .chatConversationPublicId(appointment.getChatConversationPublicId())
                .chamberAddress(revealedChamberAddress)
                .directionsInstructions(revealedDirections)
                .chamberAddressRevealed(isRevealed)
                .requestedAt(appointment.getRequestedAt())
                .responseDeadline(appointment.getResponseDeadline())
                .acceptedAt(appointment.getAcceptedAt())
                .rejectedAt(appointment.getRejectedAt())
                .rejectionReason(appointment.getRejectionReason())
                .cancelledAt(appointment.getCancelledAt())
                .cancellationReason(appointment.getCancellationReason())
                .completionRequestedAt(appointment.getCompletionRequestedAt())
                .autoReleaseAt(appointment.getAutoReleaseAt())
                .clientConfirmedAt(appointment.getClientConfirmedAt())
                .completedAt(appointment.getCompletedAt())
                .settledAt(appointment.getSettledAt())
                .settlementStatus(appointment.getSettlementStatus())
                .createdAt(appointment.getCreatedAt())
                .build();
    }
}
