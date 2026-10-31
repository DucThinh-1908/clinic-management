# CarePlus Clinic - Frontend (React + TypeScript + Vite)

Giao diện người dùng hiện đại cho hệ thống phòng khám đa khoa **CarePlus Clinic**, xây dựng bằng **React 19**, **TypeScript**, **Vite** và **React Router DOM**.

---

## 🚀 Hướng dẫn khởi chạy nhanh

### 1. Cài đặt dependencies (đã hoàn thành sẵn)
```bash
cd frontend
npm install
```

### 2. Khởi chạy Development Server (Vite)
```bash
npm run dev
```
Trình duyệt sẽ mở tại: `http://localhost:3000`

### 3. Build Production
```bash
npm run build
```
Thư mục xuất bản: `dist/`

---

## 🗺️ Các trang & Định tuyến (Routes)

| Đường dẫn (URL) | Trang hiển thị | Mô tả chi tiết |
|---|---|---|
| `/` hoặc `/trang-chu` | **Trang chủ (HomePage)** | Banner khám bệnh, form đặt lịch nhanh, dịch vụ nổi bật, chuyên khoa, bác sĩ, cam kết |
| `/gioi-thieu` hoặc `/about` | **Giới thiệu (AboutPage)** | Lịch sử 10+ năm, Sứ mệnh - Tầm nhìn, 4 Giá trị cốt lõi, CSVC & Công nghệ y khoa, Hội đồng chuyên môn, Quy trình 5 bước |
| `/lien-he` hoặc `/contact` | **Liên hệ (ContactPage)** | Hotline 24/7, Form gửi liên hệ/phản hồi trực tuyến, 3 chi nhánh cơ sở, Google Maps tương tác, FAQ hỏi đáp |
| `/dich-vu` hoặc `/services` | **Dịch vụ & Gói khám (ServicesPage)** | Bộ lọc theo nhóm khám, chi tiết 6 gói khám tiêu chuẩn, bảng giá khám lẻ niêm yết |

---

## 📁 Cấu trúc thư mục

```
frontend/
├── src/
│   ├── components/            # Các thành phần tái sử dụng
│   │   ├── Topbar.tsx         # Thanh thông tin đầu trang (hotline, giờ làm việc, cấp cứu)
│   │   ├── Navbar.tsx         # Menu điều hướng chính (desktop & mobile menu)
│   │   ├── Footer.tsx         # Chân trang đầy đủ thông tin liên hệ và giờ trực
│   │   └── AppointmentModal.tsx # Popup đăng ký đặt lịch khám từ mọi trang
│   ├── pages/                 # Các trang chính
│   │   ├── HomePage.tsx       # Trang chủ
│   │   ├── AboutPage.tsx      # Trang Giới thiệu chi tiết
│   │   ├── ContactPage.tsx    # Trang Liên hệ chi tiết
│   │   └── ServicesPage.tsx   # Trang Dịch vụ & Gói khám chi tiết
│   ├── data/
│   │   └── mockData.ts        # Dữ liệu mẫu (bác sĩ, dịch vụ, chi nhánh, FAQs)
│   ├── types/
│   │   └── index.ts           # Định nghĩa kiểu dữ liệu TypeScript
│   ├── App.tsx                # Thiết lập Router và Layout tổng thể
│   ├── App.css                # Layout styling
│   ├── index.css              # Hệ thống CSS Design System chuẩn y tế
│   └── main.tsx               # Entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts             # Cấu hình cổng 3000 và proxy tới Spring Boot (/api -> 8080)
```

---

## 🔗 Tích hợp với Backend Spring Boot

File `vite.config.ts` đã được cấu hình sẵn proxy để chuyển tiếp các request `/api/*` tới backend Spring Boot tại `http://localhost:8080`:

```ts
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
  },
}
```
