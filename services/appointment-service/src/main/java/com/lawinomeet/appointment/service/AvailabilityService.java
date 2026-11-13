package com.lawinomeet.appointment.service;

import com.lawinomeet.appointment.dto.AvailabilitySlotResponse;
import com.lawinomeet.appointment.dto.BatchCreateSlotsRequest;
import com.lawinomeet.appointment.dto.CreateSlotRequest;
import com.lawinomeet.appointment.entity.AvailabilitySlot;
import com.lawinomeet.appointment.entity.SlotStatus;
import com.lawinomeet.appointment.exception.ApiException;
import com.lawinomeet.appointment.repository.AvailabilitySlotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AvailabilityService {

    private final AvailabilitySlotRepository slotRepository;

    @Transactional
    public AvailabilitySlotResponse createSlot(String lawyerUserPublicId, CreateSlotRequest request) {
        validateSlotTimes(request.getStartTime(), request.getEndTime());

        if (slotRepository.hasOverlappingSlot(lawyerUserPublicId, request.getStartTime(), request.getEndTime())) {
            throw new ApiException(HttpStatus.CONFLICT, "SLOT_OVERLAP",
                    "This time range overlaps with an existing availability slot.");
        }

        AvailabilitySlot slot = AvailabilitySlot.builder()
                .publicId(UUID.randomUUID().toString())
                .lawyerUserPublicId(lawyerUserPublicId)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .slotStatus(SlotStatus.AVAILABLE)
                .build();

        AvailabilitySlot saved = slotRepository.save(slot);
        log.info("Created availability slot {} for lawyer {}", saved.getPublicId(), lawyerUserPublicId);
        return AvailabilitySlotResponse.fromEntity(saved);
    }

    @Transactional
    public List<AvailabilitySlotResponse> batchCreateSlots(String lawyerUserPublicId, BatchCreateSlotsRequest request) {
        List<AvailabilitySlotResponse> created = new ArrayList<>();
        for (CreateSlotRequest slotReq : request.getSlots()) {
            created.add(createSlot(lawyerUserPublicId, slotReq));
        }
        return created;
    }

    @Transactional(readOnly = true)
    public List<AvailabilitySlotResponse> getAvailableSlotsForLawyer(String lawyerUserPublicId) {
        List<AvailabilitySlot> slots = slotRepository
                .findByLawyerUserPublicIdAndSlotStatusAndStartTimeAfterOrderByStartTimeAsc(
                        lawyerUserPublicId, SlotStatus.AVAILABLE, Instant.now());
        return slots.stream().map(AvailabilitySlotResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public List<AvailabilitySlotResponse> getMySlots(String lawyerUserPublicId, Instant startDate, Instant endDate) {
        List<AvailabilitySlot> slots;
        if (startDate != null && endDate != null) {
            slots = slotRepository.findByLawyerUserPublicIdAndStartTimeBetweenOrderByStartTimeAsc(
                    lawyerUserPublicId, startDate, endDate);
        } else {
            slots = slotRepository.findByLawyerUserPublicIdOrderByStartTimeAsc(lawyerUserPublicId);
        }
        return slots.stream().map(AvailabilitySlotResponse::fromEntity).toList();
    }

    @Transactional
    public void deleteSlot(String lawyerUserPublicId, String slotPublicId) {
        AvailabilitySlot slot = slotRepository.findByPublicId(slotPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "SLOT_NOT_FOUND", "Slot not found"));

        if (!slot.getLawyerUserPublicId().equals(lawyerUserPublicId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You can only delete your own slots.");
        }

        if (slot.getSlotStatus() != SlotStatus.AVAILABLE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "SLOT_IN_USE",
                    "Cannot delete a slot that is currently " + slot.getSlotStatus() + ". Cancel the appointment first.");
        }

        slotRepository.delete(slot);
        log.info("Deleted availability slot {} for lawyer {}", slotPublicId, lawyerUserPublicId);
    }

    private void validateSlotTimes(Instant startTime, Instant endTime) {
        if (startTime == null || endTime == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_TIME", "Start time and end time cannot be null.");
        }
        if (!startTime.isAfter(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "PAST_TIME", "Slot start time must be in the future.");
        }
        if (!endTime.isAfter(startTime)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_INTERVAL", "End time must be after start time.");
        }
        Duration duration = Duration.between(startTime, endTime);
        if (duration.toMinutes() < 15) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INTERVAL_TOO_SHORT", "Slot duration must be at least 15 minutes.");
        }
    }
}
