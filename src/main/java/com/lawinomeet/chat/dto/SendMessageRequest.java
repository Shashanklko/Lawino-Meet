package com.lawinomeetMeetmeet.chat.dto;

import com.lawinomeetMeetmeet.chat.enums.MessageType;

import lombok.Data;

@Data
public class SendMessageRequest {
    private String chatSessionId;
    private Long senderId;
    private Long receiverId;
    private MessageType type;
    private String content;
}
