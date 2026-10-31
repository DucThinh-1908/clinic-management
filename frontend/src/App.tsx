import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Topbar } from './components/Topbar'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { AppointmentModal } from './components/AppointmentModal'
import { HomePage } from './pages/HomePage'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { ServicesPage } from './pages/ServicesPage'
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
  const [selectedSpecialty, setSelectedSpecialty] = useState('')

  const handleOpenAppointment = (specialty?: string) => {
    setSelectedSpecialty(specialty || '')
    setModalOpen(true)
  }

  const handleCloseAppointment = () => {
    setModalOpen(false)
    setSelectedSpecialty('')
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="app-root">
        <Topbar />
        <Navbar onOpenAppointment={() => handleOpenAppointment()} />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage onOpenAppointment={handleOpenAppointment} />} />
            <Route path="/trang-chu" element={<HomePage onOpenAppointment={handleOpenAppointment} />} />

            {/* Trang Giới thiệu */}
            <Route path="/gioi-thieu" element={<AboutPage onOpenAppointment={() => handleOpenAppointment()} />} />
            <Route path="/about" element={<AboutPage onOpenAppointment={() => handleOpenAppointment()} />} />

            {/* Trang Liên hệ */}
            <Route path="/lien-he" element={<ContactPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Trang Dịch vụ & Gói khám */}
            <Route path="/dich-vu" element={<ServicesPage onOpenAppointment={handleOpenAppointment} />} />
            <Route path="/services" element={<ServicesPage onOpenAppointment={handleOpenAppointment} />} />
          </Routes>
        </main>

        <Footer />

        <AppointmentModal
          isOpen={modalOpen}
          onClose={handleCloseAppointment}
          initialSpecialty={selectedSpecialty}
        />
      </div>
    </BrowserRouter>
  )
}

export default App
