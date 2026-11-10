import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './X6Intro.css';

gsap.registerPlugin(ScrollTrigger);

// Đường dẫn route tới thiết bị Luna Ultra (mặc định trang đặt lịch)
const LUNA_DEVICE_ROUTE = '/dat-lich';

const LunaUltraIntro = () => {
  const containerRef = useRef(null);

  useGSAP(() => {
    // Đặt trạng thái ban đầu của các item
    gsap.set('.luna-anim-item', { opacity: 0, y: 35 });

    const animIn = () => {
      gsap.to('.luna-anim-item', {
        opacity: 1,
        y: 0,
        duration: 0.65,
        stagger: 0.16,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    const animOut = () => {
      gsap.to('.luna-anim-item', {
        opacity: 0,
        y: 35,
        duration: 0.35,
        ease: 'power2.in',
        overwrite: 'auto',
      });
    };

    const st = ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top 82%',
      end: 'bottom 18%',
      onEnter: animIn,
      onEnterBack: animIn,
      onLeave: animOut,
      onLeaveBack: animOut,
      fastScrollEnd: true,
      preventOverlaps: true,
    });

    // Nếu người dùng refresh trang khi đang dừng ở vị trí section này
    if (st.isActive) {
      animIn();
    }

    // Refresh lại tọa độ trigger sau khi hình ảnh tải xong để tránh lệch layout
    const img = containerRef.current?.querySelector('img');
    if (img && !img.complete) {
      img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
    }
  }, { scope: containerRef });

  return (
    <section
      id="luna-ultra"
      className="x6-intro-section"
      aria-label="Giới thiệu Insta360 Luna Ultra"
      ref={containerRef}
    >
      <div className="x6-intro-wrapper">
        <picture className="x6-intro-artwork">
          {/* Khung dọc cho thiết bị di động (mobile) */}
          <source
            media="(max-width: 767px)"
            srcSet="/assets/image/JOURNEY/Luna%20ultra%20(2).png"
            width="5581"
            height="7893"
          />
          {/* Khung ngang cho tablet và desktop */}
          <img
            src="/assets/image/JOURNEY/Luna%20ultra.png"
            alt="Insta360 Luna Ultra - Vững chắc, không rung lắc tại ChinHaStore"
            width="4269"
            height="2400"
            loading="lazy"
            decoding="async"
          />
        </picture>

        {/* Khối chữ giới thiệu và nút CTA: Căn giữa theo chiều ngang, đặt phía trên */}
        <div className="x6-intro-content x6-intro-content--top-center">
          <h2 className="x6-intro-title luna-anim-item">
            Vững chắc, không rung lắc
          </h2>
          <p className="x6-intro-desc luna-anim-item">
            Đón chào thành viên mới của nhà ChinHaStore, Insta360 Luna Ultra đã có mặt trên kệ hàng. Giữ khung hình của bạn luôn ổn định
          </p>
          <Link to={LUNA_DEVICE_ROUTE} className="x6-intro-btn luna-anim-item">
            ĐẶT THUÊ NGAY
          </Link>
        </div>
      </div>
    </section>
  );
};

export default LunaUltraIntro;
