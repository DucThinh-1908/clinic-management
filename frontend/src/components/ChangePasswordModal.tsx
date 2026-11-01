import React, { useState } from 'react'

interface ChangePasswordModalProps {
  isOpen: boolean
  userId?: number
  onClose: () => void
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, userId, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

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
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentPassword, newPassword, confirmPassword }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
          onClose()
        }, 1800)
      } else {
        setError(data.message || 'Đổi mật khẩu thất bại.')
      }
    } catch {
      setError('Lỗi kết nối hệ thống.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          X
        </button>

        <div style={{ marginBottom: '20px' }}>
          <span className="eyebrow">Bảo mật tài khoản</span>
          <h2 style={{ margin: '4px 0 6px', fontSize: '22px' }}>Đổi mật khẩu</h2>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13.5px' }}>
            Thay đổi mật khẩu đăng nhập của tài khoản
          </p>
        </div>

        {error && (
          <div
            style={{
              background: '#fde8e8',
              color: '#c81e1e',
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '13.5px',
            }}
          >
            {error}
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: '#def7ec',
                color: '#03543f',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 12px',
                fontWeight: 'bold',
                fontSize: '24px',
              }}
            >
              OK
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '18px' }}>Đổi mật khẩu thành công!</h3>
            <p style={{ color: 'var(--muted)', fontSize: '13.5px', margin: 0 }}>
              Mật khẩu của bạn đã được cập nhật vào hệ thống.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Mật khẩu hiện tại</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                required
              />
            </div>

            <div className="field">
              <label>Mật khẩu mới</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                required
              />
            </div>

            <div className="field">
              <label>Xác nhận mật khẩu mới</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-light"
                style={{ flex: 1 }}
                onClick={onClose}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2 }}
                disabled={loading}
              >
                {loading ? 'Đang cập nhật...' : 'Lưu mật khẩu'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
