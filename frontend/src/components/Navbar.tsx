import React, { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import type { AuthUser } from '../types'

interface NavbarProps {
  currentUser: AuthUser | null
  onOpenAppointment: () => void
  onLogout: () => void
  onOpenChangePassword: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenAppointment,
  onLogout,
  onOpenChangePassword,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

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
        <Link to={brandDestination} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 800, color: 'var(--primary-dark)', fontSize: '21px' }}>
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
        <nav style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', flexWrap: 'wrap' }} className="desktop-nav">
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
                    })}
                  >
                    Lịch hẹn của tôi
                  </NavLink>
                </>
              )}
            </>
          ) : (
            <>
              {canAccessExamination && (
                <NavLink
                  to="/kham-benh"
                  style={({ isActive }) => ({
                    color: isActive ? '#065f46' : '#059669',
                    fontWeight: 700,
                    background: isActive ? '#d1fae5' : '#ecfdf5',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: '1px solid #a7f3d0',
                    transition: 'all 0.2s',
                  })}
                >
                  Khám bệnh lâm sàng
                </NavLink>
              )}

              {canAccessBilling && (
                <NavLink
                  to="/thu-ngan"
                  style={({ isActive }) => ({
                    color: isActive ? '#065f46' : '#047857',
                    fontWeight: 700,
                    background: isActive ? '#a7f3d0' : '#dcfce7',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: '1px solid #6ee7b7',
                    transition: 'all 0.2s',
                  })}
                >
                  Thu viện phí & Hóa đơn
                </NavLink>
              )}

              {canAccessPharmacy && (
                <NavLink
                  to="/kho-thuoc"
                  style={({ isActive }) => ({
                    color: isActive ? '#065f46' : '#047857',
                    fontWeight: 700,
                    background: isActive ? '#a7f3d0' : '#dcfce7',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: '1px solid #6ee7b7',
                    transition: 'all 0.2s',
                  })}
                >
                  Nhà thuốc & Kho dược
                </NavLink>
              )}

              {canAccessReception && (
                <NavLink
                  to="/tiep-don-xep-hang"
                  style={({ isActive }) => ({
                    color: isActive ? '#0369a1' : '#0284c7',
                    fontWeight: 700,
                    background: isActive ? '#e0f2fe' : '#f0f9ff',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: '1px solid #bae6fd',
                    transition: 'all 0.2s',
                  })}
                >
                  Tiếp đón & Hàng chờ
                </NavLink>
              )}

              {canAccessAppointments && (
                <NavLink
                  to="/lich-hen"
                  style={({ isActive }) => ({
                    color: isActive ? '#9a3412' : '#ea580c',
                    fontWeight: 700,
                    background: isActive ? '#ffedd5' : '#fff7ed',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: '1px solid #fed7aa',
                    transition: 'all 0.2s',
                  })}
                >
                  Lịch hẹn khám
                </NavLink>
              )}

              {canAccessPatients && (
                <NavLink
                  to="/quan-ly-benh-nhan"
                  style={({ isActive }) => ({
                    color: isActive ? 'var(--primary-dark)' : 'var(--primary)',
                    fontWeight: 700,
                    background: isActive ? '#e0f2f1' : 'var(--soft)',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: '1px solid var(--primary-light)',
                    transition: 'all 0.2s',
                  })}
                >
                  Hồ sơ bệnh nhân
                </NavLink>
              )}

              {canAccessSchedule && (
                <>
                  <NavLink
                    to="/lich-lam-viec"
                    style={({ isActive }) => ({
                      color: isActive ? '#0369a1' : '#0284c7',
                      fontWeight: 700,
                      background: isActive ? '#e0f2fe' : '#f0f9ff',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: '1px solid #bae6fd',
                      transition: 'all 0.2s',
                    })}
                  >
                    Lịch làm việc
                  </NavLink>
                  <NavLink
                    to="/cham-cong"
                    style={({ isActive }) => ({
                      color: isActive ? '#15803d' : '#16a34a',
                      fontWeight: 700,
                      background: isActive ? '#dcfce7' : '#f0fdf4',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: '1px solid #bbf7d0',
                      transition: 'all 0.2s',
                    })}
                  >
                    Chấm công
                  </NavLink>
                </>
              )}

              {canAccessShiftSwap && (
                <NavLink
                  to="/dang-ky-ca"
                  style={({ isActive }) => ({
                    color: isActive ? '#b45309' : '#d97706',
                    fontWeight: 700,
                    background: isActive ? '#fef3c7' : '#fffbeb',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: '1px solid #fde68a',
                    transition: 'all 0.2s',
                  })}
                >
                  Nghỉ / Đổi ca
                </NavLink>
              )}

              {canManage && (
                <>
                  <NavLink
                    to="/quan-ly-nhan-su"
                    style={({ isActive }) => ({
                      color: isActive ? '#4338ca' : '#4f46e5',
                      fontWeight: 700,
                      background: isActive ? '#e0e7ff' : '#eef2ff',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: '1px solid #c7d2fe',
                      transition: 'all 0.2s',
                    })}
                  >
                    Nhân sự & Khoa phòng
                  </NavLink>
                  <NavLink
                    to="/admin/tai-khoan"
                    style={({ isActive }) => ({
                      color: isActive ? '#4338ca' : '#4f46e5',
                      fontWeight: 700,
                      background: isActive ? '#e0e7ff' : '#eef2ff',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: '1px solid #c7d2fe',
                      transition: 'all 0.2s',
                    })}
                  >
                    Tài khoản & Phân quyền
                  </NavLink>
                </>
              )}
            </>
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
            <div style={{ position: 'relative' }}>
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
                    minWidth: '240px',
                    padding: '8px 0',
                    zIndex: 200,
                  }}
                >
                  <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
                    <div style={{ fontWeight: 700 }}>{currentUser.username}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '11.5px' }}>{currentUser.email || 'Tài khoản hệ thống'}</div>
                  </div>

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
                    }}
                  >
                    Đổi mật khẩu
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

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false)
                      onLogout()
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 16px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '13.5px',
                      color: '#e02424',
                      borderTop: '1px solid var(--border)',
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
        <div style={{ background: '#fff', borderTop: '1px solid var(--border)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
            </>
          )}
          {!currentUser ? (
            <Link to="/dang-nhap" onClick={() => setMobileMenuOpen(false)} className="btn btn-outline" style={{ textAlign: 'center' }}>
              Đăng nhập
            </Link>
          ) : (
            <button onClick={() => { setMobileMenuOpen(false); onLogout(); }} className="btn btn-light" style={{ color: '#e02424', textAlign: 'center' }}>
              Đăng xuất
            </button>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 960px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
      `}</style>
    </header>
  )
}
