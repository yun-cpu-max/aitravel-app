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

    /** Google Place ID (장소 고유 식별자) */
    @Column(name = "place_id", length = 255)
    private String placeId;

    /** 일정 제목 (예: "에펠탑 관광", "맛집 점심") */
    @Column(nullable = false, length = 200)
    private String title;

    /** 상세 설명 (TEXT 타입으로 긴 내용 저장 가능) */
    @Column(columnDefinition = "TEXT")
    private String description;

    /** 장소명 (예: "에펠탑", "카페 드 플뢰르") */
    @Column(name = "location_name", length = 200)
    private String locationName;

    /** 주소 (예: "Champ de Mars, 5 Avenue Anatole France, 75007 Paris") */
    @Column(columnDefinition = "TEXT")
    private String address;

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

    /** 카테고리 (예: "tourist_attraction", "restaurant", "cafe") */
    @Column(length = 50)
    private String category;

    /** 예상 체류 시간 (분) */
    @Column(name = "stay_duration_minutes")
    private Integer stayDurationMinutes;

    /** 다음 장소까지의 거리 (km) */
    @Column(name = "travel_to_next_distance_km", precision = 10, scale = 2)
    private BigDecimal travelToNextDistanceKm;

    /** 다음 장소까지의 이동 소요 시간 (분) */
    @Column(name = "travel_to_next_duration_minutes")
    private Integer travelToNextDurationMinutes;

    /** 다음 장소까지의 이동 수단 (예: "DRIVE", "TRANSIT", "WALK") */
    @Column(name = "travel_to_next_mode", length = 20)
    private String travelToNextMode;

    /** 일정 순서 (같은 일차 내에서의 순서) */
    @Column(name = "order_sequence", nullable = false)
    private Integer orderSequence;

    public Long getId() { return id; }
    public TripDay getTripDay() { return tripDay; }
    public void setTripDay(TripDay tripDay) { this.tripDay = tripDay; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getPlaceId() { return placeId; }
    public void setPlaceId(String placeId) { this.placeId = placeId; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getLocationName() { return locationName; }
    public void setLocationName(String locationName) { this.locationName = locationName; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }
    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }
    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Integer getStayDurationMinutes() { return stayDurationMinutes; }
    public void setStayDurationMinutes(Integer stayDurationMinutes) { this.stayDurationMinutes = stayDurationMinutes; }
    public BigDecimal getTravelToNextDistanceKm() { return travelToNextDistanceKm; }
    public void setTravelToNextDistanceKm(BigDecimal travelToNextDistanceKm) { this.travelToNextDistanceKm = travelToNextDistanceKm; }
    public Integer getTravelToNextDurationMinutes() { return travelToNextDurationMinutes; }
    public void setTravelToNextDurationMinutes(Integer travelToNextDurationMinutes) { this.travelToNextDurationMinutes = travelToNextDurationMinutes; }
    public String getTravelToNextMode() { return travelToNextMode; }
    public void setTravelToNextMode(String travelToNextMode) { this.travelToNextMode = travelToNextMode; }
    public Integer getOrderSequence() { return orderSequence; }
    public void setOrderSequence(Integer orderSequence) { this.orderSequence = orderSequence; }
}


