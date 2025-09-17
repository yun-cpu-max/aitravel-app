package com.example.demo.domain;

/**
 * TripFeedback 엔티티
 * - 여행 종료 후 사용자의 전반 평가와 코멘트, 영역별 만족도를 저장합니다.
 */

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * @Entity: JPA 엔티티임을 표시. 데이터베이스 테이블과 매핑되는 클래스
 * @Table: 매핑할 테이블명 지정 (name = "trip_feedback")
 */
@Entity
@Table(name = "trip_feedback")
public class TripFeedback {
    /**
     * @Id: 기본키(Primary Key) 필드 지정
     * @GeneratedValue: 자동 생성 전략 설정
     * strategy = GenerationType.IDENTITY: DB의 AUTO_INCREMENT 사용
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * @ManyToOne: N:1 관계 매핑 (여러 피드백 : 한 여행)
     * fetch = FetchType.LAZY: 지연 로딩 (필요할 때만 DB에서 조회)
     * @JoinColumn: 외래키 컬럼명 지정 (name = "trip_id")
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id")
    private Trip trip;

    /**
     * @ManyToOne: N:1 관계 매핑 (여러 피드백 : 한 사용자)
     * fetch = FetchType.LAZY: 지연 로딩 (필요할 때만 DB에서 조회)
     * @JoinColumn: 외래키 컬럼명 지정 (name = "user_id")
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    /** 전체 만족도 평점 (1~5점) */
    @Column(name = "overall_rating")
    private Integer overallRating; // 1~5

    /** 피드백 텍스트 (TEXT 타입으로 긴 내용 저장 가능) */
    @Column(name = "feedback_text", columnDefinition = "TEXT")
    private String feedbackText;

    /**
     * @Lob: 대용량 데이터 타입 (TEXT, CLOB 등)
     * 세부 만족도 영역을 JSON 문자열로 저장 (예: {"숙소": 4, "교통": 3, "음식": 5})
     */
    @Lob
    @Column(name = "satisfaction_areas")
    private String satisfactionAreas;

    /** 피드백 작성 시각 (기본값: 현재 시간) */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public Trip getTrip() { return trip; }
    public void setTrip(Trip trip) { this.trip = trip; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Integer getOverallRating() { return overallRating; }
    public void setOverallRating(Integer overallRating) { this.overallRating = overallRating; }
    public String getFeedbackText() { return feedbackText; }
    public void setFeedbackText(String feedbackText) { this.feedbackText = feedbackText; }
    public String getSatisfactionAreas() { return satisfactionAreas; }
    public void setSatisfactionAreas(String satisfactionAreas) { this.satisfactionAreas = satisfactionAreas; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}


