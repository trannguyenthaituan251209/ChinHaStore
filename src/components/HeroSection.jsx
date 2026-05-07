import { Link } from 'react-router-dom';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <section className="hero">
      <div className="container hero-container">
        <h1 className="hero-title">
          Thuê Máy Ảnh Buôn Ma Thuột <br /> Dịch Vụ Chuyên Nghiệp
        </h1>
        <p className="hero-subtitle">
          Dịch vụ cho thuê máy ảnh, máy quay chuyên nghiệp tại Buôn Ma Thuột (BMT) với giá tốt nhất<br />
          thị trường. Hỗ trợ HSSV thuê không cần cọc thế chấp. Giá thuê chỉ từ 180.000VND/Ngày.
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
