import React from 'react';
import { Link } from 'react-router-dom';
import './X6Intro.css';

// Đường dẫn route tới thiết bị X6 (có thể thay đổi slug hoặc ID cụ thể theo database)
const X6_DEVICE_ROUTE = '/camera/insta360-x6';

const X6Intro = () => {
  return (
    <section id="how-it-works" className="x6-intro-section" aria-label="Giới thiệu Insta360 X6">
      <div className="x6-intro-wrapper">
        <picture className="x6-intro-artwork">
          {/* Khung dọc cho thiết bị di động (mobile) */}
          <source
            media="(max-width: 767px)"
            srcSet="/assets/image/JOURNEY/X6%20introduct%20(2).png"
            width="5581"
            height="7893"
          />
          {/* Khung ngang cho tablet và desktop */}
          <img
            src="/assets/image/JOURNEY/X6%20introduct.png"
            alt="Insta360 X6 - Lưu trữ 360 độ tại ChinHaStore"
            width="4269"
            height="2400"
            loading="lazy"
            decoding="async"
          />
        </picture>

        {/* Khối chữ giới thiệu và nút CTA */}
        <div className="x6-intro-content">
          <h1 className="x6-intro-title">
            Lưu trữ <span className="highlight-360">360</span> độ
          </h1>
          <p className="x6-intro-desc">
            Insta360 X6 đã có mặt tại ChinHaStore. Thuê ngay<br className="desktop-br" />
            để không bỏ lỡ bất kỳ góc nhìn nào trong chuyến<br className="desktop-br" />
            phiêu lưu của bạn
          </p>
          <Link to={X6_DEVICE_ROUTE} className="x6-intro-btn">
            TÌM HIỂU NGAY
          </Link>
        </div>
      </div>
    </section>
  );
};

export default X6Intro;
