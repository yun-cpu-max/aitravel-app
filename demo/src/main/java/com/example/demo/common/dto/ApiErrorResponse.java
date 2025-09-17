package com.example.demo.common.dto;

import java.time.LocalDateTime;

/**
 * API 오류 응답의 표준 형식을 정의하는 DTO
 * - 모든 예외 처리 시 일관된 JSON 응답을 제공합니다.
 * - 클라이언트가 오류를 쉽게 파악하고 처리할 수 있도록 도와줍니다.
 */
public class ApiErrorResponse {
    /** 오류 발생 시각 (자동으로 현재 시간 설정) */
    private final LocalDateTime timestamp = LocalDateTime.now();
    
    /** 오류가 발생한 요청 경로 (예: "/api/users") */
    private final String path;
    
    /** 오류 메시지 (사용자에게 표시될 메시지) */
    private final String message;
    
    /** 오류 코드 (예: "VALIDATION_ERROR", "NOT_FOUND", "INTERNAL_ERROR") */
    private final String code;

    /**
     * ApiErrorResponse 생성자
     * - 모든 필드를 final로 설정하여 불변 객체로 만듭니다.
     * 
     * @param path 오류가 발생한 요청 경로
     * @param message 오류 메시지
     * @param code 오류 코드
     */
    public ApiErrorResponse(String path, String message, String code) {
        this.path = path;
        this.message = message;
        this.code = code;
    }

    /** 오류 발생 시각 반환 */
    public LocalDateTime getTimestamp() { return timestamp; }
    
    /** 오류 발생 경로 반환 */
    public String getPath() { return path; }
    
    /** 오류 메시지 반환 */
    public String getMessage() { return message; }
    
    /** 오류 코드 반환 */
    public String getCode() { return code; }
}


