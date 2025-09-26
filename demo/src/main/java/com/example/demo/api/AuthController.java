package com.example.demo.api;

import com.example.demo.api.dto.UserDtos;
import com.example.demo.domain.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.JwtService;
import com.example.demo.service.PasswordService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * 인증 관련 컨트롤러
 * - 회원가입
 * - 로그인
 * - 토큰 검증
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordService passwordService;
    
    @Autowired
    private JwtService jwtService;
    
    /**
     * 회원가입
     * 
     * @param request 회원가입 요청 데이터
     * @return 회원가입 결과
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody UserDtos.CreateReq request) {
        try {
            // 이메일 중복 확인
            if (userRepository.findByEmail(request.email).isPresent()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "이미 존재하는 이메일입니다.");
                return ResponseEntity.badRequest().body(error);
            }
            
            // 사용자 생성
            User user = new User();
            user.setEmail(request.email);
            user.setPasswordHash(passwordService.encodePassword(request.password));
            user.setName(request.name);
            // createdAt, updatedAt은 @PrePersist에서 자동 설정됨
            
            // 사용자 저장
            User savedUser = userRepository.save(user);
            
            // JWT 토큰 생성
            String token = jwtService.generateToken(savedUser.getId(), savedUser.getEmail());
            
            // 응답 데이터 생성
            Map<String, Object> response = new HashMap<>();
            response.put("message", "회원가입이 완료되었습니다.");
            response.put("token", token);
            response.put("user", createUserResponse(savedUser));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "회원가입 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * 로그인
     * 
     * @param request 로그인 요청 데이터
     * @return 로그인 결과
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String password = request.get("password");
            
            if (email == null || password == null) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "이메일과 비밀번호를 입력해주세요.");
                return ResponseEntity.badRequest().body(error);
            }
            
            // 사용자 조회
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "존재하지 않는 이메일입니다.");
                return ResponseEntity.badRequest().body(error);
            }
            
            User user = userOpt.get();
            
            // 비밀번호 확인
            if (!passwordService.matches(password, user.getPasswordHash())) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "비밀번호가 일치하지 않습니다.");
                return ResponseEntity.badRequest().body(error);
            }
            
            // JWT 토큰 생성
            String token = jwtService.generateToken(user.getId(), user.getEmail());
            
            // 응답 데이터 생성
            Map<String, Object> response = new HashMap<>();
            response.put("message", "로그인이 완료되었습니다.");
            response.put("token", token);
            response.put("user", createUserResponse(user));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "로그인 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * 토큰 검증
     * 
     * @param request 토큰 검증 요청
     * @return 토큰 검증 결과
     */
    @PostMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            
            if (token == null) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "토큰이 필요합니다.");
                return ResponseEntity.badRequest().body(error);
            }
            
            // 토큰에서 사용자 정보 추출
            Long userId = jwtService.extractUserId(token);
            String email = jwtService.extractEmail(token);
            
            // 사용자 조회
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "존재하지 않는 사용자입니다.");
                return ResponseEntity.badRequest().body(error);
            }
            
            User user = userOpt.get();
            
            // 토큰 유효성 검증
            if (!jwtService.validateToken(token, user.getEmail())) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "유효하지 않은 토큰입니다.");
                return ResponseEntity.badRequest().body(error);
            }
            
            // 응답 데이터 생성
            Map<String, Object> response = new HashMap<>();
            response.put("valid", true);
            response.put("user", createUserResponse(user));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "토큰 검증 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * 사용자 응답 데이터 생성
     * 
     * @param user 사용자 엔티티
     * @return 사용자 응답 데이터
     */
    private Map<String, Object> createUserResponse(User user) {
        Map<String, Object> userResponse = new HashMap<>();
        userResponse.put("id", user.getId());
        userResponse.put("email", user.getEmail());
        userResponse.put("name", user.getName());
        userResponse.put("provider", user.getProvider());
        userResponse.put("profileImageUrl", user.getProfileImageUrl());
        userResponse.put("createdAt", user.getCreatedAt());
        return userResponse;
    }
}
