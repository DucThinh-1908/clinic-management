-- =============================================================================
-- DỮ LIỆU KHỞI TẠO MẪU (SEED DATA) CHO 9 TÁC NHÂN
-- =============================================================================
USE clinic_db;

-- 1. DANH MỤC VAI TRÒ (9 ROLES ĐÚNG THEO BẢNG YÊU CẦU)
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

-- 2. TÀI KHOẢN MẪU (Mật khẩu mặc định: 123456 - hash bcrypt mẫu)
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

-- GÁN ROLE CHO USER
INSERT INTO user_roles (user_id, role_id) VALUES
(1, 9), -- admin
(2, 8), -- manager
(3, 2), -- receptionist
(4, 3), -- doctor
(5, 4), -- nurse
(6, 5), -- technician
(7, 6), -- pharmacist
(8, 7), -- cashier
(9, 1); -- patient

-- 3. KHOA PHÒNG & PHÒNG CHỨC NĂNG
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

-- 4. HỒ SƠ NHÂN SỰ
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

-- 5. CA LÀM VIỆC CHUẨN
INSERT INTO work_shifts (id, name, start_time, end_time) VALUES
(1, 'Ca sáng', '07:00:00', '12:00:00'),
(2, 'Ca chiều', '13:00:00', '18:00:00'),
(3, 'Ca tối/trực', '18:00:00', '21:00:00');

-- 6. DANH MỤC DỊCH VỤ CẬN LÂM SÀNG & BẢNG GIÁ
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

-- 7. DANH MỤC THUỐC & NHÀ CUNG CẤP
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

-- 8. BỆNH NHÂN MẪU
INSERT INTO patients (id, user_id, patient_code, full_name, gender, date_of_birth, phone, identity_card, health_insurance_number, address, blood_group, drug_allergies) VALUES
(1, 9, 'BN20260001', 'Nguyễn Hoài Nam', 'MALE', '1990-08-14', '0988777666', '001090123456', 'DN4010123456789', 'Số 45 Ngõ 12 Thái Hà, Đống Đa, Hà Nội', 'O+', 'Không có dị ứng thuốc ghi nhận');

-- 9. LỊCH HẸN KHÁM (Lễ tân duyệt và xếp số)
INSERT INTO appointments (id, appointment_code, patient_id, doctor_id, department_id, receptionist_id, appointment_date, appointment_time, symptoms_summary, status) VALUES
(1, 'LH20261031001', 1, 2, 1, 3, '2026-10-31', '08:30:00', 'Đau đầu âm ỉ vùng trán kèm mệt mỏi 2 ngày nay', 'CHECKED_IN');

-- 10. CHỈ SỐ SINH HIỆU (Điều dưỡng đo)
INSERT INTO vital_signs (id, patient_id, nurse_id, temperature, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, respiratory_rate, spo2, weight_kg, height_cm, bmi) VALUES
(1, 1, 4, 37.2, 125, 80, 78, 18, 98.5, 68.0, 172.0, 23.0);

-- 11. HỒ SƠ BỆNH ÁN KHÁM BỆNH (Bác sĩ chẩn đoán)
INSERT INTO medical_records (id, record_code, patient_id, doctor_id, room_id, appointment_id, vital_signs_id, chief_complaint, history_of_present_illness, initial_diagnosis, final_diagnosis, icd10_code, doctor_advice, follow_up_date, status) VALUES
(1, 'BA20261031001', 1, 2, 1, 1, 1, 'Đau đầu, hoa mắt nhẹ khi thay đổi tư thế', 'Bệnh nhân đau đầu 2 ngày nay, không sốt, không nôn, mất ngủ nhẹ do công việc căng thẳng', 'Theo dõi đau đầu vận mạch', 'Đau đầu do căng thẳng (Tension-type headache)', 'G44.2', 'Uống nhiều nước, ngủ đủ 7-8 tiếng, tránh làm việc máy tính quá khuya', '2026-11-07', 'COMPLETED');

-- 12. PHIẾU CHỈ ĐỊNH CẬN LÂM SÀNG & KẾT QUẢ (Kỹ thuật viên nhập)
INSERT INTO lab_orders (id, order_code, medical_record_id, doctor_id, patient_id, status) VALUES
(1, 'CLS20261031001', 1, 2, 1, 'COMPLETED');

INSERT INTO lab_results (id, lab_order_id, service_id, technician_id, room_id, test_value, reference_range, unit, conclusion, status) VALUES
(1, 1, 1, 5, 6, '14.2', '12.0 - 16.5', 'g/dL', 'Chỉ số huyết sắc tố bình thường, không thiếu máu', 'COMPLETED'),
(2, 1, 2, 5, 6, '5.1', '3.9 - 6.4', 'mmol/L', 'Đường huyết trong giới hạn bình thường', 'COMPLETED');

-- 13. ĐƠN THUỐC BÁC SĨ KÊ & CẤP PHÁT (Dược sĩ cấp)
INSERT INTO prescriptions (id, prescription_code, medical_record_id, doctor_id, patient_id, diagnosis, usage_note, status) VALUES
(1, 'DT20261031001', 1, 2, 1, 'Đau đầu do căng thẳng (G44.2)', 'Uống thuốc đúng giờ theo hướng dẫn, tái khám nếu đau tăng', 'DISPENSED');

INSERT INTO prescription_items (id, prescription_id, medicine_id, quantity, morning_dose, noon_dose, afternoon_dose, night_dose, instructions, unit_price, total_amount) VALUES
(1, 1, 1, 10, '1', '0', '0', '1', 'Uống 1 viên sau ăn khi đau, cách nhau tối thiểu 6 tiếng', 2500.00, 25000.00);

INSERT INTO dispensations (id, dispensation_code, prescription_id, pharmacist_id, note) VALUES
(1, 'CP20261031001', 1, 6, 'Đã hướng dẫn bệnh nhân cách dùng thuốc chi tiết và kiểm tra hạn sử dụng.');

-- 14. HÓA ĐƠN & THU TIỀN VIỆN PHÍ (Thu ngân thực hiện)
INSERT INTO invoices (id, invoice_code, patient_id, cashier_id, appointment_id, medical_record_id, total_service_amount, total_medicine_amount, discount_amount, insurance_paid_amount, final_amount, status, paid_at) VALUES
(1, 'HD20261031001', 1, 7, 1, 1, 380000.00, 25000.00, 0.00, 100000.00, 305000.00, 'PAID', CURRENT_TIMESTAMP);

INSERT INTO invoice_items (invoice_id, item_type, reference_id, item_name, unit_price, quantity, subtotal) VALUES
(1, 'CONSULTATION_FEE', 1, 'Công khám Bác sĩ Chuyên khoa II', 200000.00, 1, 200000.00),
(1, 'LAB_SERVICE', 1, 'Tổng phân tích tế bào máu ngoại vi', 120000.00, 1, 120000.00),
(1, 'LAB_SERVICE', 2, 'Đo đường huyết mao mạch', 60000.00, 1, 60000.00),
(1, 'MEDICINE', 1, 'Panadol Extra (10 viên)', 2500.00, 10, 25000.00);

INSERT INTO payments (id, payment_code, invoice_id, cashier_id, amount, payment_method, transaction_reference, status) VALUES
(1, 'GD20261031001', 1, 7, 305000.00, 'VNPAY_QR', 'VNPAY9876543210', 'SUCCESS');
