import { Link } from 'react-router-dom';
import './FinalCTA.css';

const FinalCTA = () => {
  return (
    <section className="final-cta">
      <div className="container">
        
        <div className="cta-content">
          <h2 className="cta-title">Sẵn sàng trải nghiệm máy ảnh chất lượng cao?</h2>
          <p className="cta-subtitle">
            Đặt thuê ngay hôm nay để nhận ưu đãi và sự hỗ trợ tận tình nhất từ đội ngũ ChinHaStore!
          </p>
          <Link to="/dat-lich" className="btn-final-rent">Đặt thuê ngay</Link>
        </div>

      </div>
    </section>
  );
};

export default FinalCTA;
