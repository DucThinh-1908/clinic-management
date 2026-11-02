import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import type {
  AuthUser,
  StaffItem,
  DepartmentItem,
  ClinicRoomItem,
  WorkShiftItem,
  ScheduleItem,
  LeaveSwapItem,
  AttendanceItem,
} from '../types'

interface StaffSchedulingPageProps {
  currentUser: AuthUser | null
}

export const StaffSchedulingPage: React.FC<StaffSchedulingPageProps> = ({ currentUser }) => {
  const location = useLocation()

  // Xác định vai trò
  const isManager = Boolean(
    currentUser &&
      currentUser.roles &&
      currentUser.roles.some((r) => ['admin', 'manager'].includes(r.toLowerCase()))
  )

  const isStaff = Boolean(
    currentUser &&
      currentUser.roles &&
      currentUser.roles.some((r) =>
        ['receptionist', 'doctor', 'nurse', 'technician', 'pharmacist', 'cashier', 'manager', 'admin'].includes(
          r.toLowerCase()
        )
      )
  )

  const isDoctor = Boolean(
    currentUser &&
      currentUser.roles &&
      currentUser.roles.some((r) => r.toLowerCase() === 'doctor')
  )

  // Khởi tạo tab từ pathname
  const getTabFromPath = (path: string): 'staff' | 'departments' | 'schedules' | 'leave-swap' | 'attendance' => {
    if (path.includes('/quan-ly-chuyen-khoa')) return 'departments'
    if (path.includes('/lich-lam-viec')) return 'schedules'
    if (path.includes('/dang-ky-ca')) return 'leave-swap'
    if (path.includes('/cham-cong')) return 'attendance'
    if (!isManager && isDoctor) return 'schedules'
    if (!isManager && isStaff) return 'attendance'
    return 'staff'
  }

  const [activeTab, setActiveTab] = useState<'staff' | 'departments' | 'schedules' | 'leave-swap' | 'attendance'>(() =>
    getTabFromPath(location.pathname)
  )

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname))
  }, [location.pathname])

  // Trạng thái chung
  const [loading, setLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg)
      setToastMessage(null)
    } else {
      setToastMessage(msg)
      setErrorMessage(null)
    }
    setTimeout(() => {
      setToastMessage(null)
      setErrorMessage(null)
    }, 4500)
  }

  // =========================================================================
  // TAB 1: NHÂN SỰ (UC-NS01, UC-NS02)
  // =========================================================================
  const [staffList, setStaffList] = useState<StaffItem[]>([])
  const [staffSearch, setStaffSearch] = useState('')
  const [staffStatusFilter, setStaffStatusFilter] = useState('ALL')
  const [staffDeptFilter, setStaffDeptFilter] = useState<number | ''>('')
  const [selectedStaff, setSelectedStaff] = useState<StaffItem | null>(null)

  // Modals nhân sự
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false)
  const [showEditStaffModal, setShowEditStaffModal] = useState(false)
  const [showResignModal, setShowResignModal] = useState(false)
  const [resignReason, setResignReason] = useState('')

  // Form nhân sự
  const [formStaff, setFormStaff] = useState({
    username: '',
    password: '',
    email: '',
    phone: '',
    roleCode: 'doctor',
    staffCode: '',
    fullName: '',
    gender: 'FEMALE',
    dateOfBirth: '',
    idCardNumber: '',
    address: '',
    qualification: '',
    hireDate: new Date().toISOString().split('T')[0],
    departmentId: '' as number | '',
    licenseNumber: '',
    specialty: '',
    consultationFee: 200000,
    biography: '',
    yearsOfExperience: 5,
  })

  const loadStaffList = async () => {
    try {
      setLoading(true)
      let url = `/api/staff?status=${staffStatusFilter}`
      if (staffSearch.trim()) url += `&search=${encodeURIComponent(staffSearch.trim())}`
      if (staffDeptFilter) url += `&departmentId=${staffDeptFilter}`

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setStaffList(data)
      }
    } catch {
      showNotification('Không thể tải danh sách nhân sự phòng khám.', true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'staff') {
      loadStaffList()
    }
  }, [activeTab, staffStatusFilter, staffDeptFilter])

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    try {
      setLoading(true)
      const res = await fetch(`/api/staff?actorUserId=${currentUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formStaff,
          departmentId: formStaff.departmentId ? Number(formStaff.departmentId) : null,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        showNotification(data.message)
        setShowCreateStaffModal(false)
        loadStaffList()
      } else {
        showNotification(data.message || 'Thêm hồ sơ nhân sự thất bại.', true)
      }
    } catch {
      showNotification('Lỗi kết nối máy chủ khi tạo hồ sơ nhân sự.', true)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !selectedStaff) return

    try {
      setLoading(true)
      const res = await fetch(`/api/staff/${selectedStaff.id}?actorUserId=${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formStaff.fullName,
          gender: formStaff.gender,
          dateOfBirth: formStaff.dateOfBirth || null,
          idCardNumber: formStaff.idCardNumber || null,
          address: formStaff.address || null,
          qualification: formStaff.qualification || null,
          hireDate: formStaff.hireDate || null,
          departmentId: formStaff.departmentId ? Number(formStaff.departmentId) : null,
          phone: formStaff.phone || null,
          email: formStaff.email || null,
          licenseNumber: formStaff.licenseNumber || null,
          specialty: formStaff.specialty || null,
          consultationFee: formStaff.consultationFee,
          biography: formStaff.biography || null,
          yearsOfExperience: formStaff.yearsOfExperience,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        showNotification(data.message)
        setShowEditStaffModal(false)
        loadStaffList()
      } else {
        showNotification(data.message || 'Cập nhật thất bại.', true)
      }
    } catch {
      showNotification('Lỗi kết nối khi cập nhật hồ sơ nhân sự.', true)
    } finally {
      setLoading(false)
    }
  }

  const handleResignStaff = async () => {
    if (!currentUser || !selectedStaff) return

    try {
      setLoading(true)
      const res = await fetch(`/api/staff/${selectedStaff.id}/status?actorUserId=${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESIGNED', reason: resignReason }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        showNotification(data.message)
        setShowResignModal(false)
        setResignReason('')
        loadStaffList()
      } else {
        showNotification(data.message || 'Không thể cập nhật trạng thái thôi việc.', true)
      }
    } catch {
      showNotification('Lỗi kết nối khi thực hiện thôi việc nhân sự.', true)
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (staff: StaffItem) => {
    setSelectedStaff(staff)
    setFormStaff({
      username: staff.username || '',
      password: '',
      email: staff.email || '',
      phone: staff.phone || '',
      roleCode: staff.roleCode || 'doctor',
      staffCode: staff.staffCode || '',
      fullName: staff.fullName || '',
      gender: staff.gender || 'FEMALE',
      dateOfBirth: staff.dateOfBirth || '',
      idCardNumber: staff.idCardNumber || '',
      address: staff.address || '',
      qualification: staff.qualification || '',
      hireDate: staff.hireDate || '',
      departmentId: staff.departmentId || '',
      licenseNumber: staff.licenseNumber || '',
      specialty: staff.specialty || '',
      consultationFee: staff.consultationFee || 200000,
      biography: staff.biography || '',
      yearsOfExperience: staff.yearsOfExperience || 0,
    })
    setShowEditStaffModal(true)
  }

  // =========================================================================
  // TAB 2: CHUYÊN KHOA VÀ PHÒNG KHÁM (UC-NS03)
  // =========================================================================
  const [departments, setDepartments] = useState<DepartmentItem[]>([])
  const [rooms, setRooms] = useState<ClinicRoomItem[]>([])
  const [selectedDeptForRoom, setSelectedDeptForRoom] = useState<number | ''>('')

  // Modals Khoa & Phòng
  const [showDeptModal, setShowDeptModal] = useState(false)
  const [editingDeptId, setEditingDeptId] = useState<number | null>(null)
  const [deptForm, setDeptForm] = useState({ code: '', name: '', description: '', location: '', isActive: true })

  const [showRoomModal, setShowRoomModal] = useState(false)
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null)
  const [roomForm, setRoomForm] = useState({ departmentId: '' as number | '', roomNumber: '', name: '', roomType: 'EXAMINATION', isAvailable: true })

  const loadDepartmentsAndRooms = async () => {
    try {
      const [deptRes, roomRes] = await Promise.all([
        fetch('/api/departments'),
        fetch(selectedDeptForRoom ? `/api/rooms?departmentId=${selectedDeptForRoom}` : '/api/rooms'),
      ])
      if (deptRes.ok) setDepartments(await deptRes.json())
      if (roomRes.ok) setRooms(await roomRes.json())
    } catch {
      showNotification('Không thể tải danh sách chuyên khoa và phòng khám.', true)
    }
  }

  useEffect(() => {
    loadDepartmentsAndRooms()
  }, [selectedDeptForRoom])

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    try {
      setLoading(true)
      const url = editingDeptId ? `/api/departments/${editingDeptId}?actorUserId=${currentUser.id}` : `/api/departments?actorUserId=${currentUser.id}`
      const method = editingDeptId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deptForm),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        showNotification(data.message)
        setShowDeptModal(false)
        loadDepartmentsAndRooms()
      } else {
        showNotification(data.message || 'Lưu chuyên khoa thất bại.', true)
      }
    } catch {
      showNotification('Lỗi kết nối khi lưu chuyên khoa.', true)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDepartment = async (deptId: number) => {
    if (!currentUser) return
    try {
      const res = await fetch(`/api/departments/${deptId}/toggle?actorUserId=${currentUser.id}`, { method: 'PATCH' })
      const data = await res.json()
      if (res.ok && data.success) {
        showNotification(data.message)
        loadDepartmentsAndRooms()
      }
    } catch {
      showNotification('Lỗi kết nối khi chuyển trạng thái chuyên khoa.', true)
    }
  }

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    try {
      setLoading(true)
      const url = editingRoomId ? `/api/rooms/${editingRoomId}?actorUserId=${currentUser.id}` : `/api/rooms?actorUserId=${currentUser.id}`
      const method = editingRoomId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...roomForm, departmentId: Number(roomForm.departmentId) }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        showNotification(data.message)
        setShowRoomModal(false)
        loadDepartmentsAndRooms()
      } else {
        showNotification(data.message || 'Lưu phòng khám thất bại.', true)
      }
    } catch {
      showNotification('Lỗi kết nối khi lưu phòng khám.', true)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleRoom = async (roomId: number) => {
    if (!currentUser) return
    try {
      const res = await fetch(`/api/rooms/${roomId}/toggle?actorUserId=${currentUser.id}`, { method: 'PATCH' })
      const data = await res.json()
      if (res.ok && data.success) {
        showNotification(data.message)
        loadDepartmentsAndRooms()
      }
    } catch {
      showNotification('Lỗi kết nối khi đổi trạng thái phòng khám.', true)
    }
  }

  // =========================================================================
  // TAB 3: PHÂN LỊCH & XEM LỊCH LÀM VIỆC (UC-NS04, UC-NS05)
  // =========================================================================
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [shifts, setShifts] = useState<WorkShiftItem[]>([])
  const [scheduleStartDate, setScheduleStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 2)
    return d.toISOString().split('T')[0]
  })
  const [scheduleEndDate, setScheduleEndDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 12)
    return d.toISOString().split('T')[0]
  })
  const [scheduleStaffFilter, setScheduleStaffFilter] = useState<number | ''>('')
  const [scheduleDeptFilter, setScheduleDeptFilter] = useState<number | ''>('')

  // Modal phân lịch
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({
    staffId: '' as number | '',
    shiftId: 1,
    roomId: '' as number | '',
    workDate: new Date().toISOString().split('T')[0],
    note: '',
  })

  const loadSchedulesAndShifts = async () => {
    try {
      setLoading(true)
      let url = `/api/schedules?startDate=${scheduleStartDate}&endDate=${scheduleEndDate}`
      if (scheduleStaffFilter) url += `&staffId=${scheduleStaffFilter}`
      if (scheduleDeptFilter) url += `&departmentId=${scheduleDeptFilter}`

      const [schedRes, shiftRes] = await Promise.all([fetch(url), fetch('/api/shifts')])
      if (schedRes.ok) setSchedules(await schedRes.json())
      if (shiftRes.ok) setShifts(await shiftRes.json())
    } catch {
      showNotification('Không thể tải lịch làm việc.', true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'schedules') {
      loadSchedulesAndShifts()
    }
  }, [activeTab, scheduleStartDate, scheduleEndDate, scheduleStaffFilter, scheduleDeptFilter])

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    try {
      setLoading(true)
      const res = await fetch(`/api/schedules?actorUserId=${currentUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: Number(scheduleForm.staffId),
          shiftId: Number(scheduleForm.shiftId),
          roomId: scheduleForm.roomId ? Number(scheduleForm.roomId) : null,
          workDate: scheduleForm.workDate,
          note: scheduleForm.note || null,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        showNotification(data.message)
        setShowScheduleModal(false)
        loadSchedulesAndShifts()
      } else {
        showNotification(data.message || 'Phân lịch thất bại.', true)
      }
    } catch {
      showNotification('Lỗi kết nối khi phân lịch làm việc.', true)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSchedule = async (id: number) => {
    if (!currentUser || !window.confirm('Bạn có chắc chắn muốn hủy ca làm việc này không?')) return
    try {
      const res = await fetch(`/api/schedules/${id}?actorUserId=${currentUser.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok && data.success) {
        showNotification(data.message)
        loadSchedulesAndShifts()
      } else {
        showNotification(data.message || 'Không thể hủy lịch làm việc.', true)
      }
    } catch {
      showNotification('Lỗi kết nối khi hủy lịch làm việc.', true)
    }
  }

  // =========================================================================
  // TAB 4: ĐĂNG KÝ NGHỈ / ĐỔI CA (UC-NS06)
  // =========================================================================
  const [leaveSwapList, setLeaveSwapList] = useState<LeaveSwapItem[]>([])
  const [leaveSwapStatusFilter, setLeaveSwapStatusFilter] = useState('ALL')
  const [showLeaveSwapModal, setShowLeaveSwapModal] = useState(false)
  const [leaveSwapForm, setLeaveSwapForm] = useState({
    requestType: 'LEAVE' as 'LEAVE' | 'SWAP',
    scheduleId: '' as number | '',
    leaveDate: new Date().toISOString().split('T')[0],
    targetStaffId: '' as number | '',
    targetDate: '',
    targetShiftId: '' as number | '',
    reason: '',
  })

  // Review modal
  const [selectedReviewItem, setSelectedReviewItem] = useState<LeaveSwapItem | null>(null)
  const [reviewNote, setReviewNote] = useState('')

  const loadLeaveSwapRequests = async () => {
    if (!currentUser) return
    try {
      setLoading(true)
      const res = await fetch(`/api/leave-swap?actorUserId=${currentUser.id}&status=${leaveSwapStatusFilter}`)
      if (res.ok) {
        setLeaveSwapList(await res.json())
      }
    } catch {
      showNotification('Không thể tải danh sách đăng ký nghỉ/đổi ca.', true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'leave-swap') {
      loadLeaveSwapRequests()
    }
  }, [activeTab, leaveSwapStatusFilter])

  const handleCreateLeaveSwap = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    try {
      setLoading(true)
      const res = await fetch(`/api/leave-swap?actorUserId=${currentUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: leaveSwapForm.requestType,
          scheduleId: leaveSwapForm.scheduleId ? Number(leaveSwapForm.scheduleId) : null,
          leaveDate: leaveSwapForm.leaveDate || null,
          targetStaffId: leaveSwapForm.targetStaffId ? Number(leaveSwapForm.targetStaffId) : null,
          targetDate: leaveSwapForm.targetDate || null,
          targetShiftId: leaveSwapForm.targetShiftId ? Number(leaveSwapForm.targetShiftId) : null,
          reason: leaveSwapForm.reason,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        showNotification(data.message)
        setShowLeaveSwapModal(false)
        setLeaveSwapForm({
          requestType: 'LEAVE',
          scheduleId: '',
          leaveDate: new Date().toISOString().split('T')[0],
          targetStaffId: '',
          targetDate: '',
          targetShiftId: '',
          reason: '',
        })
        loadLeaveSwapRequests()
      } else {
        showNotification(data.message || 'Gửi yêu cầu thất bại.', true)
      }
    } catch {
      showNotification('Lỗi kết nối khi gửi yêu cầu nghỉ/đổi ca.', true)
    } finally {
      setLoading(false)
    }
  }

  const handleReviewLeaveSwap = async (status: 'APPROVED' | 'REJECTED') => {
    if (!currentUser || !selectedReviewItem) return

    try {
      setLoading(true)
      const res = await fetch(`/api/leave-swap/${selectedReviewItem.id}/review?actorUserId=${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewNote }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        showNotification(data.message)
        setSelectedReviewItem(null)
        setReviewNote('')
        loadLeaveSwapRequests()
      } else {
        showNotification(data.message || 'Xét duyệt thất bại.', true)
      }
    } catch {
      showNotification('Lỗi kết nối khi xét duyệt yêu cầu.', true)
    } finally {
      setLoading(false)
    }
  }

  // =========================================================================
  // TAB 5: CHẤM CÔNG (UC-NS07)
  // =========================================================================
  const [attendanceSubTab, setAttendanceSubTab] = useState<'my' | 'all'>('my')
  const [myAttendances, setMyAttendances] = useState<AttendanceItem[]>([])
  const [allAttendances, setAllAttendances] = useState<AttendanceItem[]>([])
  const [todayAttendance, setTodayAttendance] = useState<AttendanceItem | null>(null)
  const [attendanceNote, setAttendanceNote] = useState('')

  const loadMyAttendance = async () => {
    if (!currentUser) return
    try {
      const res = await fetch(`/api/attendance/my?actorUserId=${currentUser.id}`)
      if (res.ok) {
        const data: AttendanceItem[] = await res.json()
        setMyAttendances(data)
        const todayStr = new Date().toISOString().split('T')[0]
        const todayFound = data.find((a) => a.attendanceDate === todayStr) || null
        setTodayAttendance(todayFound)
      }
    } catch {
      // Ignored
    }
  }

  const loadAllAttendance = async () => {
    try {
      const res = await fetch('/api/attendance/all')
      if (res.ok) {
        setAllAttendances(await res.json())
      }
    } catch {
      // Ignored
    }
  }

  useEffect(() => {
    if (activeTab === 'attendance') {
      loadMyAttendance()
      if (isManager) {
        loadAllAttendance()
      }
    }
  }, [activeTab, attendanceSubTab])

  const handleCheckIn = async () => {
    if (!currentUser) return
    try {
      setLoading(true)
      const res = await fetch(`/api/attendance/check-in?actorUserId=${currentUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: attendanceNote }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        showNotification(data.message)
        setAttendanceNote('')
        loadMyAttendance()
        if (isManager) loadAllAttendance()
      } else {
        showNotification(data.message || 'Check-in thất bại.', true)
      }
    } catch {
      showNotification('Lỗi kết nối khi thực hiện Check-in.', true)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOut = async () => {
    if (!currentUser) return
    try {
      setLoading(true)
      const res = await fetch(`/api/attendance/check-out?actorUserId=${currentUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: attendanceNote }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        showNotification(data.message)
        setAttendanceNote('')
        loadMyAttendance()
        if (isManager) loadAllAttendance()
      } else {
        showNotification(data.message || 'Check-out thất bại.', true)
      }
    } catch {
      showNotification('Lỗi kết nối khi thực hiện Check-out.', true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="patient-mgmt-root" style={{ background: '#f8fafc', minHeight: '85vh', padding: '32px 0 60px' }}>
      <div className="container" style={{ maxWidth: '1240px' }}>
        {/* Tiêu đề trang */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
              Quản trị Nhân sự & Lịch làm việc
            </h1>
            <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '14.5px' }}>
              Hệ thống tổ chức chuyên khoa, xếp lịch trực, duyệt nghỉ/đổi ca và chấm công nội bộ
            </p>
          </div>

          {/* Quick Check-in pill */}
          {isStaff && (
            <div style={{ background: '#ffffff', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-sm)' }}>
              <span style={{ fontSize: '13px', fontWeight: 650, color: '#374151' }}>
                Chấm công hôm nay:
              </span>
              {todayAttendance && todayAttendance.checkInTime ? (
                <span style={{ fontSize: '12.5px', background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontWeight: 700 }}>
                  Đã vào ca ({new Date(todayAttendance.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})
                  {todayAttendance.checkOutTime ? ` - Ra ca (${new Date(todayAttendance.checkOutTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})` : ''}
                </span>
              ) : (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setActiveTab('attendance')
                    setAttendanceSubTab('my')
                  }}
                  style={{ fontSize: '12px', padding: '4px 12px' }}
                >
                  Điểm danh ngay
                </button>
              )}
            </div>
          )}
        </div>

        {/* Thông báo Alert */}
        {toastMessage && (
          <div style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '12px 18px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', fontWeight: 600 }}>
            {toastMessage}
          </div>
        )}
        {errorMessage && (
          <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '12px 18px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', fontWeight: 600 }}>
            {errorMessage}
          </div>
        )}

        {/* Tabs điều hướng */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '24px', gap: '8px', overflowX: 'auto' }}>
          {isManager && (
            <button
              onClick={() => setActiveTab('staff')}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '15px',
                color: activeTab === 'staff' ? 'var(--primary-dark)' : '#64748b',
                borderBottom: activeTab === 'staff' ? '3px solid var(--primary)' : '3px solid transparent',
                marginBottom: '-2px',
                transition: 'all 0.2s',
              }}
            >
              Hồ sơ nhân viên
            </button>
          )}

          {isManager && (
            <button
              onClick={() => setActiveTab('departments')}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '15px',
                color: activeTab === 'departments' ? 'var(--primary-dark)' : '#64748b',
                borderBottom: activeTab === 'departments' ? '3px solid var(--primary)' : '3px solid transparent',
                marginBottom: '-2px',
                transition: 'all 0.2s',
              }}
            >
              Chuyên khoa & Phòng khám
            </button>
          )}

          <button
            onClick={() => setActiveTab('schedules')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '15px',
              color: activeTab === 'schedules' ? 'var(--primary-dark)' : '#64748b',
              borderBottom: activeTab === 'schedules' ? '3px solid var(--primary)' : '3px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.2s',
            }}
          >
            Lịch làm việc & Phân ca
          </button>

          <button
            onClick={() => setActiveTab('leave-swap')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '15px',
              color: activeTab === 'leave-swap' ? 'var(--primary-dark)' : '#64748b',
              borderBottom: activeTab === 'leave-swap' ? '3px solid var(--primary)' : '3px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.2s',
            }}
          >
            Nghỉ phép & Đổi ca
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '15px',
              color: activeTab === 'attendance' ? 'var(--primary-dark)' : '#64748b',
              borderBottom: activeTab === 'attendance' ? '3px solid var(--primary)' : '3px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.2s',
            }}
          >
            Chấm công điểm danh
          </button>
        </div>

        {/* =================================================================== */}
        {/* NỘI DUNG TAB 1: HỒ SƠ NHÂN VIÊN */}
        {/* =================================================================== */}
        {activeTab === 'staff' && (
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, mã NV, CCCD..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadStaffList()}
                  className="form-control"
                  style={{ maxWidth: '300px' }}
                />
                <select
                  value={staffStatusFilter}
                  onChange={(e) => setStaffStatusFilter(e.target.value)}
                  className="form-control"
                  style={{ maxWidth: '180px' }}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ACTIVE">Đang làm việc</option>
                  <option value="ON_LEAVE">Đang nghỉ phép</option>
                  <option value="RESIGNED">Đã thôi việc</option>
                </select>
                <select
                  value={staffDeptFilter}
                  onChange={(e) => setStaffDeptFilter(e.target.value ? Number(e.target.value) : '')}
                  className="form-control"
                  style={{ maxWidth: '200px' }}
                >
                  <option value="">Tất cả khoa phòng</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <button className="btn btn-outline btn-sm" onClick={loadStaffList}>
                  Tìm kiếm
                </button>
              </div>

              {isManager && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setFormStaff({
                      username: '',
                      password: '',
                      email: '',
                      phone: '',
                      roleCode: 'doctor',
                      staffCode: '',
                      fullName: '',
                      gender: 'FEMALE',
                      dateOfBirth: '',
                      idCardNumber: '',
                      address: '',
                      qualification: '',
                      hireDate: new Date().toISOString().split('T')[0],
                      departmentId: '',
                      licenseNumber: '',
                      specialty: '',
                      consultationFee: 200000,
                      biography: '',
                      yearsOfExperience: 5,
                    })
                    setShowCreateStaffModal(true)
                  }}
                >
                  + Thêm nhân sự mới
                </button>
              )}
            </div>

            {/* Bảng nhân sự */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px 14px' }}>Mã NV</th>
                    <th style={{ padding: '12px 14px' }}>Họ và tên</th>
                    <th style={{ padding: '12px 14px' }}>Khoa / Phòng ban</th>
                    <th style={{ padding: '12px 14px' }}>Chức danh / Trình độ</th>
                    <th style={{ padding: '12px 14px' }}>Liên hệ</th>
                    <th style={{ padding: '12px 14px' }}>Trạng thái</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                        Không tìm thấy hồ sơ nhân sự nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    staffList.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--primary-dark)' }}>
                          {s.staffCode}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{s.fullName}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {s.gender === 'MALE' ? 'Nam' : s.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                            {s.dateOfBirth ? ` • ${new Date(s.dateOfBirth).toLocaleDateString('vi-VN')}` : ''}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontWeight: 600 }}>{s.departmentName || 'Chưa phân khoa'}</span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div>{s.qualification || 'Cử nhân'}</div>
                          {s.specialty && (
                            <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: 600 }}>{s.specialty}</div>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '13px' }}>
                          <div>{s.phone || 'Chưa cập nhật'}</div>
                          <div style={{ color: '#64748b' }}>{s.email || ''}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 700,
                              background:
                                s.status === 'ACTIVE' ? '#dcfce7' : s.status === 'ON_LEAVE' ? '#fef3c7' : '#fee2e2',
                              color:
                                s.status === 'ACTIVE' ? '#166534' : s.status === 'ON_LEAVE' ? '#92400e' : '#991b1b',
                            }}
                          >
                            {s.status === 'ACTIVE' ? 'Đang làm việc' : s.status === 'ON_LEAVE' ? 'Nghỉ phép' : 'Đã thôi việc'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button className="btn btn-outline btn-sm" onClick={() => openEditModal(s)}>
                              Sửa
                            </button>
                            {s.status !== 'RESIGNED' ? (
                              <button
                                className="btn btn-light btn-sm"
                                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                                onClick={() => {
                                  setSelectedStaff(s)
                                  setShowResignModal(true)
                                }}
                              >
                                Thôi việc
                              </button>
                            ) : (
                              <button
                                className="btn btn-light btn-sm"
                                style={{ color: '#16a34a', borderColor: '#86efac' }}
                                onClick={() => {
                                  setSelectedStaff(s)
                                  setResignReason('Tiếp tục đi làm lại')
                                  handleResignStaff()
                                }}
                              >
                                Mở lại
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* NỘI DUNG TAB 2: CHUYÊN KHOA VÀ PHÒNG KHÁM */}
        {/* =================================================================== */}
        {activeTab === 'departments' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Cột Trái: Danh sách chuyên khoa */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                  Chuyên khoa / Khoa phòng
                </h2>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setEditingDeptId(null)
                    setDeptForm({ code: '', name: '', description: '', location: '', isActive: true })
                    setShowDeptModal(true)
                  }}
                >
                  + Thêm khoa
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {departments.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      background: selectedDeptForRoom === d.id ? '#f0fdfa' : '#ffffff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 750, color: '#0f172a' }}>{d.name}</span>
                        <span style={{ fontSize: '11px', background: '#e2e8f0', padding: '2px 8px', borderRadius: '10px', color: '#475569' }}>
                          {d.code}
                        </span>
                        {!d.isActive && (
                          <span style={{ fontSize: '11px', background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '10px' }}>
                            Tạm ngưng
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                        Vị trí: <strong>{d.location || 'Chưa cập nhật'}</strong> • {d.roomCount} phòng khám • {d.staffCount} nhân sự
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-light btn-sm"
                        onClick={() => setSelectedDeptForRoom(selectedDeptForRoom === d.id ? '' : d.id)}
                      >
                        {selectedDeptForRoom === d.id ? 'Tất cả phòng' : 'Xem phòng'}
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          setEditingDeptId(d.id)
                          setDeptForm({
                            code: d.code,
                            name: d.name,
                            description: d.description || '',
                            location: d.location || '',
                            isActive: d.isActive,
                          })
                          setShowDeptModal(true)
                        }}
                      >
                        Sửa
                      </button>
                      <button
                        className="btn btn-light btn-sm"
                        style={{ color: d.isActive ? '#e11d48' : '#16a34a' }}
                        onClick={() => handleToggleDepartment(d.id)}
                      >
                        {d.isActive ? 'Khóa' : 'Mở'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cột Phải: Danh sách phòng khám */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                    Phòng khám & Phòng chức năng
                  </h2>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    {selectedDeptForRoom ? `Lọc theo chuyên khoa đang chọn (${rooms.length} phòng)` : `Toàn bộ ${rooms.length} phòng khám`}
                  </div>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setEditingRoomId(null)
                    setRoomForm({
                      departmentId: selectedDeptForRoom || (departments[0]?.id || ''),
                      roomNumber: '',
                      name: '',
                      roomType: 'EXAMINATION',
                      isAvailable: true,
                    })
                    setShowRoomModal(true)
                  }}
                >
                  + Thêm phòng
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {rooms.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--primary-dark)', fontSize: '15px' }}>
                          {r.roomNumber}
                        </span>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{r.name}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                        Thuộc khoa: <strong>{r.departmentName}</strong> • Loại: {r.roomType}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '11.5px',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontWeight: 700,
                          background: r.isAvailable ? '#dcfce7' : '#fee2e2',
                          color: r.isAvailable ? '#166534' : '#991b1b',
                        }}
                      >
                        {r.isAvailable ? 'Sẵn sàng' : 'Bận / Bảo trì'}
                      </span>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          setEditingRoomId(r.id)
                          setRoomForm({
                            departmentId: r.departmentId,
                            roomNumber: r.roomNumber,
                            name: r.name,
                            roomType: r.roomType,
                            isAvailable: r.isAvailable,
                          })
                          setShowRoomModal(true)
                        }}
                      >
                        Sửa
                      </button>
                      <button
                        className="btn btn-light btn-sm"
                        style={{ color: r.isAvailable ? '#dc2626' : '#16a34a' }}
                        onClick={() => handleToggleRoom(r.id)}
                      >
                        {r.isAvailable ? 'Tắt' : 'Bật'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* NỘI DUNG TAB 3: PHÂN LỊCH & XEM LỊCH LÀM VIỆC */}
        {/* =================================================================== */}
        {activeTab === 'schedules' && (
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 650, color: '#475569' }}>Từ ngày:</span>
                <input
                  type="date"
                  value={scheduleStartDate}
                  onChange={(e) => setScheduleStartDate(e.target.value)}
                  className="form-control"
                  style={{ width: '150px' }}
                />
                <span style={{ fontSize: '13.5px', fontWeight: 650, color: '#475569' }}>Đến ngày:</span>
                <input
                  type="date"
                  value={scheduleEndDate}
                  onChange={(e) => setScheduleEndDate(e.target.value)}
                  className="form-control"
                  style={{ width: '150px' }}
                />
                <select
                  value={scheduleDeptFilter}
                  onChange={(e) => setScheduleDeptFilter(e.target.value ? Number(e.target.value) : '')}
                  className="form-control"
                  style={{ width: '180px' }}
                >
                  <option value="">Tất cả khoa phòng</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <select
                  value={scheduleStaffFilter}
                  onChange={(e) => setScheduleStaffFilter(e.target.value ? Number(e.target.value) : '')}
                  className="form-control"
                  style={{ width: '200px' }}
                >
                  <option value="">Tất cả nhân sự / bác sĩ</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.staffCode})
                    </option>
                  ))}
                </select>
                <button className="btn btn-outline btn-sm" onClick={loadSchedulesAndShifts}>
                  Lọc lịch
                </button>
              </div>

              {isManager && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setScheduleForm({
                      staffId: staffList[0]?.id || '',
                      shiftId: shifts[0]?.id || 1,
                      roomId: rooms[0]?.id || '',
                      workDate: new Date().toISOString().split('T')[0],
                      note: '',
                    })
                    setShowScheduleModal(true)
                  }}
                >
                  + Phân ca làm việc
                </button>
              )}
            </div>

            {/* Bảng lịch làm việc */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px 14px' }}>Ngày trực</th>
                    <th style={{ padding: '12px 14px' }}>Ca làm việc</th>
                    <th style={{ padding: '12px 14px' }}>Nhân sự / Bác sĩ</th>
                    <th style={{ padding: '12px 14px' }}>Chuyên khoa & Phòng</th>
                    <th style={{ padding: '12px 14px' }}>Ghi chú ca</th>
                    <th style={{ padding: '12px 14px' }}>Trạng thái</th>
                    {isManager && <th style={{ padding: '12px 14px', textAlign: 'right' }}>Thao tác</th>}
                  </tr>
                </thead>
                <tbody>
                  {schedules.length === 0 ? (
                    <tr>
                      <td colSpan={isManager ? 7 : 6} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                        Không có lịch làm việc nào trong khoảng thời gian đã chọn.
                      </td>
                    </tr>
                  ) : (
                    schedules.map((sc) => (
                      <tr key={sc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 750, color: '#1e293b' }}>
                          {new Date(sc.workDate).toLocaleDateString('vi-VN', {
                            weekday: 'short',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                          })}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              padding: '4px 10px',
                              borderRadius: '16px',
                              fontWeight: 700,
                              fontSize: '12px',
                            }}
                          >
                            {sc.shiftName} ({sc.shiftStartTime?.slice(0, 5)} - {sc.shiftEndTime?.slice(0, 5)})
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{sc.staffName}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {sc.staffCode} • {sc.qualification || sc.staffRole || 'Bác sĩ'}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600 }}>{sc.roomName ? `${sc.roomNumber} - ${sc.roomName}` : 'Chưa phân phòng'}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{sc.departmentName || 'Chung'}</div>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#475569', fontSize: '13px' }}>
                          {sc.note || 'Trực chuyên môn thường kỳ'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 700,
                              background:
                                sc.status === 'SCHEDULED'
                                  ? '#e0f2fe'
                                  : sc.status === 'ATTENDED'
                                  ? '#dcfce7'
                                  : '#fee2e2',
                              color:
                                sc.status === 'SCHEDULED'
                                  ? '#0369a1'
                                  : sc.status === 'ATTENDED'
                                  ? '#166534'
                                  : '#991b1b',
                            }}
                          >
                            {sc.status === 'SCHEDULED'
                              ? 'Đã xếp lịch'
                              : sc.status === 'ATTENDED'
                              ? 'Đã trực'
                              : 'Đã hủy'}
                          </span>
                        </td>
                        {isManager && (
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <button
                              className="btn btn-light btn-sm"
                              style={{ color: '#dc2626' }}
                              onClick={() => handleDeleteSchedule(sc.id)}
                            >
                              Hủy ca
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* NỘI DUNG TAB 4: NGHỈ PHÉP & ĐỔI CA */}
        {/* =================================================================== */}
        {activeTab === 'leave-swap' && (
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <select
                  value={leaveSwapStatusFilter}
                  onChange={(e) => setLeaveSwapStatusFilter(e.target.value)}
                  className="form-control"
                  style={{ width: '180px' }}
                >
                  <option value="ALL">Tất cả yêu cầu</option>
                  <option value="PENDING">Đang chờ duyệt</option>
                  <option value="APPROVED">Đã phê duyệt</option>
                  <option value="REJECTED">Đã từ chối</option>
                </select>
                <button className="btn btn-outline btn-sm" onClick={loadLeaveSwapRequests}>
                  Tải lại
                </button>
              </div>

              {isStaff && (
                <button className="btn btn-primary" onClick={() => setShowLeaveSwapModal(true)}>
                  + Đăng ký xin nghỉ / đổi ca
                </button>
              )}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px 14px' }}>Loại yêu cầu</th>
                    <th style={{ padding: '12px 14px' }}>Nhân sự yêu cầu</th>
                    <th style={{ padding: '12px 14px' }}>Ca trực liên quan</th>
                    <th style={{ padding: '12px 14px' }}>Chi tiết đổi ca / Ngày nghỉ</th>
                    <th style={{ padding: '12px 14px' }}>Lý do</th>
                    <th style={{ padding: '12px 14px' }}>Trạng thái</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Xét duyệt</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveSwapList.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                        Chưa có yêu cầu xin nghỉ phép hoặc đổi ca nào.
                      </td>
                    </tr>
                  ) : (
                    leaveSwapList.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              background: item.requestType === 'LEAVE' ? '#fef3c7' : '#e0e7ff',
                              color: item.requestType === 'LEAVE' ? '#92400e' : '#3730a3',
                              padding: '4px 10px',
                              borderRadius: '16px',
                              fontWeight: 700,
                              fontSize: '12px',
                            }}
                          >
                            {item.requestType === 'LEAVE' ? 'Xin nghỉ phép' : 'Đổi ca trực'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1e293b' }}>
                          {item.staffName} ({item.staffCode})
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {item.currentWorkDate ? (
                            <div>
                              <div>{new Date(item.currentWorkDate).toLocaleDateString('vi-VN')}</div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>
                                {item.currentShiftName} • {item.currentRoomName || 'Phòng trực'}
                              </div>
                            </div>
                          ) : item.leaveDate ? (
                            <span>{new Date(item.leaveDate).toLocaleDateString('vi-VN')}</span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>Ca thỏa thuận</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {item.requestType === 'SWAP' ? (
                            <div>
                              <div>Đổi sang: <strong>{item.targetStaffName || 'Đồng nghiệp'}</strong></div>
                              {item.targetDate && (
                                <div style={{ fontSize: '12px', color: '#64748b' }}>
                                  Ngày: {new Date(item.targetDate).toLocaleDateString('vi-VN')} ({item.targetShiftName || 'Ca'})
                                </div>
                              )}
                            </div>
                          ) : (
                            <span>Nghỉ theo chế độ</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', maxWidth: '250px' }}>
                          <div style={{ color: '#334155', fontStyle: 'italic' }}>"{item.reason}"</div>
                          {item.reviewNote && (
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                              Phản hồi: {item.reviewNote}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 700,
                              background:
                                item.status === 'APPROVED'
                                  ? '#dcfce7'
                                  : item.status === 'REJECTED'
                                  ? '#fee2e2'
                                  : '#fef3c7',
                              color:
                                item.status === 'APPROVED'
                                  ? '#166534'
                                  : item.status === 'REJECTED'
                                  ? '#991b1b'
                                  : '#92400e',
                            }}
                          >
                            {item.status === 'APPROVED'
                              ? 'Đã phê duyệt'
                              : item.status === 'REJECTED'
                              ? 'Bị từ chối'
                              : 'Chờ duyệt'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          {isManager && item.status === 'PENDING' ? (
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => {
                                setSelectedReviewItem(item)
                                setReviewNote('')
                              }}
                            >
                              Xét duyệt
                            </button>
                          ) : (
                            <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                              {item.reviewerName ? `Duyệt bởi ${item.reviewerName}` : '---'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* NỘI DUNG TAB 5: CHẤM CÔNG (UC-NS07) */}
        {/* =================================================================== */}
        {activeTab === 'attendance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Box chấm công hôm nay */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                    Bảng điều khiển chấm công hôm nay
                  </h2>
                  <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
                    Ngày: <strong>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Ghi chú điểm danh (nếu có)..."
                    value={attendanceNote}
                    onChange={(e) => setAttendanceNote(e.target.value)}
                    className="form-control"
                    style={{ width: '240px' }}
                  />

                  {!todayAttendance || !todayAttendance.checkInTime ? (
                    <button className="btn btn-primary" onClick={handleCheckIn} disabled={loading}>
                      Điểm danh vào ca (Check-in)
                    </button>
                  ) : !todayAttendance.checkOutTime ? (
                    <button className="btn btn-primary" onClick={handleCheckOut} disabled={loading} style={{ background: '#0284c7' }}>
                      Điểm danh ra ca (Check-out)
                    </button>
                  ) : (
                    <span style={{ background: '#dcfce7', color: '#166534', padding: '8px 16px', borderRadius: '12px', fontWeight: 700 }}>
                      Hoàn thành ca làm việc hôm nay
                    </span>
                  )}
                </div>
              </div>

              {/* Thông tin trạng thái hôm nay */}
              {todayAttendance && todayAttendance.checkInTime && (
                <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '12px', display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '14px' }}>
                  <div>
                    Giờ vào: <strong>{new Date(todayAttendance.checkInTime).toLocaleTimeString('vi-VN')}</strong>
                  </div>
                  {todayAttendance.checkOutTime && (
                    <div>
                      Giờ ra: <strong>{new Date(todayAttendance.checkOutTime).toLocaleTimeString('vi-VN')}</strong>
                    </div>
                  )}
                  <div>
                    Đánh giá:{' '}
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        background: todayAttendance.status === 'ON_TIME' ? '#dcfce7' : '#fee2e2',
                        color: todayAttendance.status === 'ON_TIME' ? '#166534' : '#991b1b',
                      }}
                    >
                      {todayAttendance.status === 'ON_TIME' ? 'Đúng giờ' : 'Đi trễ / Về sớm'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Sub-tabs: Cá nhân vs Toàn cơ sở */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className={`btn btn-sm ${attendanceSubTab === 'my' ? 'btn-primary' : 'btn-light'}`}
                    onClick={() => setAttendanceSubTab('my')}
                  >
                    Lịch sử chấm công của tôi
                  </button>
                  {isManager && (
                    <button
                      className={`btn btn-sm ${attendanceSubTab === 'all' ? 'btn-primary' : 'btn-light'}`}
                      onClick={() => setAttendanceSubTab('all')}
                    >
                      Bảng chấm công toàn phòng khám
                    </button>
                  )}
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                      <th style={{ padding: '12px 14px' }}>Ngày</th>
                      {attendanceSubTab === 'all' && <th style={{ padding: '12px 14px' }}>Nhân sự</th>}
                      {attendanceSubTab === 'all' && <th style={{ padding: '12px 14px' }}>Khoa phòng</th>}
                      <th style={{ padding: '12px 14px' }}>Ca trực</th>
                      <th style={{ padding: '12px 14px' }}>Giờ vào</th>
                      <th style={{ padding: '12px 14px' }}>Giờ ra</th>
                      <th style={{ padding: '12px 14px' }}>Đánh giá</th>
                      <th style={{ padding: '12px 14px' }}>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(attendanceSubTab === 'my' ? myAttendances : allAttendances).length === 0 ? (
                      <tr>
                        <td colSpan={attendanceSubTab === 'all' ? 8 : 6} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                          Chưa có dữ liệu chấm công.
                        </td>
                      </tr>
                    ) : (
                      (attendanceSubTab === 'my' ? myAttendances : allAttendances).map((att) => (
                        <tr key={att.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 700 }}>
                            {new Date(att.attendanceDate).toLocaleDateString('vi-VN')}
                          </td>
                          {attendanceSubTab === 'all' && (
                            <td style={{ padding: '12px 14px', fontWeight: 650, color: 'var(--primary-dark)' }}>
                              {att.staffName} ({att.staffCode})
                            </td>
                          )}
                          {attendanceSubTab === 'all' && (
                            <td style={{ padding: '12px 14px' }}>{att.departmentName || '---'}</td>
                          )}
                          <td style={{ padding: '12px 14px' }}>{att.shiftName || 'Ca tiêu chuẩn'}</td>
                          <td style={{ padding: '12px 14px', color: '#16a34a', fontWeight: 700 }}>
                            {att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString('vi-VN') : '---'}
                          </td>
                          <td style={{ padding: '12px 14px', color: '#0284c7', fontWeight: 700 }}>
                            {att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString('vi-VN') : '---'}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 700,
                                background: att.status === 'ON_TIME' ? '#dcfce7' : '#fee2e2',
                                color: att.status === 'ON_TIME' ? '#166534' : '#991b1b',
                              }}
                            >
                              {att.status === 'ON_TIME' ? 'Đúng giờ' : 'Trễ / Về sớm'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#64748b' }}>{att.notes || '---'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODAL THÊM / SỬA NHÂN SỰ (UC-NS01, UC-NS02) */}
        {/* =================================================================== */}
        {(showCreateStaffModal || showEditStaffModal) && (
          <div className="modal-backdrop">
            <div className="modal-card" style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                  {showCreateStaffModal ? 'Thêm mới hồ sơ nhân sự' : 'Cập nhật hồ sơ nhân sự'}
                </h3>
                <button
                  className="modal-close"
                  onClick={() => {
                    setShowCreateStaffModal(false)
                    setShowEditStaffModal(false)
                  }}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={showCreateStaffModal ? handleCreateStaff : handleUpdateStaff}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {showCreateStaffModal && (
                    <div className="form-group">
                      <label className="form-label">Tên đăng nhập hệ thống *</label>
                      <input
                        type="text"
                        required
                        className="form-control"
                        value={formStaff.username}
                        onChange={(e) => setFormStaff({ ...formStaff, username: e.target.value })}
                        placeholder="Ví dụ: bs_lan, letan_nga"
                      />
                    </div>
                  )}

                  {showCreateStaffModal && (
                    <div className="form-group">
                      <label className="form-label">Mật khẩu khởi tạo</label>
                      <input
                        type="password"
                        className="form-control"
                        value={formStaff.password}
                        onChange={(e) => setFormStaff({ ...formStaff, password: e.target.value })}
                        placeholder="Mặc định: 123456"
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Họ và tên nhân viên *</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={formStaff.fullName}
                      onChange={(e) => setFormStaff({ ...formStaff, fullName: e.target.value })}
                      placeholder="BS.CKI Nguyễn Thị Mai"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Vai trò chức năng</label>
                    <select
                      className="form-control"
                      value={formStaff.roleCode}
                      onChange={(e) => setFormStaff({ ...formStaff, roleCode: e.target.value })}
                      disabled={showEditStaffModal}
                    >
                      <option value="doctor">Bác sĩ khám bệnh</option>
                      <option value="nurse">Điều dưỡng viên</option>
                      <option value="receptionist">Nhân viên Lễ tân</option>
                      <option value="technician">Kỹ thuật viên Cận lâm sàng</option>
                      <option value="pharmacist">Dược sĩ nhà thuốc</option>
                      <option value="cashier">Thu ngân viện phí</option>
                      <option value="manager">Quản lý phòng khám</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Khoa phòng công tác</label>
                    <select
                      className="form-control"
                      value={formStaff.departmentId}
                      onChange={(e) => setFormStaff({ ...formStaff, departmentId: e.target.value ? Number(e.target.value) : '' })}
                    >
                      <option value="">-- Chưa phân khoa --</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Giới tính *</label>
                    <select
                      className="form-control"
                      value={formStaff.gender}
                      onChange={(e) => setFormStaff({ ...formStaff, gender: e.target.value })}
                    >
                      <option value="FEMALE">Nữ</option>
                      <option value="MALE">Nam</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ngày sinh</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formStaff.dateOfBirth}
                      onChange={(e) => setFormStaff({ ...formStaff, dateOfBirth: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Số CMND / CCCD</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formStaff.idCardNumber}
                      onChange={(e) => setFormStaff({ ...formStaff, idCardNumber: e.target.value })}
                      placeholder="12 chữ số căn cước"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Số điện thoại liên lạc</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formStaff.phone}
                      onChange={(e) => setFormStaff({ ...formStaff, phone: e.target.value })}
                      placeholder="0912 345 678"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email cơ quan</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formStaff.email}
                      onChange={(e) => setFormStaff({ ...formStaff, email: e.target.value })}
                      placeholder="bs.lan@careplusclinic.vn"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Học vị / Bằng cấp chuyên môn</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formStaff.qualification}
                      onChange={(e) => setFormStaff({ ...formStaff, qualification: e.target.value })}
                      placeholder="Thạc sĩ, Bác sĩ CKII..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ngày vào làm</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formStaff.hireDate}
                      onChange={(e) => setFormStaff({ ...formStaff, hireDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label className="form-label">Địa chỉ thường trú</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formStaff.address}
                    onChange={(e) => setFormStaff({ ...formStaff, address: e.target.value })}
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  />
                </div>

                {/* Thông tin bác sĩ chuyên môn */}
                {formStaff.roleCode === 'doctor' && (
                  <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 750, color: 'var(--primary-dark)' }}>
                      Hồ sơ chuyên môn Bác sĩ
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Chứng chỉ hành nghề khám chữa bệnh</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formStaff.licenseNumber}
                          onChange={(e) => setFormStaff({ ...formStaff, licenseNumber: e.target.value })}
                          placeholder="CCHN_001234/HN"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Chuyên khoa khám chính</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formStaff.specialty}
                          onChange={(e) => setFormStaff({ ...formStaff, specialty: e.target.value })}
                          placeholder="Ví dụ: Nội tim mạch, Nhi khoa"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Số năm kinh nghiệm</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formStaff.yearsOfExperience}
                          onChange={(e) => setFormStaff({ ...formStaff, yearsOfExperience: Number(e.target.value) })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Giá công khám chuẩn (VNĐ)</label>
                        <input
                          type="number"
                          step="10000"
                          className="form-control"
                          value={formStaff.consultationFee}
                          onChange={(e) => setFormStaff({ ...formStaff, consultationFee: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => {
                      setShowCreateStaffModal(false)
                      setShowEditStaffModal(false)
                    }}
                  >
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Đang lưu...' : showCreateStaffModal ? 'Tạo hồ sơ' : 'Cập nhật hồ sơ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL THÔI VIỆC NHÂN SỰ */}
        {showResignModal && selectedStaff && (
          <div className="modal-backdrop">
            <div className="modal-card" style={{ maxWidth: '480px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 750, margin: 0, color: '#dc2626' }}>
                  Xác nhận cho thôi việc nhân sự
                </h3>
                <button className="modal-close" onClick={() => setShowResignModal(false)}>&times;</button>
              </div>

              <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5 }}>
                Bạn đang thực hiện ghi nhận thôi việc cho nhân viên <strong>{selectedStaff.fullName}</strong> ({selectedStaff.staffCode}).
                Tài khoản người dùng sẽ bị tạm khóa đăng nhập.
              </p>

              <div className="form-group">
                <label className="form-label">Lý do thôi việc / ghi chú</label>
                <textarea
                  rows={3}
                  className="form-control"
                  value={resignReason}
                  onChange={(e) => setResignReason(e.target.value)}
                  placeholder="Ghi rõ lý do thôi việc, chuyển công tác hoặc nghỉ hưu..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button className="btn btn-light" onClick={() => setShowResignModal(false)}>Hủy</button>
                <button className="btn btn-primary" style={{ background: '#dc2626' }} onClick={handleResignStaff} disabled={loading}>
                  Xác nhận thôi việc
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL THÊM / SỬA CHUYÊN KHOA */}
        {showDeptModal && (
          <div className="modal-backdrop">
            <div className="modal-card" style={{ maxWidth: '520px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 750, margin: 0, color: 'var(--ink)' }}>
                  {editingDeptId ? 'Cập nhật chuyên khoa' : 'Thêm mới chuyên khoa'}
                </h3>
                <button className="modal-close" onClick={() => setShowDeptModal(false)}>&times;</button>
              </div>

              <form onSubmit={handleSaveDepartment}>
                <div className="form-group">
                  <label className="form-label">Mã chuyên khoa *</label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingDeptId)}
                    className="form-control"
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                    placeholder="Ví dụ: K_NOI, K_NHI, K_MAT"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tên chuyên khoa *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={deptForm.name}
                    onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                    placeholder="Khoa Nội tổng quát"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Vị trí khoa phòng</label>
                  <input
                    type="text"
                    className="form-control"
                    value={deptForm.location}
                    onChange={(e) => setDeptForm({ ...deptForm, location: e.target.value })}
                    placeholder="Tầng 1 - Khu A"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mô tả chức năng</label>
                  <textarea
                    rows={2}
                    className="form-control"
                    value={deptForm.description}
                    onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                  <button type="button" className="btn btn-light" onClick={() => setShowDeptModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>Lưu chuyên khoa</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL THÊM / SỬA PHÒNG KHÁM */}
        {showRoomModal && (
          <div className="modal-backdrop">
            <div className="modal-card" style={{ maxWidth: '520px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 750, margin: 0, color: 'var(--ink)' }}>
                  {editingRoomId ? 'Cập nhật phòng khám' : 'Thêm phòng khám mới'}
                </h3>
                <button className="modal-close" onClick={() => setShowRoomModal(false)}>&times;</button>
              </div>

              <form onSubmit={handleSaveRoom}>
                <div className="form-group">
                  <label className="form-label">Chuyên khoa trực thuộc *</label>
                  <select
                    required
                    className="form-control"
                    value={roomForm.departmentId}
                    onChange={(e) => setRoomForm({ ...roomForm, departmentId: Number(e.target.value) })}
                  >
                    <option value="">-- Chọn chuyên khoa --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Số phòng (Mã phòng) *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={roomForm.roomNumber}
                    onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                    placeholder="P101, P202, P001"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tên phòng khám / chức năng *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={roomForm.name}
                    onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                    placeholder="Phòng Khám Nội 1"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Loại phòng</label>
                  <select
                    className="form-control"
                    value={roomForm.roomType}
                    onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })}
                  >
                    <option value="EXAMINATION">Khám bệnh lâm sàng</option>
                    <option value="TREATMENT">Thủ thuật / Điều trị</option>
                    <option value="IMAGING">Chẩn đoán hình ảnh (X-quang, Siêu âm)</option>
                    <option value="LABORATORY">Xét nghiệm sinh hóa / huyết học</option>
                    <option value="PHARMACY">Quầy cấp phát thuốc</option>
                    <option value="CASHIER">Quầy thu ngân</option>
                    <option value="OTHER">Chức năng khác</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                  <button type="button" className="btn btn-light" onClick={() => setShowRoomModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>Lưu phòng khám</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL PHÂN CA LÀM VIỆC (UC-NS04) */}
        {showScheduleModal && (
          <div className="modal-backdrop">
            <div className="modal-card" style={{ maxWidth: '520px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 750, margin: 0, color: 'var(--ink)' }}>
                  Phân lịch trực / Ca làm việc
                </h3>
                <button className="modal-close" onClick={() => setShowScheduleModal(false)}>&times;</button>
              </div>

              <form onSubmit={handleCreateSchedule}>
                <div className="form-group">
                  <label className="form-label">Nhân sự / Bác sĩ *</label>
                  <select
                    required
                    className="form-control"
                    value={scheduleForm.staffId}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, staffId: Number(e.target.value) })}
                  >
                    <option value="">-- Chọn bác sĩ / nhân viên --</option>
                    {staffList.filter((s) => s.status === 'ACTIVE').map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.staffCode}) - {s.qualification || s.roleName || 'Bác sĩ'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Ngày làm việc *</label>
                  <input
                    type="date"
                    required
                    className="form-control"
                    value={scheduleForm.workDate}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, workDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ca làm việc *</label>
                  <select
                    required
                    className="form-control"
                    value={scheduleForm.shiftId}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, shiftId: Number(e.target.value) })}
                  >
                    {shifts.map((sh) => (
                      <option key={sh.id} value={sh.id}>
                        {sh.name} ({sh.startTime.slice(0, 5)} - {sh.endTime.slice(0, 5)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Phòng khám / Phòng trực</label>
                  <select
                    className="form-control"
                    value={scheduleForm.roomId}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, roomId: e.target.value ? Number(e.target.value) : '' })}
                  >
                    <option value="">-- Tùy chọn (Chưa phân phòng) --</option>
                    {rooms.filter((r) => r.isAvailable).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.roomNumber} - {r.name} ({r.departmentName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Ghi chú phân công</label>
                  <input
                    type="text"
                    className="form-control"
                    value={scheduleForm.note}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, note: e.target.value })}
                    placeholder="Trực chính, tiếp nhận ca nặng..."
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                  <button type="button" className="btn btn-light" onClick={() => setShowScheduleModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>Lưu lịch trực</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL ĐĂNG KÝ NGHỈ / ĐỔI CA (UC-NS06) */}
        {showLeaveSwapModal && (
          <div className="modal-backdrop">
            <div className="modal-card" style={{ maxWidth: '560px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 750, margin: 0, color: 'var(--ink)' }}>
                  Đăng ký xin nghỉ phép hoặc đổi ca trực
                </h3>
                <button className="modal-close" onClick={() => setShowLeaveSwapModal(false)}>&times;</button>
              </div>

              <form onSubmit={handleCreateLeaveSwap}>
                <div className="form-group">
                  <label className="form-label">Loại nguyện vọng *</label>
                  <div style={{ display: 'flex', gap: '20px', margin: '8px 0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600 }}>
                      <input
                        type="radio"
                        name="reqType"
                        value="LEAVE"
                        checked={leaveSwapForm.requestType === 'LEAVE'}
                        onChange={() => setLeaveSwapForm({ ...leaveSwapForm, requestType: 'LEAVE' })}
                      />
                      Xin nghỉ phép
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600 }}>
                      <input
                        type="radio"
                        name="reqType"
                        value="SWAP"
                        checked={leaveSwapForm.requestType === 'SWAP'}
                        onChange={() => setLeaveSwapForm({ ...leaveSwapForm, requestType: 'SWAP' })}
                      />
                      Đổi ca trực với đồng nghiệp
                    </label>
                  </div>
                </div>

                {leaveSwapForm.requestType === 'LEAVE' ? (
                  <div className="form-group">
                    <label className="form-label">Ngày xin nghỉ *</label>
                    <input
                      type="date"
                      required
                      className="form-control"
                      value={leaveSwapForm.leaveDate}
                      onChange={(e) => setLeaveSwapForm({ ...leaveSwapForm, leaveDate: e.target.value })}
                    />
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="form-label">Đồng nghiệp đổi ca cùng *</label>
                      <select
                        required
                        className="form-control"
                        value={leaveSwapForm.targetStaffId}
                        onChange={(e) => setLeaveSwapForm({ ...leaveSwapForm, targetStaffId: Number(e.target.value) })}
                      >
                        <option value="">-- Chọn đồng nghiệp thỏa thuận --</option>
                        {staffList.filter((s) => s.status === 'ACTIVE').map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.fullName} ({s.staffCode}) - {s.departmentName || 'Chung'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Ngày muốn đổi sang</label>
                        <input
                          type="date"
                          className="form-control"
                          value={leaveSwapForm.targetDate}
                          onChange={(e) => setLeaveSwapForm({ ...leaveSwapForm, targetDate: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Ca muốn đổi sang</label>
                        <select
                          className="form-control"
                          value={leaveSwapForm.targetShiftId}
                          onChange={(e) => setLeaveSwapForm({ ...leaveSwapForm, targetShiftId: Number(e.target.value) })}
                        >
                          <option value="">-- Chọn ca --</option>
                          {shifts.map((sh) => (
                            <option key={sh.id} value={sh.id}>{sh.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label className="form-label">Lý do chi tiết *</label>
                  <textarea
                    rows={3}
                    required
                    className="form-control"
                    value={leaveSwapForm.reason}
                    onChange={(e) => setLeaveSwapForm({ ...leaveSwapForm, reason: e.target.value })}
                    placeholder="Ghi rõ lý do gia đình, công tác, sức khỏe..."
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                  <button type="button" className="btn btn-light" onClick={() => setShowLeaveSwapModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>Gửi yêu cầu xét duyệt</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DUYỆT NGHỈ / ĐỔI CA (QUẢN LÝ) */}
        {selectedReviewItem && (
          <div className="modal-backdrop">
            <div className="modal-card" style={{ maxWidth: '480px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 750, margin: 0, color: 'var(--ink)' }}>
                  Xét duyệt yêu cầu nhân sự
                </h3>
                <button className="modal-close" onClick={() => setSelectedReviewItem(null)}>&times;</button>
              </div>

              <div style={{ fontSize: '14px', lineHeight: 1.6, marginBottom: '16px', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px' }}>
                <div>Người gửi: <strong>{selectedReviewItem.staffName}</strong></div>
                <div>Loại yêu cầu: <strong>{selectedReviewItem.requestType === 'LEAVE' ? 'Xin nghỉ phép' : 'Đổi ca trực'}</strong></div>
                <div>Lý do: <em>"{selectedReviewItem.reason}"</em></div>
              </div>

              <div className="form-group">
                <label className="form-label">Ghi chú phản hồi của Quản lý</label>
                <input
                  type="text"
                  className="form-control"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Ghi chú đồng ý hoặc lý do từ chối..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button
                  className="btn btn-light"
                  style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                  onClick={() => handleReviewLeaveSwap('REJECTED')}
                  disabled={loading}
                >
                  Từ chối
                </button>
                <button
                  className="btn btn-primary"
                  style={{ background: '#16a34a' }}
                  onClick={() => handleReviewLeaveSwap('APPROVED')}
                  disabled={loading}
                >
                  Phê duyệt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
