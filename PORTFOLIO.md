# AI 기반 여행 계획 애플리케이션 개발 프로젝트

## 한 줄 요약
Spring Boot와 React를 활용한 풀스택 AI 여행 계획 애플리케이션으로, Google Maps API 연동을 통한 실시간 장소 검색 및 경로 최적화 기능을 제공합니다.

## 주요 기능

• 여행 계획 생성, AI 기반 일정 자동 생성, 실시간 장소 검색

• 교통 경로 최적화, 사용자 인증(JWT/OAuth2), 여행 대시보드

## 나의 역할 및 기여 (Full-Stack)

• 백엔드: Spring Boot RESTful API 설계·구현, JWT/OAuth2 인증, Google Maps API 프록시 서버, PostgreSQL 스키마 설계

• 프론트엔드: React SPA 구현, React Router 상태 관리, Tailwind CSS 반응형 UI, Google Maps 지도 연동

• 데이터베이스: PostgreSQL 관계형 DB 설계, JPA 엔티티 매핑 및 최적화

## 도전과제 및 해결

• **문제**: JPA LAZY 로딩으로 인한 LazyInitializationException 발생 - 여행 상세 조회 시 Trip → TripDay → TripItineraryItem 관계에서 세션이 종료된 후 컬렉션 접근 시 에러 발생

• **해결**: @Transactional 어노테이션과 수동 LAZY 초기화 로직을 추가하여 트랜잭션 내에서 모든 연관 엔티티를 미리 로드하도록 수정. 여러 번의 시행착오를 통해 적절한 초기화 시점과 예외 처리 로직을 구현

• **문제**: Google Places API 응답의 복잡한 중첩 JSON 구조 파싱 - API 응답이 동적 타입으로 반환되어 타입 캐스팅 실패와 NullPointerException이 빈번히 발생

• **해결**: 각 단계마다 instanceof 체크와 null 검증을 추가하고, 안전한 타입 변환 헬퍼 메서드를 구현하여 단계별 디버깅을 통해 안정적인 파싱 로직 완성

• **문제**: 프론트엔드에서 복잡한 상태 관리로 인한 버그 - 여행 계획 생성 페이지에서 10개 이상의 useState가 서로 의존하며, 상태 동기화 문제로 인한 예상치 못한 렌더링 오류 발생

• **해결**: 상태를 논리적으로 그룹화하고, useEffect 의존성 배열을 신중하게 설정하여 무한 루프를 방지. 여러 번의 리팩토링을 통해 상태 관리 구조를 단순화하고 디버깅 로그를 추가하여 문제 지점을 추적

• **문제**: 여행 일정 자동 생성 알고리즘의 최적화 문제 - 지리적 클러스터링, Nearest Neighbor 라우팅, 식사 시간대 배치, 카테고리 밸런싱을 동시에 고려해야 하는데, 초기 구현에서는 장소가 너무 멀리 배치되거나 시간이 부족한데 장소를 배치하는 문제 발생

• **해결**: 4단계 알고리즘으로 재설계 (클러스터링 → 일차 배정 → 동선 최적화 → 재분배). 거리/시간/카테고리 가중치를 반복 테스트하며 조정하고, 각 단계별 로그를 추가하여 알고리즘 동작을 검증. 특히 거리 가중치를 30점으로 증가시키고 균등 분배 가중치를 20점으로 감소시켜 거리 우선 배치를 달성

## 성과

• 초기 설정한 주요 기능 목표를 성공적으로 달성했습니다.

• Google Maps Platform API 실시간 연동 및 보안 프록시 패턴 구현 경험을 축적했습니다.

• 풀스택 개발을 통해 백엔드 API 설계부터 프론트엔드 사용자 경험까지 전 과정 구현 역량을 확보했습니다.

## 사용 기술

**Backend**: Spring Boot, Spring Security, Spring Data JPA, PostgreSQL, Redis, JWT, OAuth2, Google Maps Platform API

**Frontend**: React, Vite, React Router, Tailwind CSS, Google Maps JavaScript API

