import React, { useState, useRef, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import type { AuthUser } from '../types'

interface NavbarProps {
  currentUser: AuthUser | null
  onOpenAppointment: () => void
  onLogout: () => void
  onOpenChangePassword: () => void
  onOpenProfile: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenAppointment,
  onLogout,
  onOpenChangePassword,
  onOpenProfile,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [servicesMenuOpen, setServicesMenuOpen] = useState(false)

  const servicesMenuRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (servicesMenuRef.current && !servicesMenuRef.current.contains(target)) {
        setServicesMenuOpen(false)
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(target)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const userRoles = (currentUser?.roles || []).map((r) => r.toLowerCase())

  const canManage = Boolean(
    currentUser && (userRoles.includes('admin') || userRoles.includes('manager'))
  )

  const isStaff = Boolean(
    currentUser &&
      userRoles.some((r) =>
        ['receptionist', 'doctor', 'nurse', 'manager', 'admin', 'technician', 'pharmacist', 'cashier'].includes(r)
      )
  )

  const isPatient = Boolean(
    currentUser && userRoles.includes('patient') && !isStaff
  )

  const isDoctor = userRoles.includes('doctor')
  const isNurse = userRoles.includes('nurse')
  const isTechnician = userRoles.includes('technician')
  const isReceptionist = userRoles.includes('receptionist')
  const isCashier = userRoles.includes('cashier')
  const isPharmacist = Boolean(
    currentUser &&
      (userRoles.includes('pharmacist') || currentUser.username?.toLowerCase().includes('pharm'))
  )

  // Quyền truy cập các phân hệ nghiệp vụ
  const canAccessBilling = isCashier || canManage
  const canAccessExamination = isDoctor || isNurse || isTechnician || canManage
  const canAccessPharmacy = isPharmacist || canManage
  const canAccessReception = isReceptionist || isNurse || isCashier || isDoctor || canManage
  const canAccessAppointments = isReceptionist || isDoctor || canManage
  const canAccessPatients = isDoctor || isNurse || isReceptionist || isCashier || canManage
  const canAccessSchedule = isStaff
  const canAccessShiftSwap = isStaff && !canManage
  const canAccessReports = canManage || isDoctor || isPharmacist

  const brandDestination = isStaff
    ? isCashier
      ? '/thu-ngan'
      : isDoctor
      ? '/kham-benh'
      : isPharmacist
      ? '/kho-thuoc'
      : isReceptionist
      ? '/tiep-don'
      : isNurse
      ? '/kham-benh'
      : canManage
      ? '/admin/tai-khoan'
      : '/quan-ly-benh-nhan'
    : '/'

  // Lối tắt chính nhanh cho vai trò nhân sự
  const primaryShortcut = isCashier
    ? { to: '/thu-ngan', label: 'Thu viện phí' }
    : isDoctor
    ? { to: '/kham-benh', label: 'Khám bệnh lâm sàng' }
    : isPharmacist
    ? { to: '/kho-thuoc', label: 'Kho dược & Nhà thuốc' }
    : isReceptionist
    ? { to: '/tiep-don-xep-hang', label: 'Tiếp đón & Hàng chờ' }
    : isNurse
    ? { to: '/kham-benh', label: 'Bàn khám & Điều trị' }
    : canManage
    ? { to: '/admin/tai-khoan', label: 'Quản trị hệ thống' }
    : null

  // Danh mục đầy đủ các nghiệp vụ được phân quyền
  interface BusinessItem {
    to: string
    title: string
    desc: string
    color: string
    bg: string
    border: string
  }

  const staffBusinessList: BusinessItem[] = [
    canAccessExamination && {
      to: '/kham-benh',
      title: 'Khám bệnh lâm sàng',
      desc: 'Khám bệnh, chỉ định xét nghiệm, chẩn đoán, kê đơn thuốc',
      color: '#059669',
      bg: '#ecfdf5',
      border: '#a7f3d0',
    },
    canAccessReception && {
      to: '/tiep-don-xep-hang',
      title: 'Tiếp đón & Hàng chờ',
      desc: 'Tiếp đón bệnh nhân, phân luồng xếp hàng, phát số thứ tự',
      color: '#0284c7',
      bg: '#f0f9ff',
      border: '#bae6fd',
    },
    canAccessAppointments && {
      to: '/lich-hen',
      title: 'Đặt & Quản lý lịch hẹn',
      desc: 'Tra cứu, đặt lịch khám và xác nhận lịch hẹn trực tuyến',
      color: '#ea580c',
      bg: '#fff7ed',
      border: '#fed7aa',
    },
    canAccessPatients && {
      to: '/quan-ly-benh-nhan',
      title: 'Hồ sơ bệnh nhân',
      desc: 'Tra cứu lịch sử khám, quản lý bệnh án điện tử',
      color: 'var(--primary)',
      bg: 'var(--soft)',
      border: 'var(--primary-light)',
    },
    canAccessBilling && {
      to: '/thu-ngan',
      title: 'Thu viện phí & Hóa đơn',
      desc: 'Thanh toán viện phí, tiền thuốc, xuất biên lai hóa đơn',
      color: '#047857',
      bg: '#dcfce7',
      border: '#6ee7b7',
    },
    canAccessPharmacy && {
      to: '/kho-thuoc',
      title: 'Nhà thuốc & Kho dược',
      desc: 'Xuất thuốc theo đơn bác sĩ, kiểm kê tồn kho thuốc',
      color: '#047857',
      bg: '#dcfce7',
      border: '#6ee7b7',
    },
    canAccessSchedule && {
      to: '/lich-lam-viec',
      title: 'Lịch làm việc & Ca trực',
      desc: 'Xem phân công ca trực cá nhân và khoa phòng',
      color: '#0284c7',
      bg: '#f0f9ff',
      border: '#bae6fd',
    },
    canAccessSchedule && {
      to: '/cham-cong',
      title: 'Chấm công điểm danh',
      desc: 'Điểm danh vào ca và ra ca làm việc',
      color: '#16a34a',
      bg: '#f0fdf4',
      border: '#bbf7d0',
    },
    canAccessShiftSwap && {
      to: '/dang-ky-ca',
      title: 'Đăng ký nghỉ / Đổi ca',
      desc: 'Gửi đề xuất đổi ca trực hoặc đăng ký nghỉ phép',
      color: '#d97706',
      bg: '#fffbeb',
      border: '#fde68a',
    },
    canManage && {
      to: '/quan-ly-nhan-su',
      title: 'Hồ sơ nhân sự & Khoa phòng',
      desc: 'Quản lý danh sách bác sĩ, điều dưỡng và các chuyên khoa',
      color: '#4f46e5',
      bg: '#eef2ff',
      border: '#c7d2fe',
    },
    canManage && {
      to: '/admin/tai-khoan',
      title: 'Quản lý tài khoản',
      desc: 'Tạo tài khoản, phân quyền và khóa truy cập người dùng',
      color: '#4f46e5',
      bg: '#eef2ff',
      border: '#c7d2fe',
    },
    canManage && {
      to: '/admin/phan-quyen',
      title: 'Phân quyền chức năng',
      desc: 'Cấu hình ma trận phân quyền chi tiết cho các vai trò',
      color: '#4f46e5',
      bg: '#eef2ff',
      border: '#c7d2fe',
    },
    canManage && {
      to: '/admin/nhat-ky-ho-so',
      title: 'Nhật ký truy cập hồ sơ',
      desc: 'Kiểm toán lịch sử xem và thay đổi bệnh án của nhân viên',
      color: '#4f46e5',
      bg: '#eef2ff',
      border: '#c7d2fe',
    },
    canAccessReports && {
      to: '/bao-cao',
      title: canManage ? 'Báo cáo & Thống kê tổng hợp' : isDoctor ? 'Thống kê bệnh tật' : 'Báo cáo kho dược',
      desc: 'Biểu đồ doanh thu, số lượt khám và báo cáo xuất nhập',
      color: '#0284c7',
      bg: '#f0f9ff',
      border: '#bae6fd',
    },
  ].filter(Boolean) as BusinessItem[]

  const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    color: isActive ? 'var(--primary)' : 'var(--ink)',
    fontWeight: isActive ? 750 : 600,
    borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
    padding: '8px 0',
    transition: 'color 0.2s, border-color 0.2s',
  })

  return (
    <header style={{ background: '#fff', boxShadow: '0 3px 18px rgba(17,70,78,.08)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '80px', gap: '16px' }}>
        {/* Brand */}
        <Link to={brandDestination} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 800, color: 'var(--primary-dark)', fontSize: '21px', textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ width: '42px', height: '42px', display: 'grid', placeItems: 'center', borderRadius: '12px', background: 'var(--primary)', color: '#fff', fontSize: '26px', fontWeight: 700 }}>
            +
          </span>
          <span>
            CarePlus Clinic
            <small style={{ display: 'block', fontSize: '10px', color: 'var(--muted)', fontWeight: 600, letterSpacing: '1.4px' }}>
              PHONG KHAM DA KHOA
            </small>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '14px' }} className="desktop-nav">
          {!isStaff ? (
            <>
              <NavLink to="/" style={navLinkStyle}>Trang chủ</NavLink>
              <NavLink to="/gioi-thieu" style={navLinkStyle}>Giới thiệu</NavLink>
              <NavLink to="/dich-vu" style={navLinkStyle}>Dịch vụ & Gói khám</NavLink>
              <NavLink to="/lien-he" style={navLinkStyle}>Liên hệ</NavLink>
              {isPatient && (
                <>
                  <NavLink
                    to="/ho-so-benh-nhan"
                    style={({ isActive }) => ({
                      color: isActive ? 'var(--primary-dark)' : 'var(--primary)',
                      fontWeight: 700,
                      background: isActive ? '#e0f2f1' : 'var(--soft)',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: '1px solid var(--primary-light)',
                      transition: 'all 0.2s',
                      textDecoration: 'none',
                    })}
                  >
                    Hồ sơ bệnh nhân
                  </NavLink>
                  <NavLink
                    to="/lich-hen"
                    style={({ isActive }) => ({
                      color: isActive ? '#0369a1' : '#0284c7',
                      fontWeight: 700,
                      background: isActive ? '#e0f2fe' : '#f0f9ff',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: '1px solid #bae6fd',
                      transition: 'all 0.2s',
                      textDecoration: 'none',
                    })}
                  >
                    Lịch hẹn của tôi
                  </NavLink>
                </>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Lối tắt phân hệ chính của nhân sự */}
              {primaryShortcut && (
                <NavLink
                  to={primaryShortcut.to}
                  style={({ isActive }) => ({
                    color: isActive ? 'var(--primary-dark)' : 'var(--primary)',
                    fontWeight: 700,
                    background: isActive ? '#e0f2f1' : '#f0fdfa',
                    padding: '7px 14px',
                    borderRadius: '20px',
                    border: '1px solid var(--primary-light)',
                    textDecoration: 'none',
                    fontSize: '13.5px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  })}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />
                  {primaryShortcut.label}
                </NavLink>
              )}

              {/* Nút 3 sọc sổ xuống toàn bộ danh mục nghiệp vụ */}
              <div style={{ position: 'relative' }} ref={servicesMenuRef}>
                <button
                  type="button"
                  onClick={() => setServicesMenuOpen(!servicesMenuOpen)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 15px',
                    background: servicesMenuOpen ? '#0d9488' : '#ffffff',
                    color: servicesMenuOpen ? '#ffffff' : 'var(--ink)',
                    border: servicesMenuOpen ? '1px solid #0d9488' : '1px solid var(--border)',
                    borderRadius: '20px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: servicesMenuOpen ? '0 4px 12px rgba(13,148,136,0.25)' : '0 1px 3px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s ease',
                  }}
                  title="Danh sách tất cả phân hệ nghiệp vụ"
                >
                  <span style={{ fontSize: '15px', lineHeight: 1 }}>☰</span>
                  <span>Danh mục nghiệp vụ</span>
                  <span
                    style={{
                      fontSize: '10px',
                      transition: 'transform 0.2s ease',
                      transform: servicesMenuOpen ? 'rotate(180deg)' : 'none',
                    }}
                  >
                    ▼
                  </span>
                </button>

                {/* Dropdown Menu sổ xuống */}
                {servicesMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 'calc(100% + 8px)',
                      background: '#ffffff',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      boxShadow: '0 12px 32px rgba(17,70,78,.14)',
                      width: '380px',
                      maxHeight: 'min(500px, calc(100vh - 100px))',
                      display: 'flex',
                      flexDirection: 'column',
                      zIndex: 300,
                      overflow: 'hidden',
                      animation: 'fadeInMenu 0.15s ease-out',
                    }}
                  >
                    {/* Header menu sổ xuống */}
                    <div
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border)',
                        background: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexShrink: 0,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--primary)' }}>☰</span>
                        <span style={{ fontWeight: 750, fontSize: '13px', color: 'var(--ink)', letterSpacing: '0.3px' }}>
                          PHÂN HỆ NGHIỆP VỤ
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '11.5px',
                          background: 'var(--soft)',
                          color: 'var(--primary-dark)',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: 700,
                        }}
                      >
                        {staffBusinessList.length} chức năng
                      </span>
                    </div>

                    {/* Danh sách các nghiệp vụ có scrollbar */}
                    <div
                      style={{
                        overflowY: 'auto',
                        flex: 1,
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      {staffBusinessList.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => setServicesMenuOpen(false)}
                          style={({ isActive }) => ({
                            display: 'block',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            background: isActive ? item.bg : 'transparent',
                            border: isActive ? `1px solid ${item.border}` : '1px solid transparent',
                            transition: 'all 0.15s ease',
                          })}
                          onMouseEnter={(e) => {
                            if (!e.currentTarget.style.background || e.currentTarget.style.background === 'transparent') {
                              e.currentTarget.style.background = '#f8fafc'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!e.currentTarget.getAttribute('data-active')) {
                              // Giữ nguyên styling từ NavLink
                            }
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: item.color,
                                flexShrink: 0,
                              }}
                            />
                            <div style={{ fontWeight: 700, fontSize: '13.5px', color: item.color }}>
                              {item.title}
                            </div>
                          </div>
                          <div
                            style={{
                              fontSize: '12px',
                              color: 'var(--muted)',
                              marginTop: '2px',
                              paddingLeft: '16px',
                              lineHeight: 1.35,
                            }}
                          >
                            {item.desc}
                          </div>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!isStaff && (
            <button className="btn btn-primary btn-sm" onClick={onOpenAppointment}>
              Đặt lịch khám
            </button>
          )}

          {currentUser ? (
            <div style={{ position: 'relative' }} ref={userDropdownRef}>
              <button
                className="btn btn-light btn-sm"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                style={{ border: '1px solid var(--border)', fontWeight: 650 }}
              >
                {currentUser.username} ({currentUser.roles[0] || 'Người dùng'})
              </button>

              {userDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: '6px',
                    background: '#ffffff',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    boxShadow: 'var(--shadow-md)',
                    minWidth: '250px',
                    maxWidth: '320px',
                    maxHeight: 'min(480px, calc(100vh - 90px))',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 200,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', fontSize: '13px', flexShrink: 0, background: '#fafafa' }}>
                    <div style={{ fontWeight: 700 }}>{currentUser.username}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '11.5px' }}>{currentUser.email || 'Tài khoản hệ thống'}</div>
                  </div>

                  <div
                    style={{
                      overflowY: 'auto',
                      flex: 1,
                      padding: '4px 0',
                    }}
                  >
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false)
                        onOpenProfile()
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 16px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13.5px',
                        fontWeight: 650,
                        color: 'var(--primary-dark)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <span style={{ fontSize: '15px' }}>👤</span>
                      <span>Thông tin cá nhân</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false)
                        onOpenChangePassword()
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 16px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span style={{ fontSize: '15px' }}>🔒</span>
                      <span>Đổi mật khẩu</span>
                    </button>

                  {isStaff && (
                    <>
                      {canAccessExamination && (
                        <Link
                          to="/kham-benh"
                          onClick={() => setUserDropdownOpen(false)}
                          style={{
                            display: 'block',
                            padding: '10px 16px',
                            fontSize: '13.5px',
                            color: '#059669',
                          }}
                        >
                          Khám bệnh lâm sàng
                        </Link>
                      )}
                      {canAccessPharmacy && (
                        <Link
                          to="/kho-thuoc"
                          onClick={() => setUserDropdownOpen(false)}
                          style={{
                            display: 'block',
                            padding: '10px 16px',
                            fontSize: '13.5px',
                            color: '#047857',
                          }}
                        >
                          Nhà thuốc & Kho dược
                        </Link>
                      )}
                      {canAccessReception && (
                        <Link
                          to="/tiep-don-xep-hang"
                          onClick={() => setUserDropdownOpen(false)}
                          style={{
                            display: 'block',
                            padding: '10px 16px',
                            fontSize: '13.5px',
                            color: '#0369a1',
                          }}
                        >
                          Tiếp đón & Hàng chờ
                        </Link>
                      )}
                      {canAccessAppointments && (
                        <Link
                          to="/lich-hen"
                          onClick={() => setUserDropdownOpen(false)}
                          style={{
                            display: 'block',
                            padding: '10px 16px',
                            fontSize: '13.5px',
                            color: '#ea580c',
                          }}
                        >
                          Đặt & Quản lý lịch hẹn
                        </Link>
                      )}
                      {canAccessPatients && (
                        <Link
                          to="/quan-ly-benh-nhan"
                          onClick={() => setUserDropdownOpen(false)}
                          style={{
                            display: 'block',
                            padding: '10px 16px',
                            fontSize: '13.5px',
                            color: 'var(--primary-dark)',
                          }}
                        >
                          Quản lý hồ sơ bệnh nhân
                        </Link>
                      )}
                      {canAccessSchedule && (
                        <>
                          <Link
                            to="/lich-lam-viec"
                            onClick={() => setUserDropdownOpen(false)}
                            style={{
                              display: 'block',
                              padding: '10px 16px',
                              fontSize: '13.5px',
                              color: '#0369a1',
                            }}
                          >
                            Lịch làm việc & Ca trực
                          </Link>
                          <Link
                            to="/cham-cong"
                            onClick={() => setUserDropdownOpen(false)}
                            style={{
                              display: 'block',
                              padding: '10px 16px',
                              fontSize: '13.5px',
                              color: '#15803d',
                            }}
                          >
                            Chấm công điểm danh
                          </Link>
                        </>
                      )}
                      {canAccessShiftSwap && (
                        <Link
                          to="/dang-ky-ca"
                          onClick={() => setUserDropdownOpen(false)}
                          style={{
                            display: 'block',
                            padding: '10px 16px',
                            fontSize: '13.5px',
                            color: '#b45309',
                          }}
                        >
                          Đăng ký nghỉ / Đổi ca
                        </Link>
                      )}
                    </>
                  )}

                  {isPatient && (
                    <>
                      <Link
                        to="/ho-so-benh-nhan"
                        onClick={() => setUserDropdownOpen(false)}
                        style={{
                          display: 'block',
                          padding: '10px 16px',
                          fontSize: '13.5px',
                          color: 'var(--primary-dark)',
                        }}
                      >
                        Hồ sơ sức khỏe của tôi
                      </Link>
                      <Link
                        to="/lich-hen"
                        onClick={() => setUserDropdownOpen(false)}
                        style={{
                          display: 'block',
                          padding: '10px 16px',
                          fontSize: '13.5px',
                          color: '#0284c7',
                        }}
                      >
                        Lịch hẹn khám của tôi
                      </Link>
                    </>
                  )}

                  {canManage && (
                    <>
                      <Link
                        to="/quan-ly-nhan-su"
                        onClick={() => setUserDropdownOpen(false)}
                        style={{
                          display: 'block',
                          padding: '10px 16px',
                          fontSize: '13.5px',
                          color: '#4338ca',
                        }}
                      >
                        Quản lý hồ sơ nhân sự
                      </Link>
                      <Link
                        to="/quan-ly-chuyen-khoa"
                        onClick={() => setUserDropdownOpen(false)}
                        style={{
                          display: 'block',
                          padding: '10px 16px',
                          fontSize: '13.5px',
                          color: '#4338ca',
                        }}
                      >
                        Chuyên khoa & Phòng khám
                      </Link>
                      <Link
                        to="/admin/tai-khoan"
                        onClick={() => setUserDropdownOpen(false)}
                        style={{
                          display: 'block',
                          padding: '10px 16px',
                          fontSize: '13.5px',
                          color: '#4338ca',
                        }}
                      >
                        Quản lý tài khoản
                      </Link>
                      <Link
                        to="/admin/phan-quyen"
                        onClick={() => setUserDropdownOpen(false)}
                        style={{
                          display: 'block',
                          padding: '10px 16px',
                          fontSize: '13.5px',
                          color: '#4338ca',
                        }}
                      >
                        Phân quyền chức năng
                      </Link>
                      <Link
                        to="/admin/nhat-ky-ho-so"
                        onClick={() => setUserDropdownOpen(false)}
                        style={{
                          display: 'block',
                          padding: '10px 16px',
                          fontSize: '13.5px',
                          color: '#4338ca',
                        }}
                      >
                        Nhật ký truy cập hồ sơ
                      </Link>
                    </>
                  )}

                  {canAccessReports && (
                    <Link
                      to="/bao-cao"
                      onClick={() => setUserDropdownOpen(false)}
                      style={{
                        display: 'block',
                        padding: '10px 16px',
                        fontSize: '13.5px',
                        color: '#0284c7',
                        fontWeight: 650,
                      }}
                    >
                      {canManage ? 'Báo cáo & Thống kê' : isDoctor ? 'Thống kê bệnh' : 'Báo cáo kho dược'}
                    </Link>
                  )}

                  </div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false)
                      onLogout()
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 16px',
                      background: '#fff5f5',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      color: '#dc2626',
                      borderTop: '1px solid #fee2e2',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/dang-nhap" className="btn btn-outline btn-sm">
              Đăng nhập
            </Link>
          )}

          {/* Hamburger button for mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-toggle"
            aria-label="Toggle menu"
            style={{
              display: 'none',
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            Menu
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div style={{ background: '#fff', borderTop: '1px solid var(--border)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: 'calc(100vh - 80px)', overflowY: 'auto' }}>
          {!isStaff ? (
            <>
              <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ padding: '6px 0', fontWeight: 650 }}>Trang chủ</Link>
              <Link to="/gioi-thieu" onClick={() => setMobileMenuOpen(false)} style={{ padding: '6px 0', fontWeight: 650 }}>Giới thiệu</Link>
              <Link to="/dich-vu" onClick={() => setMobileMenuOpen(false)} style={{ padding: '6px 0', fontWeight: 650 }}>Dịch vụ & Gói khám</Link>
              <Link to="/lien-he" onClick={() => setMobileMenuOpen(false)} style={{ padding: '6px 0', fontWeight: 650 }}>Liên hệ</Link>
              {isPatient && (
                <>
                  <Link to="/ho-so-benh-nhan" onClick={() => setMobileMenuOpen(false)} style={{ padding: '6px 0', fontWeight: 650, color: 'var(--primary)' }}>
                    Hồ sơ bệnh nhân
                  </Link>
                  <Link to="/lich-hen" onClick={() => setMobileMenuOpen(false)} style={{ padding: '6px 0', fontWeight: 650, color: '#0369a1' }}>
                    Lịch hẹn khám của tôi
                  </Link>
                </>
              )}
            </>
          ) : (
            <>
              {canAccessExamination && (
                <Link to="/kham-benh" onClick={() => setMobileMenuOpen(false)} style={{ padding: '6px 0', fontWeight: 650, color: '#059669' }}>
                  Khám bệnh lâm sàng
                </Link>
              )}
              {canAccessBilling && (
                <Link to="/thu-ngan" onClick={() => setMobileMenuOpen(false)} style={{ padding: '6px 0', fontWeight: 650, color: '#047857' }}>
                  Thu viện phí & Hóa đơn
                </Link>
              )}
              {canAccessPharmacy && (
                <Link to="/kho-thuoc" onClick={() => setMobileMenuOpen(false)} style={{ padding: '6px 0', fontWeight: 650, color: '#047857' }}>
                  Nhà thuốc & Kho dược
                </Link>
              )}
              {canAccessReception && (
                <Link to="/tiep-don-xep-hang" onClick={() => setMobileMenuOpen(false)} style={{ padding: '6px 0', fontWeight: 650, color: '#0369a1' }}>
                  Tiếp đón & Hàng chờ
                </Link>
              )}
              {canAccessAppointments && (
                <Link to="/lich-hen" onClick={() => setMobileMenuOpen(false)} style={{ padding: '6px 0', fontWeight: 650, color: '#ea580c' }}>
                  Đặt & Quản lý lịch hẹn
                </Link>
              )}
              {canAccessPatients && (
                <Link to="/quan-ly-benh-nhan" onClick={() => setMobileMenuOpen(false)} style={{ padding: '6px 0', fontWeight: 650, color: 'var(--primary)' }}>
                  Quản lý hồ sơ bệnh nhân
                </Link>
              )}
              {canAccessSchedule && (
                <>
                  <Link to="/lich-lam-viec" onClick={() => setMobileMenuOpen(false)} style={{ padding: '6px 0', fontWeight: 650, color: '#0369a1' }}>
                    Lịch làm việc & Ca trực
                  </Link>
                  <Link to="/cham-cong" onClick={() => setMobileMenuOpen(false)} style={{ padding: '6px 0', fontWeight: 650, color: '#15803d' }}>
                    Chấm công điểm danh
                  </Link>
                </>
              )}
              {canAccessShiftSwap && (
                <Link to="/dang-ky-ca" onClick={() => setMobileMenuOpen(false)} style={{ padding: '6px 0', fontWeight: 650, color: '#b45309' }}>
                  Đăng ký nghỉ / Đổi ca
                </Link>
              )}
              {canManage && (
                <>
                  <Link to="/quan-ly-nhan-su" onClick={() => setMobileMenuOpen(false)} style={{ padding: '6px 0', fontWeight: 650, color: '#4338ca' }}>
                    Quản lý hồ sơ nhân sự
                  </Link>
                  <Link to="/quan-ly-chuyen-khoa" onClick={() => setMobileMenuOpen(false)} style={{ padding: '6px 0', fontWeight: 650, color: '#4338ca' }}>
                    Chuyên khoa & Phòng khám
                  </Link>
                  <Link to="/admin/tai-khoan" onClick={() => setMobileMenuOpen(false)} style={{ padding: '6px 0', fontWeight: 650, color: '#4338ca' }}>
                    Quản lý tài khoản
                  </Link>
                  <Link to="/admin/phan-quyen" onClick={() => setMobileMenuOpen(false)} style={{ padding: '6px 0', fontWeight: 650, color: '#4338ca' }}>
                    Phân quyền chức năng
                  </Link>
                  <Link to="/admin/nhat-ky-ho-so" onClick={() => setMobileMenuOpen(false)} style={{ padding: '6px 0', fontWeight: 650, color: '#4338ca' }}>
                    Nhật ký truy cập hồ sơ
                  </Link>
                </>
              )}
              {canAccessReports && (
                <Link to="/bao-cao" onClick={() => setMobileMenuOpen(false)} style={{ padding: '6px 0', fontWeight: 650, color: '#0284c7' }}>
                  {canManage ? 'Báo cáo & Thống kê' : isDoctor ? 'Thống kê bệnh' : 'Báo cáo kho dược'}
                </Link>
              )}
            </>
          )}
          {!currentUser ? (
            <Link to="/dang-nhap" onClick={() => setMobileMenuOpen(false)} className="btn btn-outline" style={{ textAlign: 'center' }}>
              Đăng nhập
            </Link>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  onOpenProfile()
                }}
                className="btn btn-light"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: 650,
                  color: 'var(--primary-dark)',
                  background: '#f0fdfa',
                  border: '1px solid var(--primary-light)',
                }}
              >
                <span>👤</span>
                <span>Thông tin cá nhân</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  onOpenChangePassword()
                }}
                className="btn btn-light"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: 600,
                }}
              >
                <span>🔒</span>
                <span>Đổi mật khẩu</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  onLogout()
                }}
                className="btn btn-light"
                style={{
                  color: '#e02424',
                  textAlign: 'center',
                  fontWeight: 700,
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                }}
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeInMenu {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 960px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
      `}</style>
    </header>
  )
}
