package com.example.demo.api.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

/** ChatConversation 요청/응답 DTO */
public class ChatConversationDtos {

    public static class CreateReq {
        @NotBlank(message = "userMessage는 필수입니다.")
        public String userMessage;
        @NotBlank(message = "aiResponse는 필수입니다.")
        public String aiResponse;
    }

    public static class Resp {
        public Long id;
        public String userMessage;
        public String aiResponse;
        public LocalDateTime conversationTimestamp;
    }
}


