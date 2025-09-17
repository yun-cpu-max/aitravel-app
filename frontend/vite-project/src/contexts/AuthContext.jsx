/**
 * AuthContext
 * - 인증 관련 상태와 함수들을 전역으로 공유하기 위한 React Context
 * - 사용자 정보, 로그인/로그아웃 상태 등을 관리
 * - Context API를 사용하여 prop drilling을 방지
 */

// React의 createContext 함수를 import
import { createContext } from 'react';

/**
 * 인증 관련 Context 생성
 * - createContext(): React Context 객체를 생성
 * - 기본값은 undefined (Provider에서 value를 제공)
 * - 다른 컴포넌트에서 useContext(AuthContext)로 사용
 */
export const AuthContext = createContext();
