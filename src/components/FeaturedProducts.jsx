import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../services/adminService';
import ProductCard from './ProductCard';
import './FeaturedProducts.css';

const FeaturedProducts = () => {
  const [productList, setProductList] = useState([]);
  const [stats, setStats] = useState({ counts: {}, hotProductId: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProductsAndStats = async () => {
      try {
        const [pData, sData] = await Promise.all([
          adminService.getAllProducts(),
          adminService.getMonthlyProductStats()
        ]);
        setProductList(pData);
        setStats(sData);
      } catch (err) {
        console.error('Error fetching featured products or stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProductsAndStats();
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

  // Filter for active products only and limit to featured selection (e.g., first 8)
  const displayProducts = productList
    .filter(p => p.status === 'active')
    .slice(0, 8);

  return (
    <section className="featured-products">
      <div className="container">

        <div className="section-header">
          <h2 className="section-title">SẢN PHẨM NỔI BẬT</h2>
          <p className="section-subtitle">Khám phá đầy đủ +40 các loại máy ảnh, ống kính đang có mặt tại ChinHaStore</p>
        </div>

        <div className="product-grid">
          {displayProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              monthlyCount={stats.counts[product.id] || 0}
              isHot={stats.hotProductId === product.id}
            />
          ))}
        </div>

        <div className="view-all-container">
          <Link to="/all-camera" className="btn-view-all">Xem toàn bộ kho máy</Link>
        </div>

      </div>
    </section>
  );
};

export default FeaturedProducts;
