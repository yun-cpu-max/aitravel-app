package com.example.demo.repository;

import com.example.demo.domain.TransportationInfo;
import com.example.demo.domain.Trip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * TransportationInfo 엔티티를 위한 Repository 인터페이스
 * - JpaRepository<TransportationInfo, Long>: TransportationInfo 엔티티의 기본 CRUD 메소드 제공
 * - TransportationInfo: 엔티티 타입
 * - Long: 기본키 타입
 */
public interface TransportationInfoRepository extends JpaRepository<TransportationInfo, Long> {
    /**
     * 특정 여행의 교통편 정보 목록 조회
     * - Spring Data JPA가 메소드명을 분석하여 자동으로 쿼리 생성
     * - findByTrip: WHERE trip = ? 조건으로 SELECT 쿼리 생성
     * - List<TransportationInfo>: 여러 개의 교통편이 있을 수 있으므로 List로 반환
     * 
     * @param trip 조회할 여행 객체
     * @return 해당 여행의 교통편 정보 목록 (없으면 빈 리스트)
     */
    List<TransportationInfo> findByTrip(Trip trip);
}


