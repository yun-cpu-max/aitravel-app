package com.example.demo.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * 비밀번호 암호화/검증 서비스
 * - BCrypt를 사용한 비밀번호 해싱
 * - 비밀번호 검증 기능 제공
 */
@Service
public class PasswordService {
    
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    
    /**
     * 비밀번호를 해싱합니다.
     * 
     * @param rawPassword 원본 비밀번호
     * @return 해싱된 비밀번호
     */
    public String encodePassword(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }
    
    /**
     * 원본 비밀번호와 해싱된 비밀번호가 일치하는지 확인합니다.
     * 
     * @param rawPassword 원본 비밀번호
     * @param encodedPassword 해싱된 비밀번호
     * @return 일치 여부
     */
    public boolean matches(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }
}
