# CarePlus Clinic - Hệ Thống Quản Lý Phòng Khám Đa Khoa

Hệ thống quản lý phòng khám đa khoa tiêu chuẩn cao, được thiết kế theo kiến trúc hiện đại phân tách độc lập giữa **Frontend (React + TypeScript + Vite)**, **Backend (Spring Boot + REST API)** và **Cơ sở dữ liệu quan hệ chuẩn hóa 3NF (MySQL 8.0+)** phục vụ chuyên biệt cho **9 tác nhân**.

---

## 🏗️ Kiến Trúc Tổng Thể

```
clinic-management/
├── frontend/                  # Ứng dụng Single Page Application (SPA)
│   ├── src/
│   │   ├── components/        # Topbar, Navbar, Footer, AppointmentModal
│   │   ├── pages/             # HomePage, AboutPage, ContactPage, ServicesPage
│   │   ├── types/             # Định nghĩa kiểu dữ liệu TypeScript
│   │   └── data/              # Mock data bác sĩ, dịch vụ, chi nhánh, FAQs
│   └── vite.config.ts         # Port 3000, proxy /api -> Spring Boot 8080
│
├── database/                  # Thiết kế cơ sở dữ liệu MySQL chuẩn 3NF
│   ├── schema.sql             # 32 bảng chuẩn hóa cho 9 tác nhân
│   ├── seed_data.sql          # Dữ liệu mẫu khởi tạo
│   ├── init_database.sql      # Script chạy 1 bước toàn bộ schema & seed
│   └── README.md              # Tài liệu phân tích ma trận 9 vai trò
│
└── src/                       # Backend Spring Boot REST API
    ├── main/java/com/clinic/
    │   ├── ClinicManagementApplication.java
    │   └── controller/WebController.java
    └── test/java/com/clinic/
        └── ClinicManagementApplicationTests.java
```

---

## 👥 9 Tác Nhân Trong Hệ Thống

1. **`patient` (Bệnh nhân):** Cổng bệnh nhân tra cứu hồ sơ, lịch sử khám, đơn thuốc, đặt lịch khám.
2. **`receptionist` (Lễ tân):** Tiếp đón, quản lý lịch hẹn, tra cứu và mở hồ sơ, cấp số thứ tự phòng khám.
3. **`doctor` (Bác sĩ):** Khám lâm sàng, chẩn đoán ICD-10, chỉ định cận lâm sàng, kê đơn thuốc, hẹn tái khám.
4. **`nurse` (Điều dưỡng):** Tiếp nhận tại phòng khám, đo các chỉ số sinh hiệu (HA, nhịp tim, SpO2, BMI).
5. **`technician` (Kỹ thuật viên):** Thực hiện xét nghiệm, siêu âm, X-quang, cập nhật trị số và ảnh kết quả.
6. **`pharmacist` (Dược sĩ):** Quản lý kho thuốc theo số lô và hạn dùng (FEFO), cấp phát thuốc theo đơn.
7. **`cashier` (Thu ngân):** Lập hóa đơn viện phí tổng hợp, trừ BHYT, thu tiền đa phương thức (tiền mặt, thẻ, QR).
8. **`manager` (Quản lý phòng khám):** Quản lý nhân sự, cơ cấu khoa phòng, phân lịch trực, bảng giá dịch vụ.
9. **`admin` (Quản trị hệ thống):** Quản lý tài khoản, phân quyền chi tiết, cấu hình và nhật ký audit log.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### 1. Cơ sở dữ liệu (MySQL 8.0+)
Chạy script khởi tạo tự động trong thư mục `database/`:
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < database/init_database.sql
```

### 2. Frontend (React + TypeScript + Vite)
```powershell
cd frontend
npm install
npm run dev
```
Truy cập giao diện tại: **`http://localhost:3000`**

### 3. Backend (Spring Boot)
```powershell
./mvnw spring-boot:run
```
API phục vụ tại: **`http://localhost:8080`**
