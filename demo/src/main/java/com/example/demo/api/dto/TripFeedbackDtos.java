package com.example.demo.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** TripFeedback 요청/응답 DTO */
public class TripFeedbackDtos {

    public static class CreateReq {
        @NotNull(message = "overallRating은 필수입니다.")
        @Min(value = 1, message = "overallRating은 1 이상이어야 합니다.")
        @Max(value = 5, message = "overallRating은 5 이하여야 합니다.")
        public Integer overallRating;
        public String feedbackText;
        public String satisfactionAreas; // JSON string
    }

    public static class Resp {
        public Long id;
        public Integer overallRating;
        public String feedbackText;
        public String satisfactionAreas;
        public java.time.LocalDateTime createdAt;
    }
}


