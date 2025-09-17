/**
 * Footer 컴포넌트
 * - 애플리케이션의 하단 푸터
 * - 저작권 정보와 연락처 정보를 표시
 * - 간단하고 깔끔한 디자인으로 구성
 */

// React 기본 import
import React from 'react';

/**
 * Footer 컴포넌트
 * - 페이지 하단에 표시되는 푸터 영역
 * - 저작권 정보와 연락처 정보를 포함
 * 
 * @returns {JSX.Element} 렌더링된 Footer 컴포넌트
 */
const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-400 py-10">
      <div className="max-w-6xl mx-auto px-4 text-center">
        {/* 저작권 정보 */}
        <p className="text-sm">
          © 2025 AI 여행 플래너. All rights reserved.
        </p>
        
        {/* 향후 추가될 수 있는 링크들 (현재는 주석 처리) */}
        {/* <p className="text-sm">
          이용약관
        </p>
        <p className="text-sm">
          개인정보처리방침
        </p>
        <p className="text-sm">
          고객센터
        </p>
        <p className="text-sm">
          제휴문의
        </p> */}
        
        {/* 연락처 정보 */}
        <p className="text-sm">
          이메일 : rhddbswo0625@naver.com
        </p>
      </div>
    </footer>
  );
};

export default Footer;
