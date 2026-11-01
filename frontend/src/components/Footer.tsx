import React from 'react'
import { Link } from 'react-router-dom'

export const Footer: React.FC = () => {
  return (
    <footer style={{ background: '#12383e', color: '#d6e8e9', padding: '56px 0 24px', marginTop: 'auto' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '32px' }}>
          {/* Col 1 */}
          <div>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 800, color: '#fff', fontSize: '20px' }}>
              <span style={{ width: '40px', height: '40px', display: 'grid', placeItems: 'center', borderRadius: '12px', background: 'var(--primary)', color: '#fff', fontSize: '24px', fontWeight: 700 }}>
                ✚
              </span>
              <span>
                CarePlus Clinic
                <small style={{ display: 'block', fontSize: '10px', color: '#bdd2d4', fontWeight: 600, letterSpacing: '1.4px' }}>
                  PHÒNG KHÁM ĐA KHOA
                </small>
              </span>
            </Link>
            <p style={{ marginTop: '18px', fontSize: '13.5px', color: '#bdd2d4', lineHeight: 1.6 }}>
              Hệ thống phòng khám đa khoa tiêu chuẩn quốc tế, đồng hành chăm sóc sức khỏe toàn diện và tận tâm cho bạn cùng gia đình.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h3 style={{ color: '#fff', fontSize: '16px', margin: '0 0 16px' }}>Liên kết nhanh</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13.5px' }}>
              <li style={{ margin: '10px 0' }}><Link to="/" style={{ color: '#bdd2d4' }}>Trang chủ</Link></li>
              <li style={{ margin: '10px 0' }}><Link to="/gioi-thieu" style={{ color: '#bdd2d4' }}>Về CarePlus Clinic</Link></li>
              <li style={{ margin: '10px 0' }}><Link to="/dich-vu" style={{ color: '#bdd2d4' }}>Dịch vụ & Bảng giá gói khám</Link></li>
              <li style={{ margin: '10px 0' }}><Link to="/lien-he" style={{ color: '#bdd2d4' }}>Liên hệ & Đặt lịch hẹn</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h3 style={{ color: '#fff', fontSize: '16px', margin: '0 0 16px' }}>Giờ phục vụ</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13.5px', color: '#bdd2d4' }}>
              <li style={{ margin: '10px 0' }}>Thứ 2 – Thứ 6: <strong>07:00 – 20:00</strong></li>
              <li style={{ margin: '10px 0' }}>Thứ 7 – Chủ nhật: <strong>07:00 – 20:00</strong></li>
              <li style={{ margin: '10px 0' }}>Khoa Cấp cứu: <strong>Trực 24/7</strong></li>
              <li style={{ margin: '10px 0' }}>Lấy mẫu xét nghiệm tại nhà: <strong>Từ 06:00</strong></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h3 style={{ color: '#fff', fontSize: '16px', margin: '0 0 16px' }}>Thông tin liên hệ</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13.5px', color: '#bdd2d4' }}>
              <li style={{ margin: '10px 0' }}> Trụ sở: 123 Đường Sức Khỏe, Đống Đa, Hà Nội</li>
              <li style={{ margin: '10px 0' }}> Tổng đài: <strong>1900 1234</strong> (24/7)</li>
              <li style={{ margin: '10px 0' }}> Cấp cứu: <strong>0338 715 287</strong></li>
              <li style={{ margin: '10px 0' }}>✉ Email: ducthinhph23@gmai.com</li>
            </ul>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,.12)', marginTop: '36px', paddingTop: '20px', textAlign: 'center', fontSize: '12px', color: '#9fbabc' }}>
          © 2026 CarePlus Clinic. Xây dựng trên nền tảng React + TypeScript + Vite.
        </div>
      </div>
    </footer>
  )
}
