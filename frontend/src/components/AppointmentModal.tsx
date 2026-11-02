import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { AuthUser, DoctorOptionItem, DoctorSlotItem } from '../types'

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
  const [fullName, setFullName] = useState(currentUser?.username || '')
  const [phone, setPhone] = useState(currentUser?.phone || '')
  const [email, setEmail] = useState(currentUser?.email || '')
  const specialty = initialSpecialty
  const [date, setDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [doctors, setDoctors] = useState<DoctorOptionItem[]>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | ''>('')
  const [slots, setSlots] = useState<DoctorSlotItem[]>([])
  const [selectedTime, setSelectedTime] = useState('')
  const [symptomsSummary, setSymptomsSummary] = useState('')
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [createdAppointment, setCreatedAppointment] = useState<{
    code: string
    date: string
    time: string
    doctorName?: string
  } | null>(null)

  useEffect(() => {
    if (currentUser) {
      setFullName(prev => prev || currentUser.username)
      setPhone(prev => prev || currentUser.phone || '')
      setEmail(prev => prev || currentUser.email || '')
    }
  }, [currentUser, isOpen])

  // Tải danh sách bác sĩ
  useEffect(() => {
    if (!isOpen) return
    const fetchDoctors = async () => {
      setLoadingDoctors(true)
      try {
        const res = await fetch(`/api/appointments/doctors?date=${date}`)
        if (res.ok) {
          const data: DoctorOptionItem[] = await res.json()
          setDoctors(data)
          if (data.length > 0 && selectedDoctorId === '') {
            setSelectedDoctorId(data[0].doctorId)
          }
        }
      } catch (err) {
        console.error('Lỗi tải danh sách bác sĩ:', err)
      } finally {
        setLoadingDoctors(false)
      }
    }
    fetchDoctors()
  }, [isOpen, date])

  // UC-LH01: Tải các khung giờ trống của bác sĩ
  useEffect(() => {
    if (!isOpen || !selectedDoctorId || !date) {
      setSlots([])
      return
    }
    const fetchSlots = async () => {
      setLoadingSlots(true)
      try {
        const res = await fetch(`/api/appointments/slots?doctorId=${selectedDoctorId}&date=${date}`)
        if (res.ok) {
          const data = await res.json()
          setSlots(data.slots || [])
          // Tự động chọn slot đầu tiên còn trống nếu slot hiện tại không hợp lệ
          const firstAvailable = (data.slots || []).find((s: DoctorSlotItem) => Boolean(s.isAvailable ?? s.available))
          if (firstAvailable) {
            setSelectedTime(firstAvailable.startTime.slice(0, 5))
          } else {
            setSelectedTime('')
          }
        } else {
          setSlots([])
        }
      } catch (err) {
        console.error('Lỗi tải khung giờ trống:', err)
        setSlots([])
      } finally {
        setLoadingSlots(false)
      }
    }
    fetchSlots()
  }, [isOpen, selectedDoctorId, date])

  if (!isOpen) return null

  // Bắt buộc đăng nhập
  if (!currentUser) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
          <button className="modal-close" onClick={onClose} aria-label="Đóng cửa sổ">
            &times;
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
              Quý khách cần đăng nhập tài khoản vào hệ thống trước khi đăng ký lịch khám bệnh trực tuyến.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <Link to="/dang-nhap" className="btn btn-primary" onClick={onClose} style={{ flex: 1, textAlign: 'center' }}>
                  Đăng nhập ngay
                </Link>
                <Link to="/dang-ky" className="btn btn-outline" onClick={onClose} style={{ flex: 1, textAlign: 'center' }}>
                  Đăng ký mới
                </Link>
              </div>
              <button type="button" className="btn btn-light btn-sm" onClick={onClose} style={{ width: '100%', color: 'var(--muted)' }}>
                Để sau
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // UC-LH02: Đặt lịch hẹn
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!selectedTime) {
      setErrorMessage('Vui lòng chọn khung giờ khám còn trống.')
      return
    }

    setSubmitting(true)

    try {
      const selectedDoc = doctors.find(d => d.doctorId === Number(selectedDoctorId))

      const payload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        doctorId: selectedDoctorId ? Number(selectedDoctorId) : undefined,
        departmentId: selectedDoc?.departmentId,
        appointmentDate: date,
        appointmentTime: selectedTime.length === 5 ? selectedTime + ':00' : selectedTime,
        symptomsSummary: symptomsSummary.trim(),
        bookingChannel: 'ONLINE_PORTAL',
        notes: specialty ? `Khoa quan tâm: ${specialty}` : undefined,
      }

      const res = await fetch(`/api/appointments?userId=${currentUser.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Không thể đặt lịch hẹn. Vui lòng thử lại.')
      }

      setCreatedAppointment({
        code: data.appointmentCode,
        date: data.appointmentDate,
        time: data.appointmentTime.slice(0, 5),
        doctorName: data.doctorName,
      })
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi kết nối máy chủ')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResetAndClose = () => {
    setCreatedAppointment(null)
    setErrorMessage('')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleResetAndClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={handleResetAndClose} aria-label="Đóng cửa sổ">
          &times;
        </button>

        {createdAppointment ? (
          <div style={{ textAlign: 'center', padding: '28px 16px' }}>
            <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: '#e8f5e9', color: '#2e7d32', display: 'grid', placeItems: 'center', fontSize: '32px', margin: '0 auto 18px', fontWeight: 'bold' }}>
              ✓
            </div>
            <h3 style={{ margin: '0 0 10px', fontSize: '22px', color: 'var(--ink)' }}>
              Đặt lịch hẹn thành công!
            </h3>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '16px 0', textAlign: 'left' }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Mã lịch hẹn:</span>{' '}
                <strong style={{ color: 'var(--primary)', fontSize: '16px' }}>{createdAppointment.code}</strong>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Thời gian khám:</span>{' '}
                <strong>{createdAppointment.time}</strong> ngày <strong>{createdAppointment.date}</strong>
              </div>
              {createdAppointment.doctorName && (
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Bác sĩ phụ trách:</span>{' '}
                  <strong>{createdAppointment.doctorName}</strong>
                </div>
              )}
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Trạng thái:</span>{' '}
                <span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                  Chờ bộ phận Lễ tân xác nhận
                </span>
              </div>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 20px' }}>
              Hệ thống đã tự động gửi tin nhắn SMS / Email xác nhận tới số <strong>{phone}</strong>. Nhân viên chăm sóc khách hàng sẽ liên hệ nếu cần hỗ trợ thêm.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <Link to="/lich-hen" className="btn btn-primary" onClick={handleResetAndClose}>
                Xem lịch hẹn của tôi
              </Link>
              <button type="button" className="btn btn-outline" onClick={handleResetAndClose}>
                Đóng
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '18px' }}>
              <span className="eyebrow">Đặt lịch khám trực tuyến</span>
              <h2 style={{ margin: '0 0 6px', fontSize: '22px' }}>Đăng ký khám sức khỏe</h2>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--muted)' }}>
                Tài khoản: <strong>{currentUser.username}</strong> ({currentUser.email || currentUser.phone || 'Bệnh nhân'})
              </p>
            </div>

            {errorMessage && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '13.5px', marginBottom: '16px' }}>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="field">
                  <label htmlFor="modal_fullname">Họ và tên bệnh nhân *</label>
                  <input
                    id="modal_fullname"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label htmlFor="modal_phone">Số điện thoại liên hệ *</label>
                  <input
                    id="modal_phone"
                    type="tel"
                    placeholder="0912345678"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="field">
                  <label htmlFor="modal_date">Ngày mong muốn khám *</label>
                  <input
                    id="modal_date"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label htmlFor="modal_doctor">Bác sĩ khám bệnh *</label>
                  <select
                    id="modal_doctor"
                    required
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">{loadingDoctors ? 'Đang tải danh sách bác sĩ...' : '-- Chọn bác sĩ --'}</option>
                    {doctors.map((d) => (
                      <option key={d.doctorId} value={d.doctorId}>
                        {d.doctorName} ({d.specialty} - {d.departmentName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* UC-LH01: Khung giờ trống của bác sĩ */}
              <div className="field" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Khung giờ khám còn trống *</span>
                  {loadingSlots && <small style={{ color: 'var(--primary)' }}>Đang kiểm tra lịch trống...</small>}
                </label>

                {slots.length === 0 && !loadingSlots ? (
                  <p style={{ margin: '6px 0', fontSize: '13px', color: '#64748b' }}>
                    Không có khung giờ trống trong ngày đã chọn. Vui lòng đổi ngày hoặc chọn bác sĩ khác.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))', gap: '8px', marginTop: '6px' }}>
                    {slots.map((slot) => {
                      const timeLabel = slot.startTime.slice(0, 5)
                      const isSelected = selectedTime === timeLabel
                      const isAvail = Boolean(slot.isAvailable ?? slot.available)

                      return (
                        <button
                          key={slot.startTime}
                          type="button"
                          disabled={!isAvail}
                          onClick={() => isAvail && setSelectedTime(timeLabel)}
                          style={{
                            padding: '8px 4px',
                            borderRadius: '8px',
                            border: isSelected ? '2px solid var(--primary)' : '1px solid #cbd5e1',
                            background: isSelected
                              ? 'var(--primary)'
                              : isAvail
                              ? '#ffffff'
                              : '#f1f5f9',
                            color: isSelected ? '#ffffff' : isAvail ? 'var(--ink)' : '#94a3b8',
                            fontSize: '13px',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: isAvail ? 'pointer' : 'not-allowed',
                            textAlign: 'center',
                            transition: 'all 0.15s ease',
                          }}
                          title={isAvail ? `Khung giờ trống (${slot.shiftName})` : 'Đã có lịch hẹn'}
                        >
                          {timeLabel}
                          {!isAvail && (
                            <span style={{ display: 'block', fontSize: '10px', color: '#ef4444' }}>Đã kín</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="field">
                <label htmlFor="modal_note">Lý do khám / Triệu chứng ban đầu</label>
                <textarea
                  id="modal_note"
                  placeholder="Mô tả triệu chứng, lý do khám hoặc lưu ý đặc biệt..."
                  style={{ minHeight: '70px' }}
                  value={symptomsSummary}
                  onChange={(e) => setSymptomsSummary(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || !selectedTime}
                style={{ width: '100%', marginTop: '6px' }}
              >
                {submitting ? 'Đang gửi thông tin...' : 'Xác nhận đặt lịch hẹn ngay'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
