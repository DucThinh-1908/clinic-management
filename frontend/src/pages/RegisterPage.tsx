import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { AuthUser } from '../types'

interface RegisterPageProps {
  onRegisterSuccess: (user: AuthUser, token: string) => void
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onRegisterSuccess }) => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Mật khẩu phải có độ dài tối thiểu từ 6 ký tự trở lên.')
      return
    }

    if (password !== confirmPassword) {
      setError('Xác nhận mật khẩu không trùng khớp với mật khẩu đã nhập.')
      return
    }

    if (!phone.trim()) {
      setError('Vui lòng cung cấp số điện thoại để phòng khám liên hệ xác nhận lịch khám.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          password,
          confirmPassword,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        onRegisterSuccess(data.user, data.token)
        navigate('/?registered=true')
      } else {
        setError(data.message || 'Đăng ký tài khoản không thành công. Vui lòng kiểm tra lại thông tin.')
      }
    } catch {
      setError('Không thể kết nối đến máy chủ hệ thống. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#f5fafb', minHeight: '80vh', padding: '60px 0' }}>
      <div className="container" style={{ maxWidth: '540px' }}>
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
            <span className="eyebrow">Dành cho Bệnh nhân</span>
            <h1 style={{ fontSize: '26px', margin: '6px 0 8px', color: 'var(--ink)' }}>
              Đăng ký tài khoản mới
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
              Tạo tài khoản để đặt lịch hẹn khám bệnh trực tuyến và theo dõi hồ sơ y tế
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

          <form onSubmit={handleRegister}>
            <div className="field">
              <label>Tên đăng nhập *</label>
              <input
                type="text"
                placeholder="Nhập tên đăng nhập (ví dụ: nguyenvanan)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
              />
            </div>

            <div className="field">
              <label>Số điện thoại liên hệ *</label>
              <input
                type="tel"
                placeholder="Ví dụ: 0912 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Địa chỉ Email (tùy chọn)</label>
              <input
                type="email"
                placeholder="Ví dụ: benhnhan@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Mật khẩu * (Tối thiểu 6 ký tự)</label>
              <input
                type="password"
                placeholder="Nhập mật khẩu an toàn"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="field">
              <label>Xác nhận lại mật khẩu *</label>
              <input
                type="password"
                placeholder="Nhập lại mật khẩu vừa đặt"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ margin: '14px 0 20px', fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.5 }}>
              Bằng việc đăng ký tài khoản, bạn đồng ý với Quy chế hoạt động và Chính sách bảo mật thông tin hồ sơ y tế của CarePlus Clinic.
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '13px 0' }}
              disabled={loading}
            >
              {loading ? 'Đang khởi tạo tài khoản...' : 'Hoàn tất đăng ký tài khoản'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--muted)' }}>
              Đã có tài khoản trên hệ thống?{' '}
              <Link to="/dang-nhap" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                Đăng nhập ngay
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
