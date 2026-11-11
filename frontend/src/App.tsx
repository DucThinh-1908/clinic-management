import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { Topbar } from './components/Topbar'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { AppointmentModal } from './components/AppointmentModal'
import { ChangePasswordModal } from './components/ChangePasswordModal'
import { UserProfileModal } from './components/UserProfileModal'
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
import { BillingPaymentPage } from './pages/BillingPaymentPage'
import { ReportsAnalyticsPage } from './pages/ReportsAnalyticsPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import type { AuthUser } from './types'
import keycloak from './keycloak'
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
  const [profileOpen, setProfileOpen] = useState(false)
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

  // Tự động kiểm tra và đồng bộ lại phân quyền mới nhất từ Keycloak/MySQL khi người dùng tải lại trang
  useEffect(() => {
    if (!currentUser || !currentUser.id) return

    // Nếu không phải trên trang /dang-nhap thì khởi tạo check-sso ngầm để lấy token mới nhất từ Keycloak
    if (!window.location.pathname.includes('/dang-nhap') && !window.location.pathname.includes('/login')) {
      keycloak
        .init({
          onLoad: 'check-sso',
          pkceMethod: 'S256',
          checkLoginIframe: false,
        })
        .then(async (authenticated) => {
          if (authenticated && keycloak.tokenParsed) {
            await keycloak.updateToken(9999).catch(() => {})
            const parsed = keycloak.tokenParsed as any
            const rawRoles: string[] = parsed.realm_access?.roles || []
            const filteredRoles = rawRoles.filter(
              (r: string) => !['offline_access', 'uma_authorization', 'default-roles-clinic-realm'].includes(r)
            )
            const keycloakPermissions: string[] = Array.isArray(parsed.permissions)
              ? parsed.permissions
              : (parsed.resource_access?.['clinic-frontend']?.roles || [])

            const res = await fetch('/api/auth/sync-keycloak', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username: parsed.preferred_username || currentUser.username,
                email: parsed.email || currentUser.email || '',
                fullName: parsed.name || '',
                roles: filteredRoles,
                permissions: keycloakPermissions,
              }),
            })
            if (res.ok) {
              const data = await res.json()
              if (data.success && data.user) {
                setCurrentUser(data.user)
                localStorage.setItem('clinic_auth_user', JSON.stringify(data.user))
                if (keycloak.token) {
                  localStorage.setItem('clinic_auth_token', keycloak.token)
                }
              }
            }
          }
        })
        .catch(() => {})
    }
  }, [])

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
    if (keycloak.authenticated) {
      keycloak.logout({ redirectUri: window.location.origin + '/' })
    }
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
    const perms = (user.permissions || []).map((p) => p.toUpperCase())
    const isSuperAdmin = roles.includes('admin') || roles.includes('manager')

    if (isSuperAdmin) return '/admin/tai-khoan'

    // Ưu tiên trang nghiệp vụ chính của vai trò NẾU vai trò đó vẫn còn giữ quyền trên Keycloak
    if (roles.includes('cashier') && perms.includes('INVOICE_CREATE')) return '/thu-ngan'
    if (roles.includes('pharmacist') && perms.includes('DISPENSATION_MANAGE')) return '/kho-thuoc'
    if ((roles.includes('doctor') || roles.includes('nurse')) && (perms.includes('MEDICAL_RECORD_WRITE') || perms.includes('PRESCRIPTION_CREATE'))) return '/kham-benh'
    if (roles.includes('receptionist') && perms.includes('APPOINTMENT_MANAGE')) return '/tiep-don'

    // Nếu quyền mặc định đã bị gỡ trên Keycloak, chuyển đến chức năng đầu tiên mà tài khoản ĐƯỢC cấp quyền
    if (perms.includes('USER_VIEW') || perms.includes('USER_CREATE') || perms.includes('USER_LOCK')) return '/admin/tai-khoan'
    if (perms.includes('ROLE_ASSIGN') || perms.includes('ROLE_MANAGE')) return '/admin/phan-quyen'
    if (perms.includes('RECORD_ACCESS_VIEW')) return '/admin/nhat-ky-ho-so'
    if (perms.includes('DISPENSATION_MANAGE')) return '/kho-thuoc'
    if (perms.includes('MEDICAL_RECORD_WRITE') || perms.includes('PRESCRIPTION_CREATE')) return '/kham-benh'
    if (perms.includes('INVOICE_CREATE')) return '/thu-ngan'
    if (perms.includes('APPOINTMENT_MANAGE')) return '/tiep-don'
    if (perms.includes('MEDICAL_RECORD_VIEW')) return '/quan-ly-benh-nhan'

    return '/lich-lam-viec'
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
          onOpenProfile={() => setProfileOpen(true)}
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

            {/* Quản lý hồ sơ bệnh nhân */}
            <Route
              path="/quan-ly-benh-nhan"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['doctor', 'nurse', 'receptionist', 'cashier', 'admin', 'manager', 'patient']} allowedPermissions={['MEDICAL_RECORD_VIEW', 'MEDICAL_RECORD_WRITE']}>
                  <PatientManagementPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ho-so-benh-nhan"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['doctor', 'nurse', 'receptionist', 'cashier', 'admin', 'manager', 'patient']} allowedPermissions={['MEDICAL_RECORD_VIEW', 'MEDICAL_RECORD_WRITE']}>
                  <PatientManagementPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient-portal"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['doctor', 'nurse', 'receptionist', 'cashier', 'admin', 'manager', 'patient']} allowedPermissions={['MEDICAL_RECORD_VIEW', 'MEDICAL_RECORD_WRITE']}>
                  <PatientManagementPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />

            {/* Quản trị tài khoản, phân quyền & nhật ký hồ sơ */}
            <Route
              path="/admin/tai-khoan"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['admin', 'manager']} allowedPermissions={['USER_VIEW', 'USER_CREATE', 'USER_LOCK', 'ROLE_ASSIGN', 'ROLE_MANAGE', 'RECORD_ACCESS_VIEW']}>
                  <AdminAccountPortal currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/phan-quyen"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['admin', 'manager']} allowedPermissions={['ROLE_ASSIGN', 'ROLE_MANAGE']}>
                  <AdminAccountPortal currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/nhat-ky-ho-so"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['admin', 'manager']} allowedPermissions={['RECORD_ACCESS_VIEW']}>
                  <AdminAccountPortal currentUser={currentUser} />
                </ProtectedRoute>
              }
            />

            {/* Quản lý nhân sự & Chuyên khoa (Chỉ Quản trị viên & Quản lý) */}
            <Route
              path="/quan-ly-nhan-su"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['admin', 'manager']}>
                  <StaffSchedulingPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quan-ly-chuyen-khoa"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['admin', 'manager']}>
                  <StaffSchedulingPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />

            {/* Lịch làm việc & Chấm công (Dành riêng cho toàn bộ nhân sự nội bộ) */}
            <Route
              path="/lich-lam-viec"
              element={
                <ProtectedRoute currentUser={currentUser} requireStaff={true}>
                  <StaffSchedulingPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cham-cong"
              element={
                <ProtectedRoute currentUser={currentUser} requireStaff={true}>
                  <StaffSchedulingPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dang-ky-ca"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['doctor', 'nurse', 'technician', 'pharmacist', 'receptionist', 'cashier', 'admin', 'manager']}>
                  <StaffSchedulingPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />

            {/* Quản lý Đặt lịch hẹn khám bệnh */}
            <Route
              path="/lich-hen"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['receptionist', 'doctor', 'nurse', 'admin', 'manager', 'patient']} allowedPermissions={['APPOINTMENT_MANAGE']}>
                  <AppointmentManagementPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dat-lich"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['receptionist', 'doctor', 'nurse', 'admin', 'manager', 'patient']} allowedPermissions={['APPOINTMENT_MANAGE']}>
                  <AppointmentManagementPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quan-ly-lich-hen"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['receptionist', 'doctor', 'nurse', 'admin', 'manager', 'patient']} allowedPermissions={['APPOINTMENT_MANAGE']}>
                  <AppointmentManagementPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />

            {/* Tiếp đón và xếp hàng khám bệnh */}
            <Route
              path="/tiep-don"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['receptionist', 'nurse', 'cashier', 'doctor', 'admin', 'manager']} allowedPermissions={['APPOINTMENT_MANAGE']}>
                  <ReceptionQueuePage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hang-cho"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['receptionist', 'nurse', 'cashier', 'doctor', 'admin', 'manager']} allowedPermissions={['APPOINTMENT_MANAGE']}>
                  <ReceptionQueuePage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tiep-don-xep-hang"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['receptionist', 'nurse', 'cashier', 'doctor', 'admin', 'manager']} allowedPermissions={['APPOINTMENT_MANAGE']}>
                  <ReceptionQueuePage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/man-hinh-goi-so"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['receptionist', 'nurse', 'cashier', 'doctor', 'admin', 'manager']} allowedPermissions={['APPOINTMENT_MANAGE']}>
                  <ReceptionQueuePage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />

            {/* Khám bệnh lâm sàng & Cận lâm sàng */}
            <Route
              path="/kham-benh"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['doctor', 'nurse', 'technician', 'admin', 'manager']} allowedPermissions={['MEDICAL_RECORD_WRITE', 'PRESCRIPTION_CREATE']}>
                  <MedicalExaminationPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/phong-kham-bac-si"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['doctor', 'nurse', 'technician', 'admin', 'manager']} allowedPermissions={['MEDICAL_RECORD_WRITE', 'PRESCRIPTION_CREATE']}>
                  <MedicalExaminationPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/phong-kham"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['doctor', 'nurse', 'technician', 'admin', 'manager']} allowedPermissions={['MEDICAL_RECORD_WRITE', 'PRESCRIPTION_CREATE']}>
                  <MedicalExaminationPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ghi-nhan-sinh-hieu"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['doctor', 'nurse', 'technician', 'admin', 'manager']} allowedPermissions={['MEDICAL_RECORD_WRITE', 'PRESCRIPTION_CREATE']}>
                  <MedicalExaminationPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />

            {/* Kê đơn & Kho thuốc Dược sĩ */}
            <Route
              path="/kho-thuoc"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['pharmacist', 'admin', 'manager']} allowedPermissions={['DISPENSATION_MANAGE']}>
                  <PharmacyInventoryPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/duoc-kho-thuoc"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['pharmacist', 'admin', 'manager']} allowedPermissions={['DISPENSATION_MANAGE']}>
                  <PharmacyInventoryPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cap-phat-thuoc"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['pharmacist', 'admin', 'manager']} allowedPermissions={['DISPENSATION_MANAGE']}>
                  <PharmacyInventoryPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nha-thuoc"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['pharmacist', 'admin', 'manager']} allowedPermissions={['DISPENSATION_MANAGE']}>
                  <PharmacyInventoryPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ke-don-thuoc"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['pharmacist', 'admin', 'manager']} allowedPermissions={['DISPENSATION_MANAGE', 'PRESCRIPTION_CREATE']}>
                  <PharmacyInventoryPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />

            {/* Phân hệ 3.9: Thanh toán và Viện phí */}
            <Route
              path="/thu-ngan"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['cashier', 'admin', 'manager']} allowedPermissions={['INVOICE_CREATE']}>
                  <BillingPaymentPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vien-phi"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['cashier', 'admin', 'manager']} allowedPermissions={['INVOICE_CREATE']}>
                  <BillingPaymentPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/thanh-toan"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['cashier', 'admin', 'manager']} allowedPermissions={['INVOICE_CREATE']}>
                  <BillingPaymentPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hoa-don"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['cashier', 'admin', 'manager']} allowedPermissions={['INVOICE_CREATE']}>
                  <BillingPaymentPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bang-gia-dich-vu"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['cashier', 'admin', 'manager']} allowedPermissions={['INVOICE_CREATE']}>
                  <BillingPaymentPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />

            {/* Phân hệ 3.10: Báo cáo & Thống kê */}
            <Route
              path="/bao-cao"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['admin', 'manager', 'doctor', 'pharmacist']} allowedPermissions={['MEDICAL_RECORD_WRITE', 'DISPENSATION_MANAGE']}>
                  <ReportsAnalyticsPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/thong-ke"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['admin', 'manager', 'doctor', 'pharmacist']} allowedPermissions={['MEDICAL_RECORD_WRITE', 'DISPENSATION_MANAGE']}>
                  <ReportsAnalyticsPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard-quan-ly"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['admin', 'manager']}>
                  <ReportsAnalyticsPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bao-cao-doanh-thu"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['admin', 'manager']}>
                  <ReportsAnalyticsPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bao-cao-duoc"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['admin', 'manager', 'pharmacist']} allowedPermissions={['DISPENSATION_MANAGE']}>
                  <ReportsAnalyticsPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
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

        {/* Modal Thông tin cá nhân */}
        <UserProfileModal
          isOpen={profileOpen}
          onClose={() => setProfileOpen(false)}
          currentUser={currentUser}
          onOpenChangePassword={() => setChangePasswordOpen(true)}
        />
      </div>
    </BrowserRouter>
  )
}

export default App
