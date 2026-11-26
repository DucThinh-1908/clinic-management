import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AuthUser } from '../types'
import authClient from '../keycloak'

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser, token: string) => void
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate()
  const [failed, setFailed] = useState(false)
  const initRef = useRef(false)

  const processAuthenticated = async () => {
    if (!authClient.tokenParsed) {
      navigate('/')
      return
    }
    const parsed = authClient.tokenParsed as any
    const rawRoles: string[] = parsed.realm_access?.roles || []
    const filteredRoles = rawRoles.filter(
      (r: string) => !['offline_access', 'uma_authorization', 'default-roles-clinic-realm'].includes(r)
    )

    const tokenPermissions: string[] = Array.isArray(parsed.permissions)
      ? parsed.permissions
      : (parsed.resource_access?.['clinic-frontend']?.roles || [])

    try {
      const res = await fetch('/api/auth/sync-keycloak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: parsed.preferred_username || parsed.name || 'user',
          email: parsed.email || '',
          fullName: parsed.name || '',
          roles: filteredRoles,
          permissions: tokenPermissions,
        }),
      })
      const data = await res.json()
      if (data.success && data.user) {
        onLoginSuccess(data.user, authClient.token || '')
        navigate('/')
        return
      }
    } catch (err) {
      console.error('Lỗi đồng bộ tài khoản:', err)
    }

    const fallbackUser: AuthUser = {
      id: 999,
      username: parsed.preferred_username || parsed.name || 'user',
      email: parsed.email || '',
      phone: '',
      roles: filteredRoles,
      permissions: tokenPermissions,
      isActive: true,
    }
    onLoginSuccess(fallbackUser, authClient.token || '')
    navigate('/')
  }

  const handleAuth = async (authenticated: boolean) => {
    if (authenticated) {
      await processAuthenticated()
    } else {
      authClient.login({
        redirectUri: window.location.origin + '/dang-nhap',
      })
    }
  }

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    // Nếu Keycloak đã được khởi tạo trước đó ở App.tsx
    if ((authClient as any).didInitialize) {
      handleAuth(Boolean(authClient.authenticated))
      return
    }

    authClient
      .init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: false,
      })
      .then(async (authenticated) => {
        await handleAuth(authenticated)
      })
      .catch(async (err) => {
        if (String(err).includes('already initialized')) {
          await handleAuth(Boolean(authClient.authenticated))
          return
        }
        console.error('Lỗi khởi tạo cổng đăng nhập:', err)
        setFailed(true)
      })
  }, [navigate, onLoginSuccess])

  const goToLogin = () => {
    setFailed(false)
    try {
      authClient.login({
        redirectUri: window.location.origin + '/dang-nhap',
      })
    } catch {
      window.location.reload()
    }
  }

  return (
    <div style={{ background: '#f8fafb', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '48px 36px', maxWidth: '460px', width: '100%', textAlign: 'center', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(8,127,140,0.12)', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: '28px', fontWeight: 800, margin: '0 auto 20px' }}>
          ✚
        </div>
        <h2 style={{ fontSize: '20px', color: 'var(--ink)', margin: '0 0 8px', fontWeight: 700 }}>
          Đăng nhập CarePlus Clinic
        </h2>

        {failed ? (
          <p style={{ color: '#c81e1e', fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px' }}>
            Không thể kết nối đến hệ thống đăng nhập. Vui lòng bấm thử lại bên dưới.
          </p>
        ) : (
          <>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px' }}>
              Đang chuyển đến trang đăng nhập bảo mật của phòng khám...
            </p>
            <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid rgba(8,127,140,0.2)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '24px' }}></div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </>
        )}

        <button
          type="button"
          onClick={goToLogin}
          className="btn btn-primary"
          style={{ width: '100%' }}
        >
          {failed ? 'Thử lại' : 'Đăng nhập'}
        </button>
      </div>
    </div>
  )
}
