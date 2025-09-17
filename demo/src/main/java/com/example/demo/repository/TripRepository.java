package com.example.demo.repository;

import com.example.demo.domain.Trip;
import com.example.demo.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

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
}


