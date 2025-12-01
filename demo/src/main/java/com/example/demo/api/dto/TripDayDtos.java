package com.example.demo.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/** TripDay 요청/응답 DTO */
public class TripDayDtos {

    public static class CreateOrUpdateReq {
        @NotNull(message = "일차(dayNumber)는 필수입니다.")
        @Min(value = 1, message = "일차(dayNumber)는 1 이상이어야 합니다.")
        public Integer dayNumber;

        @NotNull(message = "날짜(date)는 필수입니다.")
        public LocalDate date;

        public LocalTime dayStartTime; // 일일 시작 시간
        public LocalTime dayEndTime; // 일일 종료 시간
        public String accommodationJson; // 숙소 정보 (JSON)
        public List<TripItineraryItemDtos.CreateOrUpdateReq> itineraryItems; // 일정 항목 목록
    }

    public static class Resp {
        public Long id;
        public Integer dayNumber;
        public LocalDate date;
        public LocalTime dayStartTime;
        public LocalTime dayEndTime;
        public String accommodationJson;
        public List<TripItineraryItemDtos.Resp> itineraryItems; // 일정 항목 목록 (상세 보기용)
    }
}


