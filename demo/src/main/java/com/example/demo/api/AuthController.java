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
            // 이메일 로그인 사용자 중복 확인 (provider가 null인 사용자만 체크)
            Optional<User> existingUser = userRepository.findByEmailAndProvider(request.email, null);
            if (existingUser.isPresent()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "이미 존재하는 이메일입니다.");
                return ResponseEntity.badRequest().body(error);
            }
            
            // 사용자 생성
            User user = new User();
            user.setEmail(request.email);
            user.setPasswordHash(passwordService.encodePassword(request.password));
            user.setName(request.name);
            user.setProvider(null); // 이메일 로그인은 provider가 null
            user.setProviderId(null);
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
            
            // 이메일 로그인 사용자만 조회 (provider가 null)
            Optional<User> userOpt = userRepository.findByEmailAndProvider(email, null);
            if (userOpt.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "존재하지 않는 이메일이거나 OAuth 로그인을 사용해주세요.");
                return ResponseEntity.badRequest().body(error);
            }
            
            User user = userOpt.get();
            
            // 비밀번호가 null인 경우 (OAuth 사용자) 체크
            if (user.getPasswordHash() == null) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "OAuth 로그인을 사용해주세요.");
                return ResponseEntity.badRequest().body(error);
            }
            
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
            
            // 토큰의 이메일과 사용자 이메일 일치 확인
            if (!email.equals(user.getEmail())) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "토큰의 사용자 정보가 일치하지 않습니다.");
                return ResponseEntity.badRequest().body(error);
            }
            
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
     * Google OAuth 로그인
     * 
     * @param request Google 로그인 요청 데이터
     * @return 로그인 결과
     */
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String name = request.get("name");
            String picture = request.get("picture");
            String googleId = request.get("googleId");
            
            if (email == null || googleId == null) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "필수 정보가 누락되었습니다.");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Google provider와 providerId로 기존 사용자 조회
            Optional<User> existingUserOpt = userRepository.findByProviderAndProviderId("google", googleId);
            
            User user;
            if (existingUserOpt.isPresent()) {
                // 기존 사용자: 정보 업데이트
                user = existingUserOpt.get();
                user.setName(name != null ? name : user.getName());
                user.setProfileImageUrl(picture != null ? picture : user.getProfileImageUrl());
                user.setEmail(email); // 이메일 업데이트 (변경 가능)
                // updatedAt은 @PreUpdate에서 자동 갱신됨
                user = userRepository.save(user);
            } else {
                // 신규 사용자: 생성
                // 같은 이메일로 이메일 로그인 사용자가 있는지 확인
                Optional<User> emailUserOpt = userRepository.findByEmailAndProvider(email, null);
                if (emailUserOpt.isPresent()) {
                    Map<String, String> error = new HashMap<>();
                    error.put("message", "이미 이메일로 가입된 계정입니다. 이메일 로그인을 사용해주세요.");
                    return ResponseEntity.badRequest().body(error);
                }
                
                user = new User();
                user.setEmail(email);
                user.setName(name != null ? name : email.split("@")[0]); // 이름이 없으면 이메일 앞부분 사용
                user.setProfileImageUrl(picture);
                user.setProvider("google");
                user.setProviderId(googleId);
                user.setPasswordHash(null); // OAuth 사용자는 비밀번호 없음
                // createdAt, updatedAt은 @PrePersist에서 자동 설정됨
                
                user = userRepository.save(user);
            }
            
            // JWT 토큰 생성
            String token = jwtService.generateToken(user.getId(), user.getEmail());
            
            // 응답 데이터 생성
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Google 로그인이 완료되었습니다.");
            response.put("token", token);
            response.put("user", createUserResponse(user));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Google 로그인 중 오류가 발생했습니다: " + e.getMessage());
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
        userResponse.put("providerId", user.getProviderId());
        userResponse.put("profileImageUrl", user.getProfileImageUrl());
        userResponse.put("createdAt", user.getCreatedAt());
        userResponse.put("updatedAt", user.getUpdatedAt());
        return userResponse;
    }
}
