import React from 'react';
import { Link } from 'react-router-dom';
import './X6Intro.css';

// Đường dẫn route tới thiết bị Insta360 X6 trong cơ sở dữ liệu
const X6_DEVICE_ROUTE = '/camera/insta360-x6-jls';

const X6Intro = () => {
  return (
    <section id="how-it-works" className="x6-intro-section" aria-label="Giới thiệu Insta360 X6">
      <div className="x6-intro-wrapper">
        <picture className="x6-intro-artwork">
          {/* Khung dọc WebP cho thiết bị di động (mobile ~20KB) */}
          <source
            type="image/webp"
            media="(max-width: 767px)"
            srcSet="/assets/image/JOURNEY/x6-intro-mobile.webp"
            width="1080"
            height="1527"
          />
          {/* Khung dọc PNG dự phòng */}
          <source
            media="(max-width: 767px)"
            srcSet="/assets/image/JOURNEY/X6%20introduct%20(2).png"
            width="1080"
            height="1527"
          />
          {/* Khung ngang WebP cho tablet và desktop (~23KB) */}
          <source
            type="image/webp"
            srcSet="/assets/image/JOURNEY/x6-intro-desktop.webp"
            width="1920"
            height="1079"
          />
          {/* Khung ngang PNG dự phòng */}
          <img
            src="/assets/image/JOURNEY/X6%20introduct.png"
            alt="Insta360 X6 - Lưu trữ 360 độ tại ChinHaStore"
            width="1920"
            height="1079"
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
