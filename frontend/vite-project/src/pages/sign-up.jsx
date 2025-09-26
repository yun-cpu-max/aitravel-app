/**
 * SignUpPage
 * - 백엔드 User 엔티티(email, passwordHash, name, createdAt/updatedAt)는
 *   프론트에서는 email, password, name 3가지를 입력받아 가입하는 폼으로 구성
 * - 실제 API 연동 전까지는 데모로 클라이언트 검증과 AuthContext.login을 재사용하여
 *   가입 즉시 로그인된 상태로 프로필로 이동
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const SignUpPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 간단 검증
    if (!name.trim()) return setError('이름을 입력해주세요.');
    if (!email.trim()) return setError('이메일을 입력해주세요.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('올바른 이메일 형식이 아닙니다.');
    if (password.length < 8) return setError('비밀번호는 8자 이상이어야 합니다.');
    if (password !== confirm) return setError('비밀번호가 일치하지 않습니다.');

    // 실제 백엔드 API 호출
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8081/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // 회원가입 성공 - 백엔드에서 받은 모든 사용자 데이터 전달
        const result = await login({ 
          id: data.user.id,
          name: data.user.name, 
          email: data.user.email, 
          provider: 'local',
          providerId: data.user.providerId,
          profileImageUrl: data.user.profileImageUrl,
          token: data.token,
          createdAt: data.user.createdAt,
          updatedAt: data.user.updatedAt
        });
        if (result.success) navigate('/profile');
      } else {
        // 회원가입 실패
        setError(data.message || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      setError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-xl px-8 sm:px-10 py-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center gap-3 mb-2">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-md" />
              <span className="text-3xl font-extrabold tracking-tight text-gray-800">회원가입</span>
            </div>
            <div className="text-sm text-gray-500">AI 여행 스케줄링 플래너</div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>
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
                placeholder="8자 이상"
                className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="한번 더 입력"
                className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-lg bg-cyan-400 hover:bg-cyan-500 text-white font-semibold transition-colors disabled:opacity-60"
            >
              {isLoading ? '가입 중...' : '이메일로 가입하기'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            이미 계정이 있으신가요? <button onClick={() => navigate('/login')} className="text-cyan-600 hover:underline">로그인</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;


