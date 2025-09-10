import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar = ({ onOpenModal }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

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
            <div className="flex-shrink-0 flex items-center space-x-3">
              <img src="/logo.png" alt="스마트 여행 플래너" className="h-10 sm:h-11 md:h-12 w-auto object-contain" />
              <h1 className="text-2xl font-bold text-blue-600">
                스마트 여행 플래너
              </h1>
            </div>
          </div>
          
          {/* 링크 및 버튼 영역 */}
          <div className="block">
            <div className="ml-6 flex items-center space-x-4">
              {/* 이용 방법 버튼 */}
              <button
                onClick={onOpenModal}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                이용 방법
              </button>
              
              {/* 여행 계획하기 버튼 */}
              <Link
                to="/trip-plan"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
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
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    로그인
                  </Link>
                  <Link
                    to="/login"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
                  >
                    시작하기
                  </Link>
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