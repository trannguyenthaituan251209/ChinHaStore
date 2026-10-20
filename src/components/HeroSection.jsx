import { Link } from 'react-router-dom';
import SplitText from './SplitText';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <section className="hero">
      <div className="hero-wrapper">
        {/* Ảnh Desktop */}
        <img 
          src="https://imgh.in/host/p0yk5t" 
          alt="Hero Background Desktop" 
          className="hero-bg hero-desktop" 
          width="4269"
          height="2400"
        />
        
        {/* Ảnh Mobile */}
        <img 
          src="https://imgh.in/host/frbzb3" 
          alt="Hero Background Mobile" 
          className="hero-bg hero-mobile"
          width="3375"
          height="6000"
        />

        {/* Nội dung chữ & Nút bấm */}
        <div className="hero-content">
          <SplitText
            text="Chào mừng bạn đến với ChinHaStore"
            className="hero-welcome"
            delay={30}
            duration={1}
            ease="power3.out"
            splitType="lines"
            from={{ opacity: 0, y: 20 }}
            to={{ opacity: 1, y: 0 }}
            tag="p"
          />
          
          <SplitText
            text="THUÊ MÁY ẢNH TẠI BUÔN MA THUỘT"
            className="hero-title"
            delay={40}
            duration={1.2}
            ease="power3.out"
            splitType="lines"
            from={{ opacity: 0, y: 30 }}
            to={{ opacity: 1, y: 0 }}
            tag="h1"
          />
          
          <SplitText
            text="Xem máy đang có, tham khảo giá thuê theo thời lượng và đặt lịch trực tuyến. Hỗ trợ giao nhận theo khu vực phục vụ tại Đắk Lắk."
            className="hero-description"
            delay={10}
            duration={1}
            ease="power3.out"
            splitType="lines"
            from={{ opacity: 0, y: 15 }}
            to={{ opacity: 1, y: 0 }}
            tag="p"
          />
          
          <div className="hero-cta-group">
            <button 
              onClick={() => document.getElementById('needs-recommendation')?.scrollIntoView({ behavior: 'smooth' })} 
              className="btn-hero-cta"
            >
              Gợi ý máy cho bạn &raquo;
            </button>
            <Link to="/all-camera" className="btn-hero-secondary">
              Kho máy & Bảng giá
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
