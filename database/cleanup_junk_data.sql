-- =============================================================================
-- KỊCH BẢN DỌN DẸP DỮ LIỆU THỪA VÀ TRÙNG LẶP TRONG CLINIC_DB
-- Khắc phục tình trạng nhân bản do bài kiểm thử (Integration Tests) sinh ra
-- =============================================================================

USE clinic_db;

-- Tắt kiểm tra khóa ngoại tạm thời để xóa an toàn theo thứ tự
SET FOREIGN_KEY_CHECKS = 0;

-- 1. CHUẨN HÓA BÁC SĨ THỨ 2 (BS.CKI LÊ THỊ THU HƯƠNG - KHOA NHI)
-- Giữ lại duy nhất 1 hồ sơ Bác sĩ Hương chuẩn tại staff id = 8
UPDATE users 
SET username = 'doctor_huong', 
    email = 'bs.huong@careplusclinic.vn', 
    phone = '0901000010',
    password_hash = '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi',
    is_active = TRUE
WHERE id = 36;

-- Đảm bảo user 36 có quyền doctor (role_id = 3)
DELETE FROM user_roles WHERE user_id = 36;
INSERT INTO user_roles (user_id, role_id) VALUES (36, 3);

UPDATE staff 
SET staff_code = 'BS002',
    full_name = 'BS.CKI Lê Thị Thu Hương',
    gender = 'FEMALE',
    department_id = 2,
    qualification = 'Bác sĩ Chuyên khoa I Nhi',
    status = 'ACTIVE',
    user_id = 36
WHERE id = 8;

UPDATE doctor_profiles 
SET specialty = 'Nhi khoa tổng quát & Dinh dưỡng',
    license_number = 'CCHN_008899/HN',
    consultation_fee = 200000.00,
    years_of_experience = 12,
    biography = '12 năm kinh nghiệm khám chữa bệnh và tư vấn dinh dưỡng cho trẻ nhỏ.'
WHERE staff_id = 8;

-- 2. XÓA TẤT CẢ CÁC BẢN SAO NHÂN BẢN BÁC SĨ LÊ THỊ THU HƯƠNG (staff id > 8)
DELETE FROM doctor_profiles WHERE staff_id > 8;
DELETE FROM staff WHERE id > 8;

-- 3. XÓA CÁC PHÒNG KHÁM VÀ KHOA PHÒNG RÁC NHÂN BẢN (K_MAT_xxx)
DELETE FROM clinic_rooms WHERE department_id >= 9 OR name LIKE '%Phong Kham Mat%';
DELETE FROM departments WHERE id >= 9 OR code LIKE 'K_MAT_%';

-- Tạo 01 Khoa Mắt chuẩn và 01 Phòng Khám Mắt chuẩn nếu chưa có
INSERT INTO departments (id, code, name, description, location, is_active)
SELECT 9, 'K_MAT', 'Khoa Mắt & Khúc Xạ', 'Khám thị lực, đo khúc xạ và điều trị các tật khúc xạ', 'Tầng 2 - Khu B', TRUE
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE code = 'K_MAT');

INSERT INTO clinic_rooms (id, department_id, room_number, name, room_type, is_available)
SELECT 9, 9, 'P202', 'Phòng Khám Mắt', 'EXAMINATION', TRUE
WHERE NOT EXISTS (SELECT 1 FROM clinic_rooms WHERE room_number = 'P202');

-- 4. XÓA CÁC BỆNH ÁN, CHỈ ĐỊNH, ĐƠN THUỐC, HÓA ĐƠN RÁC LIÊN QUAN ĐẾN CÁC BỆNH NHÂN TEST
-- Danh sách bệnh nhân rác: các bệnh nhân ngoài id = 1 (Nam) và id = 8 (Thịnh) và các bệnh nhân có tên test
CREATE TEMPORARY TABLE temp_junk_patient_ids AS
SELECT id FROM patients 
WHERE id NOT IN (1, 8) 
  AND (full_name LIKE '%Mai Hoa%' 
       OR full_name LIKE '%Ho so trung%' 
       OR user_id IS NULL 
       OR user_id NOT IN (9, 14, 20, 21));

-- Xóa các bảng liên quan đến bệnh nhân rác
DELETE FROM payments WHERE invoice_id IN (SELECT id FROM invoices WHERE patient_id IN (SELECT id FROM temp_junk_patient_ids));
DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE patient_id IN (SELECT id FROM temp_junk_patient_ids));
DELETE FROM invoices WHERE patient_id IN (SELECT id FROM temp_junk_patient_ids);

DELETE FROM dispensations WHERE prescription_id IN (SELECT id FROM prescriptions WHERE patient_id IN (SELECT id FROM temp_junk_patient_ids));
DELETE FROM prescription_items WHERE prescription_id IN (SELECT id FROM prescriptions WHERE patient_id IN (SELECT id FROM temp_junk_patient_ids));
DELETE FROM prescriptions WHERE patient_id IN (SELECT id FROM temp_junk_patient_ids);

DELETE FROM lab_results WHERE lab_order_id IN (SELECT id FROM lab_orders WHERE patient_id IN (SELECT id FROM temp_junk_patient_ids));
DELETE FROM lab_orders WHERE patient_id IN (SELECT id FROM temp_junk_patient_ids);

DELETE FROM queue_tickets WHERE patient_id IN (SELECT id FROM temp_junk_patient_ids);
DELETE FROM vital_signs WHERE patient_id IN (SELECT id FROM temp_junk_patient_ids);
DELETE FROM appointment_reminders WHERE appointment_id IN (SELECT id FROM appointments WHERE patient_id IN (SELECT id FROM temp_junk_patient_ids));
DELETE FROM appointments WHERE patient_id IN (SELECT id FROM temp_junk_patient_ids);
DELETE FROM medical_records WHERE patient_id IN (SELECT id FROM temp_junk_patient_ids);

-- Xóa hồ sơ bệnh nhân rác
DELETE FROM patients WHERE id IN (SELECT id FROM temp_junk_patient_ids);
DROP TEMPORARY TABLE temp_junk_patient_ids;

-- 5. XÓA CÁC TÀI KHOẢN NGƯỜI DÙNG TEST RÁC
-- Giữ lại: admin(1), manager(2), receptionist(3), doctor_an(4), nurse_lan(5), tech_duc(6), pharm_nga(7), cashier_thuy(8), patient_nam(9), patient_thinh(14), pwsh_patient_01(20), thinh(21), doctor_huong(36)
DELETE FROM user_roles 
WHERE user_id NOT IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 14, 20, 21, 36)
  AND (user_id IN (SELECT id FROM users WHERE username LIKE 'dr_huong_%' OR username LIKE 'test_user_%' OR username LIKE 'patient_new_%'));

DELETE FROM password_reset_tokens 
WHERE user_id NOT IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 14, 20, 21, 36);

DELETE FROM users 
WHERE id NOT IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 14, 20, 21, 36)
  AND (username LIKE 'dr_huong_%' OR username LIKE 'test_user_%' OR username LIKE 'patient_new_%');

-- 6. XÓA CÁC LÔ THUỐC TEST
DELETE FROM medicine_batches WHERE batch_number LIKE 'BATCH_TEST_%';

-- 7. DỌN DẸP AUDIT LOGS KHÔNG CÒN USER HỢP LỆ
DELETE FROM audit_logs WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users);

-- Bật lại kiểm tra khóa ngoại
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- KIỂM TRA SỐ LƯỢNG SAU KHI DỌN DẸP
-- =============================================================================
SELECT 'users' AS table_name, COUNT(*) AS count FROM users
UNION ALL
SELECT 'staff', COUNT(*) FROM staff
UNION ALL
SELECT 'doctor_profiles', COUNT(*) FROM doctor_profiles
UNION ALL
SELECT 'departments', COUNT(*) FROM departments
UNION ALL
SELECT 'clinic_rooms', COUNT(*) FROM clinic_rooms
UNION ALL
SELECT 'patients', COUNT(*) FROM patients;
