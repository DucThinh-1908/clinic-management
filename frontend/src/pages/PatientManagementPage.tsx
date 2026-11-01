import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { AuthUser, PatientDetail, MedicalRecordSummary } from '../types'

interface PatientManagementPageProps {
  currentUser: AuthUser | null
}

export const PatientManagementPage: React.FC<PatientManagementPageProps> = ({ currentUser }) => {
  const isPatientOnly = Boolean(
    currentUser &&
      currentUser.roles &&
      currentUser.roles.length === 1 &&
      currentUser.roles[0].toLowerCase() === 'patient'
  )

  const isDoctor = Boolean(
    currentUser &&
      currentUser.roles &&
      currentUser.roles.some((r) => ['doctor', 'manager', 'admin'].includes(r.toLowerCase()))
  )

  const isReceptionist = Boolean(
    currentUser &&
      currentUser.roles &&
      currentUser.roles.some((r) => ['receptionist', 'manager', 'admin'].includes(r.toLowerCase()))
  )

  const isManagerOrAdmin = Boolean(
    currentUser &&
      currentUser.roles &&
      currentUser.roles.some((r) => ['manager', 'admin'].includes(r.toLowerCase()))
  )

  // Danh sách & Tìm kiếm
  const [patients, setPatients] = useState<PatientDetail[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [alertMessage, setAlertMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Chi tiết bệnh nhân đang chọn & Lịch sử khám
  const [selectedPatient, setSelectedPatient] = useState<PatientDetail | null>(null)
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordSummary[]>([])
  const [isLoadingRecords, setIsLoadingRecords] = useState(false)

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditAdminModal, setShowEditAdminModal] = useState(false)
  const [showEditMedicalModal, setShowEditMedicalModal] = useState(false)
  const [showEditInsuranceModal, setShowEditInsuranceModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [showToggleActiveModal, setShowToggleActiveModal] = useState(false)

  // Form states: Tạo mới (UC-BN01)
  const [createForm, setCreateForm] = useState({
    fullName: '',
    gender: 'MALE',
    dateOfBirth: '',
    phone: '',
    email: '',
    identityCard: '',
    healthInsuranceNumber: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bloodGroup: 'UNKNOWN',
    medicalHistory: '',
    drugAllergies: '',
  })

  // Form states: Cập nhật hành chính (UC-BN03)
  const [editAdminForm, setEditAdminForm] = useState({
    fullName: '',
    gender: 'MALE',
    dateOfBirth: '',
    phone: '',
    email: '',
    identityCard: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  })

  // Form states: Tiền sử & dị ứng (UC-BN04)
  const [editMedicalForm, setEditMedicalForm] = useState({
    bloodGroup: 'UNKNOWN',
    medicalHistory: '',
    drugAllergies: '',
  })

  // Form states: Bảo hiểm y tế (UC-BN05)
  const [editInsuranceForm, setEditInsuranceForm] = useState({
    healthInsuranceNumber: '',
  })

  // Form states: Gộp hồ sơ (UC-BN07)
  const [mergeForm, setMergeForm] = useState({
    primaryPatientId: 0,
    duplicatePatientId: 0,
    note: '',
  })

  // Form states: Vô hiệu hóa / kích hoạt (UC-BN07)
  const [toggleActiveForm, setToggleActiveForm] = useState({
    isActive: false,
    reason: '',
  })

  // Patient profile (cho bệnh nhân tự xem hồ sơ)
  const [myPatientProfile, setMyPatientProfile] = useState<PatientDetail | null>(null)
  const [hasNoProfile, setHasNoProfile] = useState(false)

  const requesterId = currentUser?.id

  const showAlert = (text: string, type: 'success' | 'error' = 'success') => {
    setAlertMessage({ text, type })
    setTimeout(() => {
      setAlertMessage(null)
    }, 6000)
  }

  // Tải danh sách bệnh nhân
  const fetchPatients = async (keyword = searchKeyword, onlyActive = activeOnly) => {
    if (!currentUser) return
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (keyword.trim()) params.append('keyword', keyword.trim())
      params.append('activeOnly', String(onlyActive))
      if (requesterId) params.append('requesterId', String(requesterId))

      const res = await fetch(`/api/patients/search?${params.toString()}`, {
        headers: {
          'X-Requester-Id': String(requesterId || ''),
        },
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Lỗi tải danh sách bệnh nhân')
      }
      const data: PatientDetail[] = await res.json()
      setPatients(data)
    } catch (err: any) {
      showAlert(err.message || 'Không thể tải danh sách bệnh nhân', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Tải hồ sơ bệnh nhân của người dùng đăng nhập
  const fetchMyProfile = async () => {
    if (!currentUser) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/patients/profile/me?userId=${currentUser.id}`, {
        headers: {
          'X-Requester-Id': String(currentUser.id),
        },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.exists === false) {
          setHasNoProfile(true)
          setMyPatientProfile(null)
        } else {
          setMyPatientProfile(data)
          setHasNoProfile(false)
          fetchMedicalRecords(data.id)
        }
      }
    } catch {
      setHasNoProfile(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Tải lịch sử khám bệnh (UC-BN06)
  const fetchMedicalRecords = async (patientId: number) => {
    setIsLoadingRecords(true)
    try {
      const res = await fetch(`/api/patients/${patientId}/medical-records?requesterId=${requesterId || ''}`, {
        headers: {
          'X-Requester-Id': String(requesterId || ''),
        },
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Lỗi tải lịch sử khám bệnh')
      }
      const data: MedicalRecordSummary[] = await res.json()
      setMedicalRecords(data)
    } catch (err: any) {
      showAlert(err.message || 'Không thể tải lịch sử khám bệnh', 'error')
    } finally {
      setIsLoadingRecords(false)
    }
  }

  useEffect(() => {
    if (isPatientOnly) {
      fetchMyProfile()
    } else {
      fetchPatients()
    }
  }, [currentUser, isPatientOnly, activeOnly])

  // Xử lý tạo mới hồ sơ bệnh nhân (UC-BN01)
  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const body: any = {
        ...createForm,
        dateOfBirth: createForm.dateOfBirth,
      }
      if (isPatientOnly && currentUser) {
        body.userId = currentUser.id
      }

      const res = await fetch(`/api/patients?requesterId=${requesterId || ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requester-Id': String(requesterId || ''),
        },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Không thể tạo hồ sơ bệnh nhân')
      }

      showAlert(`Đăng ký hồ sơ bệnh nhân thành công! Mã hồ sơ: ${data.patientCode}`, 'success')
      setShowCreateModal(false)
      setCreateForm({
        fullName: '',
        gender: 'MALE',
        dateOfBirth: '',
        phone: '',
        email: '',
        identityCard: '',
        healthInsuranceNumber: '',
        address: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        bloodGroup: 'UNKNOWN',
        medicalHistory: '',
        drugAllergies: '',
      })

      if (isPatientOnly) {
        fetchMyProfile()
      } else {
        fetchPatients()
      }
    } catch (err: any) {
      showAlert(err.message, 'error')
    }
  }

  // Mở modal cập nhật thông tin hành chính (UC-BN03)
  const openEditAdmin = (patient: PatientDetail) => {
    setSelectedPatient(patient)
    setEditAdminForm({
      fullName: patient.fullName,
      gender: patient.gender,
      dateOfBirth: patient.dateOfBirth,
      phone: patient.phone,
      email: patient.email || '',
      identityCard: patient.identityCard || '',
      address: patient.address || '',
      emergencyContactName: patient.emergencyContactName || '',
      emergencyContactPhone: patient.emergencyContactPhone || '',
    })
    setShowEditAdminModal(true)
  }

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) return
    try {
      const res = await fetch(`/api/patients/${selectedPatient.id}?requesterId=${requesterId || ''}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Requester-Id': String(requesterId || ''),
        },
        body: JSON.stringify(editAdminForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Lỗi cập nhật hành chính')
      showAlert(`Cập nhật thông tin bệnh nhân ${data.fullName} thành công!`, 'success')
      setShowEditAdminModal(false)
      fetchPatients()
    } catch (err: any) {
      showAlert(err.message, 'error')
    }
  }

  // Mở modal tiền sử bệnh và dị ứng (UC-BN04)
  const openEditMedical = (patient: PatientDetail) => {
    setSelectedPatient(patient)
    setEditMedicalForm({
      bloodGroup: patient.bloodGroup || 'UNKNOWN',
      medicalHistory: patient.medicalHistory || '',
      drugAllergies: patient.drugAllergies || '',
    })
    setShowEditMedicalModal(true)
  }

  const handleUpdateMedical = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) return
    try {
      const res = await fetch(`/api/patients/${selectedPatient.id}/medical-history?requesterId=${requesterId || ''}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Requester-Id': String(requesterId || ''),
        },
        body: JSON.stringify(editMedicalForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Lỗi cập nhật tiền sử bệnh')
      showAlert(`Bác sĩ đã cập nhật thành công tiền sử bệnh và dị ứng cho ${data.fullName}!`, 'success')
      setShowEditMedicalModal(false)
      fetchPatients()
    } catch (err: any) {
      showAlert(err.message, 'error')
    }
  }

  // Mở modal bảo hiểm y tế (UC-BN05)
  const openEditInsurance = (patient: PatientDetail) => {
    setSelectedPatient(patient)
    setEditInsuranceForm({
      healthInsuranceNumber: patient.healthInsuranceNumber || '',
    })
    setShowEditInsuranceModal(true)
  }

  const handleUpdateInsurance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) return
    try {
      const res = await fetch(`/api/patients/${selectedPatient.id}/insurance?requesterId=${requesterId || ''}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Requester-Id': String(requesterId || ''),
        },
        body: JSON.stringify(editInsuranceForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Lỗi cập nhật thẻ BHYT')
      showAlert(`Lễ tân đã cập nhật thẻ BHYT cho bệnh nhân ${data.fullName} thành công!`, 'success')
      setShowEditInsuranceModal(false)
      fetchPatients()
    } catch (err: any) {
      showAlert(err.message, 'error')
    }
  }

  // Mở xem lịch sử khám bệnh (UC-BN06)
  const openHistory = (patient: PatientDetail) => {
    setSelectedPatient(patient)
    fetchMedicalRecords(patient.id)
    setShowHistoryModal(true)
  }

  // Mở modal gộp hồ sơ (UC-BN07)
  const openMergeModal = (patient: PatientDetail) => {
    setSelectedPatient(patient)
    setMergeForm({
      primaryPatientId: patient.id,
      duplicatePatientId: 0,
      note: '',
    })
    setShowMergeModal(true)
  }

  const handleMergePatients = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mergeForm.primaryPatientId || !mergeForm.duplicatePatientId) {
      showAlert('Vui lòng chọn hồ sơ trùng lặp cần gộp vào hồ sơ gốc.', 'error')
      return
    }
    if (mergeForm.primaryPatientId === mergeForm.duplicatePatientId) {
      showAlert('Hồ sơ gốc và hồ sơ trùng lặp không được trùng nhau.', 'error')
      return
    }

    try {
      const res = await fetch(`/api/patients/merge?requesterId=${requesterId || ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requester-Id': String(requesterId || ''),
        },
        body: JSON.stringify(mergeForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Lỗi gộp hồ sơ trùng lặp')
      showAlert(`Gộp hồ sơ trùng lặp thành công vào hồ sơ gốc ${data.patientCode}!`, 'success')
      setShowMergeModal(false)
      fetchPatients()
    } catch (err: any) {
      showAlert(err.message, 'error')
    }
  }

  // Mở modal vô hiệu hóa / kích hoạt (UC-BN07)
  const openToggleActiveModal = (patient: PatientDetail) => {
    setSelectedPatient(patient)
    setToggleActiveForm({
      isActive: !patient.isActive,
      reason: '',
    })
    setShowToggleActiveModal(true)
  }

  const handleToggleActive = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) return
    try {
      const res = await fetch(`/api/patients/${selectedPatient.id}/status?requesterId=${requesterId || ''}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Requester-Id': String(requesterId || ''),
        },
        body: JSON.stringify(toggleActiveForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Lỗi thay đổi trạng thái hồ sơ')
      showAlert(
        `Đã ${data.isActive ? 'kích hoạt lại' : 'vô hiệu hóa'} hồ sơ ${data.patientCode} thành công!`,
        'success'
      )
      setShowToggleActiveModal(false)
      fetchPatients()
    } catch (err: any) {
      showAlert(err.message, 'error')
    }
  }

  const formatGender = (g: string) => {
    if (g === 'MALE') return 'Nam'
    if (g === 'FEMALE') return 'Nữ'
    return 'Khác'
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    try {
      const [y, m, d] = dateStr.split('T')[0].split('-')
      return `${d}/${m}/${y}`
    } catch {
      return dateStr
    }
  }

  if (!currentUser) {
    return (
      <main className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', background: '#fff', padding: '36px', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}>
          <h2 style={{ fontSize: '22px', color: 'var(--ink)', marginBottom: '12px' }}>Yêu cầu đăng nhập</h2>
          <p style={{ color: 'var(--muted)', fontSize: '15px', marginBottom: '24px' }}>
            Vui lòng đăng nhập tài khoản nhân viên y tế (Lễ tân, Bác sĩ, Quản lý) hoặc Bệnh nhân để truy cập phân hệ hồ sơ bệnh nhân.
          </p>
          <Link to="/dang-nhap" className="btn btn-primary" style={{ width: '100%' }}>
            Đăng nhập ngay
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main style={{ background: '#f8fafc', minHeight: '85vh', padding: '32px 0 60px' }}>
      <div className="container">
        {/* Thông báo Alert */}
        {alertMessage && (
          <div
            style={{
              padding: '14px 20px',
              borderRadius: '10px',
              marginBottom: '20px',
              fontSize: '14.5px',
              fontWeight: 600,
              background: alertMessage.type === 'success' ? '#def7ec' : '#fde8e8',
              color: alertMessage.type === 'success' ? '#03543f' : '#9b1c1c',
              border: `1px solid ${alertMessage.type === 'success' ? '#31c48d' : '#f98080'}`,
            }}
          >
            {alertMessage.text}
          </div>
        )}

        {/* Chế độ dành cho Bệnh nhân */}
        {isPatientOnly ? (
          <div>
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '6px' }}>
                Cổng Tra cứu Hồ sơ Sức khỏe Cá nhân
              </h1>
              <p style={{ color: 'var(--muted)', fontSize: '15px' }}>
                Theo dõi thông tin hành chính, thẻ bảo hiểm y tế, tiền sử bệnh mạn tính và lịch sử các đợt khám tại CarePlus Clinic.
              </p>
            </div>

            {hasNoProfile ? (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '36px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '19px', color: 'var(--ink)', marginBottom: '10px' }}>
                  Chưa tìm thấy hồ sơ bệnh nhân liên kết
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: '14.5px', marginBottom: '24px', maxWidth: '520px', margin: '0 auto 24px' }}>
                  Tài khoản của quý khách chưa được gắn với hồ sơ tiếp đón bệnh nhân. Quý khách có thể tự tạo hồ sơ tiếp đón ngay tại đây hoặc liên hệ quầy Lễ tân phòng khám để được hỗ trợ.
                </p>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                  Đăng ký hồ sơ bệnh nhân mới
                </button>
              </div>
            ) : myPatientProfile ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                {/* Thẻ tóm tắt thông tin hành chính & y tế */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)', height: 'fit-content' }}>
                  <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--primary)', background: '#e0f2f1', padding: '4px 10px', borderRadius: '20px' }}>
                        {myPatientProfile.patientCode}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: myPatientProfile.isActive ? '#0e9f6e' : '#9b1c1c' }}>
                        {myPatientProfile.isActive ? 'Hồ sơ đang hoạt động' : 'Hồ sơ tạm ngưng'}
                      </span>
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, marginTop: '10px', color: 'var(--ink)' }}>
                      {myPatientProfile.fullName}
                    </h2>
                    <div style={{ color: 'var(--muted)', fontSize: '13.5px' }}>
                      {formatGender(myPatientProfile.gender)} &bull; {myPatientProfile.age} tuổi (Sinh: {formatDate(myPatientProfile.dateOfBirth)})
                    </div>
                  </div>

                  <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <strong style={{ color: 'var(--ink)' }}>Số điện thoại:</strong>{' '}
                      <span style={{ color: 'var(--muted)' }}>{myPatientProfile.phone}</span>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--ink)' }}>Email:</strong>{' '}
                      <span style={{ color: 'var(--muted)' }}>{myPatientProfile.email || 'Chưa cập nhật'}</span>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--ink)' }}>Số CCCD/Hộ chiếu:</strong>{' '}
                      <span style={{ color: 'var(--muted)' }}>{myPatientProfile.identityCard || 'Chưa cập nhật'}</span>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--ink)' }}>Mã thẻ BHYT:</strong>{' '}
                      <span style={{ color: 'var(--primary-dark)', fontWeight: 700 }}>
                        {myPatientProfile.healthInsuranceNumber || 'Chưa cập nhật'}
                      </span>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--ink)' }}>Địa chỉ:</strong>{' '}
                      <span style={{ color: 'var(--muted)' }}>{myPatientProfile.address || 'Chưa cập nhật'}</span>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--ink)' }}>Người liên hệ khẩn cấp:</strong>{' '}
                      <span style={{ color: 'var(--muted)' }}>
                        {myPatientProfile.emergencyContactName ? `${myPatientProfile.emergencyContactName} (${myPatientProfile.emergencyContactPhone || ''})` : 'Chưa cập nhật'}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, fontSize: '14.5px', marginBottom: '8px', color: 'var(--primary-dark)' }}>
                      Thông tin Cảnh báo Sức khỏe
                    </div>
                    <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '10px', fontSize: '13.5px', marginBottom: '10px' }}>
                      <strong>Nhóm máu:</strong> {myPatientProfile.bloodGroup || 'Chưa xác định'}
                    </div>
                    <div style={{ background: '#f3f4f6', padding: '12px', borderRadius: '10px', fontSize: '13px', marginBottom: '10px' }}>
                      <strong>Tiền sử bệnh mạn tính:</strong>
                      <div style={{ marginTop: '4px', color: 'var(--ink)' }}>{myPatientProfile.medicalHistory || 'Không ghi nhận tiền sử bệnh đặc biệt.'}</div>
                    </div>
                    <div style={{ background: '#fee2e2', padding: '12px', borderRadius: '10px', fontSize: '13px' }}>
                      <strong style={{ color: '#991b1b' }}>Dị ứng thuốc & thực phẩm:</strong>
                      <div style={{ marginTop: '4px', color: '#991b1b', fontWeight: 600 }}>{myPatientProfile.drugAllergies || 'Không ghi nhận tiền sử dị ứng thuốc.'}</div>
                    </div>
                  </div>
                </div>

                {/* Danh sách các lần khám bệnh của bệnh nhân */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink)' }}>
                      Lịch sử Các Đợt Khám Bệnh ({medicalRecords.length})
                    </h3>
                    <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                      Tổng cộng {myPatientProfile.totalVisits} lượt thăm khám
                    </span>
                  </div>

                  {isLoadingRecords ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: 'var(--muted)' }}>Đang tải lịch sử khám...</div>
                  ) : medicalRecords.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', background: '#f8fafc', borderRadius: '12px' }}>
                      Chưa có ghi nhận phiên khám bệnh nào tại phòng khám.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {medicalRecords.map((rec) => (
                        <div
                          key={rec.id}
                          style={{
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            padding: '20px',
                            background: '#ffffff',
                            transition: 'border-color 0.2s',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div>
                              <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--primary-dark)' }}>
                                {rec.recordCode}
                              </span>
                              <span style={{ marginLeft: '12px', fontSize: '13px', color: 'var(--muted)' }}>
                                Ngày khám: {formatDate(rec.createdAt)}
                              </span>
                            </div>
                            <span style={{ background: '#def7ec', color: '#03543f', fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '12px' }}>
                              {rec.status === 'COMPLETED' ? 'Đã hoàn tất' : rec.status}
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13.5px', marginBottom: '12px' }}>
                            <div>
                              <span style={{ color: 'var(--muted)' }}>Bác sĩ khám:</span>{' '}
                              <strong>{rec.doctorName || 'Bác sĩ chuyên khoa'}</strong> ({rec.doctorQualification || 'Bác sĩ'})
                            </div>
                            <div>
                              <span style={{ color: 'var(--muted)' }}>Phòng khám:</span>{' '}
                              <strong>{rec.roomName || 'Phòng khám đa khoa'}</strong> ({rec.roomNumber || ''})
                            </div>
                          </div>

                          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '13.5px', marginBottom: '10px' }}>
                            <div>
                              <strong>Lý do vào khám:</strong> {rec.chiefComplaint}
                            </div>
                            <div style={{ marginTop: '6px' }}>
                              <strong style={{ color: 'var(--primary-dark)' }}>Chẩn đoán xác định:</strong>{' '}
                              <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{rec.finalDiagnosis}</span>
                              {rec.icd10Code && (
                                <span style={{ marginLeft: '8px', background: '#e0f2f1', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 }}>
                                  ICD-10: {rec.icd10Code}
                                </span>
                              )}
                            </div>
                          </div>

                          {rec.doctorAdvice && (
                            <div style={{ fontSize: '13px', color: 'var(--ink)', marginBottom: '8px' }}>
                              <strong>Lời dặn của bác sĩ:</strong> {rec.doctorAdvice}
                            </div>
                          )}

                          {rec.followUpDate && (
                            <div style={{ fontSize: '13px', color: '#b91c1c', fontWeight: 600 }}>
                              Hẹn tái khám vào ngày: {formatDate(rec.followUpDate)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          /* Chế độ dành cho Nhân viên Y tế (Lễ tân, Bác sĩ, Quản lý, Admin) */
          <div>
            {/* Header phân hệ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '4px' }}>
                  Quản lý Hồ sơ Bệnh nhân
                </h1>
                <p style={{ color: 'var(--muted)', fontSize: '14.5px' }}>
                  Tiếp đón, tra cứu thông tin hành chính, bảo hiểm y tế, tiền sử bệnh án và xử lý gộp hồ sơ trùng lặp.
                </p>
              </div>

              {isReceptionist && (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>+</span> Đăng ký hồ sơ bệnh nhân mới
                </button>
              )}
            </div>

            {/* Thanh tìm kiếm & bộ lọc */}
            <div style={{ background: '#fff', padding: '20px 24px', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', marginBottom: '24px' }}>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  fetchPatients()
                }}
                style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}
              >
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Tìm kiếm theo Họ tên, Số điện thoại, Mã bệnh nhân (BN...), CCCD hoặc Mã BHYT..."
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      fontSize: '14.5px',
                      outline: 'none',
                    }}
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={activeOnly}
                    onChange={(e) => setActiveOnly(e.target.checked)}
                  />
                  Chỉ hiện hồ sơ đang hoạt động
                </label>

                <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }}>
                  Tìm kiếm
                </button>

                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => {
                    setSearchKeyword('')
                    fetchPatients('', activeOnly)
                  }}
                  style={{ border: '1px solid var(--border)', padding: '10px 16px' }}
                >
                  Làm mới
                </button>
              </form>
            </div>

            {/* Bảng danh sách bệnh nhân */}
            <div style={{ background: '#fff', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--ink)' }}>
                  Danh sách Hồ sơ Bệnh nhân ({patients.length})
                </span>
                <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                  Nhấn vào từng hồ sơ để thực hiện thao tác tương ứng theo quyền hạn
                </span>
              </div>

              {isLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>Đang tìm kiếm dữ liệu bệnh nhân...</div>
              ) : patients.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
                  Không tìm thấy hồ sơ bệnh nhân nào phù hợp với từ khóa tìm kiếm.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', color: 'var(--muted)', fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                        <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>Mã bệnh nhân</th>
                        <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>Họ và tên</th>
                        <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>Giới tính / Tuổi</th>
                        <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>Số điện thoại</th>
                        <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>Thẻ BHYT / CCCD</th>
                        <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>Số lần khám</th>
                        <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>Trạng thái</th>
                        <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.map((p) => (
                        <tr
                          key={p.id}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background 0.15s',
                            opacity: p.isActive ? 1 : 0.7,
                          }}
                        >
                          <td style={{ padding: '14px 20px', fontWeight: 800, color: 'var(--primary-dark)' }}>
                            {p.patientCode}
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{p.fullName}</div>
                            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{p.address || 'Chưa có địa chỉ'}</div>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            {formatGender(p.gender)} &bull; {p.age ? `${p.age} tuổi` : formatDate(p.dateOfBirth)}
                          </td>
                          <td style={{ padding: '14px 20px', fontWeight: 600 }}>{p.phone}</td>
                          <td style={{ padding: '14px 20px', fontSize: '13px' }}>
                            <div>BHYT: {p.healthInsuranceNumber ? <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{p.healthInsuranceNumber}</span> : '-'}</div>
                            <div style={{ color: 'var(--muted)' }}>CCCD: {p.identityCard || '-'}</div>
                          </td>
                          <td style={{ padding: '14px 20px', fontWeight: 700, textAlign: 'center' }}>
                            {p.totalVisits}
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            {p.mergedIntoId ? (
                              <span style={{ background: '#e1effe', color: '#1e429f', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                                Đã gộp vào {p.mergedIntoCode || `ID ${p.mergedIntoId}`}
                              </span>
                            ) : p.isActive ? (
                              <span style={{ background: '#def7ec', color: '#03543f', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                                Hoạt động
                              </span>
                            ) : (
                              <span style={{ background: '#fde8e8', color: '#9b1c1c', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                                Tạm ngừng
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              {/* Xem lịch sử khám (Tất cả bác sĩ / lễ tân) */}
                              <button
                                className="btn btn-light btn-sm"
                                onClick={() => openHistory(p)}
                                title="Xem lịch sử khám bệnh"
                                style={{ padding: '4px 10px', fontSize: '12px', border: '1px solid var(--border)' }}
                              >
                                Lịch sử khám
                              </button>

                              {/* Lễ tân: Cập nhật thông tin hành chính */}
                              {isReceptionist && (
                                <button
                                  className="btn btn-light btn-sm"
                                  onClick={() => openEditAdmin(p)}
                                  disabled={!p.isActive}
                                  title="Cập nhật thông tin hành chính"
                                  style={{ padding: '4px 10px', fontSize: '12px', border: '1px solid var(--border)' }}
                                >
                                  Sửa hành chính
                                </button>
                              )}

                              {/* Bác sĩ: Cập nhật tiền sử bệnh & dị ứng */}
                              {isDoctor && (
                                <button
                                  className="btn btn-light btn-sm"
                                  onClick={() => openEditMedical(p)}
                                  disabled={!p.isActive}
                                  title="Quản lý tiền sử bệnh và dị ứng"
                                  style={{ padding: '4px 10px', fontSize: '12px', border: '1px solid var(--border)', color: '#047481' }}
                                >
                                  Tiền sử & Dị ứng
                                </button>
                              )}

                              {/* Lễ tân: Cập nhật thẻ BHYT */}
                              {isReceptionist && (
                                <button
                                  className="btn btn-light btn-sm"
                                  onClick={() => openEditInsurance(p)}
                                  disabled={!p.isActive}
                                  title="Cập nhật thẻ bảo hiểm y tế"
                                  style={{ padding: '4px 10px', fontSize: '12px', border: '1px solid var(--border)' }}
                                >
                                  Thẻ BHYT
                                </button>
                              )}

                              {/* Quản lý: Gộp hồ sơ trùng */}
                              {isManagerOrAdmin && !p.mergedIntoId && (
                                <button
                                  className="btn btn-light btn-sm"
                                  onClick={() => openMergeModal(p)}
                                  title="Gộp hồ sơ bệnh nhân trùng lặp"
                                  style={{ padding: '4px 10px', fontSize: '12px', border: '1px solid var(--border)', color: '#4b5563' }}
                                >
                                  Gộp hồ sơ
                                </button>
                              )}

                              {/* Quản lý: Bật/tắt trạng thái hoạt động */}
                              {isManagerOrAdmin && !p.mergedIntoId && (
                                <button
                                  className="btn btn-light btn-sm"
                                  onClick={() => openToggleActiveModal(p)}
                                  title={p.isActive ? 'Vô hiệu hóa hồ sơ' : 'Kích hoạt lại hồ sơ'}
                                  style={{
                                    padding: '4px 10px',
                                    fontSize: '12px',
                                    border: '1px solid var(--border)',
                                    color: p.isActive ? '#e02424' : '#0e9f6e',
                                  }}
                                >
                                  {p.isActive ? 'Khóa' : 'Mở lại'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL 1: Đăng ký hồ sơ bệnh nhân mới (UC-BN01) */}
        {showCreateModal && (
          <div className="modal-backdrop">
            <div className="modal-card" style={{ maxWidth: '680px' }}>
              <div className="modal-header">
                <h3>Đăng ký Hồ sơ Bệnh nhân Mới</h3>
                <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                  &times;
                </button>
              </div>
              <form onSubmit={handleCreatePatient} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Họ và tên bệnh nhân (*)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Nguyễn Văn An"
                      value={createForm.fullName}
                      onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                      className="form-control"
                      style={{ height: '42px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Giới tính (*)</label>
                    <select
                      value={createForm.gender}
                      onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })}
                      className="form-control"
                      style={{ height: '42px' }}
                    >
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Ngày sinh (*)</label>
                    <input
                      type="date"
                      required
                      value={createForm.dateOfBirth}
                      onChange={(e) => setCreateForm({ ...createForm, dateOfBirth: e.target.value })}
                      className="form-control"
                      style={{ height: '42px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Số điện thoại liên hệ (*)</label>
                    <input
                      type="tel"
                      required
                      placeholder="Ví dụ: 0912345678"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      className="form-control"
                      style={{ height: '42px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      placeholder="Địa chỉ email liên hệ"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      className="form-control"
                      style={{ height: '42px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Số CCCD / Hộ chiếu</label>
                    <input
                      type="text"
                      placeholder="12 chữ số CCCD"
                      value={createForm.identityCard}
                      onChange={(e) => setCreateForm({ ...createForm, identityCard: e.target.value })}
                      className="form-control"
                      style={{ height: '42px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Mã thẻ BHYT</label>
                    <input
                      type="text"
                      placeholder="Mã thẻ BHYT (ví dụ: DN401...)"
                      value={createForm.healthInsuranceNumber}
                      onChange={(e) => setCreateForm({ ...createForm, healthInsuranceNumber: e.target.value.toUpperCase() })}
                      className="form-control"
                      style={{ height: '42px', letterSpacing: '0.5px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nhóm máu</label>
                    <select
                      value={createForm.bloodGroup}
                      onChange={(e) => setCreateForm({ ...createForm, bloodGroup: e.target.value })}
                      className="form-control"
                      style={{ height: '42px' }}
                    >
                      <option value="UNKNOWN">Chưa xác định</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Địa chỉ cư trú</label>
                  <input
                    type="text"
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    value={createForm.address}
                    onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                    className="form-control"
                    style={{ height: '42px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Người liên hệ khẩn cấp</label>
                    <input
                      type="text"
                      placeholder="Họ tên người thân"
                      value={createForm.emergencyContactName}
                      onChange={(e) => setCreateForm({ ...createForm, emergencyContactName: e.target.value })}
                      className="form-control"
                      style={{ height: '42px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SĐT người liên hệ</label>
                    <input
                      type="tel"
                      placeholder="Số điện thoại người thân"
                      value={createForm.emergencyContactPhone}
                      onChange={(e) => setCreateForm({ ...createForm, emergencyContactPhone: e.target.value })}
                      className="form-control"
                      style={{ height: '42px' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tiền sử bệnh mạn tính ban đầu</label>
                  <textarea
                    rows={3}
                    placeholder="Ví dụ: Tăng huyết áp, tiểu đường tuýp 2, hen phế quản..."
                    value={createForm.medicalHistory}
                    onChange={(e) => setCreateForm({ ...createForm, medicalHistory: e.target.value })}
                    className="form-control"
                    style={{ minHeight: '80px' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tiền sử dị ứng thuốc ban đầu</label>
                  <textarea
                    rows={3}
                    placeholder="Ví dụ: Dị ứng kháng sinh nhóm Penicillin, Paracetamol, phấn hoa..."
                    value={createForm.drugAllergies}
                    onChange={(e) => setCreateForm({ ...createForm, drugAllergies: e.target.value })}
                    className="form-control"
                    style={{ minHeight: '80px' }}
                  />
                </div>

                <div className="modal-footer" style={{ marginTop: '16px' }}>
                  <button type="button" className="btn btn-light" onClick={() => setShowCreateModal(false)}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Xác nhận đăng ký hồ sơ
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: Cập nhật thông tin hành chính (UC-BN03) */}
        {showEditAdminModal && selectedPatient && (
          <div className="modal-backdrop">
            <div className="modal-card" style={{ maxWidth: '620px' }}>
              <div className="modal-header">
                <h3>Cập nhật Thông tin Hành chính - {selectedPatient.patientCode}</h3>
                <button className="modal-close" onClick={() => setShowEditAdminModal(false)}>
                  &times;
                </button>
              </div>
              <form onSubmit={handleUpdateAdmin} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Họ và tên (*)</label>
                    <input
                      type="text"
                      required
                      value={editAdminForm.fullName}
                      onChange={(e) => setEditAdminForm({ ...editAdminForm, fullName: e.target.value })}
                      className="form-control"
                      style={{ height: '42px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Giới tính (*)</label>
                    <select
                      value={editAdminForm.gender}
                      onChange={(e) => setEditAdminForm({ ...editAdminForm, gender: e.target.value })}
                      className="form-control"
                      style={{ height: '42px' }}
                    >
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Ngày sinh (*)</label>
                    <input
                      type="date"
                      required
                      value={editAdminForm.dateOfBirth}
                      onChange={(e) => setEditAdminForm({ ...editAdminForm, dateOfBirth: e.target.value })}
                      className="form-control"
                      style={{ height: '42px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Số điện thoại (*)</label>
                    <input
                      type="tel"
                      required
                      value={editAdminForm.phone}
                      onChange={(e) => setEditAdminForm({ ...editAdminForm, phone: e.target.value })}
                      className="form-control"
                      style={{ height: '42px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      value={editAdminForm.email}
                      onChange={(e) => setEditAdminForm({ ...editAdminForm, email: e.target.value })}
                      className="form-control"
                      style={{ height: '42px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Số CCCD / Hộ chiếu</label>
                    <input
                      type="text"
                      value={editAdminForm.identityCard}
                      onChange={(e) => setEditAdminForm({ ...editAdminForm, identityCard: e.target.value })}
                      className="form-control"
                      style={{ height: '42px' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Địa chỉ</label>
                  <input
                    type="text"
                    value={editAdminForm.address}
                    onChange={(e) => setEditAdminForm({ ...editAdminForm, address: e.target.value })}
                    className="form-control"
                    style={{ height: '42px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Người liên hệ khẩn cấp</label>
                    <input
                      type="text"
                      value={editAdminForm.emergencyContactName}
                      onChange={(e) => setEditAdminForm({ ...editAdminForm, emergencyContactName: e.target.value })}
                      className="form-control"
                      style={{ height: '42px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SĐT người liên hệ</label>
                    <input
                      type="tel"
                      value={editAdminForm.emergencyContactPhone}
                      onChange={(e) => setEditAdminForm({ ...editAdminForm, emergencyContactPhone: e.target.value })}
                      className="form-control"
                      style={{ height: '42px' }}
                    />
                  </div>
                </div>

                <div className="modal-footer" style={{ marginTop: '16px' }}>
                  <button type="button" className="btn btn-light" onClick={() => setShowEditAdminModal(false)}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Lưu thông tin hành chính
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: Quản lý tiền sử bệnh và dị ứng (UC-BN04 - Bác sĩ) */}
        {showEditMedicalModal && selectedPatient && (
          <div className="modal-backdrop">
            <div className="modal-card" style={{ maxWidth: '600px' }}>
              <div className="modal-header">
                <h3>Quản lý Tiền sử Bệnh & Dị ứng - {selectedPatient.fullName}</h3>
                <button className="modal-close" onClick={() => setShowEditMedicalModal(false)}>
                  &times;
                </button>
              </div>
              <form onSubmit={handleUpdateMedical} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', padding: '12px 16px', borderRadius: '10px', fontSize: '13.5px', color: '#115e59', lineHeight: 1.5 }}>
                  Quyền thao tác: Chỉ Bác sĩ điều trị và Quản lý phòng khám có quyền ghi nhận và điều chỉnh thông tin tiền sử bệnh lý và dị ứng thuốc của bệnh nhân.
                </div>

                <div className="form-group">
                  <label className="form-label">Nhóm máu</label>
                  <select
                    value={editMedicalForm.bloodGroup}
                    onChange={(e) => setEditMedicalForm({ ...editMedicalForm, bloodGroup: e.target.value })}
                    className="form-control"
                    style={{ height: '42px' }}
                  >
                    <option value="UNKNOWN">Chưa xác định</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Tiền sử bệnh mạn tính / Ngoại khoa</label>
                  <textarea
                    rows={4}
                    placeholder="Ghi nhận tiền sử bệnh lý của bệnh nhân (ví dụ: Hen suyễn, Tim mạch, Phẫu thuật trước đây...)"
                    value={editMedicalForm.medicalHistory}
                    onChange={(e) => setEditMedicalForm({ ...editMedicalForm, medicalHistory: e.target.value })}
                    className="form-control"
                    style={{ minHeight: '100px' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tiền sử dị ứng thuốc & Dược chất</label>
                  <textarea
                    rows={4}
                    placeholder="Cảnh báo dị ứng (ví dụ: Dị ứng Penicillin, NSAID, kháng sinh nhóm Beta-lactam...)"
                    value={editMedicalForm.drugAllergies}
                    onChange={(e) => setEditMedicalForm({ ...editMedicalForm, drugAllergies: e.target.value })}
                    className="form-control"
                    style={{ minHeight: '100px' }}
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowEditMedicalModal(false)}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Lưu hồ sơ tiền sử
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: Cập nhật thẻ bảo hiểm y tế (UC-BN05 - Lễ tân) */}
        {showEditInsuranceModal && selectedPatient && (
          <div className="modal-backdrop">
            <div className="modal-card" style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h3>Cập nhật Thẻ Bảo hiểm Y tế - {selectedPatient.fullName}</h3>
                <button className="modal-close" onClick={() => setShowEditInsuranceModal(false)}>
                  &times;
                </button>
              </div>
              <form onSubmit={handleUpdateInsurance} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Mã số thẻ BHYT (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: DN4010123456789"
                    value={editInsuranceForm.healthInsuranceNumber}
                    onChange={(e) => setEditInsuranceForm({ ...editInsuranceForm, healthInsuranceNumber: e.target.value.toUpperCase() })}
                    className="form-control"
                    style={{ height: '42px', letterSpacing: '1px', fontWeight: 600 }}
                  />
                  <small style={{ color: 'var(--muted)', fontSize: '12.5px', marginTop: '6px', display: 'block' }}>
                    Nhập đúng định dạng 15 ký tự ghi trên thẻ bảo hiểm y tế do cơ quan BHXH phát hành.
                  </small>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowEditInsuranceModal(false)}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Cập nhật thẻ BHYT
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* MODAL 5: Xem lịch sử khám bệnh (UC-BN06) */}
        {showHistoryModal && selectedPatient && (
          <div className="modal-backdrop">
            <div className="modal-card" style={{ maxWidth: '820px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="modal-header">
                <div>
                  <h3>Lịch sử Khám bệnh - {selectedPatient.fullName}</h3>
                  <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                    Mã hồ sơ: <strong>{selectedPatient.patientCode}</strong> &bull; SĐT: {selectedPatient.phone} &bull; Nhóm máu: {selectedPatient.bloodGroup || 'Chưa rõ'}
                  </div>
                </div>
                <button className="modal-close" onClick={() => setShowHistoryModal(false)}>
                  &times;
                </button>
              </div>
              <div className="modal-body">
                {/* Cảnh báo y khoa */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Tiền sử bệnh lý</div>
                    <div style={{ fontSize: '13.5px', marginTop: '4px', color: 'var(--ink)' }}>
                      {selectedPatient.medicalHistory || 'Không ghi nhận tiền sử bệnh đặc biệt.'}
                    </div>
                  </div>
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#991b1b' }}>Cảnh báo dị ứng</div>
                    <div style={{ fontSize: '13.5px', marginTop: '4px', color: '#991b1b', fontWeight: 600 }}>
                      {selectedPatient.drugAllergies || 'Không ghi nhận dị ứng thuốc.'}
                    </div>
                  </div>
                </div>

                <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: 'var(--ink)', marginBottom: '14px' }}>
                  Danh sách Các Phiên Khám Lâm Sàng ({medicalRecords.length})
                </h4>

                {isLoadingRecords ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--muted)' }}>Đang tải lịch sử khám bệnh...</div>
                ) : medicalRecords.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--muted)', background: '#f8fafc', borderRadius: '10px' }}>
                    Chưa có hồ sơ bệnh án nào được lập cho bệnh nhân này.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {medicalRecords.map((rec) => (
                      <div
                        key={rec.id}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: '12px',
                          padding: '18px',
                          background: '#ffffff',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div>
                            <span style={{ fontWeight: 800, color: 'var(--primary-dark)', fontSize: '15px' }}>
                              {rec.recordCode}
                            </span>
                            <span style={{ marginLeft: '12px', fontSize: '13px', color: 'var(--muted)' }}>
                              Ngày khám: {formatDate(rec.createdAt)}
                            </span>
                          </div>
                          <span style={{ background: '#def7ec', color: '#03543f', fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '12px' }}>
                            {rec.status === 'COMPLETED' ? 'Đã hoàn tất' : rec.status}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13.5px', marginBottom: '12px' }}>
                          <div>
                            <span style={{ color: 'var(--muted)' }}>Bác sĩ phụ trách:</span>{' '}
                            <strong>{rec.doctorName || 'Bác sĩ chuyên khoa'}</strong> ({rec.doctorQualification || 'Bác sĩ'})
                          </div>
                          <div>
                            <span style={{ color: 'var(--muted)' }}>Phòng khám:</span>{' '}
                            <strong>{rec.roomName || 'Phòng khám chuyên khoa'}</strong> ({rec.roomNumber || ''})
                          </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '13.5px', marginBottom: '10px' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <strong>Lý do vào khám:</strong> {rec.chiefComplaint}
                          </div>
                          {rec.historyOfPresentIllness && (
                            <div style={{ marginBottom: '6px' }}>
                              <strong>Bệnh sử:</strong> {rec.historyOfPresentIllness}
                            </div>
                          )}
                          <div>
                            <strong style={{ color: 'var(--primary-dark)' }}>Chẩn đoán xác định:</strong>{' '}
                            <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{rec.finalDiagnosis}</span>
                            {rec.icd10Code && (
                              <span style={{ marginLeft: '8px', background: '#e0f2f1', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 }}>
                                ICD-10: {rec.icd10Code}
                              </span>
                            )}
                          </div>
                        </div>

                        {rec.doctorAdvice && (
                          <div style={{ fontSize: '13px', color: 'var(--ink)', marginBottom: '8px' }}>
                            <strong>Lời dặn của bác sĩ:</strong> {rec.doctorAdvice}
                          </div>
                        )}

                        {rec.followUpDate && (
                          <div style={{ fontSize: '13px', color: '#b91c1c', fontWeight: 600 }}>
                            Hẹn tái khám vào ngày: {formatDate(rec.followUpDate)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setShowHistoryModal(false)}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 6: Gộp hồ sơ trùng lặp (UC-BN07 - Quản lý) */}
        {showMergeModal && selectedPatient && (
          <div className="modal-backdrop">
            <div className="modal-card" style={{ maxWidth: '620px' }}>
              <div className="modal-header">
                <h3>Gộp Hồ sơ Bệnh nhân Trùng lặp</h3>
                <button className="modal-close" onClick={() => setShowMergeModal(false)}>
                  &times;
                </button>
              </div>
              <form onSubmit={handleMergePatients} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '10px', fontSize: '13.5px', color: '#991b1b' }}>
                  Lưu ý quan trọng: Toàn bộ lịch sử khám bệnh, lịch hẹn và hồ sơ y tế từ hồ sơ trùng lặp sẽ được chuyển sang hồ sơ gốc. Hồ sơ trùng lặp sẽ bị vô hiệu hóa vĩnh viễn và trỏ liên kết về hồ sơ gốc.
                </div>

                <div className="form-group">
                  <label className="form-label">Hồ sơ gốc (giữ lại nhận dữ liệu)</label>
                  <input
                    type="text"
                    disabled
                    value={`${selectedPatient.patientCode} - ${selectedPatient.fullName} (${selectedPatient.phone})`}
                    className="form-control"
                    style={{ background: '#f1f5f9', height: '42px', fontWeight: 600 }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Chọn hồ sơ trùng lặp cần gộp (*)</label>
                  <select
                    required
                    value={mergeForm.duplicatePatientId}
                    onChange={(e) => setMergeForm({ ...mergeForm, duplicatePatientId: Number(e.target.value) })}
                    className="form-control"
                    style={{ height: '42px' }}
                  >
                    <option value={0}>-- Chọn hồ sơ trùng trong danh sách --</option>
                    {patients
                      .filter((p) => p.id !== selectedPatient.id && !p.mergedIntoId)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.patientCode} - {p.fullName} (SĐT: {p.phone} &bull; Sinh: {p.dateOfBirth})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Lý do / Ghi chú gộp hồ sơ</label>
                  <textarea
                    rows={3}
                    placeholder="Ví dụ: Bệnh nhân đăng ký 2 lần do đổi số điện thoại liên hệ..."
                    value={mergeForm.note}
                    onChange={(e) => setMergeForm({ ...mergeForm, note: e.target.value })}
                    className="form-control"
                    style={{ minHeight: '90px' }}
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowMergeModal(false)}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ background: '#b91c1c', borderColor: '#b91c1c' }}>
                    Xác nhận gộp hồ sơ
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 7: Vô hiệu hóa / Kích hoạt lại hồ sơ (UC-BN07 - Quản lý) */}
        {showToggleActiveModal && selectedPatient && (
          <div className="modal-backdrop">
            <div className="modal-card" style={{ maxWidth: '520px' }}>
              <div className="modal-header">
                <h3>
                  {toggleActiveForm.isActive ? 'Kích hoạt lại hồ sơ' : 'Vô hiệu hóa hồ sơ'} - {selectedPatient.patientCode}
                </h3>
                <button className="modal-close" onClick={() => setShowToggleActiveModal(false)}>
                  &times;
                </button>
              </div>
              <form onSubmit={handleToggleActive} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '14.5px', color: 'var(--ink)' }}>
                  Bạn có chắc chắn muốn{' '}
                  <strong>{toggleActiveForm.isActive ? 'kích hoạt lại' : 'tạm dừng hoạt động'}</strong> hồ sơ bệnh nhân{' '}
                  <strong>{selectedPatient.fullName}</strong>?
                </p>

                <div className="form-group">
                  <label className="form-label">Lý do thay đổi trạng thái (*)</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Nhập lý do chi tiết để lưu trữ nhật ký kiểm toán hệ thống..."
                    value={toggleActiveForm.reason}
                    onChange={(e) => setToggleActiveForm({ ...toggleActiveForm, reason: e.target.value })}
                    className="form-control"
                    style={{ minHeight: '90px' }}
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowToggleActiveModal(false)}>
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{
                      background: toggleActiveForm.isActive ? 'var(--primary)' : '#b91c1c',
                      borderColor: toggleActiveForm.isActive ? 'var(--primary)' : '#b91c1c',
                    }}
                  >
                    Xác nhận thực hiện
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
