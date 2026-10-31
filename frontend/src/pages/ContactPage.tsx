import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { BRANCHES, FAQS } from '../data/mockData'
import type { ContactFormData } from '../types'

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: '',
    phone: '',
    email: '',
    subject: '',
    branch: 'cs1',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [openFaq, setOpenFaq] = useState<string | null>('faq-1')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    // Scroll smoothly to alert
    window.scrollTo({ top: 380, behavior: 'smooth' })
  }

  return (
    <div>
      {/* Page Hero */}
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">Trang chủ</Link>
            <span>/</span>
            <span>Liên hệ</span>
          </div>
          <h1>Liên hệ & Tư vấn chăm sóc sức khỏe</h1>
          <p>
            Đội ngũ chuyên viên y tế và bác sĩ tại CarePlus luôn sẵn sàng lắng nghe mọi băn khoăn, tư vấn lộ trình khám và tiếp nhận ý kiến đóng góp của bạn.
          </p>
        </div>
      </section>

      {/* Quick Info Cards Strip */}
      <div className="container" style={{ marginTop: '-36px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '26px 20px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--soft)', color: 'var(--primary)', fontSize: '24px', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
              📞
            </div>
            <h4 style={{ margin: '0 0 6px', fontSize: '16.5px' }}>Tổng đài tư vấn</h4>
            <p style={{ margin: '0 0 6px', fontSize: '13px', color: 'var(--muted)' }}>Hỗ trợ đặt lịch & giải đáp thắc mắc</p>
            <strong style={{ color: 'var(--primary)', fontSize: '16px', display: 'block' }}>1900 1234</strong>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Cước phí tiêu chuẩn 1.000đ/phút</span>
          </div>

          <div style={{ background: '#fff', borderRadius: '14px', padding: '26px 20px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--soft)', color: '#d32f2f', fontSize: '24px', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
              🚨
            </div>
            <h4 style={{ margin: '0 0 6px', fontSize: '16.5px' }}>Cấp cứu 24/7</h4>
            <p style={{ margin: '0 0 6px', fontSize: '13px', color: 'var(--muted)' }}>Hỗ trợ y tế khẩn cấp mọi thời điểm</p>
            <strong style={{ color: '#d32f2f', fontSize: '16px', display: 'block' }}>0988 123 456</strong>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Đội ngũ trực cấp cứu thường trực</span>
          </div>

          <div style={{ background: '#fff', borderRadius: '14px', padding: '26px 20px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--soft)', color: 'var(--primary)', fontSize: '24px', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
              ✉️
            </div>
            <h4 style={{ margin: '0 0 6px', fontSize: '16.5px' }}>Hòm thư điện tử</h4>
            <p style={{ margin: '0 0 6px', fontSize: '13px', color: 'var(--muted)' }}>Giải đáp hồ sơ & hợp tác y khoa</p>
            <strong style={{ color: 'var(--primary)', fontSize: '15px', display: 'block' }}>contact@careplusclinic.vn</strong>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Phản hồi trong vòng 24 giờ</span>
          </div>

          <div style={{ background: '#fff', borderRadius: '14px', padding: '26px 20px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--soft)', color: 'var(--primary)', fontSize: '24px', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
              🕒
            </div>
            <h4 style={{ margin: '0 0 6px', fontSize: '16.5px' }}>Thời gian làm việc</h4>
            <p style={{ margin: '0 0 6px', fontSize: '13px', color: 'var(--muted)' }}>Mở cửa liên tục cả tuần</p>
            <strong style={{ color: 'var(--primary)', fontSize: '16px', display: 'block' }}>07:00 – 20:00</strong>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Kể cả Thứ 7, CN và ngày lễ</span>
          </div>
        </div>
      </div>

      {/* Main Content (Form & Branches) */}
      <section>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '40px', alignItems: 'start' }}>
          {/* Contact Form */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '18px', padding: '36px', boxShadow: 'var(--shadow-sm)' }}>
            {submitted && (
              <div style={{ padding: '16px 20px', borderRadius: '10px', background: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9', marginBottom: '22px', fontSize: '14.5px', lineHeight: 1.5 }}>
                ✓ Cảm ơn quý khách <strong>{formData.fullName}</strong> ({formData.phone})! Tin nhắn của bạn đã được gửi tới bộ phận tiếp nhận. Đội ngũ bác sĩ và nhân viên tư vấn sẽ liên hệ lại trong thời gian sớm nhất.
              </div>
            )}

            <h3 style={{ fontSize: '24px', margin: '0 0 8px' }}>Gửi câu hỏi hoặc phản hồi</h3>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '0 0 24px' }}>
              Vui lòng điền thông tin bên dưới, chuyên viên của chúng tôi sẽ phản hồi chu đáo qua điện thoại hoặc email.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="field">
                  <label htmlFor="cp_fullname">Họ và tên của bạn *</label>
                  <input
                    id="cp_fullname"
                    type="text"
                    placeholder="Ví dụ: Nguyễn Văn A"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="cp_phone">Số điện thoại liên hệ *</label>
                  <input
                    id="cp_phone"
                    type="tel"
                    placeholder="Ví dụ: 0912 345 678"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="field">
                  <label htmlFor="cp_email">Địa chỉ Email</label>
                  <input
                    id="cp_email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="cp_subject">Chủ đề liên hệ *</label>
                  <select
                    id="cp_subject"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  >
                    <option value="">-- Chọn chủ đề --</option>
                    <option value="tu-van-kham">Tư vấn lịch khám & chuyên khoa</option>
                    <option value="kham-tong-quat">Báo giá gói khám sức khỏe tổng quát</option>
                    <option value="kham-doanh-nghiep">Khám đoàn thể / doanh nghiệp</option>
                    <option value="bao-hiem">Tư vấn bảo lãnh viện phí / BHYT</option>
                    <option value="gop-y">Đóng góp ý kiến & phản ánh chất lượng</option>
                    <option value="hop-tac">Hợp tác chuyên môn & tuyển dụng</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="cp_branch">Cơ sở phòng khám mong muốn liên hệ</label>
                <select
                  id="cp_branch"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                >
                  <option value="cs1">Cơ sở 1 (Trụ sở chính) - Đống Đa, Hà Nội</option>
                  <option value="cs2">Cơ sở 2 - Cầu Giấy, Hà Nội</option>
                  <option value="cs3">Cơ sở 3 - Hai Bà Trưng, Hà Nội</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="cp_message">Nội dung tin nhắn / Thắc mắc cụ thể *</label>
                <textarea
                  id="cp_message"
                  placeholder="Mô tả cụ thể thắc mắc, triệu chứng hoặc nhu cầu tư vấn..."
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }}>
                Gửi thông tin liên hệ →
              </button>
            </form>
          </div>

          {/* Branches Information */}
          <div style={{ background: 'var(--soft)', borderRadius: '18px', padding: '32px 28px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '21px', margin: '0 0 18px', color: 'var(--primary-dark)' }}>
              Hệ thống cơ sở phòng khám CarePlus
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {BRANCHES.map((b) => (
                <div key={b.id} style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
                  <span style={{ display: 'inline-block', padding: '4px 10px', background: 'var(--soft)', color: 'var(--primary)', borderRadius: '20px', fontSize: '11.5px', fontWeight: 800, marginBottom: '8px', textTransform: 'uppercase' }}>
                    {b.tag}
                  </span>
                  <h4 style={{ margin: '0 0 8px', fontSize: '16px' }}>{b.name}</h4>
                  <p style={{ margin: '0 0 6px', fontSize: '13.5px', color: 'var(--muted)', display: 'flex', gap: '8px' }}>
                    <span>📍</span> {b.address}
                  </p>
                  <p style={{ margin: '0 0 6px', fontSize: '13.5px', color: 'var(--muted)', display: 'flex', gap: '8px' }}>
                    <span>☎</span> {b.phone}
                  </p>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', display: 'flex', gap: '8px' }}>
                    <span>🅿</span> {b.parking}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Map */}
      <section style={{ background: '#fafefe', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Bản đồ vị trí</span>
            <h2>Chỉ đường tới trụ sở CarePlus Clinic</h2>
            <p>Vị trí thuận lợi tại trung tâm Hà Nội, dễ dàng di chuyển bằng xe cá nhân hoặc phương tiện công cộng.</p>
          </div>

          <div style={{ borderRadius: '16px', overflow: 'hidden', height: '420px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.636657805128!2d105.82772591476288!3d21.00719878601053!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ac812975949d%3A0xa6be26b86fbfe417!2zxJDhu5FuZyDEkGEsIEjDoCBO4buZaSwgVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1655000000000!5m2!1svi!2s"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Bản đồ chỉ đường CarePlus"
            />
          </div>
        </div>
      </section>

      {/* FAQs Accordion */}
      <section>
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Giải đáp thắc mắc</span>
            <h2>Câu hỏi thường gặp khi đến khám</h2>
            <p>Những thông tin hữu ích giúp quý khách an tâm và chuẩn bị chu đáo trước buổi khám.</p>
          </div>

          <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {FAQS.map((faq) => {
              const isOpen = openFaq === faq.id
              return (
                <div key={faq.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                    style={{
                      width: '100%',
                      padding: '18px 22px',
                      background: 'none',
                      border: 0,
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      fontSize: '15.5px',
                      fontWeight: 700,
                      color: isOpen ? 'var(--primary)' : 'var(--ink)',
                    }}
                  >
                    <span>{faq.question}</span>
                    <span style={{ fontSize: '20px', marginLeft: '12px' }}>{isOpen ? '−' : '+'}</span>
                  </button>

                  {isOpen && (
                    <div style={{ padding: '0 22px 18px', fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, borderTop: '1px solid #f0f7f7', paddingTop: '14px' }}>
                      {faq.answer}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
