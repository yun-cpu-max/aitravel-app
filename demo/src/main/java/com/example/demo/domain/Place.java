package com.example.demo.domain;

/**
 * Place 엔티티
 * - 명소/맛집 등 POI 기본 정보를 저장합니다.
 * - 필요 시 opening_hours, tags 등은 별도 테이블 또는 JSON 컬럼으로 확장합니다.
 */

import jakarta.persistence.*;

/**
 * @Entity: JPA 엔티티임을 표시. 데이터베이스 테이블과 매핑되는 클래스
 * @Table: 매핑할 테이블명 지정 (name = "places")
 */
@Entity
@Table(name = "places")
public class Place {
    /**
     * @Id: 기본키(Primary Key) 필드 지정
     * @GeneratedValue: 자동 생성 전략 설정
     * strategy = GenerationType.IDENTITY: DB의 AUTO_INCREMENT 사용
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 장소명 (예: "에펠탑", "카페 드 플뢰르") */
    @Column(nullable = false, length = 200)
    private String name;

    /** 도시명 (예: "파리", "서울") */
    @Column(nullable = false, length = 100)
    private String city;

    /** 국가명 (예: "프랑스", "대한민국") */
    @Column(nullable = false, length = 100)
    private String country;

    /**
     * 카테고리 (예: "attraction", "restaurant", "shopping", "accommodation")
     * length = 50: VARCHAR(50) 크기 제한
     */
    @Column(length = 50)
    private String category; // attraction, restaurant, shopping, accommodation

    /**
     * 위도 (정밀도: 소수점 8자리까지)
     * precision = 10: 전체 자릿수 10자리
     * scale = 8: 소수점 이하 8자리
     */
    @Column(precision = 10, scale = 8)
    private java.math.BigDecimal latitude;

    /**
     * 경도 (정밀도: 소수점 8자리까지)
     * precision = 11: 전체 자릿수 11자리 (경도는 위도보다 범위가 넓음)
     * scale = 8: 소수점 이하 8자리
     */
    @Column(precision = 11, scale = 8)
    private java.math.BigDecimal longitude;

    /** 장소 설명 (TEXT 타입으로 긴 내용 저장 가능) */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * 평균 평점 (정밀도: 소수점 2자리까지, 예: 4.25)
     * precision = 3: 전체 자릿수 3자리
     * scale = 2: 소수점 이하 2자리
     */
    @Column(name = "average_rating", precision = 3, scale = 2)
    private java.math.BigDecimal averageRating;

    /** 평균 비용 (원 단위) */
    @Column(name = "average_cost")
    private Integer averageCost;

    // opening_hours, tags 등은 후속 작업에서 별도 테이블/JSON으로 확장 가능

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public java.math.BigDecimal getLatitude() { return latitude; }
    public void setLatitude(java.math.BigDecimal latitude) { this.latitude = latitude; }
    public java.math.BigDecimal getLongitude() { return longitude; }
    public void setLongitude(java.math.BigDecimal longitude) { this.longitude = longitude; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public java.math.BigDecimal getAverageRating() { return averageRating; }
    public void setAverageRating(java.math.BigDecimal averageRating) { this.averageRating = averageRating; }
    public Integer getAverageCost() { return averageCost; }
    public void setAverageCost(Integer averageCost) { this.averageCost = averageCost; }
}


