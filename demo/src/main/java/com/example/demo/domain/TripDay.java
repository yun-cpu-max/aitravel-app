package com.example.demo.domain;

/**
 * TripDay 엔티티
 * - 특정 여행의 N일차 정보를 보관합니다.
 * - 날씨 정보는 간단히 JSON 문자열로 저장합니다.
 */

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * @Entity: JPA 엔티티임을 표시. 데이터베이스 테이블과 매핑되는 클래스
 * @Table: 매핑할 테이블명 지정 (name = "trip_days")
 */
@Entity
@Table(name = "trip_days")
public class TripDay {
    /**
     * @Id: 기본키(Primary Key) 필드 지정
     * @GeneratedValue: 자동 생성 전략 설정
     * strategy = GenerationType.IDENTITY: DB의 AUTO_INCREMENT 사용
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * @ManyToOne: N:1 관계 매핑 (여러 일차 : 한 여행)
     * fetch = FetchType.LAZY: 지연 로딩 (필요할 때만 DB에서 조회)
     * @JoinColumn: 외래키 컬럼명 지정 (name = "trip_id")
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id")
    private Trip trip;

    /** 여행 일차 (1일차, 2일차, 3일차...) */
    @Column(name = "day_number", nullable = false)
    private Integer dayNumber;

    /** 해당 일차의 실제 날짜 (예: 2025-01-15) */
    @Column(nullable = false)
    private LocalDate date;

    /** 일일 시작 시간 (예: 09:00) */
    @Column(name = "day_start_time")
    private LocalTime dayStartTime;

    /** 일일 종료 시간 (예: 22:00) */
    @Column(name = "day_end_time")
    private LocalTime dayEndTime;

    /**
     * @Lob: 대용량 데이터 타입 (TEXT, CLOB 등)
     * 숙소 정보를 JSON 문자열로 저장
     * 예: {"name": "파리 호텔", "placeId": "...", "lat": 48.xxx, "lng": 2.xxx, "address": "..."}
     */
    @Lob
    @Column(name = "accommodation_json", columnDefinition = "TEXT")
    private String accommodationJson;

    /**
     * @OneToMany: 1:N 관계 매핑 (한 일차 : 여러 일정 항목)
     * cascade = CascadeType.ALL: TripDay 삭제 시 TripItineraryItem도 자동 삭제
     * orphanRemoval = true: 연결이 끊어진 TripItineraryItem 자동 삭제
     */
    @OneToMany(mappedBy = "tripDay", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TripItineraryItem> itineraryItems = new ArrayList<>();

    public Long getId() { return id; }
    public Trip getTrip() { return trip; }
    public void setTrip(Trip trip) { this.trip = trip; }
    public Integer getDayNumber() { return dayNumber; }
    public void setDayNumber(Integer dayNumber) { this.dayNumber = dayNumber; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public LocalTime getDayStartTime() { return dayStartTime; }
    public void setDayStartTime(LocalTime dayStartTime) { this.dayStartTime = dayStartTime; }
    public LocalTime getDayEndTime() { return dayEndTime; }
    public void setDayEndTime(LocalTime dayEndTime) { this.dayEndTime = dayEndTime; }
    public String getAccommodationJson() { return accommodationJson; }
    public void setAccommodationJson(String accommodationJson) { this.accommodationJson = accommodationJson; }
    public List<TripItineraryItem> getItineraryItems() { return itineraryItems; }
    public void setItineraryItems(List<TripItineraryItem> itineraryItems) { this.itineraryItems = itineraryItems; }
}


