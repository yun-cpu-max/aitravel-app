/**
 * DashboardPage 컴포넌트
 * - 사용자의 여행 대시보드 페이지
 * - 현재 진행중인 여행들을 상태별로 표시
 * - 여행 상세 정보, 일정, 예산 등을 한눈에 확인 가능
 */

// React 기본 훅 import
import React, { useState, useEffect } from 'react';

// React Router DOM import (라우팅 관련)
import { Link } from 'react-router-dom';

// 인증 관련 커스텀 훅 import
import { useAuth } from '../hooks/useAuth';

/**
 * DashboardPage 컴포넌트
 * - 사용자의 여행 대시보드를 렌더링
 * - 여행 상태별 필터링 기능 제공
 * - 여행 목록과 상세 정보를 표시
 *
 * @returns {JSX.Element} 렌더링된 DashboardPage 컴포넌트
 */
const DashboardPage = () => {
  // 인증 관련 상태와 함수들을 가져옴
  const { user, isAuthenticated } = useAuth();

  // 여행 목록 상태 관리
  const [trips, setTrips] = useState([]);
  
  // 로딩 상태 관리
  const [loading, setLoading] = useState(true);
  
  // 선택된 필터 상태 관리 (전체, 계획중, 확정됨, 진행중, 완료됨)
  const [selectedFilter, setSelectedFilter] = useState('all');

  // 여행 상태별 필터 옵션
  const filterOptions = [
    { value: 'all', label: '전체 여행', count: 0 },
    { value: 'planning', label: '계획 중', count: 0 },
    { value: 'confirmed', label: '확정됨', count: 0 },
    { value: 'ongoing', label: '진행 중', count: 0 },
    { value: 'completed', label: '완료됨', count: 0 }
  ];

  // 컴포넌트 마운트 시 여행 데이터 로드
  useEffect(() => {
    loadTrips();
  }, []);

  /**
   * 여행 데이터를 로드하는 함수
   * - 실제 서비스에서는 API 호출로 데이터를 가져옴
   * - 현재는 데모용 더미 데이터를 사용
   */
  const loadTrips = async () => {
    try {
      setLoading(true);
      
      // TODO: 실제 API 호출로 변경
      // const response = await fetch('/api/trips');
      // const data = await response.json();
      
      // 데모용 더미 데이터
      const dummyTrips = [
        {
          id: 1,
          title: "2025 파리 여행",
          destination: "파리",
          startDate: "2025-03-15",
          endDate: "2025-03-22",
          numAdults: 2,
          numChildren: 0,
          totalBudget: 3000000,
          status: "planning",
          createdAt: "2025-01-15T10:00:00",
          updatedAt: "2025-01-15T10:00:00",
          days: [
            {
              id: 1,
              dayNumber: 1,
              date: "2025-03-15",
              weatherInfo: '{"temp": 15, "weather": "맑음"}',
              itineraryItems: [
                {
                  id: 1,
                  title: "에펠탑 관광",
                  locationName: "에펠탑",
                  startTime: "09:00",
                  endTime: "11:00",
                  estimatedCost: 50000,
                  category: "관광",
                  isConfirmed: true
                },
                {
                  id: 2,
                  title: "카페 드 플뢰르 점심",
                  locationName: "카페 드 플뢰르",
                  startTime: "12:00",
                  endTime: "14:00",
                  estimatedCost: 80000,
                  category: "식사",
                  isConfirmed: false
                }
              ]
            }
          ]
        },
        {
          id: 2,
          title: "제주도 3박4일",
          destination: "제주도",
          startDate: "2025-02-20",
          endDate: "2025-02-23",
          numAdults: 2,
          numChildren: 1,
          totalBudget: 1500000,
          status: "confirmed",
          createdAt: "2025-01-10T14:30:00",
          updatedAt: "2025-01-12T09:15:00",
          days: []
        },
        {
          id: 3,
          title: "도쿄 여행",
          destination: "도쿄",
          startDate: "2025-01-25",
          endDate: "2025-01-30",
          numAdults: 1,
          numChildren: 0,
          totalBudget: 2000000,
          status: "ongoing",
          createdAt: "2025-01-05T16:20:00",
          updatedAt: "2025-01-20T11:45:00",
          days: []
        }
      ];
      
      setTrips(dummyTrips);
      
      // 필터별 카운트 업데이트
      updateFilterCounts(dummyTrips);
      
    } catch (error) {
      console.error('여행 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 필터별 여행 수를 업데이트하는 함수
   * - 각 상태별로 여행 수를 계산하여 필터 옵션에 반영
   *
   * @param {Array} tripList - 여행 목록
   */
  const updateFilterCounts = (tripList) => {
    const counts = {
      all: tripList.length,
      planning: tripList.filter(trip => trip.status === 'planning').length,
      confirmed: tripList.filter(trip => trip.status === 'confirmed').length,
      ongoing: tripList.filter(trip => trip.status === 'ongoing').length,
      completed: tripList.filter(trip => trip.status === 'completed').length
    };
    
    // 필터 옵션의 카운트 업데이트
    filterOptions.forEach(option => {
      option.count = counts[option.value];
    });
  };

  /**
   * 선택된 필터에 따라 여행 목록을 필터링하는 함수
   * - 'all' 선택 시 모든 여행 반환
   * - 특정 상태 선택 시 해당 상태의 여행만 반환
   *
   * @returns {Array} 필터링된 여행 목록
   */
  const getFilteredTrips = () => {
    if (selectedFilter === 'all') {
      return trips;
    }
    return trips.filter(trip => trip.status === selectedFilter);
  };

  /**
   * 여행 상태에 따른 배지 스타일을 반환하는 함수
   * - 각 상태별로 다른 색상과 텍스트를 표시
   *
   * @param {string} status - 여행 상태
   * @returns {Object} 배지 스타일 객체
   */
  const getStatusBadgeStyle = (status) => {
    const styles = {
      planning: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  /**
   * 여행 상태를 한국어로 변환하는 함수
   * - 백엔드 엔티티의 상태값을 사용자 친화적인 텍스트로 변환
   *
   * @param {string} status - 여행 상태
   * @returns {string} 한국어 상태 텍스트
   */
  const getStatusText = (status) => {
    const statusMap = {
      planning: '계획 중',
      confirmed: '확정됨',
      ongoing: '진행 중',
      completed: '완료됨'
    };
    return statusMap[status] || status;
  };

  /**
   * 날짜를 한국어 형식으로 포맷하는 함수
   * - YYYY-MM-DD 형식을 YYYY년 MM월 DD일 형식으로 변환
   *
   * @param {string} dateString - 날짜 문자열
   * @returns {string} 포맷된 날짜 문자열
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  /**
   * 예산을 천 단위로 포맷하는 함수
   * - 숫자를 천 단위로 구분하여 표시
   *
   * @param {number} amount - 금액
   * @returns {string} 포맷된 금액 문자열
   */
  const formatBudget = (amount) => {
    return amount ? amount.toLocaleString('ko-KR') + '원' : '미설정';
  };

  // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h2>
          <Link
            to="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 페이지 헤더 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                나의 여행 대시보드
              </h1>
              <p className="mt-2 text-gray-600">
                {user?.name}님의 여행 계획을 관리하고 확인하세요
              </p>
            </div>
            <Link
              to="/trip-plan"
              className="bg-black hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              새 여행 계획하기
            </Link>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 필터 탭 */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedFilter(option.value)}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  selectedFilter === option.value
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {option.label}
                <span className="ml-2 bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {option.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 여행 목록 */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">여행 데이터를 불러오는 중...</span>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {getFilteredTrips().map((trip) => (
              <div
                key={trip.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
              >
                {/* 여행 카드 헤더 */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {trip.title}
                      </h3>
                      <p className="text-gray-600 mb-3">
                        {trip.destination} • {trip.numAdults}명
                        {trip.numChildren > 0 && ` + ${trip.numChildren}명`}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{formatDate(trip.startDate)}</span>
                        <span>~</span>
                        <span>{formatDate(trip.endDate)}</span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeStyle(trip.status)}`}
                    >
                      {getStatusText(trip.status)}
                    </span>
                  </div>
                </div>

                {/* 여행 카드 본문 */}
                <div className="p-6">
                  <div className="space-y-4">
                    {/* 예산 정보 */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">총 예산</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatBudget(trip.totalBudget)}
                      </span>
                    </div>

                    {/* 일정 정보 */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">일정 수</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {trip.days?.length || 0}일
                      </span>
                    </div>

                    {/* 확정된 일정 수 */}
                    {trip.days && trip.days.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">확정된 일정</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {trip.days.reduce((count, day) => 
                            count + (day.itineraryItems?.filter(item => item.isConfirmed).length || 0), 0
                          )}개
                        </span>
                      </div>
                    )}

                    {/* 마지막 수정일 */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">마지막 수정</span>
                      <span className="text-sm text-gray-500">
                        {formatDate(trip.updatedAt)}
                      </span>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="mt-6 flex space-x-3">
                    <Link
                      to={`/trip-detail/${trip.id}`}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      상세보기
                    </Link>
                    <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200">
                      수정하기
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 여행이 없는 경우 */}
        {!loading && getFilteredTrips().length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedFilter === 'all' ? '아직 여행 계획이 없습니다' : '해당 상태의 여행이 없습니다'}
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedFilter === 'all' 
                ? '첫 번째 여행 계획을 만들어보세요!' 
                : '다른 상태의 여행을 확인해보세요.'
              }
            </p>
            <Link
              to="/trip-plan"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              여행 계획하기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
