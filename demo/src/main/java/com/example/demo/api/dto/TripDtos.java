package com.example.demo.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Trip 요청/응답 DTO */
public class TripDtos {

    public static class CreateReq {
        @NotBlank(message = "title은 필수입니다.")
        public String title;
        @NotBlank(message = "destination은 필수입니다.")
        public String destination;
        public String destinationPlaceId; // Google Place ID
        public BigDecimal destinationLat; // 여행지 위도
        public BigDecimal destinationLng; // 여행지 경도
        @NotNull(message = "startDate는 필수입니다.")
        public LocalDate startDate;
        @NotNull(message = "endDate는 필수입니다.")
        public LocalDate endDate;
        @Min(value = 1, message = "성인은 1 이상이어야 합니다.")
        public Integer numAdults = 1;
        @Min(value = 0, message = "아동은 0 이상이어야 합니다.")
        public Integer numChildren = 0;
        public Integer totalBudget;
        public List<TripDayDtos.CreateOrUpdateReq> days; // 일차별 정보
    }

    public static class Resp {
        public Long id;
        public String title;
        public String destination;
        public String destinationPlaceId;
        public BigDecimal destinationLat;
        public BigDecimal destinationLng;
        public LocalDate startDate;
        public LocalDate endDate;
        public Integer numAdults;
        public Integer numChildren;
        public Integer totalBudget;
        public String status;
        public Long userId; // 사용자 ID (필터링용)
        public Integer daysCount; // 일차 수
        public Integer totalItineraryItemsCount; // 전체 일정 항목 수
    }
}


