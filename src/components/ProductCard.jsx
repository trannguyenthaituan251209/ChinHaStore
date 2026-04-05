import React from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ product, onClick }) => {
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
      </div>
      
      <div className="product-card-content">
        <h3 className="product-card-name">{product.name}</h3>
        
        <div className="product-card-rating">
          <span className="stars">★★★★★</span>
          <span className="rating-num">{product.rating || '5.0'}</span>
        </div>
        
        <div className="product-card-price">
          {formattedPrice}đ <small>/ngày</small>
        </div>
        
        <div className="product-card-actions-stacked">
          <Link to={`/dat-lich?id=${product.id}`} className="btn-buy-vip" onClick={handleClick}>
            CHỌN THUÊ
          </Link>
          <button className="btn-info-vip" onClick={handleClick}>
            TÌM HIỂU THÊM
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
