import React from 'react'

export const Topbar: React.FC = () => {
  return (
    <div style={{ background: '#075e68', color: '#eaf8f8', fontSize: '13px' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', padding: '8px 0', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span> Giờ mở cửa: Thứ 2 – Chủ nhật: <strong>07:00 – 20:00</strong></span>
          <span style={{ opacity: 0.8 }}>|</span>
          <span> Cấp cứu trực: <strong>24/7</strong></span>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span> Tổng đài hỗ trợ: <strong>1900 1234</strong></span>
          <span style={{ opacity: 0.8 }}>|</span>
          <span> 123 Đường Sức Khỏe, Đống Đa, Hà Nội</span>
        </div>
      </div>
    </div>
  )
}
