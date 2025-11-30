package com.example.demo.api;

/**
 * Trip REST 컨트롤러
 * - 여행 계획 생성/조회 API 제공
 *   - GET /api/trips : 여행 목록 조회
 *   - POST /api/trips/user/{userId} : 특정 사용자에 대한 여행 생성
 */

import com.example.demo.domain.Trip;
import com.example.demo.domain.TripDay;
import com.example.demo.domain.TripItineraryItem;
import com.example.demo.domain.User;
import com.example.demo.repository.TripRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.api.dto.TripDtos;
import com.example.demo.api.dto.TripDayDtos;
import com.example.demo.api.dto.TripItineraryItemDtos;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
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
     * - URL: GET /api/trips/user/{userId}
     * - 특정 사용자의 여행 목록을 조회하여 DTO로 변환하여 반환
     * 
     * @param userId 조회할 사용자 ID
     * @return 해당 사용자의 여행 목록 (TripDtos.Resp 리스트)
     */
    @GetMapping("/user/{userId}")
    public List<TripDtos.Resp> listByUser(@PathVariable Long userId) {
        System.out.println("📋 사용자별 여행 목록 조회 요청 - 사용자 ID: " + userId);
        User user = userRepository.findById(userId).orElseThrow(() -> {
            System.err.println("❌ 사용자를 찾을 수 없음: " + userId);
            return new RuntimeException("사용자를 찾을 수 없습니다: " + userId);
        });
        System.out.println("✅ 사용자 확인: " + user.getName() + " (ID: " + user.getId() + ")");
        List<Trip> trips = tripRepository.findByUser(user);
        System.out.println("📊 조회된 여행 수: " + trips.size());
        List<TripDtos.Resp> result = trips.stream().map(this::toResp).collect(Collectors.toList());
        System.out.println("✅ 여행 목록 반환 완료 - " + result.size() + "개");
        return result;
    }

    /**
     * @GetMapping: HTTP GET 요청 매핑
     * - URL: GET /api/trips
     * - 모든 여행 목록을 조회하여 DTO로 변환하여 반환
     * - @EntityGraph를 통해 TripDays와 TripItineraryItems를 함께 로드
     * 
     * @return 여행 목록 (TripDtos.Resp 리스트)
     */
    @GetMapping
    public List<TripDtos.Resp> list() {
        System.out.println("📋 전체 여행 목록 조회 요청");
        // @EntityGraph를 통해 TripDays, ItineraryItems, User를 함께 로드
        List<Trip> trips = tripRepository.findAll();
        System.out.println("📊 조회된 여행 수: " + trips.size());
        
        // User와 TripDays를 명시적으로 초기화
        for (Trip trip : trips) {
            // User 초기화
            if (trip.getUser() != null) {
                trip.getUser().getId(); // User 초기화
            }
            // TripDays 초기화
            if (trip.getTripDays() != null) {
                trip.getTripDays().size(); // TripDays 초기화
                // 각 TripDay의 ItineraryItems 초기화
                for (TripDay day : trip.getTripDays()) {
                    if (day.getItineraryItems() != null) {
                        day.getItineraryItems().size(); // ItineraryItems 초기화
                    }
                }
            }
        }
        
        List<TripDtos.Resp> result = trips.stream().map(trip -> {
            TripDtos.Resp resp = toResp(trip);
            System.out.println("  - 여행 ID: " + resp.id + ", 제목: " + resp.title + ", 사용자 ID: " + resp.userId + ", 일차 수: " + resp.daysCount + ", 일정 항목 수: " + resp.totalItineraryItemsCount);
            return resp;
        }).collect(Collectors.toList());
        
        System.out.println("✅ 전체 여행 목록 반환 완료 - " + result.size() + "개");
        return result;
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
        System.out.println("🚀 여행 저장 요청 받음 - 사용자 ID: " + userId);
        System.out.println("📥 요청 데이터:");
        System.out.println("  - 제목: " + req.title);
        System.out.println("  - 여행지: " + req.destination);
        System.out.println("  - 시작일: " + req.startDate);
        System.out.println("  - 종료일: " + req.endDate);
        System.out.println("  - 일차 수: " + (req.days != null ? req.days.size() : 0));
        
        // 사용자 ID로 사용자 조회 (없으면 예외 발생)
        User user = userRepository.findById(userId).orElseThrow(() -> {
            System.err.println("❌ 사용자를 찾을 수 없음: " + userId);
            return new RuntimeException("사용자를 찾을 수 없습니다: " + userId);
        });
        System.out.println("✅ 사용자 확인: " + user.getName() + " (ID: " + user.getId() + ")");
        
        // 새로운 여행 엔티티 생성 및 설정
        Trip t = new Trip();
        t.setUser(user);
        t.setTitle(req.title);
        t.setDestination(req.destination);
        t.setDestinationPlaceId(req.destinationPlaceId);
        t.setDestinationLat(req.destinationLat);
        t.setDestinationLng(req.destinationLng);
        t.setStartDate(req.startDate);
        t.setEndDate(req.endDate);
        t.setNumAdults(req.numAdults);
        t.setNumChildren(req.numChildren);
        t.setTotalBudget(req.totalBudget);
        
        System.out.println("📝 Trip 엔티티 생성 완료");
        
        // 일차별 정보 저장
        if (req.days != null && !req.days.isEmpty()) {
            System.out.println("📅 일차별 정보 처리 시작 - 총 " + req.days.size() + "일차");
            List<TripDay> tripDays = new ArrayList<>();
            for (int i = 0; i < req.days.size(); i++) {
                TripDayDtos.CreateOrUpdateReq dayReq = req.days.get(i);
                System.out.println("  📆 " + (i + 1) + "일차 처리 중:");
                System.out.println("    - 일차 번호: " + dayReq.dayNumber);
                System.out.println("    - 날짜: " + dayReq.date);
                System.out.println("    - 시작 시간: " + dayReq.dayStartTime);
                System.out.println("    - 종료 시간: " + dayReq.dayEndTime);
                System.out.println("    - 숙소: " + (dayReq.accommodationJson != null ? "있음" : "없음"));
                System.out.println("    - 일정 항목 수: " + (dayReq.itineraryItems != null ? dayReq.itineraryItems.size() : 0));
                
                TripDay tripDay = new TripDay();
                tripDay.setTrip(t);
                tripDay.setDayNumber(dayReq.dayNumber);
                tripDay.setDate(dayReq.date);
                tripDay.setDayStartTime(dayReq.dayStartTime);
                tripDay.setDayEndTime(dayReq.dayEndTime);
                tripDay.setAccommodationJson(dayReq.accommodationJson);
                
                // 일정 항목 저장
                if (dayReq.itineraryItems != null && !dayReq.itineraryItems.isEmpty()) {
                    System.out.println("    📍 일정 항목 처리 시작 - 총 " + dayReq.itineraryItems.size() + "개");
                    List<TripItineraryItem> items = new ArrayList<>();
                    for (int j = 0; j < dayReq.itineraryItems.size(); j++) {
                        TripItineraryItemDtos.CreateOrUpdateReq itemReq = dayReq.itineraryItems.get(j);
                        System.out.println("      🎯 일정 항목 " + (j + 1) + ":");
                        System.out.println("        - 제목: " + itemReq.title);
                        System.out.println("        - 장소명: " + itemReq.locationName);
                        System.out.println("        - 위도: " + itemReq.latitude);
                        System.out.println("        - 경도: " + itemReq.longitude);
                        System.out.println("        - 순서: " + itemReq.orderSequence);
                        System.out.println("        - 체류 시간: " + itemReq.stayDurationMinutes + "분");
                        System.out.println("        - 이동 시간: " + itemReq.travelToNextDurationMinutes + "분");
                        System.out.println("        - 이동 수단: " + itemReq.travelToNextMode);
                        
                        TripItineraryItem item = new TripItineraryItem();
                        item.setTripDay(tripDay);
                        item.setPlaceId(itemReq.placeId);
                        item.setTitle(itemReq.title);
                        item.setDescription(itemReq.description);
                        item.setLocationName(itemReq.locationName);
                        item.setAddress(itemReq.address);
                        item.setLatitude(itemReq.latitude);
                        item.setLongitude(itemReq.longitude);
                        item.setStartTime(itemReq.startTime);
                        item.setEndTime(itemReq.endTime);
                        item.setCategory(itemReq.category);
                        item.setStayDurationMinutes(itemReq.stayDurationMinutes);
                        item.setTravelToNextDistanceKm(itemReq.travelToNextDistanceKm);
                        item.setTravelToNextDurationMinutes(itemReq.travelToNextDurationMinutes);
                        item.setTravelToNextMode(itemReq.travelToNextMode);
                        item.setOrderSequence(itemReq.orderSequence);
                        items.add(item);
                    }
                    tripDay.setItineraryItems(items);
                    System.out.println("    ✅ 일정 항목 " + items.size() + "개 설정 완료");
                } else {
                    System.out.println("    ⚠️ 일정 항목 없음");
                }
                
                tripDays.add(tripDay);
                System.out.println("  ✅ " + (i + 1) + "일차 처리 완료");
            }
            t.setTripDays(tripDays);
            System.out.println("📅 총 " + tripDays.size() + "개 일차 설정 완료");
        } else {
            System.out.println("⚠️ 일차 정보가 없습니다 (req.days가 null이거나 비어있음)");
        }
        
        // 여행 저장 및 반환
        System.out.println("💾 Trip 저장 시작...");
        System.out.println("  - TripDays 수: " + (t.getTripDays() != null ? t.getTripDays().size() : 0));
        if (t.getTripDays() != null && !t.getTripDays().isEmpty()) {
            for (TripDay day : t.getTripDays()) {
                System.out.println("  - " + day.getDayNumber() + "일차의 일정 항목 수: " + 
                    (day.getItineraryItems() != null ? day.getItineraryItems().size() : 0));
            }
        }
        
        Trip saved = tripRepository.save(t);
        System.out.println("✅ Trip 저장 완료 - ID: " + saved.getId());
        System.out.println("  - 저장된 TripDays 수: " + (saved.getTripDays() != null ? saved.getTripDays().size() : 0));
        if (saved.getTripDays() != null && !saved.getTripDays().isEmpty()) {
            for (TripDay day : saved.getTripDays()) {
                System.out.println("  - " + day.getDayNumber() + "일차 (ID: " + day.getId() + ")의 일정 항목 수: " + 
                    (day.getItineraryItems() != null ? day.getItineraryItems().size() : 0));
            }
        }
        
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
        r.destinationPlaceId = t.getDestinationPlaceId();
        r.destinationLat = t.getDestinationLat();
        r.destinationLng = t.getDestinationLng();
        r.startDate = t.getStartDate();
        r.endDate = t.getEndDate();
        r.numAdults = t.getNumAdults();
        r.numChildren = t.getNumChildren();
        r.totalBudget = t.getTotalBudget();
        r.status = t.getStatus();
        
        // 사용자 ID 설정
        if (t.getUser() != null) {
            r.userId = t.getUser().getId();
            System.out.println("    👤 사용자 ID 설정: " + r.userId);
        } else {
            System.out.println("    ⚠️ 사용자 정보 없음");
        }
        
        // 일차 수 및 일정 항목 수 계산
        // LAZY 로딩을 강제로 초기화
        try {
            if (t.getTripDays() != null) {
                // TripDays 초기화
                int daysSize = t.getTripDays().size();
                r.daysCount = daysSize;
                
                // 각 TripDay의 ItineraryItems 초기화 및 계산
                int totalItems = 0;
                for (TripDay day : t.getTripDays()) {
                    if (day.getItineraryItems() != null) {
                        totalItems += day.getItineraryItems().size();
                    }
                }
                r.totalItineraryItemsCount = totalItems;
            } else {
                r.daysCount = 0;
                r.totalItineraryItemsCount = 0;
            }
        } catch (Exception e) {
            // LAZY 로딩 초기화 실패 시 0으로 설정
            System.err.println("⚠️ TripDays 로딩 실패: " + e.getMessage());
            r.daysCount = 0;
            r.totalItineraryItemsCount = 0;
        }
        
        return r;
    }
}


