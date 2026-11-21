import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Tự động đính kèm JWT Token từ Keycloak vào mọi request gọi tới /api/... để Kong API Gateway kiểm tra phân quyền Role/ACL
const originalFetch = window.fetch.bind(window)
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
  if (url.startsWith('/api/') || url.includes('/api/')) {
    const token = localStorage.getItem('clinic_auth_token')
    const headers = new Headers(init?.headers || {})
    if (token && !token.startsWith('CLINIC-AUTH-TOKEN-') && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    const savedUser = localStorage.getItem('clinic_auth_user')
    if (savedUser && !headers.has('X-User-Roles')) {
      try {
        const parsed = JSON.parse(savedUser)
        if (Array.isArray(parsed.roles) && parsed.roles.length > 0) {
          headers.set('X-User-Roles', parsed.roles.join(','))
        }
      } catch {
        // ignore JSON error
      }
    }
    init = { ...init, headers }
  }
  return originalFetch(input, init)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
