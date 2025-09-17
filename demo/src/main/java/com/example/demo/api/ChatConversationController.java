package com.example.demo.api;

import com.example.demo.domain.ChatConversation;
import com.example.demo.domain.Trip;
import com.example.demo.repository.ChatConversationRepository;
import com.example.demo.repository.TripRepository;
import com.example.demo.api.dto.ChatConversationDtos;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

/**
 * ChatConversation REST 컨트롤러
 * - 여행별 챗봇 대화 기록 CRUD(단순 추가/조회 위주)
 *   - GET /api/trips/{tripId}/chats
 *   - POST /api/trips/{tripId}/chats
 */
@RestController
@RequestMapping("/api")
public class ChatConversationController {

    private final ChatConversationRepository chatRepository;
    private final TripRepository tripRepository;

    public ChatConversationController(ChatConversationRepository chatRepository, TripRepository tripRepository) {
        this.chatRepository = chatRepository;
        this.tripRepository = tripRepository;
    }

    @GetMapping("/trips/{tripId}/chats")
    public List<ChatConversationDtos.Resp> list(@PathVariable Long tripId) {
        Trip trip = tripRepository.findById(tripId).orElseThrow();
        return chatRepository.findByTripOrderByConversationTimestampAsc(trip).stream().map(this::toResp).collect(Collectors.toList());
    }

    @PostMapping("/trips/{tripId}/chats")
    public ResponseEntity<ChatConversationDtos.Resp> create(@PathVariable Long tripId, @Valid @RequestBody ChatConversationDtos.CreateReq req) {
        Trip trip = tripRepository.findById(tripId).orElseThrow();
        ChatConversation cc = new ChatConversation();
        cc.setTrip(trip);
        cc.setUserMessage(req.userMessage);
        cc.setAiResponse(req.aiResponse);
        ChatConversation saved = chatRepository.save(cc);
        return ResponseEntity.ok(toResp(saved));
    }

    private ChatConversationDtos.Resp toResp(ChatConversation c) {
        ChatConversationDtos.Resp r = new ChatConversationDtos.Resp();
        r.id = c.getId();
        r.userMessage = c.getUserMessage();
        r.aiResponse = c.getAiResponse();
        r.conversationTimestamp = c.getConversationTimestamp();
        return r;
    }
}


