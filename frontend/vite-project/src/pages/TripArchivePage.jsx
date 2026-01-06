/**
 * TripArchivePage 컴포넌트
 * - 여행 후 기록 아카이브 페이지
 * - 완료된 여행의 사진, 일정, 경비, 피드백을 종합적으로 관리
 * - 백엔드 엔티티: Trip, TripFeedback, UserPreferences, TripDay, TripItineraryItem 참조
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TripArchivePage = () => {
  const navigate = useNavigate();
  
  // 현재 선택된 탭 상태
  const [activeTab, setActiveTab] = useState('overview');
  
  // 모달 상태
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // 하드코딩된 예시 데이터 (실제로는 API에서 가져올 데이터)
  const mockTripData = {
    id: 1,
    title: "2024 파리 로맨틱 여행",
    destination: "파리, 프랑스",
    startDate: "2024-03-15",
    endDate: "2024-03-22",
    numAdults: 2,
    numChildren: 0,
    totalBudget: 2500000,
    status: "completed",
    createdAt: "2024-03-01T10:00:00",
    updatedAt: "2024-03-22T18:00:00",
    
    // 여행 일정 데이터 (TripDay, TripItineraryItem 참조)
    tripDays: [
      {
        id: 1,
        dayNumber: 1,
        date: "2024-03-15",
        itineraryItems: [
          {
            id: 1,
            time: "09:00",
            title: "인천공항 출발",
            description: "KE901 편으로 파리 CDG 공항 도착 예정",
            location: "인천국제공항",
            category: "transportation",
            estimatedCost: 0
          },
          {
            id: 2,
            time: "15:30",
            title: "파리 CDG 공항 도착",
            description: "공항에서 시내로 이동",
            location: "파리 CDG 공항",
            category: "transportation",
            estimatedCost: 50000
          },
          {
            id: 3,
            time: "18:00",
            title: "호텔 체크인",
            description: "Hotel des Grands Boulevards",
            location: "파리 2구",
            category: "accommodation",
            estimatedCost: 150000
          },
          {
            id: 4,
            time: "20:00",
            title: "저녁 식사",
            description: "근처 프랑스 레스토랑에서 첫 식사",
            location: "파리 2구",
            category: "dining",
            estimatedCost: 80000
          }
        ]
      },
      {
        id: 2,
        dayNumber: 2,
        date: "2024-03-16",
        itineraryItems: [
          {
            id: 5,
            time: "09:00",
            title: "에펠탑 방문",
            description: "파리의 상징 에펠탑 전망대",
            location: "에펠탑",
            category: "sightseeing",
            estimatedCost: 30000
          },
          {
            id: 6,
            time: "12:00",
            title: "점심 식사",
            description: "에펠탑 근처 카페",
            location: "파리 7구",
            category: "dining",
            estimatedCost: 50000
          },
          {
            id: 7,
            time: "14:00",
            title: "루브르 박물관",
            description: "모나리자와 베누스 상 감상",
            location: "루브르 박물관",
            category: "culture",
            estimatedCost: 20000
          },
          {
            id: 8,
            time: "19:00",
            title: "세느강 크루즈",
            description: "파리 야경을 즐기는 저녁 크루즈",
            location: "세느강",
            category: "activity",
            estimatedCost: 60000
          }
        ]
      },
      {
        id: 3,
        dayNumber: 3,
        date: "2024-03-17",
        itineraryItems: [
          {
            id: 9,
            time: "10:00",
            title: "베르사유 궁전",
            description: "루이 14세의 화려한 궁전 투어",
            location: "베르사유",
            category: "culture",
            estimatedCost: 40000
          },
          {
            id: 10,
            time: "15:00",
            title: "베르사유 정원 산책",
            description: "아름다운 프랑스 정원 탐방",
            location: "베르사유 궁전",
            category: "sightseeing",
            estimatedCost: 0
          },
          {
            id: 11,
            time: "18:00",
            title: "파리 시내 복귀",
            description: "RER C선으로 파리 시내 복귀",
            location: "파리 시내",
            category: "transportation",
            estimatedCost: 15000
          }
        ]
      }
    ],
    
    // 실제 경비 데이터 (사용자가 입력한 실제 비용)
    actualExpenses: {
      accommodation: 1050000, // 7박 호텔
      transportation: 180000, // 항공료 + 교통비
      dining: 420000, // 식비
      activities: 350000, // 관광지 입장료 + 액티비티
      shopping: 500000, // 쇼핑
      total: 2500000
    },
    
    // 여행 사진 데이터 (실제로는 파일 업로드 시스템)
    photos: [
      {
        id: 1,
        url: "/api/photos/paris-1.jpg",
        caption: "에펠탑에서 찍은 첫 사진",
        date: "2024-03-16",
        location: "에펠탑",
        tags: ["landmark", "couple", "sunset"]
      },
      {
        id: 2,
        url: "/api/photos/paris-2.jpg",
        caption: "루브르 박물관에서",
        date: "2024-03-16",
        location: "루브르 박물관",
        tags: ["museum", "art", "culture"]
      },
      {
        id: 3,
        url: "/api/photos/paris-3.jpg",
        caption: "세느강 크루즈",
        date: "2024-03-16",
        location: "세느강",
        tags: ["cruise", "night", "romantic"]
      },
      {
        id: 4,
        url: "/api/photos/paris-4.jpg",
        caption: "베르사유 궁전 정원",
        date: "2024-03-17",
        location: "베르사유",
        tags: ["palace", "garden", "history"]
      }
    ],
    
    // 여행 피드백 데이터 (TripFeedback 엔티티 참조)
    feedback: {
      id: 1,
      overallRating: 5,
      feedbackText: "정말 완벽한 여행이었습니다! 에펠탑의 야경과 베르사유 궁전의 화려함이 특히 인상적이었어요. 다음에도 파리를 방문하고 싶습니다.",
      satisfactionAreas: {
        "숙소": 5,
        "교통": 4,
        "음식": 5,
        "관광지": 5,
        "일정": 4
      },
      createdAt: "2024-03-23T14:30:00"
    },
    
    // 사용자 취향 데이터 (UserPreferences 엔티티 참조)
    userPreferences: {
      travelStyle: "문화",
      budgetRangeMin: 2000000,
      budgetRangeMax: 3000000,
      preferredAccommodationType: "호텔",
      preferredTransportation: "대중교통"
    }
  };

  // 탭별 렌더링 함수들
  const renderOverview = () => (
    <div className="space-y-6">
      {/* 여행 기본 정보 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{mockTripData.title}</h2>
            <p className="text-gray-600">{mockTripData.destination}</p>
            <p className="text-sm text-gray-500">
              {mockTripData.startDate} ~ {mockTripData.endDate} ({mockTripData.tripDays.length}박 {mockTripData.tripDays.length + 1}일)
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {mockTripData.actualExpenses.total.toLocaleString()}원
            </div>
            <div className="text-sm text-gray-500">총 경비</div>
          </div>
        </div>
        
        {/* 여행 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{mockTripData.tripDays.length}</div>
            <div className="text-sm text-gray-600">여행 일수</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{mockTripData.photos.length}</div>
            <div className="text-sm text-gray-600">촬영 사진</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{mockTripData.feedback.overallRating}</div>
            <div className="text-sm text-gray-600">만족도</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {mockTripData.numAdults + mockTripData.numChildren}
            </div>
            <div className="text-sm text-gray-600">여행 인원</div>
          </div>
        </div>
      </div>

      {/* 최근 사진 미리보기 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">여행 사진</h3>
          <button 
            onClick={() => setActiveTab('photos')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            전체 보기
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {mockTripData.photos.slice(0, 4).map((photo) => (
            <div 
              key={photo.id}
              className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => {
                setSelectedPhoto(photo);
                setShowPhotoModal(true);
              }}
            >
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 만족도 요약 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">여행 만족도</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">전체 만족도</span>
            <div className="flex items-center space-x-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${i < mockTripData.feedback.overallRating ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-lg font-semibold text-gray-900">{mockTripData.feedback.overallRating}/5</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {Object.entries(mockTripData.feedback.satisfactionAreas).map(([area, rating]) => (
              <div key={area} className="flex items-center justify-between">
                <span className="text-gray-700">{area}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(rating / 5) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{rating}/5</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderItinerary = () => (
    <div className="space-y-6">
      {mockTripData.tripDays.map((day) => (
        <div key={day.id} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Day {day.dayNumber}</h3>
            <span className="text-sm text-gray-500">{day.date}</span>
          </div>
          
          <div className="space-y-4">
            {day.itineraryItems.map((item) => (
              <div key={item.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex-shrink-0 w-16 text-center">
                  <div className="text-sm font-medium text-blue-600">{item.time}</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                    <span className="text-sm text-gray-500">{item.location}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.category === 'transportation' ? 'bg-blue-100 text-blue-800' :
                      item.category === 'accommodation' ? 'bg-green-100 text-green-800' :
                      item.category === 'dining' ? 'bg-orange-100 text-orange-800' :
                      item.category === 'sightseeing' ? 'bg-purple-100 text-purple-800' :
                      item.category === 'culture' ? 'bg-pink-100 text-pink-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.category === 'transportation' ? '교통' :
                       item.category === 'accommodation' ? '숙소' :
                       item.category === 'dining' ? '식사' :
                       item.category === 'sightseeing' ? '관광' :
                       item.category === 'culture' ? '문화' :
                       item.category === 'activity' ? '액티비티' : item.category}
                    </span>
                    {item.estimatedCost > 0 && (
                      <span className="text-sm font-medium text-gray-900">
                        {item.estimatedCost.toLocaleString()}원
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderPhotos = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">여행 사진 갤러리</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mockTripData.photos.map((photo) => (
            <div 
              key={photo.id}
              className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => {
                setSelectedPhoto(photo);
                setShowPhotoModal(true);
              }}
            >
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                <p className="text-white text-sm font-medium truncate">{photo.caption}</p>
                <p className="text-white text-xs opacity-75">{photo.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderExpenses = () => (
    <div className="space-y-6">
      {/* 예산 vs 실제 경비 비교 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">예산 vs 실제 경비</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">계획 예산</span>
            <span className="text-lg font-semibold text-gray-900">
              {mockTripData.totalBudget.toLocaleString()}원
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">실제 경비</span>
            <span className="text-lg font-semibold text-blue-600">
              {mockTripData.actualExpenses.total.toLocaleString()}원
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">차이</span>
            <span className={`text-lg font-semibold ${
              mockTripData.actualExpenses.total <= mockTripData.totalBudget 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {mockTripData.actualExpenses.total <= mockTripData.totalBudget ? '-' : '+'}
              {Math.abs(mockTripData.actualExpenses.total - mockTripData.totalBudget).toLocaleString()}원
            </span>
          </div>
        </div>
      </div>

      {/* 경비 세부 내역 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">경비 세부 내역</h3>
        <div className="space-y-4">
          {Object.entries(mockTripData.actualExpenses).filter(([key]) => key !== 'total').map(([category, amount]) => (
            <div key={category} className="flex items-center justify-between">
              <span className="text-gray-700">
                {category === 'accommodation' ? '숙박비' :
                 category === 'transportation' ? '교통비' :
                 category === 'dining' ? '식비' :
                 category === 'activities' ? '액티비티' :
                 category === 'shopping' ? '쇼핑' : category}
              </span>
              <div className="flex items-center space-x-4">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(amount / mockTripData.actualExpenses.total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-20 text-right">
                  {amount.toLocaleString()}원
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFeedback = () => (
    <div className="space-y-6">
      {/* 기존 피드백 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">여행 피드백</h3>
          <button 
            onClick={() => setShowFeedbackModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            피드백 수정
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-gray-700">전체 만족도</span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-5 h-5 ${i < mockTripData.feedback.overallRating ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-lg font-semibold text-gray-900">{mockTripData.feedback.overallRating}/5</span>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700">{mockTripData.feedback.feedbackText}</p>
          </div>
          
          <div className="text-sm text-gray-500">
            작성일: {new Date(mockTripData.feedback.createdAt).toLocaleDateString('ko-KR')}
          </div>
        </div>
      </div>

      {/* 세부 만족도 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">세부 만족도</h3>
        <div className="space-y-4">
          {Object.entries(mockTripData.feedback.satisfactionAreas).map(([area, rating]) => (
            <div key={area} className="flex items-center justify-between">
              <span className="text-gray-700">{area}</span>
              <div className="flex items-center space-x-3">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-900">{rating}/5</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">여행 기록 아카이브</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                공유하기
              </button>
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                PDF 다운로드
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', name: '개요', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z' },
                { id: 'itinerary', name: '일정', icon: 'M8 7V3m8 4V3m-9 8h.01M16 14h.01M12 14h.01M16 18h.01M12 18h.01M16 22h.01M12 22h.01M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                { id: 'photos', name: '사진', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
                { id: 'expenses', name: '경비', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' },
                { id: 'feedback', name: '피드백', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                    </svg>
                    <span>{tab.name}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="bg-white rounded-lg shadow-md">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'itinerary' && renderItinerary()}
          {activeTab === 'photos' && renderPhotos()}
          {activeTab === 'expenses' && renderExpenses()}
          {activeTab === 'feedback' && renderFeedback()}
        </div>
      </div>

      {/* 사진 모달 */}
      {showPhotoModal && selectedPhoto && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="max-w-4xl max-h-full p-4">
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="relative">
                <button
                  onClick={() => setShowPhotoModal(false)}
                  className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedPhoto.caption}</h3>
                  <p className="text-sm text-gray-600 mb-2">{selectedPhoto.location} • {selectedPhoto.date}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPhoto.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 피드백 수정 모달 */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">피드백 수정</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">전체 만족도</label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      className={`w-8 h-8 rounded-full ${
                        rating <= mockTripData.feedback.overallRating
                          ? 'bg-yellow-400 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">피드백 내용</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  defaultValue={mockTripData.feedback.feedbackText}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                취소
              </button>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripArchivePage;
