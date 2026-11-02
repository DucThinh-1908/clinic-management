export interface Doctor {
  id: string
  name: string
  title: string
  specialty: string
  experience: string
  image: string
  bio?: string
}

export interface ServicePackage {
  id: string
  title: string
  category: 'general' | 'pediatric' | 'women' | 'home' | 'corporate'
  price: string
  unit: string
  description: string
  badge?: string
  features: string[]
  image: string
}

export interface Branch {
  id: string
  name: string
  tag: string
  address: string
  phone: string
  parking: string
}

export interface FaqItem {
  id: string
  question: string
  answer: string
}

export interface AppointmentFormData {
  fullName: string
  phone: string
  specialty: string
  date: string
  note?: string
}

export interface ContactFormData {
  fullName: string
  phone: string
  email: string
  subject: string
  branch: string
  message: string
}

export interface AuthUser {
  id: number
  username: string
  email?: string
  phone?: string
  avatarUrl?: string
  isActive: boolean
  roles: string[]
  permissions: string[]
  lastLoginAt?: string
}

export interface RoleItem {
  id: number
  code: string
  name: string
  description?: string
  permissions?: PermissionItem[]
}

export interface PermissionItem {
  id: number
  code: string
  name: string
  module: string
}

export interface MedicalRecordAccessLog {
  id: number
  userId?: number
  username: string
  roleName: string
  action: string
  recordCode: string
  patientName: string
  reason: string
  ipAddress: string
  createdAt: string
}

export interface PatientDetail {
  id: number
  userId?: number
  patientCode: string
  fullName: string
  gender: string
  dateOfBirth: string
  age?: number
  phone: string
  email?: string
  identityCard?: string
  healthInsuranceNumber?: string
  address?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  bloodGroup?: string
  medicalHistory?: string
  drugAllergies?: string
  isActive: boolean
  mergedIntoId?: number
  mergedIntoCode?: string
  createdAt: string
  updatedAt: string
  totalVisits: number
}

export interface MedicalRecordSummary {
  id: number
  recordCode: string
  patientId: number
  doctorId: number
  doctorName?: string
  doctorQualification?: string
  roomId: number
  roomName?: string
  roomNumber?: string
  chiefComplaint: string
  historyOfPresentIllness?: string
  physicalExamination?: string
  initialDiagnosis?: string
  finalDiagnosis: string
  icd10Code?: string
  doctorAdvice?: string
  followUpDate?: string
  status: string
  createdAt: string
}

export interface StaffItem {
  id: number
  userId: number
  username?: string
  email?: string
  phone?: string
  roleCode?: string
  roleName?: string
  staffCode: string
  fullName: string
  gender: string
  dateOfBirth?: string
  idCardNumber?: string
  address?: string
  qualification?: string
  hireDate?: string
  status: string
  departmentId?: number
  departmentName?: string
  licenseNumber?: string
  specialty?: string
  consultationFee?: number
  biography?: string
  yearsOfExperience?: number
  createdAt?: string
}

export interface DepartmentItem {
  id: number
  code: string
  name: string
  description?: string
  location?: string
  isActive: boolean
  roomCount: number
  staffCount: number
  createdAt?: string
}

export interface ClinicRoomItem {
  id: number
  departmentId: number
  departmentName?: string
  roomNumber: string
  name: string
  roomType: string
  isAvailable: boolean
}

export interface WorkShiftItem {
  id: number
  name: string
  startTime: string
  endTime: string
}

export interface ScheduleItem {
  id: number
  staffId: number
  staffCode?: string
  staffName?: string
  staffRole?: string
  qualification?: string
  departmentId?: number
  departmentName?: string
  shiftId: number
  shiftName?: string
  shiftStartTime?: string
  shiftEndTime?: string
  roomId?: number
  roomNumber?: string
  roomName?: string
  workDate: string
  note?: string
  status: string
  createdAt?: string
}

export interface LeaveSwapItem {
  id: number
  staffId: number
  staffName?: string
  staffCode?: string
  requestType: 'LEAVE' | 'SWAP'
  scheduleId?: number
  currentWorkDate?: string
  currentShiftName?: string
  currentRoomName?: string
  leaveDate?: string
  targetStaffId?: number
  targetStaffName?: string
  targetDate?: string
  targetShiftId?: number
  targetShiftName?: string
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewerId?: number
  reviewerName?: string
  reviewNote?: string
  reviewedAt?: string
  createdAt?: string
}

export interface AttendanceItem {
  id: number
  staffId: number
  staffCode?: string
  staffName?: string
  departmentName?: string
  scheduleId?: number
  shiftName?: string
  expectedStartTime?: string
  expectedEndTime?: string
  attendanceDate: string
  checkInTime?: string
  checkOutTime?: string
  status: string
  notes?: string
}

export interface DoctorSlotItem {
  startTime: string
  endTime: string
  isAvailable?: boolean
  available?: boolean
  shiftName: string
  doctorId: number
  doctorName: string
  departmentName?: string
  roomName?: string
}

export interface DoctorSlotSummary {
  doctorId: number
  doctorName: string
  staffCode: string
  specialty: string
  departmentId?: number
  departmentName?: string
  workDate: string
  roomName?: string
  consultationFee?: number
  slots: DoctorSlotItem[]
}

export interface DoctorOptionItem {
  doctorId: number
  doctorName: string
  staffCode: string
  specialty: string
  departmentId?: number
  departmentName?: string
  shiftsToday: string[]
}

export interface AppointmentReminderItem {
  id: number
  appointmentId: number
  reminderType: 'SMS' | 'EMAIL'
  recipient: string
  title: string
  content: string
  status: string
  sentAt: string
}

export interface AppointmentItem {
  id: number
  appointmentCode: string
  patientId: number
  patientCode?: string
  patientName: string
  patientPhone: string
  patientEmail?: string
  patientGender?: string
  patientDob?: string
  doctorId?: number
  doctorName?: string
  doctorCode?: string
  doctorSpecialty?: string
  departmentId?: number
  departmentName?: string
  receptionistId?: number
  receptionistName?: string
  appointmentDate: string
  appointmentTime: string
  symptomsSummary?: string
  bookingChannel: 'ONLINE_PORTAL' | 'CALL_CENTER' | 'DIRECT_WALKIN'
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  notes?: string
  cancellationReason?: string
  createdAt?: string
  updatedAt?: string
  reminders?: AppointmentReminderItem[]
}

export interface AppointmentStatsItem {
  date: string
  total: number
  pending: number
  confirmed: number
  checkedIn: number
  completed: number
  cancelled: number
  noShow: number
}

export interface QueueTicketItem {
  id: number
  ticketCode: string
  ticketNumber: number
  patientId: number
  patientCode?: string
  patientName: string
  patientPhone: string
  patientGender?: string
  patientDob?: string
  patientAge?: number
  identityCard?: string
  appointmentId?: number
  appointmentCode?: string
  isAppointment: boolean
  roomId: number
  roomNumber: string
  roomName: string
  departmentId?: number
  departmentName?: string
  doctorId?: number
  doctorName?: string
  doctorStaffCode?: string
  priority: 'NORMAL' | 'PRIORITY' | 'EMERGENCY'
  serviceType?: string
  queueDate: string
  status: 'WAITING' | 'CALLED' | 'SERVING' | 'COMPLETED' | 'SKIPPED'
  calledAt?: string
  servingAt?: string
  completedAt?: string
  transferReason?: string
  transferredFromRoomId?: number
  transferredFromRoomName?: string
  callCount: number
  notes?: string
  createdAt: string
  waitPosition: number
}

export interface RoomQueueOverviewItem {
  roomId: number
  roomNumber: string
  roomName: string
  departmentId?: number
  departmentName?: string
  doctorId?: number
  doctorName?: string
  isAvailable?: boolean
  available?: boolean
  currentServing?: QueueTicketItem | null
  currentCalled?: QueueTicketItem | null
  waitingCount: number
  completedCount: number
  totalCount: number
}

export interface QueueStatsItem {
  date: string
  totalTickets: number
  waiting: number
  called: number
  serving: number
  completed: number
  skipped: number
}

export interface SimpleRoomOption {
  id: number
  roomNumber: string
  name: string
  roomType: string
  departmentId?: number
  isAvailable: boolean
}

// =============================================================================
// PHÂN HỆ 3.6: KHÁM BỆNH (8 USE CASES)
// =============================================================================

export interface VitalSignItem {
  id?: number
  patientId: number
  patientName?: string
  nurseId?: number
  nurseName?: string
  temperature?: number
  bloodPressureSystolic?: number
  bloodPressureDiastolic?: number
  heartRate?: number
  respiratoryRate?: number
  spo2?: number
  weightKg?: number
  heightCm?: number
  bmi?: number
  bmiCategory?: string
  bloodPressureStatus?: string
  temperatureStatus?: string
  notes?: string
  measuredAt?: string
}

export interface ServiceCategoryItem {
  id: number
  code: string
  name: string
}

export interface ClinicalServiceItem {
  id: number
  categoryId: number
  code: string
  name: string
  price: number
  insuranceCovered?: boolean
  estimatedDurationMinutes?: number
  description?: string
  isActive?: boolean
}

export interface LabResultItem {
  id: number
  labOrderId: number
  serviceId: number
  serviceCode?: string
  serviceName?: string
  categoryName?: string
  price?: number
  technicianId?: number
  technicianName?: string
  roomId?: number
  roomName?: string
  testValue?: string
  referenceRange?: string
  unit?: string
  conclusion?: string
  imageAttachmentUrl?: string
  status: 'WAITING' | 'PROCESSING' | 'COMPLETED'
  completedAt?: string
}

export interface LabOrderItem {
  id: number
  orderCode: string
  medicalRecordId: number
  doctorId: number
  doctorName?: string
  patientId: number
  patientName?: string
  diagnosisNote?: string
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  items: LabResultItem[]
}

export interface MedicalRecordItem {
  id: number
  recordCode: string
  patientId: number
  patientName?: string
  doctorId: number
  doctorName?: string
  roomId: number
  roomName?: string
  chiefComplaint: string
  historyOfPresentIllness?: string
  physicalExamination?: string
  initialDiagnosis?: string
  finalDiagnosis?: string
  icd10Code?: string
  doctorAdvice?: string
  followUpDate?: string
  status: 'IN_PROGRESS' | 'WAITING_PARACLINICAL' | 'COMPLETED'
  createdAt: string
  vitalSigns?: VitalSignItem
  labOrders?: LabOrderItem[]
}

export interface MedicalSummaryPrintData {
  clinicName: string
  clinicAddress: string
  clinicHotline: string
  recordId: number
  recordCode: string
  examinationDate: string
  roomName: string
  departmentName: string
  doctorName: string
  doctorQualification: string
  patientId: number
  patientCode: string
  patientName: string
  gender: string
  dateOfBirth?: string
  age?: number
  phone: string
  address?: string
  healthInsuranceNumber?: string
  bloodGroup?: string
  drugAllergies?: string
  vitalSigns?: VitalSignItem
  chiefComplaint: string
  historyOfPresentIllness?: string
  physicalExamination?: string
  initialDiagnosis?: string
  finalDiagnosis?: string
  icd10Code?: string
  labOrders?: LabOrderItem[]
  doctorAdvice?: string
  followUpDate?: string
  status: string
}


