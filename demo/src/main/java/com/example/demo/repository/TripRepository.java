package com.example.demo.repository;

import com.example.demo.domain.Trip;
import com.example.demo.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

/**
 * Trip 엔티티를 위한 Repository 인터페이스
 * - JpaRepository<Trip, Long>: Trip 엔티티의 기본 CRUD 메소드 제공
 * - Trip: 엔티티 타입
 * - Long: 기본키 타입
 */
public interface TripRepository extends JpaRepository<Trip, Long> {
    /**
     * 특정 사용자의 여행 목록 조회
     * - Spring Data JPA가 메소드명을 분석하여 자동으로 쿼리 생성
     * - findByUser: WHERE user = ? 조건으로 SELECT 쿼리 생성
     * - List<Trip>: 여러 개의 여행이 있을 수 있으므로 List로 반환
     * 
     * @param user 조회할 사용자 객체
     * @return 해당 사용자의 여행 목록 (없으면 빈 리스트)
     */
    List<Trip> findByUser(User user);

    /**
     * 대시보드용 간단 조회를 위한 Projection 인터페이스
     * - trips 테이블의 기본 컬럼만 조회
     */
    interface TripSummaryProjection {
        Long getId();
        String getTitle();
        String getDestination();
        String getDestinationPlaceId();
        LocalDate getStartDate();
        LocalDate getEndDate();
        Integer getNumAdults();
        Integer getNumChildren();
        String getStatus();
        Integer getDaysCount();
        Integer getTotalItineraryItemsCount();
    }

    /**
     * 모든 여행 기본 정보 조회 (일수/일정 개수는 서브쿼리로 집계)
     * - trips 테이블만 직접 조회하고, COUNT 서브쿼리만 사용하므로 MultipleBagFetchException과 무관
     */
    @Query(value = """
            SELECT 
                t.id,
                t.title,
                t.destination,
                t.destination_place_id AS destinationPlaceId,
                t.start_date AS startDate,
                t.end_date AS endDate,
                t.num_adults AS numAdults,
                t.num_children AS numChildren,
                t.status,
                (SELECT COUNT(*) FROM trip_days td WHERE td.trip_id = t.id) AS daysCount,
                (
                    SELECT COUNT(*)
                    FROM trip_itinerary_items ti
                    JOIN trip_days td2 ON ti.trip_day_id = td2.id
                    WHERE td2.trip_id = t.id
                ) AS totalItineraryItemsCount
            FROM trips t
            ORDER BY t.id ASC
            """, nativeQuery = true)
    List<TripSummaryProjection> findAllSummaries();
}


