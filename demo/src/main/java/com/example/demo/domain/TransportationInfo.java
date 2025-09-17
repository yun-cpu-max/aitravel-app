package com.example.demo.domain;

/**
 * TransportationInfo 엔티티
 * - 여행에 포함된 교통편(항공/열차/버스/차량) 정보를 저장합니다.
 */

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * @Entity: JPA 엔티티임을 표시. 데이터베이스 테이블과 매핑되는 클래스
 * @Table: 매핑할 테이블명 지정 (name = "transportation_info")
 */
@Entity
@Table(name = "transportation_info")
public class TransportationInfo {
    /**
     * @Id: 기본키(Primary Key) 필드 지정
     * @GeneratedValue: 자동 생성 전략 설정
     * strategy = GenerationType.IDENTITY: DB의 AUTO_INCREMENT 사용
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * @ManyToOne: N:1 관계 매핑 (여러 교통편 : 한 여행)
     * fetch = FetchType.LAZY: 지연 로딩 (필요할 때만 DB에서 조회)
     * @JoinColumn: 외래키 컬럼명 지정 (name = "trip_id")
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id")
    private Trip trip;

    /**
     * 교통편 종류 (예: "flight", "train", "bus", "car")
     * nullable = false: 필수 입력
     * length = 20: VARCHAR(20) 크기 제한
     */
    @Column(nullable = false, length = 20)
    private String type; // flight, train, bus, car

    /** 출발지 (예: "인천공항", "서울역") */
    @Column(name = "departure_location", length = 100)
    private String departureLocation;

    /** 도착지 (예: "파리 샤를 드 골 공항", "파리 북역") */
    @Column(name = "arrival_location", length = 100)
    private String arrivalLocation;

    /** 출발 일시 (예: 2025-01-15 14:30) */
    @Column(name = "departure_datetime")
    private LocalDateTime departureDateTime;

    /** 도착 일시 (예: 2025-01-15 20:45) */
    @Column(name = "arrival_datetime")
    private LocalDateTime arrivalDateTime;

    /** 예약 번호/참조 코드 (예: "KE001", "TGV123456") */
    @Column(name = "booking_reference", length = 100)
    private String bookingReference;

    /** 교통편 비용 (원 단위) */
    private Integer cost;

    public Long getId() { return id; }
    public Trip getTrip() { return trip; }
    public void setTrip(Trip trip) { this.trip = trip; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getDepartureLocation() { return departureLocation; }
    public void setDepartureLocation(String departureLocation) { this.departureLocation = departureLocation; }
    public String getArrivalLocation() { return arrivalLocation; }
    public void setArrivalLocation(String arrivalLocation) { this.arrivalLocation = arrivalLocation; }
    public LocalDateTime getDepartureDateTime() { return departureDateTime; }
    public void setDepartureDateTime(LocalDateTime departureDateTime) { this.departureDateTime = departureDateTime; }
    public LocalDateTime getArrivalDateTime() { return arrivalDateTime; }
    public void setArrivalDateTime(LocalDateTime arrivalDateTime) { this.arrivalDateTime = arrivalDateTime; }
    public String getBookingReference() { return bookingReference; }
    public void setBookingReference(String bookingReference) { this.bookingReference = bookingReference; }
    public Integer getCost() { return cost; }
    public void setCost(Integer cost) { this.cost = cost; }
}


