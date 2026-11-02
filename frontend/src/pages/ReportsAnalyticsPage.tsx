import React, { useState, useEffect, useCallback } from 'react'
import type {
  RevenueReport,
  DoctorServiceRevenue,
  VisitReport,
  CommonDiseaseReport,
  MedicineStockReport,
  AppointmentReport,
  RealtimeDashboard
} from '../types'

interface ReportsAnalyticsPageProps {
  currentUser?: {
    username?: string
    role?: string
    roles?: string[]
    name?: string
    id?: number
  } | null
}

export const ReportsAnalyticsPage: React.FC<ReportsAnalyticsPageProps> = ({ currentUser }) => {
  // Quyền hạn vai trò
  const roles = currentUser?.roles || (currentUser?.role ? [currentUser.role] : [])
  const isManager = roles.some(r => ['ROLE_MANAGER', 'ROLE_ADMIN', 'manager', 'admin'].includes(r))
  const isDoctor = roles.some(r => ['ROLE_DOCTOR', 'doctor'].includes(r))
  const isPharmacist = roles.some(r => ['ROLE_PHARMACIST', 'pharmacist'].includes(r))

  // Tab mặc định tùy theo vai trò
  const defaultTab = isManager ? 'realtime' : isDoctor ? 'diseases' : isPharmacist ? 'medicines' : 'realtime'
  const [activeTab, setActiveTab] = useState<string>(defaultTab)

  // Khoảng thời gian lọc
  const todayStr = new Date().toISOString().slice(0, 10)
  const past30DaysStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const [startDate, setStartDate] = useState<string>(past30DaysStr)
  const [endDate, setEndDate] = useState<string>(todayStr)
  const [quickFilter, setQuickFilter] = useState<'today' | '7days' | '30days' | 'thisMonth' | 'thisYear' | 'custom'>('30days')

  // Trạng thái dữ liệu từng phân hệ
  const [realtimeData, setRealtimeData] = useState<RealtimeDashboard | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueReport | null>(null)
  const [doctorServiceData, setDoctorServiceData] = useState<DoctorServiceRevenue | null>(null)
  const [visitData, setVisitData] = useState<VisitReport | null>(null)
  const [diseaseData, setDiseaseData] = useState<CommonDiseaseReport | null>(null)
  const [medicineData, setMedicineData] = useState<MedicineStockReport | null>(null)
  const [appointmentData, setAppointmentData] = useState<AppointmentReport | null>(null)

  const [loading, setLoading] = useState<boolean>(false)
  const [alertMessage, setAlertMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)

  const showAlert = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setAlertMessage({ text, type })
    setTimeout(() => setAlertMessage(null), 4000)
  }

  // Cài đặt khoảng ngày nhanh
  const handleQuickFilter = (type: 'today' | '7days' | '30days' | 'thisMonth' | 'thisYear') => {
    setQuickFilter(type)
    const now = new Date()
    const end = now.toISOString().slice(0, 10)
    let start = end

    if (type === 'today') {
      start = end
    } else if (type === '7days') {
      start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    } else if (type === '30days') {
      start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    } else if (type === 'thisMonth') {
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    } else if (type === 'thisYear') {
      start = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10)
    }

    setStartDate(start)
    setEndDate(end)
  }

  // Tải dữ liệu theo tab đang chọn
  const loadActiveTabData = useCallback(async () => {
    setLoading(true)
    try {
      if (activeTab === 'realtime') {
        const res = await fetch('/api/reports/realtime-dashboard')
        if (res.ok) {
          const data = await res.json()
          setRealtimeData(data)
        }
      } else if (activeTab === 'revenue') {
        const res = await fetch(`/api/reports/revenue?startDate=${startDate}&endDate=${endDate}&period=CUSTOM`)
        if (res.ok) {
          const data = await res.json()
          setRevenueData(data)
        }
      } else if (activeTab === 'doctor_service') {
        const res = await fetch(`/api/reports/doctor-service-revenue?startDate=${startDate}&endDate=${endDate}`)
        if (res.ok) {
          const data = await res.json()
          setDoctorServiceData(data)
        }
      } else if (activeTab === 'visits') {
        const res = await fetch(`/api/reports/visits?startDate=${startDate}&endDate=${endDate}`)
        if (res.ok) {
          const data = await res.json()
          setVisitData(data)
        }
      } else if (activeTab === 'diseases') {
        const res = await fetch(`/api/reports/common-diseases?startDate=${startDate}&endDate=${endDate}`)
        if (res.ok) {
          const data = await res.json()
          setDiseaseData(data)
        }
      } else if (activeTab === 'medicines') {
        const res = await fetch(`/api/reports/medicine-stock?startDate=${startDate}&endDate=${endDate}`)
        if (res.ok) {
          const data = await res.json()
          setMedicineData(data)
        }
      } else if (activeTab === 'appointments') {
        const res = await fetch(`/api/reports/appointments?startDate=${startDate}&endDate=${endDate}`)
        if (res.ok) {
          const data = await res.json()
          setAppointmentData(data)
        }
      }
    } catch {
      showAlert('Lỗi kết nối khi tải dữ liệu báo cáo', 'error')
    } finally {
      setLoading(false)
    }
  }, [activeTab, startDate, endDate])

  useEffect(() => {
    loadActiveTabData()
  }, [loadActiveTabData])

  // Xuất file báo cáo Excel (CSV UTF-8 BOM)
  const handleExportCsv = async () => {
    try {
      let reportType = 'REVENUE'
      if (activeTab === 'doctor_service') reportType = 'DOCTOR_SERVICE'
      else if (activeTab === 'visits') reportType = 'VISITS'
      else if (activeTab === 'diseases') reportType = 'DISEASES'
      else if (activeTab === 'medicines') reportType = 'MEDICINES'
      else if (activeTab === 'appointments') reportType = 'APPOINTMENTS'
      else if (activeTab === 'realtime') reportType = 'REALTIME'

      const url = `/api/reports/export?reportType=${reportType}&startDate=${startDate}&endDate=${endDate}`
      const res = await fetch(url)
      if (!res.ok) {
        showAlert('Xuất báo cáo thất bại', 'error')
        return
      }
      const blob = await res.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `BaoCao_${reportType}_${startDate}_${endDate}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      showAlert('Tải file báo cáo thành công', 'success')
    } catch {
      showAlert('Lỗi khi tải file báo cáo', 'error')
    }
  }

  // In báo cáo
  const handlePrint = () => {
    window.print()
  }

  // Định dạng số tiền VND
  const formatCurrency = (val: number | undefined | null) => {
    if (val === undefined || val === null) return '0 đ'
    return Number(val).toLocaleString('vi-VN') + ' đ'
  }

  // Định dạng số nguyên
  const formatNumber = (val: number | undefined | null) => {
    if (val === undefined || val === null) return '0'
    return Number(val).toLocaleString('vi-VN')
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 16px', color: '#1e293b' }}>
      {/* Alert toast */}
      {alertMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '14px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            fontWeight: 600,
            fontSize: '14px',
            backgroundColor: alertMessage.type === 'success' ? '#ecfdf5' : alertMessage.type === 'error' ? '#fef2f2' : '#eff6ff',
            color: alertMessage.type === 'success' ? '#065f46' : alertMessage.type === 'error' ? '#991b1b' : '#1e40af',
            border: `1px solid ${alertMessage.type === 'success' ? '#a7f3d0' : alertMessage.type === 'error' ? '#fecaca' : '#bfdbfe'}`
          }}
        >
          {alertMessage.text}
        </div>
      )}

      {/* Header Phân hệ */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '16px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 6px 0', color: '#0f172a' }}>
            Báo cáo và Thống kê Phòng khám
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
            Hệ thống phân tích doanh thu, lượt khám, dịch vụ kỹ thuật, bệnh lý, dược phẩm và lịch hẹn
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={loadActiveTabData}
            disabled={loading}
            style={{
              padding: '9px 16px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              color: '#334155'
            }}
          >
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
          {isManager && (
            <button
              onClick={handleExportCsv}
              style={{
                padding: '9px 16px',
                backgroundColor: '#10b981',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                color: '#ffffff'
              }}
            >
              Xuất dữ liệu Excel (CSV)
            </button>
          )}
          <button
            onClick={handlePrint}
            style={{
              padding: '9px 16px',
              backgroundColor: '#0284c7',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              color: '#ffffff'
            }}
          >
            In báo cáo
          </button>
        </div>
      </div>

      {/* Header bản in (Chỉ hiển thị khi in ấn) */}
      <div
        className="print-only"
        style={{
          display: 'none',
          marginBottom: '24px',
          borderBottom: '2px solid #0f172a',
          paddingBottom: '12px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>PHÒNG KHÁM ĐA KHOA CAREPLUS</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#475569' }}>
              Địa chỉ: 123 Đường Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh | Hotline: 1900 1234
            </p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '12px', color: '#475569' }}>
            <p style={{ margin: 0 }}>Ngày in: {new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN')}</p>
            <p style={{ margin: '4px 0 0 0' }}>Khoảng thời gian: {startDate} đến {endDate}</p>
          </div>
        </div>
      </div>

      {/* Thanh điều hướng Tabs */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          gap: '6px',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '20px',
          overflowX: 'auto',
          paddingBottom: '2px'
        }}
      >
        {isManager && (
          <button
            onClick={() => setActiveTab('realtime')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'realtime' ? '3px solid #0284c7' : '3px solid transparent',
              backgroundColor: 'transparent',
              fontWeight: activeTab === 'realtime' ? 700 : 500,
              color: activeTab === 'realtime' ? '#0284c7' : '#64748b',
              fontSize: '14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Thời gian thực
          </button>
        )}
        {isManager && (
          <button
            onClick={() => setActiveTab('revenue')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'revenue' ? '3px solid #0284c7' : '3px solid transparent',
              backgroundColor: 'transparent',
              fontWeight: activeTab === 'revenue' ? 700 : 500,
              color: activeTab === 'revenue' ? '#0284c7' : '#64748b',
              fontSize: '14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Báo cáo Doanh thu
          </button>
        )}
        {isManager && (
          <button
            onClick={() => setActiveTab('doctor_service')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'doctor_service' ? '3px solid #0284c7' : '3px solid transparent',
              backgroundColor: 'transparent',
              fontWeight: activeTab === 'doctor_service' ? 700 : 500,
              color: activeTab === 'doctor_service' ? '#0284c7' : '#64748b',
              fontSize: '14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Doanh thu Dịch vụ & Bác sĩ
          </button>
        )}
        {isManager && (
          <button
            onClick={() => setActiveTab('visits')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'visits' ? '3px solid #0284c7' : '3px solid transparent',
              backgroundColor: 'transparent',
              fontWeight: activeTab === 'visits' ? 700 : 500,
              color: activeTab === 'visits' ? '#0284c7' : '#64748b',
              fontSize: '14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Báo cáo Lượt khám
          </button>
        )}
        {(isManager || isDoctor) && (
          <button
            onClick={() => setActiveTab('diseases')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'diseases' ? '3px solid #0284c7' : '3px solid transparent',
              backgroundColor: 'transparent',
              fontWeight: activeTab === 'diseases' ? 700 : 500,
              color: activeTab === 'diseases' ? '#0284c7' : '#64748b',
              fontSize: '14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Thống kê Bệnh thường gặp
          </button>
        )}
        {(isManager || isPharmacist) && (
          <button
            onClick={() => setActiveTab('medicines')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'medicines' ? '3px solid #0284c7' : '3px solid transparent',
              backgroundColor: 'transparent',
              fontWeight: activeTab === 'medicines' ? 700 : 500,
              color: activeTab === 'medicines' ? '#0284c7' : '#64748b',
              fontSize: '14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Thuốc dùng & Tồn kho dược
          </button>
        )}
        {isManager && (
          <button
            onClick={() => setActiveTab('appointments')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'appointments' ? '3px solid #0284c7' : '3px solid transparent',
              backgroundColor: 'transparent',
              fontWeight: activeTab === 'appointments' ? 700 : 500,
              color: activeTab === 'appointments' ? '#0284c7' : '#64748b',
              fontSize: '14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Báo cáo Lịch hẹn (Hủy & No-show)
          </button>
        )}
      </div>

      {/* Thanh bộ lọc thời gian (Hiện cho các tab cần lọc khoảng ngày) */}
      {activeTab !== 'realtime' && (
        <div
          className="no-print"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Lọc nhanh:</span>
            {[
              { id: 'today', label: 'Hôm nay' },
              { id: '7days', label: '7 ngày qua' },
              { id: '30days', label: '30 ngày qua' },
              { id: 'thisMonth', label: 'Tháng này' },
              { id: 'thisYear', label: 'Năm nay' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => handleQuickFilter(f.id as any)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: quickFilter === f.id ? '1px solid #0284c7' : '1px solid #cbd5e1',
                  backgroundColor: quickFilter === f.id ? '#e0f2fe' : '#ffffff',
                  color: quickFilter === f.id ? '#0369a1' : '#334155',
                  fontSize: '12px',
                  fontWeight: quickFilter === f.id ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: '#475569' }}>Từ ngày:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value)
                setQuickFilter('custom')
              }}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px'
              }}
            />
            <span style={{ fontSize: '13px', color: '#475569' }}>Đến ngày:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => {
                setEndDate(e.target.value)
                setQuickFilter('custom')
              }}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px'
              }}
            />
            <button
              onClick={loadActiveTabData}
              style={{
                padding: '6px 14px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 1: DASHBOARD THỜI GIAN THỰC (REALTIME)
          ========================================================================= */}
      {activeTab === 'realtime' && isManager && (
        <div>
          {/* Header trạng thái cập nhật */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px 18px',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981'
                }}
              />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                Hệ thống vận hành trực tuyến thời gian thực
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Cập nhật lần cuối: {realtimeData?.lastUpdated || '--:--'}
            </span>
          </div>

          {/* Hàng KPI Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
              marginBottom: '20px'
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                Doanh thu hôm nay
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#059669', marginTop: '6px' }}>
                {formatCurrency(realtimeData?.todayRevenue)}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Tổng thu thực nhận</div>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                Bệnh nhân tiếp nhận
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#0284c7', marginTop: '6px' }}>
                {formatNumber(realtimeData?.todayPatientsRegistered)}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Lượt đăng ký khám trong ngày</div>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                Chờ khám bệnh
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#d97706', marginTop: '6px' }}>
                {formatNumber(realtimeData?.waitingConsultationCount)}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Đang đợi bác sĩ gọi vào phòng</div>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                Đang khám / Đã xong
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#4f46e5', marginTop: '6px' }}>
                {formatNumber(realtimeData?.inConsultationCount)} / {formatNumber(realtimeData?.completedConsultationCount)}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Tiến độ phòng khám</div>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                Bác sĩ trực / Toa thuốc
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>
                {formatNumber(realtimeData?.activeDoctorsCount)} / {formatNumber(realtimeData?.todayPrescriptionsCount)}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Bác sĩ đang làm việc & đơn đã kê</div>
            </div>
          </div>

          {/* Biểu đồ phân bố lượt khám theo giờ & Danh sách hoạt động gần đây */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
            {/* Phân bố theo giờ */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a' }}>
                Lưu lượng bệnh nhân theo khung giờ (07:00 - 18:00)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(realtimeData?.hourlyVisits || []).map((h, idx) => {
                  const maxCount = Math.max(...(realtimeData?.hourlyVisits || []).map(x => x.visitCount), 1)
                  const pct = Math.min(100, Math.round((h.visitCount / maxCount) * 100))
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ width: '50px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                        {h.hourLabel}
                      </span>
                      <div style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: '4px', height: '20px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${pct}%`,
                            backgroundColor: h.visitCount > 0 ? '#0284c7' : '#cbd5e1',
                            height: '100%',
                            transition: 'width 0.4s ease'
                          }}
                        />
                      </div>
                      <span style={{ width: '40px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                        {h.visitCount}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Hoạt động gần đây */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a' }}>
                Nhật ký hoạt động phòng khám trong ngày
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
                {(realtimeData?.recentActivities || []).map((act, idx) => (
                  <div
                    key={idx}
                    style={{
                      borderLeft: '3px solid #0284c7',
                      backgroundColor: '#f8fafc',
                      padding: '10px 14px',
                      borderRadius: '0 6px 6px 0'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                        {act.activityType === 'INVOICE'
                          ? 'Thu viện phí'
                          : act.activityType === 'CONSULTATION'
                          ? 'Khám lâm sàng'
                          : act.activityType === 'DISPENSE'
                          ? 'Cấp phát thuốc'
                          : 'Lịch hẹn khám'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{act.time}</span>
                    </div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#334155' }}>{act.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ fontWeight: 600, color: '#059669' }}>{act.amount}</span>
                      <span style={{ color: '#64748b' }}>{act.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: BÁO CÁO DOANH THU (REVENUE)
          ========================================================================= */}
      {activeTab === 'revenue' && isManager && (
        <div>
          {/* Tổng quan chỉ số doanh thu */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '14px',
              marginBottom: '20px'
            }}
          >
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>TỔNG DOANH THU</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>
                {formatCurrency(revenueData?.totalRevenue)}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Số hóa đơn: {formatNumber(revenueData?.paidInvoiceCount)}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>DOANH THU DỊCH VỤ</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#0284c7', marginTop: '6px' }}>
                {formatCurrency(revenueData?.totalServiceRevenue)}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Khám & cận lâm sàng</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>DOANH THU THUỐC</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981', marginTop: '6px' }}>
                {formatCurrency(revenueData?.totalMedicineRevenue)}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Thuốc & vật tư tiêu hao</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>BHYT CHI TRẢ</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#7c3aed', marginTop: '6px' }}>
                {formatCurrency(revenueData?.totalInsurancePaid)}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Khấu trừ bảo hiểm</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>DOANH THU THUẦN (NET)</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#059669', marginTop: '6px' }}>
                {formatCurrency(revenueData?.netRevenue)}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Hoàn tiền: {formatCurrency(revenueData?.totalRefunded)}
              </div>
            </div>
          </div>

          {/* Cơ cấu phương thức thanh toán */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px'
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a' }}>
              Cơ cấu phương thức thanh toán
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              {Object.entries(revenueData?.paymentMethodBreakdown || {}).map(([method, amount]) => {
                const total = revenueData?.totalRevenue || 1
                const pct = total > 0 ? ((amount / total) * 100).toFixed(1) : '0'
                const labels: Record<string, string> = {
                  CASH: 'Tiền mặt',
                  'Tiền mặt': 'Tiền mặt',
                  CREDIT_CARD: 'Thẻ tín dụng / Ghi nợ',
                  'Thẻ POS': 'Thẻ POS',
                  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
                  'Chuyển khoản': 'Chuyển khoản ngân hàng',
                  VNPAY_QR: 'VNPAY QR',
                  'VNPAY-QR': 'VNPAY QR',
                  MOMO: 'Ví điện tử MoMo',
                  'Ví MoMo': 'Ví điện tử MoMo'
                }
                return (
                  <div key={method} style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>{labels[method] || method}</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '6px 0' }}>{formatCurrency(amount)}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Chiếm {pct}% tổng thu</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bảng diễn biến doanh thu theo mốc thời gian */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '20px'
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a' }}>
              Chi tiết doanh thu theo mốc thời gian
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569' }}>Thời gian</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Số hóa đơn</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Dịch vụ khám</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Tiền thuốc</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Tổng doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {(revenueData?.timelineData || []).map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>{item.label}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#475569' }}>{item.invoiceCount}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#0284c7' }}>{formatCurrency(item.serviceAmount)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#10b981' }}>{formatCurrency(item.medicineAmount)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        {formatCurrency(item.totalAmount)}
                      </td>
                    </tr>
                  ))}
                  {(revenueData?.timelineData || []).length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                        Không có dữ liệu giao dịch trong khoảng thời gian đã chọn
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: DOANH THU THEO DỊCH VỤ VÀ BÁC SĨ (DOCTOR_SERVICE)
          ========================================================================= */}
      {activeTab === 'doctor_service' && isManager && (
        <div>
          {/* Top dịch vụ kỹ thuật có doanh thu cao nhất */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Top dịch vụ mang lại doanh thu cao nhất
              </h3>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Tổng dịch vụ thực hiện: <strong>{formatNumber(doctorServiceData?.totalServiceExecutions)}</strong>
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569' }}>Tên dịch vụ kỹ thuật</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569' }}>Loại dịch vụ</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Số lượt thực hiện</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Đơn giá</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Tổng doanh thu</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Tỷ trọng</th>
                  </tr>
                </thead>
                <tbody>
                  {(doctorServiceData?.topServices || []).map((s, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>{s.serviceName}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b' }}>{s.serviceType || 'Khám lâm sàng'}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#0284c7' }}>{s.quantity}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#475569' }}>{formatCurrency(s.unitPrice)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                        {formatCurrency(s.totalRevenue)}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#475569' }}>{s.percentage}%</td>
                    </tr>
                  ))}
                  {(doctorServiceData?.topServices || []).length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                        Chưa có dữ liệu dịch vụ kỹ thuật trong kỳ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Doanh thu theo bác sĩ */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '20px'
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a' }}>
              Hiệu suất và Doanh thu theo từng Bác sĩ
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569' }}>Họ và tên Bác sĩ</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569' }}>Mã nhân viên</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569' }}>Chuyên khoa</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Lượt khám</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Doanh thu Dịch vụ</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Doanh thu Đơn thuốc</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Tổng doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {(doctorServiceData?.doctorRevenues || []).map((doc, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>{doc.doctorName}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b' }}>{doc.staffCode || '-'}</td>
                      <td style={{ padding: '10px 14px', color: '#0284c7', fontWeight: 500 }}>{doc.departmentName}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                        {doc.examinationCount}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#475569' }}>{formatCurrency(doc.serviceRevenue)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#475569' }}>{formatCurrency(doc.medicineRevenue)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                        {formatCurrency(doc.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                  {(doctorServiceData?.doctorRevenues || []).length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                        Chưa có dữ liệu bác sĩ trong khoảng thời gian này
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: BÁO CÁO LƯỢT KHÁM & CHUYÊN KHOA (VISITS)
          ========================================================================= */}
      {activeTab === 'visits' && isManager && (
        <div>
          {/* KPI Lượt khám */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
              marginBottom: '20px'
            }}
          >
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>TỔNG LƯỢT KHÁM</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>
                {formatNumber(visitData?.totalVisits)}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Tổng số lượt đăng ký khám</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>HOÀN THÀNH KHÁM</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#059669', marginTop: '6px' }}>
                {formatNumber(visitData?.completedVisits)}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Đã có kết luận & toa thuốc</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>ĐANG KHÁM / CHỜ KHÁM</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#0284c7', marginTop: '6px' }}>
                {formatNumber(visitData?.inProgressVisits)} / {formatNumber(visitData?.waitingVisits)}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Đang phục vụ trong ca</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>BỆNH NHÂN BHYT</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#7c3aed', marginTop: '6px' }}>
                {formatNumber(visitData?.demographics?.withInsuranceCount)}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Không BHYT: {formatNumber(visitData?.demographics?.withoutInsuranceCount)}
              </div>
            </div>
          </div>

          {/* Phân bố theo Chuyên khoa & Nhân khẩu học */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
            {/* Phân bố chuyên khoa */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a' }}>
                Phân bố lượt khám theo Chuyên khoa
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(visitData?.departmentVisits || []).map((dep, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>{dep.departmentName}</span>
                      <span style={{ color: '#64748b' }}>
                        <strong>{dep.visitCount}</strong> lượt ({dep.percentage}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', backgroundColor: '#f1f5f9', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${dep.percentage}%`,
                          backgroundColor: '#0284c7',
                          height: '100%'
                        }}
                      />
                    </div>
                  </div>
                ))}
                {(visitData?.departmentVisits || []).length === 0 && (
                  <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>Không có dữ liệu chuyên khoa</p>
                )}
              </div>
            </div>

            {/* Nhân khẩu học (Giới tính & Độ tuổi) */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a' }}>
                Nhân khẩu học Bệnh nhân
              </h3>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Cơ cấu giới tính:</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Nam giới</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#0284c7', marginTop: '4px' }}>
                      {formatNumber(visitData?.demographics?.maleCount)}
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Nữ giới</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#ec4899', marginTop: '4px' }}>
                      {formatNumber(visitData?.demographics?.femaleCount)}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Phân nhóm độ tuổi:</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Trẻ em (&lt;16t)</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                      {formatNumber(visitData?.demographics?.childrenCount)}
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Người lớn (16-60t)</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                      {formatNumber(visitData?.demographics?.adultCount)}
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Người cao tuổi (&gt;60t)</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                      {formatNumber(visitData?.demographics?.elderlyCount)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: THỐNG KÊ BỆNH THƯỜNG GẶP (DISEASES)
          ========================================================================= */}
      {activeTab === 'diseases' && (isManager || isDoctor) && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '20px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0', color: '#0f172a' }}>
                Thống kê mô hình bệnh tật theo mã ICD-10
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Tổng số ca bệnh đã được chẩn đoán: <strong>{formatNumber(diseaseData?.totalDiagnoses)}</strong> ca
              </p>
            </div>
            {isDoctor && !isManager && (
              <span
                style={{
                  fontSize: '12px',
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontWeight: 600
                }}
              >
                Quyền Bác sĩ chuyên môn
              </span>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569', width: '60px' }}>Hạng</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569' }}>Mã ICD-10</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569' }}>Tên bệnh lý / Chẩn đoán</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569' }}>Chuyên khoa thường gặp</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569' }}>Nhóm tuổi phổ biến</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Số ca mắc</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Tỷ lệ %</th>
                </tr>
              </thead>
              <tbody>
                {(diseaseData?.topDiseases || []).map((d, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: idx < 3 ? '#dc2626' : '#64748b' }}>
                      #{idx + 1}
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0284c7' }}>
                      {d.icd10Code || 'ICD-10'}
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>{d.diseaseName}</td>
                    <td style={{ padding: '10px 14px', color: '#475569' }}>{d.primaryDepartment || 'Đa khoa'}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{d.commonAgeGroup || 'Mọi lứa tuổi'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                      {formatNumber(d.caseCount)}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#059669', fontWeight: 600 }}>
                      {d.percentage}%
                    </td>
                  </tr>
                ))}
                {(diseaseData?.topDiseases || []).length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                      Chưa có hồ sơ bệnh án kết luận trong khoảng thời gian này
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: BÁO CÁO THUỐC DÙNG VÀ TỒN KHO (MEDICINES)
          ========================================================================= */}
      {activeTab === 'medicines' && (isManager || isPharmacist) && (
        <div>
          {/* Tổng quan kho dược */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
              marginBottom: '20px'
            }}
          >
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>DANH MỤC THUỐC</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>
                {formatNumber(medicineData?.stockOverview?.totalMedicinesCount)}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Tổng số biệt dược quản lý</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>GIÁ TRỊ TỒN KHO</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#059669', marginTop: '6px' }}>
                {formatCurrency(medicineData?.stockOverview?.totalInventoryValue)}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Tính theo giá nhập kho</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>CẢNH BÁO TỒN THẤP</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#d97706', marginTop: '6px' }}>
                {formatNumber(medicineData?.stockOverview?.lowStockCount)}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Dưới mức an toàn</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>HẾT HẠN / CẬN HẠN</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#dc2626', marginTop: '6px' }}>
                {formatNumber(medicineData?.stockOverview?.expiredCount)} / {formatNumber(medicineData?.stockOverview?.nearExpiryCount)}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Đã hết hạn / Còn dưới 60 ngày</div>
            </div>
          </div>

          {/* Danh sách cảnh báo kho dược */}
          {(medicineData?.alertItems || []).length > 0 && (
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px'
              }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px 0', color: '#991b1b' }}>
                Cảnh báo khẩn cấp tồn kho dược (Cần xử lý)
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
                      <th style={{ padding: '8px 12px', color: '#991b1b' }}>Tên thuốc</th>
                      <th style={{ padding: '8px 12px', color: '#991b1b' }}>Số lô</th>
                      <th style={{ padding: '8px 12px', color: '#991b1b', textAlign: 'right' }}>Số lượng còn</th>
                      <th style={{ padding: '8px 12px', color: '#991b1b' }}>Hạn sử dụng</th>
                      <th style={{ padding: '8px 12px', color: '#991b1b' }}>Mức độ</th>
                      <th style={{ padding: '8px 12px', color: '#991b1b' }}>Loại cảnh báo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(medicineData?.alertItems || []).map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #fee2e2' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{item.medicineName}</td>
                        <td style={{ padding: '8px 12px', color: '#475569' }}>{item.batchNumber || '-'}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>{item.availableQuantity}</td>
                        <td style={{ padding: '8px 12px' }}>{item.expiryDate || '-'}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: item.severity === 'CRITICAL' ? '#fee2e2' : '#ffedd5',
                              color: item.severity === 'CRITICAL' ? '#991b1b' : '#c2410c'
                            }}
                          >
                            {item.severity === 'CRITICAL' ? 'Nghiêm trọng' : 'Cảnh báo'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor:
                                item.alertType === 'EXPIRED'
                                  ? '#fee2e2'
                                  : item.alertType === 'NEAR_EXPIRY'
                                  ? '#ffedd5'
                                  : '#fef3c7',
                              color:
                                item.alertType === 'EXPIRED'
                                  ? '#991b1b'
                                  : item.alertType === 'NEAR_EXPIRY'
                                  ? '#c2410c'
                                  : '#92400e'
                            }}
                          >
                            {item.alertType === 'EXPIRED'
                              ? 'Đã hết hạn'
                              : item.alertType === 'NEAR_EXPIRY'
                              ? 'Cận hạn dùng'
                              : 'Tồn kho thấp'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top thuốc kê đơn nhiều nhất */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '20px'
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a' }}>
              Top thuốc được kê đơn và cấp phát nhiều nhất
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569' }}>Tên biệt dược</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569' }}>Mã thuốc</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569' }}>Hoạt chất chính</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569' }}>Đơn vị tính</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Tổng lượng cấp</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Doanh số thuốc</th>
                  </tr>
                </thead>
                <tbody>
                  {(medicineData?.topPrescribedMedicines || []).map((m, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>{m.brandName}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b' }}>{m.medicineCode}</td>
                      <td style={{ padding: '10px 14px', color: '#475569' }}>{m.activeIngredient || '-'}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b' }}>{m.unit}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#0284c7' }}>
                        {formatNumber(m.totalQuantityDispensed)}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                        {formatCurrency(m.totalAmount)}
                      </td>
                    </tr>
                  ))}
                  {(medicineData?.topPrescribedMedicines || []).length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                        Chưa có dữ liệu kê đơn thuốc trong kỳ báo cáo
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: BÁO CÁO LỊCH HẸN & TỶ LỆ HỦY, NO-SHOW (APPOINTMENTS)
          ========================================================================= */}
      {activeTab === 'appointments' && isManager && (
        <div>
          {/* KPI Lịch hẹn */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
              marginBottom: '20px'
            }}
          >
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>TỔNG LỊCH HẸN</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>
                {formatNumber(appointmentData?.totalAppointments)}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Đã xác nhận: {formatNumber(appointmentData?.confirmedCount)}</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>ĐÃ KHÁM THÀNH CÔNG</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#059669', marginTop: '6px' }}>
                {formatNumber(appointmentData?.completedCount)}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Tỷ lệ hoàn thành: {appointmentData?.completionRate ?? 0}%
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>TỶ LỆ HỦY HẸN</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#d97706', marginTop: '6px' }}>
                {appointmentData?.cancellationRate ?? 0}%
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                {appointmentData?.cancelledCount ?? 0} lịch đã báo hủy
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>TỶ LỆ VẮNG KHÁM (NO-SHOW)</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#dc2626', marginTop: '6px' }}>
                {appointmentData?.noShowRate ?? 0}%
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                {appointmentData?.noShowCount ?? 0} ca không đến và không báo trước
              </div>
            </div>
          </div>

          {/* Phân loại lý do hủy hẹn & Kênh đặt lịch */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
            {/* Lý do hủy */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a' }}>
                Phân tích lý do hủy hẹn
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(appointmentData?.cancellationReasons || []).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#334155' }}>{item.reason}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#d97706' }}>
                      {item.count} ca ({item.percentage}%)
                    </span>
                  </div>
                ))}
                {(appointmentData?.cancellationReasons || []).length === 0 && (
                  <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>Không có lịch hủy trong khoảng thời gian này</p>
                )}
              </div>
            </div>

            {/* Kênh đặt lịch */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a' }}>
                Hiệu quả kênh tiếp nhận đặt lịch
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(appointmentData?.channelStats || []).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#334155' }}>{item.channel}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0284c7' }}>
                      {item.count} lịch ({item.percentage}%)
                    </span>
                  </div>
                ))}
                {(appointmentData?.channelStats || []).length === 0 && (
                  <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>Không có dữ liệu kênh đặt lịch</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default ReportsAnalyticsPage
