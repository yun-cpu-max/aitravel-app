package com.example.demo.repository;

import com.example.demo.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * User 엔티티를 위한 Repository 인터페이스
 * - JpaRepository<User, Long>: User 엔티티의 기본 CRUD 메소드 제공
 * - User: 엔티티 타입
 * - Long: 기본키 타입
 */
public interface UserRepository extends JpaRepository<User, Long> {
    /**
     * 이메일로 사용자 조회
     * - Spring Data JPA가 메소드명을 분석하여 자동으로 쿼리 생성
     * - findByEmail: WHERE email = ? 조건으로 SELECT 쿼리 생성
     * - Optional<User>: 결과가 없을 수 있으므로 Optional로 반환
     * 
     * @param email 조회할 이메일 주소
     * @return 해당 이메일의 사용자 (없으면 Optional.empty())
     */
    Optional<User> findByEmail(String email);
}


