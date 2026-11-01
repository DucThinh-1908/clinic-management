import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [identifier, setIdentifier] = useState('')
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Step 1: Send forgot password request
  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone: identifier }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setToken(data.resetToken || '')
        setMessage('Mã xác thực đã được tạo. Vui lòng nhập mã và mật khẩu mới bên dưới.')
        setStep(2)
      } else {
        setError(data.message || 'Không tìm thấy thông tin tài khoản.')
      }
    } catch {
      setError('Lỗi kết nối tới hệ thống. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp với mật khẩu mới.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setMessage('Đặt lại mật khẩu thành công! Đang chuyển hướng tới trang đăng nhập...')
        setTimeout(() => {
          navigate('/dang-nhap')
        }, 2000)
      } else {
        setError(data.message || 'Đặt lại mật khẩu thất bại.')
      }
    } catch {
      setError('Lỗi kết nối tới máy chủ.')
    } finally {
      setLoading(false)
    }
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
            <span className="eyebrow">Khôi phục quyền truy cập</span>
            <h1 style={{ fontSize: '26px', margin: '6px 0 8px', color: 'var(--ink)' }}>
              Quên và đặt lại mật khẩu
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>
              Hệ thống hỗ trợ lấy lại quyền truy cập tài khoản
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

          {message && (
            <div
              style={{
                background: '#def7ec',
                color: '#03543f',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px',
                borderLeft: '4px solid #0e9f6e',
              }}
            >
              {message}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestToken}>
              <div className="field">
                <label>Email / Số điện thoại / Tên đăng nhập</label>
                <input
                  type="text"
                  placeholder="Ví dụ: admin@careplusclinic.vn, bn.nam@gmail.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '8px', padding: '13px 0' }}
                disabled={loading}
              >
                {loading ? 'Đang gửi yêu cầu...' : 'Lấy mã xác thực'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div className="field">
                <label>Mã xác thực (Token khôi phục)</label>
                <input
                  type="text"
                  placeholder="Nhập mã xác thực"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Mật khẩu mới</label>
                <input
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '8px', padding: '13px 0' }}
                disabled={loading}
              >
                {loading ? 'Đang cập nhật...' : 'Xác nhận đặt lại mật khẩu'}
              </button>

              <button
                type="button"
                className="btn btn-light"
                style={{ width: '100%', marginTop: '10px' }}
                onClick={() => setStep(1)}
              >
                Quay lại bước 1
              </button>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Link to="/dang-nhap" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '14px' }}>
              Quay lại trang Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
