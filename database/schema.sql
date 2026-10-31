-- =============================================================================
-- HỆ THỐNG QUẢN LÝ PHÒNG KHÁM ĐA KHOA (CLINIC MANAGEMENT SYSTEM)
-- DATABASE SCHEMA - MySQL 8.0+
-- Thiết kế chuẩn hóa 3NF cho 9 tác nhân:
-- 1. admin (Quản trị hệ thống)
-- 2. manager (Quản lý phòng khám)
-- 3. receptionist (Lễ tân)
-- 4. patient (Bệnh nhân)
-- 5. nurse (Điều dưỡng)
-- 6. doctor (Bác sĩ)
-- 7. technician (Kỹ thuật viên)
-- 8. pharmacist (Dược sĩ)
-- 9. cashier (Thu ngân)
-- =============================================================================

DROP DATABASE IF EXISTS clinic_db;
CREATE DATABASE clinic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clinic_db;

-- -----------------------------------------------------------------------------
-- PHẦN 1: QUẢN TRỊ TÀI KHOẢN, PHÂN QUYỀN & HỆ THỐNG (ADMIN)
-- -----------------------------------------------------------------------------

-- Bảng vai trò hệ thống
CREATE TABLE roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã vai trò: admin, manager, doctor, ...',
    name VARCHAR(100) NOT NULL COMMENT 'Tên vai trò hiển thị',
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Bảng lưu trữ danh mục vai trò người dùng';

-- Bảng phân quyền chi tiết (Permissions)
CREATE TABLE permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE COMMENT 'Ví dụ: PATIENT_VIEW, PRESCRIPTION_CREATE',
    name VARCHAR(150) NOT NULL,
    module VARCHAR(50) NOT NULL COMMENT 'Nhóm quyền: APPOINTMENT, MEDICAL_RECORD, PHARMACY...',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Bảng danh mục quyền thao tác';

-- Bảng trung gian Role - Permission
CREATE TABLE role_permissions (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng tài khoản người dùng (Users)
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
) ENGINE=InnoDB COMMENT='Tài khoản đăng nhập cho toàn bộ nhân sự và bệnh nhân';

-- Bảng gán vai trò cho tài khoản (User - Role)
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng lưu vết nhật ký hệ thống (Audit Logs)
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    action VARCHAR(100) NOT NULL COMMENT 'CREATE, UPDATE, DELETE, LOGIN, EXPORT...',
    entity_name VARCHAR(100) NOT NULL COMMENT 'Tên bảng/thực thể chịu tác động',
    entity_id VARCHAR(50) NULL,
    old_data JSON NULL,
    new_data JSON NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Bảng cấu hình hệ thống
CREATE TABLE system_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- PHẦN 2: CƠ CẤU TỔ CHỨC, NHÂN SỰ & CA LÀM VIỆC (MANAGER)
-- -----------------------------------------------------------------------------

-- Bảng khoa / phòng ban (Khoa Nội, Khoa Nhi, Chẩn đoán hình ảnh, Dược...)
CREATE TABLE departments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    location VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Bảng phòng chức năng / phòng khám cụ thể (P.101 Khám Nội, P.102 Khám Nhi, P.Siêu âm...)
CREATE TABLE clinic_rooms (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    department_id BIGINT NOT NULL,
    room_number VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    room_type ENUM('EXAMINATION', 'TREATMENT', 'LABORATORY', 'IMAGING', 'PHARMACY', 'CASHIER', 'OTHER') DEFAULT 'EXAMINATION',
    is_available BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_room_department FOREIGN KEY (department_id) REFERENCES departments(id)
) ENGINE=InnoDB;

-- Bảng hồ sơ nhân viên y tế / cán bộ phòng khám (Staff)
CREATE TABLE staff (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    department_id BIGINT NULL,
    staff_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã NV: NV001, BS002, LT003...',
    full_name VARCHAR(150) NOT NULL,
    gender ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    date_of_birth DATE,
    id_card_number VARCHAR(20) UNIQUE COMMENT 'CCCD',
    address VARCHAR(255),
    qualification VARCHAR(100) COMMENT 'Học vị: Bác sĩ CKII, Thạc sĩ, Cử nhân...',
    hire_date DATE,
    status ENUM('ACTIVE', 'ON_LEAVE', 'RESIGNED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_staff_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_staff_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Bảng thông tin chi tiết Bác sĩ (Doctor Profile)
CREATE TABLE doctor_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    staff_id BIGINT UNIQUE NOT NULL,
    license_number VARCHAR(50) UNIQUE COMMENT 'Số chứng chỉ hành nghề',
    specialty VARCHAR(150) NOT NULL,
    consultation_fee DECIMAL(12,2) DEFAULT 200000.00 COMMENT 'Giá công khám chuẩn',
    biography TEXT,
    years_of_experience INT DEFAULT 0,
    CONSTRAINT fk_doc_staff FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng ca làm việc chuẩn
CREATE TABLE work_shifts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL COMMENT 'Ca sáng, Ca chiều, Ca đêm',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
) ENGINE=InnoDB;

-- Bảng phân lịch trực / lịch làm việc của nhân viên (Do Quản lý sắp xếp)
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

-- -----------------------------------------------------------------------------
-- PHẦN 3: BỆNH NHÂN, LỊCH HẸN & TIẾP ĐÓN (PATIENT & RECEPTIONIST)
-- -----------------------------------------------------------------------------

-- Bảng hồ sơ bệnh nhân (Patients)
CREATE TABLE patients (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL UNIQUE COMMENT 'Tài khoản liên kết để đăng nhập cổng bệnh nhân',
    patient_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã định danh BN: BN20260001...',
    full_name VARCHAR(150) NOT NULL,
    gender ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    date_of_birth DATE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    identity_card VARCHAR(20) COMMENT 'Số CCCD/Hộ chiếu',
    health_insurance_number VARCHAR(30) COMMENT 'Mã thẻ BHYT',
    address VARCHAR(255),
    emergency_contact_name VARCHAR(150),
    emergency_contact_phone VARCHAR(20),
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN') DEFAULT 'UNKNOWN',
    medical_history TEXT COMMENT 'Tiền sử bệnh mạn tính',
    drug_allergies TEXT COMMENT 'Tiền sử dị ứng thuốc/thức ăn',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_patient_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Bảng lịch hẹn khám (Appointments)
CREATE TABLE appointments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_code VARCHAR(50) NOT NULL UNIQUE,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NULL COMMENT 'Bác sĩ được chọn khám (nếu có)',
    department_id BIGINT NULL COMMENT 'Chuyên khoa mong muốn khám',
    receptionist_id BIGINT NULL COMMENT 'Lễ tân tiếp nhận xử lý',
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    symptoms_summary TEXT COMMENT 'Lý do khám / Triệu chứng ban đầu',
    booking_channel ENUM('ONLINE_PORTAL', 'CALL_CENTER', 'DIRECT_WALKIN') DEFAULT 'ONLINE_PORTAL',
    status ENUM('PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_app_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_app_doctor FOREIGN KEY (doctor_id) REFERENCES staff(id) ON DELETE SET NULL,
    CONSTRAINT fk_app_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_app_rec FOREIGN KEY (receptionist_id) REFERENCES staff(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Bảng phiếu số thứ tự tiếp đón & hàng đợi phòng khám (Queue Tickets)
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

-- -----------------------------------------------------------------------------
-- PHẦN 4: ĐIỀU DƯỠNG & CHỈ SỐ SINH HIỆU (NURSE)
-- -----------------------------------------------------------------------------

-- Bảng chỉ số sinh hiệu (Vital Signs do Điều dưỡng đo trước khi vào gặp Bác sĩ)
CREATE TABLE vital_signs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    nurse_id BIGINT NOT NULL COMMENT 'Điều dưỡng phụ trách đo',
    temperature DECIMAL(4,1) COMMENT 'Nhiệt độ cơ thể (độ C)',
    blood_pressure_systolic INT COMMENT 'Huyết áp tâm thu (mmHg)',
    blood_pressure_diastolic INT COMMENT 'Huyết áp tâm trương (mmHg)',
    heart_rate INT COMMENT 'Nhịp tim (nhịp/phút)',
    respiratory_rate INT COMMENT 'Nhịp thở (lần/phút)',
    spo2 DECIMAL(4,1) COMMENT 'Nồng độ oxy trong máu (%)',
    weight_kg DECIMAL(5,2) COMMENT 'Cân nặng (kg)',
    height_cm DECIMAL(5,2) COMMENT 'Chiều cao (cm)',
    bmi DECIMAL(4,1) COMMENT 'Chỉ số khối cơ thể (BMI)',
    notes VARCHAR(255) COMMENT 'Ghi chú thêm của điều dưỡng',
    measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vital_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_vital_nurse FOREIGN KEY (nurse_id) REFERENCES staff(id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- PHẦN 5: KHÁM LÂM SÀNG, BỆNH ÁN & CHẨN ĐOÁN (DOCTOR)
-- -----------------------------------------------------------------------------

-- Bảng hồ sơ bệnh án / Phiên khám bệnh (Medical Records / Encounters)
CREATE TABLE medical_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    record_code VARCHAR(50) NOT NULL UNIQUE,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    room_id BIGINT NOT NULL,
    appointment_id BIGINT NULL,
    vital_signs_id BIGINT NULL,
    chief_complaint TEXT NOT NULL COMMENT 'Lý do vào khám',
    history_of_present_illness TEXT COMMENT 'Bệnh sử chi tiết',
    physical_examination TEXT COMMENT 'Khám lâm sàng các cơ quan',
    initial_diagnosis VARCHAR(255) COMMENT 'Chẩn đoán sơ bộ',
    final_diagnosis VARCHAR(255) NOT NULL COMMENT 'Chẩn đoán xác định',
    icd10_code VARCHAR(20) COMMENT 'Mã bệnh quốc tế ICD-10',
    doctor_advice TEXT COMMENT 'Lời dặn dò chế độ dinh dưỡng, sinh hoạt',
    follow_up_date DATE COMMENT 'Ngày hẹn tái khám',
    status ENUM('IN_PROGRESS', 'WAITING_PARACLINICAL', 'COMPLETED') DEFAULT 'IN_PROGRESS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rec_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_rec_doctor FOREIGN KEY (doctor_id) REFERENCES staff(id),
    CONSTRAINT fk_rec_room FOREIGN KEY (room_id) REFERENCES clinic_rooms(id),
    CONSTRAINT fk_rec_app FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    CONSTRAINT fk_rec_vital FOREIGN KEY (vital_signs_id) REFERENCES vital_signs(id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- PHẦN 6: DỊCH VỤ CẬN LÂM SÀNG & KẾT QUẢ XÉT NGHIỆM (TECHNICIAN)
-- -----------------------------------------------------------------------------

-- Bảng phân loại dịch vụ kỹ thuật
CREATE TABLE service_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- Bảng danh mục dịch vụ y tế & bảng giá (Quản lý thiết lập)
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

-- Bảng phiếu chỉ định cận lâm sàng (Bác sĩ tạo phiếu chỉ định)
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

-- Bảng chi tiết từng dịch vụ cận lâm sàng được chỉ định & kết quả (Kỹ thuật viên thực hiện)
CREATE TABLE lab_results (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    lab_order_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    technician_id BIGINT NULL COMMENT 'Kỹ thuật viên thực hiện',
    room_id BIGINT NULL COMMENT 'Phòng cận lâm sàng thực hiện',
    test_value VARCHAR(255) COMMENT 'Giá trị đo được (VD: 5.2, Âm tính, Bình thường)',
    reference_range VARCHAR(100) COMMENT 'Khoảng tham chiếu bình thường (VD: 4.1 - 5.9 mmol/L)',
    unit VARCHAR(50) COMMENT 'Đơn vị đo (mmol/L, g/L, ...)',
    conclusion TEXT COMMENT 'Kết luận của Kỹ thuật viên / Bác sĩ CĐHA',
    image_attachment_url VARCHAR(255) COMMENT 'Link ảnh phim X-quang, Siêu âm, ECG...',
    status ENUM('WAITING', 'PROCESSING', 'COMPLETED') DEFAULT 'WAITING',
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lr_order FOREIGN KEY (lab_order_id) REFERENCES lab_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_lr_service FOREIGN KEY (service_id) REFERENCES services(id),
    CONSTRAINT fk_lr_tech FOREIGN KEY (technician_id) REFERENCES staff(id) ON DELETE SET NULL,
    CONSTRAINT fk_lr_room FOREIGN KEY (room_id) REFERENCES clinic_rooms(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- PHẦN 7: DƯỢC PHẨM, KHO THUỐC & CẤP PHÁT (PHARMACIST)
-- -----------------------------------------------------------------------------

-- Bảng nhóm thuốc
CREATE TABLE medicine_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- Bảng nhà cung cấp dược phẩm
CREATE TABLE suppliers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    tax_code VARCHAR(30),
    phone VARCHAR(20),
    email VARCHAR(100),
    address VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- Bảng danh mục thuốc (Medicines)
CREATE TABLE medicines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    brand_name VARCHAR(150) NOT NULL COMMENT 'Tên thương mại (VD: Panadol Extra)',
    active_ingredient VARCHAR(150) NOT NULL COMMENT 'Hoạt chất (VD: Paracetamol 500mg, Caffeine 65mg)',
    dosage_form VARCHAR(50) NOT NULL COMMENT 'Dạng bào chế: Viên nén, Dung dịch, Xi-rô...',
    unit VARCHAR(30) NOT NULL COMMENT 'Đơn vị tính: Viên, Vỉ, Hộp, Chai...',
    usage_instructions VARCHAR(255) COMMENT 'Hướng dẫn đường dùng: Uống, Tiêm bắp, Bôi...',
    selling_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    is_prescription_required BOOLEAN DEFAULT TRUE,
    contraindications TEXT COMMENT 'Chống chỉ định',
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_med_cat FOREIGN KEY (category_id) REFERENCES medicine_categories(id)
) ENGINE=InnoDB;

-- Bảng các lô thuốc trong kho (Quản lý tồn kho chi tiết theo lô và hạn sử dụng)
CREATE TABLE medicine_batches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    medicine_id BIGINT NOT NULL,
    supplier_id BIGINT NULL,
    batch_number VARCHAR(50) NOT NULL COMMENT 'Số lô sản xuất',
    manufacture_date DATE,
    expiry_date DATE NOT NULL,
    import_price DECIMAL(12,2) NOT NULL,
    quantity_imported INT NOT NULL,
    quantity_available INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_batch_med FOREIGN KEY (medicine_id) REFERENCES medicines(id),
    CONSTRAINT fk_batch_sup FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Bảng lịch sử nhập / xuất / điều chỉnh kho thuốc (Dược sĩ quản lý)
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

-- Bảng đơn thuốc (Do Bác sĩ kê cho Bệnh nhân)
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

-- Bảng chi tiết từng loại thuốc trong đơn
CREATE TABLE prescription_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    prescription_id BIGINT NOT NULL,
    medicine_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    morning_dose VARCHAR(20) DEFAULT '0',
    noon_dose VARCHAR(20) DEFAULT '0',
    afternoon_dose VARCHAR(20) DEFAULT '0',
    night_dose VARCHAR(20) DEFAULT '0',
    instructions VARCHAR(255) COMMENT 'VD: Uống sau ăn no, uống nhiều nước',
    unit_price DECIMAL(12,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_pi_pres FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
    CONSTRAINT fk_pi_med FOREIGN KEY (medicine_id) REFERENCES medicines(id)
) ENGINE=InnoDB;

-- Bảng phiếu cấp phát thuốc (Dược sĩ thực hiện cấp thuốc theo đơn)
CREATE TABLE dispensations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dispensation_code VARCHAR(50) NOT NULL UNIQUE,
    prescription_id BIGINT NOT NULL,
    pharmacist_id BIGINT NOT NULL COMMENT 'Dược sĩ cấp phát',
    dispensed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    note VARCHAR(255),
    CONSTRAINT fk_disp_pres FOREIGN KEY (prescription_id) REFERENCES prescriptions(id),
    CONSTRAINT fk_disp_pharm FOREIGN KEY (pharmacist_id) REFERENCES staff(id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- PHẦN 8: VIỆN PHÍ, HÓA ĐƠN & THU TIỀN (CASHIER)
-- -----------------------------------------------------------------------------

-- Bảng hóa đơn viện phí tổng hợp
CREATE TABLE invoices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_code VARCHAR(50) NOT NULL UNIQUE,
    patient_id BIGINT NOT NULL,
    cashier_id BIGINT NULL COMMENT 'Thu ngân phụ trách lập/thu',
    appointment_id BIGINT NULL,
    medical_record_id BIGINT NULL,
    total_service_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Tiền khám & Cận lâm sàng',
    total_medicine_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Tiền thuốc',
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    insurance_paid_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT 'BHYT chi trả',
    final_amount DECIMAL(12,2) NOT NULL COMMENT 'Số tiền người bệnh thực trả',
    status ENUM('UNPAID', 'PAID', 'REFUNDED', 'CANCELLED') DEFAULT 'UNPAID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP NULL,
    CONSTRAINT fk_inv_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
    CONSTRAINT fk_inv_cashier FOREIGN KEY (cashier_id) REFERENCES staff(id) ON DELETE SET NULL,
    CONSTRAINT fk_inv_app FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    CONSTRAINT fk_inv_rec FOREIGN KEY (medical_record_id) REFERENCES medical_records(id)
) ENGINE=InnoDB;

-- Bảng chi tiết các khoản mục trong hóa đơn
CREATE TABLE invoice_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    item_type ENUM('CONSULTATION_FEE', 'LAB_SERVICE', 'MEDICINE', 'OTHER') NOT NULL,
    reference_id BIGINT NULL COMMENT 'ID của service_id hoặc medicine_id tương ứng',
    item_name VARCHAR(150) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    subtotal DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_ii_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng giao dịch thanh toán viện phí (Hỗ trợ nhiều phương thức: Tiền mặt, Thẻ, QR)
CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_code VARCHAR(50) NOT NULL UNIQUE,
    invoice_id BIGINT NOT NULL,
    cashier_id BIGINT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('CASH', 'CREDIT_CARD', 'BANK_TRANSFER', 'VNPAY_QR', 'MOMO') DEFAULT 'CASH',
    transaction_reference VARCHAR(100) COMMENT 'Mã chuẩn chi ngân hàng hoặc mã giao dịch ví',
    status ENUM('SUCCESS', 'FAILED', 'PENDING') DEFAULT 'SUCCESS',
    payment_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    note VARCHAR(255),
    CONSTRAINT fk_pay_inv FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    CONSTRAINT fk_pay_cashier FOREIGN KEY (cashier_id) REFERENCES staff(id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- PHẦN 9: CÁC CHỈ MỤC TỐI ƯU HIỆU NĂNG TRUY VẤN (INDEXES)
-- -----------------------------------------------------------------------------
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_code ON patients(patient_code);
CREATE INDEX idx_appointments_date ON appointments(appointment_date, status);
CREATE INDEX idx_medrec_patient ON medical_records(patient_id);
CREATE INDEX idx_medrec_doctor ON medical_records(doctor_id);
CREATE INDEX idx_lab_order_status ON lab_orders(status);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_invoices_status ON invoices(status, created_at);
CREATE INDEX idx_batches_expiry ON medicine_batches(expiry_date);
