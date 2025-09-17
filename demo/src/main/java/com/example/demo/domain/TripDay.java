package com.example.demo.domain;

/**
 * TripDay 엔티티
 * - 특정 여행의 N일차 정보를 보관합니다.
 * - 날씨 정보는 간단히 JSON 문자열로 저장합니다.
 */

import jakarta.persistence.*;
import java.time.LocalDate;

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

    /**
     * @Lob: 대용량 데이터 타입 (TEXT, CLOB 등)
     * 날씨 정보를 JSON 문자열로 저장 (예: {"temp": 15, "weather": "맑음"})
     * DB에서 jsonb로 매핑하려면 AttributeConverter 추가 가능
     */
    @Lob
    @Column(name = "weather_info")
    private String weatherInfo;

    public Long getId() { return id; }
    public Trip getTrip() { return trip; }
    public void setTrip(Trip trip) { this.trip = trip; }
    public Integer getDayNumber() { return dayNumber; }
    public void setDayNumber(Integer dayNumber) { this.dayNumber = dayNumber; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getWeatherInfo() { return weatherInfo; }
    public void setWeatherInfo(String weatherInfo) { this.weatherInfo = weatherInfo; }
}


