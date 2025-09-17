/**
 * useAuth 커스텀 훅
 * - AuthContext의 값들을 쉽게 사용할 수 있도록 하는 커스텀 훅
 * - Context Provider 범위 밖에서 사용 시 에러를 발생시켜 안전성 보장
 * - 인증 관련 상태와 함수들을 반환
 */

// React의 useContext 훅 import
import { useContext } from 'react';

// AuthContext import
import { AuthContext } from '../contexts/AuthContext';

/**
 * useAuth 커스텀 훅
 * - AuthContext의 값들을 반환
 * - Provider 범위 밖에서 사용 시 에러 발생
 * 
 * @returns {Object} AuthContext의 값들 (user, login, logout, updateUser 등)
 * @throws {Error} AuthProvider 범위 밖에서 사용 시 에러 발생
 */
export const useAuth = () => {
  // AuthContext에서 값들을 가져옴
  const context = useContext(AuthContext);
  
  // Context가 없으면 (Provider 범위 밖에서 사용) 에러 발생
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  // Context 값들을 반환
  return context;
};
