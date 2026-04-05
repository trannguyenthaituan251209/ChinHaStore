import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { Link } from 'react-router-dom';
import { products } from '../data/products';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import './NeedsRecommendation.css';

const NeedsRecommendation = () => {
  return (
    <section className="featured-products">
      <div className="container">
        
        <div className="section-header">
          <h2 className="section-title">CHỌN MÁY THEO NHU CẦU CỦA BẠN</h2>
          <p className="section-subtitle">Bạn chưa biết mình nên chọn máy nào? Đừng lo, phần này sẽ mô tả chi tiết giúp bạn chọn thiết bị phù hợp nhất</p>
        </div>

        <div className="featured-slider-wrapper">
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={30}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            breakpoints={{
              768: {
                slidesPerView: 2,
                spaceBetween: 30,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 40,
              },
            }}
            className="featured-swiper"
          >
            {products.map(product => (
              <SwiperSlide key={product.id}>
                <div className="pricing-card">
                  
                  <div className="pricing-img-box">
                    <img src={product.designImage} alt={product.name} />
                  </div>
                  
                  <div className="pricing-content">
                    <h3 className="pricing-title">{product.name}</h3>
                    <p className="pricing-desc">{product.desc}</p>
                    
                    <div className="pricing-daily" style={{ color: product.theme }}>
                      Giá thuê: {product.price1Day}VNĐ/1 ngày
                    </div>

                    <div className="pricing-table">
                      <div className="p-cell p-label">2 Ngày</div>
                      <div className="p-cell p-val">{product.price2Days}VNĐ</div>
                      <div className="p-cell p-label border-bottom-none">3 Ngày</div>
                      <div className="p-cell p-val border-bottom-none">{product.price3Days}VNĐ</div>
                    </div>

                    <div className="pricing-subtext" style={{ color: product.theme }}>
                      Từ ngày 4 trở đi {product.price4DaysPlus}VNĐ/1 Ngày
                    </div>

                    <Link to={`/dat-lich?id=${product.id}`} className="btn-rent-now" style={{ backgroundColor: product.theme }}>
                      Thuê ngay
                    </Link>
                  </div>

                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

      </div>
    </section>
  );
};

export default NeedsRecommendation;
