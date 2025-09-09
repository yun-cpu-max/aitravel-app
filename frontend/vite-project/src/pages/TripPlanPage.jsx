import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TripPlanPage = () => {
  // Step 1: Form 기반 입력
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [numAdults, setNumAdults] = useState(2);
  const [numChildren, setNumChildren] = useState(0);
  const [budget, setBudget] = useState(1500000); // KRW 기준 예시

  // Step 제어
  const [step, setStep] = useState(1); // 1: 폼, 2: 챗봇 튜닝, 3: 결과 미리보기

  // Step 2: 챗봇 세부 조정(로컬 상태)
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: '여행 스타일은 어떤 편이세요? (휴양/액티비티/문화 탐방/미식 등)' },
  ]);
  const [chatInput, setChatInput] = useState('');

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

  const navigate = useNavigate();

  const handleNextFromForm = () => {
    if (!destination || !date) {
      alert('여행지와 날짜를 모두 입력해주세요.');
      return;
    }
    setStep(2);
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(1, prev - 1));
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
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">
        여행 계획 시작하기
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        폼으로 뼈대를 만들고, 챗봇으로 살을 붙여 보세요.
      </p>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1,2,3].map((s) => (
          <div key={s} className={`w-3 h-3 rounded-full ${step === s ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
        ))}
      </div>

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
                  {[1,2,3].map((d) => (
                    <div key={d} className="border rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-1">Day {d}</div>
                      <div className="font-semibold text-gray-800 mb-2">{destination || '여행지'} 탐방</div>
                      <ul className="text-sm text-gray-700 list-disc pl-4 space-y-1">
                        <li>주요 명소 방문</li>
                        <li>추천 맛집</li>
                        <li>이동 및 휴식</li>
                      </ul>
                    </div>
                  ))}
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
  );
};

export default TripPlanPage;
// 달력: 이전/다음 달 이동 버튼 추가, 다른 달 선택 가능
// 여행지: 입력 시 자동완성 드롭다운(로컬 제안) 표시
// 예산: 슬라이더 → 숫자 입력으로 변경, 천단위 표기 유지
// 자동완성 데이터 확장(서버/서드파티 API 연동)
// 달력 라이브러리(react-date-range 등)로 다중월/범위 선택 강화
// 예산 유효성, 통화 포맷 옵션
// API/예약 연동은 이후 단계에서 붙이겠습니다.