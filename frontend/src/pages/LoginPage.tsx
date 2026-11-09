import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { AuthUser } from '../types'
import keycloak from '../keycloak'

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser, token: string) => void
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Khởi tạo và kiểm tra nếu vừa đăng nhập từ Keycloak chuyển về
  useEffect(() => {
    keycloak
      .init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: false,
      })
      .then(async (authenticated) => {
        if (authenticated && keycloak.tokenParsed) {
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
        }
      })
      .catch((err) => {
        if (!String(err).includes('already initialized')) {
          console.error('Lỗi khởi tạo Keycloak:', err)
        }
      })
  }, [navigate, onLoginSuccess])

  const handleLogin = async (e: React.FormEvent) => {
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

  const handleKeycloakLogin = () => {
    keycloak.login({
      redirectUri: window.location.origin + '/dang-nhap',
    })
  }

  const fillQuickAccount = (uname: string) => {
    setUsername(uname)
    setPassword('123456')
    setError(null)
  }

    useEffect(() => {
    keycloak
      .init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: false,
      })
      .then(async (authenticated) => {
        if (authenticated && keycloak.tokenParsed) {
          const parsed = keycloak.tokenParsed as any
          const rawRoles: string[] = parsed.realm_access?.roles || []
          const filteredRoles = rawRoles.filter(
            (r) => !['offline_access', 'uma_authorization', 'default-roles-clinic-realm'].includes(r)
          )

          // Gọi Backend để đồng bộ và nhận AuthUser với ID thực trong MySQL
          try {
            const res = await fetch('/api/auth/sync-keycloak', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username: parsed.preferred_username || parsed.name,
                email: parsed.email || '',
                fullName: parsed.name || '',
                roles: filteredRoles,
              }),
            })
            const data = await res.json()
            if (data.success && data.user) {
              onLoginSuccess(data.user, keycloak.token || '')
              navigate('/')
              return
            }
          } catch (e) {
            console.error('Lỗi đồng bộ Keycloak user:', e)
          }
        }
      })
  }, [navigate, onLoginSuccess])

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
            <h1 style={{ fontSize: '26px', margin: '6px 0 8px', color: 'var(--ink)' }}>
              Đăng nhập tài khoản
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>
              Hệ thống thông tin quản lý phòng khám CarePlus Clinic
            </p>
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

          <form onSubmit={handleLogin}>
            <div className="field">
              <label>Tên đăng nhập / Email / Số điện thoại</label>
              <input
                type="text"
                placeholder="Ví dụ: admin, doctor_an, bn.nam@gmail.com"
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
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px', padding: '13px 0' }}
              disabled={loading}
            >
              {loading ? 'Đang xác thực...' : 'Đăng nhập'}
            </button>

            {/* Hoặc đăng nhập bằng Keycloak SSO */}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <div style={{ margin: '16px 0', borderBottom: '1px solid #e2e8f0', position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#fff',
                    padding: '0 10px',
                    fontSize: '13px',
                    color: '#718096',
                  }}
                >
                  HOẶC
                </span>
              </div>

              <button
                type="button"
                onClick={handleKeycloakLogin}
                className="btn"
                style={{
                  width: '100%',
                  background: '#0284c7',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: 600,
                  padding: '12px 0',
                }}
              >
                Đăng nhập bằng Keycloak SSO
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '14px', color: 'var(--muted)' }}>
              Chưa có tài khoản?{' '}
              <Link to="/dang-ky" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                Đăng ký tài khoản mới
              </Link>
            </div>
          </form>

          {/* Quick select demo accounts */}
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px dashed var(--border)' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--muted)', marginBottom: '12px' }}>
              Chọn nhanh tài khoản mẫu để kiểm thử (Mật khẩu mặc định: 123456):
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => fillQuickAccount('admin')}
              >
                Admin (Quản trị)
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => fillQuickAccount('manager')}
              >
                Manager (Quản lý)
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => fillQuickAccount('doctor_an')}
              >
                Doctor (Bác sĩ)
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => fillQuickAccount('receptionist')}
              >
                Receptionist (Lễ tân)
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => fillQuickAccount('patient_nam')}
              >
                Patient (Bệnh nhân)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
