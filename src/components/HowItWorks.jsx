import React, { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './HowItWorks.css';

gsap.registerPlugin(ScrollTrigger);

const HowItWorks = () => {
  const containerRef = useRef(null);

  useGSAP(() => {
    // Reveal animation for items
    const items = gsap.utils.toArray('.timeline-item');
    
    items.forEach((item, i) => {
      gsap.fromTo(item, 
        { 
          opacity: 0, 
          y: 60,
          x: item.classList.contains('left') ? -50 : 50 
        },
        {
          scrollTrigger: {
            trigger: item,
            start: "top 85%",
            toggleActions: "play none none reverse"
          },
          opacity: 1,
          y: 0,
          x: 0,
          duration: 0.8,
          ease: "power3.out"
        }
      );
    });

    // Draw line
    gsap.fromTo('.timeline-line-inner',
      { height: '0%' },
      {
        height: '100%',
        ease: 'none',
        scrollTrigger: {
          trigger: '.timeline-container',
          start: "top 50%",
          end: "bottom 60%",
          scrub: true
        }
      }
    );
  }, { scope: containerRef });

  return (
    <section id="how-it-works" className="how-it-works dark-section" ref={containerRef}>
      <div className="container">
        
        <div className="section-header dark-header">
          <h2 className="section-title">
            Nền tảng cho thuê máy ảnh số <span className="highlight-number">#1</span>
          </h2>
          <p className="section-subtitle">
            Không cần chờ đợi reply tin nhắn, kiểm tra lịch trống và đặt trực tiếp ngay website
          </p>
        </div>

        <div className="timeline-container">
          <div className="timeline-line">
            <div className="timeline-line-inner"></div>
          </div>

          {/* Step 1 */}
          <div className="timeline-item left">
            <div className="timeline-content">
              <h3>Lựa chọn thiết bị & thời gian nhận</h3>
              <p>Chọn máy bạn yêu thích, chọn ngày bạn muốn nhận và chọn phụ kiện bạn muốn thuê cùng</p>
            </div>
            <div className="timeline-connector"></div>
            <div className="timeline-circle">1</div>
          </div>

          {/* Step 2 */}
          <div className="timeline-item right">
            <div className="timeline-circle">2</div>
            <div className="timeline-connector"></div>
            <div className="timeline-content">
              <h3>Xác nhận thông tin thanh toán</h3>
              <p>Cung cấp phương thức liên lạc và chọn hình thức nhận/trả máy tiện lợi nhất cho bạn. Mọi dữ liệu đều được bảo mật</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="timeline-item left">
            <div className="timeline-content">
              <h3>Nhận máy và trải nghiệm</h3>
              <p>Hệ thống sẽ xuất biên nhận để thanh toán cọc giữ lịch, sau khi xác nhận thanh toán, bạn chỉ việc nhận máy và tận hưởng khoảng khắc riêng bạn</p>
            </div>
            <div className="timeline-connector"></div>
            <div className="timeline-circle">3</div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default HowItWorks;
