import { Link } from 'react-router-dom';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <section className="hero">
      <div className="container hero-container">
        <h1 className="hero-title">
          Dịch vụ cho thuê máy <br /> ảnh chất lượng cao
        </h1>
        <p className="hero-subtitle">
          Dịch vụ cho thuê máy ảnh - máy quay chuyên nghiệp, chất lượng cao và giá cả tốt nhất<br />
          thị trường ChinHaStore. Hỗ trợ học sinh - sinh viên thuê không cần cọc thế chấp. Giá<br />
          thuê chỉ từ 180.000VND/Ngày
        </p>
      </div>
      <div className="hero-image-wrapper">
        <img
          src="/assets/image/hero_section.png"
          alt="Các dòng máy ảnh tại ChinHaStore"
          className="hero-image"
        />
      </div>
    </section>
  );
};

export default HeroSection;
