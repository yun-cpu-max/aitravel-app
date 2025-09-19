/**
 * HeroSection 컴포넌트
 * - 홈페이지의 메인 히어로 섹션
 * - 애플리케이션의 주요 메시지와 CTA 버튼을 표시
 * - 동영상 배경과 함께 시각적으로 매력적인 섹션
 */

// React 기본 import
import React from 'react';

// React Router DOM import (라우팅 관련)
import { useNavigate } from 'react-router-dom';

/**
 * HeroSection 컴포넌트
 * - 홈페이지의 메인 섹션을 렌더링
 * - 사용자에게 서비스의 가치를 전달하고 여행 계획 페이지로 유도
 * 
 * @returns {JSX.Element} 렌더링된 HeroSection 컴포넌트
 */
const HeroSection = () => {
  // 페이지 네비게이션을 위한 훅
  const navigate = useNavigate();

  /**
   * 여행 계획 시작 버튼 클릭 핸들러
   * - 여행 계획 페이지로 이동
   */
  const handleStartPlan = () => {
    navigate('/trip-plan');
  };

  return (
    <section className="relative bg-gradient-to-b from-blue-50 to-indigo-100 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 items-center">
          {/* 왼쪽: 텍스트 */}
          <div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 leading-tight">
              당신의 완벽한 여행,
              <br />
              AI가 계획합니다.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl">
              개인 맞춤형 여행 일정을 AI가 자동으로 생성해드립니다. 더 이상 복잡한 계획에 시간을 낭비하지 마세요.
            </p>
            {/* 버튼만 남김 */}
            <div className="mt-10">
            <button
                onClick={handleStartPlan}
                className="w-full sm:w-auto bg-black hover:bg-sky-400 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all"
                  >
                 AI로 여행 시작하기
            </button>

            </div>
          </div>

          {/* 오른쪽: 동영상 자리 */}
          <div className="relative">
            <div className="aspect-video w-full rounded-xl overflow-hidden shadow-xl bg-gray-200">
              <video className="w-full h-full object-cover" autoPlay loop muted playsInline>
                <source src="/mainvideo.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
