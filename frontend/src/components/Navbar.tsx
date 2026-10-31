import React, { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'

interface NavbarProps {
  onOpenAppointment: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAppointment }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    color: isActive ? 'var(--primary)' : 'var(--ink)',
    fontWeight: isActive ? 750 : 600,
    borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
    padding: '8px 0',
    transition: 'color 0.2s, border-color 0.2s',
  })

  return (
    <header style={{ background: '#fff', boxShadow: '0 3px 18px rgba(17,70,78,.08)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '80px', gap: '20px' }}>
        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 800, color: 'var(--primary-dark)', fontSize: '21px' }}>
          <span style={{ width: '45px', height: '45px', display: 'grid', placeItems: 'center', borderRadius: '14px', background: 'var(--primary)', color: '#fff', fontSize: '28px', fontWeight: 700 }}>
            ✚
          </span>
          <span>
            CarePlus Clinic
            <small style={{ display: 'block', fontSize: '10px', color: 'var(--muted)', fontWeight: 600, letterSpacing: '1.4px' }}>
              PHÒNG KHÁM ĐA KHOA
            </small>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '26px', fontSize: '14.5px' }} className="desktop-nav">
          <NavLink to="/" style={navLinkStyle}>Trang chủ</NavLink>
          <NavLink to="/gioi-thieu" style={navLinkStyle}>Giới thiệu</NavLink>
          <NavLink to="/dich-vu" style={navLinkStyle}>Dịch vụ & Gói khám</NavLink>
          <NavLink to="/lien-he" style={navLinkStyle}>Liên hệ</NavLink>
        </nav>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-primary" onClick={onOpenAppointment}>
            Đặt lịch khám
          </button>

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
              padding: '8px 12px',
              fontSize: '20px',
              cursor: 'pointer',
            }}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div style={{ background: '#fff', borderTop: '1px solid var(--border)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ padding: '8px 0', fontWeight: 650 }}>Trang chủ</Link>
          <Link to="/gioi-thieu" onClick={() => setMobileMenuOpen(false)} style={{ padding: '8px 0', fontWeight: 650 }}>Giới thiệu</Link>
          <Link to="/dich-vu" onClick={() => setMobileMenuOpen(false)} style={{ padding: '8px 0', fontWeight: 650 }}>Dịch vụ & Gói khám</Link>
          <Link to="/lien-he" onClick={() => setMobileMenuOpen(false)} style={{ padding: '8px 0', fontWeight: 650 }}>Liên hệ</Link>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} onClick={() => { setMobileMenuOpen(false); onOpenAppointment(); }}>
            Đặt lịch khám ngay
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 860px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
      `}</style>
    </header>
  )
}
