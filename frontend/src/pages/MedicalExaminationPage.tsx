import React, { useState, useEffect, useRef } from 'react'
import type {
  QueueTicketItem,
  SimpleRoomOption,
  VitalSignItem,
  ClinicalServiceItem,
  LabOrderItem,
  MedicalRecordItem,
  MedicalSummaryPrintData,
  MedicineItem,
  PrescriptionItem,
  PrescriptionPrintData,
  AllergyAlertResponse
} from '../types'

interface MedicalExaminationPageProps {
  currentUser?: {
    username?: string
    role?: string
    roles?: string[]
    name?: string
    id?: number
  } | null
}

export const MedicalExaminationPage: React.FC<MedicalExaminationPageProps> = ({ currentUser }) => {
  const previousTicketIdRef = useRef<number | null>(null)
  // Xác định vai trò
  const isNurseRole = Boolean(
    currentUser?.role === 'nurse' ||
    currentUser?.roles?.some((r: string) => r.toLowerCase() === 'nurse') ||
    currentUser?.username?.includes('nurse')
  )

  // Chế độ làm việc: 'nurse' (Bàn đo sinh hiệu) hoặc 'doctor' (Bàn khám lâm sàng)
  const [workingMode, setWorkingMode] = useState<'nurse' | 'doctor'>(isNurseRole ? 'nurse' : 'doctor')

  // Phòng khám bác sĩ chọn
  const [rooms, setRooms] = useState<SimpleRoomOption[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState<number>(1)

  // Danh sách hàng đợi phòng khám
  const [queueTickets, setQueueTickets] = useState<QueueTicketItem[]>([])
  const [activeTicket, setActiveTicket] = useState<QueueTicketItem | null>(null)
  const [loadingQueue, setLoadingQueue] = useState<boolean>(false)

  // Phiên khám hiện tại
  const [currentRecord, setCurrentRecord] = useState<MedicalRecordItem | null>(null)
  const [activeTab, setActiveTab] = useState<'vitals' | 'clinical' | 'lab' | 'prescription' | 'history' | 'followup'>(
    isNurseRole ? 'vitals' : 'clinical'
  )

  // Sinh hiệu (UC-KB01)
  const [vitalForm, setVitalForm] = useState<{
    temperature: string
    bloodPressureSystolic: string
    bloodPressureDiastolic: string
    heartRate: string
    respiratoryRate: string
    spo2: string
    weightKg: string
    heightCm: string
    notes: string
  }>({
    temperature: '37.0',
    bloodPressureSystolic: '120',
    bloodPressureDiastolic: '80',
    heartRate: '75',
    respiratoryRate: '18',
    spo2: '99',
    weightKg: '65',
    heightCm: '168',
    notes: ''
  })
  const [currentVitalSigns, setCurrentVitalSigns] = useState<VitalSignItem | null>(null)
  const [vitalHistory, setVitalHistory] = useState<VitalSignItem[]>([])
  const [loadingVitalHistory, setLoadingVitalHistory] = useState<boolean>(false)

  // Lịch sử khám bệnh (UC-KB02)
  const [patientHistory, setPatientHistory] = useState<MedicalRecordItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false)

  // Triệu chứng & Chẩn đoán (UC-KB03)
  const [clinicalForm, setClinicalForm] = useState<{
    chiefComplaint: string
    historyOfPresentIllness: string
    physicalExamination: string
    initialDiagnosis: string
    finalDiagnosis: string
    icd10Code: string
    doctorAdvice: string
    followUpDate: string
  }>({
    chiefComplaint: '',
    historyOfPresentIllness: '',
    physicalExamination: '',
    initialDiagnosis: '',
    finalDiagnosis: '',
    icd10Code: '',
    doctorAdvice: '',
    followUpDate: ''
  })

  // Dịch vụ cận lâm sàng (UC-KB04 & UC-KB05)
  const [availableServices, setAvailableServices] = useState<ClinicalServiceItem[]>([])
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([])
  const [labOrders, setLabOrders] = useState<LabOrderItem[]>([])
  const [labNote, setLabNote] = useState<string>('')

  // Modal in phiếu khám (UC-KB08)
  const [printModalOpen, setPrintModalOpen] = useState<boolean>(false)
  const [printData, setPrintData] = useState<MedicalSummaryPrintData | null>(null)
  const [loadingPrint, setLoadingPrint] = useState<boolean>(false)

  // Modal in phiếu sinh hiệu riêng cho Điều dưỡng
  const [vitalPrintModalOpen, setVitalPrintModalOpen] = useState<boolean>(false)

  // Modal nhập kết quả cận lâm sàng
  const [labResultModalOpen, setLabResultModalOpen] = useState<boolean>(false)
  const [editingResultId, setEditingResultId] = useState<number | null>(null)
  const [resultForm, setResultForm] = useState<{
    testValue: string
    referenceRange: string
    unit: string
    conclusion: string
  }>({
    testValue: '',
    referenceRange: '',
    unit: '',
    conclusion: ''
  })

  // =========================================================================
  // KÊ ĐƠN THUỐC (UC-DT01, UC-DT02, UC-DT03)
  // =========================================================================
  const [availableMedicines, setAvailableMedicines] = useState<MedicineItem[]>([])
  const [patientPrescriptions, setPatientPrescriptions] = useState<PrescriptionItem[]>([])
  const [prescriptionItems, setPrescriptionItems] = useState<{
    medicineId: number
    medicineName: string
    activeIngredient: string
    quantityPrescribed: number
    unit: string
    unitPrice: number
    morningDose: string
    noonDose: string
    afternoonDose: string
    nightDose: string
    usageInstructions: string
    durationDays: number
  }[]>([])
  const [itemAddForm, setItemAddForm] = useState({
    medicineId: 0,
    quantityPrescribed: 10,
    morningDose: '1',
    noonDose: '0',
    afternoonDose: '1',
    nightDose: '0',
    usageInstructions: 'Uống sau bữa ăn no',
    durationDays: 5
  })
  const [prescriptionNotes, setPrescriptionNotes] = useState<string>('')
  const [savingPrescription, setSavingPrescription] = useState<boolean>(false)

  // Cảnh báo dị ứng thuốc (UC-DT02)
  const [allergyAlert, setAllergyAlert] = useState<AllergyAlertResponse | null>(null)
  const [allergyModalOpen, setAllergyModalOpen] = useState<boolean>(false)
  const [overrideAllergyReason, setOverrideAllergyReason] = useState<string>('')

  // In đơn thuốc chuẩn A4 (UC-DT03)
  const [prescriptionPrintModalOpen, setPrescriptionPrintModalOpen] = useState<boolean>(false)
  const [prescriptionPrintData, setPrescriptionPrintData] = useState<PrescriptionPrintData | null>(null)
  const [, setLoadingPrescriptionPrint] = useState<boolean>(false)

  // Thông báo
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  // Tải danh sách phòng khám & danh mục cận lâm sàng khi mở trang
  useEffect(() => {
    loadRooms()
    loadClinicalServices()
    loadAvailableMedicines()
  }, [])

  // Tải hàng đợi khi đổi phòng
  useEffect(() => {
    if (selectedRoomId) {
      loadRoomQueue(selectedRoomId)
    }
  }, [selectedRoomId])

  // Khi chọn một bệnh nhân từ hàng đợi
  useEffect(() => {
    if (activeTicket) {
      loadLatestVitals(activeTicket.patientId)
      loadVitalHistory(activeTicket.patientId)
      loadPatientHistory(activeTicket.patientId)
      loadPatientPrescriptions(activeTicket.patientId)

      // Chỉ khởi tạo lại biểu mẫu khi chuyển hẳn sang một bệnh nhân KHÁC
      if (previousTicketIdRef.current !== activeTicket.id) {
        previousTicketIdRef.current = activeTicket.id
        setClinicalForm({
          chiefComplaint: activeTicket.notes || 'Khám bệnh theo số thứ tự hàng đợi',
          historyOfPresentIllness: '',
          physicalExamination: '',
          initialDiagnosis: '',
          finalDiagnosis: '',
          icd10Code: '',
          doctorAdvice: '',
          followUpDate: ''
        })
        setCurrentRecord(null)
        setLabOrders([])
        setPrescriptionItems([])
        setAllergyAlert(null)
        setOverrideAllergyReason('')
      }
    }
  }, [activeTicket?.id])

  const showAlert = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setAlertMessage({ text, type })
    setTimeout(() => {
      setAlertMessage(null)
    }, 4500)
  }

  const loadRooms = async () => {
    try {
      const res = await fetch('/api/rooms')
      if (res.ok) {
        const data = await res.json()
        setRooms(data)
        if (data.length > 0) {
          setSelectedRoomId(data[0].id)
        }
      }
    } catch {
      // Giữ mặc định
    }
  }

  const loadClinicalServices = async () => {
    try {
      const res = await fetch('/api/medical-examination/services')
      if (res.ok) {
        const data = await res.json()
        setAvailableServices(data)
      }
    } catch {
      // Giữ mặc định
    }
  }

  // =========================================================================
  // LOGIC KÊ ĐƠN THUỐC & CẢNH BÁO DỊ ỨNG (UC-DT01, UC-DT02, UC-DT03)
  // =========================================================================
  const loadAvailableMedicines = async () => {
    try {
      const res = await fetch('/api/pharmacy/medicines')
      if (res.ok) {
        const data: MedicineItem[] = await res.json()
        setAvailableMedicines(data)
        if (data.length > 0 && itemAddForm.medicineId === 0) {
          setItemAddForm(prev => ({ ...prev, medicineId: data[0].id }))
        }
      }
    } catch {
      // Giữ mặc định
    }
  }

  const loadPatientPrescriptions = async (patientId: number) => {
    try {
      const res = await fetch(`/api/pharmacy/prescriptions/patient/${patientId}`)
      if (res.ok) {
        const data: PrescriptionItem[] = await res.json()
        setPatientPrescriptions(data)
      }
    } catch {
      // Giữ mặc định
    }
  }

  const handleCheckAllergiesForIds = async (medIds: number[]): Promise<AllergyAlertResponse | null> => {
    if (!activeTicket || medIds.length === 0) return null
    try {
      const res = await fetch('/api/pharmacy/check-allergies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: activeTicket.patientId,
          medicineIds: medIds
        })
      })
      if (res.ok) {
        const alertData: AllergyAlertResponse = await res.json()
        return alertData
      }
    } catch {
      // ignore
    }
    return null
  }

  const handleAddMedicineItem = async () => {
    const med = availableMedicines.find(m => m.id === Number(itemAddForm.medicineId))
    if (!med) {
      showAlert('Vui lòng chọn thuốc hợp lệ', 'error')
      return
    }
    if (itemAddForm.quantityPrescribed <= 0) {
      showAlert('Số lượng kê đơn phải lớn hơn 0', 'error')
      return
    }

    // Kiểm tra xem thuốc đã có trong đơn chưa
    const existing = prescriptionItems.find(i => i.medicineId === med.id)
    if (existing) {
      showAlert(`Thuốc ${med.brandName} đã có trong đơn. Bạn có thể xóa và thêm lại nếu muốn chỉnh số lượng.`, 'info')
      return
    }

    // Ghép hướng dẫn sử dụng chi tiết
    const medUnit = med.dispensingUnit || med.unit || 'Viên'
    const medPrice = med.unitRetailPrice || med.sellingPrice || 0
    let fullUsage = itemAddForm.usageInstructions
    const doseParts: string[] = []
    if (itemAddForm.morningDose && itemAddForm.morningDose !== '0') doseParts.push(`Sáng: ${itemAddForm.morningDose} ${medUnit}`)
    if (itemAddForm.noonDose && itemAddForm.noonDose !== '0') doseParts.push(`Trưa: ${itemAddForm.noonDose} ${medUnit}`)
    if (itemAddForm.afternoonDose && itemAddForm.afternoonDose !== '0') doseParts.push(`Chiều: ${itemAddForm.afternoonDose} ${medUnit}`)
    if (itemAddForm.nightDose && itemAddForm.nightDose !== '0') doseParts.push(`Tối: ${itemAddForm.nightDose} ${medUnit}`)
    if (doseParts.length > 0) {
      fullUsage = `${doseParts.join(', ')}. ${fullUsage}`
    }

    const newItem = {
      medicineId: med.id,
      medicineName: `${med.brandName}${med.concentration ? ` (${med.concentration})` : ''}`,
      activeIngredient: med.activeIngredient,
      quantityPrescribed: Number(itemAddForm.quantityPrescribed),
      unit: medUnit,
      unitPrice: medPrice,
      morningDose: itemAddForm.morningDose,
      noonDose: itemAddForm.noonDose,
      afternoonDose: itemAddForm.afternoonDose,
      nightDose: itemAddForm.nightDose,
      usageInstructions: fullUsage,
      durationDays: Number(itemAddForm.durationDays) || 5
    }

    const updatedList = [...prescriptionItems, newItem]
    setPrescriptionItems(updatedList)

    // Kiểm tra dị ứng ngay lập tức
    const alertResult = await handleCheckAllergiesForIds(updatedList.map(i => i.medicineId))
    if (alertResult && (alertResult.hasRisk || alertResult.hasAllergyAlert)) {
      setAllergyAlert(alertResult)
      setAllergyModalOpen(true)
      showAlert('CẢNH BÁO DỊ ỨNG: Bệnh nhân có tiền sử dị ứng với thành phần thuốc vừa kê!', 'error')
    } else {
      showAlert(`Đã thêm ${med.brandName} vào đơn thuốc`)
    }
  }

  const handleRemovePrescriptionItem = async (index: number) => {
    const updated = prescriptionItems.filter((_, idx) => idx !== index)
    setPrescriptionItems(updated)
    if (updated.length > 0) {
      const alertResult = await handleCheckAllergiesForIds(updated.map(i => i.medicineId))
      if (alertResult && (alertResult.hasRisk || alertResult.hasAllergyAlert)) {
        setAllergyAlert(alertResult)
      } else {
        setAllergyAlert(null)
      }
    } else {
      setAllergyAlert(null)
    }
  }

  const handleSavePrescription = async () => {
    if (!activeTicket) {
      showAlert('Chưa chọn bệnh nhân', 'error')
      return
    }
    if (prescriptionItems.length === 0) {
      showAlert('Đơn thuốc chưa có danh mục thuốc nào', 'error')
      return
    }

    // Nếu có cảnh báo dị ứng mà chưa nhập lý do xác nhận
    const hasRiskAlert = Boolean(allergyAlert && (allergyAlert.hasRisk || allergyAlert.hasAllergyAlert))
    if (hasRiskAlert && !overrideAllergyReason.trim()) {
      setAllergyModalOpen(true)
      showAlert('Cần xác nhận lý do lâm sàng khi kê đơn có cảnh báo dị ứng!', 'error')
      return
    }

    setSavingPrescription(true)
    try {
      const diagnosisText =
        (clinicalForm.finalDiagnosis || '').trim() ||
        (clinicalForm.initialDiagnosis || '').trim() ||
        'Kê đơn điều trị ngoại trú'

      const doctorId = currentUser?.id || 2
      const warningText = allergyAlert?.warningMessage || allergyAlert?.warnings?.map(w => w.message).join('; ') || null
      const payload = {
        medicalRecordId: currentRecord ? currentRecord.id : null,
        patientId: activeTicket.patientId,
        doctorId: doctorId,
        diagnosis: diagnosisText,
        icd10Code: clinicalForm.icd10Code || null,
        doctorAdvice: prescriptionNotes || clinicalForm.doctorAdvice || null,
        followUpDate: clinicalForm.followUpDate || null,
        hasAllergyAlert: hasRiskAlert,
        allergyAlertMessage: warningText,
        overrideAllergyReason: overrideAllergyReason.trim() || null,
        items: prescriptionItems.map(i => ({
          medicineId: i.medicineId,
          quantityPrescribed: i.quantityPrescribed,
          unit: i.unit,
          unitPrice: i.unitPrice,
          morningDose: i.morningDose,
          noonDose: i.noonDose,
          afternoonDose: i.afternoonDose,
          nightDose: i.nightDose,
          usageInstructions: i.usageInstructions,
          durationDays: i.durationDays
        }))
      }

      const res = await fetch('/api/pharmacy/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const savedPrescription: PrescriptionItem = await res.json()
        showAlert(`Đã lưu đơn thuốc ${savedPrescription.prescriptionCode} thành công!`)
        setPrescriptionItems([])
        setAllergyAlert(null)
        setOverrideAllergyReason('')
        loadPatientPrescriptions(activeTicket.patientId)
      } else {
        const err = await res.json().catch(() => null)
        showAlert(err?.message || 'Không thể lưu đơn thuốc', 'error')
      }
    } catch {
      showAlert('Lỗi kết nối khi lưu đơn thuốc', 'error')
    } finally {
      setSavingPrescription(false)
    }
  }

  const handleOpenPrescriptionPrintModal = async (prescriptionId: number) => {
    setLoadingPrescriptionPrint(true)
    try {
      const res = await fetch(`/api/pharmacy/prescriptions/${prescriptionId}/print`)
      if (res.ok) {
        const data: PrescriptionPrintData = await res.json()
        setPrescriptionPrintData(data)
        setPrescriptionPrintModalOpen(true)
      } else {
        showAlert('Không thể tải dữ liệu in đơn thuốc', 'error')
      }
    } catch {
      showAlert('Lỗi kết nối khi in đơn thuốc', 'error')
    } finally {
      setLoadingPrescriptionPrint(false)
    }
  }

  const loadRoomQueue = async (roomId: number) => {
    setLoadingQueue(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await fetch(`/api/queue/room/${roomId}?date=${today}`)
      if (res.ok) {
        const data: QueueTicketItem[] = await res.json()
        setQueueTickets(data)

        const serving = data.find(t => t.status === 'SERVING')
        if (serving) {
          setActiveTicket(serving)
        } else if (!activeTicket && data.length > 0) {
          setActiveTicket(data[0])
        }
      }
    } catch {
      showAlert('Không thể tải hàng đợi phòng khám', 'error')
    } finally {
      setLoadingQueue(false)
    }
  }

  const handleCallPatient = async (ticket: QueueTicketItem) => {
    try {
      const callerId = currentUser?.id || (isNurseRole ? 5 : 4)
      const res = await fetch(`/api/queue/${ticket.id}/call?userId=${callerId}`, {
        method: 'PUT'
      })
      if (res.ok) {
        showAlert(`Đã gọi bệnh nhân số ${ticket.ticketNumber} - ${ticket.patientName}`)
        loadRoomQueue(selectedRoomId)
      } else {
        const errJson = await res.json().catch(() => null)
        showAlert(errJson?.message || 'Không thể gọi bệnh nhân', 'error')
      }
    } catch {
      showAlert('Lỗi kết nối khi gọi bệnh nhân', 'error')
    }
  }

  const handleStartServing = async (ticket: QueueTicketItem) => {
    try {
      const staffId = currentUser?.id || (isNurseRole ? 5 : 4)
      const res = await fetch(`/api/queue/${ticket.id}/start?userId=${staffId}`, {
        method: 'PUT'
      })
      if (res.ok) {
        const updatedTicket: QueueTicketItem = await res.json()
        setActiveTicket(updatedTicket)
        showAlert(`Đang tiếp nhận phục vụ cho bệnh nhân ${ticket.patientName}`)
        loadRoomQueue(selectedRoomId)
      } else {
        const errJson = await res.json().catch(() => null)
        showAlert(errJson?.message || 'Không thể chuyển trạng thái đang phục vụ', 'error')
      }
    } catch {
      showAlert('Lỗi khi bắt đầu phiên phục vụ', 'error')
    }
  }

  const loadLatestVitals = async (patientId: number) => {
    try {
      const res = await fetch(`/api/medical-examination/vital-signs/patient/${patientId}`)
      if (res.status === 200) {
        const data: VitalSignItem = await res.json()
        setCurrentVitalSigns(data)
        if (data.temperature) setVitalForm(prev => ({ ...prev, temperature: String(data.temperature) }))
        if (data.bloodPressureSystolic) setVitalForm(prev => ({ ...prev, bloodPressureSystolic: String(data.bloodPressureSystolic) }))
        if (data.bloodPressureDiastolic) setVitalForm(prev => ({ ...prev, bloodPressureDiastolic: String(data.bloodPressureDiastolic) }))
        if (data.heartRate) setVitalForm(prev => ({ ...prev, heartRate: String(data.heartRate) }))
        if (data.respiratoryRate) setVitalForm(prev => ({ ...prev, respiratoryRate: String(data.respiratoryRate) }))
        if (data.spo2) setVitalForm(prev => ({ ...prev, spo2: String(data.spo2) }))
        if (data.weightKg) setVitalForm(prev => ({ ...prev, weightKg: String(data.weightKg) }))
        if (data.heightCm) setVitalForm(prev => ({ ...prev, heightCm: String(data.heightCm) }))
        if (data.notes) setVitalForm(prev => ({ ...prev, notes: data.notes || '' }))
      } else {
        setCurrentVitalSigns(null)
      }
    } catch {
      setCurrentVitalSigns(null)
    }
  }

  const loadVitalHistory = async (patientId: number) => {
    setLoadingVitalHistory(true)
    try {
      const res = await fetch(`/api/medical-examination/vital-signs/history/${patientId}`)
      if (res.ok) {
        const data = await res.json()
        setVitalHistory(data)
      }
    } catch {
      // Giữ mặc định
    } finally {
      setLoadingVitalHistory(false)
    }
  }

  const computeCurrentBmi = () => {
    const w = parseFloat(vitalForm.weightKg)
    const h = parseFloat(vitalForm.heightCm)
    if (w > 0 && h > 0) {
      const hm = h / 100.0
      const bmi = w / (hm * hm)
      return Math.round(bmi * 10) / 10
    }
    return null
  }

  const getBmiAssessment = (bmiVal: number | null) => {
    if (!bmiVal) return { label: 'Chưa có', bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' }
    if (bmiVal < 18.5) return { label: 'Thiếu cân / Gầy', bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' }
    if (bmiVal < 23.0) return { label: 'Thể trạng cân đối chuẩn', bg: '#dcfce7', color: '#15803d', border: '#86efac' }
    if (bmiVal < 25.0) return { label: 'Tiền béo phì / Thừa cân', bg: '#fef3c7', color: '#b45309', border: '#fcd34d' }
    return { label: 'Béo phì cần can thiệp', bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' }
  }

  const getBloodPressureAssessment = (sysStr: string, diaStr: string) => {
    const sys = parseInt(sysStr)
    const dia = parseInt(diaStr)
    if (!sys || !dia) return { label: 'Chưa đo', bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' }
    if (sys < 120 && dia < 80) return { label: 'Huyết áp tối ưu', bg: '#dcfce7', color: '#15803d', border: '#86efac' }
    if (sys < 130 && dia < 85) return { label: 'Huyết áp bình thường', bg: '#ccfbf1', color: '#0f766e', border: '#5eead4' }
    if (sys < 140 && dia < 90) return { label: 'Tiền tăng huyết áp', bg: '#fef3c7', color: '#b45309', border: '#fcd34d' }
    if (sys >= 160 || dia >= 100) return { label: 'Tăng huyết áp độ 2 (Nguy cơ)', bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' }
    return { label: 'Tăng huyết áp độ 1', bg: '#ffedd5', color: '#c2410c', border: '#fdba74' }
  }

  const getTemperatureAssessment = (tempStr: string) => {
    const t = parseFloat(tempStr)
    if (!t) return { label: 'Chưa đo', bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' }
    if (t < 36.0) return { label: 'Hạ thân nhiệt', bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' }
    if (t <= 37.4) return { label: 'Thân nhiệt bình thường', bg: '#dcfce7', color: '#15803d', border: '#86efac' }
    if (t <= 38.4) return { label: 'Sốt nhẹ', bg: '#fef3c7', color: '#b45309', border: '#fcd34d' }
    return { label: 'Sốt cao cần hạ sốt', bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' }
  }

  const getSpo2Assessment = (spo2Str: string) => {
    const s = parseFloat(spo2Str)
    if (!s) return { label: 'Chưa đo', bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' }
    if (s >= 96.0) return { label: 'Oxy máu an toàn', bg: '#dcfce7', color: '#15803d', border: '#86efac' }
    if (s >= 90.0) return { label: 'Thiếu oxy nhẹ / vừa', bg: '#fef3c7', color: '#b45309', border: '#fcd34d' }
    return { label: 'Suy hô hấp nguy kịch', bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' }
  }

  const applyQuickPreset = (type: 'normal' | 'fever' | 'hypertension' | 'clear') => {
    if (type === 'normal') {
      setVitalForm({
        temperature: '37.0',
        bloodPressureSystolic: '120',
        bloodPressureDiastolic: '80',
        heartRate: '75',
        respiratoryRate: '18',
        spo2: '99',
        weightKg: '65',
        heightCm: '168',
        notes: 'Bệnh nhân tỉnh táo, tiếp xúc tốt, da niêm mạc hồng hào'
      })
    } else if (type === 'fever') {
      setVitalForm({
        temperature: '38.5',
        bloodPressureSystolic: '115',
        bloodPressureDiastolic: '75',
        heartRate: '92',
        respiratoryRate: '20',
        spo2: '98',
        weightKg: '64',
        heightCm: '168',
        notes: 'Bệnh nhân người nóng, sốt cao, mệt mỏi, mắt đỏ'
      })
    } else if (type === 'hypertension') {
      setVitalForm({
        temperature: '36.8',
        bloodPressureSystolic: '155',
        bloodPressureDiastolic: '95',
        heartRate: '88',
        respiratoryRate: '19',
        spo2: '97',
        weightKg: '76',
        heightCm: '165',
        notes: 'Bệnh nhân đau tức đầu vùng chẩm, mặt đỏ nhẹ'
      })
    } else {
      setVitalForm({
        temperature: '',
        bloodPressureSystolic: '',
        bloodPressureDiastolic: '',
        heartRate: '',
        respiratoryRate: '',
        spo2: '',
        weightKg: '',
        heightCm: '',
        notes: ''
      })
    }
  }

  const handleSaveVitalSigns = async (confirmToDoctor: boolean = false) => {
    if (!activeTicket) {
      showAlert('Vui lòng chọn bệnh nhân trước khi ghi nhận sinh hiệu', 'error')
      return
    }

    try {
      const payload = {
        patientId: activeTicket.patientId,
        ticketId: activeTicket.id,
        nurseId: 4,
        temperature: vitalForm.temperature ? parseFloat(vitalForm.temperature) : null,
        bloodPressureSystolic: vitalForm.bloodPressureSystolic ? parseInt(vitalForm.bloodPressureSystolic) : null,
        bloodPressureDiastolic: vitalForm.bloodPressureDiastolic ? parseInt(vitalForm.bloodPressureDiastolic) : null,
        heartRate: vitalForm.heartRate ? parseInt(vitalForm.heartRate) : null,
        respiratoryRate: vitalForm.respiratoryRate ? parseInt(vitalForm.respiratoryRate) : null,
        spo2: vitalForm.spo2 ? parseFloat(vitalForm.spo2) : null,
        weightKg: vitalForm.weightKg ? parseFloat(vitalForm.weightKg) : null,
        heightCm: vitalForm.heightCm ? parseFloat(vitalForm.heightCm) : null,
        notes: vitalForm.notes
      }

      const res = await fetch('/api/medical-examination/vital-signs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const saved: VitalSignItem = await res.json()
        setCurrentVitalSigns(saved)
        loadVitalHistory(activeTicket.patientId)

        if (confirmToDoctor) {
          showAlert(`Đã lưu sinh hiệu và xác nhận bệnh nhân ${activeTicket.patientName} sẵn sàng vào gặp Bác sĩ!`)
        } else {
          showAlert('Đã ghi nhận chỉ số sinh hiệu thành công')
        }
        loadRoomQueue(selectedRoomId)
      } else {
        showAlert('Không thể lưu chỉ số sinh hiệu', 'error')
      }
    } catch {
      showAlert('Lỗi kết nối máy chủ', 'error')
    }
  }

  const loadPatientHistory = async (patientId: number) => {
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/medical-examination/history/patient/${patientId}`)
      if (res.ok) {
        const data: MedicalRecordItem[] = await res.json()
        setPatientHistory(data)

        // Nếu có hồ sơ đang khám dở dang (IN_PROGRESS), tự động tải lại vào biểu mẫu
        const inProgress = data.find(r => r.status === 'IN_PROGRESS')
        if (inProgress) {
          setCurrentRecord(inProgress)
          setClinicalForm(prev => ({
            ...prev,
            chiefComplaint: inProgress.chiefComplaint || prev.chiefComplaint,
            initialDiagnosis: inProgress.initialDiagnosis || prev.initialDiagnosis,
            finalDiagnosis: inProgress.finalDiagnosis || inProgress.initialDiagnosis || prev.finalDiagnosis,
            icd10Code: inProgress.icd10Code || prev.icd10Code,
            doctorAdvice: inProgress.doctorAdvice || prev.doctorAdvice,
            followUpDate: inProgress.followUpDate || prev.followUpDate
          }))
          loadLabOrders(inProgress.id)
        }
      }
    } catch {
      showAlert('Không thể tải lịch sử bệnh án', 'error')
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSaveDiagnosis = async (status: string = 'IN_PROGRESS') => {
    if (!activeTicket) {
      showAlert('Chưa chọn bệnh nhân để lập hồ sơ khám', 'error')
      return
    }
    if (!clinicalForm.chiefComplaint.trim()) {
      showAlert('Lý do vào khám không được để trống', 'error')
      return
    }

    try {
      const payload = {
        medicalRecordId: currentRecord ? currentRecord.id : null,
        ticketId: activeTicket.id,
        patientId: activeTicket.patientId,
        doctorId: 2,
        roomId: selectedRoomId,
        vitalSignsId: currentVitalSigns ? currentVitalSigns.id : null,
        chiefComplaint: clinicalForm.chiefComplaint,
        historyOfPresentIllness: clinicalForm.historyOfPresentIllness,
        physicalExamination: clinicalForm.physicalExamination,
        initialDiagnosis: clinicalForm.initialDiagnosis,
        finalDiagnosis: clinicalForm.finalDiagnosis,
        icd10Code: clinicalForm.icd10Code,
        doctorAdvice: clinicalForm.doctorAdvice,
        followUpDate: clinicalForm.followUpDate || null,
        status: status
      }

      const res = await fetch('/api/medical-examination/diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const saved: MedicalRecordItem = await res.json()
        setCurrentRecord(saved)
        showAlert(`Đã lưu hồ sơ bệnh án (${saved.recordCode})`)
        loadPatientHistory(activeTicket.patientId)
        loadRoomQueue(selectedRoomId)
      } else {
        const errText = await res.text()
        showAlert(`Lỗi khi lưu bệnh án: ${errText}`, 'error')
      }
    } catch {
      showAlert('Lỗi kết nối khi lưu bệnh án', 'error')
    }
  }

  const handleOrderLabServices = async () => {
    if (!activeTicket) {
      showAlert('Chưa chọn bệnh nhân', 'error')
      return
    }
    if (selectedServiceIds.length === 0) {
      showAlert('Vui lòng chọn ít nhất một dịch vụ cận lâm sàng để chỉ định', 'error')
      return
    }

    try {
      let recordId = currentRecord ? currentRecord.id : null
      if (!recordId) {
        const initRes = await fetch('/api/medical-examination/diagnosis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId: activeTicket.id,
            patientId: activeTicket.patientId,
            doctorId: 2,
            roomId: selectedRoomId,
            chiefComplaint: clinicalForm.chiefComplaint || 'Chỉ định cận lâm sàng',
            status: 'IN_PROGRESS'
          })
        })
        if (initRes.ok) {
          const initRecord: MedicalRecordItem = await initRes.json()
          setCurrentRecord(initRecord)
          recordId = initRecord.id
        } else {
          showAlert('Không thể khởi tạo phiên khám cho chỉ định', 'error')
          return
        }
      }

      const payload = {
        medicalRecordId: recordId,
        doctorId: 2,
        patientId: activeTicket.patientId,
        diagnosisNote: labNote || clinicalForm.initialDiagnosis || 'Khảo sát cận lâm sàng',
        serviceIds: selectedServiceIds
      }

      const res = await fetch('/api/medical-examination/lab-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const newOrder: LabOrderItem = await res.json()
        setLabOrders(prev => [newOrder, ...prev])
        setSelectedServiceIds([])
        setLabNote('')
        showAlert(`Đã tạo phiếu chỉ định ${newOrder.orderCode} thành công`)
        if (recordId) {
          loadLabOrders(recordId)
        }
      } else {
        showAlert('Không thể tạo chỉ định cận lâm sàng', 'error')
      }
    } catch {
      showAlert('Lỗi khi chỉ định cận lâm sàng', 'error')
    }
  }

  const loadLabOrders = async (recordId: number) => {
    try {
      const res = await fetch(`/api/medical-examination/lab-orders/record/${recordId}`)
      if (res.ok) {
        const data: LabOrderItem[] = await res.json()
        setLabOrders(data)
      }
    } catch {
      // Giữ mặc định
    }
  }

  const openEditResultModal = (result: any) => {
    setEditingResultId(result.id)
    setResultForm({
      testValue: result.testValue || '',
      referenceRange: result.referenceRange || '',
      unit: result.unit || '',
      conclusion: result.conclusion || ''
    })
    setLabResultModalOpen(true)
  }

  const handleSaveLabResult = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingResultId) return

    try {
      const payload = {
        resultId: editingResultId,
        technicianId: 5,
        testValue: resultForm.testValue,
        referenceRange: resultForm.referenceRange,
        unit: resultForm.unit,
        conclusion: resultForm.conclusion
      }

      const res = await fetch('/api/medical-examination/lab-results', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        showAlert('Đã cập nhật kết quả cận lâm sàng thành công')
        setLabResultModalOpen(false)
        if (currentRecord) {
          loadLabOrders(currentRecord.id)
        }
      } else {
        showAlert('Không thể lưu kết quả cận lâm sàng', 'error')
      }
    } catch {
      showAlert('Lỗi khi cập nhật kết quả', 'error')
    }
  }

  const handleScheduleFollowUp = async () => {
    if (!currentRecord) {
      showAlert('Vui lòng lưu phiên khám trước khi đặt lịch hẹn tái khám', 'error')
      return
    }
    if (!clinicalForm.followUpDate) {
      showAlert('Vui lòng chọn ngày hẹn tái khám', 'error')
      return
    }

    try {
      const payload = {
        medicalRecordId: currentRecord.id,
        followUpDate: clinicalForm.followUpDate,
        doctorAdvice: clinicalForm.doctorAdvice
      }

      const res = await fetch('/api/medical-examination/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const updated: MedicalRecordItem = await res.json()
        setCurrentRecord(updated)
        showAlert(`Đã lưu lịch hẹn tái khám ngày ${clinicalForm.followUpDate}`)
      } else {
        showAlert('Không thể lưu lịch hẹn tái khám', 'error')
      }
    } catch {
      showAlert('Lỗi khi hẹn tái khám', 'error')
    }
  }

  const handleCompleteEncounter = async () => {
    if (!activeTicket) {
      showAlert('Vui lòng chọn một bệnh nhân từ hàng đợi để kết thúc phiên khám', 'error')
      return
    }

    const effectiveFinalDiagnosis = (clinicalForm.finalDiagnosis || '').trim() ||
      (clinicalForm.initialDiagnosis || '').trim() ||
      (clinicalForm.icd10Code ? `Chẩn đoán theo mã ${clinicalForm.icd10Code}` : '')

    if (!effectiveFinalDiagnosis) {
      showAlert('Bác sĩ bắt buộc phải nhập Chẩn đoán xác định (hoặc chẩn đoán sơ bộ) trước khi kết thúc phiên khám', 'error')
      setActiveTab('clinical')
      return
    }

    try {
      let recordId = currentRecord ? currentRecord.id : null

      // Tự động khởi tạo hồ sơ bệnh án nếu chưa có sẵn
      if (!recordId) {
        const initRes = await fetch('/api/medical-examination/diagnosis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId: activeTicket.id,
            patientId: activeTicket.patientId,
            doctorId: currentUser?.id || 2,
            roomId: selectedRoomId,
            vitalSignsId: currentVitalSigns ? currentVitalSigns.id : null,
            chiefComplaint: clinicalForm.chiefComplaint || 'Khám bệnh hoàn tất',
            historyOfPresentIllness: clinicalForm.historyOfPresentIllness,
            physicalExamination: clinicalForm.physicalExamination,
            initialDiagnosis: clinicalForm.initialDiagnosis || effectiveFinalDiagnosis,
            finalDiagnosis: effectiveFinalDiagnosis,
            icd10Code: clinicalForm.icd10Code,
            doctorAdvice: clinicalForm.doctorAdvice,
            followUpDate: clinicalForm.followUpDate || null,
            status: 'IN_PROGRESS'
          })
        })

        if (initRes.ok) {
          const initRecord: MedicalRecordItem = await initRes.json()
          recordId = initRecord.id
          setCurrentRecord(initRecord)
        } else {
          const errText = await initRes.text()
          showAlert(`Không thể khởi tạo hồ sơ bệnh án: ${errText}`, 'error')
          return
        }
      }

      const payload = {
        medicalRecordId: recordId,
        ticketId: activeTicket.id,
        patientId: activeTicket.patientId,
        doctorId: currentUser?.id || 2,
        roomId: selectedRoomId,
        chiefComplaint: clinicalForm.chiefComplaint,
        finalDiagnosis: effectiveFinalDiagnosis,
        icd10Code: clinicalForm.icd10Code,
        doctorAdvice: clinicalForm.doctorAdvice,
        followUpDate: clinicalForm.followUpDate || null
      }

      const res = await fetch('/api/medical-examination/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const completed: MedicalRecordItem = await res.json()
        setCurrentRecord(completed)
        setClinicalForm(prev => ({
          ...prev,
          finalDiagnosis: effectiveFinalDiagnosis
        }))
        showAlert(`Đã hoàn tất phiên khám cho bệnh nhân ${activeTicket.patientName}. Số thứ tự đã chuyển sang hoàn thành!`)
        loadRoomQueue(selectedRoomId)
        loadPatientHistory(activeTicket.patientId)
      } else {
        const msg = await res.text()
        showAlert(`Không thể kết thúc phiên khám: ${msg}`, 'error')
      }
    } catch {
      showAlert('Lỗi khi kết thúc phiên khám', 'error')
    }
  }

  const handleOpenPrintPreview = async (recordId?: number) => {
    const id = recordId || (currentRecord ? currentRecord.id : null)
    if (!id) {
      showAlert('Chưa có phiên khám để in tóm tắt bệnh án', 'error')
      return
    }

    setLoadingPrint(true)
    try {
      const res = await fetch(`/api/medical-examination/print-summary/${id}`)
      if (res.ok) {
        const data: MedicalSummaryPrintData = await res.json()
        setPrintData(data)
        setPrintModalOpen(true)
      } else {
        showAlert('Không thể lấy thông tin tóm tắt bệnh án', 'error')
      }
    } catch {
      showAlert('Lỗi kết nối khi tải phiếu in', 'error')
    } finally {
      setLoadingPrint(false)
    }
  }

  const renderTicketStatusBadge = (status: string) => {
    switch (status) {
      case 'SERVING':
        return (
          <span style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
            Đang phục vụ
          </span>
        )
      case 'CALLED':
        return (
          <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc', padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
            Đã gọi vào
          </span>
        )
      case 'WAITING':
        return (
          <span style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fcd34d', padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
            Chờ tiếp nhận
          </span>
        )
      case 'COMPLETED':
        return (
          <span style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
            Đã xong
          </span>
        )
      default:
        return <span>{status}</span>
    }
  }

  const liveBmi = computeCurrentBmi()
  const liveBmiAssessment = getBmiAssessment(liveBmi)
  const liveBpAssessment = getBloodPressureAssessment(vitalForm.bloodPressureSystolic, vitalForm.bloodPressureDiastolic)
  const liveTempAssessment = getTemperatureAssessment(vitalForm.temperature)
  const liveSpo2Assessment = getSpo2Assessment(vitalForm.spo2)

  return (
    <div style={{ background: '#f8fafc', minHeight: '88vh', padding: '24px 0 60px' }}>
      {/* Thông báo Alert */}
      {alertMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '14px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            maxWidth: '420px',
            background: alertMessage.type === 'success' ? '#f0fdf4' : alertMessage.type === 'error' ? '#fef2f2' : '#f0f9ff',
            border: `1px solid ${alertMessage.type === 'success' ? '#86efac' : alertMessage.type === 'error' ? '#fca5a5' : '#7dd3fc'}`,
            color: alertMessage.type === 'success' ? '#166534' : alertMessage.type === 'error' ? '#991b1b' : '#075985',
            fontWeight: 650,
            fontSize: '13.5px'
          }}
        >
          {alertMessage.text}
        </div>
      )}

      <div className="container" style={{ maxWidth: '1260px' }}>
        {/* BANNER HEADER */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '20px 24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a', fontWeight: 800 }}>
                {workingMode === 'nurse' ? 'Bàn Tiếp Nhận & Đo Chỉ Số Sinh Hiệu' : 'Phòng Khám Lâm Sàng Bác Sĩ'}
              </h1>
              <span
                style={{
                  background: workingMode === 'nurse' ? '#ccfbf1' : '#e0e7ff',
                  color: workingMode === 'nurse' ? '#0f766e' : '#3730a3',
                  border: `1px solid ${workingMode === 'nurse' ? '#5eead4' : '#c7d2fe'}`,
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                {workingMode === 'nurse' ? 'Giao diện Điều dưỡng' : 'Giao diện Bác sĩ'}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13.5px' }}>
              {workingMode === 'nurse'
                ? 'Đo và ghi nhận thân nhiệt, huyết áp, mạch, SpO2, thể trạng chiều cao, cân nặng, tự động tính BMI chuẩn y khoa'
                : 'Khám lâm sàng các cơ quan, chẩn đoán ICD-10, chỉ định dịch vụ cận lâm sàng và in tóm tắt hồ sơ bệnh án'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Bộ chuyển đổi góc nhìn */}
            <div
              style={{
                background: '#f1f5f9',
                padding: '4px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                gap: '4px'
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setWorkingMode('nurse')
                  setActiveTab('vitals')
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: workingMode === 'nurse' ? '#ffffff' : 'transparent',
                  color: workingMode === 'nurse' ? 'var(--primary-dark)' : '#64748b',
                  boxShadow: workingMode === 'nurse' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Góc nhìn Điều dưỡng
              </button>
              <button
                type="button"
                onClick={() => {
                  setWorkingMode('doctor')
                  setActiveTab('clinical')
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: workingMode === 'doctor' ? '#ffffff' : 'transparent',
                  color: workingMode === 'doctor' ? '#4338ca' : '#64748b',
                  boxShadow: workingMode === 'doctor' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Góc nhìn Bác sĩ
              </button>
            </div>

            {/* Chọn phòng khám */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569' }}>Phòng:</span>
              <select
                value={selectedRoomId}
                onChange={e => setSelectedRoomId(Number(e.target.value))}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: '13px',
                  fontWeight: 650,
                  color: '#0f172a',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.roomNumber} - {r.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => selectedRoomId && loadRoomQueue(selectedRoomId)}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '7px 14px',
                fontSize: '12.5px',
                fontWeight: 650,
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              Làm mới hàng đợi
            </button>
          </div>
        </div>

        {/* LAYOUT 2 CỘT */}
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '20px', alignItems: 'start' }}>
          {/* CỘT TRÁI (350px): Danh sách bệnh nhân chờ khám */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '16px',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {workingMode === 'nurse' ? 'Bệnh Nhân Chờ Đo Sinh Hiệu' : 'Hàng Đợi Phòng Khám'}
                </h2>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {queueTickets.filter(t => t.status !== 'COMPLETED').length} người đang chờ / phục vụ
                </span>
              </div>
            </div>

            <div style={{ maxHeight: '720px', overflowY: 'auto' }}>
              {loadingQueue ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                  Đang tải danh sách hàng đợi...
                </div>
              ) : queueTickets.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                  Hiện chưa có bệnh nhân nào trong hàng đợi của phòng này hôm nay.
                </div>
              ) : (
                queueTickets.map(ticket => {
                  const isSelected = activeTicket?.id === ticket.id
                  return (
                    <div
                      key={ticket.id}
                      onClick={() => setActiveTicket(ticket)}
                      style={{
                        padding: '14px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f1f5f9',
                        background: isSelected ? '#f0fdfa' : '#ffffff',
                        borderLeft: isSelected ? '4px solid var(--primary)' : '4px solid transparent',
                        transition: 'background 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '10px',
                            background: 'var(--primary)',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '14px'
                          }}
                        >
                          {ticket.ticketNumber}
                        </span>
                        {renderTicketStatusBadge(ticket.status)}
                      </div>

                      <div>
                        <div style={{ fontWeight: 750, color: '#0f172a', fontSize: '14px' }}>
                          {ticket.patientName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          {ticket.patientGender === 'FEMALE' ? 'Nữ' : 'Nam'} &bull; SĐT: {ticket.patientPhone}
                        </div>
                        {ticket.priority !== 'NORMAL' && (
                          <span
                            style={{
                              display: 'inline-block',
                              marginTop: '4px',
                              background: '#fef3c7',
                              color: '#92400e',
                              border: '1px solid #fde68a',
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '6px'
                            }}
                          >
                            Ưu tiên: {ticket.priority === 'EMERGENCY' ? 'Cấp cứu' : 'Ưu tiên'}
                          </span>
                        )}
                        {ticket.notes && (
                          <div
                            style={{
                              fontSize: '11.5px',
                              color: '#475569',
                              marginTop: '6px',
                              background: '#f8fafc',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              fontStyle: 'italic'
                            }}
                          >
                            {ticket.notes}
                          </div>
                        )}
                      </div>

                      <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                        {ticket.status === 'WAITING' && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation()
                              handleCallPatient(ticket)
                            }}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Gọi vào
                          </button>
                        )}

                        {ticket.status === 'CALLED' && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation()
                              handleStartServing(ticket)
                            }}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: '#f0fdf4',
                              color: '#15803d',
                              border: '1px solid #bbf7d0',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Tiếp nhận
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation()
                            setActiveTicket(ticket)
                          }}
                          style={{
                            marginLeft: 'auto',
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Chọn hồ sơ
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* CỘT PHẢI: MÀN HÌNH LÀM VIỆC CHÍNH */}
          <div>
            {activeTicket ? (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  overflow: 'hidden'
                }}
              >
                {/* THANH BANNER THÔNG TIN BỆNH NHÂN */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, var(--primary-dark) 0%, #0f172a 100%)',
                    color: '#ffffff',
                    padding: '18px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px', fontWeight: 800 }}>{activeTicket.patientName}</span>
                      <span
                        style={{
                          background: 'rgba(255,255,255,0.2)',
                          padding: '2px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 700
                        }}
                      >
                        Số {activeTicket.ticketNumber} &bull; Mã: {activeTicket.ticketCode}
                      </span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#cbd5e1', marginTop: '4px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <span>Giới tính: {activeTicket.patientGender === 'FEMALE' ? 'Nữ' : 'Nam'}</span>
                      <span>SĐT: {activeTicket.patientPhone}</span>
                      {activeTicket.patientAge && <span>Tuổi: {activeTicket.patientAge}</span>}
                      {activeTicket.identityCard && <span>CCCD: {activeTicket.identityCard}</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {workingMode === 'nurse' && currentVitalSigns && (
                      <button
                        type="button"
                        onClick={() => setVitalPrintModalOpen(true)}
                        style={{
                          background: 'rgba(255,255,255,0.15)',
                          color: '#ffffff',
                          border: '1px solid rgba(255,255,255,0.3)',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        In phiếu sinh hiệu
                      </button>
                    )}

                    {workingMode === 'doctor' && currentRecord && (
                      <button
                        type="button"
                        onClick={() => handleOpenPrintPreview(currentRecord.id)}
                        disabled={loadingPrint}
                        style={{
                          background: 'rgba(255,255,255,0.15)',
                          color: '#ffffff',
                          border: '1px solid rgba(255,255,255,0.3)',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        In phiếu khám
                      </button>
                    )}

                    {workingMode === 'doctor' && (
                      <button
                        type="button"
                        onClick={handleCompleteEncounter}
                        style={{
                          background: '#10b981',
                          color: '#ffffff',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontSize: '12.5px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)'
                        }}
                      >
                        Kết thúc phiên khám
                      </button>
                    )}
                  </div>
                </div>

                {/* THANH TABS CHỨC NĂNG */}
                <div
                  style={{
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    padding: '0 20px',
                    display: 'flex',
                    gap: '24px',
                    overflowX: 'auto'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveTab('vitals')}
                    style={{
                      background: 'none',
                      border: 'none',
                      borderBottom: activeTab === 'vitals' ? '3px solid var(--primary)' : '3px solid transparent',
                      color: activeTab === 'vitals' ? 'var(--primary-dark)' : '#64748b',
                      fontWeight: 750,
                      fontSize: '13.5px',
                      padding: '14px 4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>Chỉ số sinh hiệu</span>
                    {currentVitalSigns ? (
                      <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px' }}>
                        Đã đo
                      </span>
                    ) : (
                      <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px' }}>
                        Chưa đo
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('clinical')}
                    style={{
                      background: 'none',
                      border: 'none',
                      borderBottom: activeTab === 'clinical' ? '3px solid var(--primary)' : '3px solid transparent',
                      color: activeTab === 'clinical' ? 'var(--primary-dark)' : '#64748b',
                      fontWeight: 750,
                      fontSize: '13.5px',
                      padding: '14px 4px',
                      cursor: 'pointer'
                    }}
                  >
                    Khám lâm sàng & Chẩn đoán
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('lab')
                      if (currentRecord) loadLabOrders(currentRecord.id)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      borderBottom: activeTab === 'lab' ? '3px solid var(--primary)' : '3px solid transparent',
                      color: activeTab === 'lab' ? 'var(--primary-dark)' : '#64748b',
                      fontWeight: 750,
                      fontSize: '13.5px',
                      padding: '14px 4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>Cận lâm sàng & Kết quả</span>
                    {labOrders.length > 0 && (
                      <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px' }}>
                        {labOrders.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('prescription')
                      if (activeTicket) loadPatientPrescriptions(activeTicket.patientId)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      borderBottom: activeTab === 'prescription' ? '3px solid var(--primary)' : '3px solid transparent',
                      color: activeTab === 'prescription' ? 'var(--primary-dark)' : '#64748b',
                      fontWeight: 750,
                      fontSize: '13.5px',
                      padding: '14px 4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>Kê đơn thuốc</span>
                    {prescriptionItems.length > 0 ? (
                      <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px' }}>
                        {prescriptionItems.length} loại
                      </span>
                    ) : patientPrescriptions.length > 0 ? (
                      <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px' }}>
                        {patientPrescriptions.length} đơn cũ
                      </span>
                    ) : null}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('followup')}
                    style={{
                      background: 'none',
                      border: 'none',
                      borderBottom: activeTab === 'followup' ? '3px solid var(--primary)' : '3px solid transparent',
                      color: activeTab === 'followup' ? 'var(--primary-dark)' : '#64748b',
                      fontWeight: 750,
                      fontSize: '13.5px',
                      padding: '14px 4px',
                      cursor: 'pointer'
                    }}
                  >
                    Dặn dò & Hẹn tái khám
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    style={{
                      background: 'none',
                      border: 'none',
                      borderBottom: activeTab === 'history' ? '3px solid var(--primary)' : '3px solid transparent',
                      color: activeTab === 'history' ? 'var(--primary-dark)' : '#64748b',
                      fontWeight: 750,
                      fontSize: '13.5px',
                      padding: '14px 4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>Lịch sử bệnh án</span>
                    <span style={{ background: '#e2e8f0', color: '#334155', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
                      {patientHistory.length}
                    </span>
                  </button>
                </div>

                {/* NỘI DUNG TỪNG TAB */}
                <div style={{ padding: '24px' }}>
                  {/* TAB 1: GIAO DIỆN ĐO SINH HIỆU CHUYÊN BIỆT */}
                  {activeTab === 'vitals' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                      {/* Tiêu đề & Mẫu nhanh */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '12px',
                          paddingBottom: '16px',
                          borderBottom: '1px solid #e2e8f0'
                        }}
                      >
                        <div>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                            Bảng Đo Và Đánh Giá Chỉ Số Sinh Hiệu (Tiếp Nhận Y Khoa)
                          </h3>
                          <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#64748b' }}>
                            Điều dưỡng phụ trách: {currentVitalSigns?.nurseName || 'Trần Thị Lan (DD001)'}
                          </p>
                        </div>

                        {/* Các nút mẫu nhanh */}
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginRight: '4px' }}>
                            Mẫu nhanh:
                          </span>
                          <button
                            type="button"
                            onClick={() => applyQuickPreset('normal')}
                            style={{
                              background: '#f0fdf4',
                              color: '#166534',
                              border: '1px solid #bbf7d0',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Bình thường
                          </button>
                          <button
                            type="button"
                            onClick={() => applyQuickPreset('fever')}
                            style={{
                              background: '#fffbeb',
                              color: '#92400e',
                              border: '1px solid #fde68a',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Sốt cao
                          </button>
                          <button
                            type="button"
                            onClick={() => applyQuickPreset('hypertension')}
                            style={{
                              background: '#fef2f2',
                              color: '#991b1b',
                              border: '1px solid #fecaca',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Tăng huyết áp
                          </button>
                          <button
                            type="button"
                            onClick={() => applyQuickPreset('clear')}
                            style={{
                              background: '#f1f5f9',
                              color: '#475569',
                              border: '1px solid #cbd5e1',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Xóa trắng
                          </button>
                        </div>
                      </div>

                      {/* 6 THẺ SỐ LIỆU SINH HIỆU TRỰC QUAN */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                          gap: '16px'
                        }}
                      >
                        {/* 1. THÂN NHIỆT */}
                        <div
                          style={{
                            background: '#ffffff',
                            borderRadius: '14px',
                            border: '1px solid #e2e8f0',
                            padding: '16px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Thân Nhiệt
                            </span>
                            <span
                              style={{
                                background: liveTempAssessment.bg,
                                color: liveTempAssessment.color,
                                border: `1px solid ${liveTempAssessment.border}`,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 700
                              }}
                            >
                              {liveTempAssessment.label}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <input
                              type="number"
                              step="0.1"
                              value={vitalForm.temperature}
                              onChange={e => setVitalForm(prev => ({ ...prev, temperature: e.target.value }))}
                              placeholder="37.0"
                              style={{
                                fontSize: '26px',
                                fontWeight: 800,
                                color: '#0f172a',
                                width: '120px',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                outline: 'none'
                              }}
                            />
                            <span style={{ fontSize: '16px', fontWeight: 700, color: '#64748b' }}>°C</span>
                          </div>
                          <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                            Chuẩn: 36.5°C - 37.2°C (Sốt &gt;= 37.5°C)
                          </span>
                        </div>

                        {/* 2. HUYẾT ÁP */}
                        <div
                          style={{
                            background: '#ffffff',
                            borderRadius: '14px',
                            border: '1px solid #e2e8f0',
                            padding: '16px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Huyết Áp
                            </span>
                            <span
                              style={{
                                background: liveBpAssessment.bg,
                                color: liveBpAssessment.color,
                                border: `1px solid ${liveBpAssessment.border}`,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 700
                              }}
                            >
                              {liveBpAssessment.label}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="number"
                              value={vitalForm.bloodPressureSystolic}
                              onChange={e => setVitalForm(prev => ({ ...prev, bloodPressureSystolic: e.target.value }))}
                              placeholder="120"
                              style={{
                                fontSize: '20px',
                                fontWeight: 800,
                                color: '#0f172a',
                                width: '70px',
                                textAlign: 'center',
                                padding: '6px 4px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                outline: 'none'
                              }}
                            />
                            <span style={{ fontSize: '18px', fontWeight: 700, color: '#94a3b8' }}>/</span>
                            <input
                              type="number"
                              value={vitalForm.bloodPressureDiastolic}
                              onChange={e => setVitalForm(prev => ({ ...prev, bloodPressureDiastolic: e.target.value }))}
                              placeholder="80"
                              style={{
                                fontSize: '20px',
                                fontWeight: 800,
                                color: '#0f172a',
                                width: '70px',
                                textAlign: 'center',
                                padding: '6px 4px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                outline: 'none'
                              }}
                            />
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>mmHg</span>
                          </div>
                          <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                            Tâm thu / Tâm trương (&lt;130 / &lt;85)
                          </span>
                        </div>

                        {/* 3. MẠCH / NHỊP TIM */}
                        <div
                          style={{
                            background: '#ffffff',
                            borderRadius: '14px',
                            border: '1px solid #e2e8f0',
                            padding: '16px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Mạch / Nhịp Tim
                            </span>
                            <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                              Nghỉ ngơi
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <input
                              type="number"
                              value={vitalForm.heartRate}
                              onChange={e => setVitalForm(prev => ({ ...prev, heartRate: e.target.value }))}
                              placeholder="75"
                              style={{
                                fontSize: '26px',
                                fontWeight: 800,
                                color: '#0f172a',
                                width: '120px',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                outline: 'none'
                              }}
                            />
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>lần/phút</span>
                          </div>
                          <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                            Chuẩn: 60 - 100 lần/phút
                          </span>
                        </div>

                        {/* 4. NHỊP THỞ */}
                        <div
                          style={{
                            background: '#ffffff',
                            borderRadius: '14px',
                            border: '1px solid #e2e8f0',
                            padding: '16px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Tần Số Thở
                            </span>
                            <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                              Tự nhiên
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <input
                              type="number"
                              value={vitalForm.respiratoryRate}
                              onChange={e => setVitalForm(prev => ({ ...prev, respiratoryRate: e.target.value }))}
                              placeholder="18"
                              style={{
                                fontSize: '26px',
                                fontWeight: 800,
                                color: '#0f172a',
                                width: '120px',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                outline: 'none'
                              }}
                            />
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>lần/phút</span>
                          </div>
                          <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                            Chuẩn người lớn: 16 - 20 lần/phút
                          </span>
                        </div>

                        {/* 5. NỒNG ĐỘ SPO2 */}
                        <div
                          style={{
                            background: '#ffffff',
                            borderRadius: '14px',
                            border: '1px solid #e2e8f0',
                            padding: '16px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Nồng Độ SpO2
                            </span>
                            <span
                              style={{
                                background: liveSpo2Assessment.bg,
                                color: liveSpo2Assessment.color,
                                border: `1px solid ${liveSpo2Assessment.border}`,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 700
                              }}
                            >
                              {liveSpo2Assessment.label}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <input
                              type="number"
                              step="0.1"
                              value={vitalForm.spo2}
                              onChange={e => setVitalForm(prev => ({ ...prev, spo2: e.target.value }))}
                              placeholder="99"
                              style={{
                                fontSize: '26px',
                                fontWeight: 800,
                                color: '#0f172a',
                                width: '120px',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                outline: 'none'
                              }}
                            />
                            <span style={{ fontSize: '16px', fontWeight: 700, color: '#64748b' }}>%</span>
                          </div>
                          <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                            Chỉ số an toàn: &gt;= 96%
                          </span>
                        </div>

                        {/* 6. CHIỀU CAO - CÂN NẶNG & BMI */}
                        <div
                          style={{
                            background: '#ffffff',
                            borderRadius: '14px',
                            border: '1px solid #e2e8f0',
                            padding: '16px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Thể Trạng & BMI
                            </span>
                            <span
                              style={{
                                background: liveBmiAssessment.bg,
                                color: liveBmiAssessment.color,
                                border: `1px solid ${liveBmiAssessment.border}`,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 700
                              }}
                            >
                              {liveBmiAssessment.label}
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 650 }}>Cao (cm)</span>
                              <input
                                type="number"
                                step="0.5"
                                value={vitalForm.heightCm}
                                onChange={e => setVitalForm(prev => ({ ...prev, heightCm: e.target.value }))}
                                placeholder="168"
                                style={{
                                  fontSize: '15px',
                                  fontWeight: 800,
                                  color: '#0f172a',
                                  width: '100%',
                                  padding: '5px 8px',
                                  borderRadius: '8px',
                                  border: '1px solid #cbd5e1',
                                  outline: 'none',
                                  marginTop: '2px'
                                }}
                              />
                            </div>
                            <div>
                              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 650 }}>Nặng (kg)</span>
                              <input
                                type="number"
                                step="0.1"
                                value={vitalForm.weightKg}
                                onChange={e => setVitalForm(prev => ({ ...prev, weightKg: e.target.value }))}
                                placeholder="65"
                                style={{
                                  fontSize: '15px',
                                  fontWeight: 800,
                                  color: '#0f172a',
                                  width: '100%',
                                  padding: '5px 8px',
                                  borderRadius: '8px',
                                  border: '1px solid #cbd5e1',
                                  outline: 'none',
                                  marginTop: '2px'
                                }}
                              />
                            </div>
                          </div>

                          <div style={{ fontSize: '12px', fontWeight: 750, color: 'var(--primary-dark)', display: 'flex', justifyContent: 'space-between', paddingTop: '2px' }}>
                            <span>BMI tự động:</span>
                            <span>{liveBmi ? `${liveBmi} kg/m²` : '-'}</span>
                          </div>
                        </div>
                      </div>

                      {/* GHI CHÚ THỂ TRẠNG */}
                      <div
                        style={{
                          background: '#f8fafc',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <label style={{ fontSize: '12.5px', fontWeight: 750, color: '#334155' }}>
                          Ghi chú đánh giá thể trạng (Điều dưỡng tiếp nhận)
                        </label>
                        <input
                          type="text"
                          value={vitalForm.notes}
                          onChange={e => setVitalForm(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Bệnh nhân tỉnh táo, tiếp xúc tốt, da niêm mạc hồng hào, không khó thở, đi lại bình thường..."
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            fontSize: '13.5px',
                            color: '#0f172a',
                            outline: 'none',
                            width: '100%'
                          }}
                        />
                      </div>

                      {/* NÚT THAO TÁC CỦA ĐIỀU DƯỠNG */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                        {currentVitalSigns && (
                          <button
                            type="button"
                            onClick={() => setVitalPrintModalOpen(true)}
                            style={{
                              background: '#ffffff',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              padding: '10px 18px',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            In phiếu kết quả sinh hiệu
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleSaveVitalSigns(false)}
                          style={{
                            background: '#334155',
                            color: '#ffffff',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Lưu chỉ số sinh hiệu
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSaveVitalSigns(true)}
                          className="btn btn-primary"
                          style={{
                            padding: '10px 22px',
                            fontSize: '13.5px',
                            borderRadius: '8px'
                          }}
                        >
                          Lưu & Chuyển vào phòng Bác sĩ
                        </button>
                      </div>

                      {/* BẢNG LỊCH SỬ ĐO SINH HIỆU CỦA BỆNH NHÂN */}
                      <div style={{ paddingTop: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800, color: '#0f172a' }}>
                            Lịch Sử Đo Sinh Hiệu Của Bệnh Nhân ({vitalHistory.length} lần đo)
                          </h4>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>Theo dõi diễn tiến huyết áp & thể trạng</span>
                        </div>

                        {loadingVitalHistory ? (
                          <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>Đang tải lịch sử đo...</div>
                        ) : vitalHistory.length === 0 ? (
                          <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#64748b', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            Chưa có dữ liệu sinh hiệu trước đây của bệnh nhân.
                          </div>
                        ) : (
                          <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                              <thead>
                                <tr style={{ background: '#f1f5f9', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>
                                  <th style={{ padding: '10px 14px' }}>Thời gian đo</th>
                                  <th style={{ padding: '10px 14px' }}>Huyết áp</th>
                                  <th style={{ padding: '10px 14px' }}>Thân nhiệt</th>
                                  <th style={{ padding: '10px 14px' }}>Mạch</th>
                                  <th style={{ padding: '10px 14px' }}>SpO2</th>
                                  <th style={{ padding: '10px 14px' }}>BMI</th>
                                  <th style={{ padding: '10px 14px' }}>Điều dưỡng</th>
                                  <th style={{ padding: '10px 14px' }}>Ghi chú</th>
                                </tr>
                              </thead>
                              <tbody>
                                {vitalHistory.map(item => (
                                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '10px 14px', fontWeight: 650, color: '#0f172a' }}>
                                      {item.measuredAt?.replace('T', ' ').substring(0, 16)}
                                    </td>
                                    <td style={{ padding: '10px 14px', fontWeight: 800, color: 'var(--primary-dark)' }}>
                                      {item.bloodPressureSystolic}/{item.bloodPressureDiastolic} mmHg
                                      {item.bloodPressureStatus && (
                                        <span style={{ display: 'block', fontSize: '10.5px', color: '#64748b', fontWeight: 500 }}>
                                          {item.bloodPressureStatus}
                                        </span>
                                      )}
                                    </td>
                                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{item.temperature ? `${item.temperature} °C` : '-'}</td>
                                    <td style={{ padding: '10px 14px' }}>{item.heartRate ? `${item.heartRate} bpm` : '-'}</td>
                                    <td style={{ padding: '10px 14px' }}>{item.spo2 ? `${item.spo2} %` : '-'}</td>
                                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                                      {item.bmi || '-'}
                                      {item.bmiCategory && (
                                        <span style={{ display: 'block', fontSize: '10.5px', color: '#64748b', fontWeight: 500 }}>
                                          {item.bmiCategory}
                                        </span>
                                      )}
                                    </td>
                                    <td style={{ padding: '10px 14px' }}>{item.nurseName || 'Điều dưỡng'}</td>
                                    <td style={{ padding: '10px 14px', color: '#64748b', fontStyle: 'italic' }}>{item.notes || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: KHÁM LÂM SÀNG & CHẨN ĐOÁN (BÁC SĨ) */}
                  {activeTab === 'clinical' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                            Khám Lâm Sàng và Ghi Nhận Chẩn Đoán
                          </h3>
                          <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#64748b' }}>
                            Bác sĩ ghi nhận lý do vào khám, triệu chứng, tiền sử và chẩn đoán phân loại ICD-10
                          </p>
                        </div>
                        {currentRecord && (
                          <span style={{ background: '#f1f5f9', color: '#334155', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>
                            Hồ sơ: {currentRecord.recordCode} ({currentRecord.status})
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            Lý do vào khám <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <input
                            type="text"
                            value={clinicalForm.chiefComplaint}
                            onChange={e => setClinicalForm(prev => ({ ...prev, chiefComplaint: e.target.value }))}
                            placeholder="Ví dụ: Đau đầu âm ỉ vùng trán kèm chóng mặt 2 ngày nay..."
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '13.5px',
                              outline: 'none'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            Bệnh sử chi tiết
                          </label>
                          <textarea
                            rows={3}
                            value={clinicalForm.historyOfPresentIllness}
                            onChange={e => setClinicalForm(prev => ({ ...prev, historyOfPresentIllness: e.target.value }))}
                            placeholder="Quá trình khởi phát bệnh, các thuốc đã dùng, biểu hiện tăng giảm..."
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            Khám thực thể lâm sàng
                          </label>
                          <textarea
                            rows={3}
                            value={clinicalForm.physicalExamination}
                            onChange={e => setClinicalForm(prev => ({ ...prev, physicalExamination: e.target.value }))}
                            placeholder="Khám tim mạch, hô hấp, tiêu hóa, thần kinh, vận động..."
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            Chẩn đoán sơ bộ
                          </label>
                          <input
                            type="text"
                            value={clinicalForm.initialDiagnosis}
                            onChange={e => setClinicalForm(prev => ({ ...prev, initialDiagnosis: e.target.value }))}
                            placeholder="Ví dụ: Theo dõi Đau đầu vận mạch / Rối loạn tiền đình"
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '13.5px',
                              outline: 'none'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            Mã bệnh quốc tế ICD-10
                          </label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="text"
                              value={clinicalForm.icd10Code}
                              onChange={e => setClinicalForm(prev => ({ ...prev, icd10Code: e.target.value }))}
                              placeholder="G44.2, I10, J02.9, K29.7..."
                              style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '13.5px',
                                textTransform: 'uppercase',
                                outline: 'none'
                              }}
                            />
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {['G44.2', 'I10', 'J02.9'].map(code => (
                                <button
                                  key={code}
                                  type="button"
                                  onClick={() => setClinicalForm(prev => ({ ...prev, icd10Code: code }))}
                                  style={{
                                    background: '#f1f5f9',
                                    border: '1px solid #cbd5e1',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontFamily: 'monospace',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {code}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                              Chẩn đoán xác định <span style={{ color: '#ef4444' }}>(Bắt buộc trước khi kết thúc phiên khám)</span>
                            </label>

                            {clinicalForm.initialDiagnosis.trim() && !clinicalForm.finalDiagnosis.trim() && (
                              <button
                                type="button"
                                onClick={() => setClinicalForm(prev => ({ ...prev, finalDiagnosis: prev.initialDiagnosis }))}
                                style={{
                                  background: '#eff6ff',
                                  color: '#1d4ed8',
                                  border: '1px solid #bfdbfe',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '11.5px',
                                  fontWeight: 650,
                                  cursor: 'pointer'
                                }}
                              >
                                Sao chép từ chẩn đoán sơ bộ
                              </button>
                            )}
                          </div>

                          <input
                            type="text"
                            value={clinicalForm.finalDiagnosis}
                            onChange={e => setClinicalForm(prev => ({ ...prev, finalDiagnosis: e.target.value }))}
                            placeholder="Ví dụ: Đau đầu do căng thẳng thần kinh (Tension-type headache)"
                            style={{
                              width: '100%',
                              padding: '11px 14px',
                              borderRadius: '8px',
                              border: `1px solid ${clinicalForm.finalDiagnosis.trim() || clinicalForm.initialDiagnosis.trim() ? '#10b981' : '#cbd5e1'}`,
                              fontSize: '14px',
                              fontWeight: 650,
                              color: '#0f172a',
                              outline: 'none',
                              background: clinicalForm.finalDiagnosis.trim() ? '#f0fdf4' : '#ffffff'
                            }}
                          />

                          {/* Gợi ý chẩn đoán nhanh & mã ICD-10 */}
                          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Nạp nhanh:</span>
                            {[
                              { label: 'Viêm họng cấp', code: 'J02.9' },
                              { label: 'Viêm phế quản cấp', code: 'J20.9' },
                              { label: 'Tăng huyết áp nguyên phát', code: 'I10' },
                              { label: 'Viêm dạ dày cấp', code: 'K29.7' },
                              { label: 'Rối loạn tiền đình', code: 'H81.9' },
                              { label: 'Đau đầu căng thẳng', code: 'G44.2' }
                            ].map(item => (
                              <button
                                key={item.label}
                                type="button"
                                onClick={() => {
                                  setClinicalForm(prev => ({
                                    ...prev,
                                    finalDiagnosis: `${item.label} (${item.code})`,
                                    initialDiagnosis: prev.initialDiagnosis || item.label,
                                    icd10Code: item.code
                                  }))
                                }}
                                style={{
                                  background: '#f8fafc',
                                  border: '1px solid #e2e8f0',
                                  padding: '4px 9px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  color: '#334155',
                                  cursor: 'pointer'
                                }}
                              >
                                {item.label} ({item.code})
                              </button>
                            ))}
                          </div>

                          {/* Thông báo trạng thái sẵn sàng kết thúc */}
                          <div style={{ marginTop: '10px' }}>
                            {clinicalForm.finalDiagnosis.trim() || clinicalForm.initialDiagnosis.trim() || clinicalForm.icd10Code.trim() ? (
                              <div
                                style={{
                                  background: '#f0fdf4',
                                  border: '1px solid #bbf7d0',
                                  color: '#15803d',
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: 650
                                }}
                              >
                                Đã có chẩn đoán hợp lệ (
                                {clinicalForm.finalDiagnosis.trim() || clinicalForm.initialDiagnosis.trim() || clinicalForm.icd10Code.trim()}
                                ) &bull; Bác sĩ có thể bấm nút <strong>&quot;Kết thúc phiên khám&quot;</strong> ở góc trên bất cứ lúc nào.
                              </div>
                            ) : (
                              <div
                                style={{
                                  background: '#fffbeb',
                                  border: '1px solid #fde68a',
                                  color: '#b45309',
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: 600
                                }}
                              >
                                Chưa có chẩn đoán. Vui lòng nhập Chẩn đoán xác định hoặc Chẩn đoán sơ bộ trước khi kết thúc phiên khám.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                        <button
                          type="button"
                          onClick={() => handleSaveDiagnosis('IN_PROGRESS')}
                          className="btn btn-primary"
                          style={{ padding: '10px 22px', fontSize: '13px', borderRadius: '8px' }}
                        >
                          Lưu diễn biến khám
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: CHỈ ĐỊNH CẬN LÂM SÀNG & XEM KẾT QUẢ */}
                  {activeTab === 'lab' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                          Chỉ Định & Theo Dõi Kết Quả Cận Lâm Sàng
                        </h3>
                        <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#64748b' }}>
                          Chỉ định các xét nghiệm sinh hóa, huyết học, X-quang, siêu âm và nội soi
                        </p>
                      </div>

                      {/* Tạo chỉ định mới */}
                      <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                          Tạo Phiếu Chỉ Định Dịch Vụ Mới
                        </h4>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                          {availableServices.map(srv => {
                            const isChecked = selectedServiceIds.includes(srv.id)
                            return (
                              <label
                                key={srv.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '10px',
                                  padding: '12px',
                                  borderRadius: '10px',
                                  border: isChecked ? '1px solid var(--primary)' : '1px solid #cbd5e1',
                                  background: isChecked ? '#f0fdfa' : '#ffffff',
                                  cursor: 'pointer'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      setSelectedServiceIds(prev => [...prev, srv.id])
                                    } else {
                                      setSelectedServiceIds(prev => prev.filter(id => id !== srv.id))
                                    }
                                  }}
                                  style={{ marginTop: '3px', cursor: 'pointer' }}
                                />
                                <div>
                                  <div style={{ fontSize: '13px', fontWeight: 750, color: '#0f172a', lineHeight: 1.3 }}>{srv.name}</div>
                                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                                    Mã: {srv.code} &bull; Giá: {srv.price?.toLocaleString('vi-VN')} đ
                                  </div>
                                </div>
                              </label>
                            )
                          })}
                        </div>

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: '260px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                              Ghi chú lâm sàng cho kỹ thuật viên
                            </label>
                            <input
                              type="text"
                              value={labNote}
                              onChange={e => setLabNote(e.target.value)}
                              placeholder="Ví dụ: Nghi ngờ viêm họng cấp / Kiểm tra chức năng gan..."
                              style={{
                                width: '100%',
                                padding: '9px 12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '13px',
                                background: '#ffffff',
                                outline: 'none'
                              }}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleOrderLabServices}
                            disabled={selectedServiceIds.length === 0}
                            className="btn btn-primary"
                            style={{
                              padding: '10px 20px',
                              fontSize: '13px',
                              borderRadius: '8px',
                              opacity: selectedServiceIds.length === 0 ? 0.5 : 1,
                              cursor: selectedServiceIds.length === 0 ? 'not-allowed' : 'pointer'
                            }}
                          >
                            Tạo phiếu chỉ định ({selectedServiceIds.length})
                          </button>
                        </div>
                      </div>

                      {/* Danh sách phiếu chỉ định */}
                      <div>
                        <h4 style={{ margin: '0 0 12px', fontSize: '14.5px', fontWeight: 800, color: '#0f172a' }}>
                          Danh Sách Phiếu Cận Lâm Sàng Đã Chỉ Định
                        </h4>

                        {labOrders.length === 0 ? (
                          <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: '#64748b', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                            Chưa có chỉ định cận lâm sàng nào trong phiên khám này.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {labOrders.map(order => (
                              <div
                                key={order.id}
                                style={{
                                  background: '#ffffff',
                                  borderRadius: '12px',
                                  border: '1px solid #e2e8f0',
                                  overflow: 'hidden'
                                }}
                              >
                                <div
                                  style={{
                                    padding: '12px 16px',
                                    background: '#f8fafc',
                                    borderBottom: '1px solid #e2e8f0',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '8px'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontWeight: 800, fontSize: '13.5px', color: '#0f172a' }}>{order.orderCode}</span>
                                    <span
                                      style={{
                                        background: order.status === 'COMPLETED' ? '#dcfce7' : '#fef3c7',
                                        color: order.status === 'COMPLETED' ? '#15803d' : '#b45309',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        padding: '2px 8px',
                                        borderRadius: '12px'
                                      }}
                                    >
                                      {order.status === 'COMPLETED' ? 'Đã có kết quả' : 'Đang chờ xử lý'}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                                    Ngày lập: {order.createdAt?.replace('T', ' ').substring(0, 19)}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  {order.items?.map(item => (
                                    <div
                                      key={item.id}
                                      style={{
                                        padding: '14px 16px',
                                        borderBottom: '1px solid #f1f5f9',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '12px',
                                        flexWrap: 'wrap'
                                      }}
                                    >
                                      <div style={{ flex: 1, minWidth: '240px' }}>
                                        <div style={{ fontWeight: 750, color: '#0f172a', fontSize: '13.5px' }}>{item.serviceName}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                          Mã: {item.serviceCode} &bull; Nhóm: {item.categoryName || 'Cận lâm sàng'}
                                        </div>

                                        {item.status === 'COMPLETED' ? (
                                          <div
                                            style={{
                                              marginTop: '8px',
                                              background: '#f0fdf4',
                                              border: '1px solid #bbf7d0',
                                              padding: '8px 12px',
                                              borderRadius: '8px',
                                              fontSize: '12px'
                                            }}
                                          >
                                            <div>
                                              <span style={{ fontWeight: 700, color: '#166534' }}>Kết quả:</span>{' '}
                                              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '13.5px' }}>
                                                {item.testValue} {item.unit}
                                              </span>{' '}
                                              <span style={{ color: '#64748b' }}>(Tham chiếu: {item.referenceRange})</span>
                                            </div>
                                            {item.conclusion && (
                                              <div style={{ marginTop: '2px', color: '#334155' }}>
                                                <span style={{ fontWeight: 700, color: '#166534' }}>Kết luận:</span> {item.conclusion}
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <div style={{ marginTop: '6px', fontSize: '12px', color: '#d97706', fontStyle: 'italic', fontWeight: 500 }}>
                                            Đang chờ kỹ thuật viên thực hiện xét nghiệm...
                                          </div>
                                        )}
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => openEditResultModal(item)}
                                        style={{
                                          background: '#ffffff',
                                          border: '1px solid #cbd5e1',
                                          color: '#334155',
                                          padding: '6px 12px',
                                          borderRadius: '6px',
                                          fontSize: '12px',
                                          fontWeight: 650,
                                          cursor: 'pointer'
                                        }}
                                      >
                                        {item.status === 'COMPLETED' ? 'Sửa kết quả' : 'Nhập kết quả mẫu'}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB: KÊ ĐƠN THUỐC (UC-DT01, UC-DT02, UC-DT03) */}
                  {activeTab === 'prescription' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ paddingBottom: '12px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                            Kê Đơn Thuốc Điều Trị Ngoại Trú
                          </h3>
                          <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#64748b' }}>
                            Kê đơn theo hoạt chất, kiểm tra tự động dị ứng thuốc (Allergy Check), tự động tính liều và xuất mẫu in A4
                          </p>
                        </div>

                        <div style={{ fontSize: '13px', color: '#334155', background: '#f1f5f9', padding: '6px 12px', borderRadius: '8px' }}>
                          Chẩn đoán phiên khám:{' '}
                          <strong style={{ color: '#0f172a' }}>
                            {clinicalForm.finalDiagnosis.trim() || clinicalForm.initialDiagnosis.trim() || 'Chưa nhập chẩn đoán'}
                          </strong>
                          {clinicalForm.icd10Code && <span style={{ color: '#64748b' }}> ({clinicalForm.icd10Code})</span>}
                        </div>
                      </div>

                      {/* KHUNG CẢNH BÁO DỊ ỨNG NẾU CÓ */}
                      {allergyAlert && allergyAlert.hasAllergyAlert && (
                        <div
                          style={{
                            background: '#fef2f2',
                            border: '1.5px solid #f87171',
                            borderRadius: '12px',
                            padding: '16px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span
                                style={{
                                  background: '#dc2626',
                                  color: '#ffffff',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  padding: '3px 8px',
                                  borderRadius: '6px'
                                }}
                              >
                                CẢNH BÁO NGUY HIỂM
                              </span>
                              <strong style={{ color: '#991b1b', fontSize: '14px' }}>
                                Phát hiện xung đột dị ứng thuốc với tiền sử bệnh nhân!
                              </strong>
                            </div>
                            <button
                              type="button"
                              onClick={() => setAllergyModalOpen(true)}
                              style={{
                                background: '#dc2626',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 14px',
                                borderRadius: '6px',
                                fontSize: '12.5px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Xử lý cảnh báo
                            </button>
                          </div>

                          <div style={{ fontSize: '13px', color: '#7f1d1d' }}>
                            {allergyAlert.warningMessage || allergyAlert.warnings?.map(w => w.message).join('; ')}
                          </div>

                          {overrideAllergyReason ? (
                            <div style={{ fontSize: '12px', color: '#15803d', background: '#dcfce7', padding: '6px 10px', borderRadius: '6px' }}>
                              Đã xác nhận lý do lâm sàng: <em>&quot;{overrideAllergyReason}&quot;</em>
                            </div>
                          ) : (
                            <div style={{ fontSize: '12px', color: '#b91c1c', fontStyle: 'italic' }}>
                              * Bác sĩ bắt buộc phải xác nhận lý do lâm sàng nếu vẫn quyết định chỉ định thuốc này.
                            </div>
                          )}
                        </div>
                      )}

                      {/* BIỂU MẪU CHỌN & THÊM THUỐC VÀO ĐƠN */}
                      <div
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '18px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px'
                        }}
                      >
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                          Thêm thuốc vào đơn
                        </h4>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                              Chọn thuốc từ kho dược <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <select
                              value={itemAddForm.medicineId}
                              onChange={e => {
                                const id = Number(e.target.value)
                                setItemAddForm(prev => ({ ...prev, medicineId: id }))
                              }}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '13px',
                                background: '#ffffff'
                              }}
                            >
                              {availableMedicines.map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.brandName} - Hoạt chất: {m.activeIngredient} (Tồn: {m.totalAvailableQuantity || 0} {m.unit}) - {(m.sellingPrice || 0).toLocaleString()} đ
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                              Số lượng tổng <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={itemAddForm.quantityPrescribed}
                              onChange={e => setItemAddForm(prev => ({ ...prev, quantityPrescribed: Number(e.target.value) }))}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '13px'
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                              Số ngày dùng thuốc
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={itemAddForm.durationDays}
                              onChange={e => setItemAddForm(prev => ({ ...prev, durationDays: Number(e.target.value) }))}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '13px'
                              }}
                            />
                          </div>
                        </div>

                        {/* PHÂN LIỀU DÙNG THEO CÁC BUỔI */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                              Sáng
                            </label>
                            <input
                              type="text"
                              value={itemAddForm.morningDose}
                              onChange={e => setItemAddForm(prev => ({ ...prev, morningDose: e.target.value }))}
                              placeholder="1"
                              style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                              Trưa
                            </label>
                            <input
                              type="text"
                              value={itemAddForm.noonDose}
                              onChange={e => setItemAddForm(prev => ({ ...prev, noonDose: e.target.value }))}
                              placeholder="0"
                              style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                              Chiều
                            </label>
                            <input
                              type="text"
                              value={itemAddForm.afternoonDose}
                              onChange={e => setItemAddForm(prev => ({ ...prev, afternoonDose: e.target.value }))}
                              placeholder="1"
                              style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                              Tối
                            </label>
                            <input
                              type="text"
                              value={itemAddForm.nightDose}
                              onChange={e => setItemAddForm(prev => ({ ...prev, nightDose: e.target.value }))}
                              placeholder="0"
                              style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: '280px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                              Hướng dẫn uống / Cách dùng
                            </label>
                            <input
                              type="text"
                              value={itemAddForm.usageInstructions}
                              onChange={e => setItemAddForm(prev => ({ ...prev, usageInstructions: e.target.value }))}
                              placeholder="Ví dụ: Uống sau khi ăn no 30 phút, uống với nhiều nước..."
                              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleAddMedicineItem}
                            style={{
                              background: 'var(--primary)',
                              color: '#ffffff',
                              border: 'none',
                              padding: '9px 20px',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: 750,
                              cursor: 'pointer'
                            }}
                          >
                            + Thêm vào đơn thuốc
                          </button>
                        </div>
                      </div>

                      {/* BẢNG CHI TIẾT CÁC THUỐC ĐANG KÊ */}
                      <div>
                        <h4 style={{ margin: '0 0 10px', fontSize: '14.5px', fontWeight: 800, color: '#0f172a' }}>
                          Danh sách thuốc trong đơn ({prescriptionItems.length})
                        </h4>

                        {prescriptionItems.length === 0 ? (
                          <div
                            style={{
                              padding: '28px',
                              textAlign: 'center',
                              fontSize: '13px',
                              color: '#64748b',
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '12px'
                            }}
                          >
                            Chưa có thuốc nào trong đơn thuốc hiện tại. Vui lòng chọn thuốc ở biểu mẫu bên trên để thêm vào.
                          </div>
                        ) : (
                          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: '#ffffff' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                              <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                                  <th style={{ padding: '10px 12px', width: '36px' }}>STT</th>
                                  <th style={{ padding: '10px 12px' }}>Tên thuốc / Hoạt chất</th>
                                  <th style={{ padding: '10px 12px', width: '80px', textAlign: 'center' }}>Số lượng</th>
                                  <th style={{ padding: '10px 12px', width: '70px' }}>Đơn vị</th>
                                  <th style={{ padding: '10px 12px' }}>Cách dùng & Liều lượng</th>
                                  <th style={{ padding: '10px 12px', width: '100px', textAlign: 'right' }}>Đơn giá</th>
                                  <th style={{ padding: '10px 12px', width: '110px', textAlign: 'right' }}>Thành tiền</th>
                                  <th style={{ padding: '10px 12px', width: '60px', textAlign: 'center' }}>Xóa</th>
                                </tr>
                              </thead>
                              <tbody>
                                {prescriptionItems.map((item, idx) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                                    <td style={{ padding: '10px 12px' }}>
                                      <strong style={{ color: '#0f172a' }}>{item.medicineName}</strong>
                                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>Hoạt chất: {item.activeIngredient}</div>
                                    </td>
                                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800 }}>
                                      {item.quantityPrescribed}
                                    </td>
                                    <td style={{ padding: '10px 12px', color: '#475569' }}>{item.unit}</td>
                                    <td style={{ padding: '10px 12px', color: '#334155' }}>
                                      <div>{item.usageInstructions}</div>
                                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>Dùng trong {item.durationDays} ngày</div>
                                    </td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#475569' }}>
                                      {item.unitPrice.toLocaleString()} đ
                                    </td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 750, color: '#059669' }}>
                                      {(item.unitPrice * item.quantityPrescribed).toLocaleString()} đ
                                    </td>
                                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                      <button
                                        type="button"
                                        onClick={() => handleRemovePrescriptionItem(idx)}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          color: '#dc2626',
                                          fontWeight: 700,
                                          cursor: 'pointer'
                                        }}
                                      >
                                        Xóa
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr style={{ background: '#f8fafc', fontWeight: 800, color: '#0f172a' }}>
                                  <td colSpan={6} style={{ padding: '12px', textAlign: 'right' }}>
                                    Tổng tiền đơn thuốc dự kiến:
                                  </td>
                                  <td style={{ padding: '12px', textAlign: 'right', color: '#059669', fontSize: '15px' }}>
                                    {prescriptionItems.reduce((acc, i) => acc + i.unitPrice * i.quantityPrescribed, 0).toLocaleString()} đ
                                  </td>
                                  <td />
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* LỜI DẶN DÒ ĐƠN THUỐC VÀ THAO TÁC LƯU */}
                      <div
                        style={{
                          background: '#ffffff',
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
                            Lời dặn bác sĩ trên đơn thuốc
                          </label>
                          <input
                            type="text"
                            value={prescriptionNotes}
                            onChange={e => setPrescriptionNotes(e.target.value)}
                            placeholder="Ví dụ: Tái khám khi hết thuốc hoặc nếu xuất hiện triệu chứng bất thường, uống nhiều nước..."
                            style={{
                              width: '100%',
                              padding: '9px 12px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '13px'
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                          <button
                            type="button"
                            onClick={handleSavePrescription}
                            disabled={savingPrescription || prescriptionItems.length === 0}
                            style={{
                              background: '#10b981',
                              color: '#ffffff',
                              border: 'none',
                              padding: '10px 24px',
                              borderRadius: '8px',
                              fontSize: '13.5px',
                              fontWeight: 800,
                              cursor: prescriptionItems.length === 0 ? 'not-allowed' : 'pointer',
                              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)'
                            }}
                          >
                            {savingPrescription ? 'Đang lưu đơn...' : 'Lưu và chuyển nhà thuốc'}
                          </button>
                        </div>
                      </div>

                      {/* DANH SÁCH CÁC ĐƠN THUỐC ĐÃ LẬP CỦA BỆNH NHÂN NÀY */}
                      <div>
                        <h4 style={{ margin: '0 0 10px', fontSize: '14.5px', fontWeight: 800, color: '#0f172a' }}>
                          Lịch sử các đơn thuốc đã lập của bệnh nhân ({patientPrescriptions.length})
                        </h4>

                        {patientPrescriptions.length === 0 ? (
                          <div style={{ padding: '20px', textAlign: 'center', fontSize: '12.5px', color: '#94a3b8', background: '#f8fafc', borderRadius: '10px' }}>
                            Bệnh nhân chưa có đơn thuốc nào trước đây
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {patientPrescriptions.map(p => (
                              <div
                                key={p.id}
                                style={{
                                  background: '#ffffff',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '10px',
                                  padding: '14px 18px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  flexWrap: 'wrap',
                                  gap: '12px'
                                }}
                              >
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{p.prescriptionCode}</strong>
                                    <span
                                      style={{
                                        background: p.status === 'PENDING_PAYMENT' ? '#fef3c7' : p.status === 'DISPENSED' ? '#dcfce7' : '#fee2e2',
                                        color: p.status === 'PENDING_PAYMENT' ? '#b45309' : p.status === 'DISPENSED' ? '#15803d' : '#b91c1c',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '11px',
                                        fontWeight: 700
                                      }}
                                    >
                                      {p.status}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                                    Ngày kê: {p.createdAt} &bull; BS: {p.doctorName} &bull; Chẩn đoán: {p.diagnosis}
                                  </div>
                                  <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '2px' }}>
                                    Gồm <strong>{p.items?.length || 0} loại thuốc</strong> &bull; Tổng tiền:{' '}
                                    <strong style={{ color: '#059669' }}>{(p.totalAmount || 0).toLocaleString()} đ</strong>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPrescriptionPrintModal(p.id)}
                                    style={{
                                      background: '#f1f5f9',
                                      border: '1px solid #cbd5e1',
                                      padding: '6px 14px',
                                      borderRadius: '6px',
                                      fontSize: '12px',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    In đơn thuốc A4
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: LỜI DẶN DÒ & HẸN TÁI KHÁM */}
                  {activeTab === 'followup' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      <div style={{ paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                          Lời Dặn Dò & Đặt Lịch Hẹn Tái Khám
                        </h3>
                        <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#64748b' }}>
                          Bác sĩ dặn dò chế độ điều trị, sinh hoạt và thiết lập ngày hẹn tái khám cho bệnh nhân
                        </p>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Lời dặn dò chế độ dinh dưỡng, nghỉ ngơi, dùng thuốc
                        </label>
                        <textarea
                          rows={4}
                          value={clinicalForm.doctorAdvice}
                          onChange={e => setClinicalForm(prev => ({ ...prev, doctorAdvice: e.target.value }))}
                          placeholder="Ví dụ: Uống thuốc đúng giờ sau ăn, hạn chế thức khuya, uống đủ 2 lít nước mỗi ngày, tái khám ngay nếu đau đầu dữ dội..."
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '13.5px',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Ngày hẹn tái khám
                        </label>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <input
                            type="date"
                            value={clinicalForm.followUpDate}
                            onChange={e => setClinicalForm(prev => ({ ...prev, followUpDate: e.target.value }))}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '13.5px',
                              fontWeight: 650,
                              outline: 'none'
                            }}
                          />

                          <div style={{ display: 'flex', gap: '6px' }}>
                            {[
                              { label: '+3 ngày', days: 3 },
                              { label: '+1 tuần', days: 7 },
                              { label: '+2 tuần', days: 14 },
                              { label: '+1 tháng', days: 30 }
                            ].map(item => (
                              <button
                                key={item.label}
                                type="button"
                                onClick={() => {
                                  const d = new Date()
                                  d.setDate(d.getDate() + item.days)
                                  setClinicalForm(prev => ({ ...prev, followUpDate: d.toISOString().split('T')[0] }))
                                }}
                                style={{
                                  background: '#f1f5f9',
                                  color: '#334155',
                                  border: '1px solid #cbd5e1',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 650,
                                  cursor: 'pointer'
                                }}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                        <button
                          type="button"
                          onClick={handleScheduleFollowUp}
                          className="btn btn-primary"
                          style={{ padding: '10px 22px', fontSize: '13px', borderRadius: '8px' }}
                        >
                          Lưu ngày hẹn tái khám
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: LỊCH SỬ BỆNH ÁN */}
                  {activeTab === 'history' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                            Lịch Sử Khám Bệnh Trước Đây
                          </h3>
                          <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#64748b' }}>
                            Xem toàn bộ hồ sơ bệnh án, chẩn đoán và chỉ định cận lâm sàng các lần khám trước
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => activeTicket && loadPatientHistory(activeTicket.patientId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Tải lại lịch sử
                        </button>
                      </div>

                      {loadingHistory ? (
                        <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>Đang tải lịch sử bệnh án...</div>
                      ) : patientHistory.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                          Bệnh nhân này chưa có hồ sơ bệnh án nào trước đây trên hệ thống.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {patientHistory.map(rec => (
                            <div
                              key={rec.id}
                              style={{
                                background: '#ffffff',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                padding: '16px'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontWeight: 800, color: 'var(--primary-dark)', fontSize: '14px' }}>{rec.recordCode}</span>
                                  <span style={{ background: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                                    {rec.status === 'COMPLETED' ? 'Đã hoàn thành' : rec.status}
                                  </span>
                                </div>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>
                                  Ngày khám: {rec.createdAt?.replace('T', ' ').substring(0, 19)}
                                </span>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px', fontSize: '12.5px' }}>
                                <div><span style={{ color: '#64748b' }}>Bác sĩ khám:</span> <span style={{ fontWeight: 700, color: '#0f172a' }}>{rec.doctorName || 'Bác sĩ'}</span></div>
                                <div><span style={{ color: '#64748b' }}>Phòng khám:</span> <span style={{ fontWeight: 700, color: '#0f172a' }}>{rec.roomName || 'Phòng khám'}</span></div>
                                <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#64748b' }}>Lý do khám:</span> <span style={{ color: '#0f172a' }}>{rec.chiefComplaint}</span></div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                  <span style={{ color: '#64748b' }}>Chẩn đoán:</span>{' '}
                                  <span style={{ fontWeight: 750, color: '#0f172a' }}>{rec.finalDiagnosis || rec.initialDiagnosis || 'Chưa ghi nhận'}</span>{' '}
                                  {rec.icd10Code && <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>[{rec.icd10Code}]</span>}
                                </div>
                                {rec.doctorAdvice && (
                                  <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#64748b' }}>Lời dặn:</span> <span style={{ color: '#475569' }}>{rec.doctorAdvice}</span></div>
                                )}
                              </div>

                              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenPrintPreview(rec.id)}
                                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', fontWeight: 750, cursor: 'pointer' }}
                                >
                                  Xem & In tóm tắt bệnh án này
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '48px 24px',
                  textAlign: 'center'
                }}
              >
                <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  Chưa chọn bệnh nhân để phục vụ
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Vui lòng chọn một bệnh nhân từ danh sách hàng đợi bên trái hoặc nhấn Gọi vào để bắt đầu phiên làm việc.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL IN PHIẾU SINH HIỆU */}
      {vitalPrintModalOpen && activeTicket && currentVitalSigns && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800, color: '#0f172a' }}>
                Phiếu Đo Chỉ Số Sinh Hiệu & Thể Trạng
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-primary"
                  style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '6px' }}
                >
                  In phiếu
                </button>
                <button
                  type="button"
                  onClick={() => setVitalPrintModalOpen(false)}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 650,
                    cursor: 'pointer'
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>

            <div style={{ padding: '24px', fontSize: '12.5px', color: '#0f172a' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary-dark)', letterSpacing: '1px' }}>
                  Phòng Khám Đa Khoa Quốc Tế CarePlus
                </div>
                <h2 style={{ margin: '4px 0 2px', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  Phiếu Đo Chỉ Số Sinh Hiệu Tiếp Nhận
                </h2>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Ngày đo: {currentVitalSigns.measuredAt?.replace('T', ' ').substring(0, 16)} &bull; STT: {activeTicket.ticketNumber} ({activeTicket.ticketCode})
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div><span style={{ color: '#64748b' }}>Họ tên:</span> <span style={{ fontWeight: 800 }}>{activeTicket.patientName}</span></div>
                <div><span style={{ color: '#64748b' }}>Giới tính:</span> <span>{activeTicket.patientGender === 'FEMALE' ? 'Nữ' : 'Nam'}</span></div>
                <div><span style={{ color: '#64748b' }}>Điện thoại:</span> <span>{activeTicket.patientPhone}</span></div>
                <div><span style={{ color: '#64748b' }}>Điều dưỡng:</span> <span>{currentVitalSigns.nurseName || 'Trần Thị Lan'}</span></div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', marginBottom: '14px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', fontSize: '11.5px', color: '#334155' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Chỉ số sinh hiệu</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Giá trị</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Đơn vị</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Đánh giá y khoa</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 650 }}>Thân nhiệt</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800 }}>{currentVitalSigns.temperature || '-'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>°C</td>
                    <td style={{ padding: '8px 10px' }}>{currentVitalSigns.temperatureStatus || 'Bình thường'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 650 }}>Huyết áp</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800 }}>
                      {currentVitalSigns.bloodPressureSystolic}/{currentVitalSigns.bloodPressureDiastolic}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>mmHg</td>
                    <td style={{ padding: '8px 10px' }}>{currentVitalSigns.bloodPressureStatus || 'Bình thường'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 650 }}>Mạch / Nhịp tim</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800 }}>{currentVitalSigns.heartRate || '-'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>lần/phút</td>
                    <td style={{ padding: '8px 10px' }}>Nghỉ ngơi chuẩn</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 650 }}>Nồng độ SpO2</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800 }}>{currentVitalSigns.spo2 || '-'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>%</td>
                    <td style={{ padding: '8px 10px' }}>{currentVitalSigns.spo2 && currentVitalSigns.spo2 >= 96 ? 'An toàn' : 'Theo dõi'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 10px', fontWeight: 650 }}>Chiều cao / Cân nặng</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800 }}>
                      {currentVitalSigns.heightCm} cm / {currentVitalSigns.weightKg} kg
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>Thể trạng</td>
                    <td style={{ padding: '8px 10px' }}>BMI: {currentVitalSigns.bmi} ({currentVitalSigns.bmiCategory || 'Chuẩn'})</td>
                  </tr>
                </tbody>
              </table>

              {currentVitalSigns.notes && (
                <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                  <span style={{ fontWeight: 700 }}>Ghi chú điều dưỡng:</span> {currentVitalSigns.notes}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', paddingTop: '10px' }}>
                <div>
                  <div style={{ fontWeight: 650 }}>Bệnh nhân / Thân nhân</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>(Ký tên)</div>
                </div>
                <div>
                  <div style={{ fontWeight: 650 }}>Điều dưỡng thực hiện</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', marginBottom: '32px' }}>(Ký và ghi rõ họ tên)</div>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{currentVitalSigns.nurseName || 'Trần Thị Lan'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IN PHIẾU KHÁM BỆNH BÁC SĨ (UC-KB08) */}
      {printModalOpen && printData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '820px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                Xem Trước & In Phiếu Khám Bệnh / Tóm Tắt Bệnh Án
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-primary"
                  style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '6px' }}
                >
                  In tài liệu
                </button>
                <button
                  type="button"
                  onClick={() => setPrintModalOpen(false)}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 650,
                    cursor: 'pointer'
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>

            <div style={{ padding: '28px', fontSize: '12.5px', color: '#0f172a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '14px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary-dark)' }}>
                    {printData.clinicName}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>Địa chỉ: {printData.clinicAddress}</div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>Hotline: {printData.clinicHotline}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Mã hồ sơ:</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{printData.recordCode}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Mã BN: {printData.patientCode}</div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 900, textTransform: 'uppercase' }}>
                  Phiếu Khám Bệnh & Tóm Tắt Bệnh Án
                </h2>
                <div style={{ fontSize: '11.5px', color: '#64748b', fontStyle: 'italic' }}>
                  Ngày khám: {printData.examinationDate?.replace('T', ' ').substring(0, 16)} &bull; Khoa: {printData.departmentName} &bull; Phòng: {printData.roomName}
                </div>
              </div>

              {/* Thông tin bệnh nhân */}
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '14px' }}>
                <div style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '12px', color: '#0f172a', marginBottom: '6px' }}>
                  1. Thông tin bệnh nhân
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '6px' }}>
                  <div><span style={{ color: '#64748b' }}>Họ và tên:</span> <span style={{ fontWeight: 800 }}>{printData.patientName}</span></div>
                  <div><span style={{ color: '#64748b' }}>Giới tính:</span> <span>{printData.gender}</span></div>
                  <div><span style={{ color: '#64748b' }}>Tuổi:</span> <span>{printData.age ? `${printData.age} tuổi` : ''} ({printData.dateOfBirth || '-'})</span></div>
                  <div><span style={{ color: '#64748b' }}>Điện thoại:</span> <span>{printData.phone}</span></div>
                  <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#64748b' }}>Địa chỉ:</span> <span>{printData.address || '-'}</span></div>
                  <div><span style={{ color: '#64748b' }}>BHYT:</span> <span>{printData.healthInsuranceNumber || 'Không có'}</span></div>
                  <div><span style={{ color: '#64748b' }}>Dị ứng:</span> <span style={{ color: '#b91c1c', fontWeight: 650 }}>{printData.drugAllergies || 'Không ghi nhận'}</span></div>
                </div>
              </div>

              {/* Sinh hiệu */}
              {printData.vitalSigns && (
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '14px' }}>
                  <div style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '12px', color: '#0f172a', marginBottom: '6px' }}>
                    2. Chỉ số sinh hiệu tiếp nhận
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '6px' }}>
                    <div>Mạch: <b>{printData.vitalSigns.heartRate || '-'}</b> lần/phút</div>
                    <div>Huyết áp: <b>{printData.vitalSigns.bloodPressureSystolic || '-'}/{printData.vitalSigns.bloodPressureDiastolic || '-'}</b> mmHg</div>
                    <div>Thân nhiệt: <b>{printData.vitalSigns.temperature || '-'}</b> °C</div>
                    <div>SpO2: <b>{printData.vitalSigns.spo2 || '-'}</b> %</div>
                    <div>Chiều cao: <b>{printData.vitalSigns.heightCm || '-'}</b> cm</div>
                    <div>Cân nặng: <b>{printData.vitalSigns.weightKg || '-'}</b> kg</div>
                    <div>BMI: <b>{printData.vitalSigns.bmi || '-'}</b> ({printData.vitalSigns.bmiCategory || 'Chuẩn'})</div>
                  </div>
                </div>
              )}

              {/* Lâm sàng & Chẩn đoán */}
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '14px' }}>
                <div style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '12px', color: '#0f172a', marginBottom: '6px' }}>
                  3. Diễn biến khám lâm sàng & Chẩn đoán
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div><span style={{ fontWeight: 700 }}>Lý do vào khám:</span> {printData.chiefComplaint}</div>
                  {printData.historyOfPresentIllness && <div><span style={{ fontWeight: 700 }}>Bệnh sử:</span> {printData.historyOfPresentIllness}</div>}
                  {printData.physicalExamination && <div><span style={{ fontWeight: 700 }}>Khám thực thể:</span> {printData.physicalExamination}</div>}
                  <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', padding: '10px 14px', borderRadius: '8px', marginTop: '4px' }}>
                    <span style={{ fontWeight: 800, color: 'var(--primary-dark)' }}>Chẩn đoán xác định:</span>{' '}
                    <span style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>{printData.finalDiagnosis || 'Chưa kết luận'}</span>{' '}
                    {printData.icd10Code && <span style={{ background: '#ffffff', border: '1px solid #5eead4', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>[{printData.icd10Code}]</span>}
                  </div>
                </div>
              </div>

              {/* Cận lâm sàng */}
              {printData.labOrders && printData.labOrders.length > 0 && (
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '14px' }}>
                  <div style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '12px', color: '#0f172a', marginBottom: '6px' }}>
                    4. Dịch vụ cận lâm sàng & Kết quả
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                        <th style={{ padding: '6px 10px', textAlign: 'left' }}>Tên dịch vụ / Xét nghiệm</th>
                        <th style={{ padding: '6px 10px', textAlign: 'center' }}>Kết quả</th>
                        <th style={{ padding: '6px 10px', textAlign: 'center' }}>Trị số tham chiếu</th>
                        <th style={{ padding: '6px 10px', textAlign: 'left' }}>Kết luận</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printData.labOrders.flatMap(o => o.items || []).map((it, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '6px 10px', fontWeight: 650 }}>{it.serviceName}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 800 }}>{it.testValue || 'Đang xử lý'} {it.unit || ''}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'center', color: '#64748b' }}>{it.referenceRange || '-'}</td>
                          <td style={{ padding: '6px 10px' }}>{it.conclusion || (it.status === 'COMPLETED' ? 'Bình thường' : '-')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Lời dặn & Hẹn tái khám */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '12px', color: '#0f172a', marginBottom: '6px' }}>
                  5. Lời dặn dò & Kế hoạch điều trị
                </div>
                <div><span style={{ fontWeight: 700 }}>Lời dặn bác sĩ:</span> {printData.doctorAdvice || 'Tuân thủ hướng dẫn điều trị và tái khám đúng hẹn.'}</div>
                {printData.followUpDate && (
                  <div style={{ marginTop: '4px', fontWeight: 800, color: 'var(--primary-dark)' }}>
                    Hẹn ngày tái khám: {printData.followUpDate}
                  </div>
                )}
              </div>

              {/* Chữ ký */}
              <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', paddingTop: '16px' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>Bệnh nhân / Thân nhân</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>(Ký và ghi rõ họ tên)</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                    Hà Nội, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                  </div>
                  <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>Bác sĩ khám bệnh</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '36px' }}>{printData.doctorQualification}</div>
                  <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#0f172a' }}>{printData.doctorName}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CẬP NHẬT KẾT QUẢ CẬN LÂM SÀNG */}
      {labResultModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
              Nhập Kết Quả Cận Lâm Sàng
            </h3>
            <form onSubmit={handleSaveLabResult} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Giá trị đo được (Kết quả)
                </label>
                <input
                  type="text"
                  value={resultForm.testValue}
                  onChange={e => setResultForm(prev => ({ ...prev, testValue: e.target.value }))}
                  placeholder="Ví dụ: 5.4, Bình thường, Âm tính..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Đơn vị đo
                  </label>
                  <input
                    type="text"
                    value={resultForm.unit}
                    onChange={e => setResultForm(prev => ({ ...prev, unit: e.target.value }))}
                    placeholder="mmol/L, g/dL, %..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Khoảng tham chiếu
                  </label>
                  <input
                    type="text"
                    value={resultForm.referenceRange}
                    onChange={e => setResultForm(prev => ({ ...prev, referenceRange: e.target.value }))}
                    placeholder="3.9 - 6.4..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Kết luận của Kỹ thuật viên / Bác sĩ
                </label>
                <textarea
                  rows={3}
                  value={resultForm.conclusion}
                  onChange={e => setResultForm(prev => ({ ...prev, conclusion: e.target.value }))}
                  placeholder="Chỉ số trong giới hạn bình thường..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setLabResultModalOpen(false)}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 650,
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '8px' }}
                >
                  Lưu kết quả
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CẢNH BÁO DỊ ỨNG THUỐC (UC-DT02) */}
      {/* ========================================================================= */}
      {allergyModalOpen && allergyAlert && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
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
              maxWidth: '580px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
              borderTop: '6px solid #dc2626'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span
                style={{
                  background: '#fee2e2',
                  color: '#dc2626',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 900,
                  fontSize: '20px'
                }}
              >
                !
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#991b1b' }}>
                  CẢNH BÁO DỊ ỨNG THUỐC ĐIỆN TỬ
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748b' }}>
                  Hệ thống kiểm tra tự động phát hiện nguy cơ phản vệ / quá mẫn
                </p>
              </div>
            </div>

            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: '10px',
                padding: '14px 16px',
                fontSize: '13px',
                color: '#7f1d1d',
                marginBottom: '16px',
                lineHeight: 1.5
              }}
            >
              <div style={{ fontWeight: 750, marginBottom: '4px' }}>Nội dung cảnh báo:</div>
              <div>{allergyAlert.warningMessage || allergyAlert.warnings?.map(w => w.message).join('; ')}</div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                Danh sách thuốc bị phát hiện xung đột ({allergyAlert.warnings?.length || 0}):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(allergyAlert.warnings || []).map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '12.5px'
                    }}
                  >
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{item.brandName}</div>
                    <div style={{ color: '#475569', marginTop: '2px' }}>
                      Hoạt chất: <strong>{item.activeIngredient}</strong> &bull; Trùng từ khóa:{' '}
                      <strong style={{ color: '#dc2626' }}>{item.matchedAllergyKeyword}</strong>
                    </div>
                    {item.message && (
                      <div style={{ fontSize: '11.5px', color: '#b91c1c', marginTop: '2px' }}>
                        {item.message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Xác nhận lý do lâm sàng (Bắt buộc nếu bác sĩ vẫn quyết định kê thuốc):
              </label>
              <textarea
                rows={3}
                value={overrideAllergyReason}
                onChange={e => setOverrideAllergyReason(e.target.value)}
                placeholder="Ví dụ: Đã test lẩy da âm tính / Bệnh nhân chỉ dị ứng nhẹ với liều cao / Lợi ích điều trị vượt trội nguy cơ và có sẵn thuốc cấp cứu phản vệ..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
              <button
                type="button"
                onClick={() => setAllergyModalOpen(false)}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Đóng cảnh báo
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!overrideAllergyReason.trim()) {
                    showAlert('Vui lòng nhập lý do lâm sàng trước khi chấp thuận kê đơn!', 'error')
                    return
                  }
                  setAllergyModalOpen(false)
                  showAlert('Đã ghi nhận lý do lâm sàng của bác sĩ cho đơn thuốc có cảnh báo dị ứng', 'info')
                }}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 20px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Xác nhận tiếp tục kê đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL IN ĐƠN THUỐC CHUẨN A4 BỘ Y TẾ / CAREPLUS (UC-DT03) */}
      {/* ========================================================================= */}
      {prescriptionPrintModalOpen && prescriptionPrintData && (
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
                  onClick={() => setPrescriptionPrintModalOpen(false)}
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
                  Mã đơn: {prescriptionPrintData.prescriptionCode}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Ngày: {prescriptionPrintData.createdAt}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Mã hồ sơ: {prescriptionPrintData.recordCode || '-'}
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
                <div>Họ và tên: <strong style={{ fontSize: '14px' }}>{prescriptionPrintData.patientName}</strong></div>
                <div>Giới tính: <strong>{prescriptionPrintData.gender === 'FEMALE' ? 'Nữ' : 'Nam'}</strong></div>
                <div>Ngày sinh: <strong>{prescriptionPrintData.dateOfBirth || '-'}</strong></div>
                <div>Tuổi: <strong>{prescriptionPrintData.age || '-'}</strong></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>Mã y tế: <strong>{prescriptionPrintData.patientCode}</strong></div>
                <div>Số điện thoại: <strong>{prescriptionPrintData.phone || '-'}</strong></div>
                <div>BHYT: <strong>{prescriptionPrintData.healthInsuranceNumber || 'Không'}</strong></div>
              </div>
              <div>Địa chỉ: <strong>{prescriptionPrintData.address || 'TP. Hồ Chí Minh'}</strong></div>
              <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '6px', marginTop: '2px' }}>
                Chẩn đoán: <strong style={{ color: '#0f172a' }}>{prescriptionPrintData.diagnosis}</strong>{' '}
                {prescriptionPrintData.icd10Code && <span style={{ color: '#64748b' }}>({prescriptionPrintData.icd10Code})</span>}
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
                  {prescriptionPrintData.items.map((item, idx) => (
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
              <div>Lời dặn bác sĩ: <strong>{prescriptionPrintData.doctorAdvice || 'Tái khám theo hẹn hoặc khi có dấu hiệu bất thường.'}</strong></div>
              {prescriptionPrintData.followUpDate && (
                <div>Ngày hẹn tái khám: <strong style={{ color: '#0369a1' }}>{prescriptionPrintData.followUpDate}</strong></div>
              )}
            </div>

            {/* CHỮ KÝ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center', marginTop: '30px', pageBreakInside: 'avoid' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>DƯỢC SĨ CẤP PHÁT</div>
                <div style={{ fontSize: '11.5px', color: '#64748b', fontStyle: 'italic' }}>(Ký và ghi rõ họ tên)</div>
                <div style={{ height: '70px' }} />
                <div style={{ fontSize: '13.5px', fontWeight: 750 }}>{prescriptionPrintData.pharmacistName || 'DS. Phạm Thị Nga'}</div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                  Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>BÁC SĨ KÊ ĐƠN</div>
                <div style={{ fontSize: '11.5px', color: '#64748b', fontStyle: 'italic' }}>(Ký và ghi rõ họ tên)</div>
                <div style={{ height: '54px' }} />
                <div style={{ fontSize: '13.5px', fontWeight: 750 }}>{prescriptionPrintData.doctorName}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MedicalExaminationPage
