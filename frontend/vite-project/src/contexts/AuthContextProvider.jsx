import React, { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 앱 시작 시 저장된 사용자 정보 로드
    const loadUser = () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (userData) => {
    try {
      // TODO: 실제 OAuth 로그인 API 호출
      // 임시로 사용자 데이터를 저장
      const userInfo = {
        id: Date.now().toString(),
        name: userData.name || '사용자',
        email: userData.email || 'user@example.com',
        profileImage: userData.profileImage || null,
        provider: userData.provider || 'google', // google, kakao, naver
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

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

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

  const isAuthenticated = () => {
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
