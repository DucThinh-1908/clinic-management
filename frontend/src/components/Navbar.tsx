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

  const canManage = Boolean(
    currentUser &&
      currentUser.roles &&
      currentUser.roles.some((r) => r.toLowerCase() === 'admin' || r.toLowerCase() === 'manager')
  )

  const isStaff = Boolean(
    currentUser &&
      currentUser.roles &&
      currentUser.roles.some((r) =>
        ['receptionist', 'doctor', 'nurse', 'manager', 'admin', 'technician', 'pharmacist', 'cashier'].includes(r.toLowerCase())
      )
  )

  const isPatient = Boolean(
    currentUser &&
      currentUser.roles &&
      currentUser.roles.some((r) => r.toLowerCase() === 'patient') &&
      !isStaff
  )

  const brandDestination = isStaff ? (canManage ? '/admin/tai-khoan' : '/quan-ly-benh-nhan') : '/'

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
        <nav style={{ display: 'flex', alignItems: 'center', gap: '22px', fontSize: '14.5px' }} className="desktop-nav">
          {!isStaff ? (
            <>
              <NavLink to="/" style={navLinkStyle}>Trang chủ</NavLink>
              <NavLink to="/gioi-thieu" style={navLinkStyle}>Giới thiệu</NavLink>
              <NavLink to="/dich-vu" style={navLinkStyle}>Dịch vụ & Gói khám</NavLink>
              <NavLink to="/lien-he" style={navLinkStyle}>Liên hệ</NavLink>
              {isPatient && (
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
              )}
            </>
          ) : (
            <>
              <NavLink
                to="/quan-ly-benh-nhan"
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
                Quản lý hồ sơ bệnh nhân
              </NavLink>
              {canManage && (
                <>
                  <NavLink
                    to="/admin/tai-khoan"
                    style={({ isActive }) => ({
                      color: isActive ? '#4338ca' : '#4f46e5',
                      fontWeight: 700,
                      background: isActive ? '#e0e7ff' : '#eef2ff',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: '1px solid #c7d2fe',
                      transition: 'all 0.2s',
                    })}
                  >
                    Quản lý tài khoản
                  </NavLink>
                  <NavLink
                    to="/admin/phan-quyen"
                    style={({ isActive }) => ({
                      color: isActive ? '#4338ca' : '#4f46e5',
                      fontWeight: 700,
                      background: isActive ? '#e0e7ff' : '#eef2ff',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: '1px solid #c7d2fe',
                      transition: 'all 0.2s',
                    })}
                  >
                    Phân quyền
                  </NavLink>
                  <NavLink
                    to="/admin/nhat-ky-ho-so"
                    style={({ isActive }) => ({
                      color: isActive ? '#4338ca' : '#4f46e5',
                      fontWeight: 700,
                      background: isActive ? '#e0e7ff' : '#eef2ff',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: '1px solid #c7d2fe',
                      transition: 'all 0.2s',
                    })}
                  >
                    Nhật ký hồ sơ
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

                  {isPatient && (
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
                  )}

                  {canManage && (
                    <>
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
                <Link to="/ho-so-benh-nhan" onClick={() => setMobileMenuOpen(false)} style={{ padding: '6px 0', fontWeight: 650, color: 'var(--primary)' }}>
                  Hồ sơ bệnh nhân
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/quan-ly-benh-nhan" onClick={() => setMobileMenuOpen(false)} style={{ padding: '6px 0', fontWeight: 650, color: 'var(--primary)' }}>
                Quản lý hồ sơ bệnh nhân
              </Link>
              {canManage && (
                <>
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
