/**
 * Navbar 컴포넌트
 * - 애플리케이션의 상단 네비게이션 바
 * - 로고, 메뉴, 인증 상태에 따른 버튼들을 표시
 * - 반응형 디자인으로 모바일과 데스크톱에서 모두 사용 가능
 */

// React 기본 import
import React from 'react';

// React Router DOM import (라우팅 관련)
import { Link, useNavigate } from 'react-router-dom';

// 인증 관련 커스텀 훅 import
import { useAuth } from '../hooks/useAuth';

/**
 * Navbar 컴포넌트
 * - 상단 네비게이션 바를 렌더링
 * - 인증 상태에 따라 다른 메뉴를 표시
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {Function} props.onOpenModal - 모달을 여는 함수
 * @returns {JSX.Element} 렌더링된 Navbar 컴포넌트
 */
const Navbar = ({ onOpenModal }) => {
  // 인증 관련 상태와 함수들을 가져옴
  const { user, logout, isAuthenticated } = useAuth();
  
  // 페이지 네비게이션을 위한 훅
  const navigate = useNavigate();

  /**
   * 로그아웃 처리 함수
   * - 사용자를 로그아웃시키고 홈페이지로 이동
   */
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      {/* max-w-7xl -> max-w-full로 변경 */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          {/* 로고 영역 */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <img src="/logo.png" alt="스마트 여행 플래너" className="w-10 h-10 rounded-md" />
              <h1 className="text-2xl font-bold text-blue-600">
                스마트 여행 플래너
              </h1>
            </Link>
          </div>
          
          {/* 링크 및 버튼 영역 */}
          <div className="block">
            <div className="ml-6 flex items-center space-x-4">
              {/* 이용 방법 버튼 */}
              <button
                onClick={onOpenModal}
                className="text-black hover:text-blue-600 px-3 py-2 rounded-md text-lg font-medium transition-colors duration-200"
              >
                이용 방법
              </button>
              
              {/* 여행 계획하기 버튼 */}
              <Link
                to="/trip-plan-ex1"
                className="text-black hover:text-blue-600 px-3 py-2 rounded-md text-lg font-medium transition-colors duration-200"
              >
                여행 계획하기
              </Link>

              {/* 인증 상태에 따른 버튼 표시 */}
              {isAuthenticated() ? (
                <>
                  {/* 사용자 프로필 드롭다운 */}
                  <div className="relative group">
                    <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">
                          {user?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <span>{user?.name || '사용자'}</span>
                    </button>
                    
                    {/* 드롭다운 메뉴 */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        나의 여행 대시보드
                      </Link>
                      <Link
                        to="/archive/demo-trip-1"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        여행 아카이브
                      </Link>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        프로필 관리
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        로그아웃
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-black hover:text-blue-600 px-3 py-2 rounded-md text-lg font-medium transition-colors duration-200"
                  >
                    로그인
                  </Link>
                  {/* <Link
                    to="/login"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
                  >
                    시작하기
                  </Link> */}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;