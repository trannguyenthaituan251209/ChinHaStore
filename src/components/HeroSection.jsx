import { Link } from 'react-router-dom';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <section className="hero" aria-labelledby="home-hero-title">
      <div className="hero-wrapper">
        <picture className="hero-artwork">
          {/* Mobile WebP (siêu nhẹ ~81KB) */}
          <source
            type="image/webp"
            media="(max-width: 767px)"
            srcSet="/assets/image/hero-section-vertical.webp"
            width="1080"
            height="1890"
          />
          {/* Mobile PNG dự phòng */}
          <source
            media="(max-width: 767px)"
            srcSet="/assets/image/hero-section-vertical.png"
            width="1250"
            height="2188"
          />
          {/* Desktop WebP (siêu nhẹ ~68KB) */}
          <source
            type="image/webp"
            srcSet="/assets/image/hero-section-horizontal.webp"
            width="1920"
            height="1156"
          />
          {/* Desktop PNG dự phòng */}
          <img
            src="/assets/image/hero-section-horizontal.png"
            alt="Minh họa ChinHaStore trên máy tính và điện thoại cùng mascot ong"
            width="1920"
            height="1156"
            fetchPriority="high"
            decoding="async"
          />
        </picture>

        <div className="hero-content">
          <h1 id="home-hero-title" className="hero-title">
            Thuê máy ảnh ở Buôn Ma Thuột
          </h1>
          <p className="hero-description">
            Chọn máy cho chuyến đi hay buổi chụp. Xem giá và đặt lịch dễ dàng cùng ChinHaStore.
          </p>

          <div className="hero-cta-group">
            <button
              onClick={() => document.getElementById('needs-recommendation')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-hero-cta"
            >
              Gợi ý máy cho bạn
            </button>
            <Link to="/all-camera" className="btn-hero-secondary">
              Kho máy &amp; Bảng giá
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
