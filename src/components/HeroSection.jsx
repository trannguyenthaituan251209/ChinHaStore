import { Link } from 'react-router-dom';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <section className="hero" aria-labelledby="home-hero-title">
      <div className="hero-wrapper">
        <picture className="hero-artwork">
          <source
            media="(max-width: 767px)"
            srcSet="/assets/image/hero-section-vertical.png"
            width="1250"
            height="2188"
          />
          <img
            src="/assets/image/hero-section-horizontal.png"
            alt="Minh họa ChinHaStore trên máy tính và điện thoại cùng mascot ong"
            width="3375"
            height="2032"
            fetchPriority="high"
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
