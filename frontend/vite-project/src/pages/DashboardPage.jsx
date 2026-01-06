/**
 * DashboardPage 컴포넌트
 * - 사용자의 여행 대시보드 페이지
 * - 저장된 여행 계획들을 상태별로 표시
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // 필터 옵션
  const filterOptions = [
    { value: 'all', label: '전체 여행', count: 0 },
    { value: 'planning', label: '계획 중', count: 0 },
    { value: 'ongoing', label: '진행 중', count: 0 },
    { value: 'completed', label: '완료됨', count: 0 }
  ];

  // 페이지 진입 시 한 번만 전체 여행 목록 로드
  useEffect(() => {
    loadTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 여행 데이터를 로드하는 함수
   * - 전체 여행 목록을 가져온 후 사용자별로 필터링
   */
  const loadTrips = async () => {
    try {
      setLoading(true);
      
      // 전체 여행 목록 가져오기 (유저 필터링 없이 모두, 간단 정보만)
      const response = await fetch(`http://localhost:8081/api/trips/simple`);
      
      if (!response.ok) {
        throw new Error('여행 데이터를 불러오는데 실패했습니다.');
      }
      
      const allTrips = await response.json();
      
      console.log('📥 전체 여행 목록 (summary, 필터링 없이 모두 표시):', allTrips);
      
      // 일단 모든 여행을 대시보드에 그대로 표시
      setTrips(allTrips);
      updateFilterCounts(allTrips);
      
    } catch (error) {
      console.error('여행 데이터 로드 실패:', error);
      // 에러 발생 시 빈 배열로 설정
      setTrips([]);
      updateFilterCounts([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 필터별 여행 수를 업데이트하는 함수
   */
  const updateFilterCounts = (tripList) => {
    const counts = {
      all: tripList.length,
      planning: tripList.filter(trip => {
        const status = trip.status?.toUpperCase();
        return status === 'PLANNING' || status === 'planning' || trip.status === 'confirmed';
      }).length,
      ongoing: tripList.filter(trip => {
        const status = trip.status?.toUpperCase();
        return status === 'ONGOING' || status === 'ongoing';
      }).length,
      completed: tripList.filter(trip => {
        const status = trip.status?.toUpperCase();
        return status === 'COMPLETED' || status === 'completed';
      }).length
    };
    
    // 필터 옵션 업데이트는 상태로 관리하지 않고 계산으로 처리
    filterOptions.forEach(option => {
      option.count = counts[option.value];
    });
  };

  /**
   * 선택된 필터에 따라 여행 목록을 필터링하는 함수
   */
  const getFilteredTrips = () => {
    if (selectedFilter === 'all') {
      return trips;
    }
    if (selectedFilter === 'planning') {
      return trips.filter(trip => {
        const status = trip.status?.toUpperCase();
        return status === 'PLANNING' || status === 'planning' || trip.status === 'confirmed';
      });
    }
    if (selectedFilter === 'ongoing') {
      return trips.filter(trip => {
        const status = trip.status?.toUpperCase();
        return status === 'ONGOING' || status === 'ongoing';
      });
    }
    if (selectedFilter === 'completed') {
      return trips.filter(trip => {
        const status = trip.status?.toUpperCase();
        return status === 'COMPLETED' || status === 'completed';
      });
    }
    return trips;
  };

  /**
   * 여행 상태에 따른 배지 스타일을 반환하는 함수
   */
  const getStatusBadgeStyle = (status) => {
    const normalizedStatus = status?.toUpperCase();
    const styles = {
      PLANNING: 'bg-yellow-100 text-yellow-800',
      planning: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-yellow-100 text-yellow-800',
      ONGOING: 'bg-green-100 text-green-800',
      ongoing: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      completed: 'bg-gray-100 text-gray-800'
    };
    return styles[status] || styles[normalizedStatus] || 'bg-gray-100 text-gray-800';
  };

  /**
   * 여행 상태를 한국어로 변환하는 함수
   */
  const getStatusText = (status) => {
    const normalizedStatus = status?.toUpperCase();
    const statusMap = {
      PLANNING: '계획 중',
      planning: '계획 중',
      confirmed: '계획 중',
      ONGOING: '진행 중',
      ongoing: '진행 중',
      COMPLETED: '완료됨',
      completed: '완료됨'
    };
    return statusMap[status] || statusMap[normalizedStatus] || status || '계획 중';
  };

  /**
   * 날짜를 한국어 형식으로 포맷하는 함수
   */
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 필터별 카운트 계산
  const filterCounts = {
    all: trips.length,
    planning: trips.filter(trip => {
      const status = trip.status?.toUpperCase();
      return status === 'PLANNING' || status === 'planning' || trip.status === 'confirmed';
    }).length,
    ongoing: trips.filter(trip => {
      const status = trip.status?.toUpperCase();
      return status === 'ONGOING' || status === 'ongoing';
    }).length,
    completed: trips.filter(trip => {
      const status = trip.status?.toUpperCase();
      return status === 'COMPLETED' || status === 'completed';
    }).length
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

  const filteredTrips = getFilteredTrips();

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
              to="/trip-plan-ex1"
              className="bg-sky-500 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
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
                  {filterCounts[option.value]}
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
        ) : filteredTrips.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTrips.map((trip) => (
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
                  {/* 여행 일차 수 / 일정 항목 수 간단 표기 */}
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>여행 일수: {trip.daysCount ?? 0}일</p>
                    <p>여행 목록: {trip.totalItineraryItemsCount ?? 0}개</p>
                  </div>
                  {/* 액션 버튼 */}
                  <div className="mt-6">
                    <button
                      onClick={() => navigate(`/trip-detail/${trip.id}`)}
                      className="w-full bg-sky-500 hover:bg-gray-800 text-white text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      상세보기
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
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
              to="/trip-plan-ex1"
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
