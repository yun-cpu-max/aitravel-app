// src/components/HowItWorksSection.jsx

import React from 'react';

const HowItWorksSection = () => {
  const steps = [
    { step: '1', title: '여행 정보 입력', description: '가고 싶은 도시, 날짜, 취향 등을 알려주세요.' },
    { step: '2', title: 'AI가 일정 생성', description: 'AI가 실시간으로 최적의 여행 계획을 만들어줍니다.' },
    { step: '3', title: '일정 확인 및 수정', description: '생성된 일정을 확인하고, 원하는 대로 수정할 수 있습니다.' },
    { step: '4', title: '여행 시작', description: '이제 AI와 함께 즐거운 여행을 떠나세요.' },
  ];

  return (
    <section className="py-20 bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-12">
          이용 방법
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="w-12 h-12 flex items-center justify-center bg-blue-500 text-white rounded-full font-bold text-xl mb-4">
                {step.step}
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {step.title}
              </h3>
              <p className="text-gray-500 text-sm text-center">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
