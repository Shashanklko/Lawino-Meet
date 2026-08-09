package com.lawinomeet.chat.dto;

import lombok.Data;

@Data
public class StartChatRequest {
    private Long userId;
    private Long professionalId;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getProfessionalId() { return professionalId; }
    public void setProfessionalId(Long professionalId) { this.professionalId = professionalId; }
}
