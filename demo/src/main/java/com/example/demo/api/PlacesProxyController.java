package com.example.demo.api;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Google Maps Platform 호출을 백엔드에서 대리(프록시)하는 컨트롤러입니다.
 * - 목적: 브라우저에 API 키를 노출하지 않기 위함(보안), 호출 정책/캐싱/레이트리밋을 서버에서 통제하기 위함
 * - 포함 기능:
 *   1) Places Autocomplete(도시 위주) 프록시
 *   2) Geocoding(placeId 기반 좌표 조회) 프록시
 *
 * 주의사항:
 * - 실제 서비스에서는 캐시/레이트리밋/에러 처리(재시도 등)를 보강하세요.
 */
@RestController
@RequestMapping("/api/places")
public class PlacesProxyController {

    private final RestClient restClient;

    @Value("${google.api.key}")
    private String apiKey;

    @Value("${google.api.lang:ko}")
    private String lang;

    public PlacesProxyController() {
        this.restClient = RestClient.create();
    }

    /**
     * Places Autocomplete 프록시
     * - 입력 텍스트를 바탕으로 도시(locality) 중심의 자동완성 후보를 반환합니다.
     * - 프론트엔드에서 q(검색어)만 넘기면, 서버가 Google Places(REST v1)로 위임 호출합니다.
     *
     * @param query 사용자가 입력한 검색어(예: "seoul", "도쿄")
     * @param sessionToken 선택: 클라이언트 측 세션 토큰(요금 최적화용). 현재 미사용
     * @return Google 응답의 일부 필드(PlaceId, 텍스트)만 포함한 JSON Map
     */
    @org.springframework.web.bind.annotation.PostMapping("/autocomplete")
    public ResponseEntity<?> autocomplete(@RequestParam("q") String query,
                                          @RequestParam(value = "session", required = false) String sessionToken) {
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "검색어를 입력하세요."));
        }

        String url = "https://places.googleapis.com/v1/places:autocomplete";

        Map<String, Object> body = Map.of(
                "input", query,
                "languageCode", lang
        );

        try {
            ResponseEntity<Map> response = restClient.post()
                    .uri(URI.create(url))
                    .header("X-Goog-Api-Key", apiKey)
                    .header("X-Goog-FieldMask", "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text")
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toEntity(Map.class);

            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (org.springframework.web.client.RestClientResponseException e) {
            // Google이 4xx/5xx를 반환하면 여기로 들어옵니다. 원본 상태/본문을 전달합니다.
            org.springframework.http.HttpStatus status = org.springframework.http.HttpStatus.resolve(e.getRawStatusCode());
            String responseBody = e.getResponseBodyAsString(java.nio.charset.StandardCharsets.UTF_8);
            return ResponseEntity.status(status != null ? status : org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of(
                            "message", "Google API 오류",
                            "status", e.getRawStatusCode(),
                            "response", responseBody
                    ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of(
                    "message", "외부 Google API 호출에 실패했습니다.",
                    "detail", e.getMessage()
            ));
        }
    }

    /**
     * Geocoding 프록시
     * - placeId를 받아 위경도 좌표를 조회합니다.
     * - Google Geocoding API(JSON)를 호출하여 원본 응답을 그대로 반환합니다.
     *
     * @param placeId Google Place ID
     * @return 위경도 등을 포함한 Geocoding API 원본 JSON Map
     */
    @GetMapping("/geocode")
    public ResponseEntity<?> geocode(@RequestParam("placeId") String placeId) {
        String encoded = URLEncoder.encode(placeId, StandardCharsets.UTF_8);
        String url = "https://maps.googleapis.com/maps/api/geocode/json?place_id=" + encoded
                + "&language=" + lang
                + "&key=" + apiKey;

        ResponseEntity<Map> response = restClient.get()
                .uri(URI.create(url))
                .retrieve()
                .toEntity(Map.class);

        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }
}


