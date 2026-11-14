package com.lawinomeet.meeting.dto;

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
public class JoinRoomResponse {
    private String roomPublicId;
    private String userPublicId;
    private RoomStatus roomStatus;
    private Instant joinedAt;
    private List<IceServerConfig> iceServers;
}
