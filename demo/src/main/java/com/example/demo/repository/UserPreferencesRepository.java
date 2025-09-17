package com.example.demo.repository;

import com.example.demo.domain.UserPreferences;
import com.example.demo.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * UserPreferences 엔티티를 위한 Repository 인터페이스
 * - JpaRepository<UserPreferences, Long>: UserPreferences 엔티티의 기본 CRUD 메소드 제공
 * - UserPreferences: 엔티티 타입
 * - Long: 기본키 타입
 */
public interface UserPreferencesRepository extends JpaRepository<UserPreferences, Long> {
    /**
     * 특정 사용자의 취향 설정 조회
     * - Spring Data JPA가 메소드명을 분석하여 자동으로 쿼리 생성
     * - findByUser: WHERE user = ? 조건으로 SELECT 쿼리 생성
     * - Optional<UserPreferences>: 결과가 없을 수 있으므로 Optional로 반환
     * - 1:1 관계이므로 최대 1개의 결과만 반환
     * 
     * @param user 조회할 사용자 객체
     * @return 해당 사용자의 취향 설정 (없으면 Optional.empty())
     */
    Optional<UserPreferences> findByUser(User user);
}


