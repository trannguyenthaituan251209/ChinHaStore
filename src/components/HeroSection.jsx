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
          src="https://imgh.in/host/iwn2cf" 
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
            text="HÃY ĐỂ CHÚNG TÔI GIÚP BẠN VIẾT LÊN"
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
            text="Câu chuyện"
            className="hero-story-text"
            delay={80}
            duration={1.5}
            ease="power3.out"
            splitType="lines"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            tag="div"
          />
          
          <SplitText
            text="Nền tảng cho thuê máy ảnh chuyên nghiệp, nhanh chóng và tiện lợi. ChinHaStore, hỗ trợ ưu đãi học sinh sinh viên. Giá tốt nhất thị trường."
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
