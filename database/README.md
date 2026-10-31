# Thiết Kế Cơ Sở Dữ Liệu Quản Lý Phòng Khám (Clinic Management Database)

Cơ sở dữ liệu được thiết kế chuẩn hóa bậc 3 (3NF) trên nền tảng **MySQL 8.0+**, hỗ trợ đầy đủ quy trình nghiệp vụ chuyên biệt cho **9 tác nhân** trong hệ thống.

---

## 👥 Bảng Phân Quyền & Vai Trò (9 Tác Nhân)

| Mã vai trò (`role`) | Tác nhân | Nhiệm vụ chính & Các bảng phụ trách |
|---|---|---|
| `admin` | **Quản trị hệ thống** | Quản lý tài khoản, phân quyền, cấu hình hệ thống, xem nhật ký truy vết (`users`, `roles`, `permissions`, `role_permissions`, `audit_logs`, `system_settings`) |
| `manager` | **Quản lý phòng khám** | Quản lý nhân sự, cơ cấu khoa phòng, lịch trực ca, bảng giá dịch vụ, xem báo cáo doanh thu (`staff`, `doctor_profiles`, `departments`, `clinic_rooms`, `work_shifts`, `staff_schedules`, `services`) |
| `receptionist` | **Lễ tân** | Tiếp đón người bệnh, tra cứu & tạo hồ sơ bệnh nhân, quản lý tiếp nhận lịch hẹn, cấp số thứ tự phòng khám (`patients`, `appointments`, `queue_tickets`) |
| `patient` | **Bệnh nhân** | Đăng ký tài khoản cổng thông tin, đặt lịch hẹn online, tra cứu hồ sơ bệnh án, lịch sử khám, đơn thuốc và hóa đơn cá nhân (`patients`, `appointments`, `medical_records`, `prescriptions`, `invoices`) |
| `nurse` | **Điều dưỡng** | Tiếp nhận bệnh nhân tại phòng khám, đo các chỉ số sinh hiệu trước khám, hỗ trợ bác sĩ và điều phối gọi số (`vital_signs`, `queue_tickets`, `patients`) |
| `doctor` | **Bác sĩ** | Khám lâm sàng, ghi nhận bệnh sử, chẩn đoán sơ bộ & chẩn đoán xác định (mã ICD-10), chỉ định cận lâm sàng, kê đơn thuốc và hẹn ngày tái khám (`medical_records`, `lab_orders`, `prescriptions`, `prescription_items`) |
| `technician` | **Kỹ thuật viên** | Tiếp nhận yêu cầu cận lâm sàng từ bác sĩ, thực hiện xét nghiệm/siêu âm/X-quang, cập nhật trị số, kết luận và đính kèm hình ảnh kết quả (`lab_orders`, `lab_results`, `clinic_rooms`) |
| `pharmacist` | **Dược sĩ** | Quản lý danh mục thuốc, quản lý lô hạn dùng & nhập/xuất tồn kho thuốc, kiểm tra đơn bác sĩ và thực hiện cấp phát thuốc cho người bệnh (`medicines`, `medicine_categories`, `suppliers`, `medicine_batches`, `stock_transactions`, `dispensations`) |
| `cashier` | **Thu ngân** | Lập phiếu thu và hóa đơn viện phí tổng hợp (công khám + xét nghiệm + thuốc), tính toán bảo hiểm chi trả, thu tiền qua nhiều phương thức (tiền mặt, thẻ, QR VNPAY/MoMo) (`invoices`, `invoice_items`, `payments`) |

---

## 🗂️ Danh Sách 32 Bảng Dữ Liệu (Phân Theo Module)

### 1. Phân hệ Quản trị & Tài khoản
1. `roles`: Danh mục vai trò (`admin`, `manager`, `doctor`, `nurse`, `technician`, `pharmacist`, `cashier`, `receptionist`, `patient`).
2. `permissions`: Danh mục quyền hạn chi tiết (CREATE, READ, UPDATE, DELETE).
3. `role_permissions`: Bảng trung gian phân quyền vai trò.
4. `users`: Tài khoản đăng nhập hệ thống (băm mật khẩu Bcrypt, trạng thái kích hoạt).
5. `user_roles`: Bảng gán vai trò cho tài khoản.
6. `audit_logs`: Nhật ký lưu vết hành động bảo mật (Ai làm gì, lúc nào, IP nào).
7. `system_settings`: Cấu hình toàn hệ thống (tên phòng khám, hotline, giờ trực).

### 2. Phân hệ Tổ chức & Nhân sự
8. `departments`: Khoa phòng ban (Khoa Nội, Khoa Nhi, Chẩn đoán hình ảnh, Dược, Thu ngân...).
9. `clinic_rooms`: Phòng chức năng cụ thể (P101 Khám Nội, P102 Khám Nhi, Phòng Siêu âm 4D...).
10. `staff`: Hồ sơ nhân sự (mã NV, họ tên, CCCD, bằng cấp, trạng thái công tác).
11. `doctor_profiles`: Thông tin chuyên sâu Bác sĩ (chứng chỉ hành nghề, học vị, thâm niên, giá khám).
12. `work_shifts`: Ca làm việc chuẩn (Ca sáng, Ca chiều, Ca đêm).
13. `staff_schedules`: Phân lịch trực của nhân viên theo ngày và ca.

### 3. Phân hệ Bệnh nhân, Tiếp đón & Điều dưỡng
14. `patients`: Hồ sơ bệnh nhân (mã BN, họ tên, ngày sinh, CCCD, thẻ BHYT, nhóm máu, dị ứng thuốc).
15. `appointments`: Lịch hẹn khám (ngày giờ, lý do khám, bác sĩ/chuyên khoa yêu cầu, trạng thái).
16. `queue_tickets`: Phiếu số thứ tự tiếp đón và xếp hàng vào phòng khám.
17. `vital_signs`: Chỉ số sinh hiệu (nhiệt độ, huyết áp, nhịp tim, nhịp thở, SpO2, chiều cao, cân nặng, BMI).

### 4. Phân hệ Khám bệnh & Cận lâm sàng
18. `medical_records`: Bệnh án / Phiên khám bệnh (lý do vào khám, bệnh sử, chẩn đoán ICD-10, lời dặn).
19. `service_categories`: Nhóm dịch vụ kỹ thuật (Xét nghiệm, Siêu âm, X-quang, Nội soi).
20. `services`: Danh mục bảng giá dịch vụ cận lâm sàng.
21. `lab_orders`: Phiếu chỉ định cận lâm sàng do Bác sĩ tạo.
22. `lab_results`: Kết quả cận lâm sàng do Kỹ thuật viên nhập (trị số, khoảng tham chiếu, kết luận, ảnh đính kèm).

### 5. Phân hệ Dược phẩm & Nhà thuốc
23. `medicine_categories`: Phân nhóm dược lý (Kháng sinh, Giảm đau, Tim mạch, Dạ dày...).
24. `suppliers`: Nhà cung cấp thuốc & vật tư y tế.
25. `medicines`: Danh mục thuốc (tên thương mại, hoạt chất, dạng bào chế, đường dùng, giá bán).
26. `medicine_batches`: Quản lý kho theo số lô và hạn sử dụng (FEFO).
27. `stock_transactions`: Lịch sử xuất/nhập/hủy kho thuốc.
28. `prescriptions`: Đơn thuốc do Bác sĩ kê.
29. `prescription_items`: Chi tiết thuốc trong đơn (liều lượng sáng/trưa/chiều/tối, số lượng, cách uống).
30. `dispensations`: Phiếu cấp phát thuốc do Dược sĩ phụ trách.

### 6. Phân hệ Viện phí & Thu ngân
31. `invoices`: Hóa đơn viện phí tổng hợp (tiền khám + cận lâm sàng + tiền thuốc, trừ bảo hiểm BHYT).
32. `invoice_items`: Chi tiết từng dòng mục trong hóa đơn.
33. `payments`: Lịch sử giao dịch thanh toán (Tiền mặt, Thẻ POS, VNPAY-QR, MoMo).

---

## ⚡ Hướng Dẫn Cài Đặt Vào MySQL

### Cách 1: Chạy bằng dòng lệnh MySQL CLI
Mở PowerShell hoặc Command Prompt và chạy:
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < database/init_database.sql
```
*(Nhập mật khẩu root của bạn khi được hỏi)*

### Cách 2: Sử dụng MySQL Workbench / DBeaver / Navicat
1. Mở phần mềm quản lý cơ sở dữ liệu (MySQL Workbench hoặc DBeaver).
2. Mở file: `e:\UngDung\clinic-management\clinic-management\database\init_database.sql`.
3. Bấm **Execute (F5)** để tự động tạo database `clinic_db` và nạp toàn bộ dữ liệu mẫu ban đầu.
