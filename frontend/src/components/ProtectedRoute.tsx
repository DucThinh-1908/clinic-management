import React from 'react'
import { Navigate, Link } from 'react-router-dom'
import type { AuthUser } from '../types'

interface ProtectedRouteProps {
  currentUser: AuthUser | null
  allowedRoles?: string[]
  requireStaff?: boolean
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  currentUser,
  allowedRoles = [],
  requireStaff = false,
  children,
}) => {
  // 1. Chưa đăng nhập
  if (!currentUser) {
    return <Navigate to="/dang-nhap" replace />
  }

  const userRoles = (currentUser.roles || []).map((r) => r.toLowerCase())
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

  // 3. Kiểm tra vai trò cụ thể (allowedRoles)
  if (allowedRoles.length > 0) {
    // Admin luôn có quyền truy cập tất cả
    const hasRole =
      userRoles.includes('admin') ||
      allowedRoles.some((allowed) => {
        const lower = allowed.toLowerCase()
        if (lower === 'pharmacist') {
          return userRoles.includes('pharmacist') || currentUser.username?.toLowerCase().includes('pharm')
        }
        return userRoles.includes(lower)
      })

    if (!hasRole) {
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
        if (userRoles.includes('admin') || userRoles.includes('manager')) return '/admin/tai-khoan'
        if (userRoles.includes('pharmacist') || currentUser.username?.toLowerCase().includes('pharm')) return '/kho-thuoc'
        if (userRoles.includes('doctor') || userRoles.includes('nurse')) return '/kham-benh'
        if (userRoles.includes('receptionist')) return '/tiep-don'
        return '/quan-ly-benh-nhan'
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
            Tài khoản hiện tại của bạn có vai trò <strong>{getRoleDisplayName(userRoles)}</strong>.
          </p>
          <p style={{ color: '#6b7280', fontSize: '13.5px', lineHeight: 1.6, marginBottom: '24px' }}>
            Hệ thống chỉ cho phép các vai trò được phân công quyền hạn truy cập chức năng này.
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
  }

  return <>{children}</>
}
