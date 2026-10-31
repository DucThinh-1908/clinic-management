import type { Doctor, ServicePackage, Branch, FaqItem } from '../types'

export const DOCTORS: Doctor[] = [
  {
    id: 'doc-1',
    name: 'BS.CKII Nguyễn Minh An',
    title: 'Giám đốc Y khoa - Cố vấn chuyên môn',
    specialty: 'Khoa Nội tổng quát',
    experience: '25 năm kinh nghiệm, nguyên Phó khoa Bệnh viện Bạch Mai',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=700&q=80',
    bio: 'Chuyên sâu chẩn đoán và điều trị các bệnh lý tim mạch, đái tháo đường, rối loạn chuyển hóa và tiêu hóa.'
  },
  {
    id: 'doc-2',
    name: 'ThS. BS Trần Thu Hà',
    title: 'Trưởng Khoa Nhi',
    specialty: 'Khoa Nhi & Tiêm chủng',
    experience: '18 năm kinh nghiệm tại Bệnh viện Nhi Trung Ương',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=700&q=80',
    bio: 'Nhiệt tình, chu đáo, chuyên thăm khám và tư vấn phát triển thể chất, miễn dịch và dinh dưỡng trẻ em.'
  },
  {
    id: 'doc-3',
    name: 'BS.CKI Lê Hoàng Nam',
    title: 'Trưởng Khoa Tai Mũi Họng',
    specialty: 'Khoa Tai - Mũi - Họng',
    experience: '15 năm kinh nghiệm chuyên sâu nội soi vi phẫu',
    image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=700&q=80',
    bio: 'Thực hiện thuần thục nội soi chẩn đoán sớm ung thư vòm họng, viêm xoang và các phẫu thuật ống tai.'
  },
  {
    id: 'doc-4',
    name: 'BS.CKII Phạm Phương Thảo',
    title: 'Trưởng Khoa Sản - Phụ Khoa',
    specialty: 'Khoa Sản - Phụ khoa',
    experience: '20 năm kinh nghiệm tại Bệnh viện Phụ sản Hà Nội',
    image: 'https://images.unsplash.com/photo-1591604021695-0c69b7c05981?auto=format&fit=crop&w=700&q=80',
    bio: 'Chuyên gia theo dõi thai kỳ nguy cơ cao, tầm soát ung thư cổ tử cung và điều trị vô sinh hiếm muộn.'
  }
]

export const SERVICES: ServicePackage[] = [
  {
    id: 'srv-1',
    title: 'Khám Sức Khỏe Tổng Quát Cơ Bản',
    category: 'general',
    price: '1.450.000 đ',
    unit: '/ người',
    badge: 'Phổ biến nhất',
    description: 'Đánh giá tổng quát chức năng gan, thận, tim mạch, tầm soát tiểu đường và các chỉ số máu cơ bản.',
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=700&q=80',
    features: [
      'Khám nội tổng quát cùng Bác sĩ Chuyên khoa',
      'Tổng phân tích tế bào máu ngoại vi 24 thông số',
      'Định lượng Glucose, Acid Uric, Men gan ALT, AST, GGT',
      'Kiểm tra chức năng thận Ure, Creatinine',
      'Siêu âm màu ổ bụng tổng quát 4D',
      'Chụp X-quang tim phổi thẳng kỹ thuật số'
    ]
  },
  {
    id: 'srv-2',
    title: 'Gói Tầm Soát Sức Khỏe VIP Toàn Diện',
    category: 'general',
    price: '3.200.000 đ',
    unit: '/ người',
    badge: 'Chuyên sâu VIP',
    description: 'Gói khám toàn diện bao gồm tầm soát ung thư sớm, kiểm tra mạch vành tim và nội soi đường tiêu hóa.',
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=700&q=80',
    features: [
      'Bao gồm toàn bộ danh mục của gói Cơ bản',
      'Tầm soát dấu ấn ung thư gan (AFP), phổi (CEA, Cyfra 21-1), tụy (CA 19-9)',
      'Điện tâm đồ (ECG) & Siêu âm tim Doppler màu',
      'Nội soi dạ dày - đại tràng ống mềm không đau',
      'Tư vấn trực tiếp phác đồ sức khỏe cùng Bác sĩ CKII'
    ]
  },
  {
    id: 'srv-3',
    title: 'Khám Sức Khỏe & Dinh Dưỡng Cho Bé',
    category: 'pediatric',
    price: '850.000 đ',
    unit: '/ bé',
    badge: 'Dành cho trẻ em',
    description: 'Đánh giá chỉ số phát triển chiều cao, cân nặng, tư vấn vi chất và kiểm tra hệ hô hấp nhi khoa.',
    image: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=700&q=80',
    features: [
      'Bác sĩ chuyên khoa Nhi thăm khám nhẹ nhàng, chu đáo',
      'Kiểm tra thị lực, thính lực và phát triển thể chất',
      'Nội soi Tai - Mũi - Họng ống mềm vô khuẩn',
      'Xét nghiệm vi chất dinh dưỡng (Canxi, Kẽm, Sắt, Vitamin D)',
      'Tư vấn thực đơn dinh dưỡng cá nhân hóa cho từng độ tuổi'
    ]
  },
  {
    id: 'srv-4',
    title: 'Tầm Soát Phụ Khoa & Ung Thư Cổ Tử Cung',
    category: 'women',
    price: '1.850.000 đ',
    unit: '/ người',
    badge: 'Phụ nữ & Mẹ bầu',
    description: 'Chăm sóc sức khỏe phụ nữ hiện đại, phát hiện sớm nguy cơ viêm nhiễm và bệnh lý phụ khoa tiềm ẩn.',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=700&q=80',
    features: [
      'Khám phụ khoa cùng Nữ bác sĩ chuyên khoa cấp II',
      'Xét nghiệm HPV định tuýp và tế bào cổ tử cung ThinPrep',
      'Siêu âm đầu dò tử cung - phần phụ độ phân giải cao',
      'Siêu âm tuyến vú tầm soát khối u tuyến vú sớm',
      'Tư vấn sức khỏe sinh sản, tiền hôn nhân và mãn kinh'
    ]
  },
  {
    id: 'srv-5',
    title: 'Khám Bệnh & Lấy Mẫu Xét Nghiệm Tại Nhà',
    category: 'home',
    price: '500.000 đ',
    unit: '/ lần khám',
    badge: 'Tiện lợi tận nơi',
    description: 'Giải pháp lý tưởng cho người lớn tuổi, người vận động khó khăn hoặc gia đình bận rộn.',
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=700&q=80',
    features: [
      'Điều dưỡng và bác sĩ đến tận nhà đúng theo khung giờ hẹn',
      'Lấy mẫu máu, nước tiểu chuẩn quy trình vô trùng nghiêm ngặt',
      'Mẫu được bảo quản nhiệt độ chuẩn mang về trung tâm xét nghiệm',
      'Trả kết quả online qua App/Zalo sau 2 - 4 giờ',
      'Bác sĩ gọi điện tư vấn phân tích phác đồ điều trị tận tình'
    ]
  },
  {
    id: 'srv-6',
    title: 'Khám Sức Khỏe Định Kỳ Doanh Nghiệp',
    category: 'corporate',
    price: 'Liên hệ báo giá',
    unit: '/ đoàn',
    badge: 'Theo Thông tư BYT',
    description: 'Thiết kế gói khám phù hợp theo đặc thù công việc và ngân sách của từng tổ chức, doanh nghiệp.',
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=700&q=80',
    features: [
      'Khám trực tiếp tại phòng khám hoặc lưu động tại công ty',
      'Xe chụp X-quang kỹ thuật số lưu động hiện đại',
      'Lập hồ sơ quản lý sức khỏe người lao động điện tử',
      'Phân loại sức khỏe và tư vấn bệnh nghề nghiệp',
      'Chính sách chiết khấu linh hoạt và xuất hóa đơn VAT đầy đủ'
    ]
  }
]

export const BRANCHES: Branch[] = [
  {
    id: 'branch-1',
    name: 'Phòng khám Đa khoa CarePlus Đống Đa (Trụ sở chính)',
    tag: 'Cơ sở 1 - Trụ sở chính',
    address: '123 Đường Sức Khỏe, Phường Trung Tự, Quận Đống Đa, Hà Nội',
    phone: '(024) 3822 1122 - Hotline: 1900 1234',
    parking: 'Bãi đỗ xe ô tô và xe máy rộng rãi ngay trước sảnh, bảo vệ trực 24/7 (Miễn phí).'
  },
  {
    id: 'branch-2',
    name: 'Phòng khám Đa khoa CarePlus Cầu Giấy',
    tag: 'Cơ sở 2',
    address: 'Tòa nhà CareTower, 456 Đại lộ Hạnh Phúc, Quận Cầu Giấy, Hà Nội',
    phone: '(024) 3999 5566',
    parking: 'Hầm gửi xe B1 & B2 hiện đại, có thang máy và lối đi riêng cho xe lăn người bệnh.'
  },
  {
    id: 'branch-3',
    name: 'Phòng khám Đa khoa CarePlus Hai Bà Trưng',
    tag: 'Cơ sở 3',
    address: '789 Đường Thống Nhất, Phường Bạch Mai, Quận Hai Bà Trưng, Hà Nội',
    phone: '(024) 3777 8899',
    parking: 'Sân đỗ xe thoáng mát, vị trí thuận lợi đối diện trạm xe buýt tuyến chính.'
  }
]

export const FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'Tôi có cần đặt lịch hẹn trước khi đến phòng khám không?',
    answer: 'CarePlus luôn sẵn sàng tiếp đón bệnh nhân đến trực tiếp. Tuy nhiên, việc đặt lịch hẹn trước sẽ giúp quý khách được ưu tiên vào phòng khám đúng giờ, được chủ động lựa chọn bác sĩ mong muốn và rút ngắn thời gian làm thủ tục tại quầy.'
  },
  {
    id: 'faq-2',
    question: 'Phòng khám có áp dụng Bảo hiểm Y tế (BHYT) và bảo lãnh viện phí không?',
    answer: 'Có. CarePlus áp dụng chính sách thông tuyến khám chữa bệnh BHYT trên toàn quốc theo quy định của Bộ Y tế. Đồng thời, phòng khám liên kết bảo lãnh viện phí trực tiếp với hơn 25 công ty bảo hiểm tư nhân như Bảo Việt, Manulife, Prudential, PTI, PJICO,...'
  },
  {
    id: 'faq-3',
    question: 'Tôi cần chuẩn bị những gì trước khi đi khám sức khỏe tổng quát?',
    answer: 'Quý khách nên nhịn ăn sáng ít nhất 6-8 tiếng (chỉ uống nước lọc) để đảm bảo độ chính xác cho các chỉ số xét nghiệm máu và đường huyết; uống nhiều nước và nhịn tiểu trước khi siêu âm ổ bụng; mang theo đơn thuốc hoặc hồ sơ bệnh án cũ nếu có.'
  },
  {
    id: 'faq-4',
    question: 'Kết quả xét nghiệm bao lâu có và tôi có xem online được không?',
    answer: 'Hầu hết các xét nghiệm cơ bản đều có kết quả sau 45 - 90 phút. Tất cả kết quả chẩn đoán hình ảnh và đơn thuốc điện tử đều được đồng bộ lên hệ thống tra cứu online và gửi thông báo qua tin nhắn/email của quý khách.'
  }
]
