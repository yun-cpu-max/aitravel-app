/**
 * 메인 App 컴포넌트
 * - 애플리케이션의 최상위 컴포넌트로 전체 라우팅과 레이아웃을 관리합니다.
 * - React Router를 사용하여 페이지 간 네비게이션을 처리합니다.
 * - 인증 컨텍스트를 제공하여 전역 상태를 관리합니다.
 */

// React 기본 훅 import
import React, { useState } from 'react';

// React Router DOM import (클라이언트 사이드 라우팅)
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 인증 컨텍스트 Provider import
import { AuthProvider } from './contexts/AuthContextProvider';

// 공통 컴포넌트들 import
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeatureSection from './components/FeatureSection';
import HowItWorksModal from './components/HowItWorksModal';
import Footer from './components/Footer';

// 페이지 컴포넌트들 import
import TripPlanPage from './pages/TripPlanPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';
import TripArchivePage from './pages/TripArchivePage';

/**
 * App 컴포넌트
 * - 애플리케이션의 최상위 컴포넌트
 * - 라우팅, 모달 상태, 전체 레이아웃을 관리
 * 
 * @returns {JSX.Element} 렌더링된 App 컴포넌트
 */
function App() {
  // 모달 열림/닫힘 상태를 관리하는 state
  // useState: React의 기본 상태 관리 훅
  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * 모달을 여는 핸들러 함수
   * - Navbar의 "작동 방식" 버튼 클릭 시 호출됩니다.
   */
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  /**
   * 모달을 닫는 핸들러 함수
   * - 모달 내부의 닫기 버튼이나 배경 클릭 시 호출됩니다.
   */
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    // AuthProvider: 인증 상태를 전역으로 제공하는 컨텍스트
    <AuthProvider>
      {/* BrowserRouter: HTML5 History API를 사용한 라우팅 */}
      <BrowserRouter>
        {/* 전체 레이아웃 컨테이너 (Flexbox 사용) */}
        <div className="flex flex-col min-h-screen font-sans">
          {/* 상단 네비게이션 바 */}
          <Navbar onOpenModal={handleOpenModal} />
          
          {/* 작동 방식 모달 (조건부 렌더링) */}
          <HowItWorksModal isOpen={isModalOpen} onClose={handleCloseModal} />
          
          {/* 메인 콘텐츠 영역 (flex-grow로 남은 공간 모두 차지) */}
          <main className="flex-grow">
                {/* 라우트 정의 */}
                <Routes>
                  {/* 홈 페이지 라우트 */}
                  <Route
                    path="/"
                    element={
                      <>
                        <HeroSection />
                        <FeatureSection />
                      </>
                    }
                  />
                  {/* 로그인 페이지 라우트 */}
                  <Route path="/login" element={<LoginPage />} />
                  {/* 프로필 페이지 라우트 */}
                  <Route path="/profile" element={<ProfilePage />} />
                  {/* 여행 계획 페이지 라우트 */}
                  <Route path="/trip-plan" element={<TripPlanPage />} />
                  {/* 대시보드 페이지 라우트 */}
                  <Route path="/dashboard" element={<DashboardPage />} />
                  {/* 여행 기록 아카이브 페이지 라우트 */}
                  <Route path="/archive/:tripId" element={<TripArchivePage />} />
                </Routes>
          </main>

          {/* 하단 푸터 */}
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
