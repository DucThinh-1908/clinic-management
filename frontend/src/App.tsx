import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
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
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { AdminAccountPortal } from './pages/AdminAccountPortal'
import { PatientManagementPage } from './pages/PatientManagementPage'
import { StaffSchedulingPage } from './pages/StaffSchedulingPage'
import { AppointmentManagementPage } from './pages/AppointmentManagementPage'
import { ReceptionQueuePage } from './pages/ReceptionQueuePage'
import { MedicalExaminationPage } from './pages/MedicalExaminationPage'
import { PharmacyInventoryPage } from './pages/PharmacyInventoryPage'
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

  const isStaff = Boolean(
    currentUser &&
      currentUser.roles &&
      currentUser.roles.some((r) =>
        ['admin', 'manager', 'receptionist', 'doctor', 'nurse', 'technician', 'pharmacist', 'cashier'].includes(r.toLowerCase())
      )
  )

  const getDefaultStaffPath = (user: AuthUser | null) => {
    if (!user || !user.roles) return '/'
    const roles = user.roles.map((r) => r.toLowerCase())
    if (roles.includes('admin') || roles.includes('manager')) return '/admin/tai-khoan'
    if (roles.includes('pharmacist')) return '/kho-thuoc'
    if (roles.includes('doctor') || roles.includes('nurse')) return '/kham-benh'
    if (roles.includes('receptionist')) return '/tiep-don'
    return '/quan-ly-benh-nhan'
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="app-root">
        {!isStaff && <Topbar />}
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
                isStaff ? (
                  <Navigate to={getDefaultStaffPath(currentUser)} replace />
                ) : (
                  <HomePage
                    onOpenAppointment={handleOpenAppointment}
                    currentUser={currentUser}
                  />
                )
              }
            />
            <Route
              path="/trang-chu"
              element={
                isStaff ? (
                  <Navigate to={getDefaultStaffPath(currentUser)} replace />
                ) : (
                  <HomePage
                    onOpenAppointment={handleOpenAppointment}
                    currentUser={currentUser}
                  />
                )
              }
            />

            {/* Trang Gioi thieu */}
            <Route
              path="/gioi-thieu"
              element={
                isStaff ? (
                  <Navigate to={getDefaultStaffPath(currentUser)} replace />
                ) : (
                  <AboutPage onOpenAppointment={() => handleOpenAppointment()} />
                )
              }
            />
            <Route
              path="/about"
              element={
                isStaff ? (
                  <Navigate to={getDefaultStaffPath(currentUser)} replace />
                ) : (
                  <AboutPage onOpenAppointment={() => handleOpenAppointment()} />
                )
              }
            />

            {/* Trang Lien he */}
            <Route
              path="/lien-he"
              element={
                isStaff ? (
                  <Navigate to={getDefaultStaffPath(currentUser)} replace />
                ) : (
                  <ContactPage />
                )
              }
            />
            <Route
              path="/contact"
              element={
                isStaff ? (
                  <Navigate to={getDefaultStaffPath(currentUser)} replace />
                ) : (
                  <ContactPage />
                )
              }
            />

            {/* Trang Dich vu & Goi kham */}
            <Route
              path="/dich-vu"
              element={
                isStaff ? (
                  <Navigate to={getDefaultStaffPath(currentUser)} replace />
                ) : (
                  <ServicesPage onOpenAppointment={handleOpenAppointment} />
                )
              }
            />
            <Route
              path="/services"
              element={
                isStaff ? (
                  <Navigate to={getDefaultStaffPath(currentUser)} replace />
                ) : (
                  <ServicesPage onOpenAppointment={handleOpenAppointment} />
                )
              }
            />

            {/* Đăng nhập */}
            <Route path="/dang-nhap" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />

            {/* Đăng ký */}
            <Route path="/dang-ky" element={<RegisterPage onRegisterSuccess={handleLoginSuccess} />} />
            <Route path="/register" element={<RegisterPage onRegisterSuccess={handleLoginSuccess} />} />

            {/* Quên & Đặt lại mật khẩu */}
            <Route path="/quen-mat-khau" element={<ForgotPasswordPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Quản lý hồ sơ bệnh nhân (Lễ tân, Bác sĩ, Quản lý, Admin & Bệnh nhân) */}
            <Route path="/quan-ly-benh-nhan" element={<PatientManagementPage currentUser={currentUser} />} />
            <Route path="/ho-so-benh-nhan" element={<PatientManagementPage currentUser={currentUser} />} />
            <Route path="/patient-portal" element={<PatientManagementPage currentUser={currentUser} />} />

            {/* Quản trị tài khoản, phân quyền & nhật ký hồ sơ */}
            <Route path="/admin/tai-khoan" element={<AdminAccountPortal currentUser={currentUser} />} />
            <Route path="/admin/phan-quyen" element={<AdminAccountPortal currentUser={currentUser} />} />
            <Route path="/admin/nhat-ky-ho-so" element={<AdminAccountPortal currentUser={currentUser} />} />

            {/* Quản lý nhân sự, chuyên khoa, lịch làm việc, đổi ca & chấm công (Module 3.3) */}
            <Route path="/quan-ly-nhan-su" element={<StaffSchedulingPage currentUser={currentUser} />} />
            <Route path="/quan-ly-chuyen-khoa" element={<StaffSchedulingPage currentUser={currentUser} />} />
            <Route path="/lich-lam-viec" element={<StaffSchedulingPage currentUser={currentUser} />} />
            <Route path="/dang-ky-ca" element={<StaffSchedulingPage currentUser={currentUser} />} />
            <Route path="/cham-cong" element={<StaffSchedulingPage currentUser={currentUser} />} />

            {/* Quản lý Đặt lịch hẹn khám bệnh (Module 3.4) */}
            <Route path="/lich-hen" element={<AppointmentManagementPage currentUser={currentUser} />} />
            <Route path="/dat-lich" element={<AppointmentManagementPage currentUser={currentUser} />} />
            <Route path="/quan-ly-lich-hen" element={<AppointmentManagementPage currentUser={currentUser} />} />

            {/* Tiếp đón và xếp hàng khám bệnh (Module 3.5) */}
            <Route path="/tiep-don" element={<ReceptionQueuePage currentUser={currentUser} />} />
            <Route path="/hang-cho" element={<ReceptionQueuePage currentUser={currentUser} />} />
            <Route path="/tiep-don-xep-hang" element={<ReceptionQueuePage currentUser={currentUser} />} />
            <Route path="/man-hinh-goi-so" element={<ReceptionQueuePage currentUser={currentUser} />} />

            {/* Khám bệnh lâm sàng & Cận lâm sàng (Module 3.6 - 8 Use Cases) */}
            <Route path="/kham-benh" element={<MedicalExaminationPage currentUser={currentUser} />} />
            <Route path="/phong-kham-bac-si" element={<MedicalExaminationPage currentUser={currentUser} />} />
            <Route path="/phong-kham" element={<MedicalExaminationPage currentUser={currentUser} />} />
            <Route path="/ghi-nhan-sinh-hieu" element={<MedicalExaminationPage currentUser={currentUser} />} />

            {/* Kê đơn & Kho thuốc Dược sĩ (Module 3.8 - 10 Use Cases) */}
            <Route path="/kho-thuoc" element={<PharmacyInventoryPage currentUser={currentUser} />} />
            <Route path="/duoc-kho-thuoc" element={<PharmacyInventoryPage currentUser={currentUser} />} />
            <Route path="/cap-phat-thuoc" element={<PharmacyInventoryPage currentUser={currentUser} />} />
            <Route path="/nha-thuoc" element={<PharmacyInventoryPage currentUser={currentUser} />} />
            <Route path="/ke-don-thuoc" element={<PharmacyInventoryPage currentUser={currentUser} />} />
          </Routes>
        </main>

        {!isStaff ? (
          <Footer />
        ) : (
          <footer
            style={{
              textAlign: 'center',
              padding: '16px 20px',
              fontSize: '13px',
              color: '#6b7280',
              borderTop: '1px solid var(--border)',
              background: '#ffffff',
            }}
          >
            Phần mềm Quản lý Phòng khám Đa khoa CarePlus Clinic &bull; Hệ thống vận hành nội bộ
          </footer>
        )}

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
