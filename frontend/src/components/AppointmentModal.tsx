import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { AppointmentFormData, AuthUser } from '../types'

interface AppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  initialSpecialty?: string
  currentUser?: AuthUser | null
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  initialSpecialty = '',
  currentUser,
}) => {
  const [formData, setFormData] = useState<AppointmentFormData>({
    fullName: currentUser?.username || '',
    phone: currentUser?.phone || '',
    specialty: initialSpecialty,
    date: new Date().toISOString().split('T')[0],
    note: '',
  })
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || currentUser.username,
        phone: prev.phone || currentUser.phone || '',
      }))
    }
  }, [currentUser, isOpen])

  if (!isOpen) return null

  // Require login before booking appointment
  if (!currentUser) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            X
          </button>

          <div style={{ textAlign: 'center', padding: '24px 10px' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#fff8e1',
                color: '#b78103',
                display: 'grid',
                placeItems: 'center',
                fontSize: '28px',
                fontWeight: 'bold',
                margin: '0 auto 16px',
              }}
            >
              !
            </div>
            <h3 style={{ margin: '0 0 10px', fontSize: '22px', color: 'var(--ink)' }}>
              Yêu cầu đăng nhập
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '14.5px', lineHeight: 1.6, margin: '0 0 24px' }}>
              Quý khách cần đăng nhập tài khoản vào hệ thống trước khi đăng ký lịch khám bệnh.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button type="button" className="btn btn-light" onClick={onClose} style={{ flex: 1 }}>
                Để sau
              </button>
              <Link to="/dang-nhap" className="btn btn-primary" onClick={onClose} style={{ flex: 1.5, textAlign: 'center' }}>
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      // reset after 2.5s
      setSubmitted(false)
      onClose()
    }, 2500)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          X
        </button>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '24px 10px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e8f5e9', color: '#2e7d32', display: 'grid', placeItems: 'center', fontSize: '32px', margin: '0 auto 16px' }}>
              OK
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '22px', color: 'var(--ink)' }}>
              Đăng ký thành công!
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '14.5px', margin: '0 0 16px' }}>
              Cảm ơn quý khách <strong>{formData.fullName}</strong>. Chuyên viên chăm sóc khách hàng của CarePlus sẽ gọi tới số <strong>{formData.phone}</strong> trong vòng 15 phút để xác nhận lịch khám.
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '20px' }}>
              <span className="eyebrow">Đặt lịch trực tuyến</span>
              <h2 style={{ margin: '0 0 6px', fontSize: '22px' }}>Đăng ký khám sức khỏe</h2>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)' }}>
                Tài khoản đặt lịch: <strong>{currentUser.username}</strong> ({currentUser.email || currentUser.phone || 'Thành viên'})
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="modal_fullname">Họ và tên của bạn *</label>
                <input
                  id="modal_fullname"
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              <div className="field">
                <label htmlFor="modal_phone">Số điện thoại liên hệ *</label>
                <input
                  id="modal_phone"
                  type="tel"
                  placeholder="Ví dụ: 0912 345 678"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="field">
                <label htmlFor="modal_specialty">Chuyên khoa khám *</label>
                <select
                  id="modal_specialty"
                  required
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                >
                  <option value="">-- Chọn chuyên khoa --</option>
                  <option value="Khoa Nội">Khoa Nội tổng quát</option>
                  <option value="Khoa Nhi">Khoa Nhi & Dinh dưỡng</option>
                  <option value="Sản - Phụ khoa">Khoa Sản - Phụ khoa</option>
                  <option value="Tai - Mũi - Họng">Khoa Tai - Mũi - Họng</option>
                  <option value="Răng - Hàm - Mặt">Khoa Răng - Hàm - Mặt</option>
                  <option value="Cơ xương khớp">Khoa Cơ xương khớp</option>
                  <option value="Xét nghiệm">Xét nghiệm & Chẩn đoán hình ảnh</option>
                  <option value="Khám tại nhà">Dịch vụ lấy mẫu / khám tại nhà</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="modal_date">Ngày mong muốn khám *</label>
                <input
                  id="modal_date"
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="field">
                <label htmlFor="modal_note">Ghi chú thêm (Triệu chứng, tiền sử...)</label>
                <textarea
                  id="modal_note"
                  placeholder="Mô tả ngắn triệu chứng hoặc yêu cầu đặc biệt..."
                  style={{ minHeight: '80px' }}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '6px' }}>
                Xác nhận đặt lịch hẹn →
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
