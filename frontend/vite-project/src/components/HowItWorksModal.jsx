import React from 'react';

const HowItWorksModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    { step: '1', title: '여행 정보 입력', description: '가고 싶은 도시, 날짜, 취향 등을 알려주세요.' },
    { step: '2', title: 'AI가 일정 생성', description: 'AI가 실시간으로 최적의 여행 계획을 만들어줍니다.' },
    { step: '3', title: '일정 확인 및 수정', description: '생성된 일정을 확인하고, 원하는 대로 수정할 수 있습니다.' },
    { step: '4', title: '여행 시작', description: '이제 AI와 함께 즐거운 여행을 떠나세요.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-8 md:p-12 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="모달 닫기"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            ></path>
          </svg>
        </button>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
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
      </div>
    </div>
  );
};

export default HowItWorksModal;