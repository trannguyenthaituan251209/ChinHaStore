import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../services/adminService';
import './FeaturedProducts.css';

const FeaturedProducts = () => {
  const [productList, setProductList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await adminService.getAllProducts();
        setProductList(data);
      } catch (err) {
        console.error('Error fetching featured products:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (isLoading) {
    return (
      <section className="featured-products">
        <div className="container" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1.5rem' }}></div>
          <p>Đang tải sản phẩm nổi bật...</p>
        </div>
      </section>
    );
  }

  // Use the live list, or fallback if none
  const displayProducts = productList.length > 0 ? productList : [];

  return (
    <section className="featured-products">
      <div className="container">
        
        <div className="section-header">
          <h2 className="section-title">SẢN PHẨM NỔI BẬT</h2>
          <p className="section-subtitle">Khám phá đầy đủ +40 các loại máy ảnh, ống kính đang có mặt tại ChinHaStore</p>
        </div>

        <div className="product-grid">
          {displayProducts.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-image-box">
                <img src={product.image || 'https://via.placeholder.com/300?text=ChinHaStore'} alt={product.name} />
              </div>
              <div className="product-info-box">
                <h3 className="product-name">{product.name}</h3>
                <div className="product-meta">
                  <div className="product-rating">
                    <span className="stars">★★★★★</span>
                    <span className="rating-text">{product.rating || '5.0'}</span>
                  </div>
                  <div className="product-price">
                    {new Intl.NumberFormat('vi-VN').format(product.price1Day)}đ <small>/ngày</small>
                  </div>
                </div>
                <div className="product-actions">
                  <Link to={`/dat-lich?id=${product.id}`} className="btn-primary">Chọn thuê</Link>
                  <button className="btn-secondary">Tìm hiểu thêm</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="view-all-container">
          <button className="btn-view-all">Xem toàn bộ kho máy</button>
        </div>

      </div>
    </section>
  );
};

export default FeaturedProducts;
