import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { DOCTORS, SERVICES } from '../data/mockData'
import type { AuthUser } from '../types'

interface HomePageProps {
  onOpenAppointment: (specialty?: string) => void
  currentUser?: AuthUser | null
}

export const HomePage: React.FC<HomePageProps> = ({
  onOpenAppointment,
  currentUser,
}) => {
  const [quickForm, setQuickForm] = useState({
    fullName: '',
    phone: '',
    specialty: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [quickSubmitted, setQuickSubmitted] = useState(false)

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setQuickSubmitted(true)
    setTimeout(() => {
      setQuickSubmitted(false)
      setQuickForm({
        fullName: '',
        phone: '',
        specialty: '',
        date: new Date().toISOString().split('T')[0],
      })
    }, 3000)
  }

  useEffect(() => {
    if (currentUser) {
      setQuickForm((prev) => ({
        ...prev,
        fullName: prev.fullName || currentUser.username,
        phone: prev.phone || currentUser.phone || '',
      }))
    }
  }, [currentUser])

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(100deg, rgba(5,70,78,.9), rgba(8,127,140,.6)), url("https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1900&q=85") center/cover',
          color: '#fff',
          padding: '60px 0',
        }}
      >
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'center' }}>
          <div>
            <span className="eyebrow" style={{ color: '#c5f4ef' }}>Chăm sóc sức khỏe toàn diện</span>
            <h1 style={{ fontSize: 'clamp(32px, 4.2vw, 52px)', lineHeight: 1.15, margin: '0 0 20px', maxWidth: '640px' }}>
              Chăm sóc tận tâm.<br />Khỏe mạnh mỗi ngày.
            </h1>
            <p style={{ color: '#e4f4f4', maxWidth: '560px', margin: '0 0 28px', fontSize: '16.5px' }}>
              Đội ngũ bác sĩ giàu kinh nghiệm cùng hệ thống dịch vụ y tế chuẩn mực quốc tế, đồng hành với bạn và gia đình trên hành trình sống khỏe.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
              <button className="btn btn-primary" onClick={() => onOpenAppointment()}>
                Đặt lịch khám ngay
              </button>
              <Link className="btn btn-light" to="/dich-vu">
                Khám phá dịch vụ
              </Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '28px', color: '#e6f6f5', fontSize: '13.5px' }}>
              <span>●</span>
              <span><strong>Đội ngũ chuyên môn</strong> · Quy trình thuận tiện · Tư vấn chu đáo</span>
            </div>
          </div>

          {/* Quick Appointment Card */}
          <div style={{ background: '#fff', color: 'var(--ink)', borderRadius: '18px', padding: '30px', boxShadow: '0 18px 50px rgba(0,0,0,.2)', maxWidth: '440px', justifySelf: 'end', width: '100%' }}>
            {!currentUser ? (
              <div style={{ textAlign: 'center', padding: '24px 8px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(8,127,140,.12)',
                    color: 'var(--primary)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '24px',
                    margin: '0 auto 16px',
                    fontWeight: 700,
                  }}
                >
                  !
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: '20px' }}>Yêu cầu đăng nhập</h3>
                <p style={{ margin: '0 0 20px', fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6 }}>
                  Quý khách cần đăng nhập tài khoản vào hệ thống trước khi đăng ký lịch khám bệnh trực tuyến.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Link
                    className="btn btn-primary"
                    to="/dang-nhap"
                    style={{ display: 'inline-block', width: '100%', textAlign: 'center', boxSizing: 'border-box' }}
                  >
                    Đăng nhập ngay
                  </Link>
                  <Link
                    className="btn btn-outline"
                    to="/dang-ky"
                    style={{ display: 'inline-block', width: '100%', textAlign: 'center', boxSizing: 'border-box' }}
                  >
                    Đăng ký tài khoản mới
                  </Link>
                </div>
              </div>
            ) : quickSubmitted ? (
              <div style={{ textAlign: 'center', padding: '24px 8px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#e8f5e9', color: '#2e7d32', display: 'grid', placeItems: 'center', fontSize: '28px', margin: '0 auto 14px' }}>
                  ✓
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: '20px' }}>Đã ghi nhận yêu cầu!</h3>
                <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--muted)' }}>
                  Phòng khám sẽ gọi lại cho bạn trong ít phút để hoàn tất lịch hẹn.
                </p>
              </div>
            ) : (
              <form onSubmit={handleQuickSubmit}>
                <h2 style={{ margin: '0 0 6px', fontSize: '22px' }}>Đặt lịch khám nhanh</h2>
                <p style={{ color: 'var(--muted)', fontSize: '13.5px', margin: '0 0 18px' }}>
                  Để lại thông tin, lễ tân sẽ liên hệ xác nhận trong 15 phút.
                </p>

                <div className="field">
                  <label htmlFor="h_fullname">Họ và tên *</label>
                  <input
                    id="h_fullname"
                    type="text"
                    placeholder="Nhập họ tên của bạn"
                    required
                    value={quickForm.fullName}
                    onChange={(e) => setQuickForm({ ...quickForm, fullName: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label htmlFor="h_phone">Số điện thoại *</label>
                  <input
                    id="h_phone"
                    type="tel"
                    placeholder="Ví dụ: 09xx xxx xxx"
                    required
                    value={quickForm.phone}
                    onChange={(e) => setQuickForm({ ...quickForm, phone: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label htmlFor="h_specialty">Chuyên khoa khám *</label>
                  <select
                    id="h_specialty"
                    required
                    value={quickForm.specialty}
                    onChange={(e) => setQuickForm({ ...quickForm, specialty: e.target.value })}
                  >
                    <option value="">Chọn chuyên khoa</option>
                    <option value="Khoa Nội">Khoa Nội</option>
                    <option value="Khoa Nhi">Khoa Nhi</option>
                    <option value="Răng - Hàm - Mặt">Răng - Hàm - Mặt</option>
                    <option value="Sản - Phụ khoa">Sản - Phụ khoa</option>
                    <option value="Tai - Mũi - Họng">Tai - Mũi - Họng</option>
                    <option value="Xét nghiệm">Xét nghiệm & Siêu âm</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="h_date">Ngày khám mong muốn *</label>
                  <input
                    id="h_date"
                    type="date"
                    required
                    value={quickForm.date}
                    onChange={(e) => setQuickForm({ ...quickForm, date: e.target.value })}
                  />
                </div>

                <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '6px' }}>
                  Gửi yêu cầu đặt lịch
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '24px 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--soft)', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: '20px' }}>
              ♙
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '14.5px' }}>Bác sĩ tận tâm</strong>
              <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>Tư vấn chu đáo, kinh nghiệm dày dặn</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--soft)', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: '20px' }}>
              ✚
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '14.5px' }}>Dịch vụ toàn diện</strong>
              <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>Đa dạng chuyên khoa khám & xét nghiệm</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--soft)', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: '20px' }}>
              ◷
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '14.5px' }}>Đặt lịch thuận tiện</strong>
              <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>Chủ động thời gian, không chờ đợi</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--soft)', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: '20px' }}>
              ♡
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '14.5px' }}>Lấy người bệnh làm trung tâm</strong>
              <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>Minh bạch chi phí, bảo mật thông tin</span>
            </div>
          </div>
        </div>
      </div>



      {/* Featured Services */}
      <section style={{ background: '#f6fbfb' }}>
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Dịch vụ nổi bật</span>
            <h2>Chăm sóc sức khỏe cho cả gia đình</h2>
            <p>Các gói khám và dịch vụ được tổ chức khoa học, thuận tiện cho việc thăm khám định kỳ.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {SERVICES.slice(0, 3).map((s) => (
              <div key={s.id} style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                <img src={s.image} alt={s.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>
                    {s.price} <small style={{ fontSize: '12px', color: 'var(--muted)' }}>{s.unit}</small>
                  </div>
                  <h3 style={{ margin: '0 0 10px', fontSize: '18px' }}>{s.title}</h3>
                  <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--muted)', flexGrow: 1 }}>{s.description}</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => onOpenAppointment(s.title)}>
                      Đặt gói khám
                    </button>
                    <Link to="/dich-vu" className="btn btn-outline btn-sm">
                      Chi tiết →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <Link to="/dich-vu" className="btn btn-outline">
              Xem tất cả dịch vụ & bảng giá →
            </Link>
          </div>
        </div>
      </section>

      {/* About Preview Section */}
      <section>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <img
              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1000&q=80"
              alt="Bác sĩ CarePlus"
              style={{ width: '100%', borderRadius: '18px', boxShadow: '0 16px 36px rgba(17,70,78,.1)', objectFit: 'cover', maxHeight: '420px' }}
            />
            <div style={{ position: 'absolute', bottom: '-16px', right: '16px', background: 'var(--accent)', color: '#fff', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 10px 24px rgba(0,0,0,.15)' }}>
              <strong style={{ display: 'block', fontSize: '26px', lineHeight: 1.1 }}>10+</strong>
              <span style={{ fontSize: '12px' }}>Năm đồng hành vì sức khỏe</span>
            </div>
          </div>

          <div>
            <span className="eyebrow">Về CarePlus Clinic</span>
            <h2 style={{ fontSize: 'clamp(26px, 3vw, 36px)', lineHeight: 1.25, margin: '0 0 16px' }}>
              Đặt sức khỏe và sự an tâm của bạn lên hàng đầu
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '15px', marginBottom: '18px' }}>
              CarePlus Clinic hướng tới trải nghiệm chăm sóc y tế thân thiện, minh bạch và thuận tiện. Chúng tôi chú trọng chất lượng chuyên môn của từng bác sĩ, sự tận tâm trong tư vấn và quy trình phục vụ rõ ràng.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px' }}>
              <li style={{ margin: '8px 0', fontWeight: 600, fontSize: '14px', display: 'flex', gap: '8px' }}>
                <span style={{ color: 'var(--primary)' }}>✓</span> Đội ngũ bác sĩ và nhân viên y tế chuyên môn cao, nhiệt tình
              </li>
              <li style={{ margin: '8px 0', fontWeight: 600, fontSize: '14px', display: 'flex', gap: '8px' }}>
                <span style={{ color: 'var(--primary)' }}>✓</span> Quy trình tiếp nhận, lấy số và trả kết quả số hóa nhanh chóng
              </li>
              <li style={{ margin: '8px 0', fontWeight: 600, fontSize: '14px', display: 'flex', gap: '8px' }}>
                <span style={{ color: 'var(--primary)' }}>✓</span> Không gian khám bệnh sạch sẽ, vô trùng chuẩn y tế
              </li>
            </ul>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <Link to="/gioi-thieu" className="btn btn-primary">
                Tìm hiểu thêm về phòng khám
              </Link>
              <Link to="/lien-he" className="btn btn-outline">
                Liên hệ chúng tôi
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section style={{ background: 'var(--soft)' }}>
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Danh mục chuyên khoa</span>
            <h2>Lựa chọn chuyên khoa phù hợp</h2>
            <p>Tra cứu nhanh các chuyên khoa và đăng ký lịch khám trực tuyến với bác sĩ chuyên khoa.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
            {[
              { emoji: '🩺', name: 'Khoa Nội' },
              { emoji: '🧒', name: 'Khoa Nhi' },
              { emoji: '🦷', name: 'Răng - Hàm - Mặt' },
              { emoji: '👂', name: 'Tai - Mũi - Họng' },
              { emoji: '🤰', name: 'Sản - Phụ khoa' },
              { emoji: '🦴', name: 'Cơ xương khớp' },
              { emoji: '🔬', name: 'Xét nghiệm' },
              { emoji: '💉', name: 'Tiêm chủng' },
            ].map((sp, idx) => (
              <div
                key={idx}
                onClick={() => onOpenAppointment(sp.name)}
                style={{ background: '#fff', padding: '20px 12px', textAlign: 'center', borderRadius: '12px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
              >
                <div style={{ fontSize: '30px', marginBottom: '8px' }}>{sp.emoji}</div>
                <h3 style={{ margin: 0, fontSize: '14.5px', color: 'var(--ink)' }}>{sp.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Doctors Section */}
      <section>
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Đội ngũ chuyên môn</span>
            <h2>Đồng hành cùng những người tận tâm</h2>
            <p>Quy tụ các bác sĩ chuyên khoa đầu ngành với nhiều năm kinh nghiệm tại các bệnh viện trung ương.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            {DOCTORS.map((doc) => (
              <div key={doc.id} style={{ border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', background: '#fff' }}>
                <img src={doc.image} alt={doc.name} style={{ width: '100%', height: '240px', objectFit: 'cover' }} />
                <div style={{ padding: '20px' }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: '17px' }}>{doc.name}</h3>
                  <div style={{ color: 'var(--primary)', fontWeight: 650, fontSize: '13px', marginBottom: '8px' }}>{doc.title}</div>
                  <p style={{ margin: 0, color: 'var(--muted)', fontSize: '12.5px' }}>{doc.experience}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section style={{ padding: '0 0 76px' }}>
        <div className="container">
          <div style={{ background: 'linear-gradient(110deg, var(--primary-dark), var(--primary))', borderRadius: '18px', color: '#fff', padding: '42px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '25px', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: '0 0 8px', fontSize: '28px' }}>Chủ động chăm sóc sức khỏe hôm nay!</h2>
              <p style={{ margin: 0, color: '#d7f0ef', fontSize: '15px' }}>
                Đặt lịch hẹn trước để nhận ưu đãi và được sắp xếp thời gian khám tối ưu nhất.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn btn-light" onClick={() => onOpenAppointment()}>
                Đặt lịch khám ngay
              </button>
              <Link to="/lien-he" className="btn btn-primary" style={{ border: '2px solid #fff' }}>
                Liên hệ chúng tôi
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
