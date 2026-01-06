/**
 * TripDetailPage 컴포넌트
 * - 특정 여행의 전체 일정을 간단한 패널 형태로 보여주는 페이지
 * - URL: /trip-detail/:tripId
 */

import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

const TripDetailPage = () => {
  const { tripId } = useParams();
  const { isAuthenticated } = useAuth();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null); // null = 전체, number = 특정 일차
  const [placeImages, setPlaceImages] = useState({}); // placeId -> imageUrl 캐시
  const [placeDetailModal, setPlaceDetailModal] = useState(null); // 선택된 장소의 상세 정보
  const [placeDetailData, setPlaceDetailData] = useState(null); // placeId로 가져온 추가 정보
  
  // 지도 관련 refs
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);

  useEffect(() => {
    if (!tripId) return;

    const fetchTripDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`http://localhost:8081/api/trips/${tripId}`);

        if (!response.ok) {
          throw new Error('여행 상세 정보를 불러오는데 실패했습니다.');
        }

        const data = await response.json();
        console.log('📥 여행 상세 데이터:', data);
        setTrip(data);
      } catch (err) {
        console.error('여행 상세 조회 실패:', err);
        setError(err.message || '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetail();
  }, [tripId]);

  // 지도 초기화 및 마커/경로 표시
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const sortedDays = (trip?.days || []).slice().sort((a, b) => {
    if (a.dayNumber && b.dayNumber) return a.dayNumber - b.dayNumber;
    return 0;
  });

  useEffect(() => {
    if (!trip || loading || !mapRef.current || !apiKey) return;
    const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

    const ensure = () => new Promise((resolve, reject) => {
      // 이미 로드되어 있고 Map 생성자가 사용 가능한지 확인
      if (window.google && window.google.maps && window.google.maps.Map) {
        return resolve(window.google.maps);
      }
      
      const id = 'gmaps-js-sdk';
      let s = document.getElementById(id);
      if (!s) {
        s = document.createElement('script');
        s.id = id;
        s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&language=ko&libraries=marker&loading=async`;
        s.async = true;
        s.defer = true;
        s.onload = () => {
          // Map 생성자가 사용 가능할 때까지 대기
          const checkMap = () => {
            if (window.google && window.google.maps && window.google.maps.Map) {
              resolve(window.google.maps);
            } else {
              setTimeout(checkMap, 50);
            }
          };
          checkMap();
        };
        s.onerror = () => reject(new Error('load-fail'));
        document.head.appendChild(s);
      } else {
        // 스크립트가 이미 있으면 Map 생성자가 준비될 때까지 대기
        const check = () => {
          if (window.google && window.google.maps && window.google.maps.Map) {
            resolve(window.google.maps);
          } else {
            setTimeout(check, 50);
          }
        };
        check();
      }
    });

    let cancelled = false;
    ensure().then((maps) => {
      if (cancelled) return;
      
      // Map 생성자가 실제로 사용 가능한지 다시 확인
      if (!maps || !maps.Map) {
        console.error('Google Maps Map 생성자를 사용할 수 없습니다.');
        return;
      }
      
      // 지도 초기화
      if (!mapInstanceRef.current && mapRef.current) {
        const center = (trip.destinationLat && trip.destinationLng) 
          ? { lat: parseFloat(trip.destinationLat), lng: parseFloat(trip.destinationLng) }
          : { lat: 37.5665, lng: 126.9780 };
        
        const mapOptions = {
          center,
          zoom: 12,
          streetViewControl: false,
          mapTypeControl: false,
        };
        if (mapId) {
          mapOptions.mapId = mapId;
        }
        mapInstanceRef.current = new maps.Map(mapRef.current, mapOptions);
      }
      
      if (!mapInstanceRef.current) return;
      
      // 기존 마커 및 경로 제거
      markersRef.current.forEach((m) => {
        if (m.setMap) m.setMap(null);
      });
      markersRef.current = [];
      
      polylinesRef.current.forEach((p) => {
        if (p.setMap) p.setMap(null);
      });
      polylinesRef.current = [];
      
      const bounds = new maps.LatLngBounds();
      let hasValidCoords = false;
      
      // 일차별 색상 정의
      const dayColors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
      
      // 각 일차별로 마커 및 경로 표시 (selectedDay 필터링)
      sortedDays.forEach((day, dayIndex) => {
        // selectedDay가 설정되어 있으면 해당 일차만 표시
        if (selectedDay !== null && day.dayNumber !== selectedDay) {
          return;
        }
        const items = (day.itineraryItems || []).slice().sort((a, b) => {
          if (a.orderSequence && b.orderSequence) return a.orderSequence - b.orderSequence;
          return 0;
        });
        
        const dayColor = dayColors[dayIndex % dayColors.length];
        const pathCoordinates = [];
        
        // 일정 항목 마커 추가
        items.forEach((item) => {
          if (item.latitude && item.longitude) {
            const pos = { 
              lat: parseFloat(item.latitude), 
              lng: parseFloat(item.longitude) 
            };
            bounds.extend(pos);
            hasValidCoords = true;
            pathCoordinates.push(pos);
            
            try {
              const marker = new maps.Marker({
                position: pos,
                map: mapInstanceRef.current,
                title: `${day.dayNumber}일차 #${item.orderSequence}: ${item.title}`,
                label: {
                  text: String(item.orderSequence),
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold'
                },
                icon: {
                  path: maps.SymbolPath.CIRCLE,
                  scale: 15,
                  fillColor: dayColor,
                  fillOpacity: 1,
                  strokeColor: 'white',
                  strokeWeight: 2,
                }
              });
              markersRef.current.push(marker);
            } catch (error) {
              console.error(`마커 생성 실패:`, error);
            }
          }
        });
        
        // 일정 항목 간 경로 표시
        if (pathCoordinates.length > 1) {
          try {
            const polyline = new maps.Polyline({
              path: pathCoordinates,
              geodesic: true,
              strokeColor: dayColor,
              strokeOpacity: 0.8,
              strokeWeight: 3,
            });
            polyline.setMap(mapInstanceRef.current);
            polylinesRef.current.push(polyline);
          } catch (error) {
            console.error(`경로 생성 실패:`, error);
          }
        }
        
        // 숙소 마커 추가
        try {
          const accommodation = day.accommodationJson
            ? JSON.parse(day.accommodationJson)
            : null;
          
          if (accommodation && accommodation.lat && accommodation.lng) {
            const accPos = { 
              lat: parseFloat(accommodation.lat), 
              lng: parseFloat(accommodation.lng) 
            };
            bounds.extend(accPos);
            hasValidCoords = true;
            
            // 마지막 일정 항목에서 숙소로 경로 연결
            if (pathCoordinates.length > 0) {
              try {
                const accPolyline = new maps.Polyline({
                  path: [pathCoordinates[pathCoordinates.length - 1], accPos],
                  geodesic: true,
                  strokeColor: '#84cc16',
                  strokeOpacity: 0.6,
                  strokeWeight: 2,
                  icons: [{
                    icon: {
                      path: maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    },
                    offset: '100%',
                    repeat: '20px'
                  }]
                });
                accPolyline.setMap(mapInstanceRef.current);
                polylinesRef.current.push(accPolyline);
              } catch (error) {
                console.error(`숙소 경로 생성 실패:`, error);
              }
            }
            
            try {
              const accMarker = new maps.Marker({
                position: accPos,
                map: mapInstanceRef.current,
                title: `${day.dayNumber}일차 숙소: ${accommodation.name || '숙소'}`,
                label: {
                  text: '🏨',
                  color: 'white',
                  fontSize: '16px',
                },
                icon: {
                  path: maps.SymbolPath.CIRCLE,
                  scale: 18,
                  fillColor: '#84cc16',
                  fillOpacity: 1,
                  strokeColor: 'white',
                  strokeWeight: 2,
                }
              });
              markersRef.current.push(accMarker);
            } catch (error) {
              console.error(`숙소 마커 생성 실패:`, error);
            }
          }
        } catch (e) {
          console.error('숙소 정보 파싱 실패:', e);
        }
      });
      
      // 지도 범위 조정
      if (hasValidCoords) {
        if (bounds.isEmpty()) {
          // 여행지 중심으로 설정
          const center = (trip.destinationLat && trip.destinationLng) 
            ? { lat: parseFloat(trip.destinationLat), lng: parseFloat(trip.destinationLng) }
            : { lat: 37.5665, lng: 126.9780 };
          mapInstanceRef.current.setCenter(center);
          mapInstanceRef.current.setZoom(12);
        } else {
          mapInstanceRef.current.fitBounds(bounds, {
            top: 50,
            right: 50,
            bottom: 50,
            left: 50,
          });
        }
      }
    }).catch((err) => {
      // 에러가 발생해도 조용히 처리 (지도가 이미 로드되어 있을 수 있음)
      if (err.message !== 'load-fail') {
        console.warn('Google Maps 로드 중 경고:', err.message);
      }
    });
    
    return () => { cancelled = true; };
  }, [trip, loading, sortedDays, apiKey, selectedDay]);

  // 일정 항목들과 숙소의 이미지 미리 로드
  useEffect(() => {
    if (!trip || loading) return;
    
    const loadImages = async () => {
      const imagePromises = [];
      sortedDays.forEach((day) => {
        // 일정 항목 이미지 로드
        const items = day.itineraryItems || [];
        items.forEach((item) => {
          if (item.placeId && !placeImages[item.placeId]) {
            // 이미지 로딩 중복 방지
            const loadImage = async () => {
              try {
                const response = await fetch(`/api/places/details?placeId=${encodeURIComponent(item.placeId)}`);
                if (!response.ok) return;
                
                const data = await response.json();
                const photos = data.photos || [];
                if (photos.length > 0) {
                  const imageUrl = `/api/places/photo?name=${encodeURIComponent(photos[0].name)}&maxWidth=400`;
                  setPlaceImages(prev => {
                    // 중복 체크
                    if (prev[item.placeId]) return prev;
                    return { ...prev, [item.placeId]: imageUrl };
                  });
                }
              } catch (err) {
                console.error('이미지 가져오기 실패:', err);
              }
            };
            imagePromises.push(loadImage());
          }
        });
        
        // 숙소 이미지 로드
        try {
          const accommodation = day.accommodationJson
            ? JSON.parse(day.accommodationJson)
            : null;
          
          if (accommodation && accommodation.placeId && !placeImages[accommodation.placeId]) {
            const loadAccommodationImage = async () => {
              try {
                const response = await fetch(`/api/places/details?placeId=${encodeURIComponent(accommodation.placeId)}`);
                if (!response.ok) return;
                
                const data = await response.json();
                const photos = data.photos || [];
                if (photos.length > 0) {
                  const imageUrl = `/api/places/photo?name=${encodeURIComponent(photos[0].name)}&maxWidth=400`;
                  setPlaceImages(prev => {
                    // 중복 체크
                    if (prev[accommodation.placeId]) return prev;
                    return { ...prev, [accommodation.placeId]: imageUrl };
                  });
                }
              } catch (err) {
                console.error('숙소 이미지 가져오기 실패:', err);
              }
            };
            imagePromises.push(loadAccommodationImage());
          }
        } catch {
          // accommodationJson 파싱 실패 시 무시
        }
      });
      await Promise.all(imagePromises);
    };
    
    loadImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip, loading, sortedDays]);

  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h2>
          <Link
            to="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    // "HH:MM:SS" 또는 "HH:MM" 형태를 간단히 "HH:MM"으로 표시
    const [hh, mm] = timeString.split(':');
    return `${hh}:${mm}`;
  };

  // 체류 시간을 읽기 쉬운 형태로 포맷팅
  const formatDuration = (minutes) => {
    if (!minutes || minutes === 0) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `약 ${hours}시간 ${mins}분`;
    } else if (hours > 0) {
      return `약 ${hours}시간`;
    } else {
      return `약 ${mins}분`;
    }
  };

  // 이동 수단을 한국어로 변환
  const formatTravelMode = (mode) => {
    if (!mode) return '';
    const modeMap = {
      DRIVE: '자동차',
      TRANSIT: '대중교통',
      WALK: '도보',
    };
    return modeMap[mode] || mode;
  };

  // 카테고리를 한국어로 변환
  const formatCategory = (category) => {
    if (!category) return '';
    const categoryMap = {
      tourist_attraction: '관광지',
      restaurant: '식당',
      cafe: '카페',
      hotel: '숙소',
      shopping_mall: '쇼핑몰',
      park: '공원',
      museum: '박물관',
      church: '교회',
      temple: '사원',
    };
    return categoryMap[category.toLowerCase()] || category;
  };

  // 거리를 읽기 쉬운 형태로 포맷팅
  const formatDistance = (km) => {
    if (!km || km === 0) return null;
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* 본문 - 2개 컬럼 레이아웃 */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">여행 상세 정보를 불러오는 중...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg max-w-5xl mx-auto mt-8">
          <p className="font-medium mb-1">오류가 발생했습니다</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : !trip ? (
        <div className="text-center py-12 text-gray-600">여행 정보를 찾을 수 없습니다.</div>
      ) : (
        <div className="flex h-[calc(100vh-200px)]">
          {/* 왼쪽: 일정 패널 (스크롤 가능) */}
          <div className="w-1/2 border-r border-gray-200 overflow-y-auto bg-gray-50">
            <div className="p-6 space-y-6">
              {/* 간단 요약 카드 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">여행 요약</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-700">
                  <div>
                    <p className="text-gray-500 mb-1">여행지</p>
                    <p>{trip.destination || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">여행 기간</p>
                    <p>
                      {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">전체 일정</p>
                    <p>
                      {trip.daysCount ?? 0}일 / {trip.totalItineraryItemsCount ?? 0}개
                    </p>
                  </div>
                </div>
              </div>

              {/* 전체 일정 패널 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-900">전체 일정</h2>
                  <select
                    value={selectedDay === null ? 'all' : selectedDay}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedDay(value === 'all' ? null : parseInt(value));
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">전체</option>
                    {sortedDays.map((day) => (
                      <option key={day.id} value={day.dayNumber}>
                        {day.dayNumber}일차
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  하루씩 펼쳐보면서, 각 일정 항목을 간단히 확인할 수 있습니다.
                </p>
              </div>

              {sortedDays.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500 text-sm">
                  아직 저장된 일차/일정 정보가 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {sortedDays
                    .filter((day) => selectedDay === null || day.dayNumber === selectedDay)
                    .map((day) => {
                    const items = (day.itineraryItems || []).slice().sort((a, b) => {
                      if (a.orderSequence && b.orderSequence) {
                        return a.orderSequence - b.orderSequence;
                      }
                      return 0;
                    });

                    return (
                      <div key={day.id} className="px-6 py-5">
                        <div className="flex items-baseline justify-between mb-3">
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">
                              {day.dayNumber}일차{' '}
                              <span className="ml-2 text-sm text-gray-500">
                                {formatDate(day.date)}
                              </span>
                            </h3>
                            {(day.dayStartTime || day.dayEndTime) && (
                              <p className="text-sm text-gray-500 mt-1">
                                {day.dayStartTime && `시작 ${formatTime(day.dayStartTime)}`}
                                {day.dayStartTime && day.dayEndTime && ' · '}
                                {day.dayEndTime && `종료 ${formatTime(day.dayEndTime)}`}
                              </p>
                            )}
                          </div>
                        </div>

                        {items.length === 0 ? (
                          <p className="text-sm text-gray-500">등록된 일정이 없습니다.</p>
                        ) : (
                          <ol className="space-y-4">
                            {items.map((item, index) => {
                              const isLastItem = index === items.length - 1;
                              const hasTravelInfo = !isLastItem && (
                                item.travelToNextDistanceKm ||
                                item.travelToNextDurationMinutes ||
                                item.travelToNextMode
                              );

                              return (
                                <li key={item.id || `${day.id}-${item.orderSequence}-${index}`} className="space-y-3">
                                  {/* 일정 항목 카드 */}
                                  <div 
                                    className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => {
                                      setPlaceDetailModal(item);
                                      // placeId가 있으면 추가 정보 가져오기
                                      if (item.placeId) {
                                        fetch(`/api/places/details?placeId=${encodeURIComponent(item.placeId)}`)
                                          .then(res => res.json())
                                          .then(data => {
                                            setPlaceDetailData(data);
                                          })
                                          .catch(err => {
                                            console.error('장소 상세 정보 가져오기 실패:', err);
                                            setPlaceDetailData(null);
                                          });
                                      } else {
                                        setPlaceDetailData(null);
                                      }
                                    }}
                                  >
                                    <div className="px-4 py-4 flex gap-4">
                                      {/* 이미지 썸네일 */}
                                      {placeImages[item.placeId] && (
                                        <div className="w-20 h-20 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                                          <img 
                                            src={placeImages[item.placeId]} 
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              if (!e.target.src.startsWith('data:')) {
                                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Yzk5YzMiIGR5PSIuM2VtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                                              }
                                            }}
                                          />
                                        </div>
                                      )}
                                      
                                      {/* 정보 영역 */}
                                      <div className="flex-1 min-w-0">
                                        {/* 헤더: 순서 번호와 시간 */}
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                            #{item.orderSequence}
                                          </span>
                                          {(item.startTime || item.endTime) && (
                                            <span className="text-xs font-medium text-gray-600">
                                              {item.startTime && formatTime(item.startTime)} ~{' '}
                                              {item.endTime && formatTime(item.endTime)}
                                            </span>
                                          )}
                                        </div>

                                        {/* 제목 */}
                                        <h4 className="text-base font-semibold text-gray-900 mb-2">
                                          {item.title}
                                        </h4>

                                        {/* 주소 */}
                                        {item.address && (
                                          <p className="text-xs text-gray-500 mb-2">
                                            {item.address}
                                          </p>
                                        )}

                                        {/* 설명 */}
                                        {item.description && (
                                          <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                                            {item.description}
                                          </p>
                                        )}

                                        {/* 상세 정보 그리드 */}
                                        <div className="flex flex-wrap gap-3 text-xs text-gray-600 mt-3 pt-3 border-t border-gray-100">
                                          {/* 체류 시간 */}
                                          {item.stayDurationMinutes && (
                                            <div className="flex items-center gap-1">
                                              <span className="text-gray-400">⏱️</span>
                                              <span>
                                                체류: {formatDuration(item.stayDurationMinutes)}
                                              </span>
                                            </div>
                                          )}

                                          {/* 카테고리 */}
                                          {item.category && (
                                            <div className="flex items-center gap-1">
                                              <span className="text-gray-400">🏷️</span>
                                              <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                                {formatCategory(item.category)}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* 이동 정보 (마지막 항목이 아닐 때만 표시) */}
                                  {hasTravelInfo && (
                                    <div className="ml-4 pl-4 border-l-2 border-dashed border-gray-300">
                                      <div className="bg-gray-50 rounded-md px-3 py-2 text-xs text-gray-600">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-medium text-gray-700">
                                            다음 장소로 이동:
                                          </span>
                                          {item.travelToNextMode && (
                                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                              {formatTravelMode(item.travelToNextMode)}
                                            </span>
                                          )}
                                          {item.travelToNextDurationMinutes && (
                                            <span>
                                              ⏱️ {formatDuration(item.travelToNextDurationMinutes)}
                                            </span>
                                          )}
                                          {item.travelToNextDistanceKm && (
                                            <span>
                                              📍 {formatDistance(item.travelToNextDistanceKm)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ol>
                        )}

                        {/* 숙소 정보 */}
                        {(() => {
                          try {
                            const accommodation = day.accommodationJson
                              ? JSON.parse(day.accommodationJson)
                              : null;
                            
                            if (!accommodation) return null;

                            return (
                              <div className="mt-4 space-y-3">
                                {/* 숙소로 가는 이동 정보 (일정이 있을 때만) */}
                                {items.length > 0 && (
                                  <div className="ml-4 pl-4 border-l-2 border-dashed border-orange-300">
                                    <div className="bg-orange-50 rounded-md px-3 py-2 text-xs text-orange-700">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium">🏨 숙소로 이동</span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* 숙소 정보 카드 */}
                                <div className="border-2 border-orange-200 rounded-lg overflow-hidden bg-gradient-to-r from-orange-50 to-amber-50 shadow-sm">
                                  <div className="px-4 py-4 flex gap-4">
                                    {/* 숙소 이미지 썸네일 */}
                                    {(accommodation.placeId && placeImages[accommodation.placeId]) || accommodation.image ? (
                                      <div className="w-20 h-20 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                                        <img 
                                          src={accommodation.placeId && placeImages[accommodation.placeId] 
                                            ? placeImages[accommodation.placeId]
                                            : accommodation.image} 
                                          alt={accommodation.name || '숙소'}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            if (!e.target.src.startsWith('data:')) {
                                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Yzk5YzMiIGR5PSIuM2VtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                                            }
                                          }}
                                        />
                                      </div>
                                    ) : null}
                                    
                                    {/* 정보 영역 */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start gap-3">
                                        <div className="text-2xl">🏨</div>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-2">
                                            <h4 className="text-base font-semibold text-gray-900">
                                              {accommodation.name || '숙소 정보'}
                                            </h4>
                                            {accommodation.rating && (
                                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                                                ⭐ {accommodation.rating}
                                              </span>
                                            )}
                                          </div>
                                          
                                          {accommodation.address && (
                                            <p className="text-sm text-gray-700 mb-1">
                                              📍 {accommodation.address}
                                            </p>
                                          )}
                                          
                                          {accommodation.description && (
                                            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                                              {accommodation.description}
                                            </p>
                                          )}

                                          {/* 숙소 상세 정보 */}
                                          <div className="flex flex-wrap gap-3 text-xs text-gray-600 mt-3 pt-3 border-t border-orange-200">
                                            {accommodation.category && (
                                              <div className="flex items-center gap-1">
                                                <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                                                  {accommodation.category}
                                                </span>
                                              </div>
                                            )}
                                            {accommodation.priceLevel && (
                                              <div className="flex items-center gap-1">
                                                <span className="text-gray-500">
                                                  💰 {accommodation.priceLevel}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          } catch (e) {
                            console.error('숙소 정보 파싱 실패:', e);
                            return null;
                          }
                        })()}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            </div>
          </div>

          {/* 오른쪽: 지도 패널 */}
          <div className="w-1/2 bg-white">
            {!apiKey ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Google Maps API 키가 필요합니다
              </div>
            ) : (
              <div ref={mapRef} className="w-full h-full" />
            )}
          </div>
        </div>
      )}

      {/* 장소 상세 정보 모달 */}
      {placeDetailModal && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50" 
          onClick={() => {
            setPlaceDetailModal(null);
            setPlaceDetailData(null);
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">장소 정보</h3>
              <button 
                onClick={() => {
                  setPlaceDetailModal(null);
                  setPlaceDetailData(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 모달 본문 */}
            <div className="p-6">
              {/* 이미지 */}
              {(placeDetailModal.placeId && placeImages[placeDetailModal.placeId]) && (
                <div className="mb-4">
                  <img 
                    src={placeImages[placeDetailModal.placeId].replace('maxWidth=400', 'maxWidth=600')} 
                    alt={placeDetailModal.title}
                    className="w-full h-64 object-cover rounded-lg"
                    onError={(e) => {
                      if (!e.target.src.startsWith('data:')) {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjIwIiBmaWxsPSIjOWM5OWMzIiBkeT0iLjNlbSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
                      }
                    }}
                  />
                </div>
              )}

              {/* 기본 정보 */}
              <div className="mb-4">
                <h4 className="text-2xl font-bold text-gray-800 mb-2">{placeDetailModal.title}</h4>
                {placeDetailModal.category && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      {formatCategory(placeDetailModal.category)}
                    </span>
                  </div>
                )}
                {placeDetailModal.address && (
                  <p className="text-gray-600 text-sm flex items-start gap-2 mt-2">
                    <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{placeDetailModal.address}</span>
                  </p>
                )}
              </div>

              {/* Google Places API에서 가져온 추가 정보 */}
              {placeDetailData && (
                <>
                  {/* 평점 정보 */}
                  {(placeDetailData.rating || placeDetailData.userRatingCount) && (
                    <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
                      {placeDetailData.rating && (
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-lg font-semibold text-gray-800">{placeDetailData.rating}</span>
                        </div>
                      )}
                      {placeDetailData.userRatingCount && (
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          <span className="text-gray-600">{placeDetailData.userRatingCount} 리뷰</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 설명 - 저장된 한글 설명 우선, editorialSummary는 한글일 때만 표시 */}
                  {(placeDetailModal.description || (placeDetailData.editorialSummary?.text && /[가-힣]/.test(placeDetailData.editorialSummary.text))) && (
                    <div className="mb-6">
                      <h5 className="text-lg font-semibold text-gray-800 mb-2">장소 소개</h5>
                      <p className="text-gray-600 leading-relaxed">
                        {placeDetailModal.description || (placeDetailData.editorialSummary?.text && /[가-힣]/.test(placeDetailData.editorialSummary.text) ? placeDetailData.editorialSummary.text : '')}
                      </p>
                    </div>
                  )}
                  
                  {/* 설명이 없는 경우 */}
                  {!placeDetailModal.description && (!placeDetailData.editorialSummary?.text || !/[가-힣]/.test(placeDetailData.editorialSummary.text)) && (
                    <div className="mb-6">
                      <p className="text-gray-400 text-sm italic">이 장소에 대한 설명이 제공되지 않았습니다.</p>
                    </div>
                  )}

                  {/* 영업 시간 */}
                  {(placeDetailData.currentOpeningHours || placeDetailData.regularOpeningHours) && (
                    <div className="mb-6">
                      <h5 className="text-lg font-semibold text-gray-800 mb-3">영업 시간</h5>
                      {(() => {
                        const openingHours = placeDetailData.currentOpeningHours || placeDetailData.regularOpeningHours;
                        const weekdayTexts = openingHours?.weekdayDescriptions || [];
                        const openNow = openingHours?.openNow;
                        
                        // 요일 영어를 한글로 변환
                        const translateWeekday = (text) => {
                          if (!text) return text;
                          // 이미 한글이 포함되어 있으면 그대로 반환
                          if (/[가-힣]/.test(text)) return text;
                          
                          return text
                            .replace(/Monday/g, '월요일')
                            .replace(/Tuesday/g, '화요일')
                            .replace(/Wednesday/g, '수요일')
                            .replace(/Thursday/g, '목요일')
                            .replace(/Friday/g, '금요일')
                            .replace(/Saturday/g, '토요일')
                            .replace(/Sunday/g, '일요일')
                            .replace(/Mon\./g, '월')
                            .replace(/Tue\./g, '화')
                            .replace(/Wed\./g, '수')
                            .replace(/Thu\./g, '목')
                            .replace(/Fri\./g, '금')
                            .replace(/Sat\./g, '토')
                            .replace(/Sun\./g, '일')
                            .replace(/\bAM\b/g, '오전')
                            .replace(/\bPM\b/g, '오후')
                            .replace(/Closed/g, '휴무')
                            .replace(/Open 24 hours/g, '24시간 영업')
                            .replace(/Open/g, '영업');
                        };
                        
                        return (
                          <div className="space-y-2">
                            {openNow !== undefined && (
                              <div className="flex items-center gap-2 mb-3">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  openNow 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {openNow ? '🟢 영업 중' : '🔴 영업 종료'}
                                </span>
                              </div>
                            )}
                            {weekdayTexts.length > 0 ? (
                              <div className="space-y-1">
                                {weekdayTexts.map((text, idx) => (
                                  <p key={idx} className="text-sm text-gray-600">
                                    {translateWeekday(text)}
                                  </p>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">영업 시간 정보가 없습니다.</p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* 연락처 정보 */}
                  {(placeDetailData.internationalPhoneNumber || placeDetailData.websiteUri) && (
                    <div className="mb-6">
                      <h5 className="text-lg font-semibold text-gray-800 mb-3">연락처 정보</h5>
                      <div className="space-y-2">
                        {placeDetailData.internationalPhoneNumber && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <a 
                              href={`tel:${placeDetailData.internationalPhoneNumber}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {placeDetailData.internationalPhoneNumber}
                            </a>
                          </div>
                        )}
                        {placeDetailData.websiteUri && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                            <a 
                              href={placeDetailData.websiteUri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              웹사이트 방문
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 가격 수준 */}
                  {placeDetailData.priceLevel && (
                    <div className="mb-6">
                      <h5 className="text-lg font-semibold text-gray-800 mb-2">가격 수준</h5>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4].map((level) => (
                          <span
                            key={level}
                            className={`text-lg ${
                              level <= placeDetailData.priceLevel
                                ? 'text-green-600'
                                : 'text-gray-300'
                            }`}
                          >
                            ₩
                          </span>
                        ))}
                        <span className="ml-2 text-sm text-gray-600">
                          {placeDetailData.priceLevel === 1 && '(저렴함)'}
                          {placeDetailData.priceLevel === 2 && '(보통)'}
                          {placeDetailData.priceLevel === 3 && '(비쌈)'}
                          {placeDetailData.priceLevel === 4 && '(매우 비쌈)'}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* 체류 시간 정보 */}
              {placeDetailModal.stayDurationMinutes && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>⏱️</span>
                    <span>체류 시간: {formatDuration(placeDetailModal.stayDurationMinutes)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripDetailPage;


