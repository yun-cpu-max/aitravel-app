/**
 * AuthContextProvider 컴포넌트
 * - 인증 관련 상태와 함수들을 관리하는 Context Provider
 * - 사용자 로그인/로그아웃, 사용자 정보 업데이트 등을 처리
 * - localStorage를 사용하여 사용자 정보를 영구 저장
 */

// React 기본 훅들 import
import React, { useState, useEffect } from 'react';

// AuthContext import
import { AuthContext } from './AuthContext';

/**
 * AuthProvider 컴포넌트
 * - 인증 관련 상태와 함수들을 Context로 제공
 * - 앱 전체에서 인증 상태를 공유할 수 있도록 함
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {React.ReactNode} props.children - Provider로 감쌀 자식 컴포넌트들
 * @returns {JSX.Element} 렌더링된 AuthProvider 컴포넌트
 */
export const AuthProvider = ({ children }) => {
  // 현재 로그인한 사용자 정보를 관리하는 state
  const [user, setUser] = useState(null);
  
  // 사용자 정보 로딩 상태를 관리하는 state
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 컴포넌트 마운트 시 실행되는 useEffect
   * - sessionStorage에 세션 마커를 두고, 없으면 "서버 재시작"으로 간주하여 로그인 초기화
   * - localStorage의 사용자 정보는 새로고침/탭 닫기-열기에도 유지
   */
  useEffect(() => {
    const initializeAuth = () => {
      try {
        // 세션 마커 확인: 없으면 서버가 새로 시작되었다고 간주
        const sessionMarker = sessionStorage.getItem('server_session_marker');
        if (!sessionMarker) {
          // 서버 재시작: 로그인 초기화
          localStorage.removeItem('user');
          sessionStorage.setItem('server_session_marker', String(Date.now()));
        }

        // 사용자 정보 복원 (브라우저 새로고침/탭 닫기-열기 시 유지)
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('인증 초기화 실패:', error);
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * 사용자 로그인 함수
   * - 현재는 데모용으로 localStorage에 사용자 정보를 저장
   * - 실제 서비스에서는 OAuth API를 호출해야 함
   * 
   * @param {Object} userData - 로그인할 사용자 데이터
   * @param {string} userData.name - 사용자 이름
   * @param {string} userData.email - 사용자 이메일
   * @param {string} userData.profileImage - 프로필 이미지 URL
   * @param {string} userData.provider - 로그인 제공자 (google, kakao, naver)
   * @returns {Promise<Object>} 로그인 결과 (success, user 또는 error)
   */
  const login = async (userData) => {
    try {
      // 실제 백엔드에서 받은 사용자 데이터 사용
      const userInfo = {
        id: userData.id || Date.now().toString(), // 백엔드에서 받은 실제 ID 사용
        name: userData.name || '사용자',
        email: userData.email || 'user@example.com',
        profileImage: userData.profileImage || userData.profileImageUrl || null,
        provider: userData.provider || 'local',
        providerId: userData.providerId || null,
        token: userData.token || null,
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: userData.updatedAt || new Date().toISOString(),
        loginTime: new Date().toISOString(),
        travelPreferences: {
          type: '',
          budget: '',
          duration: '',
          companions: [],
          interests: []
        }
      };

      setUser(userInfo);
      localStorage.setItem('user', JSON.stringify(userInfo));
      return { success: true, user: userInfo };
    } catch (error) {
      console.error('로그인 실패:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * 사용자 로그아웃 함수
   * - 사용자 상태를 초기화하고 localStorage에서 제거
   */
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  /**
   * 사용자 정보 업데이트 함수
   * - 기존 사용자 정보에 새로운 데이터를 병합
   * - state와 localStorage 모두 업데이트
   * 
   * @param {Object} updatedUserData - 업데이트할 사용자 데이터
   * @returns {Object} 업데이트 결과 (success, user 또는 error)
   */
  const updateUser = (updatedUserData) => {
    try {
      const updatedUser = { ...user, ...updatedUserData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('사용자 정보 업데이트 실패:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * 여행 취향 업데이트 함수
   * - 사용자의 여행 선호도를 업데이트
   * - 로그인 상태 확인 후 업데이트 수행
   * 
   * @param {Object} preferences - 업데이트할 여행 취향 데이터
   * @returns {Object} 업데이트 결과 (success, user 또는 error)
   */
  const updateTravelPreferences = (preferences) => {
    if (!user) return { success: false, error: '로그인이 필요합니다' };

    try {
      const updatedUser = {
        ...user,
        travelPreferences: { ...user.travelPreferences, ...preferences }
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('여행 취향 업데이트 실패:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * 사용자 인증 상태 확인 함수
   * - 현재 사용자가 로그인되어 있는지 확인
   * - 로딩 중일 때는 false를 반환하여 로그인 페이지로 리다이렉트 방지
   * 
   * @returns {boolean} 로그인 상태 (true: 로그인됨, false: 로그인 안됨)
   */
  const isAuthenticated = () => {
    // 로딩 중이면 false 반환 (로그인 페이지로 리다이렉트 방지)
    if (isLoading) {
      return false;
    }
    return user !== null;
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    updateUser,
    updateTravelPreferences,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
