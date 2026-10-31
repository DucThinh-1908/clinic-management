-- =============================================================================
-- HỆ THỐNG QUẢN LÝ PHÒNG KHÁM ĐA KHOA (CLINIC MANAGEMENT SYSTEM)
-- FILE TỔNG HỢP: SCHEMA & SEED DATA (IMPORT 1 BƯỚC VÀO MYSQL)
-- Hỗ trợ đầy đủ 9 tác nhân:
-- 1. patient (Bệnh nhân)
-- 2. receptionist (Lễ tân)
-- 3. doctor (Bác sĩ)
-- 4. nurse (Điều dưỡng)
-- 5. technician (Kỹ thuật viên)
-- 6. pharmacist (Dược sĩ)
-- 7. cashier (Thu ngân)
-- 8. manager (Quản lý phòng khám)
-- 9. admin (Quản trị hệ thống)
-- =============================================================================

DROP DATABASE IF EXISTS clinic_db;
CREATE DATABASE clinic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clinic_db;

-- -----------------------------------------------------------------------------
-- PHẦN 1: TẠO CẤU TRÚC BẢNG (TABLES & CONSTRAINTS)
-- -----------------------------------------------------------------------------

-- 1. Bảng vai trò hệ thống
CREATE TABLE roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã vai trò: admin, manager, doctor, ...',
    name VARCHAR(100) NOT NULL COMMENT 'Tên vai trò hiển thị',
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Bảng phân quyền (Permissions)
CREATE TABLE permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    module VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Bảng phân quyền vai trò (Role - Permission)
CREATE TABLE role_permissions (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Bảng tài khoản người dùng (Users)
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. Bảng gán vai trò tài khoản (User - Role)
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Bảng lưu vết nhật ký hệ thống (Audit Logs)
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(50) NULL,
    old_data JSON NULL,
    new_data JSON NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 7. Bảng khoa phòng ban (Departments)
CREATE TABLE departments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    location VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 8. Bảng phòng khám / phòng chức năng (Clinic Rooms)
CREATE TABLE clinic_rooms (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    department_id BIGINT NOT NULL,
    room_number VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    room_type ENUM('EXAMINATION', 'TREATMENT', 'LABORATORY', 'IMAGING', 'PHARMACY', 'CASHIER', 'OTHER') DEFAULT 'EXAMINATION',
    is_available BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_room_department FOREIGN KEY (department_id) REFERENCES departments(id)
) ENGINE=InnoDB;

-- 9. Bảng hồ sơ nhân sự (Staff)
CREATE TABLE staff (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    department_id BIGINT NULL,
    staff_code VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    gender ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    date_of_birth DATE,
    id_card_number VARCHAR(20) UNIQUE,
    address VARCHAR(255),
    qualification VARCHAR(100),
    hire_date DATE,
    status ENUM('ACTIVE', 'ON_LEAVE', 'RESIGNED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_staff_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_staff_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 10. Bảng thông tin Bác sĩ (Doctor Profiles)
CREATE TABLE doctor_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    staff_id BIGINT UNIQUE NOT NULL,
    license_number VARCHAR(50) UNIQUE,
    specialty VARCHAR(150) NOT NULL,
    consultation_fee DECIMAL(12,2) DEFAULT 200000.00,
    biography TEXT,
    years_of_experience INT DEFAULT 0,
    CONSTRAINT fk_doc_staff FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. Bảng ca làm việc chuẩn (Work Shifts)
CREATE TABLE work_shifts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
) ENGINE=InnoDB;

-- 12. Bảng phân lịch làm việc nhân viên (Staff Schedules)
CREATE TABLE staff_schedules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    staff_id BIGINT NOT NULL,
    shift_id BIGINT NOT NULL,
    room_id BIGINT NULL,
    work_date DATE NOT NULL,
    note VARCHAR(255),
    status ENUM('SCHEDULED', 'ATTENDED', 'ABSENT', 'CANCELLED') DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_staff_shift_date (staff_id, shift_id, work_date),
    CONSTRAINT fk_sched_staff FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    CONSTRAINT fk_sched_shift FOREIGN KEY (shift_id) REFERENCES work_shifts(id),
    CONSTRAINT fk_sched_room FOREIGN KEY (room_id) REFERENCES clinic_rooms(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 13. Bảng hồ sơ bệnh nhân (Patients)
CREATE TABLE patients (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL UNIQUE,
    patient_code VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    gender ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    date_of_birth DATE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    identity_card VARCHAR(20),
    health_insurance_number VARCHAR(30),
    address VARCHAR(255),
    emergency_contact_name VARCHAR(150),
    emergency_contact_phone VARCHAR(20),
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN') DEFAULT 'UNKNOWN',
    medical_history TEXT,
    drug_allergies TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_patient_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 14. Bảng lịch hẹn khám bệnh (Appointments)
CREATE TABLE appointments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_code VARCHAR(50) NOT NULL UNIQUE,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NULL,
    department_id BIGINT NULL,
    receptionist_id BIGINT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    symptoms_summary TEXT,
    booking_channel ENUM('ONLINE_PORTAL', 'CALL_CENTER', 'DIRECT_WALKIN') DEFAULT 'ONLINE_PORTAL',
    status ENUM('PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_app_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_app_doctor FOREIGN KEY (doctor_id) REFERENCES staff(id) ON DELETE SET NULL,
    CONSTRAINT fk_app_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_app_rec FOREIGN KEY (receptionist_id) REFERENCES staff(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 15. Bảng số thứ tự tiếp đón (Queue Tickets)
CREATE TABLE queue_tickets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    appointment_id BIGINT NULL,
    room_id BIGINT NOT NULL,
    ticket_number INT NOT NULL,
    queue_date DATE NOT NULL,
    status ENUM('WAITING', 'CALLED', 'SERVING', 'COMPLETED', 'SKIPPED') DEFAULT 'WAITING',
    called_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_q_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
    CONSTRAINT fk_q_app FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    CONSTRAINT fk_q_room FOREIGN KEY (room_id) REFERENCES clinic_rooms(id)
) ENGINE=InnoDB;

-- 16. Bảng chỉ số sinh hiệu (Vital Signs)
CREATE TABLE vital_signs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    nurse_id BIGINT NOT NULL,
    temperature DECIMAL(4,1),
    blood_pressure_systolic INT,
    blood_pressure_diastolic INT,
    heart_rate INT,
    respiratory_rate INT,
    spo2 DECIMAL(4,1),
    weight_kg DECIMAL(5,2),
    height_cm DECIMAL(5,2),
    bmi DECIMAL(4,1),
    notes VARCHAR(255),
    measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vital_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_vital_nurse FOREIGN KEY (nurse_id) REFERENCES staff(id)
) ENGINE=InnoDB;

-- 17. Bảng hồ sơ bệnh án (Medical Records)
CREATE TABLE medical_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    record_code VARCHAR(50) NOT NULL UNIQUE,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    room_id BIGINT NOT NULL,
    appointment_id BIGINT NULL,
    vital_signs_id BIGINT NULL,
    chief_complaint TEXT NOT NULL,
    history_of_present_illness TEXT,
    physical_examination TEXT,
    initial_diagnosis VARCHAR(255),
    final_diagnosis VARCHAR(255) NOT NULL,
    icd10_code VARCHAR(20),
    doctor_advice TEXT,
    follow_up_date DATE,
    status ENUM('IN_PROGRESS', 'WAITING_PARACLINICAL', 'COMPLETED') DEFAULT 'IN_PROGRESS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rec_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_rec_doctor FOREIGN KEY (doctor_id) REFERENCES staff(id),
    CONSTRAINT fk_rec_room FOREIGN KEY (room_id) REFERENCES clinic_rooms(id),
    CONSTRAINT fk_rec_app FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    CONSTRAINT fk_rec_vital FOREIGN KEY (vital_signs_id) REFERENCES vital_signs(id)
) ENGINE=InnoDB;

-- 18. Bảng phân loại dịch vụ kỹ thuật
CREATE TABLE service_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 19. Bảng danh mục dịch vụ cận lâm sàng (Services)
CREATE TABLE services (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    insurance_covered BOOLEAN DEFAULT FALSE,
    estimated_duration_minutes INT DEFAULT 15,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_srv_cat FOREIGN KEY (category_id) REFERENCES service_categories(id)
) ENGINE=InnoDB;

-- 20. Bảng phiếu chỉ định cận lâm sàng (Lab Orders)
CREATE TABLE lab_orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_code VARCHAR(50) NOT NULL UNIQUE,
    medical_record_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    diagnosis_note VARCHAR(255),
    status ENUM('PENDING', 'PAID', 'PROCESSING', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lo_record FOREIGN KEY (medical_record_id) REFERENCES medical_records(id) ON DELETE CASCADE,
    CONSTRAINT fk_lo_doctor FOREIGN KEY (doctor_id) REFERENCES staff(id),
    CONSTRAINT fk_lo_patient FOREIGN KEY (patient_id) REFERENCES patients(id)
) ENGINE=InnoDB;

-- 21. Bảng kết quả xét nghiệm / chẩn đoán hình ảnh (Lab Results)
CREATE TABLE lab_results (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    lab_order_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    technician_id BIGINT NULL,
    room_id BIGINT NULL,
    test_value VARCHAR(255),
    reference_range VARCHAR(100),
    unit VARCHAR(50),
    conclusion TEXT,
    image_attachment_url VARCHAR(255),
    status ENUM('WAITING', 'PROCESSING', 'COMPLETED') DEFAULT 'WAITING',
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lr_order FOREIGN KEY (lab_order_id) REFERENCES lab_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_lr_service FOREIGN KEY (service_id) REFERENCES services(id),
    CONSTRAINT fk_lr_tech FOREIGN KEY (technician_id) REFERENCES staff(id) ON DELETE SET NULL,
    CONSTRAINT fk_lr_room FOREIGN KEY (room_id) REFERENCES clinic_rooms(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 22. Bảng nhóm dược phẩm
CREATE TABLE medicine_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 23. Bảng nhà cung cấp dược phẩm
CREATE TABLE suppliers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    tax_code VARCHAR(30),
    phone VARCHAR(20),
    email VARCHAR(100),
    address VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- 24. Bảng danh mục thuốc (Medicines)
CREATE TABLE medicines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    brand_name VARCHAR(150) NOT NULL,
    active_ingredient VARCHAR(150) NOT NULL,
    dosage_form VARCHAR(50) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    usage_instructions VARCHAR(255),
    selling_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    is_prescription_required BOOLEAN DEFAULT TRUE,
    contraindications TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_med_cat FOREIGN KEY (category_id) REFERENCES medicine_categories(id)
) ENGINE=InnoDB;

-- 25. Bảng các lô thuốc trong kho (Medicine Batches)
CREATE TABLE medicine_batches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    medicine_id BIGINT NOT NULL,
    supplier_id BIGINT NULL,
    batch_number VARCHAR(50) NOT NULL,
    manufacture_date DATE,
    expiry_date DATE NOT NULL,
    import_price DECIMAL(12,2) NOT NULL,
    quantity_imported INT NOT NULL,
    quantity_available INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_batch_med FOREIGN KEY (medicine_id) REFERENCES medicines(id),
    CONSTRAINT fk_batch_sup FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 26. Bảng lịch sử xuất nhập kho thuốc (Stock Transactions)
CREATE TABLE stock_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    batch_id BIGINT NOT NULL,
    pharmacist_id BIGINT NOT NULL,
    transaction_type ENUM('IMPORT', 'DISPENSE', 'DISPOSE', 'AUDIT_ADJUSTMENT') NOT NULL,
    quantity INT NOT NULL,
    reason VARCHAR(255),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_st_batch FOREIGN KEY (batch_id) REFERENCES medicine_batches(id),
    CONSTRAINT fk_st_pharm FOREIGN KEY (pharmacist_id) REFERENCES staff(id)
) ENGINE=InnoDB;

-- 27. Bảng đơn thuốc (Prescriptions)
CREATE TABLE prescriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    prescription_code VARCHAR(50) NOT NULL UNIQUE,
    medical_record_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    diagnosis VARCHAR(255) NOT NULL,
    usage_note TEXT,
    status ENUM('PENDING_PAYMENT', 'PAID', 'DISPENSED', 'CANCELLED') DEFAULT 'PENDING_PAYMENT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pres_rec FOREIGN KEY (medical_record_id) REFERENCES medical_records(id) ON DELETE CASCADE,
    CONSTRAINT fk_pres_doc FOREIGN KEY (doctor_id) REFERENCES staff(id),
    CONSTRAINT fk_pres_pat FOREIGN KEY (patient_id) REFERENCES patients(id)
) ENGINE=InnoDB;

-- 28. Bảng chi tiết thuốc trong đơn (Prescription Items)
CREATE TABLE prescription_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    prescription_id BIGINT NOT NULL,
    medicine_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    morning_dose VARCHAR(20) DEFAULT '0',
    noon_dose VARCHAR(20) DEFAULT '0',
    afternoon_dose VARCHAR(20) DEFAULT '0',
    night_dose VARCHAR(20) DEFAULT '0',
    instructions VARCHAR(255),
    unit_price DECIMAL(12,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_pi_pres FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
    CONSTRAINT fk_pi_med FOREIGN KEY (medicine_id) REFERENCES medicines(id)
) ENGINE=InnoDB;

-- 29. Bảng phiếu cấp phát thuốc (Dispensations)
CREATE TABLE dispensations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dispensation_code VARCHAR(50) NOT NULL UNIQUE,
    prescription_id BIGINT NOT NULL,
    pharmacist_id BIGINT NOT NULL,
    dispensed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    note VARCHAR(255),
    CONSTRAINT fk_disp_pres FOREIGN KEY (prescription_id) REFERENCES prescriptions(id),
    CONSTRAINT fk_disp_pharm FOREIGN KEY (pharmacist_id) REFERENCES staff(id)
) ENGINE=InnoDB;

-- 30. Bảng hóa đơn viện phí (Invoices)
CREATE TABLE invoices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_code VARCHAR(50) NOT NULL UNIQUE,
    patient_id BIGINT NOT NULL,
    cashier_id BIGINT NULL,
    appointment_id BIGINT NULL,
    medical_record_id BIGINT NULL,
    total_service_amount DECIMAL(12,2) DEFAULT 0.00,
    total_medicine_amount DECIMAL(12,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    insurance_paid_amount DECIMAL(12,2) DEFAULT 0.00,
    final_amount DECIMAL(12,2) NOT NULL,
    status ENUM('UNPAID', 'PAID', 'REFUNDED', 'CANCELLED') DEFAULT 'UNPAID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP NULL,
    CONSTRAINT fk_inv_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
    CONSTRAINT fk_inv_cashier FOREIGN KEY (cashier_id) REFERENCES staff(id) ON DELETE SET NULL,
    CONSTRAINT fk_inv_app FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    CONSTRAINT fk_inv_rec FOREIGN KEY (medical_record_id) REFERENCES medical_records(id)
) ENGINE=InnoDB;

-- 31. Bảng chi tiết hóa đơn (Invoice Items)
CREATE TABLE invoice_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    item_type ENUM('CONSULTATION_FEE', 'LAB_SERVICE', 'MEDICINE', 'OTHER') NOT NULL,
    reference_id BIGINT NULL,
    item_name VARCHAR(150) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    subtotal DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_ii_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 32. Bảng giao dịch thanh toán viện phí (Payments)
CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_code VARCHAR(50) NOT NULL UNIQUE,
    invoice_id BIGINT NOT NULL,
    cashier_id BIGINT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('CASH', 'CREDIT_CARD', 'BANK_TRANSFER', 'VNPAY_QR', 'MOMO') DEFAULT 'CASH',
    transaction_reference VARCHAR(100),
    status ENUM('SUCCESS', 'FAILED', 'PENDING') DEFAULT 'SUCCESS',
    payment_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    note VARCHAR(255),
    CONSTRAINT fk_pay_inv FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    CONSTRAINT fk_pay_cashier FOREIGN KEY (cashier_id) REFERENCES staff(id)
) ENGINE=InnoDB;

-- Các chỉ mục hỗ trợ truy vấn nhanh
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_code ON patients(patient_code);
CREATE INDEX idx_appointments_date ON appointments(appointment_date, status);
CREATE INDEX idx_medrec_patient ON medical_records(patient_id);
CREATE INDEX idx_medrec_doctor ON medical_records(doctor_id);
CREATE INDEX idx_lab_order_status ON lab_orders(status);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_invoices_status ON invoices(status, created_at);
CREATE INDEX idx_batches_expiry ON medicine_batches(expiry_date);

-- -----------------------------------------------------------------------------
-- PHẦN 2: DỮ LIỆU KHỞI TẠO MẪU (SEED DATA CHO 9 VAI TRÒ)
-- -----------------------------------------------------------------------------

-- 1. Danh mục 9 vai trò
INSERT INTO roles (code, name, description) VALUES
('patient', 'Bệnh nhân', 'Đặt lịch hẹn, xem lịch sử khám và đơn thuốc (cổng bệnh nhân)'),
('receptionist', 'Lễ tân', 'Tiếp đón, quản lý lịch hẹn, hồ sơ bệnh nhân'),
('doctor', 'Bác sĩ', 'Khám bệnh, chẩn đoán, chỉ định, kê đơn'),
('nurse', 'Điều dưỡng', 'Đo sinh hiệu, hỗ trợ khám, gọi bệnh nhân'),
('technician', 'Kỹ thuật viên', 'Thực hiện và nhập kết quả cận lâm sàng'),
('pharmacist', 'Dược sĩ', 'Cấp phát thuốc, quản lý kho thuốc'),
('cashier', 'Thu ngân', 'Lập hóa đơn, thu tiền'),
('manager', 'Quản lý phòng khám', 'Quản lý nhân sự, lịch, bảng giá, xem báo cáo'),
('admin', 'Quản trị hệ thống', 'Tài khoản, phân quyền, cấu hình');

-- 2. Tài khoản mẫu
INSERT INTO users (id, username, password_hash, email, phone, is_active) VALUES
(1, 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'admin@careplusclinic.vn', '0901000001', TRUE),
(2, 'manager', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'manager@careplusclinic.vn', '0901000002', TRUE),
(3, 'receptionist', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'letan@careplusclinic.vn', '0901000003', TRUE),
(4, 'doctor_an', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'bs.an@careplusclinic.vn', '0901000004', TRUE),
(5, 'nurse_lan', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'dd.lan@careplusclinic.vn', '0901000005', TRUE),
(6, 'tech_duc', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'ktv.duc@careplusclinic.vn', '0901000006', TRUE),
(7, 'pharm_nga', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'ds.nga@careplusclinic.vn', '0901000007', TRUE),
(8, 'cashier_thuy', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'tn.thuy@careplusclinic.vn', '0901000008', TRUE),
(9, 'patient_nam', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'bn.nam@gmail.com', '0988777666', TRUE);

INSERT INTO user_roles (user_id, role_id) VALUES
(1, 9), (2, 8), (3, 2), (4, 3), (5, 4), (6, 5), (7, 6), (8, 7), (9, 1);

-- 3. Khoa phòng & Phòng chức năng
INSERT INTO departments (id, code, name, description, location) VALUES
(1, 'K_NOI', 'Khoa Nội Tổng Quát', 'Khám và điều trị nội khoa người lớn', 'Tầng 1 - Khu A'),
(2, 'K_NHI', 'Khoa Nhi', 'Khám, dinh dưỡng và tiêm chủng trẻ em', 'Tầng 1 - Khu B'),
(3, 'K_TMH', 'Khoa Tai Mũi Họng', 'Khám nội soi Tai Mũi Họng', 'Tầng 2 - Khu A'),
(4, 'K_SAN', 'Khoa Sản - Phụ Khoa', 'Khám thai và phụ khoa định kỳ', 'Tầng 2 - Khu B'),
(5, 'K_CDHA', 'Khoa Chẩn Đoán Hình Ảnh', 'Siêu âm 4D, X-quang kỹ thuật số', 'Tầng hầm B1'),
(6, 'K_XN', 'Khoa Xét Nghiệm', 'Huyết học, Sinh hóa, Miễn dịch tự động', 'Tầng hầm B1'),
(7, 'K_DUOC', 'Khoa Dược & Nhà Thuốc GPP', 'Quản lý kho và cấp phát thuốc theo đơn', 'Sảnh chính Tầng 1'),
(8, 'K_THUNGAN', 'Bộ Phận Thu Ngân & Viện Phí', 'Lập hóa đơn và thu tiền viện phí', 'Quầy số 3 - Sảnh chính');

INSERT INTO clinic_rooms (id, department_id, room_number, name, room_type) VALUES
(1, 1, 'P101', 'Phòng Khám Nội 1', 'EXAMINATION'),
(2, 2, 'P102', 'Phòng Khám Nhi', 'EXAMINATION'),
(3, 3, 'P201', 'Phòng Nội Soi Tai Mũi Họng', 'EXAMINATION'),
(4, 5, 'P001', 'Phòng Siêu Âm Màu 4D', 'IMAGING'),
(5, 5, 'P002', 'Phòng Chụp X-Quang Kỹ Thuật Số', 'IMAGING'),
(6, 6, 'P003', 'Phòng Xét Nghiệm Huyết Học & Sinh Hóa', 'LABORATORY'),
(7, 7, 'P105', 'Quầy Cấp Phát Thuốc', 'PHARMACY'),
(8, 8, 'P106', 'Quầy Thu Ngân 1', 'CASHIER');

-- 4. Nhân sự
INSERT INTO staff (id, user_id, department_id, staff_code, full_name, gender, date_of_birth, id_card_number, qualification, status) VALUES
(1, 2, 1, 'NV_QL01', 'Hoàng Văn Quản', 'MALE', '1980-05-15', '001080001234', 'Thạc sĩ Quản lý Y tế', 'ACTIVE'),
(2, 4, 1, 'BS001', 'BS.CKII Nguyễn Minh An', 'MALE', '1975-09-20', '001075005678', 'Bác sĩ Chuyên khoa II Nội tổng quát', 'ACTIVE'),
(3, 3, 1, 'LT001', 'Nguyễn Thị Mai', 'FEMALE', '1998-11-04', '001098009988', 'Cử nhân Quản trị lễ tân', 'ACTIVE'),
(4, 5, 1, 'DD001', 'Trần Thị Lan', 'FEMALE', '1995-03-22', '001095004433', 'Cử nhân Điều dưỡng ĐH Y', 'ACTIVE'),
(5, 6, 6, 'KTV001', 'Lê Văn Đức', 'MALE', '1992-08-10', '001092002211', 'Kỹ thuật viên Xét nghiệm y học', 'ACTIVE'),
(6, 7, 7, 'DS001', 'Phạm Thị Nga', 'FEMALE', '1990-12-05', '001090007766', 'Dược sĩ Đại học', 'ACTIVE'),
(7, 8, 8, 'TN001', 'Đỗ Thúy Hằng', 'FEMALE', '1997-04-18', '001097003355', 'Cử nhân Tài chính - Kế toán', 'ACTIVE');

INSERT INTO doctor_profiles (staff_id, license_number, specialty, consultation_fee, biography, years_of_experience) VALUES
(2, 'CCHN_002345/HN', 'Nội tổng quát & Tim mạch', 200000.00, '25 năm kinh nghiệm điều trị tại Bệnh viện Bạch Mai, chuyên gia về cao huyết áp và tiểu đường.', 25);

-- 5. Ca làm việc
INSERT INTO work_shifts (id, name, start_time, end_time) VALUES
(1, 'Ca sáng', '07:00:00', '12:00:00'),
(2, 'Ca chiều', '13:00:00', '18:00:00'),
(3, 'Ca tối/trực', '18:00:00', '21:00:00');

-- 6. Dịch vụ cận lâm sàng & Bảng giá
INSERT INTO service_categories (id, code, name) VALUES
(1, 'CAT_XN', 'Xét nghiệm sinh hóa - huyết học'),
(2, 'CAT_SA', 'Siêu âm chẩn đoán'),
(3, 'CAT_XQ', 'X-Quang kỹ thuật số'),
(4, 'CAT_NS', 'Nội soi chuyên khoa');

INSERT INTO services (id, category_id, code, name, price, insurance_covered, estimated_duration_minutes) VALUES
(1, 1, 'XN_CONGTHUCMAU', 'Tổng phân tích tế bào máu ngoại vi (24 thông số)', 120000.00, TRUE, 30),
(2, 1, 'XN_DUONGHUYET', 'Đo đường huyết mao mạch / Glucose máu', 60000.00, TRUE, 15),
(3, 1, 'XN_MENGAN', 'Đo men gan ALT, AST, GGT', 150000.00, TRUE, 45),
(4, 2, 'SA_OBUNG', 'Siêu âm Doppler màu ổ bụng tổng quát 4D', 250000.00, TRUE, 15),
(5, 3, 'XQ_NGUCTHANG', 'Chụp X-quang tim phổi thẳng kỹ thuật số (DR)', 180000.00, TRUE, 10),
(6, 4, 'NS_TMH', 'Nội soi Tai Mũi Họng ống mềm có hình ảnh', 300000.00, FALSE, 15);

-- 7. Thuốc & Nhà cung cấp
INSERT INTO suppliers (id, name, tax_code, phone, email, address) VALUES
(1, 'Công ty Cổ phần Dược phẩm Hậu Giang (DHG Pharma)', '1800156801', '02923891433', 'dhgpharma@dhgpharma.com.vn', 'Cần Thơ'),
(2, 'Công ty Cổ phần Traphaco', '0100108656', '18006612', 'info@traphaco.com.vn', 'Hà Nội');

INSERT INTO medicine_categories (id, code, name) VALUES
(1, 'GIAM_DAU', 'Thuốc giảm đau, hạ sốt, kháng viêm'),
(2, 'KHANG_SINH', 'Thuốc kháng sinh diệt khuẩn'),
(3, 'TIM_MACH', 'Thuốc điều trị huyết áp & tim mạch'),
(4, 'DA_DAY', 'Thuốc kháng acid & dạ dày');

INSERT INTO medicines (id, category_id, code, brand_name, active_ingredient, dosage_form, unit, selling_price) VALUES
(1, 1, 'MED_PANADOL', 'Panadol Extra', 'Paracetamol 500mg, Caffeine 65mg', 'Viên nén bao phim', 'Viên', 2500.00),
(2, 2, 'MED_AUGMENTIN', 'Augmentin 1g', 'Amoxicillin 875mg, Acid Clavulanic 125mg', 'Viên nén', 'Viên', 18000.00),
(3, 3, 'MED_AMLOR', 'Amlor 5mg', 'Amlodipine besylate 5mg', 'Viên nang', 'Viên', 8500.00),
(4, 4, 'MED_NEXIUM', 'Nexium 40mg', 'Esomeprazole magnesium trihydrate 40mg', 'Viên nén', 'Viên', 24000.00);

INSERT INTO medicine_batches (id, medicine_id, supplier_id, batch_number, expiry_date, import_price, quantity_imported, quantity_available) VALUES
(1, 1, 1, 'L01-2026', '2028-06-30', 1800.00, 1000, 950),
(2, 2, 1, 'L02-2026', '2027-12-31', 14500.00, 500, 480),
(3, 3, 2, 'L03-2026', '2028-03-31', 6500.00, 400, 390),
(4, 4, 2, 'L04-2026', '2027-10-15', 19000.00, 300, 290);

-- 8. Bệnh nhân mẫu
INSERT INTO patients (id, user_id, patient_code, full_name, gender, date_of_birth, phone, identity_card, health_insurance_number, address, blood_group, drug_allergies) VALUES
(1, 9, 'BN20260001', 'Nguyễn Hoài Nam', 'MALE', '1990-08-14', '0988777666', '001090123456', 'DN4010123456789', 'Số 45 Ngõ 12 Thái Hà, Đống Đa, Hà Nội', 'O+', 'Không có dị ứng thuốc ghi nhận');

-- 9. Lịch hẹn khám
INSERT INTO appointments (id, appointment_code, patient_id, doctor_id, department_id, receptionist_id, appointment_date, appointment_time, symptoms_summary, status) VALUES
(1, 'LH20261031001', 1, 2, 1, 3, '2026-10-31', '08:30:00', 'Đau đầu âm ỉ vùng trán kèm mệt mỏi 2 ngày nay', 'CHECKED_IN');

-- 10. Chỉ số sinh hiệu (Điều dưỡng)
INSERT INTO vital_signs (id, patient_id, nurse_id, temperature, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, respiratory_rate, spo2, weight_kg, height_cm, bmi) VALUES
(1, 1, 4, 37.2, 125, 80, 78, 18, 98.5, 68.0, 172.0, 23.0);

-- 11. Bệnh án khám bệnh (Bác sĩ)
INSERT INTO medical_records (id, record_code, patient_id, doctor_id, room_id, appointment_id, vital_signs_id, chief_complaint, history_of_present_illness, initial_diagnosis, final_diagnosis, icd10_code, doctor_advice, follow_up_date, status) VALUES
(1, 'BA20261031001', 1, 2, 1, 1, 1, 'Đau đầu, hoa mắt nhẹ khi thay đổi tư thế', 'Bệnh nhân đau đầu 2 ngày nay, không sốt, không nôn, mất ngủ nhẹ do công việc căng thẳng', 'Theo dõi đau đầu vận mạch', 'Đau đầu do căng thẳng (Tension-type headache)', 'G44.2', 'Uống nhiều nước, ngủ đủ 7-8 tiếng, tránh làm việc máy tính quá khuya', '2026-11-07', 'COMPLETED');

-- 12. Cận lâm sàng & Kết quả (Kỹ thuật viên)
INSERT INTO lab_orders (id, order_code, medical_record_id, doctor_id, patient_id, status) VALUES
(1, 'CLS20261031001', 1, 2, 1, 'COMPLETED');

INSERT INTO lab_results (id, lab_order_id, service_id, technician_id, room_id, test_value, reference_range, unit, conclusion, status) VALUES
(1, 1, 1, 5, 6, '14.2', '12.0 - 16.5', 'g/dL', 'Chỉ số huyết sắc tố bình thường, không thiếu máu', 'COMPLETED'),
(2, 1, 2, 5, 6, '5.1', '3.9 - 6.4', 'mmol/L', 'Đường huyết trong giới hạn bình thường', 'COMPLETED');

-- 13. Đơn thuốc & Cấp phát (Dược sĩ)
INSERT INTO prescriptions (id, prescription_code, medical_record_id, doctor_id, patient_id, diagnosis, usage_note, status) VALUES
(1, 'DT20261031001', 1, 2, 1, 'Đau đầu do căng thẳng (G44.2)', 'Uống thuốc đúng giờ theo hướng dẫn, tái khám nếu đau tăng', 'DISPENSED');

INSERT INTO prescription_items (id, prescription_id, medicine_id, quantity, morning_dose, noon_dose, afternoon_dose, night_dose, instructions, unit_price, total_amount) VALUES
(1, 1, 1, 10, '1', '0', '0', '1', 'Uống 1 viên sau ăn khi đau, cách nhau tối thiểu 6 tiếng', 2500.00, 25000.00);

INSERT INTO dispensations (id, dispensation_code, prescription_id, pharmacist_id, note) VALUES
(1, 'CP20261031001', 1, 6, 'Đã hướng dẫn bệnh nhân cách dùng thuốc chi tiết và kiểm tra hạn sử dụng.');

-- 14. Hóa đơn & Thu tiền (Thu ngân)
INSERT INTO invoices (id, invoice_code, patient_id, cashier_id, appointment_id, medical_record_id, total_service_amount, total_medicine_amount, discount_amount, insurance_paid_amount, final_amount, status, paid_at) VALUES
(1, 'HD20261031001', 1, 7, 1, 1, 380000.00, 25000.00, 0.00, 100000.00, 305000.00, 'PAID', CURRENT_TIMESTAMP);

INSERT INTO invoice_items (invoice_id, item_type, reference_id, item_name, unit_price, quantity, subtotal) VALUES
(1, 'CONSULTATION_FEE', 1, 'Công khám Bác sĩ Chuyên khoa II', 200000.00, 1, 200000.00),
(1, 'LAB_SERVICE', 1, 'Tổng phân tích tế bào máu ngoại vi', 120000.00, 1, 120000.00),
(1, 'LAB_SERVICE', 2, 'Đo đường huyết mao mạch', 60000.00, 1, 60000.00),
(1, 'MEDICINE', 1, 'Panadol Extra (10 viên)', 2500.00, 10, 25000.00);

INSERT INTO payments (id, payment_code, invoice_id, cashier_id, amount, payment_method, transaction_reference, status) VALUES
(1, 'GD20261031001', 1, 7, 305000.00, 'VNPAY_QR', 'VNPAY9876543210', 'SUCCESS');
