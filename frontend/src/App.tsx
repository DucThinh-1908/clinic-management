import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Topbar } from './components/Topbar'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { AppointmentModal } from './components/AppointmentModal'
import { ChangePasswordModal } from './components/ChangePasswordModal'
import { HomePage } from './pages/HomePage'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { ServicesPage } from './pages/ServicesPage'
import { LoginPage } from './pages/LoginPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { AdminAccountPortal } from './pages/AdminAccountPortal'
import type { AuthUser } from './types'
import './App.css'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function App() {
  const [modalOpen, setModalOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [selectedSpecialty, setSelectedSpecialty] = useState('')

  // Current logged in user
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('clinic_auth_user')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return null
      }
    }
    return null
  })

  const handleOpenAppointment = (specialty?: string) => {
    setSelectedSpecialty(specialty || '')
    setModalOpen(true)
  }

  const handleCloseAppointment = () => {
    setModalOpen(false)
    setSelectedSpecialty('')
  }

  // Đăng nhập thành công
  const handleLoginSuccess = (user: AuthUser, token: string) => {
    setCurrentUser(user)
    localStorage.setItem('clinic_auth_user', JSON.stringify(user))
    localStorage.setItem('clinic_auth_token', token)
  }

  // Đăng xuất
  const handleLogout = async () => {
    if (currentUser) {
      try {
        await fetch('/api/auth/logout?userId=' + currentUser.id, { method: 'POST' })
      } catch {
        // Continue logout locally
      }
    }
    setCurrentUser(null)
    localStorage.removeItem('clinic_auth_user')
    localStorage.removeItem('clinic_auth_token')
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="app-root">
        <Topbar />
        <Navbar
          currentUser={currentUser}
          onOpenAppointment={() => handleOpenAppointment()}
          onLogout={handleLogout}
          onOpenChangePassword={() => setChangePasswordOpen(true)}
        />

        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  onOpenAppointment={handleOpenAppointment}
                  currentUser={currentUser}
                  onOpenChangePassword={() => setChangePasswordOpen(true)}
                  onLogout={handleLogout}
                />
              }
            />
            <Route
              path="/trang-chu"
              element={
                <HomePage
                  onOpenAppointment={handleOpenAppointment}
                  currentUser={currentUser}
                  onOpenChangePassword={() => setChangePasswordOpen(true)}
                  onLogout={handleLogout}
                />
              }
            />

            {/* Trang Gioi thieu */}
            <Route path="/gioi-thieu" element={<AboutPage onOpenAppointment={() => handleOpenAppointment()} />} />
            <Route path="/about" element={<AboutPage onOpenAppointment={() => handleOpenAppointment()} />} />

            {/* Trang Lien he */}
            <Route path="/lien-he" element={<ContactPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Trang Dich vu & Goi kham */}
            <Route path="/dich-vu" element={<ServicesPage onOpenAppointment={handleOpenAppointment} />} />
            <Route path="/services" element={<ServicesPage onOpenAppointment={handleOpenAppointment} />} />

            {/* Đăng nhập */}
            <Route path="/dang-nhap" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />

            {/* Quên & Đặt lại mật khẩu */}
            <Route path="/quen-mat-khau" element={<ForgotPasswordPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Quản trị tài khoản, phân quyền & nhật ký hồ sơ */}
            <Route path="/admin/tai-khoan" element={<AdminAccountPortal currentUser={currentUser} />} />
            <Route path="/admin/phan-quyen" element={<AdminAccountPortal currentUser={currentUser} />} />
            <Route path="/admin/nhat-ky-ho-so" element={<AdminAccountPortal currentUser={currentUser} />} />
          </Routes>
        </main>

        <Footer />

        <AppointmentModal
          isOpen={modalOpen}
          onClose={handleCloseAppointment}
          initialSpecialty={selectedSpecialty}
          currentUser={currentUser}
        />

        {/* Modal Đổi mật khẩu */}
        <ChangePasswordModal
          isOpen={changePasswordOpen}
          userId={currentUser?.id}
          onClose={() => setChangePasswordOpen(false)}
        />
      </div>
    </BrowserRouter>
  )
}

export default App
