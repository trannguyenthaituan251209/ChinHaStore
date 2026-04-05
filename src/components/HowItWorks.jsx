import React from 'react';
import './HowItWorks.css';

const steps = [
  {
    number: '01',
    title: 'Chọn máy & Xem giá',
    description: 'Duyệt qua danh mục hơn 40+ loại máy và ống kính. Xem giá thuê chi tiết theo từng mốc thời gian (6h/1 ngày/3 ngày...).'
  },
  {
    number: '02',
    title: 'Check lịch & Đặt online',
    description: 'Bạn hoàn toàn có thể check lịch và booking thông qua các nền tảng mạng xã hội như Facebook hoặc Instagram. Hơn cả thế, bạn có thể dễ dàng đặt lịch ngay tại Website.'
  },
  {
    number: '03',
    title: 'Giao nhận & Hợp đồng',
    description: 'Đến trực tiếp store hoặc chọn giao hàng tận nơi. Thủ tục ký gửi giấy tờ/cọc diễn ra trong vòng 5 phút, minh bạch và nhanh chóng.'
  },
  {
    number: '04',
    title: 'Sáng tạo & Hoàn trả',
    description: 'Thỏa sức ghi lại những khoảnh khắc đẹp nhất. Sau khi hoàn thành, hãy trả máy và nhận lại ngay 100% tiền cọc/giấy tờ của bạn.'
  }
];

const HowItWorks = () => {
  return (
    <section className="how-it-works">
      <div className="container">
        
        <div className="section-header">
          <h2 className="section-title">QUY TRÌNH THUÊ MÁY</h2>
          <p className="section-subtitle">Tối giản - Nhanh chóng - Tin cậy. Chúng tôi tự động hóa mọi quy trình để bạn tập trung vào sáng tạo.</p>
        </div>

        <div className="steps-grid">
          {steps.map((step, index) => (
            <div key={index} className="step-card">
              <div className="step-number">{step.number}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
              {index < steps.length - 1 && <div className="step-connector"></div>}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;
