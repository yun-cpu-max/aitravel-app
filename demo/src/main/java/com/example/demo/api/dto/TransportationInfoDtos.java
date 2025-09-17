package com.example.demo.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/** TransportationInfo 요청/응답 DTO */
public class TransportationInfoDtos {

    public static class CreateOrUpdateReq {
        @NotBlank(message = "교통수단 타입(type)은 필수입니다.")
        @Size(max = 20, message = "type 길이는 20자를 초과할 수 없습니다.")
        public String type;
        public String departureLocation;
        public String arrivalLocation;
        public LocalDateTime departureDateTime;
        public LocalDateTime arrivalDateTime;
        public String bookingReference;
        public Integer cost;
    }

    public static class Resp {
        public Long id;
        public String type;
        public String departureLocation;
        public String arrivalLocation;
        public LocalDateTime departureDateTime;
        public LocalDateTime arrivalDateTime;
        public String bookingReference;
        public Integer cost;
    }
}


