package com.example.demo.domain;

/**
 * 여행(Trip) 엔티티
 * - 사용자별 여행 기본 정보(제목/여행지/기간/인원/예산/상태)를 관리합니다.
 * - 하위로 Day, Itinerary, Transportation 등이 연결됩니다.
 */

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * @Entity: JPA 엔티티임을 표시. 데이터베이스 테이블과 매핑되는 클래스
 * @Table: 매핑할 테이블명 지정 (name = "trips")
 */
@Entity
@Table(name = "trips")
public class Trip {
    /**
     * @Id: 기본키(Primary Key) 필드 지정
     * @GeneratedValue: 자동 생성 전략 설정
     * strategy = GenerationType.IDENTITY: DB의 AUTO_INCREMENT 사용
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * @ManyToOne: N:1 관계 매핑 (여러 여행 : 한 사용자)
     * fetch = FetchType.LAZY: 지연 로딩 (필요할 때만 DB에서 조회)
     * @JoinColumn: 외래키 컬럼명 지정 (name = "user_id")
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    /** 여행 제목 (예: "2025 파리 여행", "제주도 3박4일") */
    @Column(nullable = false, length = 200)
    private String title;

    /** 대표 여행지 (주요 도시명, 예: "파리", "제주도") */
    @Column(nullable = false, length = 100)
    private String destination;

    /** 여행 시작 일자 (출발일) */
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    /** 여행 종료 일자 (귀국일) */
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    /** 성인 인원 수 (기본값: 1명) */
    @Column(name = "num_adults")
    private Integer numAdults = 1;

    /** 아동 인원 수 (기본값: 0명) */
    @Column(name = "num_children")
    private Integer numChildren = 0;

    /** 총 예산 (원 단위, 예: 1000000) */
    @Column(name = "total_budget")
    private Integer totalBudget;

    /**
     * 여행 상태 (기본값: "planning")
     * - planning: 계획 중
     * - confirmed: 확정됨
     * - ongoing: 진행 중
     * - completed: 완료됨
     */
    @Column(length = 20)
    private String status = "planning";

    /** 여행 계획 생성 시각 (자동 설정) */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /** 마지막 수정 시각 (자동 갱신) */
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * @PrePersist: 엔티티가 DB에 저장되기 전에 실행되는 메소드
     * 생성 시각과 수정 시각을 현재 시간으로 자동 설정
     */
    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * @PreUpdate: 엔티티가 DB에서 수정되기 전에 실행되는 메소드
     * 수정 시각을 현재 시간으로 자동 갱신
     */
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public Integer getNumAdults() { return numAdults; }
    public void setNumAdults(Integer numAdults) { this.numAdults = numAdults; }
    public Integer getNumChildren() { return numChildren; }
    public void setNumChildren(Integer numChildren) { this.numChildren = numChildren; }
    public Integer getTotalBudget() { return totalBudget; }
    public void setTotalBudget(Integer totalBudget) { this.totalBudget = totalBudget; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}


