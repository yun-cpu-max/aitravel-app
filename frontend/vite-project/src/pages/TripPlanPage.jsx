/**
 * TripPlanPage 컴포넌트
 * - AI 여행 계획 생성의 메인 페이지
 * - 하이브리드 UX: 폼 입력 + 챗봇 대화 + 결과 미리보기
 * - 4단계로 구성: 예약/교통 정보 → 기본 정보 → 챗봇 조정 → 결과 미리보기
 */

// React 기본 훅들 import
import React, { useState, useEffect, useRef } from 'react';

// React Router DOM import (라우팅 관련)
import { useNavigate } from 'react-router-dom';

/**
 * TripPlanPage 컴포넌트
 * - AI 여행 계획 생성의 전체 프로세스를 관리
 * - 사용자 입력을 받아 AI가 맞춤형 여행 계획을 생성
 * 
 * @returns {JSX.Element} 렌더링된 TripPlanPage 컴포넌트
 */
const TripPlanPage = () => {
  // STEP0: 예약/교통 정보 입력 (선행 단계)
  const [step, setStep] = useState(0); // 0: 예약/출발 정보, 1: 기본 폼, 2: 챗봇, 3: 결과
  const [travelStartType, setTravelStartType] = useState('flight'); // 'flight'|'location'|'accommodation'
  const [flightInfo, setFlightInfo] = useState({
    arrivalAirport: '',
    arrivalDateTime: '', // ISO string
    departureAirport: '',
    departureDateTime: ''
  });
  const [startLocation, setStartLocation] = useState(''); // 국내 출발 위치 or 숙소 주소

  // Step 1: Form 기반 입력
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [numAdults, setNumAdults] = useState(2);
  const [numChildren, setNumChildren] = useState(0);
  const [budget, setBudget] = useState(1500000); // KRW 기준 예시

  // Step 2: 챗봇 세부 조정(로컬 상태)
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: '여행 스타일은 어떤 편이세요? (휴양/액티비티/문화 탐방/미식 등)' },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Day-level transport simulation
  const [transportByDay, setTransportByDay] = useState([]);
  // e.g. [{ day:1, defaultMode:'대중교통', segments: [{from:'A', to:'B', mode:'도보'}] }, ...]

  // 달력 월 이동 상태
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-11

  // 여행지 자동완성(로컬 제안)
  const destinationOptions = ['서울', '부산', '제주', '파리', '도쿄', '오사카', '방콕', '뉴욕', '런던', '로마', '바르셀로나', '시드니'];
  const [showSuggestions, setShowSuggestions] = useState(false);
  const filteredDestinations = destination
    ? destinationOptions.filter((d) => d.toLowerCase().includes(destination.toLowerCase())).slice(0, 8)
    : destinationOptions.slice(0, 8);

  // 페이지 이탈 방지 관련 상태
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const isInitialized = useRef(false);

  const navigate = useNavigate();

  // localStorage 저장/복원
  useEffect(() => {
    const savedData = localStorage.getItem('tripPlanData');
    if (savedData) {
      const data = JSON.parse(savedData);
      setStep(data.step || 0);
      setTravelStartType(data.travelStartType || 'flight');
      setFlightInfo(data.flightInfo || { arrivalAirport: '', arrivalDateTime: '', departureAirport: '', departureDateTime: '' });
      setStartLocation(data.startLocation || '');
      setDestination(data.destination || '');
      setDate(data.date || '');
      setStartDate(data.startDate ? new Date(data.startDate) : null);
      setEndDate(data.endDate ? new Date(data.endDate) : null);
      setNumAdults(data.numAdults || 2);
      setNumChildren(data.numChildren || 0);
      setBudget(data.budget || 1500000);
      setChatMessages(data.chatMessages || [{ role: 'assistant', content: '여행 스타일은 어떤 편이세요? (휴양/액티비티/문화 탐방/미식 등)' }]);
      setTransportByDay(data.transportByDay || []);
      
    // 저장된 데이터가 있으면 변경사항이 있다고 표시 (실제 입력이 있을 때만)
    const hasStoredData = data.destination || data.date || data.startDate || data.endDate || 
                          data.flightInfo?.arrivalAirport || data.flightInfo?.arrivalDateTime || 
                          data.startLocation || (data.chatMessages && data.chatMessages.length > 1);
    setHasUnsavedChanges(hasStoredData);
    }
    isInitialized.current = true;
  }, []);

  // 변경사항 감지 및 저장
  useEffect(() => {
    if (!isInitialized.current) return;
    
    // 사용자가 실제로 입력을 시작했는지 확인 (더 엄격한 조건)
    const hasInput = (destination && destination.trim() !== '') || 
                    (date && date.trim() !== '') || 
                    startDate || endDate || 
                    (flightInfo.arrivalAirport && flightInfo.arrivalAirport.trim() !== '') || 
                    (flightInfo.arrivalDateTime && flightInfo.arrivalDateTime.trim() !== '') || 
                    (startLocation && startLocation.trim() !== '') || 
                    chatMessages.length > 1 ||
                    step > 0 || 
                    numAdults > 1 || 
                    numChildren > 0 || 
                    budget > 1500000;
    
    setHasUnsavedChanges(hasInput);
    
    if (hasInput) {
      // 데이터 저장
      const data = {
        step,
        travelStartType,
        flightInfo,
        startLocation,
        destination,
        date,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        numAdults,
        numChildren,
        budget,
        chatMessages,
        transportByDay
      };
      localStorage.setItem('tripPlanData', JSON.stringify(data));
    }
  }, [destination, date, startDate, endDate, flightInfo, startLocation, chatMessages, transportByDay, step, travelStartType, numAdults, numChildren, budget]);

  // 페이지 이탈 방지 (브라우저 새로고침, 탭 닫기 등)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '작성 중인 여행 계획이 있습니다. 페이지를 나가시면 작성한 내용이 초기화됩니다. 정말 나가시겠습니까?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // 네비게이션 차단을 위한 커스텀 이벤트 리스너
  useEffect(() => {
    const handleLinkInteraction = (e) => {
      // 폼 내부 요소들은 차단하지 않음
      if (e.target.closest('form') || 
          e.target.closest('[role="button"]') ||
          e.target.type === 'radio' ||
          e.target.type === 'checkbox' ||
          e.target.type === 'text' ||
          e.target.type === 'email' ||
          e.target.type === 'number' ||
          e.target.type === 'date' ||
          e.target.type === 'time' ||
          e.target.tagName === 'BUTTON' ||
          e.target.closest('button')) {
        return;
      }

      // 네비게이션 링크만 차단
      const link = e.target.closest('a');
      if (link && hasUnsavedChanges) {
        // 이벤트 완전 차단
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        setShowExitConfirm(true);
        // 클릭된 링크의 href를 저장하여 나중에 이동할 수 있도록 함
        window.pendingNavigation = link.href;
        
        // false 반환으로 추가 차단
        return false;
      }
    };

    // mousedown과 click 이벤트 모두 차단 (capture: true로 설정하여 더 일찍 차단)
    document.addEventListener('mousedown', handleLinkInteraction, true);
    document.addEventListener('click', handleLinkInteraction, true);
    
    return () => {
      document.removeEventListener('mousedown', handleLinkInteraction, true);
      document.removeEventListener('click', handleLinkInteraction, true);
    };
  }, [hasUnsavedChanges]);

  // 브라우저 뒤로가기/앞으로가기 차단
  useEffect(() => {
    const handlePopState = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        setShowExitConfirm(true);
        // 브라우저 히스토리에 다시 추가하여 뒤로가기 방지
        window.history.pushState(null, '', window.location.href);
        // 대기 중인 네비게이션을 뒤로가기로 설정
        window.pendingNavigation = 'back';
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [hasUnsavedChanges]);


  // 데이터 초기화 함수
  const clearTripData = () => {
    localStorage.removeItem('tripPlanData');
    setStep(0);
    setTravelStartType('flight');
    setFlightInfo({ arrivalAirport: '', arrivalDateTime: '', departureAirport: '', departureDateTime: '' });
    setStartLocation('');
    setDestination('');
    setDate('');
    setStartDate(null);
    setEndDate(null);
    setNumAdults(2);
    setNumChildren(0);
    setBudget(1500000);
    setChatMessages([{ role: 'assistant', content: '여행 스타일은 어떤 편이세요? (휴양/액티비티/문화 탐방/미식 등)' }]);
    setTransportByDay([]);
    setHasUnsavedChanges(false);
  };

  // 페이지 이탈 확인 핸들러
  const handleConfirmExit = () => {
    clearTripData();
    setShowExitConfirm(false);
    
    // 저장된 네비게이션 URL이 있으면 해당 페이지로 이동
    if (window.pendingNavigation) {
      const targetUrl = window.pendingNavigation;
      window.pendingNavigation = null; // 먼저 초기화
      
      if (targetUrl === 'back') {
        // 뒤로가기인 경우
        window.history.back();
      } else if (targetUrl) {
        // 특정 URL로 이동하는 경우
        window.location.href = targetUrl;
      }
    }
  };

  const handleCancelExit = () => {
    setShowExitConfirm(false);
    // 대기 중인 네비게이션 초기화
    window.pendingNavigation = null;
  };

  // arrival 정보로 startDate 동기화
  const syncStartDateWithArrival = (arrivalISO) => {
    if (arrivalISO) {
      const arrivalDate = new Date(arrivalISO);
      setStartDate(arrivalDate);
      const formattedDate = `${arrivalDate.getFullYear()}-${(arrivalDate.getMonth() + 1).toString().padStart(2, '0')}-${arrivalDate.getDate().toString().padStart(2, '0')}`;
      setDate(formattedDate);
    }
  };

  // 교통수단 기반 추정 (플레이스홀더: 실제는 Directions API로 교체)
  const estimateTravelTimeAndCost = (dayIndex, mode) => {
    const baseTime = 60; // 분 기본값 예시
    const modeFactors = { 
      '도보': {t:1.5, c:0.2}, 
      '대중교통': {t:1, c:1}, 
      '차량(택시)': {t:0.7, c:4}, 
      '렌터카': {t:0.8, c:2.5} 
    };
    const f = modeFactors[mode] || {t:1, c:1};
    return { 
      estimatedMinutes: Math.round(baseTime * f.t), 
      estimatedCost: Math.round(5000 * f.c) 
    };
  };

  // Step 0 검증 및 다음 단계로
  const handleNextFromStep0 = () => {
    if (travelStartType === 'flight') {
      if (!flightInfo.arrivalAirport || !flightInfo.arrivalDateTime) {
        alert('도착 공항과 도착 일시를 모두 입력해주세요.');
        return;
      }
      syncStartDateWithArrival(flightInfo.arrivalDateTime);
    } else if (travelStartType === 'location' || travelStartType === 'accommodation') {
      if (!startLocation) {
        alert('출발 위치를 입력해주세요.');
        return;
      }
    }
    setStep(1);
  };

  const handleNextFromForm = () => {
    if (!destination || !date) {
      alert('여행지와 날짜를 모두 입력해주세요.');
      return;
    }
    setStep(2);
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(0, prev - 1));
  };

  const handleNextFromChat = () => {
    setStep(3);
  };

  const handleConfirmPlan = () => {
    navigate('/trip-plan'); // 임시 라우팅(자기 페이지로 새로고침 대용)로 사용하여 미사용 경고 제거
    alert('일정을 확정하고 저장/예약 단계로 진행합니다.');
  };

  // 참고 값(미사용 제거)

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateClick = (day) => {
    const selectedDate = new Date(viewYear, viewMonth, day);
    if (!startDate || (startDate && endDate)) {
      setStartDate(selectedDate);
      setEndDate(null);
    } else if (selectedDate > startDate) {
      setEndDate(selectedDate);
    } else {
      setEndDate(startDate);
      setStartDate(selectedDate);
    }
  };

  const handleApplyDates = () => {
    if (startDate && endDate) {
      const formattedStartDate = `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')}`;
      const formattedEndDate = `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')}`;
      setDate(`${formattedStartDate} ~ ${formattedEndDate}`);
      setIsCalendarOpen(false);
    }
  };

  // Day별 교통수단 변경 핸들러
  const handleTransportModeChange = (dayIndex, mode) => {
    const newTransportByDay = [...transportByDay];
    if (!newTransportByDay[dayIndex]) {
      newTransportByDay[dayIndex] = { day: dayIndex + 1, defaultMode: mode, segments: [] };
    } else {
      newTransportByDay[dayIndex].defaultMode = mode;
    }
    setTransportByDay(newTransportByDay);
  };

  const handlePrevMonth = () => {
    setViewMonth((prev) => {
      if (prev === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setViewMonth((prev) => {
      if (prev === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const renderCalendar = () => {
    const totalDays = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="text-gray-300"></div>);
    }

    for (let i = 1; i <= totalDays; i++) {
      const dayDate = new Date(viewYear, viewMonth, i);
      const isSelected = (startDate && dayDate >= startDate && (!endDate || dayDate <= endDate)) || (endDate && dayDate >= endDate && dayDate <= startDate);
      const isToday = dayDate.toDateString() === today.toDateString();
      const isStart = startDate && dayDate.toDateString() === startDate.toDateString();
      const isEnd = endDate && dayDate.toDateString() === endDate.toDateString();

      days.push(
        <button
          key={i}
          onClick={() => handleDateClick(i)}
          className={`py-2 rounded-full font-medium transition-colors ${
            isStart || isEnd ? 'bg-blue-600 text-white' : ''
          } ${
            isSelected && !isStart && !isEnd ? 'bg-blue-200 text-blue-800' : 'text-gray-700 hover:bg-gray-200'
          } ${isToday ? 'border-2 border-blue-500' : ''}`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
          <div key={day} className="font-semibold text-gray-500">{day}</div>
        ))}
        {days}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 페이지 이탈 확인 모달 */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              작성 중인 내용이 있습니다
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              페이지를 나가시면 작성한 여행 계획 내용이 초기화됩니다.<br/>
              정말 나가시겠습니까?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCancelExit}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          여행 계획 시작하기
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          폼으로 뼈대를 만들고, 챗봇으로 살을 붙여 보세요.
        </p>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[0,1,2,3].map((s) => (
          <div key={s} className={`w-3 h-3 rounded-full ${step === s ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
        ))}
      </div>

      {/* Step 0: 예약/교통 정보 입력 */}
      {step === 0 && (
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl mx-auto text-left">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">출발점 정보 입력</h2>
          <p className="text-gray-600 mb-6">AI가 정확한 일정을 생성하기 위해 출발점 정보가 필요합니다.</p>
          
          {/* 여행 시작 타입 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">여행 시작 방식</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="travelStartType"
                  value="flight"
                  checked={travelStartType === 'flight'}
                  onChange={(e) => setTravelStartType(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">해외여행</div>
                  <div className="text-sm text-gray-500">항공편 정보</div>
                </div>
              </label>
              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="travelStartType"
                  value="location"
                  checked={travelStartType === 'location'}
                  onChange={(e) => setTravelStartType(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">국내여행</div>
                  <div className="text-sm text-gray-500">출발 위치</div>
                </div>
              </label>
              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="travelStartType"
                  value="accommodation"
                  checked={travelStartType === 'accommodation'}
                  onChange={(e) => setTravelStartType(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">숙소 예약</div>
                  <div className="text-sm text-gray-500">숙소 주소</div>
                </div>
              </label>
            </div>
          </div>

          {/* 항공편 정보 입력 */}
          {travelStartType === 'flight' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">도착 공항 *</label>
                <input
                  type="text"
                  placeholder="예: 인천공항, 김포공항, 나리타공항"
                  value={flightInfo.arrivalAirport}
                  onChange={(e) => setFlightInfo(prev => ({ ...prev, arrivalAirport: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">도착 일시 *</label>
                <input
                  type="datetime-local"
                  value={flightInfo.arrivalDateTime}
                  onChange={(e) => setFlightInfo(prev => ({ ...prev, arrivalDateTime: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">출발 공항 (선택)</label>
                  <input
                    type="text"
                    placeholder="예: 김해공항, 제주공항"
                    value={flightInfo.departureAirport}
                    onChange={(e) => setFlightInfo(prev => ({ ...prev, departureAirport: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">출발 일시 (선택)</label>
                  <input
                    type="datetime-local"
                    value={flightInfo.departureDateTime}
                    onChange={(e) => setFlightInfo(prev => ({ ...prev, departureDateTime: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 출발 위치 입력 */}
          {(travelStartType === 'location' || travelStartType === 'accommodation') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {travelStartType === 'location' ? '출발 위치' : '숙소 주소'} *
              </label>
              <input
                type="text"
                placeholder={travelStartType === 'location' ? '예: 서울역, 부산터미널, 집' : '예: 서울시 강남구 테헤란로 123'}
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          <div className="flex justify-end mt-6">
            <button
              onClick={handleNextFromStep0}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all"
            >
              다음 (여행 정보 입력)
            </button>
          </div>
        </div>
      )}

      {/* Step 1: 폼 입력 */}
      {step === 1 && (
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl mx-auto text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 relative">
          <input
            type="text"
            placeholder="여행지를 입력해주세요 (예: 파리)"
            value={destination}
                onChange={(e) => { setDestination(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
              {showSuggestions && filteredDestinations.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredDestinations.map((item) => (
                    <button
                      key={item}
                      onMouseDown={() => { setDestination(item); setShowSuggestions(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative md:col-span-2">
            <input
              type="text"
              placeholder="여행 날짜를 선택해주세요"
              value={date}
              readOnly
              onClick={() => setIsCalendarOpen(true)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
            />
            <button
              onClick={() => setIsCalendarOpen(true)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h.01M16 14h.01M12 14h.01M16 18h.01M12 18h.01M16 22h.01M12 22h.01M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </button>
          </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">성인</label>
              <input
                type="number"
                min={1}
                value={numAdults}
                onChange={(e) => setNumAdults(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">아동</label>
              <input
                type="number"
                min={0}
                value={numChildren}
                onChange={(e) => setNumChildren(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">예산 (₩)</label>
              <input
                type="number"
                min={300000}
                max={50000000}
                step={50000}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <div className="text-right text-sm text-gray-700 mt-1">{budget.toLocaleString()}원</div>
            </div>
        </div>

        {isCalendarOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
              <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <button onClick={handlePrevMonth} className="p-2 rounded hover:bg-gray-100" aria-label="previous month">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                    </button>
                    <h3 className="text-lg font-semibold text-gray-800">{viewYear}년 {viewMonth + 1}월</h3>
                    <button onClick={handleNextMonth} className="p-2 rounded hover:bg-gray-100" aria-label="next month">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                    </button>
                  </div>
                <button onClick={() => setIsCalendarOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              {renderCalendar()}
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleApplyDates}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  선택 완료
                </button>
              </div>
            </div>
          </div>
        )}

          <div className="flex justify-end mt-6">
        <button
              onClick={handleNextFromForm}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all"
        >
              다음 (챗봇으로 세부 조정)
        </button>
      </div>
        </div>
      )}

      {/* Step 2: 챗봇 튜닝 */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* 좌측/중앙: 대화 인터페이스 */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md text-left">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">챗봇 세부 조정</h2>
            <div className="h-80 overflow-y-auto border border-gray-200 rounded-md p-4 bg-gray-50">
              {chatMessages.map((m, idx) => (
                <div key={idx} className={`mb-3 ${m.role === 'assistant' ? 'text-left' : 'text-right'}`}>
                  <span className={`inline-block px-3 py-2 rounded-lg ${m.role === 'assistant' ? 'bg-white text-gray-800 border' : 'bg-blue-600 text-white'}`}>
                    {m.content}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="메시지를 입력하세요 (예: 미식 위주로, 박물관 방문 포함)"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <button
                onClick={() => {
                  if (!chatInput.trim()) return;
                  setChatMessages((prev) => [...prev, { role: 'user', content: chatInput.trim() }]);
                  setChatInput('');
                  // 목업: 간단한 에코 응답
                  setTimeout(() => {
                    setChatMessages((prev) => [...prev, { role: 'assistant', content: '알겠습니다! 해당 취향을 일정에 반영할게요.' }]);
                  }, 400);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-5 rounded-lg"
              >
                전송
              </button>
            </div>

            <div className="mt-3 text-sm text-gray-500">
              예시 질문: "여행 중 어떤 부분을 가장 중시하세요? (숙소/음식/체험/편의성)", "특별히 가보고 싶은 명소나 음식점이 있나요?"
            </div>

            <div className="flex justify-between mt-6">
              <button onClick={handlePrev} className="px-5 py-3 rounded-lg border text-gray-700 hover:bg-gray-50">이전</button>
              <button onClick={handleNextFromChat} className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold">다음 (결과 보기)</button>
            </div>
          </div>

          {/* 우측: 일정 미리보기 카드(요약) */}
          <div className="bg-white p-6 rounded-lg shadow-md text-left">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">입력 요약</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>여행지: <span className="font-medium">{destination || '-'}</span></li>
              <li>날짜: <span className="font-medium">{date || '-'}</span></li>
              <li>인원: <span className="font-medium">성인 {numAdults} · 아동 {numChildren}</span></li>
              <li>예산: <span className="font-medium">{budget.toLocaleString()}원</span></li>
            </ul>
            <div className="mt-4 text-xs text-gray-500">대화 내용을 반영해 일정이 조정됩니다.</div>
          </div>
        </div>
      )}

      {/* Step 3: 결과 미리보기 */}
      {step === 3 && (
        <div className="max-w-6xl mx-auto text-left">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">일정 초안</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1,2,3].map((d) => {
                    const dayIndex = d - 1;
                    const transportMode = transportByDay[dayIndex]?.defaultMode || '대중교통';
                    const transportEstimate = estimateTravelTimeAndCost(dayIndex, transportMode);
                    
                    return (
                      <div key={d} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm text-gray-500">Day {d}</div>
                          <select
                            value={transportMode}
                            onChange={(e) => handleTransportModeChange(dayIndex, e.target.value)}
                            className="text-xs px-2 py-1 border rounded"
                          >
                            <option value="도보">도보</option>
                            <option value="대중교통">대중교통</option>
                            <option value="차량(택시)">차량(택시)</option>
                            <option value="렌터카">렌터카</option>
                            <option value="기타">기타</option>
                          </select>
                        </div>
                        <div className="font-semibold text-gray-800 mb-2">{destination || '여행지'} 탐방</div>
                        <ul className="text-sm text-gray-700 list-disc pl-4 space-y-1">
                          <li>주요 명소 방문</li>
                          <li>추천 맛집</li>
                          <li>이동 및 휴식</li>
                        </ul>
                        <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          <div>예상 이동시간: {transportEstimate.estimatedMinutes}분</div>
                          <div>예상 교통비: {transportEstimate.estimatedCost.toLocaleString()}원</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">예산 분배(목업)</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>숙박: {(budget * 0.45).toLocaleString()}원</li>
                  <li>식비: {(budget * 0.25).toLocaleString()}원</li>
                  <li>교통: {(budget * 0.2).toLocaleString()}원</li>
                  <li>체험: {(budget * 0.1).toLocaleString()}원</li>
                </ul>
                <div className="mt-3 text-xs text-gray-500">
                  * 교통수단 변경 시 실시간 재계산 (플레이스홀더)
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">다음 단계</h3>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                  <li>일정 세부 수정(챗봇 대화로 조정)</li>
                  <li>예약 옵션 확인(항공/숙소/교통)</li>
                  <li>저장 또는 공유</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button onClick={handlePrev} className="px-5 py-3 rounded-lg border text-gray-700 hover:bg-gray-50">이전</button>
            <button onClick={handleConfirmPlan} className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold">일정 확정하기</button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default TripPlanPage;
/*
=== 변경 요약 (Final Ver. 4.0) ===
1. STEP0 추가: 예약/교통 정보 입력 (해외여행/국내여행/숙소 예약)
2. Day별 교통수단 선택 및 시뮬레이션 (도보/대중교통/택시/렌터카)
3. 달력/시작일 동기화 (arrivalDateTime → startDate 자동 설정)
4. localStorage 저장/복원 (페이지 새로고침 시 데이터 유지)
5. Step 인디케이터 4단계로 확장 (0~3)
6. 교통수단 변경 시 예상 시간/비용 실시간 계산

=== 플레이스홀더 함수 위치 ===
- estimateTravelTimeAndCost(): 실제 Directions API로 교체 필요
- AI 일정 생성: arrivalLocation + arrivalDateTime 인자 사용하도록 수정 필요
- 예산 재계산: 교통수단 변경 시 budget 교통 항목 자동 갱신 필요

=== 다음 단계 (외부 연동) ===
- Google Maps API: Directions API로 실제 교통시간/비용 계산
- AI 서버: 출발점 정보를 반영한 일정 생성 API
- 예약 연동: 항공/숙소 예약 시스템 연동
*/