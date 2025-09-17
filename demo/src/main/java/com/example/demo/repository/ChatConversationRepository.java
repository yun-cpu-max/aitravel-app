package com.example.demo.repository;

import com.example.demo.domain.ChatConversation;
import com.example.demo.domain.Trip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * ChatConversation 엔티티를 위한 Repository 인터페이스
 * - JpaRepository<ChatConversation, Long>: ChatConversation 엔티티의 기본 CRUD 메소드 제공
 * - ChatConversation: 엔티티 타입
 * - Long: 기본키 타입
 */
public interface ChatConversationRepository extends JpaRepository<ChatConversation, Long> {
    /**
     * 특정 여행의 채팅 대화 목록을 시간순으로 조회
     * - Spring Data JPA가 메소드명을 분석하여 자동으로 쿼리 생성
     * - findByTrip: WHERE trip = ? 조건으로 SELECT 쿼리 생성
     * - OrderByConversationTimestampAsc: conversation_timestamp 컬럼으로 오름차순 정렬
     * - List<ChatConversation>: 여러 개의 대화가 있을 수 있으므로 List로 반환
     * 
     * @param trip 조회할 여행 객체
     * @return 해당 여행의 채팅 대화 목록 (시간순으로 정렬됨, 없으면 빈 리스트)
     */
    List<ChatConversation> findByTripOrderByConversationTimestampAsc(Trip trip);
}


