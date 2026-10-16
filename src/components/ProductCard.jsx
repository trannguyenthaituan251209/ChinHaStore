import React from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ product, onClick, monthlyCount = 0, isHot = false }) => {
  const formattedPrice = new Intl.NumberFormat('vi-VN').format(product.price1Day || 0);

  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick(product);
    }
  };

  return (
    <div className="product-card-vip-centered">
      <div className="product-card-image-wrapper">
        <img 
          src={product.image || '/assets/image/placeholder.png'} 
          alt={product.name} 
          loading="lazy"
        />
        {isHot && (
          <div className="hot-badge">
            <span>HOT THÁNG</span>
          </div>
        )}

        {/* Hover/Tap Overlay on Image Area only */}
        <div className="product-image-overlay">
          <Link 
            to={`/camera/${product.slug || product.id}`} 
            className="btn-overlay-info"
            onClick={(e) => e.stopPropagation()}
          >
            TÌM HIỂU THÊM
          </Link>
        </div>
      </div>
      
      <div className="product-card-content">
        <h3 className="product-card-name">{product.name}</h3>
        
        <div className="product-card-rating">
          <span className="rating-label">Đánh giá:</span>
          <span className="rating-num">{product.rating ? `${product.rating}/5` : '5.0/5'}</span>
        </div>
        
        <div className="product-card-price">
          {formattedPrice}đ <small>/ngày</small>
        </div>

        {monthlyCount > 0 && (
          <div className="product-card-stats">
            Đã có {monthlyCount} lượt thuê tháng này
          </div>
        )}
        
        <div className="product-card-actions-stacked">
          <Link to={`/dat-lich?id=${product.id}`} className="btn-buy-vip" onClick={handleClick}>
            CHỌN THUÊ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
