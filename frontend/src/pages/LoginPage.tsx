import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { AuthUser } from '../types'
import keycloak from '../keycloak'

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser, token: string) => void
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate()
  const [redirecting, setRedirecting] = useState(true)
  const [showManualForm, setShowManualForm] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const initRef = useRef(false)

  // Khởi tạo và xử lý luồng SSO tập trung
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    keycloak
      .init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: false,
      })
      .then(async (authenticated) => {
        if (authenticated && keycloak.tokenParsed) {
          // Trường hợp 1: Người dùng đã đăng nhập thành công và được Keycloak chuyển về
          setRedirecting(false)
          const parsed = keycloak.tokenParsed as any
          const rawRoles: string[] = parsed.realm_access?.roles || []
          const filteredRoles = rawRoles.filter(
            (r: string) => !['offline_access', 'uma_authorization', 'default-roles-clinic-realm'].includes(r)
          )

          try {
            // Đồng bộ tài khoản Keycloak vào database MySQL
            const res = await fetch('/api/auth/sync-keycloak', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username: parsed.preferred_username || parsed.name || 'keycloak_user',
                email: parsed.email || '',
                fullName: parsed.name || '',
                roles: filteredRoles,
              }),
            })
            const data = await res.json()
            if (data.success && data.user) {
              onLoginSuccess(data.user, keycloak.token || '')
              const userRoles = (data.user.roles || []).map((r: string) => r.toLowerCase())
              if (userRoles.includes('admin') || userRoles.includes('manager')) {
                navigate('/admin/tai-khoan')
              } else if (
                userRoles.some((r: string) =>
                  ['receptionist', 'doctor', 'nurse', 'technician', 'pharmacist', 'cashier'].includes(r)
                )
              ) {
                navigate('/quan-ly-benh-nhan')
              } else {
                navigate('/')
              }
              return
            }
          } catch (err) {
            console.error('Lỗi gọi API đồng bộ Keycloak:', err)
          }

          // Fallback nếu chưa kết nối được backend
          const fallbackUser: AuthUser = {
            id: 999,
            username: parsed.preferred_username || parsed.name || 'keycloak_user',
            email: parsed.email || '',
            phone: '',
            roles: filteredRoles,
            permissions: [],
            isActive: true,
          }
          onLoginSuccess(fallbackUser, keycloak.token || '')
          navigate('/')
        } else {
          // Trường hợp 2: Chưa đăng nhập -> Tự động chuyển hướng ngay sang Cổng xác thực CarePlus Clinic
          keycloak.login({
            redirectUri: window.location.origin + '/dang-nhap',
          })
        }
      })
      .catch((err) => {
        setRedirecting(false)
        setShowManualForm(true)
        if (!String(err).includes('already initialized')) {
          console.error('Lỗi khởi tạo Keycloak:', err)
        }
      })
  }, [navigate, onLoginSuccess])

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        onLoginSuccess(data.user, data.token)
        const userRoles = (data.user.roles || []).map((r: string) => r.toLowerCase())
        if (userRoles.includes('admin') || userRoles.includes('manager')) {
          navigate('/admin/tai-khoan')
        } else if (
          userRoles.some((r: string) =>
            ['receptionist', 'doctor', 'nurse', 'technician', 'pharmacist', 'cashier'].includes(r)
          )
        ) {
          navigate('/quan-ly-benh-nhan')
        } else {
          navigate('/')
        }
      } else {
        setError(data.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.')
      }
    } catch {
      setError('Không thể kết nối đến máy chủ. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const triggerKeycloakLogin = () => {
    keycloak.login({
      redirectUri: window.location.origin + '/dang-nhap',
    })
  }

  // Màn hình chuyển hướng tự động sang Cổng đăng nhập tập trung
  if (redirecting && !showManualForm) {
    return (
      <div style={{ background: '#f8fafb', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '48px 36px', maxWidth: '460px', width: '100%', textAlign: 'center', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(8,127,140,0.12)', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: '28px', fontWeight: 800, margin: '0 auto 20px' }}>
            ✚
          </div>
          <h2 style={{ fontSize: '20px', color: 'var(--ink)', margin: '0 0 8px', fontWeight: 700 }}>
            Cổng xác thực CarePlus Clinic
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px' }}>
            Đang chuyển hướng đến trang đăng nhập bảo mật của hệ thống phòng khám...
          </p>

          <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid rgba(8,127,140,0.2)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '24px' }}></div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          <div>
            <button
              type="button"
              onClick={triggerKeycloakLogin}
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '12px' }}
            >
              Bấm vào đây nếu trình duyệt không tự chuyển
            </button>
            <button
              type="button"
              onClick={() => { setRedirecting(false); setShowManualForm(true); }}
              className="btn btn-light btn-sm"
              style={{ width: '100%', color: 'var(--muted)' }}
            >
              Sử dụng form đăng nhập cục bộ dự phòng
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Form đăng nhập cục bộ dự phòng (Fallback)
  return (
    <div style={{ background: '#f5fafb', minHeight: '80vh', padding: '60px 0' }}>
      <div className="container" style={{ maxWidth: '520px' }}>
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '40px 32px',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <span className="eyebrow">Xác thực hệ thống</span>
            <h1 style={{ fontSize: '24px', margin: '6px 0 8px', color: 'var(--ink)' }}>
              Đăng nhập tài khoản CarePlus Clinic
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '13.5px', margin: 0 }}>
              Hệ thống thông tin quản lý phòng khám CarePlus Clinic
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <button
              type="button"
              onClick={triggerKeycloakLogin}
              className="btn btn-primary"
              style={{ width: '100%', padding: '13px 0', fontSize: '15px' }}
            >
              Đăng nhập qua Cổng xác thực CarePlus Clinic
            </button>
          </div>

          <div style={{ margin: '20px 0', borderBottom: '1px solid #e2e8f0', position: 'relative', textAlign: 'center' }}>
            <span
              style={{
                position: 'absolute',
                top: '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#fff',
                padding: '0 10px',
                fontSize: '12px',
                color: '#718096',
              }}
            >
              HOẶC DÙNG TÀI KHOẢN CỤC BỘ DỰ PHÒNG
            </span>
          </div>

          {error && (
            <div
              style={{
                background: '#fde8e8',
                color: '#c81e1e',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px',
                borderLeft: '4px solid #c81e1e',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleManualLogin}>
            <div className="field">
              <label>Tên đăng nhập / Email / Số điện thoại</label>
              <input
                type="text"
                placeholder="Ví dụ: admin, doctor_an"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Mật khẩu</label>
                <Link
                  to="/quen-mat-khau"
                  style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <input
                type="password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-outline"
              style={{ width: '100%', marginTop: '8px', padding: '12px 0' }}
              disabled={loading}
            >
              {loading ? 'Đang xác thực...' : 'Đăng nhập cục bộ'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
