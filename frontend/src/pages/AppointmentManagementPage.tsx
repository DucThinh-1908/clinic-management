import React, { useState, useEffect, useCallback } from 'react'
import type {
  AuthUser,
  AppointmentItem,
  AppointmentStatsItem,
  DoctorOptionItem,
  DoctorSlotItem,
  AppointmentReminderItem,
} from '../types'

interface AppointmentManagementPageProps {
  currentUser: AuthUser | null
}

export const AppointmentManagementPage: React.FC<AppointmentManagementPageProps> = ({ currentUser }) => {
  const isStaff = Boolean(
    currentUser &&
      currentUser.roles &&
      currentUser.roles.some((r) =>
        ['receptionist', 'doctor', 'nurse', 'manager', 'admin', 'technician', 'pharmacist', 'cashier'].includes(r.toLowerCase())
      )
  )

  const isDoctor = Boolean(
    currentUser &&
      currentUser.roles &&
      currentUser.roles.some((r) => r.toLowerCase() === 'doctor')
  )

  const isReceptionist = Boolean(
    currentUser &&
      currentUser.roles &&
      currentUser.roles.some((r) => r.toLowerCase() === 'receptionist' || r.toLowerCase() === 'admin' || r.toLowerCase() === 'manager')
  )

  const [activeTab, setActiveTab] = useState<'daily' | 'book' | 'slots' | 'my'>('daily')

  // Bộ lọc danh sách (UC-LH07)
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().split('T')[0])
  const [filterDoctorId, setFilterDoctorId] = useState<number | ''>('')
  const [filterDepartmentId, setFilterDepartmentId] = useState<number | ''>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterKeyword, setFilterKeyword] = useState<string>('')

  // Dữ liệu
  const [appointments, setAppointments] = useState<AppointmentItem[]>([])
  const [stats, setStats] = useState<AppointmentStatsItem | null>(null)
  const [doctors, setDoctors] = useState<DoctorOptionItem[]>([])
  const [loading, setLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Modal Đổi giờ (UC-LH04)
  const [rescheduleModal, setRescheduleModal] = useState<{
    isOpen: boolean
    appointment: AppointmentItem | null
    newDate: string
    newDoctorId: number | ''
    newTime: string
    reason: string
    availableSlots: DoctorSlotItem[]
    loadingSlots: boolean
  }>({
    isOpen: false,
    appointment: null,
    newDate: '',
    newDoctorId: '',
    newTime: '',
    reason: '',
    availableSlots: [],
    loadingSlots: false,
  })

  // Modal Hủy lịch (UC-LH05)
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean
    appointment: AppointmentItem | null
    reason: string
    submitting: boolean
  }>({
    isOpen: false,
    appointment: null,
    reason: '',
    submitting: false,
  })

  // Modal Gửi nhắc nhở (UC-LH06)
  const [reminderModal, setReminderModal] = useState<{
    isOpen: boolean
    appointment: AppointmentItem | null
    reminderType: 'SMS' | 'EMAIL'
    recipient: string
    title: string
    content: string
    history: AppointmentReminderItem[]
    loadingHistory: boolean
    submitting: boolean
  }>({
    isOpen: false,
    appointment: null,
    reminderType: 'SMS',
    recipient: '',
    title: '',
    content: '',
    history: [],
    loadingHistory: false,
    submitting: false,
  })

  // Modal Đánh dấu Không đến No-Show (UC-LH08)
  const [noShowModal, setNoShowModal] = useState<{
    isOpen: boolean
    appointment: AppointmentItem | null
    reason: string
    submitting: boolean
  }>({
    isOpen: false,
    appointment: null,
    reason: '',
    submitting: false,
  })

  // Form Đặt lịch tiếp đón tại quầy / Hotline (UC-LH02)
  const [bookForm, setBookForm] = useState({
    patientCodeOrPhone: '',
    fullName: '',
    phone: '',
    email: '',
    gender: 'MALE',
    dateOfBirth: '1990-01-01',
    doctorId: '' as number | '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    symptomsSummary: '',
    channel: 'DIRECT_WALKIN' as 'DIRECT_WALKIN' | 'CALL_CENTER',
    notes: '',
  })
  const [bookFormSlots, setBookFormSlots] = useState<DoctorSlotItem[]>([])
  const [loadingBookSlots, setLoadingBookSlots] = useState(false)
  const [submittingBook, setSubmittingBook] = useState(false)

  // Khung giờ tra cứu riêng (UC-LH01)
  const [lookupDoctorId, setLookupDoctorId] = useState<number | ''>('')
  const [lookupDate, setLookupDate] = useState(() => new Date().toISOString().split('T')[0])
  const [lookupSlots, setLookupSlots] = useState<DoctorSlotItem[]>([])
  const [loadingLookupSlots, setLoadingLookupSlots] = useState(false)

  // Tải danh sách bác sĩ
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch(`/api/appointments/doctors?date=${filterDate}`)
        if (res.ok) {
          const data: DoctorOptionItem[] = await res.json()
          setDoctors(data)
          if (data.length > 0 && lookupDoctorId === '') {
            setLookupDoctorId(data[0].doctorId)
          }
        }
      } catch (e) {
        console.error('Lỗi tải danh mục bác sĩ:', e)
      }
    }
    fetchDoctors()
  }, [filterDate])

  // Tải danh sách lịch hẹn & thống kê
  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    setActionMessage(null)
    try {
      const query = new URLSearchParams()
      if (filterDate) query.append('date', filterDate)
      if (filterDoctorId) query.append('doctorId', String(filterDoctorId))
      if (filterDepartmentId) query.append('departmentId', String(filterDepartmentId))
      if (filterStatus) query.append('status', filterStatus)
      if (filterKeyword) query.append('keyword', filterKeyword)
      if (currentUser?.id) query.append('userId', String(currentUser.id))

      const res = await fetch(`/api/appointments?${query.toString()}`)
      if (res.ok) {
        const data: AppointmentItem[] = await res.json()
        setAppointments(data)
      }

      // Thống kê theo ngày
      if (filterDate) {
        const statsRes = await fetch(`/api/appointments/stats?date=${filterDate}`)
        if (statsRes.ok) {
          const statsData: AppointmentStatsItem = await statsRes.json()
          setStats(statsData)
        }
      }
    } catch (err: any) {
      console.error('Lỗi tải danh sách lịch hẹn:', err)
      setActionMessage({ type: 'error', text: 'Không thể kết nối đến máy chủ để tải lịch hẹn' })
    } finally {
      setLoading(false)
    }
  }, [filterDate, filterDoctorId, filterDepartmentId, filterStatus, filterKeyword, currentUser])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  // UC-LH01: Tải khung giờ trống cho form đặt lịch tại quầy
  useEffect(() => {
    if (!bookForm.doctorId || !bookForm.date) {
      setBookFormSlots([])
      return
    }
    const fetchSlots = async () => {
      setLoadingBookSlots(true)
      try {
        const res = await fetch(`/api/appointments/slots?doctorId=${bookForm.doctorId}&date=${bookForm.date}`)
        if (res.ok) {
          const data = await res.json()
          setBookFormSlots(data.slots || [])
        } else {
          setBookFormSlots([])
        }
      } catch (err) {
        setBookFormSlots([])
      } finally {
        setLoadingBookSlots(false)
      }
    }
    fetchSlots()
  }, [bookForm.doctorId, bookForm.date])

  // UC-LH01: Tải khung giờ tra cứu riêng
  useEffect(() => {
    if (!lookupDoctorId || !lookupDate) {
      setLookupSlots([])
      return
    }
    const fetchSlots = async () => {
      setLoadingLookupSlots(true)
      try {
        const res = await fetch(`/api/appointments/slots?doctorId=${lookupDoctorId}&date=${lookupDate}`)
        if (res.ok) {
          const data = await res.json()
          setLookupSlots(data.slots || [])
        } else {
          setLookupSlots([])
        }
      } catch (err) {
        setLookupSlots([])
      } finally {
        setLoadingLookupSlots(false)
      }
    }
    fetchSlots()
  }, [lookupDoctorId, lookupDate])

  // Tải khung giờ trống cho Modal đổi giờ
  const fetchRescheduleSlots = async (docId: number, targetDate: string) => {
    setRescheduleModal(prev => ({ ...prev, loadingSlots: true }))
    try {
      const res = await fetch(`/api/appointments/slots?doctorId=${docId}&date=${targetDate}`)
      if (res.ok) {
        const data = await res.json()
        setRescheduleModal(prev => ({
          ...prev,
          availableSlots: data.slots || [],
          loadingSlots: false,
        }))
      }
    } catch {
      setRescheduleModal(prev => ({ ...prev, availableSlots: [], loadingSlots: false }))
    }
  }

  // UC-LH03: Xác nhận lịch hẹn (Lễ tân)
  const handleConfirmAppointment = async (appointmentId: number) => {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/confirm?userId=${currentUser?.id || ''}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Lễ tân đã tiếp nhận và xác nhận' }),
      })
      const data = await res.json()
      if (res.ok) {
        setActionMessage({ type: 'success', text: `Đã xác nhận lịch hẹn ${data.appointmentCode} thành công.` })
        fetchAppointments()
      } else {
        setActionMessage({ type: 'error', text: data.message || 'Lỗi khi xác nhận lịch hẹn' })
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Lỗi kết nối' })
    }
  }

  // Mở modal đổi giờ (UC-LH04)
  const openRescheduleModal = (app: AppointmentItem) => {
    const docId = app.doctorId || (doctors.length > 0 ? doctors[0].doctorId : '')
    setRescheduleModal({
      isOpen: true,
      appointment: app,
      newDate: app.appointmentDate,
      newDoctorId: docId,
      newTime: app.appointmentTime.slice(0, 5),
      reason: '',
      availableSlots: [],
      loadingSlots: false,
    })
    if (docId) {
      fetchRescheduleSlots(Number(docId), app.appointmentDate)
    }
  }

  // Thực hiện đổi giờ (UC-LH04)
  const handlePerformReschedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rescheduleModal.appointment || !rescheduleModal.newTime) return

    try {
      const res = await fetch(`/api/appointments/${rescheduleModal.appointment.id}/reschedule?userId=${currentUser?.id || ''}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newDate: rescheduleModal.newDate,
          newTime: rescheduleModal.newTime.length === 5 ? rescheduleModal.newTime + ':00' : rescheduleModal.newTime,
          newDoctorId: rescheduleModal.newDoctorId ? Number(rescheduleModal.newDoctorId) : undefined,
          reason: rescheduleModal.reason,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `Đã dời lịch hẹn ${data.appointmentCode} sang ${data.appointmentTime.slice(0, 5)} ngày ${data.appointmentDate}. Đã tự động gửi SMS nhắc nhở.`,
        })
        setRescheduleModal(prev => ({ ...prev, isOpen: false }))
        fetchAppointments()
      } else {
        setActionMessage({ type: 'error', text: data.message || 'Không thể dời lịch hẹn' })
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Lỗi kết nối' })
    }
  }

  // Mở modal hủy lịch (UC-LH05)
  const openCancelModal = (app: AppointmentItem) => {
    setCancelModal({
      isOpen: true,
      appointment: app,
      reason: '',
      submitting: false,
    })
  }

  // Thực hiện hủy lịch (UC-LH05)
  const handlePerformCancel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cancelModal.appointment) return

    setCancelModal(prev => ({ ...prev, submitting: true }))
    try {
      const res = await fetch(`/api/appointments/${cancelModal.appointment.id}/cancel?userId=${currentUser?.id || ''}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelModal.reason }),
      })
      const data = await res.json()
      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `Đã hủy lịch hẹn ${data.appointmentCode} thành công. Đã gửi thông báo xác nhận hủy tới bệnh nhân.`,
        })
        setCancelModal(prev => ({ ...prev, isOpen: false }))
        fetchAppointments()
      } else {
        setActionMessage({ type: 'error', text: data.message || 'Lỗi khi hủy lịch' })
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Lỗi kết nối' })
    } finally {
      setCancelModal(prev => ({ ...prev, submitting: false }))
    }
  }

  // Mở modal gửi nhắc nhở (UC-LH06)
  const openReminderModal = async (app: AppointmentItem) => {
    const defaultRecipient = app.patientPhone || app.patientEmail || ''
    const defaultContent = `Kính gửi ${app.patientName}, phòng khám CarePlus xin nhắc quý khách có lịch hẹn khám ${app.appointmentCode} vào lúc ${app.appointmentTime.slice(0, 5)} ngày ${app.appointmentDate} cùng Bác sĩ ${app.doctorName || 'chuyên khoa'}. Quý khách vui lòng đến trước 15 phút để chuẩn bị tiếp đón.`

    setReminderModal({
      isOpen: true,
      appointment: app,
      reminderType: 'SMS',
      recipient: defaultRecipient,
      title: 'Nhắc nhở lịch hẹn khám bệnh CarePlus Clinic',
      content: defaultContent,
      history: [],
      loadingHistory: true,
      submitting: false,
    })

    try {
      const res = await fetch(`/api/appointments/${app.id}/reminders`)
      if (res.ok) {
        const hist: AppointmentReminderItem[] = await res.json()
        setReminderModal(prev => ({ ...prev, history: hist, loadingHistory: false }))
      }
    } catch {
      setReminderModal(prev => ({ ...prev, loadingHistory: false }))
    }
  }

  // Thực hiện gửi nhắc nhở (UC-LH06)
  const handlePerformSendReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reminderModal.appointment) return

    setReminderModal(prev => ({ ...prev, submitting: true }))
    try {
      const res = await fetch(`/api/appointments/${reminderModal.appointment.id}/reminders?userId=${currentUser?.id || ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminderType: reminderModal.reminderType,
          recipient: reminderModal.recipient,
          title: reminderModal.title,
          content: reminderModal.content,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `Đã gửi thông báo nhắc lịch hẹn qua ${data.reminderType} tới ${data.recipient} thành công.`,
        })
        setReminderModal(prev => ({ ...prev, isOpen: false }))
        fetchAppointments()
      } else {
        setActionMessage({ type: 'error', text: data.message || 'Lỗi khi gửi nhắc nhở' })
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Lỗi kết nối' })
    } finally {
      setReminderModal(prev => ({ ...prev, submitting: false }))
    }
  }

  // Mở modal vắng mặt No-Show (UC-LH08)
  const openNoShowModal = (app: AppointmentItem) => {
    setNoShowModal({
      isOpen: true,
      appointment: app,
      reason: 'Bệnh nhân quá giờ hẹn 45 phút, đã gọi điện nhưng không nghe máy',
      submitting: false,
    })
  }

  // Thực hiện đánh dấu No-Show (UC-LH08)
  const handlePerformNoShow = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!noShowModal.appointment) return

    setNoShowModal(prev => ({ ...prev, submitting: true }))
    try {
      const res = await fetch(`/api/appointments/${noShowModal.appointment.id}/no-show?userId=${currentUser?.id || ''}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: noShowModal.reason }),
      })
      const data = await res.json()
      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `Đã xác nhận vắng mặt (No-Show) cho lịch hẹn ${data.appointmentCode}. Lịch hẹn đã tự động chuyển sang trạng thái Đã hủy và không thể đổi giờ.`,
        })
        setNoShowModal(prev => ({ ...prev, isOpen: false }))
        fetchAppointments()
      } else {
        setActionMessage({ type: 'error', text: data.message || 'Lỗi khi ghi nhận vắng mặt' })
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Lỗi kết nối' })
    } finally {
      setNoShowModal(prev => ({ ...prev, submitting: false }))
    }
  }

  // Tiếp đón & Đặt lịch tại quầy (UC-LH02)
  const handleBookFromReception = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookForm.fullName || !bookForm.phone || !bookForm.date || !bookForm.time) {
      setActionMessage({ type: 'error', text: 'Vui lòng điền đủ họ tên, số điện thoại, ngày khám và khung giờ.' })
      return
    }

    setSubmittingBook(true)
    setActionMessage(null)

    try {
      const selectedDoc = doctors.find(d => d.doctorId === Number(bookForm.doctorId))

      const payload = {
        fullName: bookForm.fullName.trim(),
        phone: bookForm.phone.trim(),
        email: bookForm.email.trim() || undefined,
        gender: bookForm.gender,
        dateOfBirth: bookForm.dateOfBirth,
        doctorId: bookForm.doctorId ? Number(bookForm.doctorId) : undefined,
        departmentId: selectedDoc?.departmentId,
        appointmentDate: bookForm.date,
        appointmentTime: bookForm.time.length === 5 ? bookForm.time + ':00' : bookForm.time,
        symptomsSummary: bookForm.symptomsSummary.trim(),
        bookingChannel: bookForm.channel,
        notes: bookForm.notes.trim() || undefined,
      }

      const res = await fetch(`/api/appointments?userId=${currentUser?.id || ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `Đã đặt thành công lịch hẹn mã ${data.appointmentCode} cho bệnh nhân ${data.patientName}. Trạng thái: ${data.status}.`,
        })
        // Reset form
        setBookForm({
          patientCodeOrPhone: '',
          fullName: '',
          phone: '',
          email: '',
          gender: 'MALE',
          dateOfBirth: '1990-01-01',
          doctorId: doctors.length > 0 ? doctors[0].doctorId : '',
          date: new Date().toISOString().split('T')[0],
          time: '',
          symptomsSummary: '',
          channel: 'DIRECT_WALKIN',
          notes: '',
        })
        setActiveTab('daily')
        fetchAppointments()
      } else {
        setActionMessage({ type: 'error', text: data.message || 'Không thể tạo lịch hẹn' })
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Lỗi kết nối' })
    } finally {
      setSubmittingBook(false)
    }
  }

  // Trợ giúp hiển thị badge trạng thái
  const renderStatusBadge = (status: string, cancellationReason?: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 9px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
            Chờ xác nhận
          </span>
        )
      case 'CONFIRMED':
        return (
          <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 9px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
            Đã xác nhận
          </span>
        )
      case 'CHECKED_IN':
        return (
          <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 9px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
            Đã tiếp đón
          </span>
        )
      case 'COMPLETED':
        return (
          <span style={{ background: '#f3e8ff', color: '#6b21a8', padding: '4px 9px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
            Đã khám xong
          </span>
        )
      case 'CANCELLED': {
        const isNoShow = cancellationReason && (cancellationReason.includes('No-Show') || cancellationReason.includes('Vắng mặt'))
        return (
          <span style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 9px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
            {isNoShow ? 'Đã hủy (Vắng mặt)' : 'Đã hủy'}
          </span>
        )
      }
      case 'NO_SHOW':
        return (
          <span style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 9px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
            Đã hủy (Vắng mặt)
          </span>
        )
      default:
        return (
          <span style={{ background: '#e2e8f0', color: '#334155', padding: '4px 9px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
            {status}
          </span>
        )
    }
  }

  const renderChannelBadge = (ch: string) => {
    switch (ch) {
      case 'ONLINE_PORTAL':
        return <span style={{ color: '#0284c7', fontSize: '12px' }}>Trực tuyến</span>
      case 'CALL_CENTER':
        return <span style={{ color: '#d97706', fontSize: '12px' }}>Tổng đài / Hotline</span>
      case 'DIRECT_WALKIN':
        return <span style={{ color: '#16a34a', fontSize: '12px' }}>Tại quầy tiếp đón</span>
      default:
        return <span style={{ fontSize: '12px' }}>{ch}</span>
    }
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '85vh', padding: '28px 0 60px' }}>
      <div className="container" style={{ maxWidth: '1240px' }}>

        {/* Tiêu đề & Giới thiệu */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {isStaff ? 'Hệ thống Tiếp đón & Đặt hẹn' : 'Cổng Đặt Lịch & Tra Cứu Hẹn Khám'}
            </span>
            <h1 style={{ margin: '4px 0 6px', fontSize: '26px', color: 'var(--ink)' }}>
              {isStaff ? 'Quản lý Lịch hẹn Khám bệnh' : 'Lịch hẹn Khám bệnh của Tôi'}
            </h1>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14.5px' }}>
              {isStaff
                ? 'Theo dõi khung giờ trống của bác sĩ, tiếp nhận đặt lịch, xác nhận, đổi giờ, hủy hẹn và nhắc lịch tự động.'
                : 'Theo dõi tiến trình lịch khám, nhận thông báo nhắc hẹn tự động, đổi giờ hoặc hủy lịch hẹn thuận tiện.'}
            </p>
          </div>

          {/* Quick tab switcher */}
          <div style={{ display: 'flex', gap: '8px', background: '#ffffff', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={() => setActiveTab('daily')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'daily' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'daily' ? '#ffffff' : '#475569',
                fontWeight: 600,
                fontSize: '13.5px',
                cursor: 'pointer',
              }}
            >
              Lịch hẹn hôm nay
            </button>

            {isReceptionist && (
              <button
                type="button"
                onClick={() => setActiveTab('book')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'book' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'book' ? '#ffffff' : '#475569',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                }}
              >
                Đặt hẹn tại quầy
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('slots')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'slots' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'slots' ? '#ffffff' : '#475569',
                fontWeight: 600,
                fontSize: '13.5px',
                cursor: 'pointer',
              }}
            >
              Khung giờ trống bác sĩ
            </button>
          </div>
        </div>

        {/* Thông báo thao tác */}
        {actionMessage && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              background: actionMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
              color: actionMessage.type === 'success' ? '#065f46' : '#991b1b',
              border: `1px solid ${actionMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{actionMessage.text}</span>
            <button
              type="button"
              onClick={() => setActionMessage(null)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'inherit' }}
            >
              &times;
            </button>
          </div>
        )}

        {/* Khối Thống kê nhanh theo ngày (UC-LH07) */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: '12.5px', color: '#64748b' }}>Tổng lịch trong ngày</span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--ink)', marginTop: '4px' }}>{stats.total}</div>
            </div>
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: '12.5px', color: '#92400e' }}>Chờ xác nhận</span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#b45309', marginTop: '4px' }}>{stats.pending}</div>
            </div>
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: '12.5px', color: '#166534' }}>Đã xác nhận</span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>{stats.confirmed}</div>
            </div>
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: '12.5px', color: '#0369a1' }}>Đã tiếp đón</span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>{stats.checkedIn}</div>
            </div>
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: '12.5px', color: '#6b21a8' }}>Đã khám xong</span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#7e22ce', marginTop: '4px' }}>{stats.completed}</div>
            </div>
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: '12.5px', color: '#991b1b' }}>Đã hủy</span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>{stats.cancelled}</div>
            </div>
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: '12.5px', color: '#475569' }}>Vắng mặt (No-Show)</span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#475569', marginTop: '4px' }}>{stats.noShow}</div>
            </div>
          </div>
        )}

        {/* TAB 1: DANH SÁCH LỊCH HẸN TRONG NGÀY (UC-LH07) */}
        {activeTab === 'daily' && (
          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '22px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>

            {/* Thanh tìm kiếm & bộ lọc */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                  Ngày khám
                </label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                />
              </div>

              {!isDoctor && (
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                    Bác sĩ
                  </label>
                  <select
                    value={filterDoctorId}
                    onChange={(e) => setFilterDoctorId(e.target.value ? Number(e.target.value) : '')}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  >
                    <option value="">-- Tất cả bác sĩ --</option>
                    {doctors.map(d => (
                      <option key={d.doctorId} value={d.doctorId}>
                        {d.doctorName} ({d.specialty})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                  Trạng thái
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                >
                  <option value="">-- Tất cả trạng thái --</option>
                  <option value="PENDING">Chờ xác nhận</option>
                  <option value="CONFIRMED">Đã xác nhận</option>
                  <option value="CHECKED_IN">Đã tiếp đón</option>
                  <option value="COMPLETED">Đã khám xong</option>
                  <option value="CANCELLED">Đã hủy</option>
                  <option value="NO_SHOW">Vắng mặt (No-Show)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                  Chuyên khoa
                </label>
                <select
                  value={filterDepartmentId}
                  onChange={(e) => setFilterDepartmentId(e.target.value ? Number(e.target.value) : '')}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                >
                  <option value="">-- Tất cả chuyên khoa --</option>
                  <option value="1">Khoa Nội Tổng Quát</option>
                  <option value="2">Khoa Nhi</option>
                  <option value="3">Khoa Sản - Phụ khoa</option>
                  <option value="4">Khoa Tai - Mũi - Họng</option>
                  <option value="5">Khoa Răng - Hàm - Mặt</option>
                  <option value="6">Khoa Mắt & Khúc Xạ</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '12.5px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                  Tìm theo Mã hẹn / Bệnh nhân / Số điện thoại
                </label>
                <input
                  type="text"
                  placeholder="Nhập mã LH-..., tên bệnh nhân hoặc số điện thoại..."
                  value={filterKeyword}
                  onChange={(e) => setFilterKeyword(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                />
              </div>
            </div>

            {/* Bảng danh sách lịch hẹn */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải danh sách lịch hẹn...</div>
            ) : appointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Không tìm thấy lịch hẹn nào
                </div>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  Không có lịch hẹn phù hợp với điều kiện tìm kiếm ngày {filterDate}.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>Mã lịch</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>Bệnh nhân</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>Giờ khám & Bác sĩ</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>Lý do / Triệu chứng</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>Kênh đặt</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>Trạng thái</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a) => {
                      const isPending = a.status === 'PENDING'
                      const isConfirmed = a.status === 'CONFIRMED'
                      const isCancelled = a.status === 'CANCELLED'
                      const isNoShow = a.status === 'NO_SHOW' || (a.cancellationReason != null && (a.cancellationReason.includes('No-Show') || a.cancellationReason.includes('Vắng mặt')))

                      return (
                        <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '14px' }}>
                            <strong style={{ color: 'var(--primary)', display: 'block' }}>{a.appointmentCode}</strong>
                            <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>{a.appointmentDate}</span>
                          </td>
                          <td style={{ padding: '14px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{a.patientName}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              {a.patientPhone} {a.patientCode ? `• ${a.patientCode}` : ''}
                            </div>
                          </td>
                          <td style={{ padding: '14px' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{a.appointmentTime.slice(0, 5)}</div>
                            <div style={{ fontSize: '12px', color: '#475569' }}>
                              {a.doctorName || 'Chưa chỉ định'}
                              {a.departmentName ? ` (${a.departmentName})` : ''}
                            </div>
                          </td>
                          <td style={{ padding: '14px', maxWidth: '200px' }}>
                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#334155' }}>
                              {a.symptomsSummary || 'Không ghi chú triệu chứng'}
                            </div>
                            {a.cancellationReason && (
                              <div style={{ fontSize: '11.5px', color: '#ef4444' }}>
                                Lý do: {a.cancellationReason}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '14px' }}>
                            {renderChannelBadge(a.bookingChannel)}
                          </td>
                          <td style={{ padding: '14px' }}>
                            {renderStatusBadge(a.status, a.cancellationReason)}
                          </td>
                          <td style={{ padding: '14px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>

                              {/* UC-LH03: Nút xác nhận */}
                              {isPending && isReceptionist && (
                                <button
                                  type="button"
                                  onClick={() => handleConfirmAppointment(a.id)}
                                  className="btn btn-primary btn-sm"
                                  style={{ padding: '4px 10px', fontSize: '12px' }}
                                  title="Xác nhận lịch hẹn khám"
                                >
                                  Xác nhận
                                </button>
                              )}

                              {/* UC-LH04: Nút đổi giờ - Tuyệt đối không cho phép đổi giờ nếu lịch đã hủy hoặc vắng mặt */}
                              {!isCancelled && !isNoShow && a.status !== 'COMPLETED' && (
                                <button
                                  type="button"
                                  onClick={() => openRescheduleModal(a)}
                                  className="btn btn-outline btn-sm"
                                  style={{ padding: '4px 10px', fontSize: '12px' }}
                                  title="Đổi khung giờ khám"
                                >
                                  Đổi giờ
                                </button>
                              )}

                              {/* UC-LH06: Gửi nhắc nhở SMS/Email */}
                              {!isCancelled && !isNoShow && a.status !== 'COMPLETED' && (
                                <button
                                  type="button"
                                  onClick={() => openReminderModal(a)}
                                  className="btn btn-outline btn-sm"
                                  style={{ padding: '4px 10px', fontSize: '12px' }}
                                  title="Gửi nhắc nhở SMS hoặc Email"
                                >
                                  Nhắc hẹn
                                </button>
                              )}

                              {/* UC-LH08: Đánh dấu No-Show (Lễ tân) */}
                              {(isConfirmed || isPending) && !isCancelled && !isNoShow && isReceptionist && (
                                <button
                                  type="button"
                                  onClick={() => openNoShowModal(a)}
                                  style={{
                                    padding: '4px 10px',
                                    fontSize: '12px',
                                    background: '#f1f5f9',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    color: '#475569',
                                    cursor: 'pointer',
                                  }}
                                  title="Xác nhận bệnh nhân vắng mặt (No-Show)"
                                >
                                  Vắng mặt
                                </button>
                              )}

                              {/* UC-LH05: Nút hủy lịch */}
                              {!isCancelled && !isNoShow && a.status !== 'COMPLETED' && (
                                <button
                                  type="button"
                                  onClick={() => openCancelModal(a)}
                                  style={{
                                    padding: '4px 10px',
                                    fontSize: '12px',
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    borderRadius: '6px',
                                    color: '#b91c1c',
                                    cursor: 'pointer',
                                  }}
                                  title="Hủy lịch hẹn khám"
                                >
                                  Hủy hẹn
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ĐẶT LỊCH TIẾP ĐÓN TẠI QUẦY / HOTLINE (UC-LH02, UC-LH01) */}
        {activeTab === 'book' && isReceptionist && (
          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '26px', maxWidth: '840px', margin: '0 auto', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: '20px', color: 'var(--ink)' }}>
              Tiếp đón & Đăng ký Lịch hẹn Khám bệnh
            </h2>
            <p style={{ margin: '0 0 22px', fontSize: '14px', color: 'var(--muted)' }}>
              Dành cho bộ phận Lễ tân tiếp nhận bệnh nhân đăng ký trực tiếp tại quầy hoặc gọi qua tổng đài hỗ trợ.
            </p>

            <form onSubmit={handleBookFromReception}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="field">
                  <label>Kênh tiếp nhận *</label>
                  <select
                    value={bookForm.channel}
                    onChange={(e) => setBookForm({ ...bookForm, channel: e.target.value as any })}
                  >
                    <option value="DIRECT_WALKIN">Tiếp đón trực tiếp tại quầy</option>
                    <option value="CALL_CENTER">Tiếp nhận qua điện thoại / Hotline</option>
                  </select>
                </div>

                <div className="field">
                  <label>Họ và tên bệnh nhân *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={bookForm.fullName}
                    onChange={(e) => setBookForm({ ...bookForm, fullName: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div className="field">
                  <label>Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    placeholder="0912345678"
                    value={bookForm.phone}
                    onChange={(e) => setBookForm({ ...bookForm, phone: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>Giới tính</label>
                  <select
                    value={bookForm.gender}
                    onChange={(e) => setBookForm({ ...bookForm, gender: e.target.value })}
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>

                <div className="field">
                  <label>Ngày sinh</label>
                  <input
                    type="date"
                    value={bookForm.dateOfBirth}
                    onChange={(e) => setBookForm({ ...bookForm, dateOfBirth: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="field">
                  <label>Bác sĩ phụ trách *</label>
                  <select
                    required
                    value={bookForm.doctorId}
                    onChange={(e) => setBookForm({ ...bookForm, doctorId: e.target.value ? Number(e.target.value) : '' })}
                  >
                    <option value="">-- Chọn bác sĩ --</option>
                    {doctors.map(d => (
                      <option key={d.doctorId} value={d.doctorId}>
                        {d.doctorName} ({d.specialty} - {d.departmentName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Ngày khám *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={bookForm.date}
                    onChange={(e) => setBookForm({ ...bookForm, date: e.target.value })}
                  />
                </div>
              </div>

              {/* UC-LH01: Chọn khung giờ trống */}
              <div className="field" style={{ marginBottom: '18px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Khung giờ khám còn trống *</span>
                  {loadingBookSlots && <small style={{ color: 'var(--primary)' }}>Đang kiểm tra lịch trống...</small>}
                </label>

                {bookFormSlots.length === 0 && !loadingBookSlots ? (
                  <p style={{ margin: '6px 0', fontSize: '13.5px', color: '#64748b' }}>
                    Vui lòng chọn Bác sĩ và Ngày khám để xem danh sách khung giờ trống.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))', gap: '8px', marginTop: '6px' }}>
                    {bookFormSlots.map((slot) => {
                      const timeLabel = slot.startTime.slice(0, 5)
                      const isSelected = bookForm.time === timeLabel
                      const isAvail = Boolean(slot.isAvailable ?? slot.available)

                      return (
                        <button
                          key={slot.startTime}
                          type="button"
                          disabled={!isAvail}
                          onClick={() => isAvail && setBookForm({ ...bookForm, time: timeLabel })}
                          style={{
                            padding: '9px 6px',
                            borderRadius: '8px',
                            border: isSelected ? '2px solid var(--primary)' : '1px solid #cbd5e1',
                            background: isSelected ? 'var(--primary)' : isAvail ? '#ffffff' : '#f1f5f9',
                            color: isSelected ? '#ffffff' : isAvail ? 'var(--ink)' : '#94a3b8',
                            fontSize: '13px',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: isAvail ? 'pointer' : 'not-allowed',
                            textAlign: 'center',
                          }}
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

              <div className="field" style={{ marginBottom: '18px' }}>
                <label>Lý do khám / Triệu chứng ban đầu</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả triệu chứng bệnh nhân cung cấp..."
                  value={bookForm.symptomsSummary}
                  onChange={(e) => setBookForm({ ...bookForm, symptomsSummary: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setActiveTab('daily')}
                >
                  Hủy thao tác
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingBook || !bookForm.time}
                >
                  {submittingBook ? 'Đang tạo lịch...' : 'Lưu & Xác nhận lịch hẹn'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: TRA CỨU KHUNG GIỜ TRỐNG CỦA BÁC SĨ (UC-LH01) */}
        {activeTab === 'slots' && (
          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: '0 0 6px', fontSize: '20px', color: 'var(--ink)' }}>
                Xem Khung giờ Trống của Bác sĩ
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)' }}>
                Tra cứu sơ đồ lịch hẹn và các khoảng thời gian trống theo ca trực thực tế của từng bác sĩ trong ngày.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '10px' }}>
              <div style={{ flex: '1 1 250px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                  Bác sĩ
                </label>
                <select
                  value={lookupDoctorId}
                  onChange={(e) => setLookupDoctorId(e.target.value ? Number(e.target.value) : '')}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                >
                  <option value="">-- Chọn bác sĩ --</option>
                  {doctors.map(d => (
                    <option key={d.doctorId} value={d.doctorId}>
                      {d.doctorName} ({d.specialty} - {d.departmentName})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                  Ngày tra cứu
                </label>
                <input
                  type="date"
                  value={lookupDate}
                  onChange={(e) => setLookupDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                />
              </div>

              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setLookupDate(new Date().toISOString().split('T')[0])}
                style={{ padding: '8px 14px', fontSize: '13.5px' }}
              >
                Hôm nay
              </button>
            </div>

            {loadingLookupSlots ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải sơ đồ khung giờ...</div>
            ) : lookupSlots.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                Không có dữ liệu khung giờ cho bác sĩ vào ngày này.
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '14px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#dcfce7', border: '1px solid #86efac' }} />
                    <span>Còn trống (Có thể đặt hẹn)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#fee2e2', border: '1px solid #fca5a5' }} />
                    <span>Đã kín lịch</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                  {lookupSlots.map((slot) => {
                    const isAvail = Boolean(slot.isAvailable ?? slot.available)
                    return (
                      <div
                        key={slot.startTime}
                        style={{
                          padding: '12px 10px',
                          borderRadius: '8px',
                          background: isAvail ? '#f0fdf4' : '#fef2f2',
                          border: `1px solid ${isAvail ? '#bbf7d0' : '#fecaca'}`,
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '15px', fontWeight: 700, color: isAvail ? '#166534' : '#991b1b' }}>
                          {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                          {slot.shiftName}
                        </div>
                        <div style={{ fontSize: '11.5px', fontWeight: 600, color: isAvail ? '#15803d' : '#dc2626', marginTop: '4px' }}>
                          {isAvail ? 'Còn trống' : 'Đã có lịch hẹn'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ===================================================================== */}
      {/* MODAL ĐỔI GIỜ LỊCH HẸN (UC-LH04) */}
      {/* ===================================================================== */}
      {rescheduleModal.isOpen && rescheduleModal.appointment && (
        <div className="modal-overlay" onClick={() => setRescheduleModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <button className="modal-close" onClick={() => setRescheduleModal(prev => ({ ...prev, isOpen: false }))}>
              &times;
            </button>
            <h3 style={{ margin: '0 0 6px', fontSize: '19px', color: 'var(--ink)' }}>
              Đổi Giờ Lịch Hẹn
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '13.5px', color: 'var(--muted)' }}>
              Mã lịch hẹn: <strong>{rescheduleModal.appointment.appointmentCode}</strong> - Bệnh nhân:{' '}
              <strong>{rescheduleModal.appointment.patientName}</strong>
            </p>

            <form onSubmit={handlePerformReschedule}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="field">
                  <label>Ngày khám mới *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={rescheduleModal.newDate}
                    onChange={(e) => {
                      const newD = e.target.value
                      setRescheduleModal(prev => ({ ...prev, newDate: newD }))
                      if (rescheduleModal.newDoctorId) {
                        fetchRescheduleSlots(Number(rescheduleModal.newDoctorId), newD)
                      }
                    }}
                  />
                </div>

                <div className="field">
                  <label>Bác sĩ khám *</label>
                  <select
                    value={rescheduleModal.newDoctorId}
                    onChange={(e) => {
                      const newDoc = e.target.value ? Number(e.target.value) : ''
                      setRescheduleModal(prev => ({ ...prev, newDoctorId: newDoc }))
                      if (newDoc && rescheduleModal.newDate) {
                        fetchRescheduleSlots(Number(newDoc), rescheduleModal.newDate)
                      }
                    }}
                  >
                    {doctors.map(d => (
                      <option key={d.doctorId} value={d.doctorId}>
                        {d.doctorName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Slot picker */}
              <div className="field" style={{ marginBottom: '14px' }}>
                <label>Chọn khung giờ mới còn trống *</label>
                {rescheduleModal.loadingSlots ? (
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Đang tải khung giờ trống...</div>
                ) : rescheduleModal.availableSlots.length === 0 ? (
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Không có slot trống vào ngày này.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '6px', maxHeight: '160px', overflowY: 'auto', padding: '4px' }}>
                    {rescheduleModal.availableSlots.map(slot => {
                      const t = slot.startTime.slice(0, 5)
                      const isSel = rescheduleModal.newTime === t
                      const isAvail = Boolean(slot.isAvailable ?? slot.available)
                      return (
                        <button
                          key={slot.startTime}
                          type="button"
                          disabled={!isAvail}
                          onClick={() => isAvail && setRescheduleModal(prev => ({ ...prev, newTime: t }))}
                          style={{
                            padding: '6px 4px',
                            borderRadius: '6px',
                            border: isSel ? '2px solid var(--primary)' : '1px solid #cbd5e1',
                            background: isSel ? 'var(--primary)' : isAvail ? '#ffffff' : '#f1f5f9',
                            color: isSel ? '#ffffff' : isAvail ? 'var(--ink)' : '#94a3b8',
                            fontSize: '12.5px',
                            fontWeight: isSel ? 700 : 500,
                            cursor: isAvail ? 'pointer' : 'not-allowed',
                          }}
                        >
                          {t}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="field" style={{ marginBottom: '18px' }}>
                <label>Lý do dời lịch</label>
                <textarea
                  rows={2}
                  placeholder="Bệnh nhân bận công tác / Bác sĩ dời ca..."
                  value={rescheduleModal.reason}
                  onChange={(e) => setRescheduleModal(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setRescheduleModal(prev => ({ ...prev, isOpen: false }))}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!rescheduleModal.newTime}
                >
                  Xác nhận đổi giờ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL HỦY LỊCH HẸN (UC-LH05) */}
      {/* ===================================================================== */}
      {cancelModal.isOpen && cancelModal.appointment && (
        <div className="modal-overlay" onClick={() => setCancelModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <button className="modal-close" onClick={() => setCancelModal(prev => ({ ...prev, isOpen: false }))}>
              &times;
            </button>
            <h3 style={{ margin: '0 0 6px', fontSize: '19px', color: '#b91c1c' }}>
              Xác nhận Hủy Lịch Hẹn
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '13.5px', color: 'var(--muted)' }}>
              Quý khách có chắc chắn muốn hủy lịch hẹn <strong>{cancelModal.appointment.appointmentCode}</strong> của bệnh nhân{' '}
              <strong>{cancelModal.appointment.patientName}</strong> không?
            </p>

            <form onSubmit={handlePerformCancel}>
              <div className="field" style={{ marginBottom: '18px' }}>
                <label>Lý do hủy lịch *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Nhập lý do hủy lịch để lưu vết hệ thống..."
                  value={cancelModal.reason}
                  onChange={(e) => setCancelModal(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCancelModal(prev => ({ ...prev, isOpen: false }))}
                >
                  Không hủy
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#dc2626',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  disabled={cancelModal.submitting}
                >
                  {cancelModal.submitting ? 'Đang hủy...' : 'Đồng ý hủy lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL GỬI NHẮC NHỞ LỊCH HẸN (UC-LH06) */}
      {/* ===================================================================== */}
      {reminderModal.isOpen && reminderModal.appointment && (
        <div className="modal-overlay" onClick={() => setReminderModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="modal-close" onClick={() => setReminderModal(prev => ({ ...prev, isOpen: false }))}>
              &times;
            </button>
            <h3 style={{ margin: '0 0 6px', fontSize: '19px', color: 'var(--ink)' }}>
              Gửi Thông Báo Nhắc Lịch Hẹn
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '13.5px', color: 'var(--muted)' }}>
              Lịch khám: <strong>{reminderModal.appointment.appointmentCode}</strong> vào lúc{' '}
              <strong>{reminderModal.appointment.appointmentTime.slice(0, 5)}</strong> ngày{' '}
              <strong>{reminderModal.appointment.appointmentDate}</strong>
            </p>

            <form onSubmit={handlePerformSendReminder}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '14px' }}>
                <div className="field">
                  <label>Phương thức gửi *</label>
                  <select
                    value={reminderModal.reminderType}
                    onChange={(e) => {
                      const t = e.target.value as 'SMS' | 'EMAIL'
                      const rec = t === 'SMS' ? reminderModal.appointment?.patientPhone || '' : reminderModal.appointment?.patientEmail || ''
                      setReminderModal(prev => ({ ...prev, reminderType: t, recipient: rec }))
                    }}
                  >
                    <option value="SMS">Tin nhắn SMS</option>
                    <option value="EMAIL">Thư điện tử Email</option>
                  </select>
                </div>

                <div className="field">
                  <label>Người nhận *</label>
                  <input
                    type="text"
                    required
                    value={reminderModal.recipient}
                    onChange={(e) => setReminderModal(prev => ({ ...prev, recipient: e.target.value }))}
                  />
                </div>
              </div>

              <div className="field" style={{ marginBottom: '14px' }}>
                <label>Tiêu đề thông báo *</label>
                <input
                  type="text"
                  required
                  value={reminderModal.title}
                  onChange={(e) => setReminderModal(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="field" style={{ marginBottom: '18px' }}>
                <label>Nội dung thông báo nhắc hẹn *</label>
                <textarea
                  required
                  rows={4}
                  value={reminderModal.content}
                  onChange={(e) => setReminderModal(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>

              {/* Lịch sử nhắc hẹn trước đó */}
              <div style={{ marginBottom: '18px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '8px' }}>
                  Lịch sử các lần nhắc lịch đã gửi:
                </span>
                {reminderModal.loadingHistory ? (
                  <div style={{ fontSize: '12.5px', color: '#64748b' }}>Đang tải lịch sử...</div>
                ) : reminderModal.history.length === 0 ? (
                  <div style={{ fontSize: '12.5px', color: '#64748b' }}>Chưa có thông báo nào được lưu vết.</div>
                ) : (
                  <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {reminderModal.history.map(h => (
                      <div key={h.id} style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', fontSize: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                          <span><strong>{h.reminderType}</strong> tới {h.recipient}</span>
                          <span>{h.sentAt ? new Date(h.sentAt).toLocaleString('vi-VN') : ''}</span>
                        </div>
                        <div style={{ color: '#334155', marginTop: '2px' }}>{h.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setReminderModal(prev => ({ ...prev, isOpen: false }))}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={reminderModal.submitting}
                >
                  {reminderModal.submitting ? 'Đang gửi...' : 'Gửi thông báo ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL ĐÁNH DẤU BỆNH NHÂN VẮNG MẶT NO-SHOW (UC-LH08) */}
      {/* ===================================================================== */}
      {noShowModal.isOpen && noShowModal.appointment && (
        <div className="modal-overlay" onClick={() => setNoShowModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <button className="modal-close" onClick={() => setNoShowModal(prev => ({ ...prev, isOpen: false }))}>
              &times;
            </button>
            <h3 style={{ margin: '0 0 6px', fontSize: '19px', color: 'var(--ink)' }}>
              Xác Nhận Bệnh Nhân Vắng Mặt (No-Show)
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '13.5px', color: 'var(--muted)' }}>
              Xác nhận bệnh nhân <strong>{noShowModal.appointment.patientName}</strong> không đến khám cho lịch hẹn{' '}
              <strong>{noShowModal.appointment.appointmentCode}</strong>.
              <br />
              <span style={{ color: '#b91c1c', fontWeight: 600, display: 'inline-block', marginTop: '6px' }}>
                Lưu ý: Khi xác nhận vắng mặt, lịch hẹn sẽ mặc định chuyển sang trạng thái "Đã hủy" và không được phép đổi giờ.
              </span>
            </p>

            <form onSubmit={handlePerformNoShow}>
              <div className="field" style={{ marginBottom: '18px' }}>
                <label>Ghi chú lý do vắng mặt *</label>
                <textarea
                  required
                  rows={3}
                  value={noShowModal.reason}
                  onChange={(e) => setNoShowModal(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setNoShowModal(prev => ({ ...prev, isOpen: false }))}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#b91c1c', borderColor: '#b91c1c' }}
                  disabled={noShowModal.submitting}
                >
                  {noShowModal.submitting ? 'Đang xử lý...' : 'Xác nhận Vắng mặt & Hủy lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
