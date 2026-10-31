import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { SERVICES } from '../data/mockData'

interface ServicesPageProps {
  onOpenAppointment: (packageTitle?: string) => void
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ onOpenAppointment }) => {
  const [filter, setFilter] = useState<string>('all')

  const filteredServices = filter === 'all'
    ? SERVICES
    : SERVICES.filter((s) => s.category === filter)

  return (
    <div>
      {/* Page Hero */}
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">Trang chủ</Link>
            <span>/</span>
            <span>Dịch vụ & Gói khám</span>
          </div>
          <h1>Danh mục Dịch vụ Y tế & Gói khám toàn diện</h1>
          <p>
            Thiết kế khoa học theo từng lứa tuổi và nhu cầu thực tế, giúp bạn và người thân chủ động phát hiện sớm mầm bệnh, bảo vệ sức khỏe bền vững.
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '16px 0', position: 'sticky', top: '80px', zIndex: 90 }}>
        <div className="container" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'all', label: 'Tất cả dịch vụ' },
            { id: 'general', label: 'Khám tổng quát' },
            { id: 'pediatric', label: 'Khám Nhi & Tiêm chủng' },
            { id: 'women', label: 'Sản - Phụ khoa' },
            { id: 'home', label: 'Khám tại nhà' },
            { id: 'corporate', label: 'Khám doanh nghiệp' },
          ].map((tab) => {
            const isActive = filter === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '24px',
                  border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                  background: isActive ? 'var(--primary)' : '#fff',
                  color: isActive ? '#fff' : 'var(--ink)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Services Grid */}
      <section>
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Gói khám tiêu chuẩn CarePlus</span>
            <h2>Bảng danh mục các gói khám chuyên khoa</h2>
            <p>Mức giá minh bạch, trọn gói, cam kết không phát sinh chi phí ẩn trong quá trình khám.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '28px' }}>
            {filteredServices.map((pkg) => (
              <article
                key={pkg.id}
                style={{
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                <div style={{ position: 'relative', height: '190px' }}>
                  {pkg.badge && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '14px',
                        right: '14px',
                        background: 'var(--accent)',
                        color: '#fff',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 750,
                        zIndex: 2,
                      }}
                    >
                      {pkg.badge}
                    </span>
                  )}
                  <img src={pkg.image} alt={pkg.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>
                    {pkg.price} <small style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>{pkg.unit}</small>
                  </div>
                  <h3 style={{ fontSize: '18.5px', margin: '0 0 10px', color: 'var(--ink)' }}>{pkg.title}</h3>
                  <p style={{ fontSize: '14px', color: 'var(--muted)', margin: '0 0 18px' }}>{pkg.description}</p>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', flexGrow: 1 }}>
                    {pkg.features.map((feat, idx) => (
                      <li key={idx} style={{ fontSize: '13.5px', marginBottom: '8px', color: '#435b60', display: 'flex', gap: '8px' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 800 }}>✓</span> {feat}
                      </li>
                    ))}
                  </ul>

                  <button className="btn btn-primary" onClick={() => onOpenAppointment(pkg.title)} style={{ width: '100%' }}>
                    Đăng ký gói khám này →
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Table for Single Services */}
      <section style={{ background: 'var(--soft)' }}>
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Minh bạch viện phí</span>
            <h2>Bảng giá một số dịch vụ khám lẻ phổ biến</h2>
            <p>Áp dụng mức giá niêm yết theo quy định và hỗ trợ trừ thanh toán bảo hiểm y tế nếu đủ điều kiện.</p>
          </div>

          <div style={{ background: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ background: 'var(--primary)', color: '#fff', fontSize: '14.5px' }}>
                    <th style={{ padding: '16px 20px' }}>Tên dịch vụ y tế</th>
                    <th style={{ padding: '16px 20px' }}>Chuyên khoa</th>
                    <th style={{ padding: '16px 20px' }}>Thời gian thực hiện</th>
                    <th style={{ padding: '16px 20px' }}>Giá niêm yết (VNĐ)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Khám Bác sĩ Chuyên khoa (Nội, Nhi, TMH, RHM...)', dept: 'Các chuyên khoa', time: '15 - 30 phút', price: '200.000 đ' },
                    { name: 'Khám Bác sĩ Cấp cao / Cố vấn (BS.CKII, PGS)', dept: 'Hội đồng chuyên môn', time: '20 - 40 phút', price: '350.000 đ' },
                    { name: 'Tổng phân tích tế bào máu tự động (24 thông số)', dept: 'Xét nghiệm huyết học', time: '30 - 45 phút', price: '120.000 đ' },
                    { name: 'Siêu âm Doppler màu ổ bụng tổng quát 4D', dept: 'Chẩn đoán hình ảnh', time: '15 phút', price: '250.000 đ' },
                    { name: 'Chụp X-quang lồng ngực kỹ thuật số (DR)', dept: 'Chẩn đoán hình ảnh', time: '10 - 15 phút', price: '180.000 đ' },
                    { name: 'Nội soi Tai Mũi Họng ống mềm có ghi hình', dept: 'Tai - Mũi - Họng', time: '10 - 15 phút', price: '300.000 đ' },
                    { name: 'Lấy cao răng & đánh bóng 2 hàm sóng siêu âm', dept: 'Răng - Hàm - Mặt', time: '30 phút', price: '250.000 đ' },
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)', fontSize: '14px' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 600 }}>{row.name}</td>
                      <td style={{ padding: '14px 20px', color: 'var(--muted)' }}>{row.dept}</td>
                      <td style={{ padding: '14px 20px', color: 'var(--muted)' }}>{row.time}</td>
                      <td style={{ padding: '14px 20px', fontWeight: 750, color: 'var(--primary-dark)' }}>{row.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
