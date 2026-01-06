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
      title: '여행지 검색',
      description: '원하는 여행지를 검색하고 인기 여행지를 추천받으세요.',
    },
    {
      title: '장소 찾기',
      description: '관광지, 레스토랑, 카페 등 다양한 장소를 검색하고 일정에 추가하세요.',
    },
    {
      title: '숙소 검색',
      description: '여행 기간에 맞는 숙소를 찾아 일정에 포함시킬 수 있습니다.',
    },
    {
      title: '교통수단 안내',
      description: '대중교통과 택시를 이용한 이동 시간과 경로를 확인하세요.',
    },
    {
      title: '일정 자동 생성',
      description: '선택한 장소와 숙소를 바탕으로 최적의 일정을 자동으로 생성합니다.',
    },
    {
      title: '여행 대시보드',
      description: '생성된 여행 일정을 한눈에 확인하고 관리할 수 있습니다.',
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
          편리한 여행 계획 서비스를 경험해보세요.
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
          <div className="bg-gray-50 p-8 rounded-xl shadow-lg w-full max-w-4xl transition-transform duration-500 ease-in-out transform scale-100 min-h-60 flex flex-col justify-center items-center">
            <h3 className="text-2xl font-semibold text-gray-700 mb-4">
              {features[currentIndex].title}
            </h3>
            <p className="text-gray-500 text-base">
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