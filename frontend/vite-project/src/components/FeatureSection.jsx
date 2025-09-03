// src/components/FeatureSection.jsx

import React from 'react';

const FeatureSection = () => {
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
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          주요 기능
        </h2>
        <p className="text-gray-600 mb-12">
          AI 기술로 구현된 혁신적인 여행 계획 서비스를 경험해보세요.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-gray-50 p-6 rounded-lg shadow-md transition-all duration-300 hover:shadow-xl">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-500 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
