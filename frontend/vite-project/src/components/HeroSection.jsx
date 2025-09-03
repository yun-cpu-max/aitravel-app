// src/components/HeroSection.jsx

import React from 'react';

const HeroSection = () => {
  return (
    <section className="relative bg-gradient-to-b from-blue-50 to-indigo-100 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 items-center">
          {/* 왼쪽: 텍스트 + 폼 */}
          <div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 leading-tight">
              당신의 완벽한 여행,
              <br />
              AI가 계획합니다.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl">
              개인 맞춤형 여행 일정을 AI가 자동으로 생성해드립니다. 더 이상 복잡한 계획에 시간을 낭비하지 마세요.
            </p>

            <div className="mt-10 bg-white p-6 rounded-xl shadow-md w-full max-w-xl">
              <div className="grid grid-cols-1 gap-4">
                <input type="text" placeholder="여행지를 입력해주세요 (예: 파리)" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors" />
                <input type="text" placeholder="여행 날짜를 선택해주세요" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors" />
              </div>
              <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all">
                AI로 일정 생성하기
              </button>
            </div>
          </div>

          {/* 오른쪽: 동영상 자리 */}
          <div className="relative">
            <div className="aspect-video w-full rounded-xl overflow-hidden shadow-xl bg-gray-200">
              {/* 실제 영상 삽입 예정 위치 */}
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
