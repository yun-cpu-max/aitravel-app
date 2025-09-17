/**
 * React 애플리케이션의 진입점 (Entry Point)
 * - Vite 번들러가 이 파일을 시작점으로 사용합니다.
 * - React 애플리케이션을 DOM에 마운트하는 역할을 합니다.
 */

// React의 StrictMode와 createRoot를 import
// StrictMode: 개발 모드에서 잠재적인 문제를 감지하는 도구
// createRoot: React 18의 새로운 렌더링 API
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// 전역 CSS 스타일 import (Tailwind CSS 포함)
import './index.css'

// 메인 App 컴포넌트 import
import App from './App'

/**
 * React 애플리케이션을 DOM에 마운트
 * - document.getElementById('root'): HTML의 root 요소를 찾습니다.
 * - createRoot(): React 18의 새로운 루트 생성 API
 * - render(): 컴포넌트를 실제 DOM에 렌더링합니다.
 * - StrictMode: 개발 모드에서 추가 검사를 수행합니다.
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
