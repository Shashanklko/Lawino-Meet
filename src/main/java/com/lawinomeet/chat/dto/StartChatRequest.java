package com.lawinomeet.chat.dto;

import lombok.Data;

@Data
public class StartChatRequest {
    private Long userId;
    private Long professionalId;
}
