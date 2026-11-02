import React, { useState, useEffect } from 'react'
import type {
  MedicineItem,
  MedicineBatchItem,
  PrescriptionItem,
  StockAlertOverview,
  SupplierItem,
  StockTransactionItem,
  PrescriptionPrintData
} from '../types'

interface PharmacyInventoryPageProps {
  currentUser?: {
    username?: string
    role?: string
    roles?: string[]
    name?: string
    id?: number
  } | null
}

interface MedicineCategoryItem {
  id: number
  code: string
  name: string
  description?: string
  displayOrder?: number
  isActive: boolean
}

export const PharmacyInventoryPage: React.FC<PharmacyInventoryPageProps> = ({ currentUser }) => {
  // Tabs: 6 phân hệ nghiệp vụ dược & kho
  const [activeTab, setActiveTab] = useState<
    'dispense' | 'medicines' | 'import' | 'audit_alerts' | 'suppliers' | 'transactions'
  >('dispense')

  // Thông báo
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const showAlert = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setAlertMessage({ text, type })
    setTimeout(() => {
      setAlertMessage(null)
    }, 4500)
  }

  // =========================================================================
  // 1. CẤP PHÁT THUỐC THEO ĐƠN (UC-DT04 & UC-DT03)
  // =========================================================================
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([])
  const [prescriptionFilter, setPrescriptionFilter] = useState<string>('')
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionItem | null>(null)
  const [loadingPrescriptions, setLoadingPrescriptions] = useState<boolean>(false)
  const [dispenseNotes, setDispenseNotes] = useState<string>('')
  const [dispensing, setDispensing] = useState<boolean>(false)

  // In đơn thuốc modal
  const [printModalOpen, setPrintModalOpen] = useState<boolean>(false)
  const [printData, setPrintData] = useState<PrescriptionPrintData | null>(null)
  const [loadingPrint, setLoadingPrint] = useState<boolean>(false)

  // =========================================================================
  // 2. QUẢN LÝ DANH MỤC THUỐC (UC-DT05)
  // =========================================================================
  const [medicines, setMedicines] = useState<MedicineItem[]>([])
  const [categories, setCategories] = useState<MedicineCategoryItem[]>([])
  const [medicineSearchQuery, setMedicineSearchQuery] = useState<string>('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('')
  const [loadingMedicines, setLoadingMedicines] = useState<boolean>(false)

  // Modal Thêm/Sửa thuốc
  const [medicineModalOpen, setMedicineModalOpen] = useState<boolean>(false)
  const [editingMedicine, setEditingMedicine] = useState<MedicineItem | null>(null)
  const [medicineForm, setMedicineForm] = useState({
    code: '',
    brandName: '',
    activeIngredient: '',
    categoryId: 0,
    dosageForm: 'Viên nén',
    unit: 'Viên',
    sellingPrice: 0,
    usageInstructions: 'Uống sau bữa ăn no',
    isPrescriptionRequired: true,
    contraindications: '',
    isActive: true
  })

  // =========================================================================
  // 3. NHẬP KHO THUỐC (UC-DT06)
  // =========================================================================
  const [importForm, setImportForm] = useState({
    medicineId: 0,
    batchNumber: '',
    manufactureDate: '',
    expiryDate: '',
    supplierId: 0,
    quantityImported: 100,
    importPrice: 0,
    note: ''
  })
  const [submittingImport, setSubmittingImport] = useState<boolean>(false)

  // =========================================================================
  // 4. KIỂM KÊ TỒN KHO & CẢNH BÁO (UC-DT07 & UC-DT08)
  // =========================================================================
  const [stockAlerts, setStockAlerts] = useState<StockAlertOverview | null>(null)
  const [batches, setBatches] = useState<MedicineBatchItem[]>([])
  const [selectedBatchForAudit, setSelectedBatchForAudit] = useState<MedicineBatchItem | null>(null)
  const [auditModalOpen, setAuditModalOpen] = useState<boolean>(false)
  const [auditForm, setAuditForm] = useState({
    actualQuantity: 0,
    reason: 'Kiểm kê định kỳ tháng'
  })
  const [loadingAudit, setLoadingAudit] = useState<boolean>(false)

  // =========================================================================
  // 5. QUẢN LÝ NHÀ CUNG CẤP (UC-DT09)
  // =========================================================================
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([])
  const [supplierModalOpen, setSupplierModalOpen] = useState<boolean>(false)
  const [editingSupplier, setEditingSupplier] = useState<SupplierItem | null>(null)
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    taxCode: '',
    phone: '',
    email: '',
    address: '',
    isActive: true
  })

  // =========================================================================
  // 6. LỊCH SỬ XUẤT NHẬP TỒN (UC-DT10)
  // =========================================================================
  const [transactions, setTransactions] = useState<StockTransactionItem[]>([])
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>('')
  const [dateRange, setDateRange] = useState({
    fromDate: '',
    toDate: ''
  })
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(false)

  // Initial Load
  useEffect(() => {
    loadCategories()
    loadSuppliers()
    loadMedicines()
    loadPrescriptions(prescriptionFilter)
  }, [])

  // Chuyển tab tải dữ liệu tương ứng
  useEffect(() => {
    if (activeTab === 'dispense') {
      loadPrescriptions(prescriptionFilter)
    } else if (activeTab === 'medicines') {
      loadMedicines()
    } else if (activeTab === 'audit_alerts') {
      loadAlertsAndBatches()
    } else if (activeTab === 'suppliers') {
      loadSuppliers()
    } else if (activeTab === 'transactions') {
      loadTransactions()
    }
  }, [activeTab])

  // =========================================================================
  // LOADERS & ACTIONS
  // =========================================================================
  const loadCategories = async () => {
    try {
      const res = await fetch('/api/pharmacy/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch {
      // ignore
    }
  }

  const loadSuppliers = async () => {
    try {
      const res = await fetch('/api/pharmacy/suppliers')
      if (res.ok) {
        const data = await res.json()
        setSuppliers(data)
        if (data.length > 0 && importForm.supplierId === 0) {
          setImportForm(prev => ({ ...prev, supplierId: data[0].id }))
        }
      }
    } catch {
      // ignore
    }
  }

  const loadMedicines = async (query?: string, catId?: string) => {
    setLoadingMedicines(true)
    try {
      const params = new URLSearchParams()
      if (query !== undefined ? query : medicineSearchQuery) {
        params.append('query', query !== undefined ? query : medicineSearchQuery)
      }
      if (catId !== undefined ? catId : selectedCategoryFilter) {
        params.append('categoryId', catId !== undefined ? catId : selectedCategoryFilter)
      }
      const res = await fetch(`/api/pharmacy/medicines?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setMedicines(data)
        if (data.length > 0 && importForm.medicineId === 0) {
          setImportForm(prev => ({ ...prev, medicineId: data[0].id, importPrice: data[0].sellingPrice }))
        }
      }
    } catch {
      showAlert('Không thể tải danh sách thuốc', 'error')
    } finally {
      setLoadingMedicines(false)
    }
  }

  const loadPrescriptions = async (status?: string) => {
    setLoadingPrescriptions(true)
    try {
      const param = status ? `?status=${status}` : ''
      const res = await fetch(`/api/pharmacy/prescriptions${param}`)
      if (res.ok) {
        const data: PrescriptionItem[] = await res.json()
        setPrescriptions(data)
        if (data.length > 0) {
          setSelectedPrescription(data[0])
        } else {
          setSelectedPrescription(null)
        }
      }
    } catch {
      showAlert('Không thể tải danh sách đơn thuốc', 'error')
    } finally {
      setLoadingPrescriptions(false)
    }
  }

  const loadAlertsAndBatches = async () => {
    try {
      const [alertRes, batchRes] = await Promise.all([
        fetch('/api/pharmacy/alerts'),
        fetch('/api/pharmacy/batches')
      ])
      if (alertRes.ok) {
        const alertData: StockAlertOverview = await alertRes.json()
        setStockAlerts(alertData)
      }
      if (batchRes.ok) {
        const batchData = await batchRes.json()
        setBatches(batchData)
      }
    } catch {
      showAlert('Không thể tải dữ liệu kiểm kê và cảnh báo', 'error')
    }
  }

  const loadTransactions = async () => {
    setLoadingTransactions(true)
    try {
      const params = new URLSearchParams()
      if (transactionTypeFilter) params.append('type', transactionTypeFilter)
      if (dateRange.fromDate) params.append('fromDate', dateRange.fromDate)
      if (dateRange.toDate) params.append('toDate', dateRange.toDate)
      const res = await fetch(`/api/pharmacy/transactions?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setTransactions(data)
      }
    } catch {
      showAlert('Không thể tải nhật ký nhập xuất', 'error')
    } finally {
      setLoadingTransactions(false)
    }
  }

  // =========================================================================
  // XỬ LÝ CẤP PHÁT THUỐC (UC-DT04)
  // =========================================================================
  const handleDispense = async () => {
    if (!selectedPrescription) return
    setDispensing(true)
    try {
      const pharmacistId = currentUser?.id || 1
      const payload = {
        prescriptionId: selectedPrescription.id,
        pharmacistId: pharmacistId,
        note: dispenseNotes || 'Đã cấp phát đúng số lượng và hướng dẫn sử dụng'
      }
      const res = await fetch('/api/pharmacy/dispensations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        showAlert(`Đã hoàn tất cấp phát đơn thuốc ${selectedPrescription.prescriptionCode}! Kho đã được tự động trừ theo FEFO.`)
        setDispenseNotes('')
        loadPrescriptions(prescriptionFilter)
      } else {
        const errJson = await res.json().catch(() => null)
        showAlert(errJson?.message || 'Lỗi khi cấp phát thuốc', 'error')
      }
    } catch {
      showAlert('Lỗi kết nối khi cấp phát thuốc', 'error')
    } finally {
      setDispensing(false)
    }
  }

  // =========================================================================
  // XỬ LÝ IN ĐƠN THUỐC (UC-DT03)
  // =========================================================================
  const handleOpenPrintPreview = async (prescriptionId: number) => {
    setLoadingPrint(true)
    try {
      const res = await fetch(`/api/pharmacy/prescriptions/${prescriptionId}/print`)
      if (res.ok) {
        const data: PrescriptionPrintData = await res.json()
        setPrintData(data)
        setPrintModalOpen(true)
      } else {
        showAlert('Không thể tải thông tin in đơn thuốc', 'error')
      }
    } catch {
      showAlert('Lỗi khi tải dữ liệu in đơn thuốc', 'error')
    } finally {
      setLoadingPrint(false)
    }
  }

  // =========================================================================
  // XỬ LÝ LƯU THUỐC (UC-DT05)
  // =========================================================================
  const handleSaveMedicine = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...medicineForm,
        id: editingMedicine ? editingMedicine.id : null,
        categoryId: Number(medicineForm.categoryId) || null,
        sellingPrice: Number(medicineForm.sellingPrice) || 0
      }
      const res = await fetch('/api/pharmacy/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        showAlert(editingMedicine ? 'Đã cập nhật thuốc thành công' : 'Đã thêm thuốc mới thành công')
        setMedicineModalOpen(false)
        loadMedicines()
      } else {
        const err = await res.json().catch(() => null)
        showAlert(err?.message || 'Không thể lưu thông tin thuốc', 'error')
      }
    } catch {
      showAlert('Lỗi kết nối khi lưu thuốc', 'error')
    }
  }

  const openEditMedicine = (med: MedicineItem) => {
    setEditingMedicine(med)
    setMedicineForm({
      code: med.code,
      brandName: med.brandName,
      activeIngredient: med.activeIngredient,
      categoryId: med.categoryId || 0,
      dosageForm: med.dosageForm || 'Viên nén',
      unit: med.unit || 'Viên',
      sellingPrice: med.sellingPrice,
      usageInstructions: med.usageInstructions || 'Uống sau bữa ăn no',
      isPrescriptionRequired: med.isPrescriptionRequired,
      contraindications: med.contraindications || '',
      isActive: med.isActive
    })
    setMedicineModalOpen(true)
  }

  const openCreateMedicine = () => {
    setEditingMedicine(null)
    setMedicineForm({
      code: `MED-${Date.now().toString().slice(-5)}`,
      brandName: '',
      activeIngredient: '',
      categoryId: categories.length > 0 ? categories[0].id : 0,
      dosageForm: 'Viên nén',
      unit: 'Viên',
      sellingPrice: 0,
      usageInstructions: 'Uống sau bữa ăn no',
      isPrescriptionRequired: true,
      contraindications: '',
      isActive: true
    })
    setMedicineModalOpen(true)
  }

  // =========================================================================
  // XỬ LÝ NHẬP KHO (UC-DT06)
  // =========================================================================
  const handleImportStock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importForm.medicineId || !importForm.batchNumber || !importForm.expiryDate) {
      showAlert('Vui lòng điền đủ thuốc, số lô và hạn sử dụng', 'error')
      return
    }
    setSubmittingImport(true)
    try {
      const pharmacistId = currentUser?.id || 1
      const payload = {
        medicineId: Number(importForm.medicineId),
        supplierId: importForm.supplierId ? Number(importForm.supplierId) : null,
        batchNumber: importForm.batchNumber.trim().toUpperCase(),
        manufactureDate: importForm.manufactureDate || null,
        expiryDate: importForm.expiryDate,
        quantityImported: Number(importForm.quantityImported),
        importPrice: Number(importForm.importPrice),
        pharmacistId: pharmacistId,
        note: importForm.note
      }
      const res = await fetch('/api/pharmacy/batches/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        showAlert(`Đã nhập kho thành công lô ${importForm.batchNumber}! Tồn kho đã tăng thêm ${importForm.quantityImported}.`)
        setImportForm(prev => ({
          ...prev,
          batchNumber: '',
          quantityImported: 100,
          note: ''
        }))
        loadMedicines()
      } else {
        const err = await res.json().catch(() => null)
        showAlert(err?.message || 'Không thể nhập kho lô thuốc', 'error')
      }
    } catch {
      showAlert('Lỗi khi nhập kho thuốc', 'error')
    } finally {
      setSubmittingImport(false)
    }
  }

  // =========================================================================
  // XỬ LÝ KIỂM KÊ (UC-DT07)
  // =========================================================================
  const handleAuditStock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBatchForAudit) return
    setLoadingAudit(true)
    try {
      const pharmacistId = currentUser?.id || 1
      const payload = {
        batchId: selectedBatchForAudit.id,
        actualQuantity: Number(auditForm.actualQuantity),
        reason: auditForm.reason,
        pharmacistId: pharmacistId
      }
      const res = await fetch('/api/pharmacy/batches/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        showAlert(`Đã kiểm kê và điều chỉnh số lượng lô ${selectedBatchForAudit.batchNumber} thành công!`)
        setAuditModalOpen(false)
        loadAlertsAndBatches()
      } else {
        const err = await res.json().catch(() => null)
        showAlert(err?.message || 'Lỗi khi kiểm kê tồn kho', 'error')
      }
    } catch {
      showAlert('Lỗi kết nối khi kiểm kê', 'error')
    } finally {
      setLoadingAudit(false)
    }
  }

  const openAuditModal = (b: MedicineBatchItem) => {
    setSelectedBatchForAudit(b)
    setAuditForm({
      actualQuantity: b.quantityAvailable,
      reason: 'Kiểm kê định kỳ tháng'
    })
    setAuditModalOpen(true)
  }

  // =========================================================================
  // XỬ LÝ NHÀ CUNG CẤP (UC-DT09)
  // =========================================================================
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...supplierForm,
        id: editingSupplier ? editingSupplier.id : null
      }
      const res = await fetch('/api/pharmacy/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        showAlert(editingSupplier ? 'Đã cập nhật nhà cung cấp' : 'Đã thêm nhà cung cấp mới')
        setSupplierModalOpen(false)
        loadSuppliers()
      } else {
        const err = await res.json().catch(() => null)
        showAlert(err?.message || 'Lỗi khi lưu nhà cung cấp', 'error')
      }
    } catch {
      showAlert('Lỗi kết nối khi lưu nhà cung cấp', 'error')
    }
  }

  const openEditSupplier = (sup: SupplierItem) => {
    setEditingSupplier(sup)
    setSupplierForm({
      name: sup.name,
      taxCode: sup.taxCode || '',
      phone: sup.phone || '',
      email: sup.email || '',
      address: sup.address || '',
      isActive: sup.isActive
    })
    setSupplierModalOpen(true)
  }

  const openCreateSupplier = () => {
    setEditingSupplier(null)
    setSupplierForm({
      name: '',
      taxCode: '',
      phone: '',
      email: '',
      address: '',
      isActive: true
    })
    setSupplierModalOpen(true)
  }

  const getPrescriptionStatusDesc = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return 'Chờ thanh toán / Chờ cấp phát'
      case 'PAID':
        return 'Đã thanh toán (Sẵn sàng cấp)'
      case 'DISPENSED':
        return 'Đã cấp phát'
      case 'CANCELLED':
        return 'Đã hủy'
      default:
        return status
    }
  }

  const getTransactionTypeDesc = (type: string) => {
    switch (type) {
      case 'IMPORT':
        return 'Nhập kho'
      case 'DISPENSE':
        return 'Cấp phát đơn'
      case 'AUDIT_ADJUSTMENT':
        return 'Kiểm kê điều chỉnh'
      case 'DISPOSE':
        return 'Xuất hủy'
      default:
        return type
    }
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '24px 20px 48px' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
        {/* BANNER HEADER */}
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
              <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a', fontWeight: 800 }}>
                Hệ Thống Nhà Thuốc & Quản Lý Kho Dược CarePlus
              </h1>
              <span
                style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  border: '1px solid #bbf7d0',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                Dược sĩ & Kho thuốc
              </span>
            </div>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13.5px' }}>
              Cấp phát thuốc theo đơn trừ kho FEFO, cảnh báo hạn dùng & tồn kho, quản lý danh mục, nhập kho theo lô và kiểm kê định kỳ
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>
              Dược sĩ phụ trách: <strong>{currentUser?.name || 'DS. Phạm Thị Nga'}</strong>
            </span>
          </div>
        </div>

        {/* THÔNG BÁO POPUP */}
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
              alignItems: 'center'
            }}
          >
            <span>{alertMessage.text}</span>
            <button
              onClick={() => setAlertMessage(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: 'inherit' }}
            >
              Đóng
            </button>
          </div>
        )}

        {/* THANH TABS 6 PHÂN HỆ */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '6px',
            display: 'flex',
            gap: '6px',
            marginBottom: '20px',
            overflowX: 'auto'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('dispense')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 750,
              cursor: 'pointer',
              background: activeTab === 'dispense' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'dispense' ? '#ffffff' : '#64748b',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            Cấp phát theo đơn (FEFO)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('medicines')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 750,
              cursor: 'pointer',
              background: activeTab === 'medicines' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'medicines' ? '#ffffff' : '#64748b',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            Danh mục thuốc
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('import')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 750,
              cursor: 'pointer',
              background: activeTab === 'import' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'import' ? '#ffffff' : '#64748b',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            Nhập kho theo lô
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit_alerts')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 750,
              cursor: 'pointer',
              background: activeTab === 'audit_alerts' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'audit_alerts' ? '#ffffff' : '#64748b',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            Kiểm kê & Cảnh báo tồn
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('suppliers')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 750,
              cursor: 'pointer',
              background: activeTab === 'suppliers' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'suppliers' ? '#ffffff' : '#64748b',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            Nhà cung cấp
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 750,
              cursor: 'pointer',
              background: activeTab === 'transactions' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'transactions' ? '#ffffff' : '#64748b',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            Lịch sử nhập - xuất
          </button>
        </div>

        {/* TAB 1: CẤP PHÁT THUỐC THEO ĐƠN (FEFO) */}
        {activeTab === 'dispense' && (
          <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '20px' }}>
            {/* CỘT TRÁI: DANH SÁCH ĐƠN THUỐC */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 750, color: '#0f172a' }}>
                  Danh sách đơn thuốc ({prescriptions.length})
                </h3>
                <select
                  value={prescriptionFilter}
                  onChange={e => {
                    setPrescriptionFilter(e.target.value)
                    loadPrescriptions(e.target.value)
                  }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    fontWeight: 650
                  }}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="PENDING_PAYMENT">Chờ thanh toán</option>
                  <option value="PAID">Đã thanh toán (Sẵn sàng cấp)</option>
                  <option value="DISPENSED">Đã cấp phát</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>

              {loadingPrescriptions ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Đang tải danh sách đơn thuốc...</div>
              ) : prescriptions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  Không có đơn thuốc nào phù hợp điều kiện lọc
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '680px', overflowY: 'auto' }}>
                  {prescriptions.map(p => {
                    const isSelected = selectedPrescription?.id === p.id
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPrescription(p)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: `1.5px solid ${isSelected ? 'var(--primary)' : '#e2e8f0'}`,
                          background: isSelected ? 'var(--soft)' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>
                            {p.patientName}
                          </span>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 750,
                              background:
                                p.status === 'PENDING_PAYMENT'
                                  ? '#fef3c7'
                                  : p.status === 'PAID'
                                  ? '#dbeafe'
                                  : p.status === 'DISPENSED'
                                  ? '#dcfce7'
                                  : '#fee2e2',
                              color:
                                p.status === 'PENDING_PAYMENT'
                                  ? '#b45309'
                                  : p.status === 'PAID'
                                  ? '#1d4ed8'
                                  : p.status === 'DISPENSED'
                                  ? '#15803d'
                                  : '#b91c1c'
                            }}
                          >
                            {getPrescriptionStatusDesc(p.status)}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          Mã đơn: <strong style={{ color: '#0f172a' }}>{p.prescriptionCode}</strong>
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                          BS: {p.doctorName} &bull; {p.items?.length || 0} loại thuốc &bull;{' '}
                          <strong style={{ color: '#059669' }}>{(p.totalAmount || 0).toLocaleString()} đ</strong>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* CỘT PHẢI: CHI TIẾT ĐƠN THUỐC & CẤP PHÁT FEFO */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}
            >
              {selectedPrescription ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                          Đơn thuốc: {selectedPrescription.prescriptionCode}
                        </h2>
                        <span
                          style={{
                            background:
                              selectedPrescription.status === 'PENDING_PAYMENT'
                                ? '#fef3c7'
                                : selectedPrescription.status === 'PAID'
                                ? '#dbeafe'
                                : selectedPrescription.status === 'DISPENSED'
                                ? '#dcfce7'
                                : '#fee2e2',
                            color:
                              selectedPrescription.status === 'PENDING_PAYMENT'
                                ? '#b45309'
                                : selectedPrescription.status === 'PAID'
                                ? '#1d4ed8'
                                : selectedPrescription.status === 'DISPENSED'
                                ? '#15803d'
                                : '#b91c1c',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 750
                          }}
                        >
                          {getPrescriptionStatusDesc(selectedPrescription.status)}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
                        Bệnh nhân: <strong>{selectedPrescription.patientName}</strong> &bull; Mã BN:{' '}
                        <strong>{selectedPrescription.patientCode}</strong> &bull; Bác sĩ kê:{' '}
                        <strong>{selectedPrescription.doctorName}</strong>
                      </div>
                      {selectedPrescription.diagnosis && (
                        <div style={{ fontSize: '13px', color: '#1e293b', marginTop: '4px' }}>
                          Chẩn đoán: <em>{selectedPrescription.diagnosis}</em>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenPrintPreview(selectedPrescription.id)}
                        disabled={loadingPrint}
                        style={{
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          color: '#0f172a',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        In đơn thuốc A4
                      </button>
                    </div>
                  </div>

                  {/* BẢNG CHI TIẾT THUỐC TRONG ĐƠN */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                          <th style={{ padding: '10px 12px', width: '40px' }}>STT</th>
                          <th style={{ padding: '10px 12px' }}>Tên thuốc / Hoạt chất</th>
                          <th style={{ padding: '10px 12px', width: '100px', textAlign: 'center' }}>Số lượng</th>
                          <th style={{ padding: '10px 12px', width: '90px' }}>Đơn vị</th>
                          <th style={{ padding: '10px 12px' }}>Cách dùng & Liều lượng</th>
                          <th style={{ padding: '10px 12px', width: '100px', textAlign: 'right' }}>Đơn giá</th>
                          <th style={{ padding: '10px 12px', width: '110px', textAlign: 'right' }}>Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPrescription.items.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <strong style={{ color: '#0f172a' }}>{item.brandName}</strong>
                              {item.activeIngredient && (
                                <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                                  Hoạt chất: {item.activeIngredient}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>
                              {item.quantity}
                            </td>
                            <td style={{ padding: '10px 12px', color: '#475569' }}>{item.unit}</td>
                            <td style={{ padding: '10px 12px', color: '#334155' }}>
                              <div>{item.instructions || 'Uống theo chỉ định của bác sĩ'}</div>
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: '#475569' }}>
                              {(item.unitPrice || 0).toLocaleString()} đ
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 750, color: '#059669' }}>
                              {(item.totalAmount || 0).toLocaleString()} đ
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#f8fafc', fontWeight: 800, color: '#0f172a' }}>
                          <td colSpan={6} style={{ padding: '12px', textAlign: 'right' }}>
                            Tổng tiền thuốc:
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', color: '#059669', fontSize: '15px' }}>
                            {(selectedPrescription.totalAmount || 0).toLocaleString()} đ
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* THÔNG TIN NGUYÊN TẮC FEFO */}
                  <div
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '10px',
                      padding: '14px 18px',
                      fontSize: '12.5px',
                      color: '#166534'
                    }}
                  >
                    <strong>Nguyên tắc xuất kho FEFO (First Expired, First Out):</strong> Khi nhấn xác nhận cấp phát,
                    hệ thống sẽ tự động tìm các lô thuốc còn hạn sử dụng gần nhất trong kho để xuất trừ dần số lượng tồn kho và ghi nhật ký giao dịch.
                  </div>

                  {/* KHU VỰC THAO TÁC CẤP PHÁT */}
                  {selectedPrescription.status !== 'DISPENSED' && selectedPrescription.status !== 'CANCELLED' ? (
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Ghi chú cấp phát & Hướng dẫn bệnh nhân:
                        </label>
                        <input
                          type="text"
                          value={dispenseNotes}
                          onChange={e => setDispenseNotes(e.target.value)}
                          placeholder="Ví dụ: Đã tư vấn uống sau ăn no, bảo quản thuốc nơi thoáng mát..."
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '13px'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={handleDispense}
                          disabled={dispensing}
                          style={{
                            background: '#10b981',
                            color: '#ffffff',
                            border: 'none',
                            padding: '10px 24px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)'
                          }}
                        >
                          {dispensing ? 'Đang xuất kho...' : 'Xác nhận cấp phát thuốc (Trừ kho FEFO)'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        background: '#f1f5f9',
                        borderRadius: '10px',
                        padding: '14px',
                        fontSize: '13px',
                        color: '#475569',
                        textAlign: 'center'
                      }}
                    >
                      Đơn thuốc này đã ở trạng thái <strong>{getPrescriptionStatusDesc(selectedPrescription.status)}</strong>.
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                  Vui lòng chọn một đơn thuốc từ danh sách bên trái để xem chi tiết và cấp phát
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: QUẢN LÝ DANH MỤC THUỐC */}
        {activeTab === 'medicines' && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Tìm theo tên thuốc, hoạt chất, mã thuốc..."
                  value={medicineSearchQuery}
                  onChange={e => {
                    setMedicineSearchQuery(e.target.value)
                    loadMedicines(e.target.value)
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    width: '320px'
                  }}
                />
                <select
                  value={selectedCategoryFilter}
                  onChange={e => {
                    setSelectedCategoryFilter(e.target.value)
                    loadMedicines(medicineSearchQuery, e.target.value)
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px'
                  }}
                >
                  <option value="">Tất cả nhóm thuốc</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={openCreateMedicine}
                style={{
                  background: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 750,
                  cursor: 'pointer'
                }}
              >
                + Thêm thuốc mới
              </button>
            </div>

            {loadingMedicines ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải danh mục thuốc...</div>
            ) : (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                      <th style={{ padding: '10px 12px', width: '100px' }}>Mã thuốc</th>
                      <th style={{ padding: '10px 12px' }}>Tên biệt dược & Hoạt chất</th>
                      <th style={{ padding: '10px 12px', width: '140px' }}>Nhóm thuốc</th>
                      <th style={{ padding: '10px 12px', width: '90px' }}>Đơn vị</th>
                      <th style={{ padding: '10px 12px', width: '110px', textAlign: 'right' }}>Giá bán</th>
                      <th style={{ padding: '10px 12px', width: '110px', textAlign: 'right' }}>Tồn kho</th>
                      <th style={{ padding: '10px 12px', width: '100px', textAlign: 'center' }}>Kê đơn</th>
                      <th style={{ padding: '10px 12px', width: '90px', textAlign: 'center' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicines.map(m => (
                      <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>{m.code}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <strong style={{ color: '#0f172a' }}>{m.brandName}</strong>
                          <div style={{ fontSize: '11.5px', color: '#64748b' }}>Hoạt chất: {m.activeIngredient}</div>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#475569' }}>{m.categoryName || '-'}</td>
                        <td style={{ padding: '10px 12px', color: '#475569' }}>{m.unit}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                          {(m.sellingPrice || 0).toLocaleString()} đ
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <span style={{ fontWeight: 800, color: (m.totalAvailableQuantity || 0) <= 20 ? '#dc2626' : '#0f172a' }}>
                            {m.totalAvailableQuantity || 0}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          {m.isPrescriptionRequired ? (
                            <span style={{ color: '#b91c1c', fontSize: '11px', fontWeight: 700, background: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>
                              Cần đơn
                            </span>
                          ) : (
                            <span style={{ color: '#15803d', fontSize: '11px', fontWeight: 700, background: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>
                              Tự do
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => openEditMedicine(m)}
                            style={{
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#1d4ed8',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Sửa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: NHẬP KHO THEO LÔ (UC-DT06) */}
        {activeTab === 'import' && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '28px',
              maxWidth: '900px',
              margin: '0 auto'
            }}
          >
            <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
              Phiếu Nhập Kho Thuốc Theo Lô
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#64748b' }}>
              Ghi nhận nhập hàng mới từ nhà cung cấp, thiết lập số lô, hạn sử dụng để phục vụ nguyên tắc xuất kho FEFO
            </p>

            <form onSubmit={handleImportStock} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Chọn thuốc nhập kho <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    value={importForm.medicineId}
                    onChange={e => {
                      const id = Number(e.target.value)
                      const med = medicines.find(m => m.id === id)
                      setImportForm(prev => ({
                        ...prev,
                        medicineId: id,
                        importPrice: med?.sellingPrice || 0
                      }))
                    }}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px'
                    }}
                  >
                    <option value={0}>-- Chọn thuốc --</option>
                    {medicines.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.code} - {m.brandName} ({m.activeIngredient})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Nhà cung cấp
                  </label>
                  <select
                    value={importForm.supplierId}
                    onChange={e => setImportForm(prev => ({ ...prev, supplierId: Number(e.target.value) }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px'
                    }}
                  >
                    <option value={0}>-- Chọn nhà cung cấp --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Số lô sản xuất <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: LOT-2026-X1"
                    value={importForm.batchNumber}
                    onChange={e => setImportForm(prev => ({ ...prev, batchNumber: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Ngày sản xuất
                  </label>
                  <input
                    type="date"
                    value={importForm.manufactureDate}
                    onChange={e => setImportForm(prev => ({ ...prev, manufactureDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Hạn sử dụng <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={importForm.expiryDate}
                    onChange={e => setImportForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Số lượng nhập <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={importForm.quantityImported}
                    onChange={e => setImportForm(prev => ({ ...prev, quantityImported: Number(e.target.value) }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Đơn giá nhập (VNĐ) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={importForm.importPrice}
                    onChange={e => setImportForm(prev => ({ ...prev, importPrice: Number(e.target.value) }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Ghi chú nhập kho
                </label>
                <input
                  type="text"
                  placeholder="VD: Kiểm tra bao bì nguyên vẹn, tem niêm phong đầy đủ"
                  value={importForm.note}
                  onChange={e => setImportForm(prev => ({ ...prev, note: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="submit"
                  disabled={submittingImport}
                  style={{
                    background: 'var(--primary)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '11px 28px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {submittingImport ? 'Đang ghi nhận...' : 'Xác nhận nhập kho thuốc'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: KIỂM KÊ TỒN KHO & CẢNH BÁO (UC-DT07 & UC-DT08) */}
        {activeTab === 'audit_alerts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* THẺ THỐNG KÊ CẢNH BÁO */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '18px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Thuốc sắp hết hàng</div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>
                  {stockAlerts?.lowStockCount || 0}
                </div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>Tồn kho &le; Mức tối thiểu</div>
              </div>

              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '18px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Lô thuốc cận hạn (&le; 90 ngày)</div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
                  {stockAlerts?.nearExpiryCount || 0}
                </div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>Cần ưu tiên xuất trước</div>
              </div>

              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '18px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Lô thuốc đã hết hạn</div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#7f1d1d', marginTop: '4px' }}>
                  {stockAlerts?.expiredCount || 0}
                </div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>Bắt buộc thu hồi / xuất hủy</div>
              </div>

              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '18px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Tổng số lô thuốc đang quản lý</div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  {batches.length}
                </div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>Phân bổ theo hạn dùng</div>
              </div>
            </div>

            {/* BẢNG CẢNH BÁO NGUY CƠ */}
            {stockAlerts && stockAlerts.alerts && stockAlerts.alerts.length > 0 && (
              <div
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '14px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#b45309' }}>
                  Danh sách cảnh báo cần xử lý ngay ({stockAlerts.alerts.length})
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
                  {stockAlerts.alerts.map((a, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#ffffff',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: `1px solid ${a.severity === 'CRITICAL' ? '#fca5a5' : '#fde68a'}`,
                        fontSize: '12.5px'
                      }}
                    >
                      <strong style={{ color: a.severity === 'CRITICAL' ? '#dc2626' : '#d97706' }}>
                        {a.brandName || 'Thuốc'}:
                      </strong>{' '}
                      <span>{a.message}</span>
                      <div style={{ color: '#64748b', marginTop: '4px', fontSize: '11.5px' }}>
                        Số lô: {a.batchNumber || '-'} &bull; Số lượng khả dụng: <strong>{a.quantityAvailable}</strong> {a.unit || ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BẢNG TẤT CẢ CÁC LÔ THUỐC VÀ KIỂM KÊ ĐIỀU CHỈNH */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Kiểm kê tồn kho theo từng lô thuốc
                </h3>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                      <th style={{ padding: '10px 12px' }}>Tên thuốc / Hoạt chất</th>
                      <th style={{ padding: '10px 12px', width: '120px' }}>Số lô</th>
                      <th style={{ padding: '10px 12px', width: '120px' }}>Hạn sử dụng</th>
                      <th style={{ padding: '10px 12px', width: '110px', textAlign: 'center' }}>Hạn dùng</th>
                      <th style={{ padding: '10px 12px', width: '100px', textAlign: 'right' }}>SL Nhập</th>
                      <th style={{ padding: '10px 12px', width: '100px', textAlign: 'right' }}>SL Khả dụng</th>
                      <th style={{ padding: '10px 12px', width: '110px', textAlign: 'right' }}>Giá nhập</th>
                      <th style={{ padding: '10px 12px', width: '130px', textAlign: 'center' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map(b => (
                      <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <strong style={{ color: '#0f172a' }}>{b.brandName || b.medicineCode}</strong>
                          {b.activeIngredient && (
                            <div style={{ fontSize: '11.5px', color: '#64748b' }}>Hoạt chất: {b.activeIngredient}</div>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>{b.batchNumber}</td>
                        <td style={{ padding: '10px 12px', color: '#334155' }}>{b.expiryDate}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          {b.isExpired ? (
                            <span style={{ color: '#7f1d1d', background: '#fee2e2', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                              Hết hạn
                            </span>
                          ) : b.daysUntilExpiry <= 90 ? (
                            <span style={{ color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                              Cận hạn ({b.daysUntilExpiry}n)
                            </span>
                          ) : (
                            <span style={{ color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                              Còn hạn
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b' }}>{b.quantityImported}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                          {b.quantityAvailable}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#475569' }}>
                          {(b.importPrice || 0).toLocaleString()} đ
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => openAuditModal(b)}
                            style={{
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#1d4ed8',
                              padding: '5px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Kiểm kê
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: QUẢN LÝ NHÀ CUNG CẤP (UC-DT09) */}
        {activeTab === 'suppliers' && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Danh sách nhà cung cấp thuốc ({suppliers.length})
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                  Quản lý thông tin đối tác dược phẩm, mã số thuế và thông tin liên lạc
                </p>
              </div>

              <button
                type="button"
                onClick={openCreateSupplier}
                style={{
                  background: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 750,
                  cursor: 'pointer'
                }}
              >
                + Thêm nhà cung cấp
              </button>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '10px 12px' }}>Tên nhà cung cấp</th>
                    <th style={{ padding: '10px 12px', width: '140px' }}>Mã số thuế</th>
                    <th style={{ padding: '10px 12px', width: '130px' }}>Điện thoại</th>
                    <th style={{ padding: '10px 12px', width: '180px' }}>Email</th>
                    <th style={{ padding: '10px 12px' }}>Địa chỉ</th>
                    <th style={{ padding: '10px 12px', width: '90px', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <strong style={{ color: '#0f172a' }}>{s.name}</strong>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#475569' }}>{s.taxCode || '-'}</td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>{s.phone || '-'}</td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>{s.email || '-'}</td>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>{s.address || '-'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => openEditSupplier(s)}
                          style={{
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            color: '#1d4ed8',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Sửa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: LỊCH SỬ NHẬP - XUẤT (UC-DT10) */}
        {activeTab === 'transactions' && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  value={transactionTypeFilter}
                  onChange={e => setTransactionTypeFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px'
                  }}
                >
                  <option value="">Tất cả loại giao dịch</option>
                  <option value="IMPORT">Nhập kho</option>
                  <option value="DISPENSE">Cấp phát theo đơn</option>
                  <option value="AUDIT_ADJUSTMENT">Kiểm kê điều chỉnh</option>
                  <option value="DISPOSE">Xuất hủy hết hạn</option>
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Từ:</span>
                  <input
                    type="date"
                    value={dateRange.fromDate}
                    onChange={e => setDateRange(prev => ({ ...prev, fromDate: e.target.value }))}
                    style={{
                      padding: '7px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12.5px'
                    }}
                  />
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Đến:</span>
                  <input
                    type="date"
                    value={dateRange.toDate}
                    onChange={e => setDateRange(prev => ({ ...prev, toDate: e.target.value }))}
                    style={{
                      padding: '7px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12.5px'
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={loadTransactions}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#0f172a',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Lọc giao dịch
                </button>
              </div>
            </div>

            {loadingTransactions ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải lịch sử giao dịch...</div>
            ) : transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                Không có giao dịch xuất nhập nào theo tiêu chí
              </div>
            ) : (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                      <th style={{ padding: '10px 12px', width: '140px' }}>Thời gian</th>
                      <th style={{ padding: '10px 12px', width: '130px' }}>Loại GD</th>
                      <th style={{ padding: '10px 12px' }}>Tên thuốc / Hoạt chất</th>
                      <th style={{ padding: '10px 12px', width: '100px' }}>Số lô</th>
                      <th style={{ padding: '10px 12px', width: '90px', textAlign: 'right' }}>Số lượng</th>
                      <th style={{ padding: '10px 12px', width: '130px' }}>Người thực hiện</th>
                      <th style={{ padding: '10px 12px' }}>Lý do / Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(t => (
                      <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px', color: '#475569' }}>{t.transactionDate}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 750,
                              background:
                                t.transactionType === 'IMPORT'
                                  ? '#dcfce7'
                                  : t.transactionType === 'DISPENSE'
                                  ? '#e0f2fe'
                                  : t.transactionType === 'AUDIT_ADJUSTMENT'
                                  ? '#fef3c7'
                                  : '#fee2e2',
                              color:
                                t.transactionType === 'IMPORT'
                                  ? '#15803d'
                                  : t.transactionType === 'DISPENSE'
                                  ? '#0369a1'
                                  : t.transactionType === 'AUDIT_ADJUSTMENT'
                                  ? '#b45309'
                                  : '#b91c1c'
                            }}
                          >
                            {getTransactionTypeDesc(t.transactionType)}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <strong style={{ color: '#0f172a' }}>{t.brandName || t.medicineCode}</strong>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#334155' }}>{t.batchNumber || '-'}</td>
                        <td
                          style={{
                            padding: '10px 12px',
                            textAlign: 'right',
                            fontWeight: 800,
                            color: t.quantity > 0 ? '#15803d' : '#dc2626'
                          }}
                        >
                          {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#475569' }}>{t.pharmacistName || '-'}</td>
                        <td style={{ padding: '10px 12px', color: '#64748b' }}>{t.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL THÊM / SỬA THUỐC (UC-DT05) */}
      {/* ========================================================================= */}
      {medicineModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                {editingMedicine ? 'Chỉnh sửa thông tin thuốc' : 'Thêm thuốc mới vào danh mục'}
              </h2>
              <button
                type="button"
                onClick={() => setMedicineModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleSaveMedicine} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Mã thuốc <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={medicineForm.code}
                    onChange={e => setMedicineForm(prev => ({ ...prev, code: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Tên biệt dược <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={medicineForm.brandName}
                    onChange={e => setMedicineForm(prev => ({ ...prev, brandName: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Hoạt chất chính <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Paracetamol, Amoxicillin..."
                    value={medicineForm.activeIngredient}
                    onChange={e => setMedicineForm(prev => ({ ...prev, activeIngredient: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Nhóm thuốc
                  </label>
                  <select
                    value={medicineForm.categoryId}
                    onChange={e => setMedicineForm(prev => ({ ...prev, categoryId: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value={0}>-- Chọn nhóm thuốc --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Dạng bào chế (Viên nén/Gói/Chai)
                  </label>
                  <input
                    type="text"
                    value={medicineForm.dosageForm}
                    onChange={e => setMedicineForm(prev => ({ ...prev, dosageForm: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Đơn vị cấp phát (Viên/Gói/Chai)
                  </label>
                  <input
                    type="text"
                    value={medicineForm.unit}
                    onChange={e => setMedicineForm(prev => ({ ...prev, unit: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Giá bán lẻ (VNĐ) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={medicineForm.sellingPrice}
                    onChange={e => setMedicineForm(prev => ({ ...prev, sellingPrice: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Hướng dẫn sử dụng
                  </label>
                  <input
                    type="text"
                    value={medicineForm.usageInstructions}
                    onChange={e => setMedicineForm(prev => ({ ...prev, usageInstructions: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Chống chỉ định (Dị ứng)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Quá mẫn cảm với Paracetamol, suy gan nặng..."
                    value={medicineForm.contraindications}
                    onChange={e => setMedicineForm(prev => ({ ...prev, contraindications: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setMedicineModalOpen(false)}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'var(--primary)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 22px',
                    borderRadius: '8px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Lưu thông tin thuốc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL KIỂM KÊ ĐIỀU CHỈNH TỒN KHO (UC-DT07) */}
      {/* ========================================================================= */}
      {auditModalOpen && selectedBatchForAudit && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                Kiểm kê & Điều chỉnh lô thuốc
              </h3>
              <button
                type="button"
                onClick={() => setAuditModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
              >
                Đóng
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px' }}>
              <div style={{ fontWeight: 800, color: '#0f172a' }}>
                {selectedBatchForAudit.brandName || selectedBatchForAudit.medicineCode}
              </div>
              <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px' }}>
                Số lô: <strong>{selectedBatchForAudit.batchNumber}</strong> &bull; HSD: {selectedBatchForAudit.expiryDate}
              </div>
              <div style={{ fontSize: '13px', color: '#1e293b', marginTop: '4px' }}>
                Số lượng trên hệ thống hiện tại: <strong>{selectedBatchForAudit.quantityAvailable}</strong>
              </div>
            </div>

            <form onSubmit={handleAuditStock} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Số lượng đếm thực tế trong kho <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={auditForm.actualQuantity}
                  onChange={e => setAuditForm(prev => ({ ...prev, actualQuantity: Number(e.target.value) }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    fontWeight: 700
                  }}
                />
              </div>

              {/* Chênh lệch */}
              <div style={{ fontSize: '13px', fontWeight: 700 }}>
                Chênh lệch điều chỉnh:{' '}
                <span
                  style={{
                    color:
                      auditForm.actualQuantity - selectedBatchForAudit.quantityAvailable > 0
                        ? '#15803d'
                        : auditForm.actualQuantity - selectedBatchForAudit.quantityAvailable < 0
                        ? '#dc2626'
                        : '#475569'
                  }}
                >
                  {auditForm.actualQuantity - selectedBatchForAudit.quantityAvailable > 0
                    ? `+${auditForm.actualQuantity - selectedBatchForAudit.quantityAvailable} (Thừa kho)`
                    : auditForm.actualQuantity - selectedBatchForAudit.quantityAvailable < 0
                    ? `${auditForm.actualQuantity - selectedBatchForAudit.quantityAvailable} (Hao hụt/Thiếu kho)`
                    : '0 (Khớp hoàn toàn)'}
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Lý do điều chỉnh kiểm kê <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={auditForm.reason}
                  onChange={e => setAuditForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="VD: Kiểm kê định kỳ cuối tháng, vỡ hỏng trong bảo quản..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setAuditModalOpen(false)}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loadingAudit}
                  style={{
                    background: 'var(--primary)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 22px',
                    borderRadius: '8px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {loadingAudit ? 'Đang cập nhật...' : 'Cập nhật số tồn thực tế'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL THÊM / SỬA NHÀ CUNG CẤP (UC-DT09) */}
      {/* ========================================================================= */}
      {supplierModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                {editingSupplier ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}
              </h3>
              <button
                type="button"
                onClick={() => setSupplierModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Tên nhà cung cấp <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={supplierForm.name}
                  onChange={e => setSupplierForm(prev => ({ ...prev, name: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Mã số thuế
                  </label>
                  <input
                    type="text"
                    value={supplierForm.taxCode}
                    onChange={e => setSupplierForm(prev => ({ ...prev, taxCode: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={supplierForm.phone}
                    onChange={e => setSupplierForm(prev => ({ ...prev, phone: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={supplierForm.email}
                    onChange={e => setSupplierForm(prev => ({ ...prev, email: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    value={supplierForm.address}
                    onChange={e => setSupplierForm(prev => ({ ...prev, address: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSupplierModalOpen(false)}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'var(--primary)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 22px',
                    borderRadius: '8px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Lưu nhà cung cấp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL IN ĐƠN THUỐC CHUẨN A4 BỘ Y TẾ / CAREPLUS (UC-DT03) */}
      {/* ========================================================================= */}
      {printModalOpen && printData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '94vh',
              overflowY: 'auto',
              padding: '36px 40px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              color: '#0f172a'
            }}
          >
            {/* NÚT THAO TÁC IN & ĐÓNG */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                Mẫu đơn thuốc điện tử chuẩn Bộ Y tế - CarePlus Clinic
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    background: 'var(--primary)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 16px',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: 750,
                    cursor: 'pointer'
                  }}
                >
                  In đơn thuốc
                </button>
                <button
                  type="button"
                  onClick={() => setPrintModalOpen(false)}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>

            {/* HEADER PHÒNG KHÁM */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--primary-dark)' }}>
                  PHÒNG KHÁM ĐA KHOA CAREPLUS CLINIC
                </h2>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                  Địa chỉ: Tầng 2, Tòa nhà Crescent Plaza, 105 Tôn Dật Tiên, Quận 7, TP. Hồ Chí Minh
                </div>
                <div style={{ fontSize: '12px', color: '#475569' }}>
                  Hotline: 1800 6116 &bull; Website: www.careplusvn.com
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  Mã đơn: {printData.prescriptionCode}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Ngày: {printData.createdAt}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Mã hồ sơ: {printData.recordCode || '-'}
                </div>
              </div>
            </div>

            {/* TIÊU ĐỀ */}
            <div style={{ textAlign: 'center', margin: '20px 0 16px' }}>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, letterSpacing: '1px' }}>
                ĐƠN THUỐC
              </h1>
            </div>

            {/* THÔNG TIN BỆNH NHÂN */}
            <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>Họ và tên: <strong style={{ fontSize: '14px' }}>{printData.patientName}</strong></div>
                <div>Giới tính: <strong>{printData.gender === 'FEMALE' ? 'Nữ' : 'Nam'}</strong></div>
                <div>Ngày sinh: <strong>{printData.dateOfBirth || '-'}</strong></div>
                <div>Tuổi: <strong>{printData.age || '-'}</strong></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>Mã y tế: <strong>{printData.patientCode}</strong></div>
                <div>Số điện thoại: <strong>{printData.phone || '-'}</strong></div>
                <div>BHYT: <strong>{printData.healthInsuranceNumber || 'Không'}</strong></div>
              </div>
              <div>Địa chỉ: <strong>{printData.address || 'TP. Hồ Chí Minh'}</strong></div>
              <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '6px', marginTop: '2px' }}>
                Chẩn đoán: <strong style={{ color: '#0f172a' }}>{printData.diagnosis}</strong>{' '}
                {printData.icd10Code && <span style={{ color: '#64748b' }}>({printData.icd10Code})</span>}
              </div>
            </div>

            {/* BẢNG CHI TIẾT THUỐC */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 800 }}>
                Chỉ định dùng thuốc:
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #0f172a', textAlign: 'left', color: '#0f172a' }}>
                    <th style={{ padding: '8px 6px', width: '36px' }}>STT</th>
                    <th style={{ padding: '8px 6px' }}>Tên thuốc, hàm lượng, nồng độ</th>
                    <th style={{ padding: '8px 6px', width: '80px', textAlign: 'center' }}>Số lượng</th>
                    <th style={{ padding: '8px 6px', width: '70px' }}>Đơn vị</th>
                    <th style={{ padding: '8px 6px' }}>Hướng dẫn sử dụng & Liều lượng</th>
                  </tr>
                </thead>
                <tbody>
                  {printData.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 6px', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ padding: '10px 6px' }}>
                        <strong style={{ fontSize: '13.5px' }}>{item.brandName || item.medicineCode}</strong>
                        {item.activeIngredient && (
                          <div style={{ fontSize: '11px', color: '#64748b' }}>({item.activeIngredient})</div>
                        )}
                      </td>
                      <td style={{ padding: '10px 6px', textAlign: 'center', fontWeight: 750 }}>
                        {item.quantity}
                      </td>
                      <td style={{ padding: '10px 6px' }}>{item.unit}</td>
                      <td style={{ padding: '10px 6px', color: '#334155' }}>
                        <div>{item.instructions}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* DẶN DÒ BÁC SĨ */}
            <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '24px' }}>
              <div>Lời dặn bác sĩ: <strong>{printData.doctorAdvice || 'Tái khám theo hẹn hoặc khi có dấu hiệu bất thường.'}</strong></div>
              {printData.followUpDate && (
                <div>Ngày hẹn tái khám: <strong style={{ color: '#0369a1' }}>{printData.followUpDate}</strong></div>
              )}
            </div>

            {/* CHỮ KÝ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center', marginTop: '30px', pageBreakInside: 'avoid' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>DƯỢC SĨ CẤP PHÁT</div>
                <div style={{ fontSize: '11.5px', color: '#64748b', fontStyle: 'italic' }}>(Ký và ghi rõ họ tên)</div>
                <div style={{ height: '70px' }} />
                <div style={{ fontSize: '13.5px', fontWeight: 750 }}>{printData.pharmacistName || 'DS. Phạm Thị Nga'}</div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                  Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>BÁC SĨ KÊ ĐƠN</div>
                <div style={{ fontSize: '11.5px', color: '#64748b', fontStyle: 'italic' }}>(Ký và ghi rõ họ tên)</div>
                <div style={{ height: '54px' }} />
                <div style={{ fontSize: '13.5px', fontWeight: 750 }}>{printData.doctorName}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PharmacyInventoryPage
