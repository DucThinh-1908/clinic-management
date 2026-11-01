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
