package com.example.demo.api;

/**
 * Trip REST 컨트롤러
 * - 여행 계획 생성/조회 API 제공
 *   - GET /api/trips : 여행 목록 조회
 *   - POST /api/trips/user/{userId} : 특정 사용자에 대한 여행 생성
 */

import com.example.demo.domain.Trip;
import com.example.demo.domain.User;
import com.example.demo.repository.TripRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.api.dto.TripDtos;
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
 * - value = "/api/trips": 모든 메소드의 기본 URL 경로
 */
@RestController
@RequestMapping("/api/trips")
public class TripController {

    /** Trip 엔티티를 위한 Repository (의존성 주입) */
    private final TripRepository tripRepository;
    
    /** User 엔티티를 위한 Repository (의존성 주입) */
    private final UserRepository userRepository;

    /**
     * 생성자 기반 의존성 주입
     * - Spring이 자동으로 Repository 빈들을 주입
     * - final 필드로 불변성 보장
     */
    public TripController(TripRepository tripRepository, UserRepository userRepository) {
        this.tripRepository = tripRepository;
        this.userRepository = userRepository;
    }

    /**
     * @GetMapping: HTTP GET 요청 매핑
     * - URL: GET /api/trips
     * - 모든 여행 목록을 조회하여 DTO로 변환하여 반환
     * 
     * @return 여행 목록 (TripDtos.Resp 리스트)
     */
    @GetMapping
    public List<TripDtos.Resp> list() {
        return tripRepository.findAll().stream().map(this::toResp).collect(Collectors.toList());
    }

    /**
     * @PostMapping: HTTP POST 요청 매핑
     * - URL: POST /api/trips/user/{userId}
     * - @PathVariable: URL 경로의 {userId} 부분을 메소드 파라미터로 바인딩
     * - @Valid: 요청 본문의 유효성 검증 활성화
     * - @RequestBody: HTTP 요청 본문을 TripDtos.CreateReq 객체로 변환
     * - ResponseEntity: HTTP 상태 코드와 함께 응답 반환
     * 
     * @param userId 여행을 생성할 사용자 ID
     * @param req 여행 생성 요청 데이터 (제목, 여행지, 기간, 인원, 예산)
     * @return 생성된 여행 정보 (TripDtos.Resp)
     */
    @PostMapping("/user/{userId}")
    public ResponseEntity<TripDtos.Resp> createForUser(@PathVariable Long userId, @Valid @RequestBody TripDtos.CreateReq req) {
        // 사용자 ID로 사용자 조회 (없으면 예외 발생)
        User user = userRepository.findById(userId).orElseThrow();
        
        // 새로운 여행 엔티티 생성 및 설정
        Trip t = new Trip();
        t.setUser(user);
        t.setTitle(req.title);
        t.setDestination(req.destination);
        t.setStartDate(req.startDate);
        t.setEndDate(req.endDate);
        t.setNumAdults(req.numAdults);
        t.setNumChildren(req.numChildren);
        t.setTotalBudget(req.totalBudget);
        
        // 여행 저장 및 반환
        Trip saved = tripRepository.save(t);
        return ResponseEntity.ok(toResp(saved));
    }

    /**
     * Trip 엔티티를 TripDtos.Resp DTO로 변환하는 헬퍼 메소드
     * - 엔티티의 모든 필요한 정보를 DTO로 변환
     * 
     * @param t 변환할 Trip 엔티티
     * @return TripDtos.Resp DTO
     */
    private TripDtos.Resp toResp(Trip t) {
        TripDtos.Resp r = new TripDtos.Resp();
        r.id = t.getId();
        r.title = t.getTitle();
        r.destination = t.getDestination();
        r.startDate = t.getStartDate();
        r.endDate = t.getEndDate();
        r.numAdults = t.getNumAdults();
        r.numChildren = t.getNumChildren();
        r.totalBudget = t.getTotalBudget();
        r.status = t.getStatus();
        return r;
    }
}


