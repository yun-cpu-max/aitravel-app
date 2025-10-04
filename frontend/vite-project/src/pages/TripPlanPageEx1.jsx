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
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

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
  const [departurePoint, setDeparturePoint] = useState('');
  const [people, setPeople] = useState(2);
  const [budget, setBudget] = useState(1000000);
  const [budgetInput, setBudgetInput] = useState('1000000');
  const [flight, setFlight] = useState({ airline: '', flightNo: '', hotel: '' });
  
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
    if (!startDate || (startDate && endDate)) {
      setStartDate(selected);
      setEndDate(null);
    } else if (selected > startDate) {
      setEndDate(selected);
    } else {
      setEndDate(startDate);
      setStartDate(selected);
    }
  };

  const applyDateRange = () => {
    if (startDate && endDate) {
      const fs = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      const fe = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
      setDateRange(`${fs} ~ ${fe}`);
      setCalendarOpen(false);
    }
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
  const mockCities = [
    { name: '도쿄, 일본', lat: 35.6762, lng: 139.6503 },
    { name: '파리, 프랑스', lat: 48.8566, lng: 2.3522 },
    { name: '제주도, 한국', lat: 33.4996, lng: 126.5312 },
    { name: '서울, 한국', lat: 37.5665, lng: 126.9780 },
    { name: '부산, 한국', lat: 35.1796, lng: 129.0756 },
    { name: '뉴욕, 미국', lat: 40.7128, lng: -74.0060 },
    { name: '런던, 영국', lat: 51.5074, lng: -0.1278 },
    { name: '시드니, 호주', lat: -33.8688, lng: 151.2093 },
    { name: '방콕, 태국', lat: 13.7563, lng: 100.5018 },
    { name: '싱가포르', lat: 1.3521, lng: 103.8198 },
  ];

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
      const list = (data.suggestions || []).map((s) => ({
        place_id: s?.placePrediction?.placeId,
        description: s?.placePrediction?.text?.text || ''
      })).filter((x) => x.place_id && x.description);
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
  const [selectedCategories, setSelectedCategories] = useState(['관광지', '음식']);
  const [placeSearch, setPlaceSearch] = useState('');
  const [directPlan, setDirectPlan] = useState(defaultDirectPlan());

  // 직접 선택: 후보 목록 필터 (상태 선언 이후로 이동)
  const filteredPlaces = useMemo(() => {
    const q = placeSearch.trim().toLowerCase();
    return MOCK_PLACES.filter((p) =>
      (selectedCategories.includes(p.category)) &&
      (!q || p.name.toLowerCase().includes(q))
    );
  }, [placeSearch, selectedCategories]);

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


  const addPlaceToDay = (dayIndex, place) => {
    const next = { ...directPlan, days: directPlan.days.map((d, i) => (i === dayIndex ? { ...d } : d)) };
    next.days[dayIndex].items = [...next.days[dayIndex].items, { ...place }];
    setDirectPlan(next);
  };

  const removePlaceFromDay = (dayIndex, itemIndex) => {
    const next = { ...directPlan, days: directPlan.days.map((d) => ({ ...d, items: [...d.items] })) };
    next.days[dayIndex].items.splice(itemIndex, 1);
    setDirectPlan(next);
  };

  const movePlace = (dayIndex, itemIndex, dir) => {
    const next = { ...directPlan, days: directPlan.days.map((d) => ({ ...d, items: [...d.items] })) };
    const items = next.days[dayIndex].items;
    const target = itemIndex + dir;
    if (target < 0 || target >= items.length) return;
    const temp = items[itemIndex];
    items[itemIndex] = items[target];
    items[target] = temp;
    setDirectPlan(next);
  };

  const updateStayMinutes = (dayIndex, itemIndex, minutes) => {
    const next = { ...directPlan, days: directPlan.days.map((d) => ({ ...d, items: [...d.items] })) };
    next.days[dayIndex].items[itemIndex].stayMinutes = Math.max(15, Number(minutes) || 60);
    setDirectPlan(next);
  };

  // 보정/경고(목업)
  const getWarnings = useMemo(() => {
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
    departurePoint,
    people,
    budget,
    budgetInput,
    flight,
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
    setDeparturePoint,
    setPeople,
    setBudget,
    setBudgetInput,
    setFlight,
    setCalendarOpen,
    setViewYear,
    setViewMonth,
    handleDateClick,
    applyDateRange,
    handleSearchCity,
    handleSelectPrediction,
    setStep,
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

  // 직접 선택 본문
  const DirectMode = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md text-left">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">A. 직접 필수 장소 선택</h3>
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">카테고리</div>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((c) => (
              <label key={c.key} className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(c.label)}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setSelectedCategories((prev) => on ? [...prev, c.label] : prev.filter((x) => x !== c.label));
                  }}
                />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">장소 검색</div>
          <input
            type="text"
            value={placeSearch}
            onChange={(e) => setPlaceSearch(e.target.value)}
            placeholder="장소 이름으로 검색"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredPlaces.map((p) => (
              <div key={p.id} className="p-3 border rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-800">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.category} · 기본 {p.stayMinutes}분</div>
                </div>
                <div className="flex gap-2">
                  {[0,1,2].map((di) => (
                    <button key={di} onClick={() => addPlaceToDay(di, p)} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">Day {di+1} 추가</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <h4 className="text-md font-semibold text-gray-800 mt-6 mb-2">B. 보정 기능 (추천 & 경고)</h4>
        {getWarnings.length === 0 ? (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">현재 특별한 경고가 없습니다.</div>
        ) : (
          <ul className="text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded p-3 list-disc pl-5">
            {getWarnings.map((w, i) => (<li key={i}>{w}</li>))}
          </ul>
        )}

        <h4 className="text-md font-semibold text-gray-800 mt-6 mb-2">C/D. 초안 편집</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {directPlan.days.map((d, di) => (
            <div key={d.day} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-500">Day {d.day}</div>
              </div>
              {d.items.length === 0 && (
                <div className="text-sm text-gray-400">아직 추가된 장소가 없습니다.</div>
              )}
              <ul className="space-y-2">
                {d.items.map((it, ii) => (
                  <li key={`${it.id}-${ii}`} className="p-2 border rounded">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-gray-800">{it.name}</div>
                        <div className="text-xs text-gray-500">{it.category}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => movePlace(di, ii, -1)} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">↑</button>
                        <button onClick={() => movePlace(di, ii, 1)} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">↓</button>
                        <button onClick={() => removePlaceFromDay(di, ii)} className="text-xs px-2 py-1 border rounded text-red-600 hover:bg-red-50">삭제</button>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">체류 시간(분)</div>
                    <input
                      type="number"
                      min={15}
                      value={it.stayMinutes}
                      onChange={(e) => updateStayMinutes(di, ii, e.target.value)}
                      className="mt-1 w-full px-2 py-1 border rounded"
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex justify-between mt-6">
          <button onClick={() => setStep(1)} className="px-5 py-3 rounded-lg border text-gray-700 hover:bg-gray-50">이전</button>
          <button onClick={() => setStep(3)} className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold">다음 (완성)</button>
        </div>
      </div>

      {/* 우측 요약/지도 자리(지도는 목업) */}
      <div className="bg-white p-6 rounded-lg shadow-md text-left">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">요약</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>여행지: <span className="font-medium">{selectedDestination.name || '-'}</span></li>
          <li>기간: <span className="font-medium">{dateRange || '-'}</span></li>
          <li>인원: <span className="font-medium">{people}</span></li>
          <li>예산: <span className="font-medium">{budget.toLocaleString()}원</span></li>
        </ul>
        <div className="mt-4 h-40 bg-gray-100 border rounded flex items-center justify-center text-gray-400 text-sm">지도(목업)</div>
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
                <li>출발점: <span className="font-medium">{departurePoint || '-'}</span></li>
                <li>인원: <span className="font-medium">{people}</span></li>
                <li>예산: <span className="font-medium">{budget.toLocaleString()}원</span></li>
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
      <div className="container mx-auto px-4 py-12">
        <HeaderView step={step} />

        {step === 0 && (
          <CommonFormView state={state} handlers={handlers} />
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
    departurePoint,
    people,
    budgetInput,
    flight,
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
    setDeparturePoint,
    setPeople,
    setBudget,
    setBudgetInput,
    setFlight,
    setViewYear,
    setViewMonth,
    handleDateClick,
    applyDateRange,
    setStep,
  } = handlers;

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full max-w-3xl mx-auto text-left">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">기본 정보</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 relative">
          <label className="block text-sm text-gray-600 mb-1">도시/나라</label>
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
                    <div className="font-semibold text-gray-800">{s.structured_formatting?.main_text || s.description}</div>
                    <div className="text-xs text-gray-500">{s.structured_formatting?.secondary_text}</div>
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
          <label className="block text-sm text-gray-600 mb-1">날짜(기간)</label>
          <input
            type="text"
            value={dateRange}
            readOnly
            onClick={() => setCalendarOpen(true)}
            placeholder="날짜를 선택하세요"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
          />
          <button onClick={() => setCalendarOpen(true)} className="absolute right-3 top-1/2 -translate-y-1/2 mt-2 text-gray-400 hover:text-gray-600">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h.01M16 14h.01M12 14h.01M16 18h.01M12 18h.01M16 22h.01M12 22h.01M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          </button>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">출발점</label>
          <input
            type="text"
            value={departurePoint}
            onChange={(e) => setDeparturePoint(e.target.value)}
            placeholder="예: 인천공항 / 서울역 / 숙소 주소"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            autoComplete="off"
            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">인원</label>
          <input
            type="number"
            min={1}
            value={people}
            onChange={(e) => setPeople(Math.max(1, Number(e.target.value) || 1))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">예산 (₩)</label>
            <input
              type="text"
              inputMode="numeric"
              value={budgetInput}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, '');
                setBudgetInput(raw);
                const n = Number(raw || '0');
                setBudget(n);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="text-right text-sm text-gray-700 mt-1">{Number(budgetInput||'0').toLocaleString()}원</div>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">항공사/편명 (선택)</label>
          <input
            type="text"
            value={flight.airline}
            onChange={(e) => setFlight({ ...flight, airline: e.target.value })}
            placeholder="예: KE121 / JL90"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            autoComplete="off"
            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">숙소 (선택)</label>
          <input
            type="text"
            value={flight.hotel}
            onChange={(e) => setFlight({ ...flight, hotel: e.target.value })}
            placeholder="예: 신라호텔 / OO 에어비앤비"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            autoComplete="off"
            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
          />
        </div>
      </div>

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
            setStep(1)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md"
        >
          다음 (모드 선택)
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
                const isSelected = state.startDate && d >= state.startDate && (!state.endDate || d <= state.endDate);
                const isToday = d.toDateString() === TODAY.toDateString();
                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={`py-2 rounded-full font-medium transition-colors ${
                      isStart || isEnd ? 'bg-blue-600 text-white' : ''
                    } ${
                      isSelected && !isStart && !isEnd ? 'bg-blue-200 text-blue-800' : 'text-gray-700 hover:bg-gray-200'
                    } ${isToday ? 'border-2 border-blue-500' : ''}`}
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
