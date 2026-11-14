package com.lawinomeet.meeting.dto;

import com.lawinomeet.meeting.entity.MeetingRoom;
import com.lawinomeet.meeting.entity.RoomStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeetingRoomResponse {

    private String publicId;
    private String appointmentPublicId;
    private String clientUserPublicId;
    private String clientUsername;
    private String lawyerUserPublicId;
    private String lawyerUsername;
    private RoomStatus roomStatus;
    private String roomToken;
    private Instant startedAt;
    private Instant endedAt;
    private Long durationSeconds;
    private List<IceServerConfig> iceServers;

    public static MeetingRoomResponse fromEntity(MeetingRoom room, List<IceServerConfig> iceServers) {
        if (room == null) {
            return null;
        }
        return MeetingRoomResponse.builder()
                .publicId(room.getPublicId())
                .appointmentPublicId(room.getAppointmentPublicId())
                .clientUserPublicId(room.getClientUserPublicId())
                .clientUsername(room.getClientUsername())
                .lawyerUserPublicId(room.getLawyerUserPublicId())
                .lawyerUsername(room.getLawyerUsername())
                .roomStatus(room.getRoomStatus())
                .roomToken(room.getRoomToken())
                .startedAt(room.getStartedAt())
                .endedAt(room.getEndedAt())
                .durationSeconds(room.getDurationSeconds())
                .iceServers(iceServers)
                .build();
    }
}
