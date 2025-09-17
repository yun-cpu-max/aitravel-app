/**
 * FeatureSection 컴포넌트
 * - 애플리케이션의 주요 기능들을 소개하는 섹션
 * - 캐러셀 형태로 여러 기능을 순환하며 표시
 * - 사용자가 직접 이전/다음 버튼으로 탐색 가능
 */

// React 기본 훅 import
import React, { useState } from 'react';

/**
 * FeatureSection 컴포넌트
 * - 주요 기능들을 캐러셀 형태로 표시
 * - 사용자가 이전/다음 버튼으로 기능을 탐색할 수 있음
 * 
 * @returns {JSX.Element} 렌더링된 FeatureSection 컴포넌트
 */
const FeatureSection = () => {
  // 현재 표시 중인 기능의 인덱스를 관리하는 state
  const [currentIndex, setCurrentIndex] = useState(0);

  /**
   * 표시할 주요 기능들의 데이터 배열
   * - 각 기능은 제목과 설명을 포함
   */
  const features = [
    {
      title: 'AI 맞춤형 일정 생성',
      description: '도시, 날씨, 취향만 알려주세요. AI가 최적의 여행 계획을 만들어드립니다.',
    },
    {
      title: '실시간 경로 최적화',
      description: '교통 상황 및 혼잡도를 고려한 최적 경로를 제시합니다.',
    },
    {
      title: '예산 맞춤 계획',
      description: '설정한 예산에 맞춰 최고의 가성비 여행을 계획합니다.',
    },
    {
      title: '개인 취향 분석',
      description: '과거 여행 기록을 분석해 다음 여행에 반영합니다.',
    },
    {
      title: '통합 예약 지원',
      description: '항공권, 숙소, 교통 수단을 한 번에 예약하고 관리하세요.',
    },
    {
      title: '실시간 경비 추적기',
      description: '여행 중 지출을 실시간으로 기록하고 예산을 관리할 수 있습니다.',
    },
  ];

  /**
   * 다음 기능으로 이동하는 핸들러
   * - 마지막 기능에서 첫 번째 기능으로 순환
   */
  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % features.length);
  };

  /**
   * 이전 기능으로 이동하는 핸들러
   * - 첫 번째 기능에서 마지막 기능으로 순환
   */
  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + features.length) % features.length);
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 text-center relative">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          주요 기능
        </h2>
        <p className="text-gray-600 mb-12">
          AI 기술로 구현된 혁신적인 여행 계획 서비스를 경험해보세요.
        </p>

        <div className="relative flex justify-center items-center">
          {/* 이전 버튼 */}
          <button
            onClick={handlePrev}
            className="absolute left-0 z-10 p-2 bg-white rounded-full shadow-md transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Previous feature"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>

          {/* 현재 기능 표시 */}
          <div className="bg-gray-50 p-6 rounded-xl shadow-lg w-full max-w-md transition-transform duration-500 ease-in-out transform scale-100 min-h-60 flex flex-col justify-center items-center">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {features[currentIndex].title}
            </h3>
            <p className="text-gray-500 text-sm">
              {features[currentIndex].description}
            </p>
          </div>

          {/* 다음 버튼 */}
          <button
            onClick={handleNext}
            className="absolute right-0 z-10 p-2 bg-white rounded-full shadow-md transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Next feature"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>

        {/* 페이지네이션 (점) */}
        <div className="flex justify-center space-x-2 mt-8">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                index === currentIndex ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to feature ${index + 1}`}
            ></button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;