/**
 * LoginPage 컴포넌트
 * - 사용자 로그인 페이지
 * - Google, Kakao, Naver 등 다양한 소셜 로그인 옵션 제공
 * - 현재는 데모용으로 구현되어 있음 (실제 OAuth 연동 필요)
 */

// React 기본 훅 import
import React, { useState } from 'react';

// React Router DOM import (라우팅 관련)
import { useNavigate } from 'react-router-dom';

// 인증 관련 커스텀 훅 import
import { useAuth } from '../hooks/useAuth';

/**
 * LoginPage 컴포넌트
 * - 소셜 로그인 버튼들을 제공하는 로그인 페이지
 * - 각 로그인 제공자별로 다른 처리 로직을 가짐
 * 
 * @returns {JSX.Element} 렌더링된 LoginPage 컴포넌트
 */
const LoginPage = () => {
  // 페이지 네비게이션을 위한 훅
  const navigate = useNavigate();
  
  // 인증 관련 함수들을 가져옴
  const { login } = useAuth();
  
  // 로딩 상태를 관리하는 state
  const [isLoading, setIsLoading] = useState(false);
  
  // 이메일/비밀번호 로그인 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  /**
   * 이메일/비밀번호 로그인 처리 함수
   */
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) return setError('이메일을 입력해주세요.');
    if (!password.trim()) return setError('비밀번호를 입력해주세요.');

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8081/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // 로그인 성공
        const result = await login({ 
          name: data.user.name, 
          email: data.user.email, 
          provider: 'local',
          token: data.token
        });
        if (result.success) navigate('/profile');
      } else {
        // 로그인 실패
        setError(data.message || '로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      setError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Google 로그인 처리 함수
   * - 현재는 데모용으로 2초 후 성공 처리
   * - 실제 서비스에서는 Google OAuth API 호출 필요
   */
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // TODO: 실제 Google OAuth 구현
      // 임시로 2초 후 로그인 성공으로 처리
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = await login({
        name: 'Google 사용자',
        email: 'user@gmail.com',
        provider: 'google'
      });
      
      if (result.success) {
        navigate('/profile');
      }
    } catch (error) {
      console.error('Google 로그인 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Kakao 로그인 처리 함수
   * - 현재는 데모용으로 2초 후 성공 처리
   * - 실제 서비스에서는 Kakao OAuth API 호출 필요
   */
  const handleKakaoLogin = async () => {
    setIsLoading(true);
    try {
      // TODO: 실제 Kakao OAuth 구현
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = await login({
        name: '카카오 사용자',
        email: 'user@kakao.com',
        provider: 'kakao'
      });
      
      if (result.success) {
        navigate('/profile');
      }
    } catch (error) {
      console.error('카카오 로그인 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNaverLogin = async () => {
    setIsLoading(true);
    try {
      // TODO: 실제 Naver OAuth 구현
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = await login({
        name: '네이버 사용자',
        email: 'user@naver.com',
        provider: 'naver'
      });
      
      if (result.success) {
        navigate('/profile');
      }
    } catch (error) {
      console.error('네이버 로그인 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg">
        {/* 카드 */}
        <div className="bg-white rounded-2xl shadow-xl px-8 sm:px-10 py-10">
          {/* 헤더 - 로고/타이틀 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center gap-3 mb-2">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-md" />
              <span className="text-3xl font-extrabold tracking-tight text-gray-800">AI TRAVEL</span>
            </div>
            <div className="text-sm text-gray-500">AI 여행 스케줄링 플래너</div>
          </div>

          {/* 이메일/비밀번호 입력 */}
          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" 
                className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:ring-cyan-500 focus:border-cyan-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:ring-cyan-500 focus:border-cyan-500" 
              />
            </div>
            
            {error && <div className="text-sm text-red-600">{error}</div>}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-lg bg-cyan-400 hover:bg-cyan-500 text-white font-semibold transition-colors disabled:opacity-60"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* 가입 유도 */}
          <div className="mt-6 text-center text-sm text-gray-600">
            아직 회원이 아니세요? <button onClick={() => navigate('/sign-up')} className="text-cyan-600 hover:underline">이메일회원가입</button>
          </div>

          {/* 구분선 */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="text-center text-sm text-gray-500 mb-4">SNS 간편 로그인</div>

          {/* 소셜 로그인 - 기존 로직 유지 */}
          <div className="grid grid-cols-3 gap-4">
            {/* Kakao */}
            <button
              onClick={handleKakaoLogin}
              disabled={isLoading}
              className="h-14 rounded-xl bg-yellow-400 hover:bg-yellow-500 flex items-center justify-center shadow-sm disabled:opacity-50"
              aria-label="카카오 로그인"
            >
              <svg className="h-6 w-6 text-black" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11L6.5 21.5c-.5.5-1.5.5-2 0s-.5-1.5 0-2l3.5-3.5c-3.5-1.5-6-4.5-6-8.185C2 6.664 6.701 3 12 3z"/></svg>
            </button>

            {/* Naver */}
            <button
              onClick={handleNaverLogin}
              disabled={isLoading}
              className="h-14 rounded-xl bg-green-600 hover:bg-green-700 flex items-center justify-center shadow-sm disabled:opacity-50"
              aria-label="네이버 로그인"
            >
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24"><path fill="currentColor" d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845Z"/></svg>
            </button>

            {/* Google */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="h-14 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 flex items-center justify-center shadow-sm disabled:opacity-50"
              aria-label="구글 로그인"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            </button>
          </div>

          {/* 약관 */}
          <p className="mt-6 text-center text-xs text-gray-500">로그인 시 <a className="underline hover:text-gray-700">이용약관</a> 및 <a className="underline hover:text-gray-700">개인정보처리방침</a>에 동의하게 됩니다.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
