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

// 인증 관련 커스텀 훅 import
import { useAuth } from '../hooks/useAuth';

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
  
  // 인증 관련 상태와 함수들을 가져옴
  const { isAuthenticated } = useAuth();

  /**
   * 여행 계획 시작 버튼 클릭 핸들러
   * - 로그인 상태 확인 후 여행 계획 페이지로 이동
   * - 로그인하지 않았으면 로그인 페이지로 리다이렉트
   */
  const handleStartPlan = () => {
    if (isAuthenticated()) {
      navigate('/trip-plan-ex1');
    } else {
      // 로그인 후 여행 계획 페이지로 돌아올 수 있도록 state 전달
      navigate('/login', { state: { from: '/trip-plan-ex1' } });
    }
  };

  return (
    <section className="relative bg-gradient-to-b from-blue-50 to-indigo-100 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 항상 가로 2열로 고정 - 마이로처럼 */}
        <div className="grid grid-cols-2 gap-8 lg:gap-12 items-center min-h-[60vh]">
          {/* 왼쪽: 텍스트 - 마이로처럼 적당한 크기 */}
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
              당신의 완벽한 여행,
              <br />
              AI가 도와줍니다.
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed">
              개인 맞춤형 여행 일정을 AI가 자동으로 생성해드립니다. 더 이상 복잡한 계획에 시간을 낭비하지 마세요.
            </p>
            {/* CTA 버튼: 마이로처럼 적당한 크기 */}
            <div className="pt-2">
              <button
                onClick={handleStartPlan}
                className="inline-flex items-center justify-center h-12 sm:h-14 px-6 sm:px-8 bg-black hover:bg-gray-900 text-white text-base sm:text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
              >
                AI로 여행 시작하기
              </button>
            </div>
          </div>

          {/* 오른쪽: 동영상 - 마이로처럼 적당한 크기 */}
          <div className="relative w-full h-[40vh] sm:h-[50vh]">
            <div className="w-full h-full rounded-xl overflow-hidden shadow-xl bg-gray-200">
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
