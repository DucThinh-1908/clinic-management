import React, { useState, useEffect } from 'react'
import type {
  InvoiceDetail,
  PaymentItem,
  InvoicePrintData,
  BillingStats,
  ServicePriceItem,
  SaveServicePriceRequest,
  ProcessPaymentRequest,
  ApplyInsuranceDiscountRequest,
  RefundInvoiceRequest
} from '../types'

interface BillingPaymentPageProps {
  currentUser?: {
    username?: string
    role?: string
    roles?: string[]
    name?: string
    id?: number
  } | null
}

interface MedicalCandidate {
  medicalRecordId: number
  recordCode: string
  patientId: number
  patientCode: string
  patientName: string
  patientPhone: string
  doctorName?: string
  diagnosis?: string
  completedAt?: string
  invoiceCreated?: boolean
  invoiceId?: number
  invoiceCode?: string
}

export const BillingPaymentPage: React.FC<BillingPaymentPageProps> = ({ currentUser }) => {
  // Tabs: 4 phân hệ chính
  const [activeTab, setActiveTab] = useState<'checkout' | 'invoices' | 'transactions' | 'services'>('checkout')

  // Thông báo hệ thống
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const showAlert = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setAlertMessage({ text, type })
    setTimeout(() => {
      setAlertMessage(null)
    }, 4500)
  }

  // Quyền hạn
  const roles = currentUser?.roles || (currentUser?.role ? [currentUser.role] : [])
  const isManager = roles.some(r => ['ROLE_MANAGER', 'ROLE_ADMIN', 'manager', 'admin'].includes(r))
  const isCashier = roles.some(r => ['ROLE_CASHIER', 'cashier'].includes(r))

  // =========================================================================
  // TAB 1: THU VIỆN PHÍ & LẬP HÓA ĐƠN
  // =========================================================================
  const [candidates, setCandidates] = useState<MedicalCandidate[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState<boolean>(false)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null)
  const [loadingInvoice, setLoadingInvoice] = useState<boolean>(false)

  // Form giảm giá / BHYT
  const [insuranceRate, setInsuranceRate] = useState<string>('0')
  const [insuranceAmount, setInsuranceAmount] = useState<string>('0')
  const [discountAmount, setDiscountAmount] = useState<string>('0')
  const [discountReason, setDiscountReason] = useState<string>('')
  const [savingDiscount, setSavingDiscount] = useState<boolean>(false)

  // Form thu tiền
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CREDIT_CARD' | 'BANK_TRANSFER' | 'VNPAY_QR' | 'MOMO'>('CASH')
  const [customerGivenAmount, setCustomerGivenAmount] = useState<string>('')
  const [transactionRef, setTransactionRef] = useState<string>('')
  const [paymentNote, setPaymentNote] = useState<string>('')
  const [processingPayment, setProcessingPayment] = useState<boolean>(false)

  // =========================================================================
  // TAB 2: QUẢN LÝ DANH SÁCH HÓA ĐƠN & HOÀN TIỀN
  // =========================================================================
  const [invoicesList, setInvoicesList] = useState<InvoiceDetail[]>([])
  const [loadingInvoicesList, setLoadingInvoicesList] = useState<boolean>(false)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchInvoiceKeyword, setSearchInvoiceKeyword] = useState<string>('')

  // Modal Hoàn tiền / Hủy hóa đơn
  const [refundModalOpen, setRefundModalOpen] = useState<boolean>(false)
  const [refundTargetInvoice, setRefundTargetInvoice] = useState<InvoiceDetail | null>(null)
  const [refundReason, setRefundReason] = useState<string>('')
  const [processingRefund, setProcessingRefund] = useState<boolean>(false)

  // =========================================================================
  // TAB 3: LỊCH SỬ GIAO DỊCH & BÁO CÁO DOANH THU
  // =========================================================================
  const [paymentsList, setPaymentsList] = useState<PaymentItem[]>([])
  const [loadingPayments, setLoadingPayments] = useState<boolean>(false)
  const [stats, setStats] = useState<BillingStats | null>(null)

  // =========================================================================
  // TAB 4: BẢNG GIÁ DỊCH VỤ
  // =========================================================================
  const [servicesList, setServicesList] = useState<ServicePriceItem[]>([])
  const [loadingServices, setLoadingServices] = useState<boolean>(false)
  const [searchServiceKeyword, setSearchServiceKeyword] = useState<string>('')
  const [serviceModalOpen, setServiceModalOpen] = useState<boolean>(false)
  const [editingService, setEditingService] = useState<SaveServicePriceRequest>({
    serviceCode: '',
    serviceName: '',
    serviceType: 'Dịch vụ khám',
    unitPrice: 150000,
    insuranceCoverageRate: 0,
    isActive: true,
    description: ''
  })
  const [savingService, setSavingService] = useState<boolean>(false)

  // =========================================================================
  // MODAL IN HÓA ĐƠN / PHIẾU THU
  // =========================================================================
  const [printModalOpen, setPrintModalOpen] = useState<boolean>(false)
  const [printData, setPrintData] = useState<InvoicePrintData | null>(null)
  const [loadingPrint, setLoadingPrint] = useState<boolean>(false)

  // Khởi tạo dữ liệu
  useEffect(() => {
    loadBillingStats()
    if (activeTab === 'checkout') {
      loadCandidates()
    } else if (activeTab === 'invoices') {
      loadInvoices()
    } else if (activeTab === 'transactions') {
      loadPayments()
      loadBillingStats()
    } else if (activeTab === 'services') {
      loadServices()
    }
  }, [activeTab])

  // =========================================================================
  // API LOADERS
  // =========================================================================
  const loadBillingStats = async () => {
    try {
      const res = await fetch('/api/billing/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch {
      // Bỏ qua lỗi thống kê
    }
  }

  const loadCandidates = async () => {
    setLoadingCandidates(true)
    try {
      const res = await fetch('/api/billing/candidates')
      if (res.ok) {
        const data = await res.json()
        setCandidates(data)
      } else {
        showAlert('Không thể tải danh sách hồ sơ khám chờ thanh toán', 'error')
      }
    } catch {
      showAlert('Lỗi kết nối khi tải danh sách bệnh nhân', 'error')
    } finally {
      setLoadingCandidates(false)
    }
  }

  const loadInvoices = async () => {
    setLoadingInvoicesList(true)
    try {
      let url = '/api/billing/invoices?'
      if (statusFilter && statusFilter !== 'ALL') {
        url += `status=${statusFilter}&`
      }
      if (searchInvoiceKeyword.trim()) {
        url += `query=${encodeURIComponent(searchInvoiceKeyword.trim())}`
      }
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setInvoicesList(data)
      } else {
        showAlert('Không thể tải danh sách hóa đơn', 'error')
      }
    } catch {
      showAlert('Lỗi kết nối khi tải danh sách hóa đơn', 'error')
    } finally {
      setLoadingInvoicesList(false)
    }
  }

  const loadPayments = async () => {
    setLoadingPayments(true)
    try {
      const res = await fetch('/api/billing/payments')
      if (res.ok) {
        const data = await res.json()
        setPaymentsList(data)
      } else {
        showAlert('Không thể tải lịch sử giao dịch thanh toán', 'error')
      }
    } catch {
      showAlert('Lỗi kết nối khi tải lịch sử thanh toán', 'error')
    } finally {
      setLoadingPayments(false)
    }
  }

  const loadServices = async () => {
    setLoadingServices(true)
    try {
      let url = '/api/billing/services'
      if (searchServiceKeyword.trim()) {
        url += `?query=${encodeURIComponent(searchServiceKeyword.trim())}`
      }
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setServicesList(data)
      } else {
        showAlert('Không thể tải bảng giá dịch vụ y tế', 'error')
      }
    } catch {
      showAlert('Lỗi kết nối khi tải bảng giá dịch vụ', 'error')
    } finally {
      setLoadingServices(false)
    }
  }

  // =========================================================================
  // XỬ LÝ LẬP HÓA ĐƠN & CHI TIẾT
  // =========================================================================
  const handleSelectCandidate = async (cand: MedicalCandidate) => {
    setLoadingInvoice(true)
    try {
      if (cand.invoiceId) {
        const res = await fetch(`/api/billing/invoices/${cand.invoiceId}`)
        if (res.ok) {
          const data: InvoiceDetail = await res.json()
          setSelectedInvoice(data)
          initDiscountForm(data)
          showAlert(`Đã mở hóa đơn số ${data.invoiceCode}`, 'info')
        } else {
          showAlert('Không thể tải chi tiết hóa đơn', 'error')
        }
      } else {
        const reqBody = {
          medicalRecordId: cand.medicalRecordId,
          cashierId: currentUser?.id,
          note: `Lập hóa đơn viện phí phiên khám ${cand.recordCode}`
        }
        const res = await fetch('/api/billing/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reqBody)
        })
        if (res.ok) {
          const data: InvoiceDetail = await res.json()
          setSelectedInvoice(data)
          initDiscountForm(data)
          showAlert(`Lập hóa đơn thành công! Mã: ${data.invoiceCode}`, 'success')
          loadCandidates()
          loadBillingStats()
        } else {
          const errData = await res.json().catch(() => null)
          showAlert(errData?.message || 'Lỗi khi tạo hóa đơn viện phí', 'error')
        }
      }
    } catch {
      showAlert('Lỗi kết nối máy chủ', 'error')
    } finally {
      setLoadingInvoice(false)
    }
  }

  const handleSelectInvoiceFromList = async (invoiceId: number) => {
    setLoadingInvoice(true)
    try {
      const res = await fetch(`/api/billing/invoices/${invoiceId}`)
      if (res.ok) {
        const data: InvoiceDetail = await res.json()
        setSelectedInvoice(data)
        initDiscountForm(data)
        setActiveTab('checkout')
        showAlert(`Đang xem hóa đơn ${data.invoiceCode}`, 'info')
      } else {
        showAlert('Không tìm thấy hóa đơn', 'error')
      }
    } catch {
      showAlert('Lỗi kết nối khi tải hóa đơn', 'error')
    } finally {
      setLoadingInvoice(false)
    }
  }

  const initDiscountForm = (inv: InvoiceDetail) => {
    setInsuranceAmount(inv.insurancePaidAmount ? inv.insurancePaidAmount.toString() : '0')
    setDiscountAmount(inv.discountAmount ? inv.discountAmount.toString() : '0')
    setDiscountReason('')
    setCustomerGivenAmount(inv.finalAmount ? inv.finalAmount.toString() : '0')
  }

  // =========================================================================
  // XỬ LÝ ÁP DỤNG BHYT / GIẢM GIÁ
  // =========================================================================
  const handleApplyInsuranceAndDiscount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInvoice) return

    setSavingDiscount(true)
    try {
      const req: ApplyInsuranceDiscountRequest = {
        insuranceRate: parseFloat(insuranceRate) || 0,
        insurancePaidAmount: parseFloat(insuranceAmount) || 0,
        discountAmount: parseFloat(discountAmount) || 0,
        discountReason: discountReason.trim()
      }

      const res = await fetch(`/api/billing/invoices/${selectedInvoice.id}/discount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      })

      if (res.ok) {
        const updated: InvoiceDetail = await res.json()
        setSelectedInvoice(updated)
        setCustomerGivenAmount(updated.finalAmount.toString())
        showAlert('Đã áp dụng mức khấu trừ BHYT và giảm giá thành công', 'success')
      } else {
        const err = await res.json().catch(() => null)
        showAlert(err?.message || 'Không thể cập nhật giảm trừ', 'error')
      }
    } catch {
      showAlert('Lỗi kết nối khi áp dụng giảm trừ', 'error')
    } finally {
      setSavingDiscount(false)
    }
  }

  // =========================================================================
  // XỬ LÝ THU TIỀN VIỆN PHÍ
  // =========================================================================
  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInvoice) return

    if (selectedInvoice.status === 'PAID') {
      showAlert('Hóa đơn này đã được thu tiền trước đó', 'info')
      return
    }

    setProcessingPayment(true)
    try {
      const req: ProcessPaymentRequest = {
        invoiceId: selectedInvoice.id,
        cashierId: currentUser?.id,
        paymentMethod,
        customerGivenAmount: parseFloat(customerGivenAmount) || selectedInvoice.finalAmount,
        transactionReference: transactionRef.trim(),
        note: paymentNote.trim()
      }

      const res = await fetch('/api/billing/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      })

      if (res.ok) {
        const resp = await res.json()
        showAlert(`Thu viện phí thành công! Mã giao dịch: ${resp.paymentCode}`, 'success')
        const invRes = await fetch(`/api/billing/invoices/${selectedInvoice.id}`)
        if (invRes.ok) {
          const updatedInv = await invRes.json()
          setSelectedInvoice(updatedInv)
        }
        loadCandidates()
        loadBillingStats()
      } else {
        const err = await res.json().catch(() => null)
        showAlert(err?.message || 'Xử lý thanh toán thất bại', 'error')
      }
    } catch {
      showAlert('Lỗi kết nối khi thực hiện thanh toán', 'error')
    } finally {
      setProcessingPayment(false)
    }
  }

  // =========================================================================
  // XỬ LÝ IN & GỬI HÓA ĐƠN
  // =========================================================================
  const handleOpenPrintModal = async (invoiceId: number) => {
    setLoadingPrint(true)
    try {
      const res = await fetch(`/api/billing/invoices/${invoiceId}/print`)
      if (res.ok) {
        const data: InvoicePrintData = await res.json()
        setPrintData(data)
        setPrintModalOpen(true)
      } else {
        showAlert('Không thể lấy mẫu in hóa đơn viện phí', 'error')
      }
    } catch {
      showAlert('Lỗi khi tải mẫu in', 'error')
    } finally {
      setLoadingPrint(false)
    }
  }

  const handleSendInvoiceEmail = async (invoiceId: number) => {
    try {
      const res = await fetch(`/api/billing/invoices/${invoiceId}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'benhnhan@careplus.vn' })
      })
      if (res.ok) {
        showAlert('Đã xuất và gửi hóa đơn điện tử thành công vào hòm thư bệnh nhân', 'success')
      } else {
        showAlert('Không thể gửi hóa đơn điện tử', 'error')
      }
    } catch {
      showAlert('Lỗi kết nối máy chủ gửi thư', 'error')
    }
  }

  // =========================================================================
  // XỬ LÝ HOÀN TIỀN / HỦY HÓA ĐƠN
  // =========================================================================
  const openRefundModal = (inv: InvoiceDetail) => {
    setRefundTargetInvoice(inv)
    setRefundReason('')
    setRefundModalOpen(true)
  }

  const handleConfirmRefund = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!refundTargetInvoice) return
    if (!refundReason.trim()) {
      showAlert('Bắt buộc phải nhập lý do hủy hoặc hoàn tiền', 'error')
      return
    }

    setProcessingRefund(true)
    try {
      const req: RefundInvoiceRequest = {
        invoiceId: refundTargetInvoice.id,
        actorId: currentUser?.id,
        reason: refundReason.trim()
      }

      const res = await fetch('/api/billing/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      })

      if (res.ok) {
        const updated: InvoiceDetail = await res.json()
        showAlert(
          updated.status === 'REFUNDED'
            ? 'Đã hoàn tiền viện phí và ghi nhận giao dịch hoàn trả thành công'
            : 'Đã hủy hóa đơn viện phí thành công',
          'success'
        )
        setRefundModalOpen(false)
        if (selectedInvoice && selectedInvoice.id === updated.id) {
          setSelectedInvoice(updated)
        }
        loadInvoices()
        loadCandidates()
        loadBillingStats()
      } else {
        const err = await res.json().catch(() => null)
        showAlert(err?.message || 'Thao tác hoàn tiền thất bại', 'error')
      }
    } catch {
      showAlert('Lỗi kết nối khi gửi yêu cầu', 'error')
    } finally {
      setProcessingRefund(false)
    }
  }

  // =========================================================================
  // XỬ LÝ QUẢN LÝ BẢNG GIÁ DỊCH VỤ
  // =========================================================================
  const openNewServiceModal = () => {
    setEditingService({
      serviceCode: `DV${Math.floor(1000 + Math.random() * 9000)}`,
      serviceName: '',
      serviceType: 'Dịch vụ khám',
      unitPrice: 200000,
      insuranceCoverageRate: 0,
      isActive: true,
      description: ''
    })
    setServiceModalOpen(true)
  }

  const openEditServiceModal = (s: ServicePriceItem) => {
    setEditingService({
      id: s.id,
      serviceCode: s.serviceCode,
      serviceName: s.serviceName,
      serviceType: s.serviceType,
      unitPrice: s.unitPrice,
      insuranceCoverageRate: s.insuranceCoverageRate || 0,
      isActive: s.isActive,
      description: s.description || ''
    })
    setServiceModalOpen(true)
  }

  const handleSaveServicePrice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingService.serviceName.trim()) {
      showAlert('Vui lòng nhập tên dịch vụ y tế', 'error')
      return
    }

    setSavingService(true)
    try {
      const res = await fetch('/api/billing/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingService)
      })

      if (res.ok) {
        showAlert('Đã lưu cấu hình bảng giá dịch vụ thành công', 'success')
        setServiceModalOpen(false)
        loadServices()
      } else {
        const err = await res.json().catch(() => null)
        showAlert(err?.message || 'Không thể lưu dịch vụ', 'error')
      }
    } catch {
      showAlert('Lỗi kết nối khi lưu dịch vụ', 'error')
    } finally {
      setSavingService(false)
    }
  }

  // Tiện ích tính tiền
  const changeAmount = () => {
    if (!selectedInvoice) return 0
    const given = parseFloat(customerGivenAmount) || 0
    const finalAmt = selectedInvoice.finalAmount || 0
    return given > finalAmt ? given - finalAmt : 0
  }

  const formatCurrency = (amt?: number) => {
    if (amt === undefined || amt === null) return '0 đ'
    return new Intl.NumberFormat('vi-VN').format(amt) + ' đ'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0', label: 'Đã thanh toán' }
      case 'REFUNDED':
        return { bg: '#f3e8ff', color: '#7e22ce', border: '#e9d5ff', label: 'Đã hoàn tiền' }
      case 'CANCELLED':
        return { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca', label: 'Đã hủy bỏ' }
      default:
        return { bg: '#fef3c7', color: '#b45309', border: '#fde68a', label: 'Chưa thanh toán' }
    }
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '24px 20px 60px' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
        {/* BANNER TIÊU ĐỀ */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '24px 28px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  border: '1px solid #bbf7d0',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                Phân hệ thu ngân & tài chính
              </span>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Phòng khám CarePlus</span>
            </div>
            <h1 style={{ margin: '8px 0 4px', fontSize: '24px', color: '#0f172a', fontWeight: 800 }}>
              Quản Lý Thanh Toán & Viện Phí
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13.5px' }}>
              Lập hóa đơn khám bệnh, áp dụng bảo hiểm y tế, thu viện phí đa phương thức và quản trị bảng giá dịch vụ
            </p>
          </div>

          <div style={{ textAlign: 'right', background: '#f8fafc', padding: '10px 18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Nhân sự ca trực</div>
            <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a' }}>
              {currentUser?.name || currentUser?.username || 'Đỗ Thúy Hằng'}
            </div>
            <div style={{ fontSize: '12px', color: '#087f8c', fontWeight: 700 }}>
              {isCashier ? 'Nhân viên thu ngân' : isManager ? 'Quản lý tài chính' : 'Nhân sự vận hành'}
            </div>
          </div>
        </div>

        {/* THÔNG BÁO ALERT */}
        {alertMessage && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: '10px',
              marginBottom: '16px',
              fontSize: '13.5px',
              fontWeight: 600,
              background: alertMessage.type === 'success' ? '#f0fdf4' : alertMessage.type === 'error' ? '#fef2f2' : '#eff6ff',
              color: alertMessage.type === 'success' ? '#15803d' : alertMessage.type === 'error' ? '#b91c1c' : '#1d4ed8',
              border: `1px solid ${alertMessage.type === 'success' ? '#bbf7d0' : alertMessage.type === 'error' ? '#fecaca' : '#bfdbfe'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <span>{alertMessage.text}</span>
            <button
              onClick={() => setAlertMessage(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: 'inherit', fontSize: '13px' }}
            >
              Đóng
            </button>
          </div>
        )}

        {/* THỐNG KÊ DOANH THU 4 Ô */}
        {stats && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
              marginBottom: '20px'
            }}
          >
            <div style={{ background: '#ffffff', padding: '18px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Doanh thu hôm nay</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#15803d', marginTop: '6px' }}>
                {formatCurrency(stats.todayRevenue)}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                {stats.todayPaidInvoicesCount} hóa đơn đã hoàn tất
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '18px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Hóa đơn chờ thu tiền</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#d97706', marginTop: '6px' }}>
                {stats.pendingInvoicesCount} hồ sơ
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Bệnh nhân đã kết thúc khám
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '18px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Cơ cấu thu theo tiền mặt</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                {formatCurrency(stats.cashTotal)}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Thu ngân trực tiếp tại quầy
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '18px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Chuyển khoản / Thẻ / QR</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0284c7', marginTop: '6px' }}>
                {formatCurrency((stats.transferTotal || 0) + (stats.cardTotal || 0) + (stats.qrTotal || 0))}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Thanh toán không tiền mặt
              </div>
            </div>
          </div>
        )}

        {/* THANH CHUYỂN TABS */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '6px',
            marginBottom: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          {[
            { id: 'checkout', label: 'Thu viện phí & Lập hóa đơn' },
            { id: 'invoices', label: 'Danh sách hóa đơn & Hoàn tiền' },
            { id: 'transactions', label: 'Lịch sử giao dịch & Báo cáo' },
            { id: 'services', label: 'Bảng giá dịch vụ khám chữa bệnh' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                fontSize: '13.5px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === tab.id ? '#087f8c' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#475569',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ================================================================= */}
        {/* NỘI DUNG TAB 1: THU VIỆN PHÍ & LẬP HÓA ĐƠN                        */}
        {/* ================================================================= */}
        {activeTab === 'checkout' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: '20px', alignItems: 'start' }}>
            {/* Cột trái: Danh sách bệnh nhân chờ lập hóa đơn */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    Hồ sơ khám chờ xuất hóa đơn
                  </h2>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Phiên khám đã hoàn tất chẩn đoán & chỉ định
                  </div>
                </div>
                <button
                  onClick={loadCandidates}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#334155',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Làm mới
                </button>
              </div>

              {loadingCandidates ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  Đang tải danh sách hồ sơ khám...
                </div>
              ) : candidates.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  Hiện không có hồ sơ khám nào chờ xuất hóa đơn
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '680px', overflowY: 'auto', paddingRight: '4px' }}>
                  {candidates.map(cand => {
                    const isSelected = selectedInvoice?.medicalRecordId === cand.medicalRecordId
                    return (
                      <div
                        key={cand.medicalRecordId}
                        onClick={() => handleSelectCandidate(cand)}
                        style={{
                          padding: '14px',
                          borderRadius: '12px',
                          border: `1.5px solid ${isSelected ? '#087f8c' : '#e2e8f0'}`,
                          background: isSelected ? '#f0fdfa' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          boxShadow: isSelected ? '0 2px 6px rgba(8,127,140,0.15)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                              {cand.patientName}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                              Mã BN: <strong style={{ color: '#334155' }}>{cand.patientCode}</strong> | SĐT: {cand.patientPhone || '---'}
                            </div>
                          </div>
                          {cand.invoiceCreated ? (
                            <span style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                              Đã lập HĐ
                            </span>
                          ) : (
                            <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                              Chờ lập HĐ
                            </span>
                          )}
                        </div>

                        <div style={{ marginTop: '8px', background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', fontSize: '12px', color: '#334155', border: '1px solid #f1f5f9' }}>
                          <div><span style={{ color: '#64748b' }}>Bác sĩ:</span> {cand.doctorName || 'BS. Nguyễn Văn An'}</div>
                          <div style={{ marginTop: '2px' }}><span style={{ color: '#64748b' }}>Chẩn đoán:</span> {cand.diagnosis || 'Chưa cập nhật'}</div>
                        </div>

                        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px' }}>
                          <span style={{ color: '#94a3b8' }}>Hồ sơ: {cand.recordCode}</span>
                          <span style={{ color: '#087f8c', fontWeight: 800 }}>
                            {cand.invoiceCreated ? 'Xem chi tiết & thu tiền' : 'Lập hóa đơn ngay'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Cột phải: Chi tiết hóa đơn & Form thu tiền */}
            <div>
              {loadingInvoice ? (
                <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '60px 20px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                  Đang khởi tạo và tính toán chi phí hóa đơn...
                </div>
              ) : !selectedInvoice ? (
                <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '60px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                  Vui lòng chọn một bệnh nhân từ danh sách bên trái để tiến hành lập hóa đơn và thu viện phí
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Card chi tiết hóa đơn */}
                  <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    {/* Header hóa đơn */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                            Hóa đơn: {selectedInvoice.invoiceCode}
                          </h2>
                          {(() => {
                            const badge = getStatusBadge(selectedInvoice.status)
                            return (
                              <span style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                                {badge.label}
                              </span>
                            )
                          })()}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          Thời gian tạo: {selectedInvoice.createdAt}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          type="button"
                          disabled={loadingPrint}
                          onClick={() => handleOpenPrintModal(selectedInvoice.id)}
                          style={{
                            padding: '8px 16px',
                            background: '#0f172a',
                            color: '#ffffff',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {loadingPrint ? 'Đang nạp...' : 'In hóa đơn A4'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendInvoiceEmail(selectedInvoice.id)}
                          style={{
                            padding: '8px 16px',
                            background: '#f1f5f9',
                            color: '#334155',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Gửi hóa đơn
                        </button>
                      </div>
                    </div>

                    {/* Thông tin bệnh nhân */}
                    <div
                      style={{
                        margin: '16px 0',
                        background: '#f8fafc',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '10px',
                        fontSize: '12.5px'
                      }}
                    >
                      <div><span style={{ color: '#64748b' }}>Bệnh nhân:</span> <strong style={{ color: '#0f172a' }}>{selectedInvoice.patientName}</strong></div>
                      <div><span style={{ color: '#64748b' }}>Mã bệnh nhân:</span> <strong style={{ color: '#0f172a' }}>{selectedInvoice.patientCode}</strong></div>
                      <div><span style={{ color: '#64748b' }}>Số BHYT:</span> <strong style={{ color: '#087f8c' }}>{selectedInvoice.healthInsuranceNumber || 'Không có BHYT'}</strong></div>
                      <div><span style={{ color: '#64748b' }}>Bác sĩ khám:</span> <strong style={{ color: '#0f172a' }}>{selectedInvoice.doctorName || '---'}</strong></div>
                      <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#64748b' }}>Chẩn đoán:</span> <strong style={{ color: '#0f172a' }}>{selectedInvoice.diagnosis || '---'}</strong></div>
                    </div>

                    {/* Bảng chi tiết dịch vụ & thuốc */}
                    <div style={{ marginTop: '16px' }}>
                      <h3 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                        Chi tiết các khoản thu viện phí
                      </h3>
                      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                              <th style={{ padding: '10px 12px' }}>Phân loại</th>
                              <th style={{ padding: '10px 12px' }}>Tên dịch vụ / Thuốc</th>
                              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Đơn giá</th>
                              <th style={{ padding: '10px 12px', textAlign: 'center' }}>SL</th>
                              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Thành tiền</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                              selectedInvoice.items.map((it, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '10px 12px' }}>
                                    <span
                                      style={{
                                        padding: '3px 8px',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        background: it.itemType === 'CONSULTATION_FEE' ? '#e0f2fe' : it.itemType === 'LAB_SERVICE' ? '#ede9fe' : it.itemType === 'MEDICINE' ? '#fef3c7' : '#f1f5f9',
                                        color: it.itemType === 'CONSULTATION_FEE' ? '#0369a1' : it.itemType === 'LAB_SERVICE' ? '#6d28d9' : it.itemType === 'MEDICINE' ? '#b45309' : '#334155'
                                      }}
                                    >
                                      {it.itemType === 'CONSULTATION_FEE' ? 'Tiền khám' : it.itemType === 'LAB_SERVICE' ? 'Xét nghiệm' : it.itemType === 'MEDICINE' ? 'Thuốc' : 'Khác'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>{it.itemName}</td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b' }}>{formatCurrency(it.unitPrice)}</td>
                                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#0f172a', fontWeight: 700 }}>{it.quantity}</td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>{formatCurrency(it.subtotal)}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>Không có khoản mục nào</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Bảng tổng kết số tiền */}
                    <div
                      style={{
                        marginTop: '16px',
                        background: '#f8fafc',
                        padding: '16px 20px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        fontSize: '13px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                        <span>Tiền dịch vụ khám & cận lâm sàng:</span>
                        <strong style={{ color: '#0f172a' }}>{formatCurrency(selectedInvoice.totalServiceAmount)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                        <span>Tiền thuốc theo đơn ngoại trú:</span>
                        <strong style={{ color: '#0f172a' }}>{formatCurrency(selectedInvoice.totalMedicineAmount)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d' }}>
                        <span>Bảo hiểm y tế chi trả:</span>
                        <strong style={{ fontWeight: 800 }}>- {formatCurrency(selectedInvoice.insurancePaidAmount)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b91c1c' }}>
                        <span>Giảm giá / Ưu đãi:</span>
                        <strong style={{ fontWeight: 800 }}>- {formatCurrency(selectedInvoice.discountAmount)}</strong>
                      </div>
                      <div
                        style={{
                          borderTop: '2px solid #cbd5e1',
                          paddingTop: '10px',
                          marginTop: '4px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a' }}>
                          TỔNG TIỀN THỰC THU TỪ BỆNH NHÂN:
                        </span>
                        <span style={{ fontSize: '20px', fontWeight: 900, color: '#087f8c' }}>
                          {formatCurrency(selectedInvoice.finalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* FORM ÁP DỤNG BHYT & GIẢM TRỪ */}
                  {selectedInvoice.status !== 'PAID' && (
                    <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                        Áp dụng bảo hiểm y tế / Giảm trừ viện phí
                      </h3>
                      <form onSubmit={handleApplyInsuranceAndDiscount}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                              Tỷ lệ BHYT thanh toán (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="5"
                              value={insuranceRate}
                              onChange={e => setInsuranceRate(e.target.value)}
                              placeholder="VD: 80 hoặc 100"
                              className="form-control"
                              style={{ padding: '8px 12px', fontSize: '13px' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                              Hoặc số tiền BHYT chi trả (đ)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              value={insuranceAmount}
                              onChange={e => setInsuranceAmount(e.target.value)}
                              placeholder="Nhập số tiền BHYT"
                              className="form-control"
                              style={{ padding: '8px 12px', fontSize: '13px' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                              Số tiền giảm giá / Miễn giảm (đ)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              value={discountAmount}
                              onChange={e => setDiscountAmount(e.target.value)}
                              placeholder="Nhập số tiền giảm"
                              className="form-control"
                              style={{ padding: '8px 12px', fontSize: '13px' }}
                            />
                          </div>
                        </div>

                        <div style={{ marginBottom: '14px' }}>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            Lý do giảm trừ / Thẻ ưu đãi
                          </label>
                          <input
                            type="text"
                            value={discountReason}
                            onChange={e => setDiscountReason(e.target.value)}
                            placeholder="VD: Thẻ thành viên VIP CarePlus, Miễn giảm chương trình tri ân"
                            className="form-control"
                            style={{ padding: '8px 12px', fontSize: '13px' }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            type="submit"
                            disabled={savingDiscount}
                            style={{
                              padding: '9px 18px',
                              background: '#334155',
                              color: '#ffffff',
                              borderRadius: '8px',
                              border: 'none',
                              fontSize: '13px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {savingDiscount ? 'Đang cập nhật...' : 'Cập nhật giảm trừ'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* FORM THU TIỀN VIỆN PHÍ */}
                  {selectedInvoice.status !== 'PAID' ? (
                    <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                            Thực hiện thu tiền viện phí
                          </h3>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            Chọn phương thức thanh toán và xác nhận giao dịch
                          </div>
                        </div>
                      </div>

                      <form onSubmit={handleProcessPayment}>
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                            Phương thức thanh toán
                          </label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                            {[
                              { id: 'CASH', name: 'Tiền mặt' },
                              { id: 'BANK_TRANSFER', name: 'Chuyển khoản' },
                              { id: 'CREDIT_CARD', name: 'Thẻ POS' },
                              { id: 'VNPAY_QR', name: 'Quét VNPAY-QR' },
                              { id: 'MOMO', name: 'Ví MoMo' }
                            ].map(m => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => setPaymentMethod(m.id as any)}
                                style={{
                                  padding: '10px',
                                  borderRadius: '8px',
                                  fontSize: '12.5px',
                                  fontWeight: 700,
                                  border: `1.5px solid ${paymentMethod === m.id ? '#087f8c' : '#cbd5e1'}`,
                                  background: paymentMethod === m.id ? '#e6f4f6' : '#ffffff',
                                  color: paymentMethod === m.id ? '#075e68' : '#334155',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s'
                                }}
                              >
                                {m.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                              Số tiền khách đưa (đ)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              value={customerGivenAmount}
                              onChange={e => setCustomerGivenAmount(e.target.value)}
                              className="form-control"
                              style={{ padding: '8px 12px', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}
                            />
                            {changeAmount() > 0 && (
                              <div style={{ fontSize: '12px', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>
                                Tiền thừa trả lại: {formatCurrency(changeAmount())}
                              </div>
                            )}
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                              Mã tham chiếu / Số biên lai giao dịch
                            </label>
                            <input
                              type="text"
                              value={transactionRef}
                              onChange={e => setTransactionRef(e.target.value)}
                              placeholder="Mã chuẩn chi POS hoặc mã FT ngân hàng"
                              className="form-control"
                              style={{ padding: '8px 12px', fontSize: '13px' }}
                            />
                          </div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            Ghi chú thu ngân
                          </label>
                          <input
                            type="text"
                            value={paymentNote}
                            onChange={e => setPaymentNote(e.target.value)}
                            placeholder="Ghi chú thêm về ca thu tiền viện phí"
                            className="form-control"
                            style={{ padding: '8px 12px', fontSize: '13px' }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
                          <button
                            type="button"
                            onClick={() => openRefundModal(selectedInvoice)}
                            style={{ background: 'none', border: 'none', color: '#b91c1c', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Hủy bỏ hóa đơn này
                          </button>

                          <button
                            type="submit"
                            disabled={processingPayment}
                            style={{
                              padding: '12px 28px',
                              background: '#087f8c',
                              color: '#ffffff',
                              borderRadius: '10px',
                              border: 'none',
                              fontSize: '14px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(8,127,140,0.25)'
                            }}
                          >
                            {processingPayment ? 'Đang xử lý thu tiền...' : `Xác nhận thu ${formatCurrency(selectedInvoice.finalAmount)}`}
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div
                      style={{
                        background: '#f0fdf4',
                        borderRadius: '16px',
                        border: '1.5px solid #bbf7d0',
                        padding: '24px',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#15803d', marginBottom: '4px' }}>
                        Hóa đơn này đã hoàn tất thanh toán
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '16px' }}>
                        Thời gian thanh toán: {selectedInvoice.paidAt} | Thu ngân: {selectedInvoice.cashierName}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenPrintModal(selectedInvoice.id)}
                          style={{
                            padding: '10px 20px',
                            background: '#087f8c',
                            color: '#ffffff',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          In lại hóa đơn viện phí
                        </button>
                        {(isManager || isCashier) && (
                          <button
                            type="button"
                            onClick={() => openRefundModal(selectedInvoice)}
                            style={{
                              padding: '10px 20px',
                              background: '#fef2f2',
                              color: '#b91c1c',
                              border: '1px solid #fecaca',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Hoàn tiền viện phí
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* NỘI DUNG TAB 2: QUẢN LÝ DANH SÁCH HÓA ĐƠN & HOÀN TIỀN             */}
        {/* ================================================================= */}
        {activeTab === 'invoices' && (
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={searchInvoiceKeyword}
                  onChange={e => setSearchInvoiceKeyword(e.target.value)}
                  placeholder="Tìm mã hóa đơn, tên bệnh nhân..."
                  className="form-control"
                  style={{ width: '280px', padding: '8px 12px', fontSize: '13px' }}
                />
                <button
                  onClick={loadInvoices}
                  style={{
                    padding: '8px 16px',
                    background: '#0f172a',
                    color: '#ffffff',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Tìm kiếm
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Trạng thái:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="form-control"
                  style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 600 }}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PAID">Đã thanh toán</option>
                  <option value="UNPAID">Chưa thanh toán</option>
                  <option value="REFUNDED">Đã hoàn tiền</option>
                  <option value="CANCELLED">Đã hủy bỏ</option>
                </select>
              </div>
            </div>

            {/* Bảng hóa đơn */}
            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                    <th style={{ padding: '12px' }}>Mã hóa đơn</th>
                    <th style={{ padding: '12px' }}>Bệnh nhân</th>
                    <th style={{ padding: '12px' }}>Ngày tạo</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Tổng tiền</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>BHYT chi trả</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Thực thu</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingInvoicesList ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                        Đang tải danh sách hóa đơn viện phí...
                      </td>
                    </tr>
                  ) : invoicesList.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                        Không tìm thấy hóa đơn viện phí nào phù hợp
                      </td>
                    </tr>
                  ) : (
                    invoicesList.map(inv => {
                      const badge = getStatusBadge(inv.status)
                      return (
                        <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px', fontWeight: 800, color: '#0f172a' }}>{inv.invoiceCode}</td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{inv.patientName}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{inv.patientCode}</div>
                          </td>
                          <td style={{ padding: '12px', color: '#475569' }}>{inv.createdAt}</td>
                          <td style={{ padding: '12px', textAlign: 'right', color: '#475569', fontWeight: 600 }}>
                            {formatCurrency((inv.totalServiceAmount || 0) + (inv.totalMedicineAmount || 0))}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', color: '#15803d', fontWeight: 700 }}>
                            {formatCurrency(inv.insurancePaidAmount)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                            {formatCurrency(inv.finalAmount)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                              {badge.label}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button
                              onClick={() => handleSelectInvoiceFromList(inv.id)}
                              style={{ background: 'none', border: 'none', color: '#087f8c', fontWeight: 700, cursor: 'pointer', marginRight: '10px' }}
                            >
                              Chi tiết
                            </button>
                            <button
                              onClick={() => handleOpenPrintModal(inv.id)}
                              style={{ background: 'none', border: 'none', color: '#475569', fontWeight: 600, cursor: 'pointer', marginRight: '10px' }}
                            >
                              In
                            </button>
                            {(inv.status === 'PAID' || inv.status === 'UNPAID') && (
                              <button
                                onClick={() => openRefundModal(inv)}
                                style={{ background: 'none', border: 'none', color: '#b91c1c', fontWeight: 600, cursor: 'pointer' }}
                              >
                                {inv.status === 'PAID' ? 'Hoàn tiền' : 'Hủy'}
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* NỘI DUNG TAB 3: LỊCH SỬ GIAO DỊCH & BÁO CÁO DOANH THU             */}
        {/* ================================================================= */}
        {activeTab === 'transactions' && (
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  Nhật ký giao dịch tài chính viện phí
                </h2>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Toàn bộ các lần thực thu, chuyển khoản và hoàn trả viện phí
                </div>
              </div>
              <button
                onClick={() => {
                  loadPayments()
                  loadBillingStats()
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#334155',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Làm mới
              </button>
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                    <th style={{ padding: '12px' }}>Mã giao dịch</th>
                    <th style={{ padding: '12px' }}>Mã hóa đơn</th>
                    <th style={{ padding: '12px' }}>Bệnh nhân</th>
                    <th style={{ padding: '12px' }}>Thu ngân</th>
                    <th style={{ padding: '12px' }}>Hình thức</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Số tiền GD</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ padding: '12px' }}>Thời gian</th>
                    <th style={{ padding: '12px' }}>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingPayments ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                        Đang tải nhật ký giao dịch...
                      </td>
                    </tr>
                  ) : paymentsList.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                        Chưa ghi nhận giao dịch thanh toán nào
                      </td>
                    </tr>
                  ) : (
                    paymentsList.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', fontWeight: 800, color: '#0f172a' }}>{p.paymentCode}</td>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#087f8c' }}>{p.invoiceCode}</td>
                        <td style={{ padding: '12px', color: '#0f172a', fontWeight: 600 }}>{p.patientName || '---'}</td>
                        <td style={{ padding: '12px', color: '#475569' }}>{p.cashierName || 'Thu ngân'}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: '#f1f5f9', color: '#334155' }}>
                            {p.paymentMethodLabel || p.paymentMethod}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '12px',
                            textAlign: 'right',
                            fontWeight: 800,
                            color: p.amount < 0 ? '#b91c1c' : '#0f172a'
                          }}
                        >
                          {formatCurrency(p.amount)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: p.status === 'SUCCESS' ? '#dcfce7' : p.status === 'REFUNDED' ? '#f3e8ff' : '#fee2e2',
                              color: p.status === 'SUCCESS' ? '#15803d' : p.status === 'REFUNDED' ? '#7e22ce' : '#b91c1c'
                            }}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#64748b' }}>{p.paymentTime}</td>
                        <td style={{ padding: '12px', color: '#475569', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.note || '---'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* NỘI DUNG TAB 4: BẢNG GIÁ DỊCH VỤ (UC-TT07)                         */}
        {/* ================================================================= */}
        {activeTab === 'services' && (
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  Danh mục bảng giá dịch vụ y tế CarePlus
                </h2>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Bảng giá niêm yết các gói khám, cận lâm sàng, chẩn đoán hình ảnh và tỷ lệ BHYT
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="text"
                  value={searchServiceKeyword}
                  onChange={e => setSearchServiceKeyword(e.target.value)}
                  placeholder="Tìm kiếm dịch vụ..."
                  className="form-control"
                  style={{ width: '220px', padding: '8px 12px', fontSize: '13px' }}
                />
                <button
                  onClick={loadServices}
                  style={{
                    padding: '8px 16px',
                    background: '#0f172a',
                    color: '#ffffff',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Tìm
                </button>
                {isManager && (
                  <button
                    onClick={openNewServiceModal}
                    style={{
                      padding: '8px 16px',
                      background: '#087f8c',
                      color: '#ffffff',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Thêm dịch vụ
                  </button>
                )}
              </div>
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                    <th style={{ padding: '12px' }}>Mã dịch vụ</th>
                    <th style={{ padding: '12px' }}>Tên dịch vụ</th>
                    <th style={{ padding: '12px' }}>Nhóm dịch vụ</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Đơn giá niêm yết</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>BHYT chi trả</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingServices ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                        Đang tải bảng giá dịch vụ...
                      </td>
                    </tr>
                  ) : servicesList.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                        Không có dịch vụ y tế nào
                      </td>
                    </tr>
                  ) : (
                    servicesList.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', fontWeight: 800, color: '#0f172a' }}>{s.serviceCode}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{s.serviceName}</div>
                          {s.description && <div style={{ fontSize: '11px', color: '#64748b' }}>{s.description}</div>}
                        </td>
                        <td style={{ padding: '12px', color: '#475569' }}>{s.departmentName || s.serviceType}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: '#087f8c' }}>
                          {formatCurrency(s.unitPrice)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: '#e0f2fe', color: '#0369a1' }}>
                            {s.insuranceCoverageRate ? `${s.insuranceCoverageRate}%` : 'Không'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: s.isActive ? '#dcfce7' : '#f1f5f9',
                              color: s.isActive ? '#15803d' : '#64748b'
                            }}
                          >
                            {s.isActive ? 'Đang áp dụng' : 'Ngừng áp dụng'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          {isManager ? (
                            <button
                              onClick={() => openEditServiceModal(s)}
                              style={{ background: 'none', border: 'none', color: '#087f8c', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Sửa giá
                            </button>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '11.5px' }}>Chỉ xem</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODAL HOÀN TIỀN / HỦY HÓA ĐƠN                                    */}
        {/* ================================================================= */}
        {refundModalOpen && refundTargetInvoice && (
          <div className="modal-backdrop">
            <div className="modal-card" style={{ maxWidth: '460px' }}>
              <div className="modal-header">
                <h3>
                  {refundTargetInvoice.status === 'PAID' ? 'Xác nhận hoàn tiền viện phí' : 'Xác nhận hủy hóa đơn'}
                </h3>
                <button onClick={() => setRefundModalOpen(false)} className="modal-close">&times;</button>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12.5px', marginBottom: '16px' }}>
                <div><span style={{ color: '#64748b' }}>Mã hóa đơn:</span> <strong style={{ color: '#0f172a' }}>{refundTargetInvoice.invoiceCode}</strong></div>
                <div style={{ marginTop: '4px' }}><span style={{ color: '#64748b' }}>Bệnh nhân:</span> <strong style={{ color: '#0f172a' }}>{refundTargetInvoice.patientName}</strong></div>
                <div style={{ marginTop: '4px' }}><span style={{ color: '#64748b' }}>Số tiền:</span> <strong style={{ color: '#b91c1c' }}>{formatCurrency(refundTargetInvoice.finalAmount)}</strong></div>
              </div>

              <form onSubmit={handleConfirmRefund}>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Lý do hủy hoặc hoàn tiền (bắt buộc)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={refundReason}
                    onChange={e => setRefundReason(e.target.value)}
                    placeholder="VD: Bệnh nhân đổi ý không làm xét nghiệm, Bác sĩ chỉ định hủy bớt dịch vụ..."
                    className="form-control"
                    style={{ fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setRefundModalOpen(false)}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#334155', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={processingRefund}
                    style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#b91c1c', color: '#ffffff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {processingRefund ? 'Đang xử lý...' : 'Xác nhận thực hiện'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODAL THÊM / SỬA GIÁ DỊCH VỤ                                     */}
        {/* ================================================================= */}
        {serviceModalOpen && (
          <div className="modal-backdrop">
            <div className="modal-card" style={{ maxWidth: '520px' }}>
              <div className="modal-header">
                <h3>{editingService.id ? 'Chỉnh sửa đơn giá dịch vụ y tế' : 'Thêm mới dịch vụ y tế'}</h3>
                <button onClick={() => setServiceModalOpen(false)} className="modal-close">&times;</button>
              </div>

              <form onSubmit={handleSaveServicePrice}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Mã dịch vụ</label>
                    <input
                      type="text"
                      required
                      value={editingService.serviceCode}
                      onChange={e => setEditingService({ ...editingService, serviceCode: e.target.value })}
                      className="form-control"
                      style={{ padding: '8px 12px', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Nhóm dịch vụ</label>
                    <select
                      value={editingService.serviceType}
                      onChange={e => setEditingService({ ...editingService, serviceType: e.target.value })}
                      className="form-control"
                      style={{ padding: '8px 12px', fontSize: '13px' }}
                    >
                      <option value="Dịch vụ khám">Dịch vụ khám lâm sàng</option>
                      <option value="Xét nghiệm">Xét nghiệm huyết học / Hóa sinh</option>
                      <option value="Chẩn đoán hình ảnh">Chẩn đoán hình ảnh (X-Quang, Siêu âm)</option>
                      <option value="Thăm dò chức năng">Thăm dò chức năng</option>
                      <option value="Thủ thuật">Thủ thuật y khoa</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Tên dịch vụ y tế</label>
                  <input
                    type="text"
                    required
                    value={editingService.serviceName}
                    onChange={e => setEditingService({ ...editingService, serviceName: e.target.value })}
                    placeholder="VD: Khám Nội tổng quát, Siêu âm Doppler tim màu..."
                    className="form-control"
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Đơn giá niêm yết (đ)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={editingService.unitPrice}
                      onChange={e => setEditingService({ ...editingService, unitPrice: parseFloat(e.target.value) || 0 })}
                      className="form-control"
                      style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 800 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Tỷ lệ BHYT thanh toán (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="5"
                      value={editingService.insuranceCoverageRate || 0}
                      onChange={e => setEditingService({ ...editingService, insuranceCoverageRate: parseFloat(e.target.value) || 0 })}
                      className="form-control"
                      style={{ padding: '8px 12px', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Mô tả / ghi chú</label>
                  <textarea
                    rows={2}
                    value={editingService.description || ''}
                    onChange={e => setEditingService({ ...editingService, description: e.target.value })}
                    className="form-control"
                    style={{ fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                  <input
                    type="checkbox"
                    id="serviceActive"
                    checked={editingService.isActive !== false}
                    onChange={e => setEditingService({ ...editingService, isActive: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#087f8c' }}
                  />
                  <label htmlFor="serviceActive" style={{ fontSize: '12.5px', color: '#334155', fontWeight: 600 }}>
                    Kích hoạt dịch vụ này trên bảng giá hệ thống
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setServiceModalOpen(false)}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#334155', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={savingService}
                    style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#087f8c', color: '#ffffff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {savingService ? 'Đang lưu...' : 'Lưu dịch vụ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODAL IN PHIẾU THU / HÓA ĐƠN A4                                   */}
        {/* ================================================================= */}
        {printModalOpen && printData && (
          <div className="modal-backdrop">
            <div className="modal-card" style={{ maxWidth: '680px', padding: '32px' }}>
              <div id="printArea" style={{ color: '#0f172a' }}>
                {/* Header phòng khám */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '14px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '0.5px' }}>
                      PHÒNG KHÁM ĐA KHOA QUỐC TẾ CAREPLUS
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                      Địa chỉ: 107 Tân Hải, Phường 13, Quận Tân Bình, TP. Hồ Chí Minh
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569' }}>
                      Hotline: 1800 6116 | Email: info@careplusvn.com
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>MÃ HÓA ĐƠN</div>
                    <div style={{ fontSize: '16px', fontWeight: 900 }}>{printData.invoiceCode}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{printData.printDate}</div>
                  </div>
                </div>

                {/* Tiêu đề */}
                <div style={{ textAlign: 'center', margin: '14px 0 16px' }}>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, textTransform: 'uppercase' }}>
                    HÓA ĐƠN VIỆN PHÍ KIÊM PHIẾU THU TIỀN
                  </h2>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                    (Bản điện tử lưu thông nội bộ và đối soát bảo hiểm y tế)
                  </div>
                </div>

                {/* Bệnh nhân info */}
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '6px',
                    fontSize: '12px',
                    marginBottom: '14px'
                  }}
                >
                  <div><span style={{ color: '#64748b' }}>Họ và tên bệnh nhân:</span> <strong>{printData.patientName}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Mã bệnh nhân:</span> <strong>{printData.patientCode}</strong></div>
                  <div>
                    <span style={{ color: '#64748b' }}>Giới tính:</span> <strong>{printData.patientGender}</strong>
                    {printData.patientAge && <span style={{ marginLeft: '12px', color: '#64748b' }}>Tuổi: <strong>{printData.patientAge}</strong></span>}
                  </div>
                  <div><span style={{ color: '#64748b' }}>Số điện thoại:</span> <strong>{printData.patientPhone || '---'}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Thẻ BHYT:</span> <strong>{printData.healthInsuranceNumber || 'Không có BHYT'}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Bác sĩ khám:</span> <strong>{printData.doctorName || '---'}</strong></div>
                  <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#64748b' }}>Chẩn đoán:</span> <strong>{printData.diagnosis || '---'}</strong></div>
                </div>

                {/* Table items */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden', marginBottom: '14px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', fontWeight: 800 }}>
                        <th style={{ padding: '8px', textAlign: 'center', width: '36px' }}>STT</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Nội dung chi phí</th>
                        <th style={{ padding: '8px', textAlign: 'center', width: '48px' }}>SL</th>
                        <th style={{ padding: '8px', textAlign: 'right', width: '90px' }}>Đơn giá</th>
                        <th style={{ padding: '8px', textAlign: 'right', width: '100px' }}>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printData.items && printData.items.map((it, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '8px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                          <td style={{ padding: '8px', fontWeight: 600 }}>{it.itemName}</td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>{it.quantity}</td>
                          <td style={{ padding: '8px', textAlign: 'right', color: '#475569' }}>{formatCurrency(it.unitPrice)}</td>
                          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(it.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Tổng kết */}
                <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '5px', borderTop: '1px solid #cbd5e1', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>Tổng tiền dịch vụ y tế:</span>
                    <strong>{formatCurrency(printData.totalServiceAmount)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>Tổng tiền thuốc theo đơn:</span>
                    <strong>{formatCurrency(printData.totalMedicineAmount)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d' }}>
                    <span>Bảo hiểm y tế chi trả:</span>
                    <strong>- {formatCurrency(printData.insurancePaidAmount)}</strong>
                  </div>
                  {printData.discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b91c1c' }}>
                      <span>Giảm giá / Ưu đãi:</span>
                      <strong>- {formatCurrency(printData.discountAmount)}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #0f172a', paddingTop: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 900 }}>TỔNG TIỀN NGƯỜI BỆNH PHẢI NỘP:</span>
                    <span style={{ fontSize: '16px', fontWeight: 900, color: '#087f8c' }}>{formatCurrency(printData.finalAmount)}</span>
                  </div>
                  <div style={{ fontStyle: 'italic', color: '#475569', marginTop: '2px' }}>
                    Số tiền viết bằng chữ: <strong>{printData.amountInWords}</strong>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Hình thức: <strong>{printData.paymentMethod}</strong> | Trạng thái: <strong style={{ color: '#15803d' }}>{printData.paymentStatus}</strong>
                  </div>
                </div>

                {/* Chữ ký */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center', marginTop: '28px', fontSize: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 800, textTransform: 'uppercase' }}>Người nộp tiền</div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', fontStyle: 'italic' }}>(Ký và ghi rõ họ tên)</div>
                    <div style={{ height: '56px' }}></div>
                    <div style={{ fontWeight: 700 }}>{printData.patientName}</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, textTransform: 'uppercase' }}>Người thu tiền</div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', fontStyle: 'italic' }}>(Ký và ghi rõ họ tên)</div>
                    <div style={{ height: '56px' }}></div>
                    <div style={{ fontWeight: 700 }}>{printData.cashierName}</div>
                  </div>
                </div>
              </div>

              {/* Nút modal footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setPrintModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#334155', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Đóng lại
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#087f8c', color: '#ffffff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  In hóa đơn ra máy in
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BillingPaymentPage
