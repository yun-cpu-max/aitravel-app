package com.example.demo.api;

import com.example.demo.domain.Trip;
import com.example.demo.domain.TripFeedback;
import com.example.demo.domain.User;
import com.example.demo.repository.TripFeedbackRepository;
import com.example.demo.repository.TripRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.api.dto.TripFeedbackDtos;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

/**
 * TripFeedback REST 컨트롤러
 * - 여행 후 피드백 생성/조회
 *   - GET /api/trips/{tripId}/feedback
 *   - POST /api/trips/{tripId}/feedback (userId 포함)
 */
@RestController
@RequestMapping("/api")
public class TripFeedbackController {

    private final TripFeedbackRepository feedbackRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;

    public TripFeedbackController(TripFeedbackRepository feedbackRepository, TripRepository tripRepository, UserRepository userRepository) {
        this.feedbackRepository = feedbackRepository;
        this.tripRepository = tripRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/trips/{tripId}/feedback")
    public List<TripFeedbackDtos.Resp> list(@PathVariable Long tripId) {
        Trip trip = tripRepository.findById(tripId).orElseThrow();
        return feedbackRepository.findByTrip(trip).stream().map(this::toResp).collect(Collectors.toList());
    }

    @PostMapping("/trips/{tripId}/feedback")
    public ResponseEntity<TripFeedbackDtos.Resp> create(@PathVariable Long tripId, @RequestParam Long userId, @Valid @RequestBody TripFeedbackDtos.CreateReq req) {
        Trip trip = tripRepository.findById(tripId).orElseThrow();
        User user = userRepository.findById(userId).orElseThrow();
        TripFeedback tf = new TripFeedback();
        tf.setTrip(trip);
        tf.setUser(user);
        tf.setOverallRating(req.overallRating);
        tf.setFeedbackText(req.feedbackText);
        tf.setSatisfactionAreas(req.satisfactionAreas);
        TripFeedback saved = feedbackRepository.save(tf);
        return ResponseEntity.ok(toResp(saved));
    }

    private TripFeedbackDtos.Resp toResp(TripFeedback f) {
        TripFeedbackDtos.Resp r = new TripFeedbackDtos.Resp();
        r.id = f.getId();
        r.overallRating = f.getOverallRating();
        r.feedbackText = f.getFeedbackText();
        r.satisfactionAreas = f.getSatisfactionAreas();
        r.createdAt = f.getCreatedAt();
        return r;
    }
}


