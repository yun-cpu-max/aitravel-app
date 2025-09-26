package com.example.demo.domain;

/**
 * 사용자(User) 엔티티
 * - 회원의 계정/프로필 정보 및 생성/수정 시각을 관리합니다.
 * - 한 사용자는 여러 개의 여행(Trip)을 가질 수 있습니다.
 */

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * @Entity: JPA 엔티티임을 표시. 데이터베이스 테이블과 매핑되는 클래스
 * @Table: 매핑할 테이블명 지정 (name = "users")
 */
@Entity
@Table(name = "users")
public class User {
    /**
     * @Id: 기본키(Primary Key) 필드 지정
     * @GeneratedValue: 자동 생성 전략 설정
     * strategy = GenerationType.IDENTITY: DB의 AUTO_INCREMENT 사용
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * @Column: 컬럼 속성 설정
     * nullable = false: NOT NULL 제약조건
     * unique = true: UNIQUE 제약조건 (중복 불가)
     * length = 255: VARCHAR(255) 크기 제한
     */
    @Column(nullable = false, unique = true, length = 255)
    private String email;

    /**
     * @Column: 컬럼명을 password_hash로 지정
     * 실제 DB에는 해시된 비밀번호만 저장 (보안)
     */
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    /** 사용자 표시 이름 (실제 이름) */
    @Column(nullable = false, length = 100)
    private String name;

    /** 소셜 로그인 제공자 (예: "google", "kakao", "naver") */
    @Column(length = 50)
    private String provider;

    /** 소셜 로그인 제공자에서의 사용자 ID */
    @Column(name = "provider_id", length = 100)
    private String providerId;

    /** 프로필 이미지 URL */
    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    /**
     * @OneToMany: 1:N 관계 매핑 (한 사용자 : 여러 여행)
     * mappedBy = "user": Trip 엔티티의 user 필드가 연관관계의 주인
     * cascade = CascadeType.ALL: 부모 삭제 시 자식도 함께 삭제
     * orphanRemoval = true: 부모와 연결이 끊어진 자식 자동 삭제
     */
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Trip> trips = new ArrayList<>();

    /** 계정 생성 시각 (자동 설정) */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /** 마지막 수정 시각 (자동 갱신) */
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * @PrePersist: 엔티티가 DB에 저장되기 전에 실행되는 메소드
     * 생성 시각과 수정 시각을 현재 시간으로 자동 설정
     */
    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * @PreUpdate: 엔티티가 DB에서 수정되기 전에 실행되는 메소드
     * 수정 시각을 현재 시간으로 자동 갱신
     */
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getProviderId() { return providerId; }
    public void setProviderId(String providerId) { this.providerId = providerId; }
    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }
    public List<Trip> getTrips() { return trips; }
    public void setTrips(List<Trip> trips) { this.trips = trips; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}


