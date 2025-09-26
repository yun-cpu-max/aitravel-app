package com.example.demo.api;

import com.example.demo.domain.User;
import com.example.demo.domain.UserPreferences;
import com.example.demo.repository.UserPreferencesRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.api.dto.UserPreferencesDtos;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Optional;

/**
 * UserPreferences REST 컨트롤러
 * - 사용자 취향 조회/저장
 *   - GET /api/users/{userId}/preferences
 *   - PUT /api/users/{userId}/preferences
 */
@RestController
@RequestMapping("/api")
public class UserPreferencesController {

    private final UserPreferencesRepository preferencesRepository;
    private final UserRepository userRepository;

    public UserPreferencesController(UserPreferencesRepository preferencesRepository, UserRepository userRepository) {
        this.preferencesRepository = preferencesRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/users/{userId}/preferences")
    public ResponseEntity<UserPreferencesDtos.Resp> get(@PathVariable("userId") Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        Optional<UserPreferences> pref = preferencesRepository.findByUser(user);
        return pref.map(p -> ResponseEntity.ok(toResp(p))).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{userId}/preferences")
    public ResponseEntity<UserPreferencesDtos.Resp> upsert(@PathVariable("userId") Long userId, @Valid @RequestBody UserPreferencesDtos.UpsertReq req) {
        User user = userRepository.findById(userId).orElseThrow();
        Optional<UserPreferences> prefOpt = preferencesRepository.findByUser(user);
        UserPreferences pref = prefOpt.orElseGet(UserPreferences::new);
        pref.setUser(user);
        pref.setTravelStyle(req.travelStyle);
        pref.setBudgetRangeMin(req.budgetRangeMin);
        pref.setBudgetRangeMax(req.budgetRangeMax);
        pref.setPreferredAccommodationType(req.preferredAccommodationType);
        pref.setPreferredTransportation(req.preferredTransportation);
        UserPreferences saved = preferencesRepository.save(pref);
        return ResponseEntity.ok(toResp(saved));
    }

    private UserPreferencesDtos.Resp toResp(UserPreferences p) {
        UserPreferencesDtos.Resp r = new UserPreferencesDtos.Resp();
        r.id = p.getId();
        r.travelStyle = p.getTravelStyle();
        r.budgetRangeMin = p.getBudgetRangeMin();
        r.budgetRangeMax = p.getBudgetRangeMax();
        r.preferredAccommodationType = p.getPreferredAccommodationType();
        r.preferredTransportation = p.getPreferredTransportation();
        return r;
    }
}


