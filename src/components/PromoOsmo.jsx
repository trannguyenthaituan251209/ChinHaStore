import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Volume2, VolumeX } from 'lucide-react';
import './PromoOsmo.css';

const PromoOsmo = () => {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  const toggleMute = (e) => {
    e.preventDefault();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="promo-osmo-wrapper">
      <div className="promo-osmo-relative">
        {/* Ảnh Desktop */}
        <img src="/assets/image/promo_osmo.png" alt="Khuyến mãi DJI Osmo Desktop" className="promo-osmo-bg promo-osmo-desktop" />
        
        {/* Ảnh Mobile */}
        <img src="/assets/image/promo_osmo_mobile.png" alt="Khuyến mãi DJI Osmo Mobile" className="promo-osmo-bg promo-osmo-mobile" />

        {/* Vùng click ĐẶT THUÊ (Desktop là ẩn, Mobile là nút thật) */}
        <Link to="/dat-lich?id=da2a261e-7ca4-4501-b421-781039df7613" className="promo-osmo-btn-overlay" title="Đặt thuê DJI Osmo ngay">
          <span className="promo-osmo-btn-text">ĐẶT THUÊ NGAY</span>
        </Link>

        {/* Bọc video và nút bấm vào một container */}
        <div className="promo-osmo-video-container">
          <video 
            ref={videoRef}
            className="promo-osmo-video"
            src="/assets/video/promo_osmo.mp4" 
            autoPlay 
            muted={isMuted}
            loop 
            playsInline
          >
            Trình duyệt của bạn không hỗ trợ video.
          </video>
          
          <button 
            className="promo-osmo-mute-btn" 
            onClick={toggleMute}
            title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromoOsmo;
