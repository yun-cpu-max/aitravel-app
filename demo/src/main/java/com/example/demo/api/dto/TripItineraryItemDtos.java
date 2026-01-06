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

        public String placeId; // Google Place ID
        public String description;
        public String locationName;
        public String address;
        public BigDecimal latitude;
        public BigDecimal longitude;
        public LocalTime startTime;
        public LocalTime endTime;
        public String category; // "tourist_attraction", "restaurant", "cafe"
        public Integer stayDurationMinutes; // 체류 시간 (분)
        public BigDecimal travelToNextDistanceKm; // 다음 장소까지 거리 (km)
        public Integer travelToNextDurationMinutes; // 다음 장소까지 이동 시간 (분)
        public String travelToNextMode; // "DRIVE", "TRANSIT", "WALK"

        @NotNull(message = "순서(orderSequence)는 필수입니다.")
        @Min(value = 1, message = "순서(orderSequence)는 1 이상이어야 합니다.")
        public Integer orderSequence;
    }

    public static class Resp {
        public Long id;
        public String placeId;
        public String title;
        public String description;
        public String locationName;
        public String address;
        public BigDecimal latitude;
        public BigDecimal longitude;
        public LocalTime startTime;
        public LocalTime endTime;
        public String category;
        public Integer stayDurationMinutes;
        public BigDecimal travelToNextDistanceKm;
        public Integer travelToNextDurationMinutes;
        public String travelToNextMode;
        public Integer orderSequence;
    }
}


