package com.example.demo.domain;

/**
 * UserPreferences 엔티티
 * - 사용자 취향(여행 스타일/예산 범위/선호 교통·숙소)을 보관합니다.
 */

import jakarta.persistence.*;

/**
 * @Entity: JPA 엔티티임을 표시. 데이터베이스 테이블과 매핑되는 클래스
 * @Table: 매핑할 테이블명 지정 (name = "user_preferences")
 */
@Entity
@Table(name = "user_preferences")
public class UserPreferences {
    /**
     * @Id: 기본키(Primary Key) 필드 지정
     * @GeneratedValue: 자동 생성 전략 설정
     * strategy = GenerationType.IDENTITY: DB의 AUTO_INCREMENT 사용
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * @OneToOne: 1:1 관계 매핑 (한 사용자 : 한 취향 설정)
     * fetch = FetchType.LAZY: 지연 로딩 (필요할 때만 DB에서 조회)
     * @JoinColumn: 외래키 컬럼명 지정 (name = "user_id")
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    /** 여행 스타일 (예: "휴양", "액티비티", "문화", "미식") */
    @Column(name = "travel_style", length = 50)
    private String travelStyle;

    /** 최소 예산 범위 (원 단위) */
    @Column(name = "budget_range_min")
    private Integer budgetRangeMin;

    /** 최대 예산 범위 (원 단위) */
    @Column(name = "budget_range_max")
    private Integer budgetRangeMax;

    /** 선호 숙소 타입 (예: "호텔", "게스트하우스", "에어비앤비") */
    @Column(name = "preferred_accommodation_type", length = 50)
    private String preferredAccommodationType;

    /** 선호 교통수단 (예: "대중교통", "렌터카", "도보") */
    @Column(name = "preferred_transportation", length = 50)
    private String preferredTransportation;

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getTravelStyle() { return travelStyle; }
    public void setTravelStyle(String travelStyle) { this.travelStyle = travelStyle; }
    public Integer getBudgetRangeMin() { return budgetRangeMin; }
    public void setBudgetRangeMin(Integer budgetRangeMin) { this.budgetRangeMin = budgetRangeMin; }
    public Integer getBudgetRangeMax() { return budgetRangeMax; }
    public void setBudgetRangeMax(Integer budgetRangeMax) { this.budgetRangeMax = budgetRangeMax; }
    public String getPreferredAccommodationType() { return preferredAccommodationType; }
    public void setPreferredAccommodationType(String preferredAccommodationType) { this.preferredAccommodationType = preferredAccommodationType; }
    public String getPreferredTransportation() { return preferredTransportation; }
    public void setPreferredTransportation(String preferredTransportation) { this.preferredTransportation = preferredTransportation; }
}


