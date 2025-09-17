package com.example.demo.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/** TripDay 요청/응답 DTO */
public class TripDayDtos {

    public static class CreateOrUpdateReq {
        @NotNull(message = "일차(dayNumber)는 필수입니다.")
        @Min(value = 1, message = "일차(dayNumber)는 1 이상이어야 합니다.")
        public Integer dayNumber;

        @NotNull(message = "날짜(date)는 필수입니다.")
        public LocalDate date;

        public String weatherInfo;
    }

    public static class Resp {
        public Long id;
        public Integer dayNumber;
        public LocalDate date;
        public String weatherInfo;
    }
}


