package com.example.demo;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController // 이 클래스가 REST API를 처리하는 컨트롤러임을 명시합니다.
public class HelloController {

    @GetMapping("/hello") // GET 요청이 /hello 경로로 오면 이 메서드가 처리합니다.
    public String hello() {
        return "Hello, Spring Boot!";
    }
}