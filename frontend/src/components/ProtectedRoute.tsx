import React from 'react'
import { Navigate, Link } from 'react-router-dom'
import type { AuthUser } from '../types'

interface ProtectedRouteProps {
  currentUser: AuthUser | null
  allowedRoles?: string[]
  allowedPermissions?: string[]
  requireStaff?: boolean
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  currentUser,
  allowedRoles = [],
  allowedPermissions = [],
  requireStaff = false,
  children,
}) => {
  // 1. Chưa đăng nhập
  if (!currentUser) {
    return <Navigate to="/dang-nhap" replace />
  }

  const userRoles = (currentUser.roles || []).map((r) => r.toLowerCase())
  const userPermissions = (currentUser.permissions || []).map((p) => p.toUpperCase())

  const isStaff = userRoles.some((r) =>
    ['admin', 'manager', 'receptionist', 'doctor', 'nurse', 'technician', 'pharmacist', 'cashier'].includes(r)
  )

  // 2. Yêu cầu là nhân viên y tế nhưng là bệnh nhân
  if (requireStaff && !isStaff) {
    return (
      <div style={{ maxWidth: '640px', margin: '60px auto', padding: '32px', background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #fee2e2', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', color: '#b91c1c', fontSize: '28px', lineHeight: '56px', fontWeight: 800, marginBottom: '16px' }}>
          !
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#991b1b', marginBottom: '8px' }}>
          Khu vực hạn chế truy cập
        </h2>
        <p style={{ color: '#4b5563', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
          Chức năng này dành riêng cho nhân viên y tế nội bộ của phòng khám CarePlus. Tài khoản của bạn hiện không có quyền truy cập.
        </p>
        <Link
          to="/"
          style={{ display: 'inline-block', padding: '10px 24px', background: 'var(--primary)', color: '#ffffff', borderRadius: '8px', fontWeight: 600, textDecoration: 'none' }}
        >
          Quay về Trang chủ
        </Link>
      </div>
    )
  }

  // 3. Kiểm tra phân quyền chi tiết (allowedPermissions) hoặc vai trò (allowedRoles)
  const isSuperAdmin = userRoles.includes('admin') || userRoles.includes('manager')

  const hasPermission =
    allowedPermissions.length > 0 &&
    allowedPermissions.some((perm) => userPermissions.includes(perm.toUpperCase()))

  const isPatientAllowed =
    allowedRoles.some((r) => r.toLowerCase() === 'patient') &&
    userRoles.includes('patient') &&
    !isStaff

  // Nếu tuyến đường có quy định allowedPermissions, BẮT BUỘC nhân sự phải có ít nhất 1 quyền trong danh sách (hoặc là Admin/Manager, hoặc là Bệnh nhân ở cổng bệnh nhân)
  // Điều này đảm bảo khi gỡ quyền khỏi vai trò trên Keycloak thì tài khoản đó lập tức bị chặn truy cập.
  const hasAccess =
    isSuperAdmin ||
    (allowedPermissions.length > 0
      ? hasPermission || isPatientAllowed
      : allowedRoles.length === 0 ||
        allowedRoles.some((allowed) => userRoles.includes(allowed.toLowerCase())))

  if ((allowedRoles.length > 0 || allowedPermissions.length > 0) && !hasAccess) {
    const getRoleDisplayName = (roles: string[]) => {
      if (roles.includes('pharmacist')) return 'Dược sĩ'
      if (roles.includes('doctor')) return 'Bác sĩ'
      if (roles.includes('nurse')) return 'Điều dưỡng'
      if (roles.includes('receptionist')) return 'Lễ tân'
      if (roles.includes('technician')) return 'Kỹ thuật viên'
      if (roles.includes('cashier')) return 'Thu ngân'
      if (roles.includes('manager')) return 'Quản lý phòng khám'
      if (roles.includes('admin')) return 'Quản trị viên'
      return 'Người dùng'
    }

    const getDefaultStaffDestination = () => {
      if (isSuperAdmin || userPermissions.includes('USER_VIEW') || userPermissions.includes('USER_CREATE')) return '/admin/tai-khoan'
      if (userPermissions.includes('ROLE_ASSIGN') || userPermissions.includes('ROLE_MANAGE')) return '/admin/phan-quyen'
      if (userPermissions.includes('RECORD_ACCESS_VIEW')) return '/admin/nhat-ky-ho-so'
      if (userPermissions.includes('DISPENSATION_MANAGE')) return '/kho-thuoc'
      if (userPermissions.includes('MEDICAL_RECORD_WRITE') || userPermissions.includes('PRESCRIPTION_CREATE')) return '/kham-benh'
      if (userPermissions.includes('INVOICE_CREATE')) return '/thu-ngan'
      if (userPermissions.includes('APPOINTMENT_MANAGE')) return '/tiep-don'
      if (userPermissions.includes('MEDICAL_RECORD_VIEW')) return '/quan-ly-benh-nhan'
      if (isStaff) return '/lich-lam-viec'
      return '/'
    }

    return (
      <div style={{ maxWidth: '640px', margin: '60px auto', padding: '36px', background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #fed7aa', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', width: '56px', height: '56px', borderRadius: '50%', background: '#ffedd5', color: '#c2410c', fontSize: '26px', lineHeight: '56px', fontWeight: 800, marginBottom: '16px' }}>
          !
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#9a3412', marginBottom: '8px' }}>
          Từ chối quyền truy cập chức năng
        </h2>
        <p style={{ color: '#4b5563', fontSize: '14.5px', lineHeight: 1.6, marginBottom: '8px' }}>
          Tài khoản hiện tại của bạn có vai trò <strong>{getRoleDisplayName(userRoles)}</strong> nhưng chưa được cấp quyền thực hiện chức năng này trên Keycloak.
        </p>
        <p style={{ color: '#6b7280', fontSize: '13.5px', lineHeight: 1.6, marginBottom: '24px' }}>
          Hệ thống chỉ cho phép truy cập các chức năng đã được gán quyền hạn (Associated roles) tương ứng.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link
            to={getDefaultStaffDestination()}
            style={{ display: 'inline-block', padding: '10px 24px', background: 'var(--primary)', color: '#ffffff', borderRadius: '8px', fontWeight: 600, textDecoration: 'none' }}
          >
            Về trang làm việc của bạn
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
