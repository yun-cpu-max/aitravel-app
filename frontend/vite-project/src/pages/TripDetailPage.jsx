/**
 * TripDetailPage 컴포넌트
 * - 특정 여행의 전체 일정을 간단한 패널 형태로 보여주는 페이지
 * - URL: /trip-detail/:tripId
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

const TripDetailPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tripId) return;

    const fetchTripDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`http://localhost:8081/api/trips/${tripId}`);

        if (!response.ok) {
          throw new Error('여행 상세 정보를 불러오는데 실패했습니다.');
        }

        const data = await response.json();
        console.log('📥 여행 상세 데이터:', data);
        setTrip(data);
      } catch (err) {
        console.error('여행 상세 조회 실패:', err);
        setError(err.message || '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetail();
  }, [tripId]);

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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    // "HH:MM:SS" 또는 "HH:MM" 형태를 간단히 "HH:MM"으로 표시
    const [hh, mm] = timeString.split(':');
    return `${hh}:${mm}`;
  };

  const sortedDays = (trip?.days || []).slice().sort((a, b) => {
    if (a.dayNumber && b.dayNumber) return a.dayNumber - b.dayNumber;
    return 0;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="text-sm text-gray-500 hover:text-gray-700 mb-2"
            >
              ← 뒤로가기
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {trip?.title || '여행 상세'}
            </h1>
            {trip && (
              <p className="mt-2 text-gray-600 text-sm">
                {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)} ({trip.daysCount ?? 0}일,
                전체 일정 {trip.totalItineraryItemsCount ?? 0}개)
              </p>
            )}
          </div>
          <div className="space-x-2">
            <button
              onClick={() => navigate(`/trip-plan-ex1?tripId=${tripId}`)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              이 일정 수정하기
            </button>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">여행 상세 정보를 불러오는 중...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium mb-1">오류가 발생했습니다</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : !trip ? (
          <div className="text-center py-12 text-gray-600">여행 정보를 찾을 수 없습니다.</div>
        ) : (
          <div className="space-y-6">
            {/* 간단 요약 카드 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">여행 요약</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-700">
                <div>
                  <p className="text-gray-500 mb-1">여행지</p>
                  <p>{trip.destination || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">여행 기간</p>
                  <p>
                    {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">전체 일정</p>
                  <p>
                    {trip.daysCount ?? 0}일 / {trip.totalItineraryItemsCount ?? 0}개
                  </p>
                </div>
              </div>
            </div>

            {/* 전체 일정 패널 (간단 버전) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">전체 일정</h2>
                <p className="mt-1 text-sm text-gray-500">
                  하루씩 펼쳐보면서, 각 일정 항목을 간단히 확인할 수 있습니다.
                </p>
              </div>

              {sortedDays.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500 text-sm">
                  아직 저장된 일차/일정 정보가 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {sortedDays.map((day) => {
                    const items = (day.itineraryItems || []).slice().sort((a, b) => {
                      if (a.orderSequence && b.orderSequence) {
                        return a.orderSequence - b.orderSequence;
                      }
                      return 0;
                    });

                    return (
                      <div key={day.id} className="px-6 py-5">
                        <div className="flex items-baseline justify-between mb-3">
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">
                              {day.dayNumber}일차{' '}
                              <span className="ml-2 text-sm text-gray-500">
                                {formatDate(day.date)}
                              </span>
                            </h3>
                            {(day.dayStartTime || day.dayEndTime) && (
                              <p className="text-sm text-gray-500 mt-1">
                                {day.dayStartTime && `시작 ${formatTime(day.dayStartTime)}`}
                                {day.dayStartTime && day.dayEndTime && ' · '}
                                {day.dayEndTime && `종료 ${formatTime(day.dayEndTime)}`}
                              </p>
                            )}
                          </div>
                        </div>

                        {items.length === 0 ? (
                          <p className="text-sm text-gray-500">등록된 일정이 없습니다.</p>
                        ) : (
                          <ol className="space-y-3">
                            {items.map((item) => (
                              <li
                                key={item.id}
                                className="border border-gray-200 rounded-md px-4 py-3 bg-gray-50"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-gray-500">
                                    #{item.orderSequence}
                                  </span>
                                  {(item.startTime || item.endTime) && (
                                    <span className="text-xs text-gray-500">
                                      {item.startTime && formatTime(item.startTime)} ~{' '}
                                      {item.endTime && formatTime(item.endTime)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {item.title}
                                </p>
                                {item.locationName && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    {item.locationName}
                                  </p>
                                )}
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripDetailPage;


