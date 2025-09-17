package com.example.demo.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalTime;

/** TripItineraryItem 요청/응답 DTO */
public class TripItineraryItemDtos {

    public static class CreateOrUpdateReq {
        @NotBlank(message = "일정 제목(title)은 필수입니다.")
        public String title;

        public String description;
        public String locationName;
        public BigDecimal latitude;
        public BigDecimal longitude;
        public LocalTime startTime;
        public LocalTime endTime;
        public Integer estimatedCost;
        public String category;
        public String transportationType;
        public Integer transportationDuration;
        public Integer transportationCost;

        @NotNull(message = "순서(orderSequence)는 필수입니다.")
        @Min(value = 1, message = "순서(orderSequence)는 1 이상이어야 합니다.")
        public Integer orderSequence;
        public Boolean confirmed;
    }

    public static class Resp {
        public Long id;
        public String title;
        public String description;
        public String locationName;
        public BigDecimal latitude;
        public BigDecimal longitude;
        public LocalTime startTime;
        public LocalTime endTime;
        public Integer estimatedCost;
        public String category;
        public String transportationType;
        public Integer transportationDuration;
        public Integer transportationCost;
        public Integer orderSequence;
        public Boolean confirmed;
    }
}


