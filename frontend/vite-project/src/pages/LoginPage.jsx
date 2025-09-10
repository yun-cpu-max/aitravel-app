import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            AI Travel에 오신 것을 환영합니다
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            간편하게 로그인하고 맞춤형 여행 계획을 받아보세요
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            {/* Google 로그인 */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </span>
              {isLoading ? '로그인 중...' : 'Google로 계속하기'}
            </button>

            {/* Kakao 로그인 */}
            <button
              onClick={handleKakaoLogin}
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11L6.5 21.5c-.5.5-1.5.5-2 0s-.5-1.5 0-2l3.5-3.5c-3.5-1.5-6-4.5-6-8.185C2 6.664 6.701 3 12 3z"
                  />
                </svg>
              </span>
              {isLoading ? '로그인 중...' : '카카오로 계속하기'}
            </button>

            {/* Naver 로그인 */}
            <button
              onClick={handleNaverLogin}
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845Z"
                  />
                </svg>
              </span>
              {isLoading ? '로그인 중...' : '네이버로 계속하기'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              로그인하면{' '}
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                이용약관
              </a>{' '}
              및{' '}
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                개인정보처리방침
              </a>
              에 동의하는 것으로 간주됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
