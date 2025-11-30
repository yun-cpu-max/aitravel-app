package com.example.demo.api;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.HashMap;
import java.util.Map;

/**
 * Google Routes API를 사용하여 실제 경로, 거리, 이동 시간을 계산하는 컨트롤러
 * - Distance Matrix API(레거시) 대신 최신 Routes API 사용
 * - 실시간 교통 정보, 경로 최적화 지원
 */
@RestController
@RequestMapping("/api/routes")
@CrossOrigin(origins = "*")
public class RoutesController {

    @Value("${google.maps.api.key:}")
    private String googleMapsApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 두 지점 간의 경로, 거리, 이동 시간을 계산
     * Routes API의 Compute Routes 엔드포인트 사용
     * 
     * @param originLat 출발지 위도
     * @param originLng 출발지 경도
     * @param destLat 도착지 위도
     * @param destLng 도착지 경도
     * @param travelMode 이동 수단 (DRIVE, TRANSIT, WALK, BICYCLE)
     * @return 거리(km), 시간(분), 경로 폴리라인, 상태
     */
    @GetMapping("/compute")
    public ResponseEntity<Map<String, Object>> computeRoute(
            @RequestParam double originLat,
            @RequestParam double originLng,
            @RequestParam double destLat,
            @RequestParam double destLng,
            @RequestParam(defaultValue = "TRANSIT") String travelMode) {
        
        System.out.println("🚀 Routes API 컨트롤러 호출됨: " + travelMode + " " + originLat + "," + originLng + " → " + destLat + "," + destLng);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // API 키가 없으면 Haversine 공식으로 Fallback
            if (googleMapsApiKey == null || googleMapsApiKey.isEmpty()) {
                System.out.println("⚠️ API 키가 없음 → Fallback 사용");
                return getFallbackResponse(originLat, originLng, destLat, destLng, travelMode);
            }
            
            System.out.println("✅ API 키 확인됨: " + googleMapsApiKey.substring(0, Math.min(10, googleMapsApiKey.length())) + "...");
            
            // Routes API 요청 URL
            String url = "https://routes.googleapis.com/directions/v2:computeRoutes";
            System.out.println("🌐 API URL: " + url);
            
            // 요청 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            headers.set("X-Goog-Api-Key", googleMapsApiKey);
            // FieldMask를 '*'로 설정하여 모든 필드 요청 (테스트 및 개발용)
            // 프로덕션에서는 필요한 필드만 명시: routes.legs.duration, routes.legs.distanceMeters
            headers.set("X-Goog-FieldMask", "*");
            
            // 요청 본문 생성
            ObjectNode requestBody = objectMapper.createObjectNode();
            
            // 출발지 설정
            ObjectNode origin = objectMapper.createObjectNode();
            ObjectNode originLocation = objectMapper.createObjectNode();
            ObjectNode originLatLng = objectMapper.createObjectNode();
            originLatLng.put("latitude", originLat);
            originLatLng.put("longitude", originLng);
            originLocation.set("latLng", originLatLng);
            origin.set("location", originLocation);
            requestBody.set("origin", origin);
            
            // 목적지 설정
            ObjectNode destination = objectMapper.createObjectNode();
            ObjectNode destLocation = objectMapper.createObjectNode();
            ObjectNode destLatLng = objectMapper.createObjectNode();
            destLatLng.put("latitude", destLat);
            destLatLng.put("longitude", destLng);
            destLocation.set("latLng", destLatLng);
            destination.set("location", destLocation);
            requestBody.set("destination", destination);
            
            // 이동 수단 설정
            requestBody.put("travelMode", travelMode);
            
            // 기본 옵션
            requestBody.put("computeAlternativeRoutes", false); // 대체 경로 계산 안 함 (비용 절감)
            requestBody.put("languageCode", "ko"); // 한국어
            requestBody.put("units", "METRIC"); // 미터법
            
            // 참고: routingPreference는 제거 (TRANSIT 모드에서 에러 발생)
            // 실시간 교통 정보가 필요하면 나중에 DRIVE 모드에만 추가
            
            // API 호출
            HttpEntity<String> entity = new HttpEntity<>(requestBody.toString(), headers);
            System.out.println("📤 Routes API 요청 본문: " + requestBody.toString());
            System.out.println("📤 요청 헤더: " + headers.toString());
            
            System.out.println("⏳ Google Routes API 호출 중...");
            ResponseEntity<String> responseEntity = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            
            System.out.println("📊 응답 상태 코드: " + responseEntity.getStatusCode());
            System.out.println("📊 응답 헤더: " + responseEntity.getHeaders());
            
            String jsonResponse = responseEntity.getBody();
            
            // 응답 본문 전체 출력
            System.out.println("📥 Routes API 응답 본문 (전체): " + jsonResponse);
            
            // 응답 파싱
            JsonNode root = objectMapper.readTree(jsonResponse);
            
            // 응답 구조 확인
            System.out.println("🔍 응답 루트 필드들: " + root.fieldNames());
            
            JsonNode routes = root.path("routes");
            JsonNode error = root.path("error");
            JsonNode geocodingResults = root.path("geocodingResults");
            
            System.out.println("🔍 routes 필드 존재 여부: " + !routes.isMissingNode());
            System.out.println("🔍 routes 배열 크기: " + (routes.isArray() ? routes.size() : "배열이 아님"));
            System.out.println("🔍 error 필드 존재 여부: " + !error.isMissingNode());
            if (!error.isMissingNode()) {
                System.out.println("❌ 에러 내용: " + error.toString());
            }
            System.out.println("🔍 geocodingResults 필드 존재 여부: " + !geocodingResults.isMissingNode());
            
            if (routes.isArray() && routes.size() > 0) {
                JsonNode route = routes.get(0);
                JsonNode legs = route.path("legs");
                
                System.out.println("🔍 legs 필드 존재 여부: " + !legs.isMissingNode());
                System.out.println("🔍 legs 배열 크기: " + (legs.isArray() ? legs.size() : "배열이 아님"));
                
                if (legs.isArray() && legs.size() > 0) {
                    JsonNode leg = legs.get(0);
                    
                    // 거리 (미터 → 킬로미터)
                    double distanceMeters = leg.path("distanceMeters").asDouble();
                    double distanceKm = Math.round(distanceMeters / 100.0) / 10.0; // 소수점 1자리
                    
                    // 시간 (초 → 분)
                    String durationStr = leg.path("duration").asText(); // "123s" 형식
                    double durationSeconds = Double.parseDouble(durationStr.replace("s", ""));
                    double durationMinutes = Math.round(durationSeconds / 60.0);
                    
                    System.out.println("✅ Routes API 성공 - 거리: " + distanceKm + "km, 시간: " + durationMinutes + "분");
                    
                    // 거리와 시간만 반환
                    response.put("distance", distanceKm);
                    response.put("duration", durationMinutes);
                    response.put("travelMode", travelMode);
                    response.put("fallback", false);
                    response.put("trafficAware", false); // 실시간 교통 미사용
                    
                    return ResponseEntity.ok(response);
                }
            }
            
            // API 성공했지만 경로 없음 → Fallback
            System.out.println("⚠️ Routes API 응답에 경로 데이터 없음 → Fallback 사용");
            return getFallbackResponse(originLat, originLng, destLat, destLng, travelMode);
            
        } catch (Exception e) {
            System.err.println("❌ Routes API 오류: " + e.getClass().getName() + " - " + e.getMessage());
            e.printStackTrace();
            // 에러 발생 시 Fallback
            return getFallbackResponse(originLat, originLng, destLat, destLng, travelMode);
        }
    }

    /**
     * Fallback: Haversine 공식으로 직선 거리 계산 및 시간 추정
     */
    private ResponseEntity<Map<String, Object>> getFallbackResponse(
            double lat1, double lon1, double lat2, double lon2, String travelMode) {
        
        Map<String, Object> response = new HashMap<>();
        
        double distance = calculateHaversineDistance(lat1, lon1, lat2, lon2);
        double estimatedTime = estimateTimeByDistance(distance, travelMode);
        
        response.put("distance", distance);
        response.put("duration", estimatedTime);
        response.put("travelMode", travelMode);
        response.put("fallback", true);
        response.put("trafficAware", false);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Haversine 공식으로 두 지점 간 직선 거리 계산
     */
    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371; // 지구 반지름 (km)
        
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return Math.round(R * c * 10) / 10.0; // 소수점 1자리
    }

    /**
     * 거리를 기반으로 이동 시간 추정
     */
    private double estimateTimeByDistance(double distanceKm, String mode) {
        // 평균 속도 (km/h)
        double avgSpeed = switch (mode.toUpperCase()) {
            case "TRANSIT" -> 30.0;  // 대중교통: 30km/h
            case "DRIVE" -> 40.0;    // 자동차: 40km/h
            case "WALK" -> 5.0;      // 도보: 5km/h
            case "BICYCLE" -> 15.0;  // 자전거: 15km/h
            default -> 30.0;
        };
        
        double hours = distanceKm / avgSpeed;
        return Math.round(hours * 60); // 분으로 변환
    }

    /**
     * 여러 지점 간의 거리/시간을 일괄 계산
     * Routes API의 Compute Route Matrix 사용
     */
    @PostMapping("/matrix")
    public ResponseEntity<Map<String, Object>> computeRouteMatrix(
            @RequestBody Map<String, Object> request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // API 키 확인
            if (googleMapsApiKey == null || googleMapsApiKey.isEmpty()) {
                response.put("error", "API key not configured");
                response.put("fallback", true);
                return ResponseEntity.ok(response);
            }
            
            // Routes API Matrix 엔드포인트
            String url = "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix";
            
            // 요청 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            headers.set("X-Goog-Api-Key", googleMapsApiKey);
            headers.set("X-Goog-FieldMask", "originIndex,destinationIndex,duration,distanceMeters,status");
            
            // 요청 본문은 클라이언트에서 전달받은 것을 사용
            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(request), headers);
            String jsonResponse = restTemplate.exchange(url, HttpMethod.POST, entity, String.class).getBody();
            
            // 응답 반환
            JsonNode root = objectMapper.readTree(jsonResponse);
            response.put("data", root);
            response.put("fallback", false);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Route Matrix API 오류: " + e.getMessage());
            response.put("error", e.getMessage());
            response.put("fallback", true);
            return ResponseEntity.ok(response);
        }
    }
}

