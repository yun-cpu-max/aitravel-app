package com.example.demo.domain;

/**
 * ChatConversation 엔티티
 * - 일정 생성/수정 과정에서 발생하는 사용자-AI 대화 기록을 저장합니다.
 */

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * @Entity: JPA 엔티티임을 표시. 데이터베이스 테이블과 매핑되는 클래스
 * @Table: 매핑할 테이블명 지정 (name = "chat_conversations")
 */
@Entity
@Table(name = "chat_conversations")
public class ChatConversation {
    /**
     * @Id: 기본키(Primary Key) 필드 지정
     * @GeneratedValue: 자동 생성 전략 설정
     * strategy = GenerationType.IDENTITY: DB의 AUTO_INCREMENT 사용
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * @ManyToOne: N:1 관계 매핑 (여러 대화 : 한 여행)
     * fetch = FetchType.LAZY: 지연 로딩 (필요할 때만 DB에서 조회)
     * @JoinColumn: 외래키 컬럼명 지정 (name = "trip_id")
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id")
    private Trip trip;

    /**
     * 사용자 메시지 (TEXT 타입으로 긴 내용 저장 가능)
     * nullable = false: 필수 입력
     */
    @Column(name = "user_message", columnDefinition = "TEXT", nullable = false)
    private String userMessage;

    /**
     * AI 응답 메시지 (TEXT 타입으로 긴 내용 저장 가능)
     * nullable = false: 필수 입력
     */
    @Column(name = "ai_response", columnDefinition = "TEXT", nullable = false)
    private String aiResponse;

    /**
     * 대화 발생 시각 (기본값: 현재 시간)
     * nullable = false: 필수 입력
     */
    @Column(name = "conversation_timestamp", nullable = false)
    private LocalDateTime conversationTimestamp = LocalDateTime.now();

    public Long getId() { return id; }
    public Trip getTrip() { return trip; }
    public void setTrip(Trip trip) { this.trip = trip; }
    public String getUserMessage() { return userMessage; }
    public void setUserMessage(String userMessage) { this.userMessage = userMessage; }
    public String getAiResponse() { return aiResponse; }
    public void setAiResponse(String aiResponse) { this.aiResponse = aiResponse; }
    public LocalDateTime getConversationTimestamp() { return conversationTimestamp; }
    public void setConversationTimestamp(LocalDateTime conversationTimestamp) { this.conversationTimestamp = conversationTimestamp; }
}


