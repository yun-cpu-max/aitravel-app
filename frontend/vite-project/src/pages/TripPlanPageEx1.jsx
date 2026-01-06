/**
 * TripPlanPageEx1
 * - 여행 일정 생성 마법사(프론트 전용 목업)
 * - Google Maps JavaScript Places 라이브러리 사용 버전 (키는 .env)
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// 환경 변수에서 API 키를 사용합니다 (Vite: import.meta.env.VITE_GOOGLE_MAPS_API_KEY)

const CATEGORY_OPTIONS = [
  { key: 'sightseeing', label: '관광지' },
  { key: 'cafe', label: '카페' },
  { key: 'food', label: '음식' },
  { key: 'attraction', label: '어트랙션' },
];

// ... (MOCK_PLACES, defaultDirectPlan 함수는 그대로 유지)
const MOCK_PLACES = [
  { id: 'p1', name: '중앙 박물관', category: '관광지', stayMinutes: 90 },
  { id: 'p2', name: '리버뷰 카페', category: '카페', stayMinutes: 60 },
  { id: 'p3', name: '현지 맛집 A', category: '음식', stayMinutes: 70 },
  { id: 'p4', name: '테마파크', category: '어트랙션', stayMinutes: 180 },
  { id: 'p5', name: '구시가지 산책', category: '관광지', stayMinutes: 80 },
];

const defaultDirectPlan = () => ({
  days: [
    { day: 1, items: [] },
    { day: 2, items: [] },
    { day: 3, items: [] },
  ],
});

// 달력 유틸과 오늘 날짜는 최상위에 고정해 두어 재정의로 인한 리렌더/포커스 손실을 방지
const TODAY = new Date();
const TODAY_START = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

// (정적지도 사용으로 JS 로더는 미사용)

const TripPlanPageEx1 = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  // 0: 공통 입력, 1: 모드 선택, 2: 분기 본문(직접/AI), 3: 편집/확인
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState('direct'); // 'direct' | 'ai'

  // 공통 입력값
  const [destinationInput, setDestinationInput] = useState(''); // 검색창에 입력되는 값
  const [selectedDestination, setSelectedDestination] = useState({ name: '', placeId: '', lat: null, lng: null }); // 최종 선택된 여행지 정보
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  // 날짜별 시간 설정: { 'YYYY-MM-DD': { startTime: '10:00', endTime: '22:00' } }
  const [dailyTimeSettings, setDailyTimeSettings] = useState({});
  
  // 자동완성용 상태 (목업 데이터 사용)
  // const destinationRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 로컬 스토리지 자동 저장 로직 (이전에 입력 문제로 비활성화)
  // ... (로컬 스토리지 관련 로직은 현재 비활성화된 상태로 유지)

  // 달력 상태
  const [viewYear, setViewYear] = useState(TODAY.getFullYear());
  const [viewMonth, setViewMonth] = useState(TODAY.getMonth());
  const [calendarOpen, setCalendarOpen] = useState(false);

  // 파일 상단에 고정된 유틸을 사용합니다

  const handleDateClick = (day) => {
    const selected = new Date(viewYear, viewMonth, day);
    if (selected < TODAY_START) return; // 과거 금지

    // 시작 없음 또는 범위 완료 상태면: 새 시작
    if (!startDate || endDate) {
      setStartDate(selected);
      setEndDate(null);
      return;
    }

    // 시작만 선택된 상태
    if (selected < startDate) {
      // 더 이른 날짜를 클릭하면 그 날짜가 새로운 시작
      setStartDate(selected);
      setEndDate(null);
      return;
    }

    // 시작 이후 클릭: 10일 윈도 안이면 종료로 확정, 밖이면 시작을 재설정
    const diffDays = Math.floor((selected - startDate) / MS_PER_DAY) + 1; // 포함일수
    if (diffDays <= 10) {
      setEndDate(selected);
    } else {
      setStartDate(selected);
      setEndDate(null);
    }
  };

  const applyDateRange = () => {
    if (startDate && endDate) {
      const fs = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      const fe = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
      setDateRange(`${fs} ~ ${fe}`);
      
      // 날짜 범위 선택 시 기본 시간 설정 초기화 (오전 10시 ~ 오후 10시)
      const newSettings = {};
      const current = new Date(startDate);
      while (current <= endDate) {
        const dateKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
        if (!dailyTimeSettings[dateKey]) {
          newSettings[dateKey] = { startTime: '10:00', endTime: '22:00' };
        }
        current.setDate(current.getDate() + 1);
      }
      if (Object.keys(newSettings).length > 0) {
        setDailyTimeSettings(prev => ({ ...prev, ...newSettings }));
      }
      
      setCalendarOpen(false);
    }
  };

  // 날짜별 시간 업데이트 핸들러
  const updateDailyTime = (dateKey, field, value) => {
    setDailyTimeSettings(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        [field]: value
      }
    }));
  };

  // 총 여행 시간 계산 (분 단위)
  const calculateTotalTravelTime = () => {
    if (!startDate || !endDate) return 0;
    
    const current = new Date(startDate);
    let totalMinutes = 0;
    
    while (current <= endDate) {
      const dateKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      const settings = dailyTimeSettings[dateKey] || { startTime: '10:00', endTime: '22:00' };
      
      const [startH, startM] = settings.startTime.split(':').map(Number);
      const [endH, endM] = settings.endTime.split(':').map(Number);
      
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      
      totalMinutes += (endMinutes - startMinutes);
      current.setDate(current.getDate() + 1);
    }
    
    return totalMinutes;
  };

  // 총 여행 시간 포맷팅
  const formatTotalTravelTime = () => {
    const totalMinutes = calculateTotalTravelTime();
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}시간 ${String(minutes).padStart(2, '0')}분`;
  };

  // 날짜 범위 내 모든 날짜 배열 생성
  const getAllDatesInRange = () => {
    if (!startDate || !endDate) return [];
    
    const dates = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  // 날짜 포맷팅 (YYYY.MM.DD(요일))
  const formatDateWithWeekday = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    return `${year}.${month}.${day}(${weekday})`;
  };
  
  // ------------------------------------------------------------------
  // 📍 Google Maps JS 로더 & Places AutocompleteService/Geocoder 사용
  // ------------------------------------------------------------------

  // Google Maps JS script 로드 (입력 안정성을 위해 비활성화)
  // useEffect(() => {
  //   const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  //   if (!apiKey) {
  //     if (import.meta.env.DEV) {
  //       console.warn('VITE_GOOGLE_MAPS_API_KEY 가 설정되지 않았습니다. 자동완성이 비활성화됩니다.');
  //     }
  //     return;
  //   }
  //   // ... Google Maps 로딩 로직
  // }, []);

  // (Autocomplete 위젯 사용으로 별도 디바운스 불필요)

  // 자동완성 위젯은 사용하지 않고, 버튼 클릭 시 한 번만 호출하는 모드로 동작
  // useEffect(() => {
  //   // no-op: manual search mode
  // }, [googleReady]);

  // 목업 도시 데이터
  // const mockCities = [
  //   { name: '도쿄, 일본', lat: 35.6762, lng: 139.6503 },
  //   { name: '파리, 프랑스', lat: 48.8566, lng: 2.3522 },
  //   { name: '제주도, 한국', lat: 33.4996, lng: 126.5312 },
  //   { name: '서울, 한국', lat: 37.5665, lng: 126.9780 },
  //   { name: '부산, 한국', lat: 35.1796, lng: 129.0756 },
  //   { name: '뉴욕, 미국', lat: 40.7128, lng: -74.0060 },
  //   { name: '런던, 영국', lat: 51.5074, lng: -0.1278 },
  //   { name: '시드니, 호주', lat: -33.8688, lng: 151.2093 },
  //   { name: '방콕, 태국', lat: 13.7563, lng: 100.5018 },
  //   { name: '싱가포르', lat: 1.3521, lng: 103.8198 },
  // ];

  // 수동 검색 핸들러 (버튼 클릭) - 백엔드 프록시 호출
  const handleSearchCity = async () => {
    const q = (destinationInput || '').trim();
    if (q.length < 1) {
      alert('한 글자 이상 입력해주세요.');
      return;
    }

    setLoadingPlaces(true);
    setShowSuggestions(true);

    try {
      const res = await fetch('/api/places/autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ q })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
      }
      const data = await res.json();
      // 백엔드 정규화 결과만 사용하여 표시 텍스트 일관화
      const normalized = Array.isArray(data.normalizedSuggestions) ? data.normalizedSuggestions : [];
      const list = normalized
        .map((n) => ({ place_id: n.placeId, description: n.display }))
        .filter((x) => x.place_id && typeof x.description === 'string' && x.description.trim().length > 0);
      setSuggestions(list);
    } catch (err) {
      if (import.meta.env.DEV) console.warn('autocomplete 호출 실패', err);
      setSuggestions([]);
      alert('검색에 실패했습니다. 키/네트워크를 확인해 주세요.');
    } finally {
      setLoadingPlaces(false);
    }
  };

  // 예측 선택 시 좌표 조회 후 반영 - 프록시 지오코딩 호출
  const handleSelectPrediction = async (placeId, description) => {
    setDestinationInput(description);
    setShowSuggestions(false);
    setLoadingPlaces(true);
    try {
      const res = await fetch(`/api/places/geocode?placeId=${encodeURIComponent(placeId)}`);
      const data = await res.json();
      const loc = data?.results?.[0]?.geometry?.location;
      if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
        setSelectedDestination({ name: description, placeId, lat: loc.lat, lng: loc.lng });
      } else {
        alert('좌표를 가져오지 못했습니다. 다시 시도해 주세요.');
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('geocode 호출 실패', err);
      alert('좌표 조회 실패');
    } finally {
      setLoadingPlaces(false);
    }
  };
  
  // (Autocomplete 위젯 사용으로 별도 선택 핸들러 불필요)

  // ... (직접 선택 및 AI 모드 로직은 그대로 유지)
  // 직접 선택: 일정 조작 상태
  // 기존 목업 상태는 제거(미사용 경고 방지)
  // 제거된 목업 상태: 사용 안 함
  // const [selectedCategories] = useState(['관광지', '음식']);
  // const [placeSearch] = useState('');
  const [directPlan, setDirectPlan] = useState(defaultDirectPlan());

  // 직접 선택: Google Places 기반 검색 상태 (명소/카페/음식점)
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all', '명소', '식당', '카페'
  const [allPlaces, setAllPlaces] = useState([]); // API에서 가져온 전체 장소 목록
  const [placesLoading, setPlacesLoading] = useState(false);
  
  // 선택된 장소 목록
  const [selectedPlaces, setSelectedPlaces] = useState([]); // [{id, name, category, address, image, likes, rating, lat, lng, stayHours, stayMinutes}]
  
  // 선택된 숙소 목록 (부모로 이동)
  const [selectedAccommodations, setSelectedAccommodations] = useState([]); // {dayIndex, accommodation}
  
  // 숙소 목록 (부모로 이동하여 한 번만 로드)
  const [accommodations, setAccommodations] = useState([]);
  const [accommodationsLoading, setAccommodationsLoading] = useState(false);
  const accommodationsFetched = useRef(false);
  
  // 장소 상세 모달 상태
  const [placeDetailModal, setPlaceDetailModal] = useState(null); // 선택된 장소의 상세 정보
  const [placeDetailData, setPlaceDetailData] = useState(null); // Google Places API에서 가져온 추가 정보
  
  // 장소 등록 모달 상태
  const [placeRegistrationModal, setPlaceRegistrationModal] = useState(false);
  
  // 카테고리별 Google Places 타입 매핑
  const categoryToPlaceTypes = {
    '명소': ['tourist_attraction', 'museum', 'art_gallery', 'amusement_park', 'zoo', 'aquarium'],
    '식당': ['restaurant', 'meal_takeaway', 'meal_delivery'],
    '카페': ['cafe', 'bakery', 'coffee_shop']
  };
  
  // 카테고리별 타입에서 한글 카테고리로 역매핑 (현재는 사용하지 않지만 나중에 필요할 수 있음)
  // const getKoreanCategory = (types) => {
  //   if (!Array.isArray(types)) return '명소';
  //   
  //   const typeSet = new Set(types);
  //   
  //   // 카페 체크
  //   if (categoryToPlaceTypes['카페'].some(t => typeSet.has(t))) {
  //     return '카페';
  //   }
  //   // 식당 체크
  //   if (categoryToPlaceTypes['식당'].some(t => typeSet.has(t))) {
  //     return '식당';
  //   }
  //   // 명소 체크 (기본값)
  //   return '명소';
  // };
  
  // 숙소 데이터 가져오기 (부모 컴포넌트에서 한 번만 실행)
  const fetchAccommodations = async () => {
    if (!selectedDestination.lat || !selectedDestination.lng) return;
    if (accommodationsFetched.current) return; // 이미 로드했으면 스킵
    
    setAccommodationsLoading(true);
    accommodationsFetched.current = true;
    
    try {
      const res = await fetch('/api/places/nearby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: selectedDestination.lat,
          longitude: selectedDestination.lng,
          radius: 50000,
          categories: ['lodging', 'hotel', 'hostel', 'resort_hotel', 'guest_house']
        })
      });
      
      if (!res.ok) {
        console.warn(`숙소 검색 실패: HTTP ${res.status}`);
        setAccommodations([]);
        return;
      }
      
      const data = await res.json();
      const places = data.places || [];
      
      const transformed = places.map((place, index) => {
        const displayName = place.displayName?.text || place.displayName || '이름 없음';
        const address = place.formattedAddress || '주소 정보 없음';
        const lat = place.location?.latitude;
        const lng = place.location?.longitude;
        const rating = place.rating || 0;
        const userRatingCount = place.userRatingCount || 0;
        const photos = place.photos || [];
        const firstPhoto = photos.length > 0 ? photos[0].name : null;
        const editorialSummary = place.editorialSummary?.text || place.editorialSummary || '';
        
        let image = null;
        if (firstPhoto) {
          image = `/api/places/photo?name=${encodeURIComponent(firstPhoto)}&maxWidth=200`;
        }
        
        return {
          id: place.id || `accommodation-${index}`,
          name: displayName,
          category: '숙소',
          address,
          image,
          likes: userRatingCount,
          rating: rating,
          lat,
          lng,
          description: editorialSummary,
        };
      });
      
      setAccommodations(transformed);
    } catch (err) {
      console.error('숙소 fetch error:', err);
      setAccommodations([]);
    } finally {
      setAccommodationsLoading(false);
    }
  };
  
  // 도시의 모든 카테고리 장소 가져오기 (각 카테고리별로 30개씩)
  const fetchAllPlaces = async () => {
    if (!selectedDestination.lat || !selectedDestination.lng) {
      return;
    }
    
    setPlacesLoading(true);
    try {
      const allPlaces = [];
      
      // 각 카테고리별로 순차적으로 요청
      for (const [categoryName, types] of Object.entries(categoryToPlaceTypes)) {
        try {
          const res = await fetch('/api/places/nearby', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              latitude: selectedDestination.lat,
              longitude: selectedDestination.lng,
              radius: 50000, // 50km
              categories: types
            })
          });
          
          if (!res.ok) {
            console.warn(`${categoryName} 카테고리 검색 실패: HTTP ${res.status}`);
            continue;
          }
          
          const data = await res.json();
          const places = data.places || [];
          
          // 데이터 변환 (각 카테고리별로 명시적으로 카테고리 설정)
          const transformed = places.map((place, index) => {
            const displayName = place.displayName?.text || place.displayName || '이름 없음';
            const address = place.formattedAddress || '주소 정보 없음';
            const lat = place.location?.latitude;
            const lng = place.location?.longitude;
            const rating = place.rating || 0;
            const userRatingCount = place.userRatingCount || 0;
            const photos = place.photos || [];
            const firstPhoto = photos.length > 0 ? photos[0].name : null;
            const editorialSummary = place.editorialSummary?.text || place.editorialSummary || '';
            
            // 사진 URL 생성
            let image = null;
            if (firstPhoto) {
              image = `/api/places/photo?name=${encodeURIComponent(firstPhoto)}&maxWidth=200`;
            }
            
            return {
              id: place.id || `place-${categoryName}-${index}`,
              name: displayName,
              category: categoryName, // 요청한 카테고리를 직접 사용
              address,
              image,
              likes: userRatingCount,
              rating: rating,
              lat,
              lng,
              description: editorialSummary,
            };
          });
          
          allPlaces.push(...transformed);
        } catch (err) {
          console.error(`${categoryName} 카테고리 검색 오류:`, err);
        }
      }
      
      setAllPlaces(allPlaces);
    } catch (err) {
      console.error('Place fetch error:', err);
      alert('장소 정보를 가져오는데 실패했습니다.');
      setAllPlaces([]);
    } finally {
      setPlacesLoading(false);
    }
  };
  
  // 카테고리 필터링된 장소 목록
  const filteredPlaces = useMemo(() => {
    if (selectedCategory === 'all') return allPlaces;
    return allPlaces.filter(p => p.category === selectedCategory);
  }, [selectedCategory, allPlaces]);
  
  // 장소 선택/해제
  const togglePlaceSelection = (place) => {
    setSelectedPlaces(prev => {
      const isSelected = prev.some(p => p.id === place.id);
      if (isSelected) {
        return prev.filter(p => p.id !== place.id);
      } else {
        return [...prev, { ...place, stayHours: 2, stayMinutes: 0 }];
      }
    });
  };
  
  // 선택된 장소 제거
  const removeSelectedPlace = (placeId) => {
    setSelectedPlaces(prev => prev.filter(p => p.id !== placeId));
  };
  
  // 선택된 장소의 체류 시간 업데이트 (총 여행 시간 초과 방지)
  const updatePlaceStayTime = (placeId, hours, minutes) => {
    // 현재 장소를 제외한 다른 장소들의 총 시간 계산
    const otherPlacesTotalMinutes = selectedPlaces
      .filter(p => p.id !== placeId)
      .reduce((sum, p) => sum + (p.stayHours || 0) * 60 + (p.stayMinutes || 0), 0);
    
    const newPlaceMinutes = hours * 60 + minutes;
    const totalTravelMinutes = calculateTotalTravelTime();
    
    // 총 시간 초과 체크
    if (otherPlacesTotalMinutes + newPlaceMinutes > totalTravelMinutes) {
      alert(`총 여행 시간(${formatTotalTravelTime()})을 초과할 수 없습니다.`);
      return;
    }
    
    setSelectedPlaces(prev => prev.map(p => 
      p.id === placeId 
        ? { ...p, stayHours: hours, stayMinutes: minutes }
        : p
    ));
  };
  
  // 총 소요 시간 계산
  const totalTime = useMemo(() => {
    const totalMinutes = selectedPlaces.reduce((sum, p) => sum + (p.stayHours || 0) * 60 + (p.stayMinutes || 0), 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { hours, minutes };
  }, [selectedPlaces]);
  
  // 검색된 장소를 선택된 장소 목록에 추가
  const addRegistrationPlaceToSelected = (place) => {
    const isAlreadySelected = selectedPlaces.some(p => p.id === place.id);
    if (isAlreadySelected) {
      alert('이미 선택된 장소입니다.');
      return;
    }
    
    setSelectedPlaces(prev => [...prev, { ...place, stayHours: 2, stayMinutes: 0 }]);
  };

  // 직접 선택: 후보 목록 필터 (상태 선언 이후로 이동)
  // const filteredPlaces = useMemo(() => [], []);

  // AI 모드 상태(목업)
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPlan, setAiPlan] = useState(defaultDirectPlan());

  const [hasUnsavedChanges] = useState(false);
  const initialized = useRef(false);


  // URL 쿼리 파라미터에서 도시 정보 읽어서 자동 입력
  useEffect(() => {
    const cityParam = searchParams.get('city');
    const placeIdParam = searchParams.get('placeId');
    
    if (cityParam && !destinationInput) {
      // URL에서 도시 이름을 가져와서 입력 필드에 설정
      const decodedCity = decodeURIComponent(cityParam);
      setDestinationInput(decodedCity);
      
      // placeId가 있으면 selectedDestination도 설정
      if (placeIdParam) {
        const decodedPlaceId = decodeURIComponent(placeIdParam);
        setSelectedDestination(prev => ({
          ...prev,
          name: decodedCity,
          placeId: decodedPlaceId
        }));
        
        // placeId로 상세 정보 가져오기 (선택사항)
        // 필요하면 여기서 details API 호출하여 lat/lng도 설정 가능
      }
    }
  }, [searchParams, destinationInput]);

  // 로컬 스토리지 초기화 강제는 제거 (입력 중 포커스/값 리셋 방지)
  useEffect(() => {
    initialized.current = true;
  }, []);

  // 로컬 스토리지 저장 (완전 비활성화 - 입력 중 리렌더링 방지)
  // useEffect(() => {
  //   if (!initialized.current) return;
  //   // localStorage.setItem('tripPlanEx1', JSON.stringify(payload));
  //   // setHasUnsavedChanges(true);
  // }, [step, mode, destinationInput, dateRange, startDate, endDate, departurePoint, people, budget, flight, selectedCategories, directPlan, aiPlan]);


  // 나중에 일정 편집 기능에서 사용 예정 (현재 미사용)
  const _addPlaceToDay = (dayIndex, place) => {
    const next = { ...directPlan, days: directPlan.days.map((d, i) => (i === dayIndex ? { ...d } : d)) };
    next.days[dayIndex].items = [...next.days[dayIndex].items, { ...place }];
    setDirectPlan(next);
  };

  const _removePlaceFromDay = (dayIndex, itemIndex) => {
    const next = { ...directPlan, days: directPlan.days.map((d) => ({ ...d, items: [...d.items] })) };
    next.days[dayIndex].items.splice(itemIndex, 1);
    setDirectPlan(next);
  };

  const _movePlace = (dayIndex, itemIndex, dir) => {
    const next = { ...directPlan, days: directPlan.days.map((d) => ({ ...d, items: [...d.items] })) };
    const items = next.days[dayIndex].items;
    const target = itemIndex + dir;
    if (target < 0 || target >= items.length) return;
    const temp = items[itemIndex];
    items[itemIndex] = items[target];
    items[target] = temp;
    setDirectPlan(next);
  };

  const _updateStayMinutes = (dayIndex, itemIndex, minutes) => {
    const next = { ...directPlan, days: directPlan.days.map((d) => ({ ...d, items: [...d.items] })) };
    next.days[dayIndex].items[itemIndex].stayMinutes = Math.max(15, Number(minutes) || 60);
    setDirectPlan(next);
  };

  // 보정/경고(목업) - 나중에 사용 예정
  const _getWarnings = useMemo(() => {
    const warnings = [];
    directPlan.days.forEach((d) => {
      let foodsInRow = 0;
      d.items.forEach((it) => {
        if (it.category === '음식') {
          foodsInRow += 1;
          if (foodsInRow >= 2) warnings.push(`Day ${d.day}: 음식 카테고리가 연속으로 배치되어 있어요.`);
        } else {
          foodsInRow = 0;
        }
      });
      const totalStay = d.items.reduce((acc, it) => acc + (it.stayMinutes || 60), 0);
      if (totalStay > 8 * 60) warnings.push(`Day ${d.day}: 체류 시간이 8시간을 초과합니다.`);
    });
    return warnings;
  }, [directPlan]);

  // AI 생성(목업)
  const runAIGenerate = () => {
    setAiLoading(true);
    setTimeout(() => {
      const result = defaultDirectPlan();
      result.days.forEach((d, idx) => {
        const picks = MOCK_PLACES.slice(idx, idx + 3);
        d.items = picks.map((p) => ({ ...p }));
      });
      setAiPlan(result);
      setAiLoading(false);
      setStep(3);
    }, 800);
  };

  // 공통 헤더 제거 (HeaderView 분리)

  // 외부 CommonFormView로 전달할 상태/핸들러 묶음
  const state = {
    destinationInput,
    selectedDestination,
    dateRange,
    startDate,
    endDate,
    dailyTimeSettings,
    suggestions,
    loadingPlaces,
    showSuggestions,
    viewYear,
    viewMonth,
    calendarOpen,
  };

  const handlers = {
    setDestinationInput,
    setSelectedDestination,
    setCalendarOpen,
    setViewYear,
    setViewMonth,
    handleDateClick,
    applyDateRange,
    handleSearchCity,
    handleSelectPrediction,
    updateDailyTime,
    calculateTotalTravelTime,
    formatTotalTravelTime,
    getAllDatesInRange,
    formatDateWithWeekday,
    setStep,
    setMode,
  };

  // 공통 입력 UI는 외부 컴포넌트로 분리하여 재정의로 인한 리마운트를 방지합니다.

  // 모드 선택 UI
  const ModeSelect = () => (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full max-w-3xl mx-auto text-left">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">모드 선택</h2>
      <p className="text-gray-600 mb-6">원하는 방식으로 일정을 만들어 보세요.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => { setMode('direct'); setStep(2); }}
          className={`p-5 border rounded-lg text-left hover:bg-gray-50 ${mode === 'direct' ? 'border-blue-600' : 'border-gray-200'}`}
        >
          <div className="font-semibold mb-1">직접 선택 모드</div>
          <div className="text-sm text-gray-600">장소를 직접 고르고 순서를 정해요.</div>
        </button>
        <button
          onClick={() => { setMode('ai'); runAIGenerate(); }} // AI 모드는 즉시 생성 시작
          className={`p-5 border rounded-lg text-left hover:bg-gray-50 ${mode === 'ai' ? 'border-blue-600' : 'border-gray-200'}`}
        >
          <div className="font-semibold mb-1">AI 자동 생성 모드</div>
          <div className="text-sm text-gray-600">입력값을 바탕으로 자동 일정을 만들어요.</div>
        </button>
      </div>
      <div className="flex justify-between mt-6">
        <button onClick={() => setStep(0)} className="px-5 py-3 rounded-lg border text-gray-700 hover:bg-gray-50">이전</button>
        <div></div>
      </div>
    </div>
  );

  // 직접 선택 본문 (좌: 검색/리스트 + 선택된 장소, 우: 지도)
  const DirectMode = () => {
    // IME 조합 중 상태 관리
    const [isComposing, setIsComposing] = useState(false);
    
    // 검색 상태 (DirectMode 내부로 이동)
    const [directQuery, setDirectQuery] = useState('');
    const [searchQuery, setSearchQuery] = useState(''); // 실제 검색에 사용되는 쿼리 (엔터 시)
    
    // 선택된 장소 패널 토글 상태
    const [selectedPanelOpen, setSelectedPanelOpen] = useState(true);
    
    // 검색어 필터링 (엔터를 눌렀을 때만 적용)
    const searchFilteredPlaces = useMemo(() => {
      if (!searchQuery.trim()) return filteredPlaces;
      const query = searchQuery.toLowerCase();
      return filteredPlaces.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.address.toLowerCase().includes(query)
      );
    }, [searchQuery]);

    // 컴포넌트 마운트 시 장소 데이터 가져오기
    useEffect(() => {
      if (selectedDestination.lat && selectedDestination.lng && allPlaces.length === 0) {
        fetchAllPlaces();
      }
    }, []); // fetchAllPlaces는 stable하므로 의존성 배열에 포함하지 않음

    return (
      <div className="relative w-full h-screen">
        {/* 배경 지도 (전체 화면) */}
        <div className="absolute inset-0">
          <DirectSearchMap
            centerLat={selectedDestination.lat}
            centerLng={selectedDestination.lng}
            selectedPlaces={selectedPlaces}
          />
        </div>

        <div className="absolute left-0 top-0 bottom-0 w-[110px] bg-white shadow-lg flex flex-col z-10 border-r border-gray-200">
          {/* 단계 목록 */}
          <div className="flex-1 pt-8 pb-4">
            <div className="space-y-1">
              {/* STEP 1: 도시 선택 */}
              <div className={`px-3 py-4 ${step === 0 ? 'bg-cyan-50 border-l-4 border-cyan-400' : ''}`}>
                <div className="text-xs text-gray-500 mb-1">STEP 1</div>
                <div className={`text-sm font-semibold ${step === 0 ? 'text-cyan-600' : 'text-gray-700'}`}>
                  도시 선택
                </div>
              </div>

              {/* STEP 2: 장소 선택 */}
              <div className={`px-3 py-4 ${step === 2 ? 'bg-cyan-50 border-l-4 border-cyan-400' : ''}`}>
                <div className="text-xs text-gray-500 mb-1">STEP 2</div>
                <div className={`text-sm font-semibold ${step === 2 ? 'text-cyan-600' : 'text-gray-700'}`}>
                  장소 선택
                </div>
              </div>

              {/* STEP 3: 숙소 선택 */}
              <div className={`px-3 py-4 ${step === 3 ? 'bg-cyan-50 border-l-4 border-cyan-400' : ''}`}>
                <div className="text-xs text-gray-500 mb-1">STEP 3</div>
                <div className={`text-sm font-semibold ${step === 3 ? 'text-cyan-600' : 'text-gray-700'}`}>
                  숙소 선택
                </div>
              </div>
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="p-3 space-y-2 border-t border-gray-200">
            <button 
              onClick={() => setStep(0)} 
              className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-medium transition-colors"
            >
              이전
            </button>
            <button 
              onClick={() => setStep(3)} 
              className="w-full px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold transition-colors"
            >
              다음
            </button>
          </div>
        </div>

        {/* Unified Panel: 장소 선택 + 선택된 장소 (하나의 패널) */}
        <div className="absolute left-[110px] top-0 bottom-0 flex gap-0 z-10">
          {/* 왼쪽: 장소 선택 영역 */}
          <div className="w-[400px] bg-white shadow-2xl text-left flex flex-col h-full">
            {/* 헤더 */}
            <div className="p-4 pb-3 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                {selectedDestination.name || '여행지'}
              </h2>
              <div className="text-base text-gray-600">
                {startDate && endDate ? (
                  <>
                    {formatDateWithWeekday(startDate)} ~ {formatDateWithWeekday(endDate)}
                  </>
                ) : (
                  dateRange || '날짜 선택'
                )}
              </div>
            </div>
            
            {/* 검색창 및 카테고리 */}
            <div className="p-3 pb-2 border-b border-gray-200 flex-shrink-0">
              {/* 검색창 */}
              <div className="mb-2">
                <div className="relative">
                <input
                    type="text"
                    value={directQuery}
                  onChange={(e) => {
                      setDirectQuery(e.target.value);
                    }}
                    onCompositionStart={() => {
                      setIsComposing(true);
                    }}
                    onCompositionEnd={() => {
                      setIsComposing(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isComposing) {
                        setSearchQuery(directQuery);
                      }
                    }}
                    placeholder="장소명 검색"
                    className="w-full px-3 py-2.5 pl-10 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="mt-1">
                  <button 
                    onClick={() => setPlaceRegistrationModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    찾으시는 장소가 없나요?
                  </button>
                </div>
              </div>

              {/* 카테고리 필터 */}
              <div className="flex gap-1">
                {['all', '명소', '식당', '카페'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex-1 px-2 py-2 rounded text-xs font-medium transition-colors ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat === 'all' ? '전체' : cat}
                  </button>
            ))}
          </div>
        </div>

            {/* 장소 목록 (스크롤 영역) */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
              <div className="space-y-1.5">
                {placesLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                    <span className="text-sm">장소 로딩 중...</span>
                  </div>
                ) : searchFilteredPlaces.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <div className="text-base mb-1">😔</div>
                    <div className="text-sm">검색 결과가 없습니다.</div>
                  </div>
                ) : (
                  searchFilteredPlaces.map((place) => {
                    const isSelected = selectedPlaces.some(p => p.id === place.id);
                    return (
                      <div 
                        key={place.id} 
                        className="flex gap-2.5 p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer bg-white"
                        onClick={() => {
                          setPlaceDetailModal(place);
                          // placeId가 있으면 추가 정보 가져오기
                          if (place.id) {
                            fetch(`/api/places/details?placeId=${encodeURIComponent(place.id)}`)
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
                        {/* 썸네일 */}
                        <img 
                          src={place.image} 
                          alt={place.name}
                          className="w-16 h-16 object-cover rounded bg-gray-200 flex-shrink-0"
                          onError={(e) => {
                            if (!e.target.src.startsWith('data:')) {
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Yzk5YzMiIGR5PSIuM2VtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                            }
                          }}
                        />
                        
                        {/* 정보 */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                            <div className="font-semibold text-sm text-gray-800 mb-1" style={{ 
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              wordBreak: 'break-word',
                              lineHeight: '1.2rem',
                              maxHeight: '2.4rem'
                            }}>{place.name}</div>
                            <div className="text-xs text-gray-500 truncate mb-1">
                              <span className="text-blue-600">{place.category}</span>
                              {place.address && (
                                <>
                                  {' · '}
                                  <span>{place.address}</span>
                                </>
                              )}
                </div>
                </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <div className="flex items-center gap-0.5">
                              <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                              </svg>
                              <span>{place.likes}</span>
              </div>
                            <div className="flex items-center gap-0.5">
                              <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span>{place.rating}</span>
                            </div>
          </div>
        </div>

                        {/* 선택 버튼 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlaceSelection(place);
                          }}
                          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          {isSelected ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                          )}
                        </button>
              </div>
                    );
                  })
                )}
                      </div>
                      </div>
                    </div>

          {/* 오른쪽: 선택된 장소 영역 (슬라이드 가능) */}
          <div className={`transition-all duration-300 ease-in-out ${selectedPanelOpen ? 'w-[350px]' : 'w-0'} bg-white shadow-2xl overflow-hidden flex flex-col h-full`}>
            {selectedPanelOpen && (
              <>
                {/* 헤더 */}
                <div className="p-4 pb-3 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold text-gray-800">
                      {selectedPlaces.length}
                    </div>
                    {selectedPlaces.length > 0 && (
                      <div className="text-xs text-gray-600">
                        {totalTime.hours}시간 {totalTime.minutes}분 / {Math.floor(calculateTotalTravelTime()/60)}시간 {calculateTotalTravelTime()%60}분
                      </div>
                    )}
                  </div>
                  {selectedPlaces.length > 0 && (
                    <button 
                      onClick={() => setSelectedPlaces([])}
                      className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                    >
                      전체 삭제
                    </button>
                  )}
                </div>

                {/* 선택된 장소 리스트 */}
                <div className="flex-1 overflow-y-auto px-3 py-2">
                  {selectedPlaces.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                      <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedPlaces.map((place, index) => (
                        <div key={place.id} className="p-2.5 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                          <div className="flex items-start gap-2 mb-2">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                              {index + 1}
                            </div>
                            
                            {/* 썸네일 추가 */}
                            <img 
                              src={place.image} 
                              alt={place.name}
                              className="w-14 h-14 object-cover rounded bg-gray-200 flex-shrink-0"
                              onError={(e) => {
                                if (!e.target.src.startsWith('data:')) {
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Yzk5YzMiIGR5PSIuM2VtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                                }
                              }}
                            />
                            
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-800 mb-0.5" style={{ 
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                wordBreak: 'break-word',
                                lineHeight: '1.2rem',
                                maxHeight: '2.4rem'
                              }}>{place.name}</div>
                              <div className="text-xs text-gray-500 mb-1">
                                <span className="text-blue-600">{place.category}</span>
                              </div>
                              {place.address && (
                                <div className="text-xs text-gray-400 truncate">{place.address}</div>
                              )}
                            </div>
                            
                            <button
                              onClick={() => removeSelectedPlace(place.id)}
                              className="flex-shrink-0 w-5 h-5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          
                          {/* 체류 시간 설정 */}
                          <div className="flex items-center gap-1.5 pl-8 text-xs">
                            <span className="text-gray-500">시간:</span>
                            <select
                              value={place.stayHours || 2}
                              onChange={(e) => {
                                const hours = parseInt(e.target.value);
                                updatePlaceStayTime(place.id, hours, place.stayMinutes || 0);
                              }}
                              className="px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                              {[...Array(13)].map((_, i) => (
                                <option key={i} value={i}>{i}</option>
                              ))}
                            </select>
                            <span className="text-gray-500">시간</span>
                            <select
                              value={place.stayMinutes || 0}
                              onChange={(e) => {
                                const minutes = parseInt(e.target.value);
                                updatePlaceStayTime(place.id, place.stayHours || 2, minutes);
                              }}
                              className="px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                            <span className="text-gray-500">분</span>
                </div>
              </div>
            ))}
          </div>
                  )}
                </div>
              </>
            )}
        </div>

          {/* 토글 버튼 (항상 표시) */}
          {(
            <button
              onClick={() => setSelectedPanelOpen(!selectedPanelOpen)}
              className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-white border border-gray-300 rounded-r-lg shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
            >
              <svg 
                className={`w-4 h-4 text-gray-600 transition-transform ${selectedPanelOpen ? '' : 'rotate-180'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>


      {/* 장소 등록 모달 */}
      {placeRegistrationModal && (
        <PlaceRegistrationModal 
          onClose={() => setPlaceRegistrationModal(false)}
          onAddPlace={addRegistrationPlaceToSelected}
          selectedDestination={selectedDestination}
        />
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
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
              {placeDetailModal.image && (
        <div className="mb-4">
                  <img 
                    src={placeDetailModal.image.replace('maxWidth=200', 'maxWidth=600')} 
                    alt={placeDetailModal.name}
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
                <h4 className="text-2xl font-bold text-gray-800 mb-2">{placeDetailModal.name}</h4>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                    {placeDetailModal.category}
                  </span>
      </div>
                <p className="text-gray-600 text-sm flex items-start gap-2">
                  <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{placeDetailModal.address}</span>
                </p>
              </div>

              {/* 평점 정보 */}
              {(placeDetailData?.rating || placeDetailData?.userRatingCount || placeDetailModal.rating || placeDetailModal.likes) && (
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
                  {(placeDetailData?.rating || placeDetailModal.rating) && (
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-lg font-semibold text-gray-800">
                        {placeDetailData?.rating || placeDetailModal.rating}
                      </span>
                    </div>
                  )}
                  {(placeDetailData?.userRatingCount || placeDetailModal.likes) && (
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-600">
                        {placeDetailData?.userRatingCount || placeDetailModal.likes} 리뷰
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Google Places API에서 가져온 추가 정보 */}
              {placeDetailData && (
                <>
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

              {/* placeDetailData가 없을 때 기본 설명 표시 */}
              {!placeDetailData && placeDetailModal.description && (
                <div className="mb-6">
                  <h5 className="text-lg font-semibold text-gray-800 mb-2">장소 소개</h5>
                  <p className="text-gray-600 leading-relaxed">{placeDetailModal.description}</p>
                </div>
              )}

              {!placeDetailData && !placeDetailModal.description && (
                <div className="mb-6">
                  <p className="text-gray-400 text-sm italic">이 장소에 대한 설명이 제공되지 않았습니다.</p>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const isSelected = selectedPlaces.some(p => p.id === placeDetailModal.id);
                    if (!isSelected) {
                      togglePlaceSelection(placeDetailModal);
                    }
                    setPlaceDetailModal(null);
                  }}
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
                    selectedPlaces.some(p => p.id === placeDetailModal.id)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                  disabled={selectedPlaces.some(p => p.id === placeDetailModal.id)}
                >
                  {selectedPlaces.some(p => p.id === placeDetailModal.id) ? '이미 선택됨' : '일정에 추가'}
                </button>
                <button
                  onClick={() => setPlaceDetailModal(null)}
                  className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
                      </div>
  );
  };

  // 이동수단 선택 모달
  const [transportModal, setTransportModal] = useState(false);
  const [selectedTransport, setSelectedTransport] = useState(null); // 'public', 'car'
  
  // 일정 표시 상태
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedDayView, setSelectedDayView] = useState('all'); // 'all' or day index (0, 1, 2...)

  // 숙소 선택 모드 (step 3)
  const AccommodationMode = () => {
    const [accommodationQuery, setAccommodationQuery] = useState('');
    const [accommodationSearchQuery, setAccommodationSearchQuery] = useState('');
    const [isComposing, setIsComposing] = useState(false);
    // accommodations, accommodationsLoading은 부모 컴포넌트에서 관리
    const [accommodationModal, setAccommodationModal] = useState(false);
    const [accommodationDetailModal, setAccommodationDetailModal] = useState(null); // 숙소 상세 모달
    const [selectedPanelOpen, setSelectedPanelOpen] = useState(true);

    // 컴포넌트 마운트 시 숙소 데이터 로드 (부모 함수 호출)
    useEffect(() => {
      if (selectedDestination.lat && selectedDestination.lng) {
        fetchAccommodations();
      }
    }, []); // 마운트 시 한 번만 실행

    // 검색 필터링
    const filteredAccommodations = useMemo(() => {
      if (!accommodationSearchQuery.trim()) return accommodations;
      const query = accommodationSearchQuery.toLowerCase();
      return accommodations.filter(a => 
        a.name.toLowerCase().includes(query) || 
        a.address.toLowerCase().includes(query)
      );
    }, [accommodationSearchQuery]); // accommodations는 외부 상태이므로 의존성에서 제외

    // 총 여행 일수 계산
    const getTotalDays = () => {
      if (!startDate || !endDate) return 0;
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    };

    // 날짜 선택 모달 관련 state
    const [daySelectionModal, setDaySelectionModal] = useState(null); // { accommodation: {...}, selectedDays: [0, 1, ...] }
    
    // 날짜 선택 모달 열기
    const openDaySelectionModal = (accommodation) => {
      // 이미 선택된 날짜들 찾기
      const alreadySelectedDays = selectedAccommodations
        .filter(acc => acc.accommodation.id === accommodation.id)
        .map(acc => acc.dayIndex);
      
      setDaySelectionModal({
        accommodation,
        selectedDays: alreadySelectedDays
      });
    };
    
    // 날짜 선택 모달에서 날짜 토글
    const toggleDayInModal = (dayIndex) => {
      setDaySelectionModal(prev => {
        const isSelected = prev.selectedDays.includes(dayIndex);
        return {
          ...prev,
          selectedDays: isSelected 
            ? prev.selectedDays.filter(d => d !== dayIndex)
            : [...prev.selectedDays, dayIndex]
        };
      });
    };
    
    // 날짜 선택 완료
    const confirmDaySelection = () => {
      if (!daySelectionModal) return;
      
      const { accommodation, selectedDays } = daySelectionModal;
      
      // 기존에 이 숙소로 선택된 모든 날짜 제거
      setSelectedAccommodations(prev => 
        prev.filter(acc => acc.accommodation.id !== accommodation.id)
      );
      
      // 새로 선택된 날짜들에 대해 추가
      const newSelections = selectedDays.map(dayIndex => ({
        dayIndex,
        accommodation
      }));
      
      setSelectedAccommodations(prev => [...prev, ...newSelections]);
      
      // 모달 닫기
      setDaySelectionModal(null);
    };

    return (
      <div className="relative w-full h-screen">
        {/* 배경 지도 */}
        <div className="absolute inset-0">
          <DirectSearchMap
            centerLat={selectedDestination.lat}
            centerLng={selectedDestination.lng}
            selectedPlaces={selectedPlaces}
            selectedAccommodations={selectedAccommodations}
          />
        </div>

        {/* 왼쪽 단계 표시 영역 */}
        <div className="absolute left-0 top-0 bottom-0 w-[110px] bg-white shadow-lg flex flex-col z-10 border-r border-gray-200">
          <div className="flex-1 pt-8 pb-4">
            <div className="space-y-1">
              {/* STEP 1: 도시 선택 */}
              <div className="px-3 py-4">
                <div className="text-xs text-gray-500 mb-1">STEP 1</div>
                <div className="text-sm font-semibold text-gray-700">
                  도시 선택
                    </div>
              </div>

              {/* STEP 2: 장소 선택 */}
              <div className="px-3 py-4">
                <div className="text-xs text-gray-500 mb-1">STEP 2</div>
                <div className="text-sm font-semibold text-gray-700">
                  장소 선택
                </div>
              </div>

              {/* STEP 3: 숙소 선택 */}
              <div className="px-3 py-4 bg-cyan-50 border-l-4 border-cyan-400">
                <div className="text-xs text-gray-500 mb-1">STEP 3</div>
                <div className="text-sm font-semibold text-cyan-600">
                  숙소 선택
                </div>
              </div>
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="p-3 space-y-2 border-t border-gray-200">
            <button 
              onClick={() => setStep(2)} 
              className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-medium transition-colors"
            >
              이전
            </button>
            <button 
              onClick={() => setStep(4)} 
              className="w-full px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold transition-colors"
            >
              완료
            </button>
          </div>
        </div>

        {/* Unified Panel: 숙소 선택 + 선택된 숙소 */}
        <div className="absolute left-[110px] top-0 bottom-0 flex gap-0 z-10">
          {/* 왼쪽: 숙소 선택 영역 */}
          <div className="w-[400px] bg-white shadow-2xl text-left flex flex-col h-full">
            {/* 헤더 */}
            <div className="p-4 pb-3 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                {selectedDestination.name || '여행지'}
              </h2>
              <div className="text-base text-gray-600">
                {startDate && endDate ? (
                  <>
                    {formatDateWithWeekday(startDate)} ~ {formatDateWithWeekday(endDate)}
                  </>
                ) : (
                  dateRange || '날짜 선택'
                )}
              </div>
            </div>
            
            {/* 검색창 */}
            <div className="p-3 pb-2 border-b border-gray-200 flex-shrink-0">
              <div className="mb-2">
                <div className="relative">
          <input
            type="text"
                    value={accommodationQuery}
                    onChange={(e) => setAccommodationQuery(e.target.value)}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={() => setIsComposing(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isComposing) {
                        setAccommodationSearchQuery(accommodationQuery);
                      }
                    }}
                    placeholder="숙소명 검색"
                    className="w-full px-3 py-2.5 pl-10 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
            </div>
                <div className="mt-1">
                  <button 
                    onClick={() => setAccommodationModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    찾으시는 숙소가 없나요?
                  </button>
                </div>
              </div>
        </div>

          {/* 숙소 목록 */}
          <div className="flex-1 overflow-y-auto px-3 py-2">
            <div className="space-y-1.5">
              {accommodationsLoading ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                  <span className="text-sm">숙소 로딩 중...</span>
        </div>
              ) : filteredAccommodations.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <div className="text-base mb-1">😔</div>
                  <div className="text-sm">검색 결과가 없습니다.</div>
      </div>
              ) : (
                filteredAccommodations.map((acc) => {
                  return (
                    <div 
                      key={acc.id} 
                      onClick={() => setAccommodationDetailModal(acc)}
                      className="flex gap-2.5 p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors bg-white cursor-pointer"
                    >
                      <img 
                        src={acc.image} 
                        alt={acc.name}
                        className="w-16 h-16 object-cover rounded bg-gray-200 flex-shrink-0"
                        onError={(e) => {
                          if (!e.target.src.startsWith('data:')) {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Yzk5YzMiIGR5PSIuM2VtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                          }
                        }}
                      />
                      
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                          <div className="font-semibold text-sm text-gray-800 mb-1" style={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            wordBreak: 'break-word',
                            lineHeight: '1.2rem',
                            maxHeight: '2.4rem'
                          }}>{acc.name}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {acc.address}
                </div>
                </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <div className="flex items-center gap-0.5">
                            <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span>{acc.rating}</span>
              </div>
                          <div className="flex items-center gap-0.5">
                            <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                            <span>{acc.likes}</span>
                          </div>
          </div>
        </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDaySelectionModal(acc);
                        }}
                        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors bg-gray-100 text-gray-400 hover:bg-gray-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
    </div>
  );
                })
              )}
            </div>
          </div>
          </div>

          {/* 오른쪽: 선택된 숙소 영역 (슬라이드 가능) */}
          <div className={`transition-all duration-300 ease-in-out ${selectedPanelOpen ? 'w-[350px]' : 'w-0'} bg-white shadow-2xl overflow-hidden flex flex-col h-full`}>
            {selectedPanelOpen && (
              <>
                {/* 헤더 */}
                <div className="p-4 pb-3 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold text-gray-800">
                      {selectedAccommodations.length}
                    </div>
                    {getTotalDays() > 0 && (
                      <div className="text-xs text-gray-600">
                        {selectedAccommodations.length}일 / {getTotalDays()}일
                      </div>
                    )}
                  </div>
                  {selectedAccommodations.length > 0 && (
                    <button 
                      onClick={() => setSelectedAccommodations([])}
                      className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                    >
                      전체 삭제
                    </button>
                  )}
                </div>

                {/* 선택된 숙소 리스트 - 일자별 슬롯 */}
                <div className="flex-1 overflow-y-auto px-3 py-2">
                  <div className="space-y-3">
                    {Array.from({ length: getTotalDays() }, (_, index) => {
                      const dayNumber = index + 1;
                      const dayAccommodation = selectedAccommodations.find(acc => acc.dayIndex === index);
                      
                      return (
                        <div key={index} className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                          {/* 좌측: 숫자 */}
                          <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                            {dayNumber}
                          </div>

                          {/* 중앙: 사진 영역 (숙소가 있을 때만) */}
                          {dayAccommodation && (
                            <div className="w-16 h-16 flex-shrink-0 relative">
                              <img 
                                src={dayAccommodation.accommodation.image} 
                                alt={dayAccommodation.accommodation.name}
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => {
                                  if (!e.target.src.startsWith('data:')) {
                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Yzk5YzMiIGR5PSIuM2VtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                                  }
                                }}
                              />
                            </div>
                          )}

                          {/* 우측: 날짜와 텍스트 정보 */}
                          <div className="flex-1 min-w-0">
                            {dayAccommodation ? (
                              <>
                                {/* 날짜 (파란색) */}
                                <div className="text-blue-600 text-xs font-medium mb-1">
                                  {(() => {
                                    const date = new Date(startDate);
                                    date.setDate(date.getDate() + index);
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const day = String(date.getDate()).padStart(2, '0');
                                    const days = ['일', '월', '화', '수', '목', '금', '토'];
                                    const dayOfWeek = days[date.getDay()];
                                    return `${month}/${day}(${dayOfWeek}) ~ ${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate() + 1).padStart(2, '0')}(${days[(date.getDay() + 1) % 7]})`;
                                  })()}
                                </div>
                                {/* 숙소 이름 */}
                                <div className="font-semibold text-sm text-gray-800 mb-1 line-clamp-1">
                                  {dayAccommodation.accommodation.name}
                                </div>
                                {/* 버튼들: 삭제 */}
                                <button
                                  onClick={() => {
                                    setSelectedAccommodations(prev => prev.filter(acc => acc.dayIndex !== index));
                                  }}
                                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  삭제
                                </button>
                              </>
                            ) : (
                              <>
                                {/* 날짜 (파란색) */}
                                <div className="text-blue-600 text-xs font-medium mb-1">
                                  {(() => {
                                    const date = new Date(startDate);
                                    date.setDate(date.getDate() + index);
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const day = String(date.getDate()).padStart(2, '0');
                                    const days = ['일', '월', '화', '수', '목', '금', '토'];
                                    const dayOfWeek = days[date.getDay()];
                                    return `${month}/${day}(${dayOfWeek}) ~ ${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate() + 1).padStart(2, '0')}(${days[(date.getDay() + 1) % 7]})`;
                                  })()}
                                </div>
                                {/* 안내 텍스트 */}
                                <div className="text-xs text-gray-400">
                                  숙소를 추가하여 주세요.
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {getTotalDays() === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <p className="text-sm text-center">
                          날짜를 먼저 선택해주세요
                        </p>
              </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 토글 버튼 (항상 표시) */}
          {(
            <button
              onClick={() => setSelectedPanelOpen(!selectedPanelOpen)}
              className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-white border border-gray-300 rounded-r-lg shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
            >
              <svg 
                className={`w-4 h-4 text-gray-600 transition-transform ${selectedPanelOpen ? '' : 'rotate-180'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* 숙소 직접 추가 모달 */}
        {accommodationModal && (
          <AccommodationSearchModal 
            onClose={() => {
              setAccommodationModal(false);
            }}
            onAddAccommodation={(acc) => {
              // 날짜 선택 모달 열기
              setAccommodationModal(false);
              openDaySelectionModal(acc);
            }}
            selectedDestination={selectedDestination}
          />
        )}

        {/* 숙소 상세 정보 모달 */}
        {accommodationDetailModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50" onClick={() => setAccommodationDetailModal(null)}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
              {/* 모달 헤더 */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">숙소 정보</h3>
                <button 
                  onClick={() => setAccommodationDetailModal(null)}
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
                {accommodationDetailModal.image && (
                  <div className="mb-4">
                    <img 
                      src={accommodationDetailModal.image.replace('maxWidth=200', 'maxWidth=600')} 
                      alt={accommodationDetailModal.name}
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
                  <h4 className="text-2xl font-bold text-gray-800 mb-2">{accommodationDetailModal.name}</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                      숙소
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm flex items-start gap-2">
                    <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{accommodationDetailModal.address}</span>
                  </p>
                </div>

                {/* 평점 정보 */}
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-lg font-semibold text-gray-800">{accommodationDetailModal.rating}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-600">{accommodationDetailModal.likes} 리뷰</span>
                  </div>
                </div>

                {/* 설명 */}
                {accommodationDetailModal.description ? (
                  <div className="mb-6">
                    <h5 className="text-lg font-semibold text-gray-800 mb-2">숙소 소개</h5>
                    <p className="text-gray-600 leading-relaxed">{accommodationDetailModal.description}</p>
                  </div>
                ) : (
                  <div className="mb-6">
                    <p className="text-gray-400 text-sm italic">이 숙소에 대한 설명이 제공되지 않았습니다.</p>
                  </div>
                )}

                {/* 액션 버튼 - 날짜 선택 */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setAccommodationDetailModal(null);
                      openDaySelectionModal(accommodationDetailModal);
                    }}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    날짜 선택하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 날짜 선택 모달 */}
        {daySelectionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-[450px] max-h-[80vh] flex flex-col">
              {/* 헤더 */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">숙박할 날짜를 선택하세요</h3>
                  <button
                    onClick={() => setDaySelectionModal(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {/* 선택된 숙소 정보 */}
                <div className="mt-3 flex gap-3 items-center">
                  <img 
                    src={daySelectionModal.accommodation.image} 
                    alt={daySelectionModal.accommodation.name}
                    className="w-16 h-16 object-cover rounded-lg bg-gray-200"
                    onError={(e) => {
                      if (!e.target.src.startsWith('data:')) {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Yzk5YzMiIGR5PSIuM2VtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                      }
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-800 truncate">
                      {daySelectionModal.accommodation.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {daySelectionModal.accommodation.address}
                    </div>
                  </div>
                </div>
              </div>

              {/* 날짜 목록 */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="space-y-2">
                  {Array.from({ length: getTotalDays() }, (_, index) => {
                    const dayNumber = index + 1;
                    const isSelected = daySelectionModal.selectedDays.includes(index);
                    const date = new Date(startDate);
                    date.setDate(date.getDate() + index);
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const days = ['일', '월', '화', '수', '목', '금', '토'];
                    const dayOfWeek = days[date.getDay()];
                    
                    // 다른 숙소가 이미 이 날짜에 선택되어 있는지 확인
                    const otherAccommodation = selectedAccommodations.find(
                      acc => acc.dayIndex === index && acc.accommodation.id !== daySelectionModal.accommodation.id
                    );
                    
                    return (
                      <button
                        key={index}
                        onClick={() => toggleDayInModal(index)}
                        disabled={!!otherAccommodation}
                        className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50'
                            : otherAccommodation
                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {dayNumber}
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-medium text-gray-800">
                              {dayNumber}일차
                            </div>
                            <div className="text-xs text-blue-600">
                              {month}/{day}({dayOfWeek}) ~ {String(date.getMonth() + 1).padStart(2, '0')}/{String(date.getDate() + 1).padStart(2, '0')}({days[(date.getDay() + 1) % 7]})
                            </div>
                            {otherAccommodation && (
                              <div className="text-xs text-gray-400 truncate max-w-[200px]">
                                {otherAccommodation.accommodation.name}
                              </div>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 푸터 - 완료 버튼 */}
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <button
                    onClick={() => setDaySelectionModal(null)}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={confirmDaySelection}
                    disabled={daySelectionModal.selectedDays.length === 0}
                    className={`flex-1 px-4 py-3 font-semibold rounded-lg transition-colors ${
                      daySelectionModal.selectedDays.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    완료 ({daySelectionModal.selectedDays.length}일)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Haversine 공식으로 직선 거리 계산 (Fallback용)
  const calculateHaversineDistance = (loc1, loc2) => {
    if (!loc1 || !loc2 || !loc1.lat || !loc1.lng || !loc2.lat || !loc2.lng) return 10;
    const R = 6371; // 지구 반지름 (km)
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  // Routes API를 사용한 거리 및 이동 시간 계산 (최신 API)
  const calculateDistanceAndTime = async (origin, destination, mode = 'transit') => {
    try {
      // 이동 수단 변환: 'transit' → 'TRANSIT', 'driving' → 'DRIVE'
      const travelMode = mode === 'transit' ? 'TRANSIT' : 
                        mode === 'driving' ? 'DRIVE' : 
                        'TRANSIT';
      
      const response = await fetch(
        `http://localhost:8081/api/routes/compute?` +
        `originLat=${origin.lat}&originLng=${origin.lng}&` +
        `destLat=${destination.lat}&destLng=${destination.lng}&` +
        `travelMode=${travelMode}`
      );
      
      // HTTP 상태 코드 확인 (200-299가 아니면 Fallback)
      if (!response.ok) {
        console.warn(`⚠️ Routes API 응답 실패 (${response.status}): Fallback 사용`);
        const distance = calculateHaversineDistance(origin, destination);
        return {
          distance,
          duration: Math.round(distance / 30 * 60),
          fallback: true,
          trafficAware: false
        };
      }
      
      const data = await response.json();
      
      // 디버그: 교통 정보 반영 여부 로그
      if (data.trafficAware && !data.fallback) {
        console.log(`✅ 실시간 교통 반영: ${origin.lat.toFixed(3)} → ${destination.lat.toFixed(3)} (${data.duration}분)`);
      } else if (data.fallback) {
        console.log(`⚠️ Fallback 사용: ${origin.lat.toFixed(3)} → ${destination.lat.toFixed(3)} (${data.duration}분)`);
      }
      
      return {
        distance: data.distance || 0,
        duration: data.duration || 0,
        fallback: data.fallback || false,
        trafficAware: data.trafficAware || false
      };
    } catch (error) {
      console.error('Routes API 오류:', error);
      // Fallback: 직선 거리 계산
      const distance = calculateHaversineDistance(origin, destination);
      return {
        distance,
        duration: Math.round(distance / 30 * 60), // 평균 30km/h로 추정
        polyline: '',
        fallback: true,
        trafficAware: false
      };
    }
  };

  // 일정 분배 알고리즘
  const distributePlacesToDays = (places, accommodations, startDate, endDate, dailyTimeSettings) => {
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // 거리 계산 (Haversine) - Fallback용
    const getDist = (loc1, loc2) => {
      if (!loc1 || !loc2 || !loc1.lat || !loc1.lng || !loc2.lat || !loc2.lng) return 99999;
      const R = 6371;
      const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
      const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    };

    // --- [Step 1] 각 날짜별 숙소 위치 & 가용 시간 설정 ---
    const dayInfo = [];
    for (let i = 0; i < totalDays; i++) {
      const dayAcc = accommodations.find(acc => acc.dayIndex === i);
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const settings = dailyTimeSettings[dateKey] || { startTime: '10:00', endTime: '22:00' };
      
      const [startH, startM] = settings.startTime.split(':').map(Number);
      const [endH, endM] = settings.endTime.split(':').map(Number);
      const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
      
      // 숙소 위치 (없으면 이전 날짜 숙소 사용)
      let location = null;
      if (dayAcc && dayAcc.accommodation.lat && dayAcc.accommodation.lng) {
        location = { lat: dayAcc.accommodation.lat, lng: dayAcc.accommodation.lng };
      } else if (i > 0 && dayInfo[i-1].location) {
        location = dayInfo[i-1].location;
      }
      
      dayInfo.push({
        location,
        startTime: startH * 60 + startM,
        endTime: endH * 60 + endM,
        availableMinutes: Math.floor(totalMinutes * 0.75), // 이동시간 25% 예약
        items: []
      });
    }

    // --- [Step 2-1] 지리적 클러스터링: 가까운 장소들을 먼저 그룹화 ---
    const CLUSTER_DISTANCE_THRESHOLD = 5; // 5km 이내의 장소들을 같은 클러스터로 묶음
    const clusters = [];
    const assignedToCluster = new Set();
    
    // 각 장소에 대해 클러스터 찾기 또는 생성
    places.forEach((place, idx) => {
      if (assignedToCluster.has(idx)) return;
      
      const cluster = [place];
      assignedToCluster.add(idx);
      
      // 현재 장소와 가까운 다른 장소들 찾기
      places.forEach((otherPlace, otherIdx) => {
        if (idx === otherIdx || assignedToCluster.has(otherIdx)) return;
        const dist = getDist(place, otherPlace);
        if (dist <= CLUSTER_DISTANCE_THRESHOLD) {
          cluster.push(otherPlace);
          assignedToCluster.add(otherIdx);
        }
      });
      
      // 클러스터 중심점 계산
      const centerLat = cluster.reduce((sum, p) => sum + p.lat, 0) / cluster.length;
      const centerLng = cluster.reduce((sum, p) => sum + p.lng, 0) / cluster.length;
      
      clusters.push({
        places: cluster,
        center: { lat: centerLat, lng: centerLng },
        size: cluster.length
      });
    });
    
    console.log(`📍 지리적 클러스터링 완료: ${clusters.length}개 클러스터 생성 (${places.length}개 장소)`);
    
    // --- [Step 2-2] 클러스터를 일차에 배정 (거리 우선, 균등 분배 고려) ---
    const dayCounts = Array(totalDays).fill(0); // 각 날짜별 배정된 장소 수 추적
    const clusteredPlaces = [];
    
    // 클러스터를 크기 순으로 정렬 (큰 클러스터부터 배정)
    clusters.sort((a, b) => b.size - a.size);
    
    clusters.forEach(cluster => {
      let bestDay = 0;
      let bestScore = -Infinity;

      dayInfo.forEach((info, index) => {
        if (info.location) {
          const dist = getDist(info.location, cluster.center);
          
          // 점수 계산: 거리가 가까울수록 + 장소가 적을수록 높은 점수
          // - 거리: km당 -30점 (가중치 증가: 거리 우선)
          // - 균등 분배: 이미 배정된 장소 1개당 -20점 (가중치 감소: 균등 분배는 보조)
          const distanceScore = -dist * 30; // 거리 가중치 증가
          const balanceScore = -dayCounts[index] * 20; // 균등 분배 가중치 감소
          const totalScore = distanceScore + balanceScore;
          
          if (totalScore > bestScore) {
            bestScore = totalScore;
            bestDay = index;
          }
        }
      });
      
      // 클러스터 내 모든 장소를 같은 일차에 배정
      cluster.places.forEach(place => {
        clusteredPlaces.push({ ...place, assignedDay: bestDay });
        dayCounts[bestDay]++;
      });
      
      console.log(`✅ 클러스터 (${cluster.places.length}개 장소) → ${bestDay + 1}일차 배정 (거리: ${getDist(dayInfo[bestDay].location, cluster.center).toFixed(1)}km)`);
    });

    // --- [Step 3] 일차별 동선 최적화 (Nearest Neighbor + 카테고리 밸런싱) ---
    const finalPlans = Array.from({ length: totalDays }, () => []);
    const leftovers = [];

    for (let dayIdx = 0; dayIdx < totalDays; dayIdx++) {
      const info = dayInfo[dayIdx];
      if (!info.location) continue;

      let candidates = clusteredPlaces.filter(p => p.assignedDay === dayIdx);
      let currentLoc = info.location;
      let elapsedMinutes = 0;

      // 식당/카페를 식사 시간대에 우선 배치
      const restaurants = candidates.filter(p => p.category === '식당');

      let orderedCandidates = [];

      // 점심 시간대(12:00)에 식당 하나 예약
      const lunchTime = 720; // 12:00
      if (restaurants.length > 0 && info.startTime < lunchTime && info.endTime > lunchTime) {
        const lunchPlace = restaurants.sort((a, b) => getDist(currentLoc, a) - getDist(currentLoc, b))[0];
        orderedCandidates.push({ place: lunchPlace, preferredTime: lunchTime });
        candidates = candidates.filter(p => p.id !== lunchPlace.id);
      }

      // 저녁 시간대(18:00)에 식당 하나 예약
      const dinnerTime = 1080; // 18:00
      const remainingRestaurants = candidates.filter(p => p.category === '식당');
      if (remainingRestaurants.length > 0 && info.endTime > dinnerTime) {
        const dinnerPlace = remainingRestaurants.sort((a, b) => getDist(currentLoc, a) - getDist(currentLoc, b))[0];
        orderedCandidates.push({ place: dinnerPlace, preferredTime: dinnerTime });
        candidates = candidates.filter(p => p.id !== dinnerPlace.id);
      }

      // 나머지는 Nearest Neighbor로 채우기
      orderedCandidates.push(...candidates.map(p => ({ place: p, preferredTime: null })));

      // Nearest Neighbor 라우팅
      while (orderedCandidates.length > 0) {
        // preferredTime이 있는 것 우선, 없으면 거리순
        orderedCandidates.sort((a, b) => {
          if (a.preferredTime && !b.preferredTime) return -1;
          if (!a.preferredTime && b.preferredTime) return 1;
          if (a.preferredTime && b.preferredTime) return a.preferredTime - b.preferredTime;
          return getDist(currentLoc, a.place) - getDist(currentLoc, b.place);
        });

        const { place } = orderedCandidates[0];
        const placeMinutes = (place.stayHours || 2) * 60 + (place.stayMinutes || 0);

        // 시간 초과 체크
        if (elapsedMinutes + placeMinutes > info.availableMinutes) {
          leftovers.push(...orderedCandidates.map(c => c.place));
          break;
        }

        // 카테고리 연속 방지
        const lastPlace = finalPlans[dayIdx][finalPlans[dayIdx].length - 1];
        const isSameCategory = lastPlace && 
          ['식당', '카페'].includes(lastPlace.category) && 
          place.category === lastPlace.category;

        if (!isSameCategory) {
          finalPlans[dayIdx].push(place);
          elapsedMinutes += placeMinutes;
          currentLoc = { lat: place.lat, lng: place.lng };
        } else {
          // 같은 카테고리면 leftovers로
          leftovers.push(place);
        }

        orderedCandidates.shift();
      }
    }

    // --- [Step 4] 남은 장소 재분배 (거리 + 시간 모두 고려) ---
    for (const place of leftovers) {
      let bestDayIndex = -1;
      let bestScore = -Infinity;

      for (let i = 0; i < totalDays; i++) {
        if (!dayInfo[i].location) continue;
        
        const usedMinutes = finalPlans[i].reduce((sum, p) => 
          sum + (p.stayHours || 2) * 60 + (p.stayMinutes || 0), 0);
        const freeMinutes = dayInfo[i].availableMinutes - usedMinutes;
        
        // 거리 계산 (해당 날짜 숙소로부터)
        const distance = getDist(dayInfo[i].location, place);
        
        // 점수 계산: 시간 여유가 많고 거리가 가까울수록 높음
        // - 시간 여유: 분당 +1점
        // - 거리: km당 -10점
        // - 20km 이상이면 큰 페널티
        const distancePenalty = distance > 20 ? -500 : 0;
        const score = freeMinutes - (distance * 10) + distancePenalty;

        if (score > bestScore) {
          bestScore = score;
          bestDayIndex = i;
        }
      }

      const placeMinutes = (place.stayHours || 2) * 60 + (place.stayMinutes || 0);
      
      // 점수가 양수이고, 시간이 충분하면 배치
      if (bestDayIndex !== -1 && bestScore > 0) {
        const usedMinutes = finalPlans[bestDayIndex].reduce((sum, p) => 
          sum + (p.stayHours || 2) * 60 + (p.stayMinutes || 0), 0);
        const freeMinutes = dayInfo[bestDayIndex].availableMinutes - usedMinutes;
        
        if (freeMinutes >= placeMinutes) {
          finalPlans[bestDayIndex].push(place);
          console.log(`✅ ${place.name} → ${bestDayIndex + 1}일차 재배치 (거리: ${getDist(dayInfo[bestDayIndex].location, place).toFixed(1)}km)`);
        } else {
          console.warn(`⚠️ ${place.name} - 시간 부족으로 제외`);
        }
      } else {
        console.warn(`⚠️ ${place.name} - 너무 멀거나 적합한 날짜 없음 (최고 점수: ${bestScore.toFixed(0)})`);
      }
    }

    return finalPlans;
  };

  // 분배된 일정 저장 상태
  const [distributedSchedule, setDistributedSchedule] = useState([]);
  
  // 이동 시간 정보 저장 (장소 간 이동 시간 캐싱)
  const [travelTimes, setTravelTimes] = useState({});
  
  // 저장 중 상태
  const [isSaving, setIsSaving] = useState(false);
  
  // 여행 계획 저장 함수
  const handleSaveTrip = async () => {
    if (!user || !user.id) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    
    if (!selectedDestination.name || !startDate || !endDate) {
      alert('여행지와 날짜를 선택해주세요.');
      return;
    }
    
    if (distributedSchedule.length === 0) {
      alert('일정을 생성해주세요.');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // 날짜를 YYYY-MM-DD 형식으로 변환
      const formatDate = (date) => {
        if (!date) return null;
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      // 시간 문자열을 LocalTime 형식으로 변환 (HH:mm)
      const formatTime = (timeStr) => {
        if (!timeStr) return null;
        return timeStr; // "10:00" 형식 그대로 사용
      };
      
      // 일차별 데이터 변환
      const days = distributedSchedule.map((dayPlaces, dayIndex) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + dayIndex);
        const dateKey = formatDate(date);
        const timeSettings = dailyTimeSettings[dateKey] || { startTime: '10:00', endTime: '22:00' };
        const accommodation = selectedAccommodations.find(acc => acc.dayIndex === dayIndex);
        
        // 일정 항목 변환
        const itineraryItems = dayPlaces.map((place, placeIndex) => {
          const nextPlace = dayPlaces[placeIndex + 1];
          const transportMode = selectedTransport || 'car';
          const travelKey = nextPlace 
            ? `${place.lat},${place.lng}-${nextPlace.lat},${nextPlace.lng}-${transportMode === 'public' ? 'transit' : 'driving'}`
            : null;
          const travelTime = travelKey ? travelTimes[travelKey] : null;
          
          return {
            title: place.name,
            placeId: place.id || place.placeId || null,
            description: place.description || null,
            locationName: place.name,
            address: place.address || null,
            latitude: place.lat || null,
            longitude: place.lng || null,
            startTime: null, // 필요시 계산
            endTime: null, // 필요시 계산
            category: place.category || null,
            stayDurationMinutes: (place.stayHours || 0) * 60 + (place.stayMinutes || 0),
            travelToNextDistanceKm: null, // 필요시 계산
            travelToNextDurationMinutes: travelTime || null,
            travelToNextMode: transportMode === 'public' ? 'TRANSIT' : 'DRIVE',
            orderSequence: placeIndex + 1
          };
        });
        
        return {
          dayNumber: dayIndex + 1,
          date: formatDate(date),
          dayStartTime: formatTime(timeSettings.startTime),
          dayEndTime: formatTime(timeSettings.endTime),
          accommodationJson: accommodation ? JSON.stringify({
            name: accommodation.accommodation.name,
            placeId: accommodation.accommodation.placeId,
            lat: accommodation.accommodation.lat,
            lng: accommodation.accommodation.lng,
            address: accommodation.accommodation.address
          }) : null,
          itineraryItems: itineraryItems
        };
      });
      
      // 여행 데이터 생성
      const tripData = {
        title: `${selectedDestination.name} 여행`,
        destination: selectedDestination.name,
        destinationPlaceId: selectedDestination.placeId || null,
        destinationLat: selectedDestination.lat || null,
        destinationLng: selectedDestination.lng || null,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        numAdults: 1,
        numChildren: 0,
        totalBudget: null,
        days: days
      };
      
      // API 호출
      const response = await fetch(`http://localhost:8081/api/trips/user/${user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`저장 실패: ${errorText}`);
      }
      
      const savedTrip = await response.json();
      console.log('여행 계획 저장 완료:', savedTrip);
      
      // 대시보드로 이동
      navigate('/dashboard');
      
    } catch (error) {
      console.error('여행 계획 저장 오류:', error);
      alert('저장 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };
  
  // 편집 패널 표시 상태
  const [showEditPanel, setShowEditPanel] = useState(false);
  
  // 장소 이동 모드 상태
  const [movingItem, setMovingItem] = useState(null); // { dayIndex, placeIndex }
  
  // 두 지점 간 이동 시간 가져오기 (캐시 활용)
  const getTravelTime = async (from, to, mode = 'transit') => {
    if (!from || !to) return 15; // 기본값
    
    const key = `${from.lat},${from.lng}-${to.lat},${to.lng}-${mode}`;
    
    // 캐시에 있으면 반환
    if (travelTimes[key]) {
      return travelTimes[key];
    }
    
    // API 호출
    try {
      const result = await calculateDistanceAndTime(from, to, mode);
      const duration = result.duration || 15;
      
      // 캐시에 저장
      setTravelTimes(prev => ({ ...prev, [key]: duration }));
      
      return duration;
    } catch (error) {
      console.error('이동 시간 계산 오류:', error);
      return 15; // 기본값
    }
  };
  
  // 일정 변경 시 이동 시간 재계산
  const recalculateTravelTimes = async (schedule) => {
    const newTravelTimes = { ...travelTimes };
    const mode = selectedTransport === 'public' ? 'transit' : 'driving';
    
    for (let dayIndex = 0; dayIndex < schedule.length; dayIndex++) {
      const dayPlaces = schedule[dayIndex] || [];
      
      // 장소 간 이동 시간 계산
      for (let i = 0; i < dayPlaces.length - 1; i++) {
        const from = { lat: dayPlaces[i].lat, lng: dayPlaces[i].lng };
        const to = { lat: dayPlaces[i + 1].lat, lng: dayPlaces[i + 1].lng };
        const key = `${from.lat},${from.lng}-${to.lat},${to.lng}-${mode}`;
        
        if (!newTravelTimes[key]) {
          try {
            const result = await calculateDistanceAndTime(from, to, mode);
            newTravelTimes[key] = result.duration || 15;
          } catch (error) {
            console.error('이동 시간 계산 오류:', error);
            newTravelTimes[key] = 15;
          }
        }
      }
      
      // 마지막 장소 → 숙소 이동 시간 계산
      if (dayPlaces.length > 0) {
        const dayAccommodation = selectedAccommodations.find(acc => acc.dayIndex === dayIndex);
        if (dayAccommodation && dayAccommodation.accommodation.lat && dayAccommodation.accommodation.lng) {
          const from = { lat: dayPlaces[dayPlaces.length - 1].lat, lng: dayPlaces[dayPlaces.length - 1].lng };
          const to = { lat: dayAccommodation.accommodation.lat, lng: dayAccommodation.accommodation.lng };
          const key = `${from.lat},${from.lng}-${to.lat},${to.lng}-${mode}`;
          
          if (!newTravelTimes[key]) {
            try {
              const result = await calculateDistanceAndTime(from, to, mode);
              newTravelTimes[key] = result.duration || 15;
            } catch (error) {
              console.error('이동 시간 계산 오류:', error);
              newTravelTimes[key] = 15;
            }
          }
        }
      }
    }
    
    setTravelTimes(newTravelTimes);
  };

  // 이동 시간 표시 컴포넌트
  const TravelTimeDisplay = ({ from, to, mode }) => {
    const [duration, setDuration] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // 좌표 문자열로 메모이제이션 (불필요한 재계산 방지)
    const fromKey = useMemo(() => from ? `${from.lat},${from.lng}` : '', [from]);
    const toKey = useMemo(() => to ? `${to.lat},${to.lng}` : '', [to]);
    
    useEffect(() => {
      const fetchDuration = async () => {
        if (!from || !to) return;
        setLoading(true);
        const time = await getTravelTime(from, to, mode);
        setDuration(time);
        setLoading(false);
      };
      
      fetchDuration();
    }, [fromKey, toKey, mode, from, to]);
    
    if (loading || duration === null) {
      return <span>계산중...</span>;
    }
    
    const modeText = mode === 'transit' ? '대중교통' : mode === 'driving' ? '자동차' : '이동';
    return <span>{modeText} 약 {duration}분</span>;
  };

  // 일정 생성 모드 (step 4)
  const ScheduleGenerationMode = () => {
    // 일정이 생성되면 일정 표시 화면으로 전환
    if (showSchedule) {
      return <ScheduleDisplayMode />;
    }

    return (
      <div className="relative w-full h-screen">
        {/* 배경 지도 */}
        <div className="absolute inset-0">
          <DirectSearchMap
            centerLat={selectedDestination.lat}
            centerLng={selectedDestination.lng}
            selectedPlaces={selectedPlaces}
            selectedAccommodations={selectedAccommodations}
          />
        </div>

        {/* 왼쪽 일정 생성 패널 (단계 패널 없음) */}
        <div className="absolute left-0 top-0 bottom-0 w-[650px] bg-white shadow-2xl text-left flex flex-col z-10">
          {/* 헤더 */}
          <div className="p-6 pb-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-3 mb-3">
              <button 
                onClick={() => setStep(3)} 
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold text-gray-800">일정 생성</h2>
            </div>
            <p className="text-sm text-gray-600 ml-11">
              선택한 정보를 바탕으로 최적의 여행 일정을 생성합니다
            </p>
          </div>

          {/* 여행 정보 요약 */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">기본 정보</h3>
                <div className="space-y-4">
                  {/* 여행지 */}
                      <div>
                    <div className="text-xs text-gray-500 mb-1">여행지</div>
                    <div className="text-lg font-bold text-gray-800">{selectedDestination.name}</div>
                      </div>
                  
                  {/* 기간 */}
                  <div>
                    <div className="text-xs text-gray-500 mb-1">여행 기간</div>
                    <div className="text-base font-semibold text-gray-800">{dateRange}</div>
                      </div>
                    </div>
              </div>

              {/* 선택한 장소 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">선택한 장소 <span className="text-blue-600">{selectedPlaces.length}</span></h3>
                </div>
                
                {/* 가로 스크롤 장소 목록 */}
                <div className="overflow-x-auto pb-2 -mx-2 px-2">
                  <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
                    {selectedPlaces.map((place, index) => (
                      <div key={place.id} className="flex-shrink-0 w-[140px]">
                        <div className="bg-white rounded-lg overflow-hidden border border-blue-200 shadow-sm">
                          {/* 장소 이미지 */}
                          <div className="relative">
                            <img 
                              src={place.image} 
                              alt={place.name}
                              className="w-full h-[100px] object-cover"
                              onError={(e) => {
                                if (!e.target.src.startsWith('data:')) {
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTQwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOWNhM2FmIiBkeT0iLjNlbSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
                                }
                              }}
                            />
                            {/* 번호 배지 */}
                            <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow">
                              {index + 1}
                            </div>
                          </div>
                          {/* 장소 정보 */}
                          <div className="p-2">
                            <div className="font-medium text-sm text-gray-800 truncate mb-1" title={place.name}>
                              {place.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {place.category}
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                              {place.stayHours}시간 {place.stayMinutes}분
                            </div>
                          </div>
                        </div>
            </div>
          ))}
            </div>
                </div>
        </div>

              {/* 선택한 숙소 */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">선택한 숙소 <span className="text-green-600">{selectedAccommodations.length}</span></h3>
                </div>
                
                {/* 가로 스크롤 숙소 목록 */}
                <div className="overflow-x-auto pb-2 -mx-2 px-2">
                  <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
                    {selectedAccommodations.map((acc) => {
                      // 날짜 계산
                      const date = new Date(startDate);
                      date.setDate(date.getDate() + acc.dayIndex);
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      const days = ['일', '월', '화', '수', '목', '금', '토'];
                      const dayOfWeek = days[date.getDay()];
                      
                      return (
                        <div key={`${acc.accommodation.id}-${acc.dayIndex}`} className="flex-shrink-0 w-[140px]">
                          <div className="bg-white rounded-lg overflow-hidden border border-green-200 shadow-sm">
                            {/* 숙소 이미지 */}
                            <div className="relative">
                              <img 
                                src={acc.accommodation.image} 
                                alt={acc.accommodation.name}
                                className="w-full h-[100px] object-cover"
                                onError={(e) => {
                                  if (!e.target.src.startsWith('data:')) {
                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTQwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOWNhM2FmIiBkeT0iLjNlbSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
                                  }
                                }}
                              />
                              {/* DAY 배지 */}
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-green-600 text-white text-xs font-bold shadow">
                                DAY {acc.dayIndex + 1}
                              </div>
                            </div>
                            {/* 숙소 정보 */}
                            <div className="p-2">
                              <div className="text-xs text-green-600 mb-1">
                                {month}/{day}({dayOfWeek})
                              </div>
                              <div className="font-medium text-sm text-gray-800 truncate" title={acc.accommodation.name}>
                                {acc.accommodation.name}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
        </div>
      </div>

      </div>
          </div>

          {/* 하단 일정 생성 버튼 */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => {
                // 일정 생성 전 검증
                if (selectedPlaces.length === 0) {
                  alert('최소 하나 이상의 장소를 선택해주세요.');
                  return;
                }
                setTransportModal(true);
              }}
              className="w-full px-6 py-4 bg-black hover:bg-gray-800 text-white font-bold text-lg rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
            >
              일정 생성하기
            </button>
          </div>
        </div>

        {/* 이동수단 선택 모달 */}
        {transportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-[500px] max-h-[80vh] flex flex-col">
              {/* 헤더 */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-800">이동수단을 선택하세요</h3>
                  <button
                    onClick={() => setTransportModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  선택하신 이동수단에 따라 최적의 경로와 시간을 계산합니다
                </p>
              </div>

              {/* 이동수단 선택 */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="space-y-3">
                  {/* 대중교통 */}
                  <button
                    onClick={() => setSelectedTransport('public')}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                      selectedTransport === 'public'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      selectedTransport === 'public' ? 'bg-blue-600' : 'bg-gray-200'
                    }`}>
                      <svg className={`w-6 h-6 ${selectedTransport === 'public' ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-lg font-semibold text-gray-800">대중교통</div>
                      <div className="text-sm text-gray-600">지하철, 버스 등 대중교통 이용</div>
                    </div>
                    {selectedTransport === 'public' && (
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* 자동차 */}
                  <button
                    onClick={() => setSelectedTransport('car')}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                      selectedTransport === 'car'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      selectedTransport === 'car' ? 'bg-blue-600' : 'bg-gray-200'
                    }`}>
                      <svg className={`w-6 h-6 ${selectedTransport === 'car' ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-lg font-semibold text-gray-800">자동차</div>
                      <div className="text-sm text-gray-600">렌트카 또는 개인 차량 이용</div>
                    </div>
                    {selectedTransport === 'car' && (
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                </div>
              </div>

              {/* 푸터 - 확인 버튼 */}
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <button
                    onClick={() => setTransportModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => {
                      if (!selectedTransport) {
                        alert('이동수단을 선택해주세요.');
                        return;
                      }
                      
                      // 일정 분배 알고리즘 실행
                      console.log('🚀 일정 분배 시작...');
                      console.log('선택된 장소:', selectedPlaces.length);
                      console.log('선택된 숙소:', selectedAccommodations.length);
                      
                      const distributed = distributePlacesToDays(
                        selectedPlaces,
                        selectedAccommodations,
                        startDate,
                        endDate,
                        dailyTimeSettings
                      );
                      
                      console.log('✅ 분배 완료:', distributed);
                      setDistributedSchedule(distributed);
                      
                      setTransportModal(false);
                      setShowSchedule(true);
                    }}
                    disabled={!selectedTransport}
                    className={`flex-1 px-4 py-3 font-semibold rounded-lg transition-colors ${
                      !selectedTransport
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    확인
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
  };

  // 일정 표시 모드 (step 4 - 일정 생성 후)
  const ScheduleDisplayMode = () => {
    // 일자별 색상 정의 (마커와 동일)
    const dayColors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
    
    // 총 여행 일수 계산
    const getTotalDays = () => {
      if (!startDate || !endDate) return 0;
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    };

    // 필터링된 장소 및 숙소 (선택된 날짜에 따라) - useMemo로 최적화
    const filteredPlaces = useMemo(() => {
      if (selectedDayView === 'all') {
        // 전체 일정: 모든 날짜의 장소를 평면화하되 일차 정보 포함
        const allPlaces = [];
        distributedSchedule.forEach((dayPlaces, dayIndex) => {
          dayPlaces.forEach((place) => {
            allPlaces.push({ ...place, dayIndex });
          });
        });
        return allPlaces;
      }
      // 특정 날짜 선택 시 해당 날짜의 장소만 표시 (일차 정보 포함)
      const dayPlaces = distributedSchedule[selectedDayView] || [];
      return dayPlaces.map(place => ({ ...place, dayIndex: selectedDayView }));
    }, [distributedSchedule, selectedDayView]);

    const filteredAccommodations = useMemo(() => {
      if (selectedDayView === 'all') return selectedAccommodations;
      return selectedAccommodations.filter(acc => acc.dayIndex === selectedDayView);
    }, [selectedAccommodations, selectedDayView]);

    return (
      <div className="relative w-full h-screen">
        {/* 배경 지도 */}
        <div className="absolute inset-0">
          <DirectSearchMap
            centerLat={selectedDestination.lat}
            centerLng={selectedDestination.lng}
            selectedPlaces={filteredPlaces}
            selectedAccommodations={filteredAccommodations}
            selectedDayView={selectedDayView}
          />
        </div>

        {/* 왼쪽 일자 선택 패널 (세로) */}
        <div className="absolute left-0 top-0 bottom-0 w-[100px] bg-white shadow-lg flex flex-col z-20 border-r border-gray-200 py-3">
          {/* 전체일정 버튼 */}
          <div className="px-3 mb-2">
            <button
              onClick={() => setSelectedDayView('all')}
              className={`w-full py-3 rounded-lg transition-all ${
                selectedDayView === 'all'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="text-sm font-semibold">전체일정</div>
            </button>
          </div>

          {/* 일자 버튼들 */}
          <div className="flex-1 overflow-y-auto px-3 space-y-2">
            {Array.from({ length: getTotalDays() }, (_, index) => (
              <button
                key={index}
                onClick={() => setSelectedDayView(index)}
                className={`w-full py-3 rounded-lg transition-all ${
                  selectedDayView === index
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="text-sm font-semibold">{index + 1}일차</div>
              </button>
          ))}
        </div>

          {/* 일정편집 버튼 (하단) */}
          <div className="px-3 mt-2 pt-3 border-t border-gray-200 space-y-2">
            <button
              onClick={() => {
                setShowEditPanel(!showEditPanel);
              }}
              className={`w-full py-3 rounded-lg transition-colors ${
                showEditPanel ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <div className="text-xs font-medium">편집</div>
            </button>
            <button
              onClick={handleSaveTrip}
              disabled={isSaving}
              className={`w-full py-3 rounded-lg transition-colors ${
                isSaving 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isSaving ? (
                <>
                  <svg className="w-5 h-5 mx-auto mb-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <div className="text-xs font-medium">저장 중...</div>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <div className="text-xs font-medium">완성</div>
                </>
              )}
            </button>
        </div>
      </div>

        {/* 중앙 패널 (편집 패널 또는 일정 상세 패널) */}
        {showEditPanel ? (
          <EditPanel 
            distributedSchedule={distributedSchedule}
            setDistributedSchedule={setDistributedSchedule}
            selectedDayView={selectedDayView}
            startDate={startDate}
            selectedTransport={selectedTransport}
            recalculateTravelTimes={recalculateTravelTimes}
            movingItem={movingItem}
            setMovingItem={setMovingItem}
            formatDateWithWeekday={formatDateWithWeekday}
            getTotalDays={getTotalDays}
            setShowEditPanel={setShowEditPanel}
            TravelTimeDisplay={TravelTimeDisplay}
          />
        ) : (
        <div className="absolute left-[100px] top-0 bottom-0 w-[850px] bg-white shadow-2xl flex flex-col z-10">
          {/* 헤더 */}
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{selectedDestination.name}</h2>
                <div className="text-sm text-gray-600 mt-1">
                  {startDate && endDate && `${formatDateWithWeekday(startDate)} ~ ${formatDateWithWeekday(endDate)}`}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSchedule(false);
                  setSelectedDayView('all');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* 일정 목록 */}
          <div className="flex-1 overflow-y-auto">
            {selectedDayView === 'all' ? (
              // 전체 일정 표시 (가로 스크롤)
              <div className="p-6">
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {Array.from({ length: getTotalDays() }, (_, dayIndex) => {
                    const dayAccommodation = selectedAccommodations.find(acc => acc.dayIndex === dayIndex);
                    const dayPlaces = distributedSchedule[dayIndex] || [];
                    const date = new Date(startDate);
                    date.setDate(date.getDate() + dayIndex);
                    
                    return (
                      <div key={dayIndex} className="flex-shrink-0 w-[380px] bg-gray-50 rounded-xl p-4 border border-gray-200">
                        {/* 날짜 헤더 */}
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-300">
                          <div 
                            className="w-10 h-10 rounded-full text-white flex items-center justify-center text-base font-bold"
                            style={{ backgroundColor: dayColors[dayIndex] || '#2563eb' }}
                          >
                            {dayIndex + 1}
                          </div>
                          <div>
                            <div className="text-base font-bold text-gray-800">{dayIndex + 1}일차</div>
                            <div className="text-sm text-gray-500">{formatDateWithWeekday(date)}</div>
                          </div>
                        </div>

                        {/* 장소 및 숙소 목록 */}
                        <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                          {/* 장소 카드들 */}
                          {dayPlaces.length === 0 ? (
                            <div className="text-center text-gray-400 py-8">
                              <div className="text-sm">배정된 장소가 없습니다</div>
                            </div>
                          ) : (
                            <>
                              {dayPlaces.map((place, placeIndex) => (
                                <div key={place.id}>
                                  <div className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
                                    <div className="flex gap-3">
                                      <img
                                        src={place.image}
                                        alt={place.name}
                                        className="w-16 h-16 object-cover rounded flex-shrink-0"
                                        onError={(e) => {
                                          if (!e.target.src.startsWith('data:')) {
                                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Yzk5YzMiIGR5PSIuM2VtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                                          }
                                        }}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-sm text-gray-800 mb-1 truncate">{place.name}</div>
                                        <div className="text-xs text-gray-500 mb-1">{place.category}</div>
                                        <div className="flex items-center gap-1 text-xs text-blue-600">
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          <span>{place.stayHours}시간 {place.stayMinutes}분</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* 이동 시간 표시 */}
                                  {placeIndex < dayPlaces.length - 1 && (() => {
                                    const nextPlace = dayPlaces[placeIndex + 1];
                                    return (
                                      <div className="flex items-center justify-center gap-1 py-2 text-xs text-gray-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                        </svg>
                                        <TravelTimeDisplay 
                                          from={{ lat: place.lat, lng: place.lng }}
                                          to={{ lat: nextPlace.lat, lng: nextPlace.lng }}
                                          mode={selectedTransport === 'public' ? 'transit' : 'driving'}
                                        />
                                      </div>
                                    );
                                  })()}
                                </div>
                              ))}
                              
                              {/* 마지막 장소 → 숙소 이동 시간 */}
                              {dayAccommodation && dayPlaces.length > 0 && (() => {
                                const lastPlace = dayPlaces[dayPlaces.length - 1];
                                return (
                                  <div className="flex items-center justify-center gap-1 py-2 text-xs text-gray-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                    </svg>
                                    <TravelTimeDisplay 
                                      from={{ lat: lastPlace.lat, lng: lastPlace.lng }}
                                      to={{ lat: dayAccommodation.accommodation.lat, lng: dayAccommodation.accommodation.lng }}
                                      mode={selectedTransport === 'public' ? 'transit' : 'driving'}
                                    />
                                  </div>
                                );
                              })()}
                            </>
                          )}

                          {/* 숙소 카드 */}
                          {dayAccommodation && (
                              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                <div className="flex gap-3">
                                  <img
                                    src={dayAccommodation.accommodation.image}
                                    alt={dayAccommodation.accommodation.name}
                                    className="w-16 h-16 object-cover rounded flex-shrink-0"
                                    onError={(e) => {
                                      if (!e.target.src.startsWith('data:')) {
                                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Yzk5YzMiIGR5PSIuM2VtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                                      }
                                    }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs text-green-600 mb-1 font-semibold">숙소</div>
                                    <div className="font-semibold text-sm text-gray-800 truncate">{dayAccommodation.accommodation.name}</div>
                                  </div>
                                </div>
                              </div>
                          )}
      </div>
    </div>
  );
                  })}
                </div>
              </div>
            ) : (
              // 특정 날짜 일정 표시
              <div className="p-6 space-y-4">
                {filteredPlaces.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    <div className="text-lg mb-2">📅</div>
                    <div>이 날짜에 배정된 장소가 없습니다</div>
                  </div>
                ) : (
                  filteredPlaces.map((place, placeIndex) => (
                  <div key={place.id}>
                    <div className="flex gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
                      <img
                        src={place.image}
                        alt={place.name}
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => {
                          if (!e.target.src.startsWith('data:')) {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Yzk5YzMiIGR5PSIuM2VtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-base text-gray-800 mb-2">{place.name}</div>
                        <div className="text-sm text-gray-600 mb-2">{place.category}</div>
                        <div className="flex items-center gap-1 text-sm text-blue-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>체류시간: {place.stayHours}시간 {place.stayMinutes}분</span>
                        </div>
                      </div>
                    </div>

                    {/* 이동 시간 */}
                    {placeIndex < filteredPlaces.length - 1 && (() => {
                      const nextPlace = filteredPlaces[placeIndex + 1];
                      return (
                        <div className="flex items-center gap-2 py-3 text-sm text-gray-500 ml-3">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                          <TravelTimeDisplay 
                            from={{ lat: place.lat, lng: place.lng }}
                            to={{ lat: nextPlace.lat, lng: nextPlace.lng }}
                            mode={selectedTransport === 'public' ? 'transit' : 'driving'}
                          />
                        </div>
                      );
                    })()}
                  </div>
                )))}

                {/* 마지막 장소 → 숙소 이동 시간 */}
                {filteredAccommodations.length > 0 && filteredPlaces.length > 0 && (() => {
                  const places = filteredPlaces;
                  const lastPlace = places[places.length - 1];
                  const accommodation = filteredAccommodations[0];
                  return (
                    <div className="flex items-center gap-2 py-3 text-sm text-gray-500 ml-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      <TravelTimeDisplay 
                        from={{ lat: lastPlace.lat, lng: lastPlace.lng }}
                        to={{ lat: accommodation.accommodation.lat, lng: accommodation.accommodation.lng }}
                        mode={selectedTransport === 'public' ? 'transit' : 'driving'}
                      />
                    </div>
                  );
                })()}

                {/* 숙소 */}
                {filteredAccommodations.map(acc => (
                  <div key={acc.accommodation.id} className="flex gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <img
                      src={acc.accommodation.image}
                      alt={acc.accommodation.name}
                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      onError={(e) => {
                        if (!e.target.src.startsWith('data:')) {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Yzk5YzMiIGR5PSIuM2VtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                        }
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-green-600 mb-2 font-semibold">숙소</div>
                      <div className="font-bold text-base text-gray-800">{acc.accommodation.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    );
  };

  // 편집 패널 컴포넌트
  const EditPanel = ({
    distributedSchedule,
    setDistributedSchedule,
    selectedDayView,
    startDate,
    selectedTransport,
    recalculateTravelTimes,
    movingItem,
    setMovingItem,
    formatDateWithWeekday,
    getTotalDays,
    setShowEditPanel,
    TravelTimeDisplay
  }) => {
    // 일자별 색상 정의 (마커와 동일)
    const dayColors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

    // 장소 삭제
    const handleDeletePlace = async (dayIndex, placeIndex) => {
      const newSchedule = [...distributedSchedule];
      if (newSchedule[dayIndex]) {
        newSchedule[dayIndex] = newSchedule[dayIndex].filter((_, idx) => idx !== placeIndex);
        setDistributedSchedule(newSchedule);
        
        // 이동 시간 재계산
        await recalculateTravelTimes(newSchedule);
      }
    };

    // 이동 모드 시작
    const handleStartMove = (dayIndex, placeIndex) => {
      setMovingItem({ dayIndex, placeIndex });
    };

    // 이동 모드 취소
    const handleCancelMove = () => {
      setMovingItem(null);
    };

    // 장소 교환
    const handleSwapPlaces = async (targetDayIndex, targetPlaceIndex) => {
      if (!movingItem) return;
      
      const { dayIndex: sourceDayIndex, placeIndex: sourcePlaceIndex } = movingItem;
      const newSchedule = [...distributedSchedule];
      
      // 같은 장소면 교환 불필요
      if (sourceDayIndex === targetDayIndex && sourcePlaceIndex === targetPlaceIndex) {
        setMovingItem(null);
        return;
      }
      
      // 출발지와 목적지 장소 가져오기
      const sourcePlaces = [...newSchedule[sourceDayIndex]];
      const targetPlaces = newSchedule[targetDayIndex] ? [...newSchedule[targetDayIndex]] : [];
      
      const sourcePlace = sourcePlaces[sourcePlaceIndex];
      
      // 같은 일차 내에서 교환
      if (sourceDayIndex === targetDayIndex) {
        const temp = targetPlaces[targetPlaceIndex];
        targetPlaces[targetPlaceIndex] = sourcePlace;
        targetPlaces[sourcePlaceIndex] = temp;
        newSchedule[sourceDayIndex] = targetPlaces;
      } else {
        // 다른 일차로 교환
        const targetPlace = targetPlaces[targetPlaceIndex];
        sourcePlaces[sourcePlaceIndex] = targetPlace;
        targetPlaces[targetPlaceIndex] = sourcePlace;
        newSchedule[sourceDayIndex] = sourcePlaces;
        newSchedule[targetDayIndex] = targetPlaces;
      }
      
      setDistributedSchedule(newSchedule);
      setMovingItem(null);
      
      // 이동 시간 재계산
      await recalculateTravelTimes(newSchedule);
    };

    const getCurrentDayPlaces = () => {
      if (selectedDayView === 'all') {
        return distributedSchedule.flat();
      }
      return distributedSchedule[selectedDayView] || [];
    };

    const currentDayPlaces = getCurrentDayPlaces();
    const mode = selectedTransport === 'public' ? 'transit' : 'driving';

    return (
      <div className="absolute left-[100px] top-0 bottom-0 w-[850px] bg-white shadow-2xl flex flex-col z-10">
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">일정 편집</h2>
            <div className="flex items-center gap-3">
              {movingItem && (
                <button
                  onClick={handleCancelMove}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
                >
                  이동 취소
                </button>
              )}
              <button
                onClick={() => {
                  setShowEditPanel(false);
                  setMovingItem(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {movingItem && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                이동할 장소를 선택하세요. 선택한 장소와 교환됩니다.
              </p>
            </div>
          )}
        </div>

        {/* 일정 목록 */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedDayView === 'all' ? (
            // 전체 일정 표시
            <div className="flex gap-4 overflow-x-auto pb-4">
              {Array.from({ length: getTotalDays() }, (_, dayIndex) => {
                const dayPlaces = distributedSchedule[dayIndex] || [];
                const date = new Date(startDate);
                date.setDate(date.getDate() + dayIndex);
                
                return (
                  <div key={dayIndex} className="flex-shrink-0 w-[380px] bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-300">
                      <div 
                        className="w-10 h-10 rounded-full text-white flex items-center justify-center text-base font-bold"
                        style={{ backgroundColor: dayColors[dayIndex] || '#2563eb' }}
                      >
                        {dayIndex + 1}
                      </div>
                      <div>
                        <div className="text-base font-bold text-gray-800">{dayIndex + 1}일차</div>
                        <div className="text-sm text-gray-500">{formatDateWithWeekday(date)}</div>
                      </div>
                    </div>

                    <div className="space-y-3 min-h-[200px]">
                      {dayPlaces.length === 0 ? (
                        <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-300 rounded-lg">
                          <div className="text-sm">장소가 없습니다</div>
                        </div>
                      ) : (
                        dayPlaces.map((place, placeIndex) => (
                          <div key={`${place.id}-${placeIndex}`}>
                            <div
                              onClick={() => {
                                if (movingItem) {
                                  handleSwapPlaces(dayIndex, placeIndex);
                                }
                              }}
                              className={`bg-white rounded-lg p-3 border-2 transition-all ${
                                movingItem?.dayIndex === dayIndex && movingItem?.placeIndex === placeIndex
                                  ? 'border-blue-500 bg-blue-50'
                                  : movingItem
                                  ? 'cursor-pointer border-gray-200 hover:border-green-500 hover:bg-green-50'
                                  : 'border-gray-200 hover:shadow-md'
                              }`}
                            >
                              <div className="flex gap-3">
                                {!movingItem && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartMove(dayIndex, placeIndex);
                                    }}
                                    className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                                    title="장소 이동"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                  </button>
                                )}
                                <img
                                  src={place.image}
                                  alt={place.name}
                                  className="w-16 h-16 object-cover rounded flex-shrink-0"
                                  onError={(e) => {
                                    if (!e.target.src.startsWith('data:')) {
                                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Yzk5YzMiIGR5PSIuM2VtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                                    }
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm text-gray-800 mb-1 truncate">{place.name}</div>
                                  <div className="text-xs text-gray-500 mb-1">{place.category}</div>
                                  <div className="flex items-center gap-1 text-xs text-blue-600">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{place.stayHours || 0}시간 {place.stayMinutes || 0}분</span>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePlace(dayIndex, placeIndex);
                                  }}
                                  className="text-red-500 hover:text-red-700 flex-shrink-0"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            
                            {/* 이동 시간 표시 */}
                            {placeIndex < dayPlaces.length - 1 && (
                              <div className="flex items-center justify-center gap-1 py-2 text-xs text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                                {TravelTimeDisplay && (
                                  <TravelTimeDisplay 
                                    from={{ lat: place.lat, lng: place.lng }}
                                    to={{ lat: dayPlaces[placeIndex + 1].lat, lng: dayPlaces[placeIndex + 1].lng }}
                                    mode={mode}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // 특정 날짜 일정 표시
            <div className="space-y-4 min-h-[200px]">
              {currentDayPlaces.length === 0 ? (
                <div className="text-center text-gray-400 py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-lg mb-2">📅</div>
                  <div>장소가 없습니다</div>
                </div>
              ) : (
                currentDayPlaces.map((place, placeIndex) => (
                  <div key={`${place.id}-${placeIndex}`}>
                    <div
                      onClick={() => {
                        if (movingItem) {
                          handleSwapPlaces(selectedDayView, placeIndex);
                        }
                      }}
                      className={`flex gap-4 p-4 bg-white border-2 rounded-xl transition-all ${
                        movingItem?.dayIndex === selectedDayView && movingItem?.placeIndex === placeIndex
                          ? 'border-blue-500 bg-blue-50'
                          : movingItem
                          ? 'cursor-pointer border-gray-200 hover:border-green-500 hover:bg-green-50'
                          : 'border-gray-200 hover:shadow-lg'
                      }`}
                    >
                      {!movingItem && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartMove(selectedDayView, placeIndex);
                          }}
                          className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                          title="장소 이동"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </button>
                      )}
                      <img
                        src={place.image}
                        alt={place.name}
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => {
                          if (!e.target.src.startsWith('data:')) {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Yzk5YzMiIGR5PSIuM2VtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-base text-gray-800 mb-2">{place.name}</div>
                        <div className="text-sm text-gray-600 mb-2">{place.category}</div>
                        <div className="flex items-center gap-1 text-sm text-blue-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>체류시간: {place.stayHours || 0}시간 {place.stayMinutes || 0}분</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlace(selectedDayView, placeIndex);
                        }}
                        className="text-red-500 hover:text-red-700 flex-shrink-0"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* 이동 시간 */}
                    {placeIndex < currentDayPlaces.length - 1 && (
                      <div className="flex items-center gap-2 py-3 text-sm text-gray-500 ml-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        {TravelTimeDisplay && (
                          <TravelTimeDisplay 
                            from={{ lat: place.lat, lng: place.lng }}
                            to={{ lat: currentDayPlaces[placeIndex + 1].lat, lng: currentDayPlaces[placeIndex + 1].lng }}
                            mode={mode}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // AI 모드 본문(목업)
  const AiMode = () => (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto text-left">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">A. AI 일정 생성</h3>
      <p className="text-gray-600 text-sm mb-4">입력값을 바탕으로 교통/시간대/체력 고려한 일정을 생성합니다. (프론트 목업)</p>
      <div className="flex items-center gap-3">
        <button
          onClick={runAIGenerate}
          disabled={aiLoading}
          className={`px-5 py-3 rounded-lg text-white font-semibold ${aiLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {aiLoading ? '생성 중…' : 'AI로 일정 생성'}
        </button>
        <button onClick={() => setStep(1)} className="px-5 py-3 rounded-lg border text-gray-700 hover:bg-gray-50">이전</button>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {aiPlan.days.map((d) => (
          <div key={d.day} className="border rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-2">Day {d.day}</div>
            {d.items.length === 0 ? (
              <div className="text-sm text-gray-400">아직 생성된 항목이 없습니다.</div>
            ) : (
              <ul className="text-sm text-gray-700 list-disc pl-4 space-y-1">
                {d.items.map((it, i) => (<li key={`${it.id}-${i}`}>{it.name} · {it.category}</li>))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // 결과/완성
  const Finalize = () => {
    const plan = mode === 'direct' ? directPlan : aiPlan;
    return (
      <div className="max-w-6xl mx-auto text-left">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">일정 미리보기</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plan.days.map((d) => (
                <div key={d.day} className="border rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-2">Day {d.day}</div>
                  {d.items.length === 0 ? (
                    <div className="text-sm text-gray-400">항목 없음</div>
                  ) : (
                    <ul className="text-sm text-gray-700 list-disc pl-4 space-y-1">
                      {d.items.map((it, i) => (
                        <li key={`${it.id}-${i}`}>{it.name} · {it.category} · {it.stayMinutes}분</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">입력 요약</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>여행지: <span className="font-medium">{selectedDestination.name || '-'}</span></li>
                <li>기간: <span className="font-medium">{dateRange || '-'}</span></li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">다음 단계</h3>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>드래그/정렬 고도화(필요 시 라이브러리 도입)</li>
                <li>지도/경로 API 연동</li>
                <li>백엔드 저장/불러오기 연동</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-6">
          <button onClick={() => setStep(2)} className="px-5 py-3 rounded-lg border text-gray-700 hover:bg-gray-50">이전</button>
          <button
            onClick={() => alert('프론트 목업: 저장 처리(백엔드 연동 필요)')}
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            최종 저장
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      <div className="h-full">
        <HeaderView step={step} />

        {step === 0 && (
          <div className="relative w-full h-screen">
            {/* 왼쪽 단계 표시 영역 */}
            <div className="absolute left-0 top-0 bottom-0 w-[110px] bg-white shadow-lg flex flex-col z-10 border-r border-gray-200">
              <div className="flex-1 pt-8 pb-4">
                <div className="space-y-1">
                  {/* STEP 1: 도시 선택 */}
                  <div className="px-3 py-4 bg-cyan-50 border-l-4 border-cyan-400">
                    <div className="text-xs text-gray-500 mb-1">STEP 1</div>
                    <div className="text-sm font-semibold text-cyan-600">
                      도시 선택
                    </div>
                  </div>

                  {/* STEP 2: 장소 선택 */}
                  <div className="px-3 py-4">
                    <div className="text-xs text-gray-500 mb-1">STEP 2</div>
                    <div className="text-sm font-semibold text-gray-700">
                      장소 선택
                    </div>
                  </div>

                  {/* STEP 3: 숙소 선택 */}
                  <div className="px-3 py-4">
                    <div className="text-xs text-gray-500 mb-1">STEP 3</div>
                    <div className="text-sm font-semibold text-gray-700">
                      숙소 선택
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 기존 콘텐츠를 오른쪽으로 이동 */}
            <div className="absolute left-[110px] top-0 right-0 bottom-0 overflow-auto">
              <div className="flex flex-col min-[500px]:flex-row gap-6 w-full px-4 py-6">
                <div className="min-[500px]:w-[600px] w-full">
          <CommonFormView state={state} handlers={handlers} />
                </div>
                <div className="flex-1">
                  <MapPreview selectedDestination={selectedDestination} />
                </div>
              </div>
            </div>
          </div>
        )}
        {step === 1 && (
          <ModeSelect />
        )}
        {step === 2 && (mode === 'direct' ? <DirectMode /> : <AiMode />)}
        {step === 3 && <AccommodationMode />}
        {step === 4 && <ScheduleGenerationMode />}
      </div>

      {hasUnsavedChanges && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow text-sm text-gray-600">
          자동 저장됨
        </div>
      )}
    </div>
  );
};

export default TripPlanPageEx1;

// ===== Presentational Components (분리) =====
function HeaderView() {
  return (
    // 노트북 화면 작아서 주석처리
    null
    // <div className="text-center mb-8">
    //   <h1 className="text-3xl md:text-4xl font-bold text-gray-800">여행 일정 생성</h1>
    //   <p className="text-gray-600 mt-2">공통 정보 입력 → 모드 선택 → 분기 플로우 → 확인/저장</p>
    //   <div className="flex items-center justify-center gap-2 mt-4">
    //     {[0, 1, 2, 3].map((s) => (
    //       <div key={s} className={`w-3 h-3 rounded-full ${step === s ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
    //     ))}
    //   </div>
    // </div>
  );
}

// 외부로 분리된 CommonFormView (IME 로직 없이 단순 Controlled Inputs)
function CommonFormView({ state, handlers }) {
  const {
    destinationInput,
    selectedDestination,
    dateRange,
    startDate,
    endDate,
    dailyTimeSettings,
    suggestions,
    loadingPlaces,
    showSuggestions,
    viewYear,
    viewMonth,
    calendarOpen,
  } = state;

  const {
    setDestinationInput,
    setCalendarOpen,
    handleSearchCity,
    handleSelectPrediction,
    setViewYear,
    setViewMonth,
    handleDateClick,
    applyDateRange,
    updateDailyTime,
    formatTotalTravelTime,
    getAllDatesInRange,
    formatDateWithWeekday,
    setStep,
    setMode,
  } = handlers;

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full text-left">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">기본 정보</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 relative">
          <label className="block text-sm text-gray-600 mb-1">여행을 떠나고 싶은 도시를
          선택해 주세요.</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={destinationInput}
              onChange={(e) => setDestinationInput(e.target.value)}
              placeholder="예: 도쿄, 파리, 제주"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              autoComplete="off"
              onKeyDown={(e) => { 
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchCity();
                }
              }}
            />
            <button
              type="button"
              onClick={handleSearchCity}
              className="px-4 py-3 rounded-lg bg-sky-400 hover:bg-sky-500 text-white font-semibold"
            >
              찾기
            </button>
          </div>

          {showSuggestions && (
            <ul className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50 mt-1">
              {loadingPlaces ? (
                <li className="p-3 text-sm text-gray-500">검색 중…</li>
              ) : suggestions.length === 0 ? (
                <li className="p-3 text-sm text-gray-500">결과가 없습니다</li>
              ) : (
                suggestions.map((s) => (
                  <li
                    key={s.place_id}
                    onMouseDown={() => handleSelectPrediction(s.place_id, s.description)}
                    className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                  >
                    <div className="font-semibold text-gray-800">{s.description}</div>
                  </li>
                ))
              )}
            </ul>
          )}

          {selectedDestination.name && (
            <div className="mt-1 text-xs text-green-600">
              선택된 여행지: {selectedDestination.name} (좌표 확보 완료)
            </div>
          )}
        </div>

        <div className="md:col-span-2 relative">
          <label className="block text-sm text-gray-600 mb-1">날짜(기간)최대 10일</label>
          <div className="flex items-center gap-2">
          <input
            type="text"
              value={dateRange || ''}
            readOnly
            onClick={() => setCalendarOpen(true)}
            placeholder="날짜를 선택하세요"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            />
            {dateRange && (
              <button
                onClick={() => setCalendarOpen(true)}
                className="px-3 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 text-sm"
              >
                편집
              </button>
            )}
            <button onClick={() => setCalendarOpen(true)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h.01M16 14h.01M12 14h.01M16 18h.01M12 18h.01M16 22h.01M12 22h.01M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          </button>
          </div>
          {startDate && endDate && (
            <div className="mt-2 text-sm text-gray-600">
              {formatDateWithWeekday(startDate)} ~ {formatDateWithWeekday(endDate)}
            </div>
          )}
        </div>
        </div>

      {/* 여행시간 상세설정 */}
      {startDate && endDate && (
        <div className="mt-6 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">여행시간 상세설정</h3>
          
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">총 여행 시간</div>
            <div className="text-2xl font-bold text-blue-600">{formatTotalTravelTime()}</div>
        </div>

          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-2">기본시간은 오전 10시부터 오후 10시까지 입니다</div>
        </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">일자</th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">요일</th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">시작시간</th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">종료시간</th>
                </tr>
              </thead>
              <tbody>
                {getAllDatesInRange().map((date) => {
                  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                  const settings = dailyTimeSettings[dateKey] || { startTime: '10:00', endTime: '22:00' };
                  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
                  const weekday = weekdays[date.getDay()];
                  
                  return (
                    <tr key={dateKey}>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">
                        {`${date.getMonth() + 1}/${date.getDate()}`}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">{weekday}</td>
                      <td className="border border-gray-300 px-4 py-3">
                        <div className="flex items-center gap-2">
            <input
                            type="time"
                            value={settings.startTime}
                            onChange={(e) => updateDailyTime(dateKey, 'startTime', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                          {/* <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg> */}
        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        <div className="flex items-center gap-2">
          <input
                            type="time"
                            value={settings.endTime}
                            onChange={(e) => updateDailyTime(dateKey, 'endTime', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                          {/* <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg> */}
        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
        </div>

         
      </div>
      )}

      <div className="flex justify-end mt-6">
        <button
          onClick={() => {
            if (!selectedDestination.lat) {
                alert('여행지를 목록에서 정확히 선택해주세요.');
                return;
            }
            if (!dateRange) {
                alert('여행 날짜를 선택해주세요.');
                return;
            }
            setMode('direct');
            setStep(2);
          }}
          className="bg-sky-400 hover:bg-sky-500 text-white font-semibold py-3 px-6 rounded-lg shadow-md"
        >
          다음
        </button>
      </div>

      {calendarOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <button onClick={() => setViewMonth((m) => (m === 0 ? (setViewYear((y) => y - 1), 11) : m - 1))} className="p-2 rounded hover:bg-gray-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <h3 className="text-lg font-semibold text-gray-800">{viewYear}년 {viewMonth + 1}월</h3>
                <button onClick={() => setViewMonth((m) => (m === 11 ? (setViewYear((y) => y + 1), 0) : m + 1))} className="p-2 rounded hover:bg-gray-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
              <button onClick={() => setCalendarOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {['일','월','화','수','목','금','토'].map((d) => (
                <div key={d} className="font-semibold text-gray-500">{d}</div>
              ))}
              {Array.from({ length: getFirstDayOfMonth(viewYear, viewMonth) }).map((_, i) => (
                <div key={`e-${i}`} className="text-gray-300"></div>
              ))}
              {Array.from({ length: getDaysInMonth(viewYear, viewMonth) }).map((_, i) => {
                const day = i + 1;
                const d = new Date(viewYear, viewMonth, day);
                const isStart = state.startDate && d.toDateString() === state.startDate.toDateString();
                const isEnd = state.endDate && d.toDateString() === state.endDate.toDateString();
                // 선택 표시 규칙:
                // - 종료가 있으면 [start..end] 범위를 표시
                // - 종료가 없으면 [start..start+9] 윈도우를 표시(최대 10일)
                const windowMax = state.startDate && !state.endDate
                  ? new Date(state.startDate.getTime() + (10 - 1) * MS_PER_DAY)
                  : null;
                const inWindow = state.startDate && !state.endDate && d >= state.startDate && d <= windowMax;
                const inFinalRange = state.startDate && state.endDate && d >= state.startDate && d <= state.endDate;
                const isSelected = inFinalRange || inWindow;
                const isToday = d.toDateString() === TODAY.toDateString();
                const isPast = d < TODAY_START;
                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    disabled={isPast}
                    className={`py-2 rounded-full font-medium transition-colors ${
                      isStart || isEnd ? 'bg-blue-600 text-white' : ''
                    } ${
                      isSelected && !isStart && !isEnd ? 'bg-blue-200 text-blue-800' : 'text-gray-700 hover:bg-gray-200'
                    } ${isToday ? 'border-2 border-blue-500' : ''} ${isPast ? 'opacity-40 cursor-not-allowed hover:bg-transparent' : ''}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={applyDateRange} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">선택 완료</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MapPreview({ selectedDestination }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID; // 선택적 mapId
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const markerRef = React.useRef(null);
  const hasPoint = selectedDestination && typeof selectedDestination.lat === 'number' && typeof selectedDestination.lng === 'number';

  React.useEffect(() => {
    let mounted = true;
    // 동적 로드
    const ensure = () => new Promise((resolve, reject) => {
      if (window.google && window.google.maps) return resolve(window.google.maps);
      if (!apiKey) return reject(new Error('no-key'));
      const id = 'gmaps-js-sdk';
      const exist = document.getElementById(id);
      if (!exist) {
        const s = document.createElement('script');
        s.id = id;
        s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&language=ko&libraries=places,marker&loading=async`;
        s.async = true;
        s.defer = true;
        s.onload = () => resolve(window.google.maps);
        s.onerror = () => reject(new Error('load-fail'));
        document.head.appendChild(s);
      } else {
        const check = () => (window.google && window.google.maps) ? resolve(window.google.maps) : setTimeout(check, 50);
        check();
      }
    });

    ensure().then((maps) => {
      if (!mounted) return;
      if (!mapInstanceRef.current && mapRef.current) {
        const mapOptions = {
          center: { lat: 37.5665, lng: 126.9780 },
          zoom: 11,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        };
        // mapId가 있으면 추가 (AdvancedMarkerElement 사용을 위해)
        if (mapId) {
          mapOptions.mapId = mapId;
        }
        mapInstanceRef.current = new maps.Map(mapRef.current, mapOptions);
      }
      if (!mapInstanceRef.current) return;
      if (hasPoint) {
        const pos = { lat: selectedDestination.lat, lng: selectedDestination.lng };
        mapInstanceRef.current.setCenter(pos);
        mapInstanceRef.current.setZoom(12);
        
        // mapId가 있고 AdvancedMarkerElement를 사용할 수 있으면 사용, 아니면 일반 Marker 사용
        const Adv = maps.marker && maps.marker.AdvancedMarkerElement;
        const canUseAdvanced = mapId && Adv;
        
        if (!markerRef.current) {
          if (canUseAdvanced) {
            try {
              markerRef.current = new Adv({ 
                map: mapInstanceRef.current, 
                position: pos, 
                title: selectedDestination.name 
              });
            } catch (e) {
              // AdvancedMarkerElement 실패 시 일반 Marker로 fallback
              console.warn('AdvancedMarkerElement 사용 실패, 일반 Marker로 대체:', e);
              markerRef.current = new maps.Marker({ 
                position: pos, 
                map: mapInstanceRef.current, 
                title: selectedDestination.name 
              });
            }
          } else {
            markerRef.current = new maps.Marker({ 
              position: pos, 
              map: mapInstanceRef.current, 
              title: selectedDestination.name 
            });
          }
        } else {
          if (markerRef.current.setPosition) markerRef.current.setPosition(pos);
          if (markerRef.current.setTitle) markerRef.current.setTitle(selectedDestination.name || '선택 위치');
        }
      }
    }).catch(() => {/* 키 미설정 등 */});

    return () => { mounted = false; };
  }, [apiKey, mapId, hasPoint, selectedDestination?.lat, selectedDestination?.lng, selectedDestination?.name]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">지도 미리보기</h3>
      {apiKey ? (
        <div ref={mapRef} className="w-full h-[400px] border rounded" />
      ) : (
        <div className="w-full h-[400px] border rounded flex items-center justify-center text-gray-400">브라우저 키(.env VITE_GOOGLE_MAPS_API_KEY)가 필요합니다</div>
      )}
    </div>
  );
}

// Google Maps 지도 (Legacy API 호출 제거, 선택된 장소 마커만 표시)
function DirectSearchMap({ centerLat, centerLng, selectedPlaces, selectedAccommodations, selectedDayView }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID; // 선택적 mapId
  const mapRef = React.useRef(null);
  const mapRefInstance = React.useRef(null);
  const markersRef = React.useRef([]);
  const polylineRef = React.useRef(null);
  const polylinesRef = React.useRef([]); // 전체 일정용 여러 선 저장
  const [mapReady, setMapReady] = React.useState(false);

  // 지도 초기화는 한 번만 실행 (centerLat, centerLng 변경 시 재생성 방지)
  React.useEffect(() => {
    if (!apiKey) return;
    if (mapRefInstance.current) return; // 이미 지도가 생성되어 있으면 스킵
    
    const ensure = () => new Promise((resolve, reject) => {
      if (window.google && window.google.maps) return resolve(window.google.maps);
      const id = 'gmaps-js-sdk';
      let s = document.getElementById(id);
      if (!s) {
        s = document.createElement('script');
        s.id = id;
        s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&language=ko&libraries=marker&loading=async`;
        s.async = true;
        s.defer = true;
        s.onload = () => resolve(window.google.maps);
        s.onerror = () => reject(new Error('load-fail'));
        document.head.appendChild(s);
      } else {
        const check = () => (window.google && window.google.maps) ? resolve(window.google.maps) : setTimeout(check, 50);
        check();
      }
    });

    let cancelled = false;
    ensure().then((maps) => {
      if (cancelled) return;
      if (!mapRefInstance.current && mapRef.current) {
        const center = (typeof centerLat === 'number' && typeof centerLng === 'number') ? { lat: centerLat, lng: centerLng } : { lat: 37.5665, lng: 126.9780 };
        const mapOptions = {
          center,
          zoom: 12,
          streetViewControl: false,
          mapTypeControl: false,
        };
        // mapId가 있으면 추가 (AdvancedMarkerElement 사용을 위해)
        if (mapId) {
          mapOptions.mapId = mapId;
        }
        mapRefInstance.current = new maps.Map(mapRef.current, mapOptions);
        console.log('Map instance created successfully');
        setMapReady(true);
      }
    }).catch((err) => {
      console.error('Failed to load Google Maps:', err);
    });
    return () => { cancelled = true; };
    // centerLat, centerLng는 초기값으로만 사용하고, 이후 변경은 별도 useEffect에서 처리
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, mapId]);

  // 선택된 장소 마커 표시 (번호 라벨 포함)
  React.useEffect(() => {
    if (!mapReady || !window.google || !window.google.maps) {
      // mapReady가 false일 때는 로그 출력하지 않음 (초기화 중 반복 로그 방지)
      return;
    }
    if (!mapRefInstance.current) {
      return;
    }

    // 디버그 로그 제거 또는 최소화

    // 기존 마커 제거
    markersRef.current.forEach((m) => {
      if (m.setMap) m.setMap(null);
    });
    markersRef.current = [];

    // 기존 선 제거
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    
    // 전체 일정용 여러 선 제거
    if (polylinesRef.current) {
      polylinesRef.current.forEach((p) => {
        if (p && p.setMap) p.setMap(null);
      });
      polylinesRef.current = [];
    }

    const maps = window.google.maps;
    const selectedPlacesList = Array.isArray(selectedPlaces) ? selectedPlaces : [];

    // 일자별 색상 정의
    const dayColors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
    
    // 선택된 장소에 번호 마커 표시 (좌표가 있는 경우)
    selectedPlacesList.forEach((place, index) => {
      if (typeof place.lat === 'number' && typeof place.lng === 'number') {
        const pos = { lat: place.lat, lng: place.lng };
        const markerNumber = index + 1;
        
        // 선택된 날짜가 'all'이면 각 장소의 일차에 맞는 색상 사용, 아니면 해당 날짜 색상
        const dayIndex = selectedDayView === 'all' ? (place.dayIndex !== undefined ? place.dayIndex : 0) : selectedDayView;
        const markerColor = dayColors[dayIndex] || '#2563eb';
        
        try {
          // 번호가 표시된 커스텀 마커 생성
          const marker = new maps.Marker({
            position: pos,
            map: mapRefInstance.current,
            title: `${markerNumber}. ${place.name}`,
            label: {
              text: String(markerNumber),
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold'
            },
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale: 15,
              fillColor: markerColor,
              fillOpacity: 1,
              strokeColor: 'white',
              strokeWeight: 2,
            }
          });
          
          markersRef.current.push(marker);
        } catch (error) {
          console.error(`Error creating marker ${markerNumber}:`, error);
        }
      } else {
        console.warn(`Place ${place.name} has invalid coordinates:`, place.lat, place.lng);
      }
    });

    // 숙소 마커 추가 (연두색, 선으로 연결하지 않음)
    const accommodationsList = Array.isArray(selectedAccommodations) ? selectedAccommodations : [];

    accommodationsList.forEach((acc) => {
      const accommodation = acc.accommodation;
      if (typeof accommodation.lat === 'number' && typeof accommodation.lng === 'number') {
        const pos = { lat: accommodation.lat, lng: accommodation.lng };
        const dayNumber = acc.dayIndex + 1;
        
        try {
          // 연두색 숙소 마커 생성
          const marker = new maps.Marker({
            position: pos,
            map: mapRefInstance.current,
            title: `DAY ${dayNumber}: ${accommodation.name}`,
            label: {
              text: String(dayNumber),
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold'
            },
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale: 15,
              fillColor: '#84cc16', // 연두색 (lime-500)
              fillOpacity: 1,
              strokeColor: 'white',
              strokeWeight: 2,
            }
          });
          
          markersRef.current.push(marker);
        } catch (error) {
          console.error(`Error creating accommodation marker ${dayNumber}:`, error);
        }
      } else {
        console.warn(`Accommodation ${accommodation.name} has invalid coordinates:`, accommodation.lat, accommodation.lng);
      }
    });


    // 장소들을 순서대로 선으로 연결 + 마지막 장소에서 숙소로 연결
    if (selectedPlacesList.length > 0) {
      if (selectedDayView === 'all') {
        // 전체 일정: 각 일차별로 다른 색상의 선 그리기
        const dayGroups = {};
        
        // 일차별로 장소 그룹화
        selectedPlacesList.forEach((place) => {
          const dayIdx = place.dayIndex !== undefined ? place.dayIndex : 0;
          if (!dayGroups[dayIdx]) {
            dayGroups[dayIdx] = [];
          }
          if (typeof place.lat === 'number' && typeof place.lng === 'number') {
            dayGroups[dayIdx].push({ lat: place.lat, lng: place.lng });
          }
        });
        
        // 각 일차별로 선 그리기
        Object.keys(dayGroups).forEach((dayIdx) => {
          const dayPlaces = dayGroups[dayIdx];
          if (dayPlaces.length > 1) {
            const dayIndex = parseInt(dayIdx);
            const lineColor = dayColors[dayIndex] || '#2563eb';
            
            const polyline = new maps.Polyline({
              path: dayPlaces,
              geodesic: true,
              strokeColor: lineColor,
              strokeOpacity: 0.8,
              strokeWeight: 3,
            });
            polyline.setMap(mapRefInstance.current);
            polylinesRef.current.push(polyline);
          }
          
          // 마지막 장소 → 숙소 연결
          const dayIndexNum = parseInt(dayIdx);
          const dayAccommodation = accommodationsList.find(acc => acc.dayIndex === dayIndexNum);
          if (dayAccommodation && dayAccommodation.accommodation.lat && dayAccommodation.accommodation.lng && dayPlaces.length > 0) {
            const accPolyline = new maps.Polyline({
              path: [
                dayPlaces[dayPlaces.length - 1],
                { lat: dayAccommodation.accommodation.lat, lng: dayAccommodation.accommodation.lng }
              ],
              geodesic: true,
              strokeColor: '#84cc16', // 숙소 연결은 연두색
              strokeOpacity: 0.6,
              strokeWeight: 2,
            });
            accPolyline.setMap(mapRefInstance.current);
            polylinesRef.current.push(accPolyline);
          }
        });
      } else {
        // 특정 일차 선택: 하나의 선으로 연결
        const pathCoordinates = [];
        
        // 장소들 좌표 추가
        selectedPlacesList.forEach((place) => {
          if (typeof place.lat === 'number' && typeof place.lng === 'number') {
            pathCoordinates.push({ lat: place.lat, lng: place.lng });
          }
        });

        // 마지막 장소 → 숙소 연결
        if (typeof selectedDayView === 'number') {
          const dayAccommodation = accommodationsList.find(acc => acc.dayIndex === selectedDayView);
          if (dayAccommodation && dayAccommodation.accommodation.lat && dayAccommodation.accommodation.lng) {
            pathCoordinates.push({ 
              lat: dayAccommodation.accommodation.lat, 
              lng: dayAccommodation.accommodation.lng 
            });
          }
        }

        if (pathCoordinates.length > 1) {
          const lineColor = dayColors[selectedDayView] || '#2563eb';
          
          polylineRef.current = new maps.Polyline({
            path: pathCoordinates,
            geodesic: true,
            strokeColor: lineColor,
            strokeOpacity: 0.8,
            strokeWeight: 3,
          });
          polylineRef.current.setMap(mapRefInstance.current);
        }
      }
    }

    // 선택된 장소와 숙소가 모두 보이도록 지도 범위 조정 (왼쪽 패널 고려)
    const bounds = new maps.LatLngBounds();
    let validCoords = 0;
    
    // 장소 좌표 추가
    selectedPlacesList.forEach((place) => {
      if (typeof place.lat === 'number' && typeof place.lng === 'number') {
        bounds.extend({ lat: place.lat, lng: place.lng });
        validCoords++;
      }
    });
    
    // 숙소 좌표 추가
    accommodationsList.forEach((acc) => {
      const accommodation = acc.accommodation;
      if (typeof accommodation.lat === 'number' && typeof accommodation.lng === 'number') {
        bounds.extend({ lat: accommodation.lat, lng: accommodation.lng });
        validCoords++;
      }
    });
    
    // 유효한 좌표가 있고 bounds가 비어있지 않은 경우에만 지도 업데이트
    if (validCoords > 0 && !bounds.isEmpty()) {
      // 장소가 1개일 경우
      if (validCoords === 1) {
        const center = bounds.getCenter();
        
        // 픽셀 단위로 중심점을 오른쪽으로 이동
        const projection = mapRefInstance.current.getProjection();
        const zoom = 14;
        mapRefInstance.current.setZoom(zoom);
        
        // 왼쪽 패널 너비만큼 오른쪽으로 오프셋 (약 650px)
        // 지도 전체 너비의 약 1/4 정도 왼쪽으로 치우치게
        if (projection) {
          const scale = Math.pow(2, zoom);
          const worldCoordinate = projection.fromLatLngToPoint(center);
          const pixelOffset = 325 / (256 * scale); // 왼쪽으로 325픽셀 정도 오프셋
          
          const newCenter = projection.fromPointToLatLng(
            new maps.Point(
              worldCoordinate.x + pixelOffset,
              worldCoordinate.y
            )
          );
          mapRefInstance.current.setCenter(newCenter);
        } else {
          mapRefInstance.current.setCenter(center);
        }
      } else {
        // 2개 이상일 경우 범위 조정 후 중심 이동
        try {
          mapRefInstance.current.fitBounds(bounds, {
            top: 50,
            right: 50,
            bottom: 50,
            left: 1000 // 왼쪽에 더 큰 패딩 (일자패널 100px + 일정패널 850px + 여유 50px)
          });
        } catch (error) {
          // bounds가 유효하지 않은 경우 (예: 모든 좌표가 같을 때) 중심점으로 설정
          console.warn('fitBounds 실패, 중심점으로 설정:', error);
          const center = bounds.getCenter();
          mapRefInstance.current.setCenter(center);
          mapRefInstance.current.setZoom(12);
        }
      }
    } else if (validCoords === 0) {
      // 좌표가 없는 경우 기본 중심점 유지 (지도 초기화 방지)
      // 아무것도 하지 않음 - 이전 상태 유지
    }
  }, [selectedPlaces, selectedAccommodations, selectedDayView, mapId, mapReady]);

  // 중심 이동
  React.useEffect(() => {
    if (!mapRefInstance.current) return;
    if (typeof centerLat === 'number' && typeof centerLng === 'number') {
      mapRefInstance.current.setCenter({ lat: centerLat, lng: centerLng });
    }
  }, [centerLat, centerLng]);

  return (
    <div className="w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}

// 장소 등록 모달 컴포넌트 (상태 격리)
function PlaceRegistrationModal({ onClose, onAddPlace, selectedDestination }) {
  const [registrationQuery, setRegistrationQuery] = useState('');
  const [registrationResults, setRegistrationResults] = useState([]);
  const [registrationLoading, setRegistrationLoading] = useState(false);

  // 장소 등록 검색 핸들러
  const handleRegistrationSearch = async () => {
    if (!registrationQuery.trim()) {
      alert('장소명을 입력해주세요.');
      return;
    }
    
    if (!selectedDestination.lat || !selectedDestination.lng) {
      alert('여행지 정보가 없습니다.');
      return;
    }
    
    setRegistrationLoading(true);
    try {
      const res = await fetch('/api/places/textsearch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: registrationQuery,
          latitude: selectedDestination.lat,
          longitude: selectedDestination.lng
        })
      });
      
      if (!res.ok) {
        console.warn(`장소 검색 실패: HTTP ${res.status}`);
        alert('장소 검색에 실패했습니다.');
        setRegistrationResults([]);
        return;
      }
      
      const data = await res.json();
      const places = data.places || [];
      
      // 데이터 변환
      const transformed = places.map((place, index) => {
        const displayName = place.displayName?.text || place.displayName || '이름 없음';
        const address = place.formattedAddress || '주소 정보 없음';
        const lat = place.location?.latitude;
        const lng = place.location?.longitude;
        const rating = place.rating || 0;
        const userRatingCount = place.userRatingCount || 0;
        const photos = place.photos || [];
        const firstPhoto = photos.length > 0 ? photos[0].name : null;
        const editorialSummary = place.editorialSummary?.text || place.editorialSummary || '';
        const types = place.types || [];
        
        // 카테고리 추론
        let category = '명소';
        if (types.some(t => ['cafe', 'bakery', 'coffee_shop'].includes(t))) {
          category = '카페';
        } else if (types.some(t => ['restaurant', 'meal_takeaway', 'meal_delivery'].includes(t))) {
          category = '식당';
        }
        
        // 사진 URL 생성
        let image = null;
        if (firstPhoto) {
          image = `/api/places/photo?name=${encodeURIComponent(firstPhoto)}&maxWidth=200`;
        }
        
        return {
          id: place.id || `search-${index}`,
          name: displayName,
          category,
          address,
          image,
          likes: userRatingCount,
          rating: rating,
          lat,
          lng,
          description: editorialSummary,
        };
      });
      
      setRegistrationResults(transformed);
    } catch (err) {
      console.error('장소 검색 오류:', err);
      alert('장소 검색 중 오류가 발생했습니다.');
      setRegistrationResults([]);
    } finally {
      setRegistrationLoading(false);
    }
  };

  const handleAddPlace = (place) => {
    onAddPlace(place);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
        {/* 모달 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-800">장소 등록</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 모달 본문 */}
        <div className="p-6">
          {/* 검색창 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">장소명을 입력하세요</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={registrationQuery}
                onChange={(e) => setRegistrationQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleRegistrationSearch();
                  }
                }}
                placeholder="예: 에펠탑, 도쿄타워, 경복궁"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleRegistrationSearch}
                disabled={registrationLoading}
                className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:bg-gray-400"
              >
                {registrationLoading ? '검색 중...' : '검색'}
              </button>
            </div>
          </div>

          {/* 검색 결과 */}
          <div className="mt-6">
            {registrationLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                <span>장소를 검색하는 중...</span>
              </div>
            ) : registrationResults.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <div className="text-lg mb-2">🔍</div>
                <div>장소를 검색해보세요</div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm font-semibold text-gray-700 mb-3">
                  검색 결과 {registrationResults.length}개
                </div>
                {registrationResults.map((place) => (
                  <div 
                    key={place.id} 
                    className="flex gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    {/* 썸네일 */}
                    <img 
                      src={place.image} 
                      alt={place.name}
                      className="w-16 h-16 object-cover rounded bg-gray-200 flex-shrink-0"
                      onError={(e) => {
                        if (!e.target.src.startsWith('data:')) {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Yzk5YzMiIGR5PSIuM2VtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                        }
                      }}
                    />
                    
                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 mb-1 truncate">{place.name}</div>
                      <div className="text-xs text-gray-500 mb-1 truncate">
                        <span className="text-blue-600">{place.category}</span>
                        {' · '}
                        <span>{place.address}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span>{place.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          <span>{place.likes}</span>
                        </div>
                      </div>
                    </div>

                    {/* 추가 버튼 */}
                    <button
                      onClick={() => handleAddPlace(place)}
                      className="flex-shrink-0 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                    >
                      추가
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 숙소 검색 모달 컴포넌트
function AccommodationSearchModal({ onClose, onAddAccommodation, selectedDestination }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert('숙소명을 입력해주세요.');
      return;
    }
    
    if (!selectedDestination.lat || !selectedDestination.lng) {
      alert('여행지 정보가 없습니다.');
      return;
    }
    
    setSearchLoading(true);
    try {
      const res = await fetch('/api/places/textsearch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery + ' 호텔 숙소',
          latitude: selectedDestination.lat,
          longitude: selectedDestination.lng
        })
      });
      
      if (!res.ok) {
        console.warn(`숙소 검색 실패: HTTP ${res.status}`);
        alert('숙소 검색에 실패했습니다.');
        setSearchResults([]);
        return;
      }
      
      const data = await res.json();
      const places = data.places || [];
      
      const transformed = places.map((place, index) => {
        const displayName = place.displayName?.text || place.displayName || '이름 없음';
        const address = place.formattedAddress || '주소 정보 없음';
        const lat = place.location?.latitude;
        const lng = place.location?.longitude;
        const rating = place.rating || 0;
        const userRatingCount = place.userRatingCount || 0;
        const photos = place.photos || [];
        const firstPhoto = photos.length > 0 ? photos[0].name : null;
        const editorialSummary = place.editorialSummary?.text || place.editorialSummary || '';
        
        let image = null;
        if (firstPhoto) {
          image = `/api/places/photo?name=${encodeURIComponent(firstPhoto)}&maxWidth=200`;
        }
        
        return {
          id: place.id || `search-accommodation-${index}`,
          name: displayName,
          category: '숙소',
          address,
          image,
          likes: userRatingCount,
          rating: rating,
          lat,
          lng,
          description: editorialSummary,
        };
      });
      
      setSearchResults(transformed);
    } catch (err) {
      console.error('숙소 검색 오류:', err);
      alert('숙소 검색 중 오류가 발생했습니다.');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAdd = (accommodation) => {
    onAddAccommodation(accommodation);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-800">숙소 등록</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">숙소명을 입력하세요</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                placeholder="예: 힐튼 호텔, 파크 하얏트, 게스트하우스"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleSearch}
                disabled={searchLoading}
                className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:bg-gray-400"
              >
                {searchLoading ? '검색 중...' : '검색'}
              </button>
            </div>
          </div>

          <div className="mt-6">
            {searchLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                <span>숙소를 검색하는 중...</span>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <div className="text-lg mb-2">🔍</div>
                <div>숙소를 검색해보세요</div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm font-semibold text-gray-700 mb-3">
                  검색 결과 {searchResults.length}개
                </div>
                {searchResults.map((acc) => (
                  <div 
                    key={acc.id} 
                    className="flex gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <img 
                      src={acc.image} 
                      alt={acc.name}
                      className="w-16 h-16 object-cover rounded bg-gray-200 flex-shrink-0"
                      onError={(e) => {
                        if (!e.target.src.startsWith('data:')) {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Yzk5YzMiIGR5PSIuM2VtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                        }
                      }}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 mb-1 truncate">{acc.name}</div>
                      <div className="text-xs text-gray-500 mb-1 truncate">{acc.address}</div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span>{acc.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          <span>{acc.likes}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAdd(acc)}
                      className="flex-shrink-0 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                    >
                      추가
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
