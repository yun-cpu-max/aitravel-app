package com.example.demo.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

/** User 요청/응답 DTO */
public class UserDtos {

    public static class CreateReq {
        @Email(message = "올바른 이메일 형식이어야 합니다.")
        @NotBlank(message = "email은 필수입니다.")
        public String email;

        @NotBlank(message = "password는 필수입니다.")
        public String password;

        @NotBlank(message = "name은 필수입니다.")
        public String name;
    }

    public static class Resp {
        public Long id;
        public String email;
        public String name;
        public LocalDateTime createdAt;
    }
}


