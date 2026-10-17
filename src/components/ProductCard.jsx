import React from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ product, onClick, monthlyCount = 0, isHot = false, viewMode = 'grid' }) => {
  const formattedPrice = new Intl.NumberFormat('vi-VN').format(product.price1Day || 0);

  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick(product);
    }
  };

  /* ── LIST ROW ── */
  if (viewMode === 'list') {
    return (
      <div className="product-list-row">
        {/* Ảnh */}
        <Link
          to={`/camera/${product.slug || product.id}`}
          className="list-row-image"
        >
          <img
            src={product.image || '/assets/image/placeholder.png'}
            alt={product.name}
            loading="lazy"
          />
          {isHot && <span className="hot-badge">HOT THÁNG</span>}
        </Link>

        {/* Thông tin cơ bản */}
        <div className="list-row-info">
          <h3 className="list-row-name">{product.name}</h3>
          <div className="list-row-rating">
            Đánh giá: <strong>{product.rating ? `${product.rating}/5` : '5.0/5'}</strong>
          </div>
          {monthlyCount > 0 && (
            <div className="list-row-stats">Đã có {monthlyCount} lượt thuê tháng này</div>
          )}
        </div>

        {/* Giá + CTA */}
        <div className="list-row-price-col">
          <div className="list-row-price">
            {formattedPrice}đ <small>/ngày</small>
          </div>
          <Link
            to={`/dat-lich?id=${product.id}`}
            className="btn-buy-vip list-row-cta"
            onClick={handleClick}
          >
            CHỌN THUÊ
          </Link>
        </div>
      </div>
    );
  }

  /* ── GRID CARD (mặc định) ── */
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

