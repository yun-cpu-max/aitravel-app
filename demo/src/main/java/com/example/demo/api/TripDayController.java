package com.example.demo.api;

import com.example.demo.domain.Trip;
import com.example.demo.domain.TripDay;
import com.example.demo.repository.TripDayRepository;
import com.example.demo.repository.TripRepository;
import com.example.demo.api.dto.TripDayDtos;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

/**
 * TripDay REST 컨트롤러
 * - 특정 여행의 N일차(TripDay) CRUD 제공
 *   - GET /api/trips/{tripId}/days : 해당 여행의 일차 목록
 *   - POST /api/trips/{tripId}/days : 일차 생성
 *   - PUT /api/trip-days/{id} : 일차 수정
 *   - DELETE /api/trip-days/{id} : 일차 삭제
 */

/**
 * @RestController: REST API 컨트롤러임을 표시
 * - @Controller + @ResponseBody의 조합
 * - 모든 메소드의 반환값이 HTTP 응답 본문으로 직렬화됨
 * @RequestMapping: 클래스 레벨 URL 매핑
 * - value = "/api": 모든 메소드의 기본 URL 경로
 */
@RestController
@RequestMapping("/api")
public class TripDayController {

    /** TripDay 엔티티를 위한 Repository (의존성 주입) */
    private final TripDayRepository tripDayRepository;
    
    /** Trip 엔티티를 위한 Repository (의존성 주입) */
    private final TripRepository tripRepository;

    /**
     * 생성자 기반 의존성 주입
     * - Spring이 자동으로 Repository 빈들을 주입
     * - final 필드로 불변성 보장
     */
    public TripDayController(TripDayRepository tripDayRepository, TripRepository tripRepository) {
        this.tripDayRepository = tripDayRepository;
        this.tripRepository = tripRepository;
    }

    /**
     * @GetMapping: HTTP GET 요청 매핑
     * - URL: GET /api/trips/{tripId}/days
     * - @PathVariable: URL 경로의 {tripId} 부분을 메소드 파라미터로 바인딩
     * - 특정 여행의 모든 일차를 조회하여 DTO로 변환하여 반환
     * 
     * @param tripId 조회할 여행의 ID
     * @return 해당 여행의 일차 목록 (TripDayDtos.Resp 리스트)
     */
    @GetMapping("/trips/{tripId}/days")
    public List<TripDayDtos.Resp> listByTrip(@PathVariable Long tripId) {
        Trip trip = tripRepository.findById(tripId).orElseThrow();
        return tripDayRepository.findByTrip(trip).stream().map(this::toResp).collect(Collectors.toList());
    }

    /**
     * @PostMapping: HTTP POST 요청 매핑
     * - URL: POST /api/trips/{tripId}/days
     * - @PathVariable: URL 경로의 {tripId} 부분을 메소드 파라미터로 바인딩
     * - @Valid: 요청 본문의 유효성 검증 활성화
     * - @RequestBody: HTTP 요청 본문을 TripDayDtos.CreateOrUpdateReq 객체로 변환
     * - ResponseEntity: HTTP 상태 코드와 함께 응답 반환
     * 
     * @param tripId 일차를 생성할 여행의 ID
     * @param req 일차 생성 요청 데이터 (일차 번호, 날짜, 날씨 정보)
     * @return 생성된 일차 정보 (TripDayDtos.Resp)
     */
    @PostMapping("/trips/{tripId}/days")
    public ResponseEntity<TripDayDtos.Resp> create(@PathVariable Long tripId, @Valid @RequestBody TripDayDtos.CreateOrUpdateReq req) {
        // 여행 ID로 여행 조회 (없으면 예외 발생)
        Trip trip = tripRepository.findById(tripId).orElseThrow();
        
        // 새로운 일차 엔티티 생성 및 설정
        TripDay day = new TripDay();
        day.setTrip(trip);
        day.setDayNumber(req.dayNumber);
        day.setDate(req.date);
        day.setWeatherInfo(req.weatherInfo);
        
        // 일차 저장 및 반환
        TripDay saved = tripDayRepository.save(day);
        return ResponseEntity.ok(toResp(saved));
    }

    /**
     * @PutMapping: HTTP PUT 요청 매핑
     * - URL: PUT /api/trip-days/{id}
     * - @PathVariable: URL 경로의 {id} 부분을 메소드 파라미터로 바인딩
     * - @Valid: 요청 본문의 유효성 검증 활성화
     * - @RequestBody: HTTP 요청 본문을 TripDayDtos.CreateOrUpdateReq 객체로 변환
     * - ResponseEntity: HTTP 상태 코드와 함께 응답 반환
     * 
     * @param id 수정할 일차의 ID
     * @param req 일차 수정 요청 데이터 (일차 번호, 날짜, 날씨 정보)
     * @return 수정된 일차 정보 (TripDayDtos.Resp)
     */
    @PutMapping("/trip-days/{id}")
    public ResponseEntity<TripDayDtos.Resp> update(@PathVariable Long id, @Valid @RequestBody TripDayDtos.CreateOrUpdateReq req) {
        // 일차 ID로 일차 조회 (없으면 예외 발생)
        TripDay day = tripDayRepository.findById(id).orElseThrow();
        
        // 일차 정보 업데이트
        day.setDayNumber(req.dayNumber);
        day.setDate(req.date);
        day.setWeatherInfo(req.weatherInfo);
        
        // 일차 저장 및 반환
        TripDay saved = tripDayRepository.save(day);
        return ResponseEntity.ok(toResp(saved));
    }

    /**
     * @DeleteMapping: HTTP DELETE 요청 매핑
     * - URL: DELETE /api/trip-days/{id}
     * - @PathVariable: URL 경로의 {id} 부분을 메소드 파라미터로 바인딩
     * - ResponseEntity: HTTP 상태 코드와 함께 응답 반환
     * 
     * @param id 삭제할 일차의 ID
     * @return HTTP 204 No Content (성공적으로 삭제됨)
     */
    @DeleteMapping("/trip-days/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        tripDayRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * TripDay 엔티티를 TripDayDtos.Resp DTO로 변환하는 헬퍼 메소드
     * - 엔티티의 모든 필요한 정보를 DTO로 변환
     * 
     * @param day 변환할 TripDay 엔티티
     * @return TripDayDtos.Resp DTO
     */
    private TripDayDtos.Resp toResp(TripDay day) {
        TripDayDtos.Resp r = new TripDayDtos.Resp();
        r.id = day.getId();
        r.dayNumber = day.getDayNumber();
        r.date = day.getDate();
        r.weatherInfo = day.getWeatherInfo();
        return r;
    }
}


