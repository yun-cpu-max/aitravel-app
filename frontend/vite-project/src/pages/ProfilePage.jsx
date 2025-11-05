/**
 * ProfilePage 컴포넌트
 * - 사용자 프로필 관리 페이지
 * - 사용자 기본 정보 및 여행 취향 설정 기능 제공
 * - 백엔드 User, UserPreferences 엔티티와 연동
 * - 프로필 사진 업로드, 개인정보 수정, 여행 취향 설정 기능
 */

// React 기본 훅들 import
import React, { useState, useEffect } from 'react';

// React Router DOM import (라우팅 관련)
import { useNavigate } from 'react-router-dom';

// 인증 관련 커스텀 훅 import
import { useAuth } from '../hooks/useAuth';

/**
 * ProfilePage 컴포넌트
 * - 사용자의 프로필 정보와 여행 취향을 관리
 * - 편집 모드와 보기 모드를 전환할 수 있음
 * 
 * @returns {JSX.Element} 렌더링된 ProfilePage 컴포넌트
 */
const ProfilePage = () => {
  // 페이지 네비게이션을 위한 훅
  const navigate = useNavigate();
  
  // 인증 관련 상태와 함수들을 가져옴
  const { user, logout, updateUser } = useAuth();
  
  // 편집 모드 상태를 관리하는 state
  const [isEditing, setIsEditing] = useState(false);
  
  // 저장 중 상태를 관리하는 state
  const [isSaving, setIsSaving] = useState(false);
  
  // 사용자 기본 정보 상태 관리
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    profileImageUrl: ''
  });
  
  // 여행 취향 상태 관리 (백엔드 UserPreferences 엔티티 기반)
  const [travelPreferences, setTravelPreferences] = useState({
    travelStyle: '',
    budgetRangeMin: '',
    budgetRangeMax: '',
    preferredAccommodationType: '',
    preferredTransportation: ''
  });
  
  // 프로필 사진 업로드 상태 관리
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  // 백엔드 UserPreferences 엔티티 기반 여행 스타일 옵션
  const travelStyleOptions = [
    { value: '휴양', label: '휴양형', description: '편안하고 여유로운 여행', icon: '🏖️' },
    { value: '액티비티', label: '액티비티형', description: '다양한 활동과 체험', icon: '🏃‍♂️' },
    { value: '문화', label: '문화탐방형', description: '역사와 문화를 탐방', icon: '🏛️' },
    { value: '미식', label: '미식여행형', description: '맛집과 음식을 중심으로', icon: '🍽️' }
  ];

  // 예산 범위 옵션 (백엔드 budget_range_min/max와 연동)
  const budgetRangeOptions = [
    { value: '0-500000', label: '50만원 이하', min: 0, max: 500000 },
    { value: '500000-1000000', label: '50-100만원', min: 500000, max: 1000000 },
    { value: '1000000-2000000', label: '100-200만원', min: 1000000, max: 2000000 },
    { value: '2000000-5000000', label: '200-500만원', min: 2000000, max: 5000000 },
    { value: '5000000+', label: '500만원 이상', min: 5000000, max: null }
  ];

  // 선호 숙소 타입 옵션
  const accommodationOptions = [
    { value: '호텔', label: '호텔', description: '편안하고 안전한 숙박', icon: '🏨' },
    { value: '게스트하우스', label: '게스트하우스', description: '경제적이고 친근한 분위기', icon: '🏠' },
    { value: '에어비앤비', label: '에어비앤비', description: '현지인처럼 생활하기', icon: '🏡' },
    { value: '펜션', label: '펜션', description: '자연 속에서 휴식', icon: '🌲' },
    { value: '리조트', label: '리조트', description: '고급스러운 휴양', icon: '🏖️' },
    { value: '호스텔', label: '호스텔', description: '경제적이고 사회적인', icon: '🛏️' }
  ];

  // 선호 교통수단 옵션
  const transportationOptions = [
    { value: '대중교통', label: '대중교통', description: '지하철, 버스 등', icon: '🚇' },
    { value: '렌터카', label: '렌터카', description: '자유로운 이동', icon: '🚗' },
    { value: '도보', label: '도보', description: '걸어서 탐방', icon: '🚶‍♂️' },
    { value: '자전거', label: '자전거', description: '친환경적 이동', icon: '🚴‍♂️' },
    { value: '택시', label: '택시', description: '편리한 이동', icon: '🚕' },
    { value: '기타', label: '기타', description: '기타 교통수단', icon: '🚌' }
  ];

  // 사용자 정보 초기화
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!user?.id) return;
      
      try {
        console.log('사용자 취향 로드 시작:', { userId: user.id });
        
        const response = await fetch(`http://localhost:8081/api/users/${user.id}/preferences`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('취향 로드 응답:', response.status, response.statusText);
        
        if (response.ok) {
          const data = await response.json();
          console.log('로드된 취향 정보:', data);
          setTravelPreferences({
            travelStyle: data.travelStyle || '',
            budgetRangeMin: data.budgetRangeMin || '',
            budgetRangeMax: data.budgetRangeMax || '',
            preferredAccommodationType: data.preferredAccommodationType || '',
            preferredTransportation: data.preferredTransportation || ''
          });
        } else {
          const errorText = await response.text();
          console.error('취향 로드 실패:', errorText);
        }
      } catch (error) {
        console.error('사용자 취향 로드 실패:', error);
      }
    };

    if (user) {
      console.log('사용자 정보 설정:', user);
      
      setUserInfo({
        name: user.name || '',
        email: user.email || '',
        profileImageUrl: user.profileImageUrl || ''
      });
      
      // 프로필 사진 미리보기 설정
      if (user.profileImageUrl) {
        setProfileImagePreview(user.profileImageUrl);
      }
      
      // 백엔드에서 사용자 취향 정보 로드
      loadUserPreferences();
    } else {
      // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
      navigate('/login');
    }
  }, [user, navigate]);

  /**
   * 사용자 기본 정보 변경 핸들러
   * - 이름, 이메일 등 기본 정보를 업데이트
   *
   * @param {string} field - 변경할 필드명
   * @param {string} value - 새로운 값
   */
  const handleUserInfoChange = (field, value) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * 여행 취향 변경 핸들러
   * - 백엔드 UserPreferences 엔티티와 연동
   *
   * @param {string} field - 변경할 필드명
   * @param {string} value - 새로운 값
   */
  const handleTravelPreferenceChange = (field, value) => {
    setTravelPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * 예산 범위 변경 핸들러
   * - budget_range_min/max를 개별적으로 설정
   *
   * @param {string} field - 'min' 또는 'max'
   * @param {number} value - 예산 값
   */
  const handleBudgetRangeChange = (field, value) => {
    setTravelPreferences(prev => ({
      ...prev,
      [`budgetRange${field.charAt(0).toUpperCase() + field.slice(1)}`]: value
    }));
  };

  /**
   * 프로필 사진 업로드 핸들러
   * - 파일 선택 시 미리보기 설정
   *
   * @param {Event} event - 파일 입력 이벤트
   */
  const handleProfileImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // 미리보기 URL 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * 프로필 사진 제거 핸들러
   * - 선택된 프로필 사진을 제거
   */
  const handleRemoveProfileImage = () => {
    setProfileImagePreview(null);
  };

  /**
   * 프로필 저장 핸들러
   * - 사용자 기본 정보와 여행 취향을 저장
   * - 프로필 사진 업로드 처리
   */
  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('사용자 정보 저장 시작:', { userId: user.id, userInfo });
      
      // 1. 사용자 기본 정보 업데이트
      const userResponse = await fetch(`http://localhost:8081/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: userInfo.name,
          email: userInfo.email
        })
      });

      console.log('사용자 정보 저장 응답:', userResponse.status, userResponse.statusText);

      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error('사용자 정보 저장 실패:', errorText);
        console.error('요청 데이터:', { name: userInfo.name, email: userInfo.email });
        throw new Error(`사용자 정보 저장에 실패했습니다. (${userResponse.status}): ${errorText}`);
      }

      const updatedUser = await userResponse.json();
      console.log('업데이트된 사용자 정보:', updatedUser);
      
      // 2. 여행 취향 정보를 백엔드에 저장
      console.log('취향 정보 저장 시작:', travelPreferences);
      
      const preferencesResponse = await fetch(`http://localhost:8081/api/users/${user.id}/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          travelStyle: travelPreferences.travelStyle,
          budgetRangeMin: travelPreferences.budgetRangeMin ? parseInt(travelPreferences.budgetRangeMin) : null,
          budgetRangeMax: travelPreferences.budgetRangeMax ? parseInt(travelPreferences.budgetRangeMax) : null,
          preferredAccommodationType: travelPreferences.preferredAccommodationType,
          preferredTransportation: travelPreferences.preferredTransportation
        })
      });

      console.log('취향 정보 저장 응답:', preferencesResponse.status, preferencesResponse.statusText);

      if (preferencesResponse.ok) {
        const preferencesData = await preferencesResponse.json();
        console.log('저장된 취향 정보:', preferencesData);
        setTravelPreferences(preferencesData);
        
        // 3. 사용자 정보 업데이트 (생성일/수정일 포함)
        setUserInfo({
          name: updatedUser.name,
          email: updatedUser.email,
          profileImageUrl: updatedUser.profileImageUrl || ''
        });
        
        // 4. 사용자 정보를 localStorage와 Context에도 업데이트
        const updatedUserInfo = {
          ...user,
          name: updatedUser.name,
          email: updatedUser.email,
          profileImageUrl: updatedUser.profileImageUrl || user.profileImageUrl,
          updatedAt: updatedUser.updatedAt,
          createdAt: updatedUser.createdAt
        };
        
        // Context 업데이트
        updateUser(updatedUserInfo);
        
        setIsSaving(false);
        setIsEditing(false);
        alert('프로필이 저장되었습니다!');
      } else {
        const errorText = await preferencesResponse.text();
        console.error('취향 저장 실패:', errorText);
        throw new Error(`취향 저장에 실패했습니다. (${preferencesResponse.status})`);
      }
    } catch (error) {
      console.error('프로필 저장 실패:', error);
      setIsSaving(false);
      alert(`프로필 저장에 실패했습니다: ${error.message}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">프로필 관리</h1>
              <div className="flex space-x-3">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    편집
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isSaving ? '저장 중...' : '저장'}
                    </button>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>

          {/* 기본 정보 섹션 */}
          <div className="px-6 py-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>
            <div className="flex items-start space-x-6">
              {/* 프로필 사진 */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                    {profileImagePreview ? (
                      <img
                        src={profileImagePreview}
                        alt="프로필 사진"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-gray-400">
                        {userInfo.name?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  {isEditing && (
                    <div className="absolute -bottom-2 -right-2">
                      <label className="bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfileImageChange}
                          className="hidden"
                        />
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </label>
                    </div>
                  )}
                  {isEditing && profileImagePreview && (
                    <button
                      onClick={handleRemoveProfileImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* 사용자 정보 입력 폼 */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이름
                    </label>
                    <input
                      type="text"
                      value={userInfo.name}
                      onChange={(e) => handleUserInfoChange('name', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이메일
                    </label>
                    <input
                      type="email"
                      value={userInfo.email}
                      onChange={(e) => handleUserInfoChange('email', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
                
                {/* 계정 생성일 정보 (읽기 전용) */}
                <div className="text-sm text-gray-500">
                  <p>계정 생성일: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '정보 없음'}</p>
                  <p>마지막 수정일: {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString('ko-KR') : '정보 없음'}</p>
                  
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 여행 취향 설정 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">여행 취향 설정</h3>
            <p className="text-sm text-gray-600 mt-1">
              설정한 취향에 따라 맞춤형 여행 계획을 제공합니다
            </p>
          </div>

          <div className="px-6 py-6 space-y-8">
            {/* 여행 스타일 (백엔드 UserPreferences.travel_style) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                여행 스타일
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {travelStyleOptions.map((style) => (
                  <label
                    key={style.value}
                    className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                      travelPreferences.travelStyle === style.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    } ${!isEditing ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <input
                      type="radio"
                      name="travelStyle"
                      value={style.value}
                      checked={travelPreferences.travelStyle === style.value}
                      onChange={(e) => handleTravelPreferenceChange('travelStyle', e.target.value)}
                      disabled={!isEditing}
                      className="sr-only"
                    />
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{style.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{style.label}</div>
                        <div className="text-sm text-gray-600">{style.description}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 예산 범위 (백엔드 UserPreferences.budget_range_min/max) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                선호 예산 범위
              </label>
              <div className="space-y-4">
                {/* 예산 범위 선택 */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {budgetRangeOptions.map((range) => (
                    <label
                      key={range.value}
                      className={`relative flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        travelPreferences.budgetRangeMin === range.min && 
                        travelPreferences.budgetRangeMax === range.max
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      } ${!isEditing ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <input
                        type="radio"
                        name="budgetRange"
                        value={range.value}
                        checked={travelPreferences.budgetRangeMin === range.min && 
                                travelPreferences.budgetRangeMax === range.max}
                        onChange={() => {
                          handleBudgetRangeChange('min', range.min);
                          handleBudgetRangeChange('max', range.max);
                        }}
                        disabled={!isEditing}
                        className="sr-only"
                      />
                      <div className="font-medium text-gray-900 text-center">{range.label}</div>
                    </label>
                  ))}
                </div>
                
                {/* 커스텀 예산 범위 입력 */}
                {isEditing && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-3">또는 직접 입력하세요</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          최소 예산 (원)
                        </label>
                        <input
                          type="number"
                          value={travelPreferences.budgetRangeMin || ''}
                          onChange={(e) => handleBudgetRangeChange('min', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          최대 예산 (원)
                        </label>
                        <input
                          type="number"
                          value={travelPreferences.budgetRangeMax || ''}
                          onChange={(e) => handleBudgetRangeChange('max', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="1000000"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 선호 숙소 타입 (백엔드 UserPreferences.preferred_accommodation_type) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                선호 숙소 타입
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {accommodationOptions.map((accommodation) => (
                  <label
                    key={accommodation.value}
                    className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                      travelPreferences.preferredAccommodationType === accommodation.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    } ${!isEditing ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <input
                      type="radio"
                      name="accommodationType"
                      value={accommodation.value}
                      checked={travelPreferences.preferredAccommodationType === accommodation.value}
                      onChange={(e) => handleTravelPreferenceChange('preferredAccommodationType', e.target.value)}
                      disabled={!isEditing}
                      className="sr-only"
                    />
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{accommodation.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{accommodation.label}</div>
                        <div className="text-sm text-gray-600">{accommodation.description}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 선호 교통수단 (백엔드 UserPreferences.preferred_transportation) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                선호 교통수단
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {transportationOptions.map((transportation) => (
                  <label
                    key={transportation.value}
                    className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                      travelPreferences.preferredTransportation === transportation.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    } ${!isEditing ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <input
                      type="radio"
                      name="transportation"
                      value={transportation.value}
                      checked={travelPreferences.preferredTransportation === transportation.value}
                      onChange={(e) => handleTravelPreferenceChange('preferredTransportation', e.target.value)}
                      disabled={!isEditing}
                      className="sr-only"
                    />
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{transportation.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{transportation.label}</div>
                        <div className="text-sm text-gray-600">{transportation.description}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/trip-plan')}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
          >
            맞춤형 여행 계획하기
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gray-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-700 transition-colors"
          >
            나의 여행 대시보드
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
