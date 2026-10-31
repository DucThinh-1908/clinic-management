import React from 'react'
import { Link } from 'react-router-dom'
import { DOCTORS } from '../data/mockData'

interface AboutPageProps {
  onOpenAppointment: () => void
}

export const AboutPage: React.FC<AboutPageProps> = ({ onOpenAppointment }) => {
  return (
    <div>
      {/* Page Hero */}
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">Trang chủ</Link>
            <span>/</span>
            <span>Giới thiệu</span>
          </div>
          <h1>Hơn 10 năm phụng sự vì sức khỏe cộng đồng</h1>
          <p>
            CarePlus Clinic cam kết mang đến dịch vụ y tế chuẩn mực, quy tụ các y bác sĩ giàu chuyên môn cùng trang thiết bị hiện đại để bảo vệ nụ cười và sức khỏe của từng gia đình.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <img
              src="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1000&q=80"
              alt="Đội ngũ bác sĩ CarePlus"
              style={{ width: '100%', borderRadius: '18px', boxShadow: '0 16px 36px rgba(17,70,78,.12)', objectFit: 'cover', maxHeight: '440px' }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '-16px',
                right: '24px',
                background: '#fff',
                padding: '16px 22px',
                borderRadius: '14px',
                boxShadow: '0 12px 30px rgba(0,0,0,.12)',
                borderLeft: '5px solid var(--accent)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div style={{ fontSize: '32px', color: 'var(--accent)' }}>★</div>
              <div>
                <strong style={{ fontSize: '20px', display: 'block', color: 'var(--ink)' }}>Chất Lượng Vàng</strong>
                <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>Tiêu chuẩn y khoa hiện đại</span>
              </div>
            </div>
          </div>

          <div>
            <span className="eyebrow">Câu chuyện của chúng tôi</span>
            <h2 style={{ fontSize: 'clamp(26px, 3vw, 36px)', lineHeight: 1.25, margin: '0 0 16px' }}>
              Chăm sóc người bệnh như chính người thân yêu của mình
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '15px', marginBottom: '16px' }}>
              Được thành lập từ năm 2014, CarePlus Clinic khởi đầu từ mong muốn xây dựng một phòng khám đa khoa hiện đại, tiện nghi, nơi mỗi người dân đều nhận được sự chăm sóc y tế chu đáo, không phải chen chúc hay chờ đợi mệt mỏi.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '15px', marginBottom: '24px' }}>
              Trải qua hơn một thập kỷ hoàn thiện và nâng cao chất lượng dịch vụ, chúng tôi đã vinh hạnh trở thành địa chỉ khám chữa bệnh uy tín, điểm tựa tin cậy cho hàng chục ngàn lượt gia đình, cán bộ nhân viên của nhiều tổ chức và doanh nghiệp lớn.
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <Link to="/lien-he" className="btn btn-primary">
                Liên hệ tư vấn ngay
              </Link>
              <Link to="/dich-vu" className="btn btn-outline">
                Xem các gói dịch vụ
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Strip */}
      <div style={{ background: 'var(--soft)', padding: '56px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', textAlign: 'center' }}>
          <div style={{ background: '#fff', padding: '28px 20px', borderRadius: '14px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '40px', fontWeight: 800, color: 'var(--primary)', lineHeight: 1.1, marginBottom: '6px' }}>10+</div>
            <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>Năm phát triển</div>
            <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: 0 }}>Kinh nghiệm y khoa dày dặn và bền vững</p>
          </div>
          <div style={{ background: '#fff', padding: '28px 20px', borderRadius: '14px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '40px', fontWeight: 800, color: 'var(--primary)', lineHeight: 1.1, marginBottom: '6px' }}>50k+</div>
            <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>Bệnh nhân tin chọn</div>
            <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: 0 }}>Được chăm sóc tận tâm mỗi năm</p>
          </div>
          <div style={{ background: '#fff', padding: '28px 20px', borderRadius: '14px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '40px', fontWeight: 800, color: 'var(--primary)', lineHeight: 1.1, marginBottom: '6px' }}>45+</div>
            <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>Bác sĩ & Chuyên gia</div>
            <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: 0 }}>Đào tạo bài bản trong và ngoài nước</p>
          </div>
          <div style={{ background: '#fff', padding: '28px 20px', borderRadius: '14px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '40px', fontWeight: 800, color: 'var(--primary)', lineHeight: 1.1, marginBottom: '6px' }}>99%</div>
            <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>Khách hàng hài lòng</div>
            <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: 0 }}>Đánh giá 5 sao về thái độ phục vụ</p>
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
      <section>
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Định hướng chiến lược</span>
            <h2>Sứ mệnh & Tầm nhìn phát triển</h2>
            <p>CarePlus Clinic lấy y đức làm gốc, lấy công nghệ làm đòn bẩy và lấy sự an tâm của người bệnh làm thước đo thành công.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '26px' }}>
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '34px 28px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--soft)', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: '26px', marginBottom: '20px' }}>
                🎯
              </div>
              <h3 style={{ fontSize: '20px', margin: '0 0 12px' }}>Sứ Mệnh</h3>
              <p style={{ color: 'var(--muted)', fontSize: '14.5px', margin: 0, lineHeight: 1.6 }}>
                Mang đến dịch vụ khám chữa bệnh chất lượng cao với chi phí hợp lý, minh bạch; giúp mọi người dễ dàng tiếp cận y tế chuẩn mực và chủ động bảo vệ sức khỏe cho bản thân và người thân.
              </p>
            </div>

            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '34px 28px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--soft)', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: '26px', marginBottom: '20px' }}>
                🔭
              </div>
              <h3 style={{ fontSize: '20px', margin: '0 0 12px' }}>Tầm Nhìn</h3>
              <p style={{ color: 'var(--muted)', fontSize: '14.5px', margin: 0, lineHeight: 1.6 }}>
                Trở thành hệ thống phòng khám đa khoa kiểu mẫu hàng đầu khu vực, tiên phong ứng dụng công nghệ số trong quản trị y tế và nâng cao trải nghiệm khám chữa bệnh toàn diện.
              </p>
            </div>

            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '34px 28px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--soft)', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: '26px', marginBottom: '20px' }}>
                🤝
              </div>
              <h3 style={{ fontSize: '20px', margin: '0 0 12px' }}>Triết Lý Y Khoa</h3>
              <p style={{ color: 'var(--muted)', fontSize: '14.5px', margin: 0, lineHeight: 1.6 }}>
                "Y đức song hành cùng Chuyên môn". Chúng tôi lắng nghe người bệnh bằng sự thấu hiểu chân thành, chẩn đoán chính xác và đưa ra phác đồ điều trị an toàn, tiết kiệm và tối ưu nhất.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section style={{ background: '#fafefe' }}>
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Kim chỉ nam hoạt động</span>
            <h2>4 Giá trị cốt lõi</h2>
            <p>Những nguyên tắc vàng dẫn dắt từng hành động và quyết định của mỗi thành viên tại CarePlus.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '24px 20px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>❤️</div>
              <h4 style={{ margin: '0 0 8px', fontSize: '17px', color: 'var(--primary-dark)' }}>Tận Tâm (Compassion)</h4>
              <p style={{ fontSize: '13.5px', color: 'var(--muted)', margin: 0 }}>Xem bệnh nhân như người thân ruột thịt, ân cần chăm sóc trong từng chi tiết nhỏ.</p>
            </div>

            <div style={{ background: '#fff', borderRadius: '14px', padding: '24px 20px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>⭐</div>
              <h4 style={{ margin: '0 0 8px', fontSize: '17px', color: 'var(--primary-dark)' }}>Chuyên Môn (Excellence)</h4>
              <p style={{ fontSize: '13.5px', color: 'var(--muted)', margin: 0 }}>Bác sĩ trình độ cao, liên tục cập nhật phác đồ điều trị và kiến thức y khoa thế giới.</p>
            </div>

            <div style={{ background: '#fff', borderRadius: '14px', padding: '24px 20px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚖️</div>
              <h4 style={{ margin: '0 0 8px', fontSize: '17px', color: 'var(--primary-dark)' }}>Minh Bạch (Integrity)</h4>
              <p style={{ fontSize: '13.5px', color: 'var(--muted)', margin: 0 }}>Báo giá rõ ràng, kê đơn đúng chỉ định, không lạm dụng xét nghiệm không cần thiết.</p>
            </div>

            <div style={{ background: '#fff', borderRadius: '14px', padding: '24px 20px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>💡</div>
              <h4 style={{ margin: '0 0 8px', fontSize: '17px', color: 'var(--primary-dark)' }}>Đổi Mới (Innovation)</h4>
              <p style={{ fontSize: '13.5px', color: 'var(--muted)', margin: 0 }}>Số hóa hồ sơ bệnh án, ứng dụng máy móc thế hệ mới rút ngắn thời gian chờ đợi.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Facilities & Medical Technology */}
      <section>
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Hạ tầng y tế hiện đại</span>
            <h2>Cơ sở vật chất & Trang thiết bị y khoa</h2>
            <p>Hệ thống phòng ốc vô trùng, tiện nghi cùng máy móc chẩn đoán hình ảnh nhập khẩu từ Đức, Mỹ, Nhật Bản.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=700&q=80" alt="Phòng xét nghiệm" style={{ width: '100%', height: '210px', objectFit: 'cover' }} />
              <div style={{ padding: '22px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '17.5px' }}>Phòng Xét Nghiệm Tự Động Hóa</h4>
                <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--muted)' }}>
                  Hệ thống máy sinh hóa, huyết học tự động đạt chuẩn an toàn sinh học cấp II, đảm bảo độ chuẩn xác và tốc độ trả kết quả nhanh chóng.
                </p>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <img src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=700&q=80" alt="Chẩn đoán hình ảnh" style={{ width: '100%', height: '210px', objectFit: 'cover' }} />
              <div style={{ padding: '22px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '17.5px' }}>Chẩn Đoán Hình Ảnh Kỹ Thuật Số</h4>
                <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--muted)' }}>
                  Máy siêu âm Doppler màu 4D/5D và hệ thống chụp X-quang kỹ thuật số liều tia thấp, tối đa hóa mức độ an toàn cho người bệnh và phụ nữ mang thai.
                </p>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <img src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=700&q=80" alt="Phòng khám chuyên khoa" style={{ width: '100%', height: '210px', objectFit: 'cover' }} />
              <div style={{ padding: '22px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '17.5px' }}>Không Gian Khám Vô Trùng & Tiện Nghi</h4>
                <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--muted)' }}>
                  Các buồng khám khép kín riêng tư, hệ thống lọc không khí vô trùng và khu vực phòng chờ hiện đại mang lại cảm giác an tâm thư thái.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advisory Board Doctors */}
      <section style={{ background: 'var(--soft)' }}>
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Hội đồng chuyên môn</span>
            <h2>Đội ngũ bác sĩ đầu ngành</h2>
            <p>Các giáo sư, bác sĩ chuyên khoa cấp I, cấp II với nhiều năm kinh nghiệm tại các bệnh viện tuyến đầu.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '22px' }}>
            {DOCTORS.map((doc) => (
              <div key={doc.id} style={{ background: '#fff', borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--border)', textAlign: 'center' }}>
                <img src={doc.image} alt={doc.name} style={{ width: '100%', height: '240px', objectFit: 'cover' }} />
                <div style={{ padding: '18px 16px' }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: '16.5px' }}>{doc.name}</h4>
                  <div style={{ color: 'var(--primary)', fontWeight: 650, fontSize: '13px', marginBottom: '8px' }}>{doc.title}</div>
                  <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: 0 }}>{doc.experience}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5-step Workflow */}
      <section>
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Trải nghiệm thuận tiện</span>
            <h2>Quy trình 5 bước khám bệnh chuyên nghiệp</h2>
            <p>Tối ưu hóa thời gian, không xếp hàng chờ đợi, thông tin được bảo mật tuyệt đối.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {[
              { step: '1', title: 'Đăng Ký & Tiếp Đón', desc: 'Tiếp đón niềm nở, ưu tiên bệnh nhân đặt lịch hẹn trước.' },
              { step: '2', title: 'Khám Lâm Sàng', desc: 'Bác sĩ chuyên khoa thăm khám kỹ lưỡng, lắng nghe triệu chứng.' },
              { step: '3', title: 'Cận Lâm Sàng', desc: 'Xét nghiệm, siêu âm, chụp X-quang theo chỉ định chuyên môn.' },
              { step: '4', title: 'Tư Vấn Phác Đồ', desc: 'Đọc kết quả chi tiết, giải thích bệnh học và tư vấn điều trị.' },
              { step: '5', title: 'Cấp Thuốc & Chăm Sóc', desc: 'Nhận thuốc tại quầy chuẩn GPP và hỗ trợ theo dõi sau khám.' },
            ].map((st) => (
              <div key={st.step} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontWeight: 800, display: 'grid', placeItems: 'center', margin: '0 auto 12px', fontSize: '16px' }}>
                  {st.step}
                </div>
                <h4 style={{ margin: '0 0 8px', fontSize: '15px' }}>{st.title}</h4>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--muted)' }}>{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section style={{ padding: '0 0 76px' }}>
        <div className="container">
          <div style={{ background: 'linear-gradient(110deg, var(--primary-dark), var(--primary))', borderRadius: '18px', color: '#fff', padding: '42px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '25px', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: '0 0 8px', fontSize: '28px' }}>Hãy để CarePlus chăm sóc sức khỏe của bạn!</h2>
              <p style={{ margin: 0, color: '#d7f0ef', fontSize: '15px' }}>
                Đăng ký lịch khám ngay hôm nay để nhận tư vấn miễn phí và ưu đãi đặc quyền.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn btn-light" onClick={onOpenAppointment}>
                Đặt lịch hẹn ngay
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
