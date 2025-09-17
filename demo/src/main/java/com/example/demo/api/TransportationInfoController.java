package com.example.demo.api;

import com.example.demo.domain.TransportationInfo;
import com.example.demo.domain.Trip;
import com.example.demo.repository.TransportationInfoRepository;
import com.example.demo.repository.TripRepository;
import com.example.demo.api.dto.TransportationInfoDtos;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

/**
 * TransportationInfo REST 컨트롤러
 * - 여행의 교통 정보 CRUD 제공
 *   - GET /api/trips/{tripId}/transportations
 *   - POST /api/trips/{tripId}/transportations
 *   - PUT /api/transportations/{id}
 *   - DELETE /api/transportations/{id}
 */
@RestController
@RequestMapping("/api")
public class TransportationInfoController {

    private final TransportationInfoRepository transportationInfoRepository;
    private final TripRepository tripRepository;

    public TransportationInfoController(TransportationInfoRepository transportationInfoRepository, TripRepository tripRepository) {
        this.transportationInfoRepository = transportationInfoRepository;
        this.tripRepository = tripRepository;
    }

    @GetMapping("/trips/{tripId}/transportations")
    public List<TransportationInfoDtos.Resp> list(@PathVariable Long tripId) {
        Trip trip = tripRepository.findById(tripId).orElseThrow();
        return transportationInfoRepository.findByTrip(trip).stream().map(this::toResp).collect(Collectors.toList());
    }

    @PostMapping("/trips/{tripId}/transportations")
    public ResponseEntity<TransportationInfoDtos.Resp> create(@PathVariable Long tripId, @Valid @RequestBody TransportationInfoDtos.CreateOrUpdateReq req) {
        Trip trip = tripRepository.findById(tripId).orElseThrow();
        TransportationInfo info = new TransportationInfo();
        info.setTrip(trip);
        applyReq(info, req);
        TransportationInfo saved = transportationInfoRepository.save(info);
        return ResponseEntity.ok(toResp(saved));
    }

    @PutMapping("/transportations/{id}")
    public ResponseEntity<TransportationInfoDtos.Resp> update(@PathVariable Long id, @Valid @RequestBody TransportationInfoDtos.CreateOrUpdateReq req) {
        TransportationInfo info = transportationInfoRepository.findById(id).orElseThrow();
        applyReq(info, req);
        TransportationInfo saved = transportationInfoRepository.save(info);
        return ResponseEntity.ok(toResp(saved));
    }

    @DeleteMapping("/transportations/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        transportationInfoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void applyReq(TransportationInfo info, TransportationInfoDtos.CreateOrUpdateReq req) {
        info.setType(req.type);
        info.setDepartureLocation(req.departureLocation);
        info.setArrivalLocation(req.arrivalLocation);
        info.setDepartureDateTime(req.departureDateTime);
        info.setArrivalDateTime(req.arrivalDateTime);
        info.setBookingReference(req.bookingReference);
        info.setCost(req.cost);
    }

    private TransportationInfoDtos.Resp toResp(TransportationInfo info) {
        TransportationInfoDtos.Resp r = new TransportationInfoDtos.Resp();
        r.id = info.getId();
        r.type = info.getType();
        r.departureLocation = info.getDepartureLocation();
        r.arrivalLocation = info.getArrivalLocation();
        r.departureDateTime = info.getDepartureDateTime();
        r.arrivalDateTime = info.getArrivalDateTime();
        r.bookingReference = info.getBookingReference();
        r.cost = info.getCost();
        return r;
    }
}


