import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateTravelPreferences, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const travelTypes = [
    { value: 'relaxation', label: '휴양형', description: '편안하고 여유로운 여행' },
    { value: 'activity', label: '액티비티형', description: '다양한 활동과 체험' },
    { value: 'culture', label: '문화탐방형', description: '역사와 문화를 탐방' },
    { value: 'nature', label: '자연탐방형', description: '자연과 풍경을 즐기는 여행' }
  ];

  const budgetOptions = [
    { value: 'low', label: '저예산', description: '50만원 이하' },
    { value: 'medium', label: '중간', description: '50-100만원' },
    { value: 'high', label: '고급', description: '100만원 이상' }
  ];

  const durationOptions = [
    { value: '1-2', label: '1-2일', description: '당일치기, 1박2일' },
    { value: '3-4', label: '3-4일', description: '2박3일, 3박4일' },
    { value: '5-7', label: '5-7일', description: '4박5일, 5박6일' },
    { value: '7+', label: '1주일 이상', description: '장기 여행' }
  ];

  const companionOptions = [
    { value: 'solo', label: '혼자' },
    { value: 'couple', label: '커플' },
    { value: 'family', label: '가족' },
    { value: 'friends', label: '친구' },
    { value: 'colleagues', label: '동료' }
  ];

  const interestOptions = [
    { value: 'sightseeing', label: '관광' },
    { value: 'shopping', label: '쇼핑' },
    { value: 'food', label: '맛집' },
    { value: 'activity', label: '액티비티' },
    { value: 'healing', label: '힐링' },
    { value: 'culture', label: '문화' }
  ];

  useEffect(() => {
    // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handlePreferenceChange = (category, value) => {
    if (category === 'companions' || category === 'interests') {
      const currentValues = user?.travelPreferences?.[category] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(item => item !== value)
        : [...currentValues, value];
      
      updateTravelPreferences({ [category]: newValues });
    } else {
      updateTravelPreferences({ [category]: value });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: 실제 API 호출로 사용자 데이터 저장
      // 현재는 Context에서 자동으로 localStorage에 저장됨
      
      // 임시로 1초 후 저장 완료
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSaving(false);
      setIsEditing(false);
      alert('프로필이 저장되었습니다!');
    } catch (error) {
      console.error('프로필 저장 실패:', error);
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">프로필 관리</h1>
              <div className="flex space-x-3">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
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
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
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

          {/* 기본 정보 */}
          <div className="px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-indigo-600">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{user?.name || '사용자'}</h2>
                <p className="text-gray-600">{user?.email || 'user@example.com'}</p>
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
            {/* 여행 유형 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                여행 유형
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {travelTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                      user?.travelPreferences?.type === type.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300 hover:border-gray-400'
                    } ${!isEditing ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <input
                      type="radio"
                      name="travelType"
                      value={type.value}
                      checked={user?.travelPreferences?.type === type.value}
                      onChange={(e) => handlePreferenceChange('type', e.target.value)}
                      disabled={!isEditing}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{type.label}</div>
                      <div className="text-sm text-gray-600">{type.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 예산 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                예산
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {budgetOptions.map((budget) => (
                  <label
                    key={budget.value}
                    className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                      user?.travelPreferences?.budget === budget.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300 hover:border-gray-400'
                    } ${!isEditing ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <input
                      type="radio"
                      name="budget"
                      value={budget.value}
                      checked={user?.travelPreferences?.budget === budget.value}
                      onChange={(e) => handlePreferenceChange('budget', e.target.value)}
                      disabled={!isEditing}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{budget.label}</div>
                      <div className="text-sm text-gray-600">{budget.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 여행 기간 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                여행 기간
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {durationOptions.map((duration) => (
                  <label
                    key={duration.value}
                    className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                      user?.travelPreferences?.duration === duration.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300 hover:border-gray-400'
                    } ${!isEditing ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <input
                      type="radio"
                      name="duration"
                      value={duration.value}
                      checked={user?.travelPreferences?.duration === duration.value}
                      onChange={(e) => handlePreferenceChange('duration', e.target.value)}
                      disabled={!isEditing}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{duration.label}</div>
                      <div className="text-sm text-gray-600">{duration.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 동행자 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                동행자 (복수 선택 가능)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {companionOptions.map((companion) => (
                  <label
                    key={companion.value}
                    className={`relative flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      user?.travelPreferences?.companions?.includes(companion.value)
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-300 hover:border-gray-400'
                    } ${!isEditing ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <input
                      type="checkbox"
                      value={companion.value}
                      checked={user?.travelPreferences?.companions?.includes(companion.value)}
                      onChange={(e) => handlePreferenceChange('companions', e.target.value)}
                      disabled={!isEditing}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">{companion.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 관심사 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                관심사 (복수 선택 가능)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {interestOptions.map((interest) => (
                  <label
                    key={interest.value}
                    className={`relative flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      user?.travelPreferences?.interests?.includes(interest.value)
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-300 hover:border-gray-400'
                    } ${!isEditing ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <input
                      type="checkbox"
                      value={interest.value}
                      checked={user?.travelPreferences?.interests?.includes(interest.value)}
                      onChange={(e) => handlePreferenceChange('interests', e.target.value)}
                      disabled={!isEditing}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">{interest.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 여행 계획하기 버튼 */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/trip-plan')}
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            맞춤형 여행 계획하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
