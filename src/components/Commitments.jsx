import React from 'react';
import './Commitments.css';

const commitments = [
  {
    title: 'THIẾT BỊ CHUẨN CHỈNH',
    description: '100% máy ảnh và ống kính được vệ sinh, kiểm tra sensor và sạc đầy pin trước khi giao đến tay khách hàng. Đảm bảo trải nghiệm tốt nhất cho bạn.'
  },
  {
    title: 'HỖ TRỢ TẬN TÂM 24/7',
    description: 'Đội ngũ kỹ thuật luôn sẵn sàng hỗ trợ setup thông số và giải đáp thắc mắc của bạn qua Facebook/Instagram bất cứ khi nào bạn cần.'
  },
  {
    title: 'MINH BẠCH & TIN CẬY',
    description: 'Hợp đồng rõ ràng, thủ tục nhanh gọn. Cam kết không phát sinh chi phí ẩn, hoàn trả cọc ngay lập tức khi chúng tôi nhận lại máy.'
  }
];

const Commitments = () => {
  return (
    <section className="commitments-section">
      <div className="container">
        
        <div className="section-header">
          <h2 className="section-title">CAM KẾT CỦA CHINHA STORE</h2>
          <div className="section-divider"></div>
        </div>

        <div className="commitments-grid">
          {commitments.map((item, index) => (
            <div key={index} className="commitment-card">
              <h3 className="commitment-title">{item.title}</h3>
              <p className="commitment-desc">{item.description}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Commitments;
