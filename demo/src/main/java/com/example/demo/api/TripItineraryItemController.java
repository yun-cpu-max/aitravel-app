package com.example.demo.api;

import com.example.demo.domain.TripDay;
import com.example.demo.domain.TripItineraryItem;
import com.example.demo.repository.TripDayRepository;
import com.example.demo.repository.TripItineraryItemRepository;
import com.example.demo.api.dto.TripItineraryItemDtos;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

/**
 * TripItineraryItem REST 컨트롤러
 * - 특정 Day의 일정 아이템 CRUD 제공
 *   - GET /api/trip-days/{dayId}/items : 해당 Day의 일정 목록(순서 기준)
 *   - POST /api/trip-days/{dayId}/items : 일정 생성
 *   - PUT /api/itinerary-items/{id} : 일정 수정
 *   - DELETE /api/itinerary-items/{id} : 일정 삭제
 */
@RestController
@RequestMapping("/api")
public class TripItineraryItemController {

    private final TripItineraryItemRepository itemRepository;
    private final TripDayRepository dayRepository;

    public TripItineraryItemController(TripItineraryItemRepository itemRepository, TripDayRepository dayRepository) {
        this.itemRepository = itemRepository;
        this.dayRepository = dayRepository;
    }

    @GetMapping("/trip-days/{dayId}/items")
    public List<TripItineraryItemDtos.Resp> list(@PathVariable Long dayId) {
        TripDay day = dayRepository.findById(dayId).orElseThrow();
        return itemRepository.findByTripDayOrderByOrderSequenceAsc(day).stream().map(this::toResp).collect(Collectors.toList());
    }

    @PostMapping("/trip-days/{dayId}/items")
    public ResponseEntity<TripItineraryItemDtos.Resp> create(@PathVariable Long dayId, @Valid @RequestBody TripItineraryItemDtos.CreateOrUpdateReq req) {
        TripDay day = dayRepository.findById(dayId).orElseThrow();
        TripItineraryItem item = new TripItineraryItem();
        item.setTripDay(day);
        applyReq(item, req);
        TripItineraryItem saved = itemRepository.save(item);
        return ResponseEntity.ok(toResp(saved));
    }

    @PutMapping("/itinerary-items/{id}")
    public ResponseEntity<TripItineraryItemDtos.Resp> update(@PathVariable Long id, @Valid @RequestBody TripItineraryItemDtos.CreateOrUpdateReq req) {
        TripItineraryItem item = itemRepository.findById(id).orElseThrow();
        applyReq(item, req);
        TripItineraryItem saved = itemRepository.save(item);
        return ResponseEntity.ok(toResp(saved));
    }

    @DeleteMapping("/itinerary-items/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        itemRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void applyReq(TripItineraryItem item, TripItineraryItemDtos.CreateOrUpdateReq req) {
        item.setTitle(req.title);
        item.setDescription(req.description);
        item.setLocationName(req.locationName);
        item.setLatitude(req.latitude);
        item.setLongitude(req.longitude);
        item.setStartTime(req.startTime);
        item.setEndTime(req.endTime);
        item.setEstimatedCost(req.estimatedCost);
        item.setCategory(req.category);
        item.setTransportationType(req.transportationType);
        item.setTransportationDuration(req.transportationDuration);
        item.setTransportationCost(req.transportationCost);
        item.setOrderSequence(req.orderSequence);
        item.setConfirmed(req.confirmed);
    }

    private TripItineraryItemDtos.Resp toResp(TripItineraryItem item) {
        TripItineraryItemDtos.Resp r = new TripItineraryItemDtos.Resp();
        r.id = item.getId();
        r.title = item.getTitle();
        r.description = item.getDescription();
        r.locationName = item.getLocationName();
        r.latitude = item.getLatitude();
        r.longitude = item.getLongitude();
        r.startTime = item.getStartTime();
        r.endTime = item.getEndTime();
        r.estimatedCost = item.getEstimatedCost();
        r.category = item.getCategory();
        r.transportationType = item.getTransportationType();
        r.transportationDuration = item.getTransportationDuration();
        r.transportationCost = item.getTransportationCost();
        r.orderSequence = item.getOrderSequence();
        r.confirmed = item.getConfirmed();
        return r;
    }
}


