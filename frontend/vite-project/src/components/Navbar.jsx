// src/components/Navbar.jsx

import React from 'react';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 영역 */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center space-x-3">
              <img src="/logo.png" alt="스마트 여행 플래너" className="h-10 sm:h-11 md:h-12 w-auto object-contain" />
              <h1 className="text-2xl font-bold text-blue-600">
                스마트 여행 플래너
              </h1>
            </div>
          </div>
          
          {/* 링크 영역 (항상 보임) */}
          <div className="block">
            <div className="ml-6 flex items-center space-x-4">
              <a href="#" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                로그인
              </a>
              <a href="#" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-sm">
                회원가입
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
