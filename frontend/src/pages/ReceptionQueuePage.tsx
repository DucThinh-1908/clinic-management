import React, { useState, useEffect, useMemo } from 'react'
import type {
  AuthUser,
  QueueTicketItem,
  RoomQueueOverviewItem,
  QueueStatsItem,
  SimpleRoomOption,
  AppointmentItem,
  DepartmentItem,
  DoctorOptionItem,
} from '../types'

interface ReceptionQueuePageProps {
  currentUser?: AuthUser | null
}

export const ReceptionQueuePage: React.FC<ReceptionQueuePageProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'reception' | 'roomQueue' | 'overview' | 'publicBoard'>('reception')
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])

  // Dữ liệu danh mục
  const [rooms, setRooms] = useState<SimpleRoomOption[]>([])
  const [departments, setDepartments] = useState<DepartmentItem[]>([])
  const [doctors, setDoctors] = useState<DoctorOptionItem[]>([])

  // Dữ liệu hàng chờ & tiếp đón
  const [roomOverviews, setRoomOverviews] = useState<RoomQueueOverviewItem[]>([])
  const [stats, setStats] = useState<QueueStatsItem | null>(null)
  const [todayAppointments, setTodayAppointments] = useState<AppointmentItem[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)

  // Hàng chờ theo 1 phòng được chọn (Tab Bác sĩ & Điều dưỡng)
  const [selectedRoomId, setSelectedRoomId] = useState<number | ''>('')
  const [roomTickets, setRoomTickets] = useState<QueueTicketItem[]>([])
  const [loadingRoomTickets, setLoadingRoomTickets] = useState(false)
  const [filterTicketStatus, setFilterTicketStatus] = useState<string>('')

  // Thông báo thao tác
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Modal in / xem phiếu STT vừa cấp (UC-TD03)
  const [ticketModal, setTicketModal] = useState<{
    isOpen: boolean
    ticket: QueueTicketItem | null
  }>({
    isOpen: false,
    ticket: null,
  })

  // Modal Check-in lịch hẹn (UC-TD01)
  const [checkInModal, setCheckInModal] = useState<{
    isOpen: boolean
    appointment: AppointmentItem | null
    targetRoomId: number | ''
    priority: 'NORMAL' | 'PRIORITY' | 'EMERGENCY'
    notes: string
    submitting: boolean
  }>({
    isOpen: false,
    appointment: null,
    targetRoomId: '',
    priority: 'PRIORITY',
    notes: '',
    submitting: false,
  })

  // Modal Chuyển phòng khám (UC-TD06)
  const [transferModal, setTransferModal] = useState<{
    isOpen: boolean
    ticket: QueueTicketItem | null
    targetRoomId: number | ''
    targetDoctorId: number | ''
    reason: string
    submitting: boolean
  }>({
    isOpen: false,
    ticket: null,
    targetRoomId: '',
    targetDoctorId: '',
    reason: 'Điều phối phòng khám giảm tải',
    submitting: false,
  })

  // Form tiếp nhận bệnh nhân vãng lai (UC-TD02)
  const [walkInForm, setWalkInForm] = useState({
    fullName: '',
    phone: '',
    dateOfBirth: '1990-01-01',
    gender: 'MALE',
    identityCard: '',
    healthInsuranceNumber: '',
    address: '',
    departmentId: '' as number | '',
    roomId: '' as number | '',
    doctorId: '' as number | '',
    serviceType: 'Khám đa khoa tổng quát',
    priority: 'NORMAL' as 'NORMAL' | 'PRIORITY' | 'EMERGENCY',
    notes: '',
  })
  const [submittingWalkIn, setSubmittingWalkIn] = useState(false)
  const [searchAppointmentKeyword, setSearchAppointmentKeyword] = useState('')

  // Phân quyền
  const isReceptionist = useMemo(() => {
    return currentUser?.roles.some(r => ['admin', 'manager', 'receptionist'].includes(r.toLowerCase())) ?? false
  }, [currentUser])

  const isDoctorOrNurse = useMemo(() => {
    return currentUser?.roles.some(r => ['admin', 'manager', 'doctor', 'nurse'].includes(r.toLowerCase())) ?? false
  }, [currentUser])

  // Tải danh mục phòng khám & chuyên khoa & bác sĩ
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [roomsRes, deptsRes, docsRes] = await Promise.all([
          fetch('/api/rooms'),
          fetch('/api/departments'),
          fetch(`/api/appointments/doctors?date=${selectedDate}`),
        ])
        if (roomsRes.ok) {
          const rData: SimpleRoomOption[] = await roomsRes.json()
          setRooms(rData)
          if (rData.length > 0) {
            setSelectedRoomId(prev => prev === '' ? rData[0].id : prev)
            setWalkInForm(prev => ({ ...prev, roomId: prev.roomId ? prev.roomId : rData[0].id }))
          }
        }
        if (deptsRes.ok) {
          const dData: DepartmentItem[] = await deptsRes.json()
          setDepartments(dData)
        }
        if (docsRes.ok) {
          setDoctors(await docsRes.json())
        }
      } catch (e) {
        console.error('Lỗi tải danh mục tiếp đón:', e)
      }
    }
    fetchMeta()
  }, [selectedDate])

  // Tải dữ liệu tổng quan hàng chờ & thống kê
  const fetchOverviewAndStats = async () => {
    try {
      const [ovRes, stRes] = await Promise.all([
        fetch(`/api/queue/overview?date=${selectedDate}`),
        fetch(`/api/queue/stats?date=${selectedDate}`),
      ])
      if (ovRes.ok) {
        setRoomOverviews(await ovRes.json())
      }
      if (stRes.ok) {
        setStats(await stRes.json())
      }
    } catch (e) {
      console.error('Lỗi tải tổng quan hàng chờ:', e)
    }
  }

  // Tải lịch hẹn ngày hôm nay để check-in
  const fetchTodayAppointments = async () => {
    setLoadingAppointments(true)
    try {
      const res = await fetch(`/api/appointments?date=${selectedDate}`)
      if (res.ok) {
        const data: AppointmentItem[] = await res.json()
        setTodayAppointments(data)
      }
    } catch (e) {
      console.error('Lỗi tải lịch hẹn tiếp đón:', e)
    } finally {
      setLoadingAppointments(false)
    }
  }

  // Tải chi tiết hàng chờ theo 1 phòng khám được chọn
  const fetchRoomTickets = async () => {
    if (!selectedRoomId) return
    setLoadingRoomTickets(true)
    try {
      const statusParam = filterTicketStatus ? `&status=${filterTicketStatus}` : ''
      const res = await fetch(`/api/queue/room/${selectedRoomId}?date=${selectedDate}${statusParam}`)
      if (res.ok) {
        setRoomTickets(await res.json())
      }
    } catch (e) {
      console.error('Lỗi tải hàng chờ phòng khám:', e)
    } finally {
      setLoadingRoomTickets(false)
    }
  }

  // Auto reload theo tab và chu kỳ 10 giây
  useEffect(() => {
    fetchOverviewAndStats()
    if (activeTab === 'reception') {
      fetchTodayAppointments()
    } else if (activeTab === 'roomQueue') {
      fetchRoomTickets()
    }

    const interval = setInterval(() => {
      fetchOverviewAndStats()
      if (activeTab === 'roomQueue') {
        fetchRoomTickets()
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [selectedDate, activeTab, selectedRoomId, filterTicketStatus])

  // 1. Mở modal check-in lịch hẹn (UC-TD01)
  const openCheckInModal = (app: AppointmentItem) => {
    // Tìm phòng khám đề xuất cho bác sĩ hoặc chuyên khoa
    let defaultRoomId: number | '' = ''
    if (app.doctorId) {
      const docScheduleRoom = roomOverviews.find(ro => ro.doctorId === app.doctorId)
      if (docScheduleRoom) {
        defaultRoomId = docScheduleRoom.roomId
      }
    }
    if (!defaultRoomId && app.departmentId) {
      const deptRoom = rooms.find(r => r.departmentId === app.departmentId && r.isAvailable)
      if (deptRoom) {
        defaultRoomId = deptRoom.id
      }
    }
    if (!defaultRoomId && rooms.length > 0) {
      defaultRoomId = rooms[0].id
    }

    setCheckInModal({
      isOpen: true,
      appointment: app,
      targetRoomId: defaultRoomId,
      priority: 'PRIORITY',
      notes: 'Bệnh nhân có mặt tiếp đón theo lịch hẹn',
      submitting: false,
    })
  }

  // Thực hiện Check-in lịch hẹn (UC-TD01, UC-TD03)
  const handlePerformCheckIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!checkInModal.appointment) return

    setCheckInModal(prev => ({ ...prev, submitting: true }))
    setActionMessage(null)

    try {
      const payload = {
        appointmentId: checkInModal.appointment.id,
        roomId: checkInModal.targetRoomId ? Number(checkInModal.targetRoomId) : undefined,
        priority: checkInModal.priority,
        notes: checkInModal.notes.trim() || undefined,
      }

      const res = await fetch(`/api/queue/check-in?userId=${currentUser?.id || ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `Check-in thành công cho bệnh nhân ${data.patientName}. Cấp số thứ tự: ${data.ticketCode} (Phòng ${data.roomNumber}).`,
        })
        setCheckInModal(prev => ({ ...prev, isOpen: false }))
        setTicketModal({ isOpen: true, ticket: data })
        fetchTodayAppointments()
        fetchOverviewAndStats()
      } else {
        setActionMessage({ type: 'error', text: data.message || 'Lỗi khi check-in lịch hẹn' })
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Lỗi kết nối máy chủ' })
    } finally {
      setCheckInModal(prev => ({ ...prev, submitting: false }))
    }
  }

  // 2. Tiếp nhận bệnh nhân vãng lai (UC-TD02, UC-TD03)
  const handlePerformWalkIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!walkInForm.fullName || !walkInForm.phone) {
      setActionMessage({ type: 'error', text: 'Vui lòng điền đủ họ tên và số điện thoại bệnh nhân.' })
      return
    }

    setSubmittingWalkIn(true)
    setActionMessage(null)

    try {
      const payload = {
        fullName: walkInForm.fullName.trim(),
        phone: walkInForm.phone.trim(),
        dateOfBirth: walkInForm.dateOfBirth,
        gender: walkInForm.gender,
        identityCard: walkInForm.identityCard.trim() || undefined,
        healthInsuranceNumber: walkInForm.healthInsuranceNumber.trim() || undefined,
        address: walkInForm.address.trim() || undefined,
        departmentId: walkInForm.departmentId ? Number(walkInForm.departmentId) : undefined,
        roomId: walkInForm.roomId ? Number(walkInForm.roomId) : undefined,
        doctorId: walkInForm.doctorId ? Number(walkInForm.doctorId) : undefined,
        serviceType: walkInForm.serviceType.trim(),
        priority: walkInForm.priority,
        notes: walkInForm.notes.trim() || undefined,
      }

      const res = await fetch(`/api/queue/walk-in?userId=${currentUser?.id || ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `Tiếp nhận thành công bệnh nhân vãng lai ${data.patientName}. Cấp số thứ tự: ${data.ticketCode} (Phòng ${data.roomNumber}).`,
        })
        // Reset form
        setWalkInForm({
          fullName: '',
          phone: '',
          dateOfBirth: '1990-01-01',
          gender: 'MALE',
          identityCard: '',
          healthInsuranceNumber: '',
          address: '',
          departmentId: '',
          roomId: rooms.length > 0 ? rooms[0].id : '',
          doctorId: '',
          serviceType: 'Khám đa khoa tổng quát',
          priority: 'NORMAL',
          notes: '',
        })
        setTicketModal({ isOpen: true, ticket: data })
        fetchOverviewAndStats()
      } else {
        setActionMessage({ type: 'error', text: data.message || 'Lỗi khi tiếp nhận bệnh nhân vãng lai' })
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Lỗi kết nối máy chủ' })
    } finally {
      setSubmittingWalkIn(false)
    }
  }

  // 3. Gọi bệnh nhân vào khám (UC-TD05)
  const handleCallPatient = async (ticketId?: number) => {
    setActionMessage(null)
    try {
      const url = ticketId
        ? `/api/queue/${ticketId}/call?userId=${currentUser?.id || ''}`
        : `/api/queue/room/${selectedRoomId}/call-next?userId=${currentUser?.id || ''}`

      const res = await fetch(url, { method: 'PUT' })
      const data = await res.json()
      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `Đang gọi bệnh nhân: ${data.ticketCode} - ${data.patientName} vào khám.`,
        })
        fetchRoomTickets()
        fetchOverviewAndStats()
      } else {
        setActionMessage({ type: 'error', text: data.message || 'Không thể gọi bệnh nhân' })
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Lỗi kết nối' })
    }
  }

  // Bác sĩ bắt đầu khám
  const handleStartServing = async (ticketId: number) => {
    try {
      const res = await fetch(`/api/queue/${ticketId}/start?userId=${currentUser?.id || ''}`, { method: 'PUT' })
      const data = await res.json()
      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `Đã bắt đầu phiên khám bệnh cho STT ${data.ticketCode} (${data.patientName}).`,
        })
        fetchRoomTickets()
        fetchOverviewAndStats()
      } else {
        setActionMessage({ type: 'error', text: data.message || 'Lỗi bắt đầu khám' })
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message })
    }
  }

  // Bác sĩ hoàn thành phiên khám
  const handleCompleteServing = async (ticketId: number) => {
    try {
      const res = await fetch(`/api/queue/${ticketId}/complete?userId=${currentUser?.id || ''}`, { method: 'PUT' })
      const data = await res.json()
      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `Hoàn tất phiên khám cho bệnh nhân ${data.patientName} (STT ${data.ticketCode}).`,
        })
        fetchRoomTickets()
        fetchOverviewAndStats()
      } else {
        setActionMessage({ type: 'error', text: data.message || 'Lỗi hoàn tất khám' })
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message })
    }
  }

  // Bỏ qua bệnh nhân (SKIPPED)
  const handleSkipPatient = async (ticketId: number) => {
    const reason = window.prompt('Nhập lý do bỏ qua lượt khám (Ví dụ: Gọi 3 lần không có mặt):', 'Gọi 3 lần không có mặt')
    if (!reason) return

    try {
      const res = await fetch(`/api/queue/${ticketId}/skip?userId=${currentUser?.id || ''}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const data = await res.json()
      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `Đã bỏ qua lượt khám STT ${data.ticketCode} (${data.patientName}).`,
        })
        fetchRoomTickets()
        fetchOverviewAndStats()
      } else {
        setActionMessage({ type: 'error', text: data.message || 'Lỗi khi bỏ qua lượt' })
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message })
    }
  }

  // 4. Mở modal chuyển phòng khám (UC-TD06)
  const openTransferModal = (ticket: QueueTicketItem) => {
    const otherRooms = rooms.filter(r => r.id !== ticket.roomId && r.isAvailable)
    setTransferModal({
      isOpen: true,
      ticket,
      targetRoomId: otherRooms.length > 0 ? otherRooms[0].id : '',
      targetDoctorId: '',
      reason: 'Điều phối sang phòng khám có chuyên môn phù hợp / giảm tải',
      submitting: false,
    })
  }

  // Thực hiện chuyển phòng (UC-TD06)
  const handlePerformTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transferModal.ticket || !transferModal.targetRoomId) return

    setTransferModal(prev => ({ ...prev, submitting: true }))
    setActionMessage(null)

    try {
      const payload = {
        targetRoomId: Number(transferModal.targetRoomId),
        targetDoctorId: transferModal.targetDoctorId ? Number(transferModal.targetDoctorId) : undefined,
        reason: transferModal.reason.trim(),
      }

      const res = await fetch(`/api/queue/${transferModal.ticket.id}/transfer?userId=${currentUser?.id || ''}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `Đã chuyển bệnh nhân ${data.patientName} sang phòng ${data.roomNumber}. Số thứ tự mới: ${data.ticketCode}.`,
        })
        setTransferModal(prev => ({ ...prev, isOpen: false }))
        fetchRoomTickets()
        fetchOverviewAndStats()
      } else {
        setActionMessage({ type: 'error', text: data.message || 'Lỗi khi chuyển phòng khám' })
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Lỗi kết nối' })
    } finally {
      setTransferModal(prev => ({ ...prev, submitting: false }))
    }
  }

  // In phiếu khám tại quầy
  const handlePrintTicket = () => {
    window.print()
  }

  // Lọc lịch hẹn check-in theo từ khóa
  const filteredAppointments = useMemo(() => {
    if (!searchAppointmentKeyword.trim()) return todayAppointments
    const q = searchAppointmentKeyword.trim().toLowerCase()
    return todayAppointments.filter(a =>
      a.appointmentCode.toLowerCase().includes(q) ||
      a.patientName.toLowerCase().includes(q) ||
      a.patientPhone.includes(q)
    )
  }, [todayAppointments, searchAppointmentKeyword])

  // Badge trạng thái phiếu hàng đợi
  const renderTicketStatusBadge = (status: string) => {
    switch (status) {
      case 'WAITING':
        return (
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 600 }}>
            Đang chờ
          </span>
        )
      case 'CALLED':
        return (
          <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 700 }}>
            Đang gọi vào
          </span>
        )
      case 'SERVING':
        return (
          <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 700 }}>
            Đang khám
          </span>
        )
      case 'COMPLETED':
        return (
          <span style={{ background: '#f3e8ff', color: '#6b21a8', padding: '4px 8px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 600 }}>
            Đã xong
          </span>
        )
      case 'SKIPPED':
        return (
          <span style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 8px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 600 }}>
            Đã bỏ qua
          </span>
        )
      default:
        return <span>{status}</span>
    }
  }

  const renderPriorityBadge = (p: string) => {
    switch (p) {
      case 'EMERGENCY':
        return <span style={{ background: '#ef4444', color: '#ffffff', padding: '2px 7px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>CẤP CỨU</span>
      case 'PRIORITY':
        return <span style={{ background: '#f59e0b', color: '#ffffff', padding: '2px 7px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Ưu tiên</span>
      default:
        return <span style={{ color: '#64748b', fontSize: '11px' }}>Thường</span>
    }
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '85vh', padding: '24px 0 60px' }}>
      <div className="container" style={{ maxWidth: '1260px' }}>

        {/* Tiêu đề & Điều hướng Tab */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Phân hệ Tiếp đón & Hàng đợi
            </span>
            <h1 style={{ margin: '4px 0 6px', fontSize: '26px', color: 'var(--ink)' }}>
              Tiếp Đón & Xếp Hàng Khám Bệnh
            </h1>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14.5px' }}>
              Check-in lịch hẹn, tiếp nhận bệnh nhân vãng lai, cấp số thứ tự tự động, điều phối hàng chờ và gọi khám.
            </p>
          </div>

          {/* Chọn ngày & Tab selector */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: '#ffffff', padding: '6px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Ngày:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', background: '#ffffff', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setActiveTab('reception')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'reception' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'reception' ? '#ffffff' : '#475569',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                }}
              >
                Tiếp đón & Cấp số
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('roomQueue')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'roomQueue' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'roomQueue' ? '#ffffff' : '#475569',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                }}
              >
                Hàng chờ Phòng khám
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'overview' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'overview' ? '#ffffff' : '#475569',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                }}
              >
                Tổng quan Tất cả phòng
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('publicBoard')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'publicBoard' ? '#0f172a' : 'transparent',
                  color: activeTab === 'publicBoard' ? '#ffffff' : '#475569',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                }}
              >
                Màn hình Gọi số Công cộng
              </button>
            </div>
          </div>
        </div>

        {/* Thông báo thao tác */}
        {actionMessage && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '18px',
              fontSize: '14px',
              background: actionMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
              color: actionMessage.type === 'success' ? '#166534' : '#991b1b',
              border: `1px solid ${actionMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
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

        {/* Thanh tóm tắt nhanh thống kê ngày */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '22px' }}>
            <div style={{ background: '#ffffff', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>Tổng lượt tiếp đón</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--ink)', marginTop: '4px' }}>{stats.totalTickets}</div>
            </div>
            <div style={{ background: '#ffffff', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '12.5px', color: '#92400e', fontWeight: 600 }}>Đang chờ khám</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>{stats.waiting}</div>
            </div>
            <div style={{ background: '#ffffff', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '12.5px', color: '#1e40af', fontWeight: 600 }}>Đang gọi vào</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>{stats.called}</div>
            </div>
            <div style={{ background: '#ffffff', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '12.5px', color: '#166534', fontWeight: 600 }}>Đang trong phòng khám</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>{stats.serving}</div>
            </div>
            <div style={{ background: '#ffffff', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '12.5px', color: '#6b21a8', fontWeight: 600 }}>Đã hoàn tất khám</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#9333ea', marginTop: '4px' }}>{stats.completed}</div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 1: TIẾP ĐÓN TẠI QUẦY & CẤP SỐ (UC-TD01, UC-TD02, UC-TD03) */}
        {/* ===================================================================== */}
        {activeTab === 'reception' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '22px' }}>

            {/* BÊN TRÁI: CHECK-IN BỆNH NHÂN CÓ LỊCH HẸN (UC-TD01) */}
            <div style={{ background: '#ffffff', padding: '22px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--ink)' }}>
                    Check-in Lịch Hẹn Hôm Nay
                  </h3>
                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                    Tiếp đón bệnh nhân đã đặt hẹn trước và cấp số thứ tự vào phòng khám
                  </span>
                </div>
                <button
                  type="button"
                  onClick={fetchTodayAppointments}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '12.5px' }}
                >
                  Làm mới
                </button>
              </div>

              {/* Tìm kiếm lịch hẹn nhanh */}
              <div style={{ marginBottom: '14px' }}>
                <input
                  type="text"
                  placeholder="Tìm theo mã lịch hẹn, tên hoặc số điện thoại..."
                  value={searchAppointmentKeyword}
                  onChange={(e) => setSearchAppointmentKeyword(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                />
              </div>

              {/* Danh sách lịch hẹn */}
              {loadingAppointments ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Đang tải lịch hẹn...</div>
              ) : filteredAppointments.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px' }}>
                  Không có lịch hẹn nào phù hợp ngày hôm nay.
                </div>
              ) : (
                <div style={{ maxHeight: '480px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredAppointments.map(app => {
                    const isCheckedIn = app.status === 'CHECKED_IN'
                    const isCancelled = app.status === 'CANCELLED' || app.status === 'NO_SHOW'

                    return (
                      <div
                        key={app.id}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          background: isCheckedIn ? '#f0fdf4' : '#ffffff',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ color: 'var(--primary)', fontSize: '13.5px' }}>{app.appointmentCode}</strong>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>• {app.appointmentTime.slice(0, 5)}</span>
                            {isCheckedIn ? (
                              <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>
                                Đã Check-in
                              </span>
                            ) : isCancelled ? (
                              <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>
                                Đã hủy
                              </span>
                            ) : (
                              <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>
                                Chờ tiếp đón
                              </span>
                            )}
                          </div>
                          <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '14px', marginTop: '2px' }}>
                            {app.patientName} <span style={{ fontWeight: 400, color: '#64748b', fontSize: '12.5px' }}>({app.patientPhone})</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                            Bác sĩ: <strong>{app.doctorName || 'Bác sĩ chuyên khoa'}</strong>
                            {app.departmentName ? ` • ${app.departmentName}` : ''}
                          </div>
                        </div>

                        <div>
                          {!isCheckedIn && !isCancelled && isReceptionist && (
                            <button
                              type="button"
                              onClick={() => openCheckInModal(app)}
                              className="btn btn-primary btn-sm"
                              style={{ padding: '6px 12px', fontSize: '12.5px', whiteSpace: 'nowrap' }}
                            >
                              Check-in & Cấp STT
                            </button>
                          )}
                          {isCheckedIn && (
                            <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                              Sẵn sàng khám
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* BÊN PHẢI: TIẾP NHẬN BỆNH NHÂN VÃNG LAI (UC-TD02, UC-TD03) */}
            <div style={{ background: '#ffffff', padding: '22px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '18px', color: 'var(--ink)' }}>
                Tiếp Nhận Bệnh Nhân Vãng Lai
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--muted)' }}>
                Dành cho bệnh nhân đến khám trực tiếp không hẹn trước. Tự động sinh số thứ tự và phân phòng.
              </p>

              <form onSubmit={handlePerformWalkIn}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="field">
                    <label>Họ và tên bệnh nhân *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={walkInForm.fullName}
                      onChange={(e) => setWalkInForm(prev => ({ ...prev, fullName: e.target.value }))}
                    />
                  </div>
                  <div className="field">
                    <label>Số điện thoại *</label>
                    <input
                      type="tel"
                      required
                      placeholder="0912345678"
                      value={walkInForm.phone}
                      onChange={(e) => setWalkInForm(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="field">
                    <label>Ngày sinh</label>
                    <input
                      type="date"
                      value={walkInForm.dateOfBirth}
                      onChange={(e) => setWalkInForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    />
                  </div>
                  <div className="field">
                    <label>Giới tính</label>
                    <select
                      value={walkInForm.gender}
                      onChange={(e) => setWalkInForm(prev => ({ ...prev, gender: e.target.value }))}
                    >
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Mức ưu tiên</label>
                    <select
                      value={walkInForm.priority}
                      onChange={(e) => setWalkInForm(prev => ({ ...prev, priority: e.target.value as any }))}
                    >
                      <option value="NORMAL">Bình thường</option>
                      <option value="PRIORITY">Ưu tiên (Cao tuổi/Trẻ em)</option>
                      <option value="EMERGENCY">Cấp cứu khẩn</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="field">
                    <label>Số CCCD / Hộ chiếu</label>
                    <input
                      type="text"
                      placeholder="Số định danh công dân"
                      value={walkInForm.identityCard}
                      onChange={(e) => setWalkInForm(prev => ({ ...prev, identityCard: e.target.value }))}
                    />
                  </div>
                  <div className="field">
                    <label>Mã thẻ BHYT (nếu có)</label>
                    <input
                      type="text"
                      placeholder="Mã thẻ bảo hiểm y tế"
                      value={walkInForm.healthInsuranceNumber}
                      onChange={(e) => setWalkInForm(prev => ({ ...prev, healthInsuranceNumber: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="field">
                    <label>Chuyên khoa khám</label>
                    <select
                      value={walkInForm.departmentId}
                      onChange={(e) => {
                        const nextDeptId = Number(e.target.value) || ''
                        const filtered = rooms.filter(r => r.isAvailable !== false && (!nextDeptId || r.departmentId === nextDeptId))
                        setWalkInForm(prev => ({
                          ...prev,
                          departmentId: nextDeptId,
                          roomId: filtered.length > 0 ? filtered[0].id : '',
                        }))
                      }}
                    >
                      <option value="">-- Tất cả khoa --</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Phòng khám tiếp nhận *</label>
                    <select
                      required
                      value={walkInForm.roomId}
                      onChange={(e) => setWalkInForm(prev => ({ ...prev, roomId: Number(e.target.value) || '' }))}
                    >
                      <option value="">-- Chọn phòng khám --</option>
                      {rooms
                        .filter(r => r.isAvailable !== false && (!walkInForm.departmentId || r.departmentId === Number(walkInForm.departmentId)))
                        .map(r => (
                          <option key={r.id} value={r.id}>
                            {r.roomNumber} - {r.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Chỉ định Bác sĩ (tùy chọn)</label>
                    <select
                      value={walkInForm.doctorId}
                      onChange={(e) => setWalkInForm(prev => ({ ...prev, doctorId: Number(e.target.value) || '' }))}
                    >
                      <option value="">Theo phân công phòng khám</option>
                      {doctors.map(d => (
                        <option key={d.doctorId} value={d.doctorId}>
                          {d.doctorName} ({d.specialty})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="field" style={{ marginBottom: '12px' }}>
                  <label>Lý do khám / Triệu chứng ban đầu</label>
                  <input
                    type="text"
                    placeholder="Đau họng, sốt nhẹ, đau dạ dày..."
                    value={walkInForm.serviceType}
                    onChange={(e) => setWalkInForm(prev => ({ ...prev, serviceType: e.target.value }))}
                  />
                </div>

                <div className="field" style={{ marginBottom: '16px' }}>
                  <label>Ghi chú tiếp đón</label>
                  <input
                    type="text"
                    placeholder="Ghi chú thêm nếu có..."
                    value={walkInForm.notes}
                    onChange={(e) => setWalkInForm(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submittingWalkIn}
                    style={{ padding: '8px 20px', fontSize: '14px' }}
                  >
                    {submittingWalkIn ? 'Đang cấp số...' : 'Tiếp nhận & Cấp số thứ tự'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: HÀNG CHỜ THEO PHÒNG KHÁM (UC-TD04, UC-TD05, UC-TD06) */}
        {/* ===================================================================== */}
        {activeTab === 'roomQueue' && (
          <div style={{ background: '#ffffff', padding: '22px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>

            {/* Bộ điều khiển chọn phòng & Bấm gọi số */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <label style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '14px' }}>Chọn phòng khám:</label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(Number(e.target.value) || '')}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600, minWidth: '220px' }}
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.roomNumber} - {r.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filterTicketStatus}
                  onChange={(e) => setFilterTicketStatus(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="WAITING">Đang chờ (WAITING)</option>
                  <option value="CALLED">Đang gọi vào (CALLED)</option>
                  <option value="SERVING">Đang khám (SERVING)</option>
                  <option value="COMPLETED">Đã khám xong (COMPLETED)</option>
                  <option value="SKIPPED">Đã bỏ qua (SKIPPED)</option>
                </select>
              </div>

              {/* Nút hành động nhanh dành cho Bác sĩ & Điều dưỡng (UC-TD05) */}
              {isDoctorOrNurse && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleCallPatient()}
                    className="btn btn-primary"
                    style={{ padding: '8px 18px', fontSize: '14px', fontWeight: 700 }}
                    title="Gọi bệnh nhân đang chờ tiếp theo vào phòng khám"
                  >
                    Gọi bệnh nhân kế tiếp
                  </button>
                  <button
                    type="button"
                    onClick={fetchRoomTickets}
                    className="btn btn-outline"
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                  >
                    Làm mới
                  </button>
                </div>
              )}
            </div>

            {/* Danh sách bệnh nhân trong hàng chờ phòng */}
            {loadingRoomTickets ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải danh sách hàng chờ...</div>
            ) : roomTickets.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px' }}>
                Hiện không có bệnh nhân nào trong hàng chờ phòng khám này.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>STT & Mã phiếu</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>Bệnh nhân</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>Phân loại & Ưu tiên</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>Lý do khám</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>Trạng thái</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>Lần gọi</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomTickets.map((t) => {
                      const isWaiting = t.status === 'WAITING'
                      const isCalled = t.status === 'CALLED'
                      const isServing = t.status === 'SERVING'
                      const isDone = t.status === 'COMPLETED' || t.status === 'SKIPPED'

                      return (
                        <tr
                          key={t.id}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            background: isCalled ? '#eff6ff' : isServing ? '#f0fdf4' : '#ffffff',
                          }}
                        >
                          <td style={{ padding: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}>
                                #{t.ticketNumber}
                              </span>
                              <div>
                                <strong style={{ color: '#0f172a', display: 'block', fontSize: '12.5px' }}>{t.ticketCode}</strong>
                                {t.waitPosition > 0 && isWaiting && (
                                  <span style={{ fontSize: '11px', color: '#64748b' }}>Chờ {t.waitPosition} người</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{t.patientName}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              {t.patientPhone} {t.patientAge ? `• ${t.patientAge} tuổi` : ''}
                            </div>
                          </td>
                          <td style={{ padding: '14px' }}>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                              {renderPriorityBadge(t.priority)}
                              {t.isAppointment && (
                                <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>
                                  Có hẹn trước
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '14px', maxWidth: '180px' }}>
                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#334155' }}>
                              {t.serviceType || 'Khám tổng quát'}
                            </div>
                            {t.transferReason && (
                              <div style={{ fontSize: '11px', color: '#f59e0b' }}>
                                Chuyển: {t.transferReason}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '14px' }}>
                            {renderTicketStatusBadge(t.status)}
                          </td>
                          <td style={{ padding: '14px' }}>
                            <span style={{ fontWeight: 600, color: t.callCount > 0 ? '#2563eb' : '#94a3b8' }}>
                              {t.callCount} lần
                            </span>
                          </td>
                          <td style={{ padding: '14px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>

                              {/* UC-TD05: Gọi bệnh nhân (Bác sĩ, Điều dưỡng) */}
                              {isDoctorOrNurse && (isWaiting || isCalled) && (
                                <button
                                  type="button"
                                  onClick={() => handleCallPatient(t.id)}
                                  className="btn btn-primary btn-sm"
                                  style={{ padding: '4px 8px', fontSize: '12px' }}
                                  title="Gọi bệnh nhân vào phòng khám"
                                >
                                  {isCalled ? 'Gọi lại' : 'Gọi vào'}
                                </button>
                              )}

                              {/* Bác sĩ bắt đầu khám */}
                              {isDoctorOrNurse && isCalled && (
                                <button
                                  type="button"
                                  onClick={() => handleStartServing(t.id)}
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                    background: '#16a34a',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                  }}
                                  title="Bắt đầu khám bệnh nhân này"
                                >
                                  Khám
                                </button>
                              )}

                              {/* Bác sĩ hoàn thành khám */}
                              {isDoctorOrNurse && isServing && (
                                <button
                                  type="button"
                                  onClick={() => handleCompleteServing(t.id)}
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                    background: '#9333ea',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                  }}
                                  title="Hoàn thành phiên khám"
                                >
                                  Xong
                                </button>
                              )}

                              {/* Bỏ qua khi gọi không có mặt */}
                              {isDoctorOrNurse && (isWaiting || isCalled) && (
                                <button
                                  type="button"
                                  onClick={() => handleSkipPatient(t.id)}
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                    background: '#fee2e2',
                                    color: '#991b1b',
                                    border: '1px solid #fecaca',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                  }}
                                  title="Bỏ qua khi gọi không có mặt"
                                >
                                  Bỏ qua
                                </button>
                              )}

                              {/* UC-TD06: Chuyển bệnh nhân sang phòng khác (Lễ tân) */}
                              {isReceptionist && !isDone && (
                                <button
                                  type="button"
                                  onClick={() => openTransferModal(t)}
                                  className="btn btn-outline btn-sm"
                                  style={{ padding: '4px 8px', fontSize: '12px' }}
                                  title="Chuyển bệnh nhân sang phòng khám hoặc bác sĩ khác"
                                >
                                  Chuyển phòng
                                </button>
                              )}

                              {/* Xem phiếu in */}
                              <button
                                type="button"
                                onClick={() => setTicketModal({ isOpen: true, ticket: t })}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '12px',
                                  background: '#f1f5f9',
                                  color: '#475569',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                }}
                                title="Xem phiếu số thứ tự"
                              >
                                Xem phiếu
                              </button>
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

        {/* ===================================================================== */}
        {/* TAB 3: TỔNG QUAN TẤT CẢ PHÒNG KHÁM (UC-TD04, UC-TD06) */}
        {/* ===================================================================== */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '18px' }}>
              {roomOverviews.map(ro => (
                <div
                  key={ro.roomId}
                  style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '18px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700 }}>
                        {ro.departmentName || 'Khoa khám bệnh'}
                      </span>
                      <h4 style={{ margin: '2px 0', fontSize: '18px', color: 'var(--ink)' }}>
                        {ro.roomNumber} - {ro.roomName}
                      </h4>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>
                        Bác sĩ trực: <strong>{ro.doctorName || 'Chưa phân công'}</strong>
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: ro.isAvailable ?? ro.available ? '#dcfce7' : '#fee2e2',
                        color: ro.isAvailable ?? ro.available ? '#166534' : '#991b1b',
                      }}
                    >
                      {ro.isAvailable ?? ro.available ? 'Đang mở' : 'Tạm đóng'}
                    </span>
                  </div>

                  {/* Bệnh nhân đang khám & đang gọi */}
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '14px', border: '1px solid #f1f5f9' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>ĐANG KHÁM:</span>
                      {ro.currentServing ? (
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#16a34a', marginTop: '2px' }}>
                          #{ro.currentServing.ticketNumber} - {ro.currentServing.patientName}
                        </div>
                      ) : (
                        <div style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>Chưa có bệnh nhân khám</div>
                      )}
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: 600 }}>ĐANG GỌI VÀO:</span>
                      {ro.currentCalled ? (
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#2563eb', marginTop: '2px' }}>
                          #{ro.currentCalled.ticketNumber} - {ro.currentCalled.patientName}
                        </div>
                      ) : (
                        <div style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>Không có lượt gọi</div>
                      )}
                    </div>
                  </div>

                  {/* Số lượng chờ */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                    <div>
                      Đang chờ: <strong style={{ color: '#d97706', fontSize: '15px' }}>{ro.waitingCount}</strong> | Đã xong:{' '}
                      <strong style={{ color: '#7c3aed' }}>{ro.completedCount}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRoomId(ro.roomId)
                        setActiveTab('roomQueue')
                      }}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '12px' }}
                    >
                      Xem chi tiết phòng
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 4: MÀN HÌNH GỌI SỐ CÔNG CỘNG (PUBLIC QUEUE DISPLAY SCREEN) */}
        {/* ===================================================================== */}
        {activeTab === 'publicBoard' && (
          <div style={{ background: '#0f172a', padding: '30px', borderRadius: '16px', color: '#ffffff', minHeight: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #334155', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '24px', color: '#38bdf8', letterSpacing: '0.5px' }}>
                  BẢNG ĐIỆN TỬ GỌI SỐ KHÁM BỆNH
                </h2>
                <span style={{ fontSize: '14px', color: '#94a3b8' }}>
                  Phòng khám CarePlus Clinic • Ngày: {selectedDate}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#38bdf8', background: '#1e293b', padding: '6px 14px', borderRadius: '8px' }}>
                Tự động cập nhật mỗi 10 giây
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {roomOverviews.map(ro => (
                <div
                  key={ro.roomId}
                  style={{
                    background: '#1e293b',
                    borderRadius: '12px',
                    padding: '20px',
                    border: ro.currentCalled ? '2px solid #38bdf8' : '1px solid #334155',
                    boxShadow: ro.currentCalled ? '0 0 15px rgba(56, 189, 248, 0.3)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
                      {ro.roomNumber} - {ro.roomName}
                    </div>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{ro.departmentName}</span>
                  </div>

                  {/* Hộp số đang gọi */}
                  <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', textAlign: 'center', marginBottom: '14px' }}>
                    <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 700, letterSpacing: '1px' }}>
                      SỐ ĐANG GỌI VÀO PHÒNG
                    </div>
                    {ro.currentCalled ? (
                      <div>
                        <div style={{ fontSize: '42px', fontWeight: 900, color: '#38bdf8', margin: '4px 0' }}>
                          #{ro.currentCalled.ticketNumber}
                        </div>
                        <div style={{ fontSize: '15px', color: '#ffffff', fontWeight: 600 }}>
                          {ro.currentCalled.patientName}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '18px', color: '#64748b', margin: '14px 0' }}>--</div>
                    )}
                  </div>

                  {/* Đang khám & Hàng đợi */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#cbd5e1' }}>
                    <div>
                      Đang khám:{' '}
                      <strong style={{ color: '#4ade80' }}>
                        {ro.currentServing ? `#${ro.currentServing.ticketNumber}` : 'Trống'}
                      </strong>
                    </div>
                    <div>
                      Đang chờ: <strong style={{ color: '#fbbf24' }}>{ro.waitingCount}</strong> người
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ===================================================================== */}
      {/* MODAL CHECK-IN LỊCH HẸN (UC-TD01) */}
      {/* ===================================================================== */}
      {checkInModal.isOpen && checkInModal.appointment && (
        <div className="modal-overlay" onClick={() => setCheckInModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <button className="modal-close" onClick={() => setCheckInModal(prev => ({ ...prev, isOpen: false }))}>
              &times;
            </button>
            <h3 style={{ margin: '0 0 6px', fontSize: '19px', color: 'var(--ink)' }}>
              Xác Nhận Check-in & Cấp Số Thứ Tự
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '13.5px', color: 'var(--muted)' }}>
              Tiếp nhận bệnh nhân <strong>{checkInModal.appointment.patientName}</strong> theo lịch hẹn{' '}
              <strong>{checkInModal.appointment.appointmentCode}</strong> lúc {checkInModal.appointment.appointmentTime.slice(0, 5)}.
            </p>

            <form onSubmit={handlePerformCheckIn}>
              <div className="field" style={{ marginBottom: '14px' }}>
                <label>Phòng khám tiếp nhận *</label>
                <select
                  required
                  value={checkInModal.targetRoomId}
                  onChange={(e) => setCheckInModal(prev => ({ ...prev, targetRoomId: Number(e.target.value) || '' }))}
                >
                  <option value="">-- Chọn phòng khám tiếp nhận --</option>
                  {rooms.filter(r => r.isAvailable !== false).map(r => (
                    <option key={r.id} value={r.id}>
                      {r.roomNumber} - {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field" style={{ marginBottom: '14px' }}>
                <label>Mức độ ưu tiên khám</label>
                <select
                  value={checkInModal.priority}
                  onChange={(e) => setCheckInModal(prev => ({ ...prev, priority: e.target.value as any }))}
                >
                  <option value="PRIORITY">Ưu tiên (Đã đặt hẹn trước)</option>
                  <option value="NORMAL">Bình thường</option>
                  <option value="EMERGENCY">Cấp cứu</option>
                </select>
              </div>

              <div className="field" style={{ marginBottom: '18px' }}>
                <label>Ghi chú tiếp đón</label>
                <input
                  type="text"
                  value={checkInModal.notes}
                  onChange={(e) => setCheckInModal(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCheckInModal(prev => ({ ...prev, isOpen: false }))}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={checkInModal.submitting}
                >
                  {checkInModal.submitting ? 'Đang cấp số...' : 'Xác nhận Check-in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL IN / XEM PHIẾU SỐ THỨ TỰ (UC-TD03) */}
      {/* ===================================================================== */}
      {ticketModal.isOpen && ticketModal.ticket && (
        <div className="modal-overlay" onClick={() => setTicketModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', textAlign: 'center' }}>
            <button className="modal-close" onClick={() => setTicketModal(prev => ({ ...prev, isOpen: false }))}>
              &times;
            </button>

            {/* Khung phiếu in STT chuẩn phòng khám */}
            <div style={{ border: '2px dashed #94a3b8', padding: '24px 20px', borderRadius: '12px', background: '#ffffff', marginBottom: '18px' }}>
              <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                PHÒNG KHÁM ĐA KHOA CAREPLUS
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                Phiếu Tiếp Đón & Xếp Hàng Khám Bệnh
              </div>

              <div style={{ margin: '18px 0 12px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>SỐ THỨ TỰ CỦA BẠN</span>
                <div style={{ fontSize: '54px', fontWeight: 900, color: 'var(--primary)', lineHeight: 1.1 }}>
                  {ticketModal.ticket.ticketNumber}
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#334155' }}>
                  Mã phiếu: {ticketModal.ticket.ticketCode}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', textAlign: 'left', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Bệnh nhân:</span>
                  <strong style={{ color: '#0f172a' }}>{ticketModal.ticket.patientName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Phòng khám:</span>
                  <strong style={{ color: 'var(--primary)' }}>
                    {ticketModal.ticket.roomNumber} - {ticketModal.ticket.roomName}
                  </strong>
                </div>
                {ticketModal.ticket.doctorName && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Bác sĩ khám:</span>
                    <strong style={{ color: '#0f172a' }}>{ticketModal.ticket.doctorName}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Loại khám:</span>
                  <span>{ticketModal.ticket.serviceType || 'Khám bệnh'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Thời gian cấp:</span>
                  <span>{new Date(ticketModal.ticket.createdAt).toLocaleTimeString('vi-VN')}</span>
                </div>
                {ticketModal.ticket.waitPosition > 0 && (
                  <div style={{ background: '#fef3c7', padding: '6px 8px', borderRadius: '6px', textAlign: 'center', color: '#92400e', fontWeight: 600, fontSize: '12px', marginTop: '6px' }}>
                    Hiện có {ticketModal.ticket.waitPosition} người đang chờ trước bạn
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setTicketModal(prev => ({ ...prev, isOpen: false }))}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePrintTicket}
              >
                In Phiếu Tiếp Đón
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL CHUYỂN PHÒNG KHÁM (UC-TD06) */}
      {/* ===================================================================== */}
      {transferModal.isOpen && transferModal.ticket && (
        <div className="modal-overlay" onClick={() => setTransferModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <button className="modal-close" onClick={() => setTransferModal(prev => ({ ...prev, isOpen: false }))}>
              &times;
            </button>
            <h3 style={{ margin: '0 0 6px', fontSize: '19px', color: 'var(--ink)' }}>
              Chuyển Bệnh Nhân Sang Phòng / Bác Sĩ Khác
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '13.5px', color: 'var(--muted)' }}>
              Điều phối bệnh nhân <strong>{transferModal.ticket.patientName}</strong> (hiện tại phòng {transferModal.ticket.roomNumber}) sang phòng khám khác.
            </p>

            <form onSubmit={handlePerformTransfer}>
              <div className="field" style={{ marginBottom: '14px' }}>
                <label>Phòng khám đích *</label>
                <select
                  required
                  value={transferModal.targetRoomId}
                  onChange={(e) => setTransferModal(prev => ({ ...prev, targetRoomId: Number(e.target.value) || '' }))}
                >
                  <option value="">-- Chọn phòng khám đích --</option>
                  {rooms
                    .filter(r => r.id !== transferModal.ticket?.roomId && r.isAvailable !== false)
                    .map(r => (
                      <option key={r.id} value={r.id}>
                        {r.roomNumber} - {r.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="field" style={{ marginBottom: '14px' }}>
                <label>Bác sĩ tiếp nhận (tùy chọn)</label>
                <select
                  value={transferModal.targetDoctorId}
                  onChange={(e) => setTransferModal(prev => ({ ...prev, targetDoctorId: Number(e.target.value) || '' }))}
                >
                  <option value="">Theo phân công phòng mới</option>
                  {doctors.map(d => (
                    <option key={d.doctorId} value={d.doctorId}>
                      {d.doctorName} ({d.specialty})
                    </option>
                  ))}
                </select>
              </div>

              <div className="field" style={{ marginBottom: '18px' }}>
                <label>Lý do chuyển phòng *</label>
                <textarea
                  required
                  rows={3}
                  value={transferModal.reason}
                  onChange={(e) => setTransferModal(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setTransferModal(prev => ({ ...prev, isOpen: false }))}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={transferModal.submitting}
                >
                  {transferModal.submitting ? 'Đang điều phối...' : 'Xác nhận chuyển phòng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
