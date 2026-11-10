import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './X6Intro.css';

gsap.registerPlugin(ScrollTrigger);

// Đường dẫn route tới thiết bị Fujifilm XS10 trong cơ sở dữ liệu
const XS10_DEVICE_ROUTE = '/camera/fujifilm-xs10-twe';

const XS10Intro = () => {
  const containerRef = useRef(null);

  useGSAP(() => {
    // Đặt trạng thái ban đầu của các item
    gsap.set('.xs10-anim-item', { opacity: 0, y: 35 });

    const animIn = () => {
      gsap.to('.xs10-anim-item', {
        opacity: 1,
        y: 0,
        duration: 0.65,
        stagger: 0.14,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    const animOut = () => {
      gsap.to('.xs10-anim-item', {
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

    if (st.isActive) {
      animIn();
    }

    const img = containerRef.current?.querySelector('img');
    if (img && !img.complete) {
      const handleLoad = () => ScrollTrigger.refresh();
      img.addEventListener('load', handleLoad, { once: true });
      return () => img.removeEventListener('load', handleLoad);
    }
  }, { scope: containerRef });

  return (
    <section
      id="fujifilm-xs10"
      className="x6-intro-section x6-intro-section--dark"
      aria-label="Giới thiệu Fujifilm XS10"
      ref={containerRef}
    >
      <div className="x6-intro-wrapper">
        <picture className="x6-intro-artwork">
          {/* Khung dọc WebP cho thiết bị di động (mobile ~68KB) */}
          <source
            type="image/webp"
            media="(max-width: 767px)"
            srcSet="/assets/image/JOURNEY/xs10-mobile.webp"
            width="1080"
            height="1920"
          />
          {/* Khung dọc PNG dự phòng */}
          <source
            media="(max-width: 767px)"
            srcSet="/assets/image/JOURNEY/XS10%20(2).png"
            width="1080"
            height="1920"
          />
          {/* Khung ngang WebP cho tablet và desktop (~59KB) */}
          <source
            type="image/webp"
            srcSet="/assets/image/JOURNEY/xs10-desktop.webp"
            width="1920"
            height="1080"
          />
          {/* Khung ngang PNG dự phòng */}
          <img
            src="/assets/image/JOURNEY/XS10.png"
            alt="Fujifilm XS10 - 1..2..3 cười lên. XS10 bắt trọn vẹn tại ChinHaStore"
            width="1920"
            height="1080"
            loading="lazy"
            decoding="async"
          />
        </picture>

        {/* Khối chữ giới thiệu và nút CTA: Đặt ở đầu 1/3 chiều dọc */}
        <div className="x6-intro-content x6-intro-content--top-third x6-intro-content--dark">
          <h2 className="x6-intro-title xs10-anim-item">
            Fujifilm XS10
          </h2>
          <p className="x6-intro-subtitle xs10-anim-item">
            1..2..3 cười lên. XS10 bắt trọn vẹn
          </p>
          <p className="x6-intro-desc xs10-anim-item">
            Tìm hiểu ngay mẫu máy ảnh hot trend của nhà Fujifilm ngay hôm nay
          </p>
          <Link to={XS10_DEVICE_ROUTE} className="x6-intro-btn x6-intro-btn--light xs10-anim-item">
            TÌM HIỂU NGAY
          </Link>
        </div>
      </div>
    </section>
  );
};

export default XS10Intro;

