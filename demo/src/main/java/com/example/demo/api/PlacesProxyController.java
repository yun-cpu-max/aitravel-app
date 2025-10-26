package com.example.demo.api;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
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

    // ---- Helpers ---------------------------------------------------------
    private static String safeToString(Object obj) {
        return obj == null ? "" : String.valueOf(obj).trim();
    }

    private static String extractPlainText(Object obj) {
        if (obj == null) return "";
        if (obj instanceof String) return ((String) obj).trim();
        if (obj instanceof java.util.Map) {
            Object text = ((java.util.Map<?, ?>) obj).get("text");
            return text == null ? "" : String.valueOf(text).trim();
        }
        return String.valueOf(obj).trim();
    }

    private static String stripKoreanCitySuffix(String name) {
        if (name == null) return "";
        // 한국/일본 등 행정 접미사 제거: 특별자치도/특별자치시/특별시/광역시/자치시/시/군/구/도
        return name.replaceFirst("(특별자치도|특별자치시|특별시|광역시|자치시|시|군|구|도)$", "");
    }

    private static String extractCountryFromSecondary(String secondaryText) {
        if (secondaryText == null || secondaryText.isBlank()) return "";
        String sec = secondaryText;
        // 콤마 기준 마지막 항목 선호 (예: "도쿄도, 일본")
        if (sec.contains(",")) {
            String[] parts = sec.split(",");
            return parts[parts.length - 1].trim();
        }
        // 콤마가 없다면 공백 기준 마지막 토큰 시도
        String[] parts = sec.split("\\s+");
        return parts.length > 0 ? parts[parts.length - 1].trim() : sec.trim();
    }

    private java.util.Map<String, String> geocodeCountryByPlaceId(String placeId) {
        try {
            String encoded = java.net.URLEncoder.encode(placeId, java.nio.charset.StandardCharsets.UTF_8);
            String url = "https://maps.googleapis.com/maps/api/geocode/json?place_id=" + encoded
                    + "&language=" + lang
                    + "&key=" + apiKey;
            ResponseEntity<Map> resp = restClient.get().uri(java.net.URI.create(url)).retrieve().toEntity(Map.class);
            Map body = resp.getBody();
            if (body == null) return java.util.Map.of();
            Object results = body.get("results");
            if (!(results instanceof java.util.List) || ((java.util.List<?>) results).isEmpty()) return java.util.Map.of();
            Object first = ((java.util.List<?>) results).get(0);
            if (!(first instanceof java.util.Map)) return java.util.Map.of();
            Object acObj = ((java.util.Map) first).get("address_components");
            if (!(acObj instanceof java.util.List)) return java.util.Map.of();
            for (Object comp : (java.util.List<?>) acObj) {
                if (!(comp instanceof java.util.Map)) continue;
                java.util.Map c = (java.util.Map) comp;
                Object typesObj = c.get("types");
                if (typesObj instanceof java.util.List && ((java.util.List) typesObj).contains("country")) {
                    String longName = safeToString(c.get("long_name"));
                    String shortName = safeToString(c.get("short_name"));
                    return java.util.Map.of("name", longName, "code", shortName);
                }
            }
        } catch (Exception ignored) {
        }
        return java.util.Map.of();
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
    @org.springframework.web.bind.annotation.RequestMapping(value = "/autocomplete", method = {org.springframework.web.bind.annotation.RequestMethod.GET, org.springframework.web.bind.annotation.RequestMethod.POST})
    public ResponseEntity<?> autocomplete(@RequestParam("q") String query,
                                          @RequestParam(value = "session", required = false) String sessionToken) {
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "검색어를 입력하세요."));
        }

        String url = "https://places.googleapis.com/v1/places:autocomplete";

        Map<String, Object> body = Map.of(
                "input", query,
                "languageCode", lang,
                // 도시만 자동완성으로 제한
                "includedPrimaryTypes", java.util.List.of("locality")
        );

        try {
            ResponseEntity<Map> response = restClient.post()
                    .uri(URI.create(url))
                    .header("X-Goog-Api-Key", apiKey)
                    .header("X-Goog-FieldMask", "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText,suggestions.placePrediction.structuredFormat.secondaryText")
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toEntity(Map.class);

            Map respBody = response.getBody();
            java.util.List<java.util.Map<String, Object>> normalized = new java.util.ArrayList<>();
            if (respBody != null) {
                Object suggestionsObj = respBody.get("suggestions");
                if (suggestionsObj instanceof java.util.List) {
                    for (Object sObj : (java.util.List<?>) suggestionsObj) {
                        if (!(sObj instanceof java.util.Map)) continue;
                        java.util.Map s = (java.util.Map) sObj;
                        Object pp = s.get("placePrediction");
                        if (!(pp instanceof java.util.Map)) continue;
                        java.util.Map ppMap = (java.util.Map) pp;
                        String placeId = safeToString(ppMap.get("placeId"));

                        String textText = "";
                        Object textObj = ppMap.get("text");
                        if (textObj instanceof java.util.Map) {
                            textText = safeToString(((java.util.Map) textObj).get("text"));
                        }

                        String mainText = "";
                        String secondaryText = "";
                        Object sfObj = ppMap.get("structuredFormat");
                        if (sfObj instanceof java.util.Map) {
                            java.util.Map sf = (java.util.Map) sfObj;
                            mainText = extractPlainText(sf.get("mainText"));
                            secondaryText = extractPlainText(sf.get("secondaryText"));
                        }

                        String cityCandidate = mainText.isEmpty() ? textText : mainText;
                        int lastSpace = cityCandidate.lastIndexOf(' ');
                        if (lastSpace >= 0 && lastSpace < cityCandidate.length() - 1) {
                            cityCandidate = cityCandidate.substring(lastSpace + 1);
                        }
                        String city = stripKoreanCitySuffix(cityCandidate);
                        String country = extractCountryFromSecondary(secondaryText);

                        String display;
                        if (!city.isBlank() && !country.isBlank()) {
                            display = city + " " + country;
                        } else if (!city.isBlank()) {
                            display = city;
                        } else {
                            display = textText;
                        }

                        java.util.Map<String, Object> one = new java.util.LinkedHashMap<>();
                        one.put("placeId", placeId);
                        one.put("city", city);
                        one.put("country", country);
                        one.put("display", display);
                        one.put("mainText", mainText);
                        one.put("secondaryText", secondaryText);
                        normalized.add(one);
                    }
                }
            }

            // 상위 5개의 예측에 대해 국가를 지오코딩으로 검증하고,
            // 1) 검색어를 포함하는 항목의 국가를 우선 선택,
            // 2) 없으면 첫 항목의 국가,
            // 3) 그래도 없으면 최빈 국가를 사용합니다.
            java.util.List<java.util.Map<String, Object>> verified = new java.util.ArrayList<>();
            int limit = Math.min(5, normalized.size());
            java.util.Map<String, Integer> countryCount = new java.util.HashMap<>();
            String primaryCountry = "";
            String qNorm = query == null ? "" : query.toLowerCase(java.util.Locale.ROOT).replace(" ", "");
            String firstCountry = "";

            for (int i = 0; i < limit; i++) {
                java.util.Map<String, Object> n = normalized.get(i);
                String pid = safeToString(n.get("placeId"));
                java.util.Map<String, String> cc = geocodeCountryByPlaceId(pid);
                String name = cc.getOrDefault("name", "");

                if (!name.isBlank()) {
                    if (firstCountry.isBlank()) firstCountry = name;
                    countryCount.put(name, countryCount.getOrDefault(name, 0) + 1);
                    // display를 도시 + 검증된 국가로 다시 보정
                    String city = safeToString(n.get("city"));
                    n.put("country", name);
                    n.put("display", (city.isBlank() ? safeToString(n.get("display")) : city + " " + name));
                }

                // 검색어 포함 여부 체크
                String mainNorm = safeToString(n.get("mainText")).toLowerCase(java.util.Locale.ROOT).replace(" ", "");
                String dispNorm = safeToString(n.get("display")).toLowerCase(java.util.Locale.ROOT).replace(" ", "");
                boolean containsQuery = !qNorm.isBlank() && (mainNorm.contains(qNorm) || dispNorm.contains(qNorm));
                if (primaryCountry.isBlank() && containsQuery && !name.isBlank()) {
                    primaryCountry = name;
                }

                verified.add(n);
            }

            if (primaryCountry.isBlank()) primaryCountry = firstCountry; // 2) 첫 항목 국가
            if (primaryCountry.isBlank()) {
                // 3) 최빈 국가
                String topCountry = "";
                int topCount = 0;
                for (var e : countryCount.entrySet()) {
                    if (e.getValue() > topCount) { topCountry = e.getKey(); topCount = e.getValue(); }
                }
                primaryCountry = topCountry;
            }

            java.util.List<java.util.Map<String, Object>> filtered = new java.util.ArrayList<>();
            if (!primaryCountry.isBlank()) {
                for (java.util.Map<String, Object> n : verified) {
                    if (primaryCountry.equals(safeToString(n.get("country")))) filtered.add(n);
                }
            }
            if (filtered.isEmpty()) filtered = verified; // 안전장치

            // 검색어를 포함하는 항목만 우선 노출 (없으면 전체 유지)
            java.util.List<java.util.Map<String, Object>> containsFiltered = new java.util.ArrayList<>();
            for (java.util.Map<String, Object> n : filtered) {
                String mainNorm = safeToString(n.get("mainText")).toLowerCase(java.util.Locale.ROOT).replace(" ", "");
                String dispNorm = safeToString(n.get("display")).toLowerCase(java.util.Locale.ROOT).replace(" ", "");
                if (!qNorm.isBlank() && (mainNorm.contains(qNorm) || dispNorm.contains(qNorm))) {
                    containsFiltered.add(n);
                }
            }
            if (!containsFiltered.isEmpty()) filtered = containsFiltered;

            java.util.Map<String, Object> result = new java.util.LinkedHashMap<>();
            result.put("normalizedSuggestions", filtered);
            if (respBody != null && respBody.get("suggestions") != null) {
                result.put("suggestions", respBody.get("suggestions"));
            } else {
                result.put("suggestions", java.util.List.of());
            }
            return ResponseEntity.status(response.getStatusCode()).body(result);
        } catch (org.springframework.web.client.RestClientResponseException e) {
            // Google이 4xx/5xx를 반환하면 여기로 들어옵니다. 원본 상태/본문을 전달합니다.
            org.springframework.http.HttpStatusCode statusCode = e.getStatusCode();
            String responseBody = e.getResponseBodyAsString(java.nio.charset.StandardCharsets.UTF_8);
            return ResponseEntity.status(statusCode != null ? statusCode : org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of(
                            "message", "Google API 오류",
                            "status", statusCode != null ? statusCode.value() : 500,
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

    // Static Maps 프록시는 더 이상 사용하지 않습니다 (JS 지도 사용).

    /**
     * Place Details 프록시
     * - placeId로 장소의 상세 정보(사진, 설명, 이름 등)를 조회합니다.
     * - Google Places API (New) - Place Details 사용
     *
     * @param placeId Google Place ID
     * @return Place Details 정보 (photos, editorialSummary, displayName, formattedAddress 등)
     */
    @GetMapping("/details")
    public ResponseEntity<?> placeDetails(@RequestParam("placeId") String placeId) {
        if (placeId == null || placeId.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "placeId를 입력하세요."));
        }

        // Places API (New) - Place Details
        String url = "https://places.googleapis.com/v1/places/" + placeId;

        try {
            ResponseEntity<Map> response = restClient.get()
                    .uri(URI.create(url))
                    .header("X-Goog-Api-Key", apiKey)
                    .header("X-Goog-FieldMask", "id,displayName,formattedAddress,editorialSummary,photos,location")
                    .retrieve()
                    .toEntity(Map.class);

            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (org.springframework.web.client.RestClientResponseException e) {
            org.springframework.http.HttpStatusCode statusCode = e.getStatusCode();
            String responseBody = e.getResponseBodyAsString(java.nio.charset.StandardCharsets.UTF_8);
            return ResponseEntity.status(statusCode != null ? statusCode : org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of(
                            "message", "Google API 오류",
                            "status", statusCode != null ? statusCode.value() : 500,
                            "response", responseBody
                    ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of(
                    "message", "Place Details 조회에 실패했습니다.",
                    "detail", e.getMessage()
            ));
        }
    }

    /**
     * Place Photo 프록시
     * - photo name으로 실제 이미지를 반환합니다.
     * - Google Places API (New) - Place Photos 사용
     *
     * @param photoName 사진 리소스 이름 (예: places/ChIJ.../photos/...)
     * @param maxWidth 최대 너비 (픽셀, 기본값 400)
     * @return 이미지 바이트 배열
     */
    @GetMapping("/photo")
    public ResponseEntity<?> placePhoto(
            @RequestParam("name") String photoName,
            @RequestParam(value = "maxWidth", defaultValue = "400") int maxWidth) {
        if (photoName == null || photoName.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        // Places API (New) - Place Photos
        // 브라우저가 구글 CDN으로 직접 내려받도록 302 리다이렉트로 처리
        String url = "https://places.googleapis.com/v1/" + photoName + 
                "/media?maxWidthPx=" + Math.max(100, Math.min(maxWidth, 1600)) +
                "&key=" + apiKey;

        return ResponseEntity.status(302)
                .location(URI.create(url))
                .header("Cache-Control", "public, max-age=86400")
                .build();
    }
}


