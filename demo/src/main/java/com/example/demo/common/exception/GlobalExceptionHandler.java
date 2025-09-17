package com.example.demo.common.exception;

import com.example.demo.common.dto.ApiErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;

import java.util.stream.Collectors;

/**
 * 전역 예외 처리기
 * - 애플리케이션 전체에서 발생하는 예외를 중앙에서 처리합니다.
 * - 일관된 오류 응답 형식을 제공하여 클라이언트의 오류 처리를 단순화합니다.
 */

/**
 * @ControllerAdvice: 전역 예외 처리기임을 표시
 * - 모든 컨트롤러에서 발생하는 예외를 처리할 수 있습니다.
 * - @ExceptionHandler와 함께 사용하여 특정 예외 타입별로 처리 로직을 정의합니다.
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    /**
     * @ExceptionHandler: 특정 예외 타입을 처리하는 메소드
     * - MethodArgumentNotValidException: @Valid 검증 실패 시 발생하는 예외
     * - WebRequest: 현재 요청 정보에 접근할 수 있는 인터페이스
     * - ResponseEntity: HTTP 상태 코드와 함께 응답 반환
     * 
     * @param ex 검증 실패 예외 객체
     * @param request 현재 요청 정보
     * @return HTTP 400 Bad Request와 함께 오류 응답
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex, WebRequest request) {
        // 검증 실패한 필드들의 오류 메시지를 쉼표로 연결
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        
        // 요청 경로 추출
        String path = ((ServletWebRequest)request).getRequest().getRequestURI();
        
        // 400 Bad Request와 함께 오류 응답 반환
        return ResponseEntity.badRequest().body(new ApiErrorResponse(path, msg, "VALIDATION_ERROR"));
    }

    /**
     * @ExceptionHandler: 잘못된 인자 예외 처리
     * - IllegalArgumentException: 잘못된 인자가 전달되었을 때 발생하는 예외
     * 
     * @param ex 잘못된 인자 예외 객체
     * @param request 현재 요청 정보
     * @return HTTP 400 Bad Request와 함께 오류 응답
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgument(IllegalArgumentException ex, WebRequest request) {
        String path = ((ServletWebRequest)request).getRequest().getRequestURI();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiErrorResponse(path, ex.getMessage(), "BAD_REQUEST"));
    }

    /**
     * @ExceptionHandler: 런타임 예외 처리 (기본 예외 처리기)
     * - RuntimeException: 처리되지 않은 모든 런타임 예외를 처리
     * - 가장 마지막에 실행되는 예외 처리기 (구체적인 예외 처리기가 없을 때)
     * 
     * @param ex 런타임 예외 객체
     * @param request 현재 요청 정보
     * @return HTTP 500 Internal Server Error와 함께 오류 응답
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiErrorResponse> handleRuntime(RuntimeException ex, WebRequest request) {
        String path = ((ServletWebRequest)request).getRequest().getRequestURI();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiErrorResponse(path, ex.getMessage(), "INTERNAL_ERROR"));
    }
}


