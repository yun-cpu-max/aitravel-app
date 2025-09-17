package com.example.demo.repository;

import com.example.demo.domain.Place;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Place 엔티티를 위한 Repository 인터페이스
 * - JpaRepository<Place, Long>: Place 엔티티의 기본 CRUD 메소드 제공
 * - Place: 엔티티 타입
 * - Long: 기본키 타입
 */
public interface PlaceRepository extends JpaRepository<Place, Long> {
    /**
     * 특정 도시와 국가의 장소 목록 조회
     * - Spring Data JPA가 메소드명을 분석하여 자동으로 쿼리 생성
     * - findByCityAndCountry: WHERE city = ? AND country = ? 조건으로 SELECT 쿼리 생성
     * - List<Place>: 여러 개의 장소가 있을 수 있으므로 List로 반환
     * 
     * @param city 조회할 도시명
     * @param country 조회할 국가명
     * @return 해당 도시/국가의 장소 목록 (없으면 빈 리스트)
     */
    List<Place> findByCityAndCountry(String city, String country);
    
    /**
     * 특정 카테고리의 장소 목록 조회
     * - Spring Data JPA가 메소드명을 분석하여 자동으로 쿼리 생성
     * - findByCategory: WHERE category = ? 조건으로 SELECT 쿼리 생성
     * - List<Place>: 여러 개의 장소가 있을 수 있으므로 List로 반환
     * 
     * @param category 조회할 카테고리 (예: "attraction", "restaurant", "shopping")
     * @return 해당 카테고리의 장소 목록 (없으면 빈 리스트)
     */
    List<Place> findByCategory(String category);
}


