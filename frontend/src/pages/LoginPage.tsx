import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { AuthUser } from '../types'

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser, token: string) => void
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
        if (data.user.roles.includes('admin') || data.user.roles.includes('manager')) {
          navigate('/admin/tai-khoan')
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

  const fillQuickAccount = (uname: string) => {
    setUsername(uname)
    setPassword('123456')
    setError(null)
  }

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
