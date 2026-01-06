/**
 * HowItWorksModal 컴포넌트
 * - 애플리케이션의 이용 방법을 설명하는 모달
 * - 4단계의 사용 과정을 시각적으로 표시
 * - 오버레이 배경과 함께 전체 화면을 덮는 모달 형태
 */

// React 기본 import
import React from 'react';

/**
 * HowItWorksModal 컴포넌트
 * - 이용 방법을 단계별로 설명하는 모달
 * - 조건부 렌더링으로 열림/닫힘 상태를 관리
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {boolean} props.isOpen - 모달 열림/닫힘 상태
 * @param {Function} props.onClose - 모달을 닫는 함수
 * @returns {JSX.Element|null} 렌더링된 HowItWorksModal 컴포넌트 또는 null
 */
const HowItWorksModal = ({ isOpen, onClose }) => {
  // 모달이 열려있지 않으면 아무것도 렌더링하지 않음
  if (!isOpen) return null;

  /**
   * 이용 방법의 4단계 데이터
   * - 각 단계는 번호, 제목, 설명을 포함
   * - 실제 구현된 플로우를 반영
   */
  const steps = [
    { step: '1', title: '기본 정보 입력', description: '여행지를 검색하고 날짜를 선택하세요. 최대 10일까지 선택 가능하며, 일자별 여행 시간을 설정할 수 있습니다.' },
    { step: '2', title: '장소 선택', description: '명소, 식당, 카페를 카테고리별로 검색하고 선택하세요. 각 장소의 체류 시간을 설정할 수 있습니다.' },
    { step: '3', title: '숙소 선택', description: '여행 일정에 맞는 숙소를 검색하고 날짜별로 선택하세요. 하나의 숙소를 여러 날에 걸쳐 선택할 수 있습니다.' },
    { step: '4', title: '일정 생성', description: '선택한 정보를 확인하고 이동수단을 선택하세요. AI가 최적의 동선을 고려한 여행 일정을 자동으로 생성해드립니다.' },
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