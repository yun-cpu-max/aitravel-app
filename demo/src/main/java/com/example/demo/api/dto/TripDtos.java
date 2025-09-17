package com.example.demo.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/** Trip 요청/응답 DTO */
public class TripDtos {

    public static class CreateReq {
        @NotBlank(message = "title은 필수입니다.")
        public String title;
        @NotBlank(message = "destination은 필수입니다.")
        public String destination;
        @NotNull(message = "startDate는 필수입니다.")
        public LocalDate startDate;
        @NotNull(message = "endDate는 필수입니다.")
        public LocalDate endDate;
        @Min(value = 1, message = "성인은 1 이상이어야 합니다.")
        public Integer numAdults = 1;
        @Min(value = 0, message = "아동은 0 이상이어야 합니다.")
        public Integer numChildren = 0;
        public Integer totalBudget;
    }

    public static class Resp {
        public Long id;
        public String title;
        public String destination;
        public LocalDate startDate;
        public LocalDate endDate;
        public Integer numAdults;
        public Integer numChildren;
        public Integer totalBudget;
        public String status;
    }
}


