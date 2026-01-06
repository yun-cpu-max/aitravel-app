/**
 * ProfilePage 컴포넌트
 * - 사용자 프로필 관리 페이지
 * - 사용자 기본 정보 관리 기능 제공
 * - 백엔드 User 엔티티와 연동
 * - 프로필 사진 업로드, 개인정보 수정 기능
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
  const { user, isLoading, logout, updateUser } = useAuth();
  
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
  
  // 프로필 사진 업로드 상태 관리
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  // 사용자 정보 초기화
  useEffect(() => {
    // 로딩 중일 때는 아무것도 하지 않음
    if (isLoading) {
      return;
    }

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
    } else {
      // 로딩이 완료되었는데도 user가 없으면 로그인 페이지로 리다이렉트
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

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
   * - 사용자 기본 정보 저장
   * - 프로필 사진 업로드 처리
   */
  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('사용자 정보 저장 시작:', { userId: user.id, userInfo });
      
      // 사용자 기본 정보 업데이트
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
        throw new Error(`사용자 정보 저장에 실패했습니다. (${userResponse.status}): ${errorText}`);
      }

      const updatedUser = await userResponse.json();
      console.log('업데이트된 사용자 정보:', updatedUser);
      
      // 사용자 정보 업데이트 (생성일/수정일 포함)
      setUserInfo({
        name: updatedUser.name,
        email: updatedUser.email,
        profileImageUrl: updatedUser.profileImageUrl || ''
      });
      
      // 사용자 정보를 localStorage와 Context에도 업데이트
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

  // 로딩 중일 때 로딩 화면 표시
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

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

        {/* 액션 버튼들 */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/trip-plan-ex1')}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
          >
            여행 계획하기
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
