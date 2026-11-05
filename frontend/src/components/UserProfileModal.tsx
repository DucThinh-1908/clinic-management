import React, { useState, useEffect } from 'react'
import type { AuthUser } from '../types'

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: AuthUser | null
  onOpenChangePassword?: () => void
}

interface StaffProfileData {
  id: number
  userId: number
  staffCode: string
  fullName: string
  gender: string
  dateOfBirth?: string
  idCardNumber?: string
  address?: string
  phone?: string
  email?: string
  qualification?: string
  hireDate?: string
  status?: string
  departmentName?: string
  departmentId?: number
  roleName?: string
  roleCode?: string
  licenseNumber?: string
  specialty?: string
  consultationFee?: number
  biography?: string
  yearsOfExperience?: number
}

interface PatientProfileData {
  id: number
  userId?: number
  patientCode: string
  fullName: string
  gender: string
  dateOfBirth?: string
  age?: number
  phone: string
  email?: string
  identityCard?: string
  healthInsuranceNumber?: string
  address?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  bloodGroup?: string
  medicalHistory?: string
  drugAllergies?: string
  totalVisits?: number
  isActive?: boolean
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenChangePassword,
}) => {
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [staffData, setStaffData] = useState<StaffProfileData | null>(null)
  const [patientData, setPatientData] = useState<PatientProfileData | null>(null)

  // Form edit state
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'MALE',
    dateOfBirth: '',
    phone: '',
    email: '',
    identityCard: '',
    address: '',
    // Patient specific
    emergencyContactName: '',
    emergencyContactPhone: '',
    bloodGroup: '',
    drugAllergies: '',
    // Staff/Doctor specific
    biography: '',
  })

  const userRoles = (currentUser?.roles || []).map((r) => r.toLowerCase())
  const isStaff = userRoles.some((r) =>
    ['receptionist', 'doctor', 'nurse', 'manager', 'admin', 'technician', 'pharmacist', 'cashier'].includes(r)
  )
  const isDoctor = userRoles.includes('doctor')
  const isPatient = userRoles.includes('patient') && !isStaff

  const getRoleDisplayName = () => {
    if (userRoles.includes('admin')) return 'Quản trị viên hệ thống'
    if (userRoles.includes('manager')) return 'Quản lý phòng khám'
    if (userRoles.includes('doctor')) return 'Bác sĩ chuyên khoa'
    if (userRoles.includes('nurse')) return 'Điều dưỡng y tế'
    if (userRoles.includes('receptionist')) return 'Nhân viên lễ tân'
    if (userRoles.includes('pharmacist')) return 'Dược sĩ phụ trách'
    if (userRoles.includes('cashier')) return 'Thu ngân viện phí'
    if (userRoles.includes('technician')) return 'Kỹ thuật viên cận lâm sàng'
    return 'Bệnh nhân'
  }

  // Tải thông tin hồ sơ
  useEffect(() => {
    if (!isOpen || !currentUser?.id) return

    setIsEditing(false)
    setAlertMsg(null)
    setLoading(true)

    const fetchProfile = async () => {
      try {
        if (isStaff) {
          const res = await fetch(`/api/staff/me?userId=${currentUser.id}`)
          if (res.ok) {
            const data: StaffProfileData = await res.json()
            if (data && data.id) {
              setStaffData(data)
              setFormData({
                fullName: data.fullName || '',
                gender: data.gender || 'MALE',
                dateOfBirth: data.dateOfBirth || '',
                phone: data.phone || currentUser.phone || '',
                email: data.email || currentUser.email || '',
                identityCard: data.idCardNumber || '',
                address: data.address || '',
                emergencyContactName: '',
                emergencyContactPhone: '',
                bloodGroup: '',
                drugAllergies: '',
                biography: data.biography || '',
              })
            }
          }
        } else {
          // Bệnh nhân
          const res = await fetch(`/api/patients/profile/me?userId=${currentUser.id}`)
          if (res.ok) {
            const data = await res.json()
            if (data && data.id) {
              setPatientData(data)
              setFormData({
                fullName: data.fullName || '',
                gender: data.gender || 'MALE',
                dateOfBirth: data.dateOfBirth || '',
                phone: data.phone || currentUser.phone || '',
                email: data.email || currentUser.email || '',
                identityCard: data.identityCard || '',
                address: data.address || '',
                emergencyContactName: data.emergencyContactName || '',
                emergencyContactPhone: data.emergencyContactPhone || '',
                bloodGroup: data.bloodGroup || '',
                drugAllergies: data.drugAllergies || '',
                biography: '',
              })
            }
          }
        }
      } catch (err) {
        console.error('Lỗi tải thông tin cá nhân:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [isOpen, currentUser?.id, isStaff])

  if (!isOpen || !currentUser) return null

  // Lưu chỉnh sửa thông tin cá nhân
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setAlertMsg(null)

    try {
      if (isStaff && staffData?.id) {
        const updatePayload = {
          fullName: formData.fullName,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth || null,
          idCardNumber: formData.identityCard || null,
          address: formData.address || null,
          phone: formData.phone || null,
          email: formData.email || null,
          biography: isDoctor ? formData.biography : undefined,
        }

        const res = await fetch(`/api/staff/${staffData.id}?actorUserId=${currentUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        })

        const result = await res.json()
        if (res.ok) {
          setAlertMsg({ type: 'success', text: 'Cập nhật thông tin cá nhân thành công!' })
          setIsEditing(false)
          // Tải lại thông tin staff mới
          const refetch = await fetch(`/api/staff/me?userId=${currentUser.id}`)
          if (refetch.ok) {
            setStaffData(await refetch.json())
          }
        } else {
          setAlertMsg({ type: 'error', text: result.message || 'Cập nhật thất bại. Vui lòng kiểm tra lại.' })
        }
      } else if (patientData?.id) {
        const updatePayload = {
          fullName: formData.fullName,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth || null,
          phone: formData.phone,
          email: formData.email || null,
          identityCard: formData.identityCard || null,
          address: formData.address || null,
          emergencyContactName: formData.emergencyContactName || null,
          emergencyContactPhone: formData.emergencyContactPhone || null,
          bloodGroup: formData.bloodGroup || null,
          drugAllergies: formData.drugAllergies || null,
        }

        const res = await fetch(`/api/patients/${patientData.id}?requesterId=${currentUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        })

        const result = await res.json()
        if (res.ok) {
          setAlertMsg({ type: 'success', text: 'Cập nhật hồ sơ bệnh nhân thành công!' })
          setIsEditing(false)
          // Tải lại thông tin patient mới
          const refetch = await fetch(`/api/patients/profile/me?userId=${currentUser.id}`)
          if (refetch.ok) {
            setPatientData(await refetch.json())
          }
        } else {
          setAlertMsg({ type: 'error', text: result.message || 'Cập nhật thất bại. Vui lòng thử lại.' })
        }
      } else {
        setAlertMsg({ type: 'error', text: 'Chưa tìm thấy liên kết hồ sơ để cập nhật.' })
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: 'Lỗi kết nối máy chủ: ' + (err.message || '') })
    } finally {
      setSubmitting(false)
    }
  }

  const displayName = isStaff
    ? staffData?.fullName || currentUser.username
    : patientData?.fullName || currentUser.username

  const displayCode = isStaff
    ? staffData?.staffCode || `USER-${currentUser.id}`
    : patientData?.patientCode || `BN-${currentUser.id}`

  const initialLetter = (displayName || 'U').charAt(0).toUpperCase()

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
        animation: 'fadeInProfile 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header Hero Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
            padding: '24px 28px',
            color: '#ffffff',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#ffffff',
                color: '#0f766e',
                fontSize: '28px',
                fontWeight: 800,
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                flexShrink: 0,
              }}
            >
              {initialLetter}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, letterSpacing: '0.3px' }}>
                  {displayName}
                </h2>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.22)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  {getRoleDisplayName()}
                </span>
              </div>
              <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <span>Mã định danh: <strong>{displayCode}</strong></span>
                <span>Tài khoản: <strong>@{currentUser.username}</strong></span>
                <span>Trạng thái: <strong style={{ color: '#86efac' }}>Đang hoạt động</strong></span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.18)',
              border: 'none',
              color: '#ffffff',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              transition: 'background 0.2s',
            }}
            title="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Thông báo Alert */}
        {alertMsg && (
          <div
            style={{
              padding: '10px 24px',
              background: alertMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
              color: alertMsg.type === 'success' ? '#065f46' : '#991b1b',
              borderBottom: `1px solid ${alertMsg.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              fontSize: '13.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{alertMsg.text}</span>
            <button
              onClick={() => setAlertMsg(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 800 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Nội dung chính cuộn dọc */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--muted)' }}>
              Đang tải dữ liệu hồ sơ cá nhân...
            </div>
          ) : isEditing ? (
            /* =============================================================== */
            /* FORM CHỈNH SỬA THÔNG TIN CÁ NHÂN */
            /* =============================================================== */
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: 'var(--primary-dark)', fontWeight: 750 }}>
                  Chỉnh sửa thông tin định danh & liên hệ
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 650, marginBottom: '6px' }}>
                      Họ và tên <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 650, marginBottom: '6px' }}>
                      Giới tính
                    </label>
                    <select
                      className="form-control"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                    >
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 650, marginBottom: '6px' }}>
                      Ngày sinh
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 650, marginBottom: '6px' }}>
                      Số điện thoại liên hệ <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 650, marginBottom: '6px' }}>
                      Địa chỉ Email
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 650, marginBottom: '6px' }}>
                      Số CMND / CCCD
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.identityCard}
                      onChange={(e) => setFormData({ ...formData, identityCard: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 650, marginBottom: '6px' }}>
                      Địa chỉ thường trú / Chỗ ở hiện nay
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Phần riêng cho Bệnh nhân */}
              {isPatient && (
                <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#0369a1', fontWeight: 750 }}>
                    Thông tin y tế & Liên hệ khẩn cấp
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 650, marginBottom: '6px' }}>
                        Nhóm máu
                      </label>
                      <select
                        className="form-control"
                        value={formData.bloodGroup}
                        onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                      >
                        <option value="">-- Chưa xác định --</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 650, marginBottom: '6px' }}>
                        Người liên hệ khẩn cấp
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.emergencyContactName}
                        onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                        placeholder="Họ tên người thân"
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 650, marginBottom: '6px' }}>
                        SĐT người liên hệ khẩn cấp
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        value={formData.emergencyContactPhone}
                        onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                        placeholder="Số điện thoại người thân"
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                      />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 650, marginBottom: '6px', color: '#dc2626' }}>
                        Tiền sử dị ứng thuốc & Thực phẩm
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.drugAllergies}
                        onChange={(e) => setFormData({ ...formData, drugAllergies: e.target.value })}
                        placeholder="Ghi rõ các loại thuốc, kháng sinh bị dị ứng nếu có..."
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Phần riêng cho Bác sĩ */}
              {isDoctor && (
                <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', color: '#047857', fontWeight: 750 }}>
                    Tiểu sử tóm tắt chuyên môn bác sĩ
                  </h3>
                  <div>
                    <textarea
                      rows={4}
                      value={formData.biography}
                      onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                      placeholder="Tóm tắt quá trình công tác, bệnh viện từng làm việc và thế mạnh điều trị..."
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setIsEditing(false)}
                  disabled={submitting}
                  style={{ padding: '8px 18px', fontWeight: 650 }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ padding: '8px 22px', fontWeight: 700 }}
                >
                  {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          ) : (
            /* =============================================================== */
            /* CHẾ ĐỘ XEM THÔNG TIN CÁ NHÂN CHI TIẾT */
            /* =============================================================== */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Thẻ 1: Thông tin định danh & liên hệ */}
              <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px 24px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--primary-dark)', fontWeight: 750, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🪪</span>
                    <span>Hồ sơ định danh & Liên hệ</span>
                  </h3>
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      background: '#f0fdfa',
                      color: 'var(--primary-dark)',
                      border: '1px solid var(--primary-light)',
                      borderRadius: '8px',
                      padding: '5px 12px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>✏️</span>
                    <span>Chỉnh sửa thông tin</span>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '13.5px' }}>
                  <div>
                    <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Họ và tên</span>
                    <strong>{displayName}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Giới tính</span>
                    <strong>{formData.gender === 'FEMALE' ? 'Nữ' : formData.gender === 'MALE' ? 'Nam' : 'Khác'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Ngày sinh</span>
                    <strong>{formData.dateOfBirth || 'Chưa cập nhật'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Số điện thoại</span>
                    <strong style={{ color: '#0369a1' }}>{formData.phone || 'Chưa cập nhật'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Địa chỉ Email</span>
                    <strong>{formData.email || 'Chưa cập nhật'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Số CMND / CCCD</span>
                    <strong>{formData.identityCard || 'Chưa cập nhật'}</strong>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Địa chỉ thường trú</span>
                    <strong>{formData.address || 'Chưa cập nhật'}</strong>
                  </div>
                </div>
              </div>

              {/* Thẻ 2: Thông tin chuyên môn y tế (nếu là nhân sự / bác sĩ) */}
              {isStaff && (
                <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px 24px', border: '1px solid var(--border)' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#4338ca', fontWeight: 750, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🩺</span>
                    <span>Thông tin công tác & Chuyên môn y tế</span>
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '13.5px' }}>
                    <div>
                      <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Mã nhân viên y tế</span>
                      <strong style={{ color: '#4338ca', fontSize: '14px' }}>{staffData?.staffCode}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Khoa / Bộ phận công tác</span>
                      <strong>{staffData?.departmentName || 'Chưa phân bổ'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Trình độ / Học vị</span>
                      <strong>{staffData?.qualification || 'Chưa cập nhật'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Ngày tiếp nhận công tác</span>
                      <strong>{staffData?.hireDate || 'Chưa cập nhật'}</strong>
                    </div>

                    {/* Dành riêng cho Bác sĩ */}
                    {isDoctor && (
                      <>
                        <div>
                          <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Chứng chỉ hành nghề (CCHN)</span>
                          <strong style={{ color: '#047857' }}>{staffData?.licenseNumber || 'Chưa cập nhật'}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Chuyên khoa điều trị</span>
                          <strong style={{ color: '#047857' }}>{staffData?.specialty || 'Nội khoa'}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Kinh nghiệm chuyên môn</span>
                          <strong>{staffData?.yearsOfExperience || 0} năm công tác</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Giá công khám chuẩn</span>
                          <strong>{staffData?.consultationFee ? staffData.consultationFee.toLocaleString('vi-VN') + ' đ' : '200.000 đ'}</strong>
                        </div>
                        {staffData?.biography && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Tóm tắt tiểu sử chuyên môn</span>
                            <p style={{ margin: '4px 0 0 0', lineHeight: 1.5, color: '#334155' }}>{staffData.biography}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Thẻ 3: Thông tin bảo hiểm & y tế bệnh nhân */}
              {isPatient && (
                <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px 24px', border: '1px solid var(--border)' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#0369a1', fontWeight: 750, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>❤️</span>
                    <span>Thông tin bảo hiểm & Hồ sơ sức khỏe</span>
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '13.5px' }}>
                    <div>
                      <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Mã bệnh nhân</span>
                      <strong style={{ color: 'var(--primary-dark)', fontSize: '14px' }}>{patientData?.patientCode}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Mã số thẻ BHYT</span>
                      <strong style={{ color: '#0369a1' }}>{patientData?.healthInsuranceNumber || 'Chưa cập nhật'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Nhóm máu</span>
                      <strong style={{ color: '#dc2626' }}>{patientData?.bloodGroup || 'Chưa xác định'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Số lần đến khám</span>
                      <strong>{patientData?.totalVisits || 0} lượt</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Người thân liên hệ khẩn cấp</span>
                      <strong>{patientData?.emergencyContactName || 'Chưa cập nhật'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>SĐT khẩn cấp</span>
                      <strong>{patientData?.emergencyContactPhone || 'Chưa cập nhật'}</strong>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Dị ứng thuốc & Thực phẩm</span>
                      <strong style={{ color: patientData?.drugAllergies ? '#dc2626' : '#16a34a' }}>
                        {patientData?.drugAllergies || 'Không ghi nhận tiền sử dị ứng'}
                      </strong>
                    </div>
                    {patientData?.medicalHistory && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Tiền sử bệnh lý</span>
                        <p style={{ margin: '4px 0 0 0', lineHeight: 1.5 }}>{patientData.medicalHistory}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Thẻ 4: Thông tin tài khoản & Bảo mật */}
              <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px 24px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--ink)', fontWeight: 750, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🔐</span>
                    <span>Tài khoản & Bảo mật</span>
                  </h3>
                  {onOpenChangePassword && (
                    <button
                      onClick={() => {
                        onClose()
                        onOpenChangePassword()
                      }}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '12.5px',
                        fontWeight: 650,
                        cursor: 'pointer',
                        color: 'var(--ink)',
                      }}
                    >
                      Đổi mật khẩu đăng nhập
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '13.5px' }}>
                  <div>
                    <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Tên đăng nhập (Username)</span>
                    <strong>{currentUser.username}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Mã tài khoản hệ thống</span>
                    <strong>ID #{currentUser.id}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Đăng nhập gần nhất</span>
                    <strong>{currentUser.lastLoginAt ? new Date(currentUser.lastLoginAt).toLocaleString('vi-VN') : 'Mới đăng nhập'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 28px',
            borderTop: '1px solid var(--border)',
            background: '#ffffff',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
            style={{ padding: '8px 24px', fontWeight: 650 }}
          >
            Đóng
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInProfile {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
