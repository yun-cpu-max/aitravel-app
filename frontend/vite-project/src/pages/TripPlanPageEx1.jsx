/**
 * TripPlanPageEx1
 * - 여행 일정 생성 마법사(프론트 전용 목업)
 * - Google Maps JavaScript Places 라이브러리 사용 버전 (키는 .env)
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';

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
  const [directQuery, setDirectQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all', '명소', '식당', '카페'
  const [_directResults, setDirectResults] = useState([]); // [{id,name,address,lat,lng,type}] - API 연동 시 사용
  const [searchTick, _setSearchTick] = useState(0); // 검색 트리거 - API 연동 시 사용
  
  // 선택된 장소 목록
  const [selectedPlaces, setSelectedPlaces] = useState([]); // [{id, name, category, address, image, likes, rating, lat, lng, stayHours, stayMinutes}]
  
  // 하드코딩된 임시 장소 데이터
  const mockPlaces = useMemo(() => [
    { id: 'p1', name: '신세카이 혼도리 상점가', category: '명소', address: '오사카부 오사카시 나니와구', image: 'https://via.placeholder.com/60', likes: 74, rating: 4.0 },
    { id: 'p2', name: '난바', category: '명소', address: '오사카부 오사카시 주오구', image: 'https://via.placeholder.com/60', likes: 69, rating: 4.3 },
    { id: 'p3', name: '헵파이브 대관람차', category: '명소', address: '오사카부 오사카시 텐노지구', image: 'https://via.placeholder.com/60', likes: 59, rating: 4.2 },
    { id: 'p4', name: '이치란라멘 도톤보리점 본관', category: '식당', address: '오사카부 오사카시 주오구 도톤보리', image: 'https://via.placeholder.com/60', likes: 57, rating: 4.5 },
    { id: 'p5', name: '우메다 스카이빌딩', category: '명소', address: '오사카부 오사카시 기타구', image: 'https://via.placeholder.com/60', likes: 82, rating: 4.4 },
    { id: 'p6', name: '도톤보리', category: '명소', address: '오사카부 오사카시 주오구', image: 'https://via.placeholder.com/60', likes: 91, rating: 4.6 },
    { id: 'p7', name: '유니버설 스튜디오 재팬', category: '명소', address: '오사카부 오사카시 코노하나구', image: 'https://via.placeholder.com/60', likes: 156, rating: 4.8 },
    { id: 'p8', name: '오사카 성', category: '명소', address: '오사카부 오사카시 주오구', image: 'https://via.placeholder.com/60', likes: 67, rating: 4.1 },
    { id: 'p9', name: '신사이바시스지 상점가', category: '명소', address: '오사카부 오사카시 주오구', image: 'https://via.placeholder.com/60', likes: 73, rating: 4.3 },
    { id: 'p10', name: '우메다 공중정원', category: '명소', address: '오사카부 오사카시 기타구', image: 'https://via.placeholder.com/60', likes: 65, rating: 4.2 },
    { id: 'p11', name: '타코야키 무코무코', category: '식당', address: '오사카부 오사카시 주오구', image: 'https://via.placeholder.com/60', likes: 48, rating: 4.0 },
    { id: 'p12', name: '스타벅스 도톤보리점', category: '카페', address: '오사카부 오사카시 주오구', image: 'https://via.placeholder.com/60', likes: 52, rating: 4.2 },
  ], []);
  
  // 카테고리 필터링된 장소 목록
  const filteredPlaces = useMemo(() => {
    if (selectedCategory === 'all') return mockPlaces;
    return mockPlaces.filter(p => {
      if (selectedCategory === '명소') return p.category === '명소';
      if (selectedCategory === '식당') return p.category === '식당';
      if (selectedCategory === '카페') return p.category === '카페';
      return true;
    });
  }, [selectedCategory, mockPlaces]);
  
  // 검색어 필터링
  const searchFilteredPlaces = useMemo(() => {
    if (!directQuery.trim()) return filteredPlaces;
    const query = directQuery.toLowerCase();
    return filteredPlaces.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.address.toLowerCase().includes(query)
    );
  }, [filteredPlaces, directQuery]);
  
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
  
  // 총 소요 시간 계산
  const totalTime = useMemo(() => {
    const totalMinutes = selectedPlaces.reduce((sum, p) => sum + (p.stayHours || 0) * 60 + (p.stayMinutes || 0), 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { hours, minutes };
  }, [selectedPlaces]);

  // 직접 선택: 후보 목록 필터 (상태 선언 이후로 이동)
  // const filteredPlaces = useMemo(() => [], []);

  // AI 모드 상태(목업)
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPlan, setAiPlan] = useState(defaultDirectPlan());

  const [hasUnsavedChanges] = useState(false);
  const initialized = useRef(false);


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

  // 직접 선택 본문 (좌: 검색/리스트, 우: 선택된 장소 + 지도)
  const DirectMode = () => (
    <div className="flex flex-col min-[500px]:flex-row gap-6 w-full">
      {/* Left Pane: 장소 선택 폼 */}
      <div className="min-[500px]:w-[450px] w-full bg-white p-6 rounded-lg shadow-md text-left">
        {/* 헤더 */}
        <div className="mb-4">
          
          <div className="text-sm font-semibold text-gray-800">
            {selectedDestination.name || '여행지'} {dateRange || '날짜 선택'}
          </div>
        </div>
        
        {/* 추천 장소 안내 */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <button className="text-sm text-blue-600 hover:text-blue-700">
            어떤 장소를 선택할지 모르겠나요? 추천 장소 목록 보기
          </button>
        </div>
        
        {/* 검색창 */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={directQuery}
              onChange={(e) => setDirectQuery(e.target.value)}
              placeholder="장소명을 입력하세요"
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="mt-2">
            <button className="text-sm text-gray-500 hover:text-gray-700">
              찾으시는 장소가 없나요?
            </button>
          </div>
        </div>
        
        {/* 카테고리 필터 */}
        <div className="mb-4">
          <div className="flex gap-2">
            {['all', '명소', '식당', '카페'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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
        
        {/* 장소 목록 */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {searchFilteredPlaces.map((place) => {
            const isSelected = selectedPlaces.some(p => p.id === place.id);
            return (
              <div key={place.id} className="flex gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                {/* 썸네일 */}
                <img 
                  src={place.image} 
                  alt={place.name}
                  className="w-16 h-16 object-cover rounded"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/60';
                  }}
                />
                
                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 mb-1 truncate">{place.name}</div>
                  <div className="text-xs text-gray-500 mb-1">
                    <span className="text-blue-600">{place.category}</span>
                    {' · '}
                    <span className="truncate">{place.address}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      <span>{place.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>{place.rating}</span>
                    </div>
                  </div>
                </div>
                
                {/* 선택 버튼 */}
                <button
                  onClick={() => togglePlaceSelection(place)}
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {isSelected ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Right Pane: 선택된 장소 + 지도 */}
      <div className="flex-1 flex flex-col gap-6">
        {/* 선택된 장소 목록 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-800">{selectedPlaces.length}</span>개 장소 · {' '}
              <span className="font-semibold text-gray-800">{totalTime.hours}시간 {totalTime.minutes}분</span>
              {' '}/ 60시간 0분
            </div>
            <button 
              onClick={() => setSelectedPlaces([])}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              장소 설정 초기화
            </button>
          </div>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {selectedPlaces.length === 0 ? (
              <div className="text-center text-gray-400 py-8">선택된 장소가 없습니다.</div>
            ) : (
              selectedPlaces.map((place, index) => (
                <div key={place.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 mb-1 truncate">{place.name}</div>
                    <div className="text-xs text-gray-500">
                      <span className="text-blue-600">{place.category}</span>
                      {' · '}
                      <span className="truncate">{place.address}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {place.stayHours || 2}시간 {place.stayMinutes || 0}분
                    </div>
                  </div>
                  <button
                    onClick={() => removeSelectedPlace(place.id)}
                    className="flex-shrink-0 w-6 h-6 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* 지도 */}
        <DirectSearchMap
          centerLat={selectedDestination.lat}
          centerLng={selectedDestination.lng}
          query={directQuery}
          types={selectedCategory === 'all' ? ['tourist_attraction', 'restaurant', 'cafe'] : selectedCategory === '명소' ? ['tourist_attraction'] : selectedCategory === '식당' ? ['restaurant'] : ['cafe']}
          tick={searchTick}
          onResults={setDirectResults}
        />
        
        {/* 하단 버튼 */}
        <div className="flex justify-between mt-4">
          <button onClick={() => setStep(0)} className="px-5 py-3 rounded-lg border text-gray-700 hover:bg-gray-50">이전</button>
          <button onClick={() => setStep(3)} className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold">다음</button>
        </div>
      </div>
    </div>
  );

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
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-12 max-w-none">
        <HeaderView step={step} />

        {step === 0 && (
          <div className="flex flex-col min-[500px]:flex-row gap-6 w-full">
            <div className="min-[500px]:w-[600px] w-full">
              <CommonFormView state={state} handlers={handlers} />
            </div>
            <div className="flex-1">
              <MapPreview selectedDestination={selectedDestination} />
            </div>
          </div>
        )}
        {step === 1 && (
          <ModeSelect />
        )}
        {step === 2 && (mode === 'direct' ? <DirectMode /> : <AiMode />)}
        {step === 3 && <Finalize />}
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
function HeaderView({ step }) {
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800">여행 일정 생성</h1>
      <p className="text-gray-600 mt-2">공통 정보 입력 → 모드 선택 → 분기 플로우 → 확인/저장</p>
      <div className="flex items-center justify-center gap-2 mt-4">
        {[0, 1, 2, 3].map((s) => (
          <div key={s} className={`w-3 h-3 rounded-full ${step === s ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
        ))}
      </div>
    </div>
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
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
            />
            <button
              type="button"
              onClick={handleSearchCity}
              className="px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
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
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
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
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <button className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md">
              설정 완료
            </button>
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
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md"
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

// Google Places Nearby/Text 검색과 마커 클러스터링(간단)
function DirectSearchMap({ centerLat, centerLng, query, types, tick, onResults }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID; // 선택적 mapId
  const mapRef = React.useRef(null);
  const mapRefInstance = React.useRef(null);
  const markersRef = React.useRef([]);

  React.useEffect(() => {
    if (!apiKey) return;
    const ensure = () => new Promise((resolve, reject) => {
      if (window.google && window.google.maps && window.google.maps.places) return resolve(window.google.maps);
      const id = 'gmaps-js-sdk';
      let s = document.getElementById(id);
      if (!s) {
        s = document.createElement('script');
        s.id = id;
        s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&language=ko&libraries=places,marker&loading=async`;
        s.async = true;
        s.defer = true;
        s.onload = () => resolve(window.google.maps);
        s.onerror = () => reject(new Error('load-fail'));
        document.head.appendChild(s);
      } else {
        const check = () => (window.google && window.google.maps && window.google.maps.places) ? resolve(window.google.maps) : setTimeout(check, 50);
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
      }
    });
    return () => { cancelled = true; };
  }, [apiKey, mapId, centerLat, centerLng]);

  // 검색 트리거
  React.useEffect(() => {
    if (!window.google || !window.google.maps || !window.google.maps.places) return;
    if (!mapRefInstance.current) return;

    // 기존 마커 제거
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const maps = window.google.maps;
    const service = new maps.places.PlacesService(mapRefInstance.current);

    const request = {
      location: (typeof centerLat === 'number' && typeof centerLng === 'number') ? new maps.LatLng(centerLat, centerLng) : mapRefInstance.current.getCenter(),
      radius: 5000,
      keyword: query || undefined,
      type: undefined,
    };

    // types 배열을 순회하며 NearbySearch 여러 번 병렬 수행(간단 구현)
    const typeList = Array.isArray(types) && types.length > 0 ? types : ['tourist_attraction'];
    const all = [];
    let done = 0;
    typeList.forEach((t) => {
      service.nearbySearch({ ...request, type: t }, (results, status) => {
        done += 1;
        if (status === maps.places.PlacesServiceStatus.OK && Array.isArray(results)) {
          results.forEach((r) => {
            const pos = r.geometry && r.geometry.location ? { lat: r.geometry.location.lat(), lng: r.geometry.location.lng() } : null;
            if (!pos) return;
            
            // mapId가 있고 AdvancedMarkerElement를 사용할 수 있으면 사용, 아니면 일반 Marker 사용
            const Adv = maps.marker && maps.marker.AdvancedMarkerElement;
            const canUseAdvanced = mapId && Adv;
            let marker;
            
            if (canUseAdvanced) {
              try {
                marker = new Adv({ map: mapRefInstance.current, position: pos, title: r.name });
              } catch (e) {
                // AdvancedMarkerElement 실패 시 일반 Marker로 fallback
                console.warn('AdvancedMarkerElement 사용 실패, 일반 Marker로 대체:', e);
                marker = new maps.Marker({ position: pos, map: mapRefInstance.current, title: r.name });
              }
            } else {
              marker = new maps.Marker({ position: pos, map: mapRefInstance.current, title: r.name });
            }
            
            markersRef.current.push(marker);
            all.push({ id: r.place_id, name: r.name, address: r.vicinity || r.formatted_address, lat: pos.lat, lng: pos.lng, type: t });
          });
        }
        if (done === typeList.length) {
          if (typeof onResults === 'function') onResults(all);
        }
      });
    });
  }, [tick, centerLat, centerLng, query, types, mapId, onResults]);

  // 중심 이동
  React.useEffect(() => {
    if (!mapRefInstance.current) return;
    if (typeof centerLat === 'number' && typeof centerLng === 'number') {
      mapRefInstance.current.setCenter({ lat: centerLat, lng: centerLng });
    }
  }, [centerLat, centerLng]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">검색 지도</h3>
      <div ref={mapRef} className="w-full h-[500px] border rounded" />
    </div>
  );
}
