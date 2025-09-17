package com.example.demo.domain;

/**
 * TripItineraryItem 엔티티
 * - Day별 세부 일정(명소/맛집/이동 등) 단위를 표현합니다.
 * - 지도 좌표, 시간, 비용, 이동수단, 정렬순서를 포함합니다.
 */

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalTime;

/**
 * @Entity: JPA 엔티티임을 표시. 데이터베이스 테이블과 매핑되는 클래스
 * @Table: 매핑할 테이블명 지정 (name = "trip_itinerary_items")
 */
@Entity
@Table(name = "trip_itinerary_items")
public class TripItineraryItem {
    /**
     * @Id: 기본키(Primary Key) 필드 지정
     * @GeneratedValue: 자동 생성 전략 설정
     * strategy = GenerationType.IDENTITY: DB의 AUTO_INCREMENT 사용
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * @ManyToOne: N:1 관계 매핑 (여러 일정 항목 : 한 일차)
     * fetch = FetchType.LAZY: 지연 로딩 (필요할 때만 DB에서 조회)
     * @JoinColumn: 외래키 컬럼명 지정 (name = "trip_day_id")
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_day_id")
    private TripDay tripDay;

    /** 일정 제목 (예: "에펠탑 관광", "맛집 점심") */
    @Column(nullable = false, length = 200)
    private String title;

    /** 상세 설명 (TEXT 타입으로 긴 내용 저장 가능) */
    @Column(columnDefinition = "TEXT")
    private String description;

    /** 장소명 (예: "에펠탑", "카페 드 플뢰르") */
    @Column(name = "location_name", length = 200)
    private String locationName;

    /**
     * 위도 (정밀도: 소수점 8자리까지)
     * precision = 10: 전체 자릿수 10자리
     * scale = 8: 소수점 이하 8자리
     */
    @Column(precision = 10, scale = 8)
    private BigDecimal latitude;

    /**
     * 경도 (정밀도: 소수점 8자리까지)
     * precision = 11: 전체 자릿수 11자리 (경도는 위도보다 범위가 넓음)
     * scale = 8: 소수점 이하 8자리
     */
    @Column(precision = 11, scale = 8)
    private BigDecimal longitude;

    /** 시작 시간 (예: 09:00) */
    private LocalTime startTime;

    /** 종료 시간 (예: 11:30) */
    private LocalTime endTime;

    /** 예상 비용 (원 단위) */
    @Column(name = "estimated_cost")
    private Integer estimatedCost;

    /** 카테고리 (예: "관광", "식사", "쇼핑", "교통") */
    @Column(length = 50)
    private String category;

    /** 이동 수단 (예: "지하철", "택시", "도보", "버스") */
    @Column(name = "transportation_type", length = 50)
    private String transportationType;

    /** 이동 소요 시간 (분 단위) */
    @Column(name = "transportation_duration")
    private Integer transportationDuration;

    /** 이동 비용 (원 단위) */
    @Column(name = "transportation_cost")
    private Integer transportationCost;

    /** 일정 순서 (같은 일차 내에서의 순서) */
    @Column(name = "order_sequence", nullable = false)
    private Integer orderSequence;

    /** 확정 여부 (기본값: false, 사용자가 확정했는지 여부) */
    @Column(name = "is_confirmed")
    private Boolean isConfirmed = false;

    public Long getId() { return id; }
    public TripDay getTripDay() { return tripDay; }
    public void setTripDay(TripDay tripDay) { this.tripDay = tripDay; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getLocationName() { return locationName; }
    public void setLocationName(String locationName) { this.locationName = locationName; }
    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }
    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }
    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
    public Integer getEstimatedCost() { return estimatedCost; }
    public void setEstimatedCost(Integer estimatedCost) { this.estimatedCost = estimatedCost; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getTransportationType() { return transportationType; }
    public void setTransportationType(String transportationType) { this.transportationType = transportationType; }
    public Integer getTransportationDuration() { return transportationDuration; }
    public void setTransportationDuration(Integer transportationDuration) { this.transportationDuration = transportationDuration; }
    public Integer getTransportationCost() { return transportationCost; }
    public void setTransportationCost(Integer transportationCost) { this.transportationCost = transportationCost; }
    public Integer getOrderSequence() { return orderSequence; }
    public void setOrderSequence(Integer orderSequence) { this.orderSequence = orderSequence; }
    public Boolean getConfirmed() { return isConfirmed; }
    public void setConfirmed(Boolean confirmed) { isConfirmed = confirmed; }
}


