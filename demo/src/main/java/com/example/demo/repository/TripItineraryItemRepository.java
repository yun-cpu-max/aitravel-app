package com.example.demo.repository;

import com.example.demo.domain.TripItineraryItem;
import com.example.demo.domain.TripDay;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * TripItineraryItem 엔티티를 위한 Repository 인터페이스
 * - JpaRepository<TripItineraryItem, Long>: TripItineraryItem 엔티티의 기본 CRUD 메소드 제공
 * - TripItineraryItem: 엔티티 타입
 * - Long: 기본키 타입
 */
public interface TripItineraryItemRepository extends JpaRepository<TripItineraryItem, Long> {
    /**
     * 특정 일차의 일정 항목들을 순서대로 조회
     * - Spring Data JPA가 메소드명을 분석하여 자동으로 쿼리 생성
     * - findByTripDay: WHERE trip_day = ? 조건으로 SELECT 쿼리 생성
     * - OrderByOrderSequenceAsc: order_sequence 컬럼으로 오름차순 정렬
     * - List<TripItineraryItem>: 여러 개의 일정 항목이 있을 수 있으므로 List로 반환
     * 
     * @param tripDay 조회할 일차 객체
     * @return 해당 일차의 일정 항목 목록 (순서대로 정렬됨, 없으면 빈 리스트)
     */
    List<TripItineraryItem> findByTripDayOrderByOrderSequenceAsc(TripDay tripDay);
}


