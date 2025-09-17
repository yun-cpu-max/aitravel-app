package com.example.demo.api;

/**
 * User REST 컨트롤러
 * - 사용자 생성 및 조회 API 제공
 *   - GET /api/users : 사용자 목록 조회
 *   - POST /api/users : 사용자 생성(간단 데모용, 실제 서비스는 DTO/검증/암호화 적용)
 */

import com.example.demo.domain.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.api.dto.UserDtos;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;
import jakarta.validation.Valid;

/**
 * @RestController: REST API 컨트롤러임을 표시
 * - @Controller + @ResponseBody의 조합
 * - 모든 메소드의 반환값이 HTTP 응답 본문으로 직렬화됨
 * @RequestMapping: 클래스 레벨 URL 매핑
 * - value = "/api/users": 모든 메소드의 기본 URL 경로
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    /** User 엔티티를 위한 Repository (의존성 주입) */
    private final UserRepository userRepository;

    /**
     * 생성자 기반 의존성 주입
     * - Spring이 자동으로 UserRepository 빈을 주입
     * - final 필드로 불변성 보장
     */
    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * @GetMapping: HTTP GET 요청 매핑
     * - URL: GET /api/users
     * - 사용자 목록을 조회하여 DTO로 변환하여 반환
     * 
     * @return 사용자 목록 (UserDtos.Resp 리스트)
     */
    @GetMapping
    public List<UserDtos.Resp> list() {
        return userRepository.findAll().stream().map(this::toResp).collect(Collectors.toList());
    }

    /**
     * @PostMapping: HTTP POST 요청 매핑
     * - URL: POST /api/users
     * - @Valid: 요청 본문의 유효성 검증 활성화
     * - @RequestBody: HTTP 요청 본문을 UserDtos.CreateReq 객체로 변환
     * - ResponseEntity: HTTP 상태 코드와 함께 응답 반환
     * 
     * @param req 사용자 생성 요청 데이터 (이메일, 비밀번호, 이름)
     * @return 생성된 사용자 정보 (UserDtos.Resp)
     */
    @PostMapping
    public ResponseEntity<UserDtos.Resp> create(@Valid @RequestBody UserDtos.CreateReq req) {
        // NOTE: 실제 서비스에서는 비밀번호 해시 필수 (예: BCrypt)
        User u = new User();
        u.setEmail(req.email);
        u.setPasswordHash(req.password); // 데모용. 운영에서는 반드시 해시 적용!
        u.setName(req.name);
        User saved = userRepository.save(u);
        return ResponseEntity.ok(toResp(saved));
    }

    /**
     * User 엔티티를 UserDtos.Resp DTO로 변환하는 헬퍼 메소드
     * - 엔티티의 민감한 정보(비밀번호 등)를 제외하고 필요한 정보만 반환
     * 
     * @param u 변환할 User 엔티티
     * @return UserDtos.Resp DTO
     */
    private UserDtos.Resp toResp(User u) {
        UserDtos.Resp r = new UserDtos.Resp();
        r.id = u.getId();
        r.email = u.getEmail();
        r.name = u.getName();
        r.createdAt = u.getCreatedAt();
        return r;
    }
}


