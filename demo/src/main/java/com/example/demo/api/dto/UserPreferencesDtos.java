package com.example.demo.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

/** UserPreferences 요청/응답 DTO */
public class UserPreferencesDtos {

    public static class UpsertReq {
        public String travelStyle; // 휴양/액티비티/문화/미식 등 (선택사항)
        @Min(value = 0, message = "예산 최소값은 0 이상이어야 합니다.")
        public Integer budgetRangeMin;
        @Min(value = 0, message = "예산 최대값은 0 이상이어야 합니다.")
        public Integer budgetRangeMax;
        public String preferredAccommodationType;
        public String preferredTransportation;
    }

    public static class Resp {
        public Long id;
        public String travelStyle;
        public Integer budgetRangeMin;
        public Integer budgetRangeMax;
        public String preferredAccommodationType;
        public String preferredTransportation;
    }
}


