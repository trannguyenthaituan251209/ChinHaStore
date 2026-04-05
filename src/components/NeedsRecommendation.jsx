import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { Link } from 'react-router-dom';
import adminService from '../services/adminService';
import { products as metadataList } from '../data/products';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import './NeedsRecommendation.css';

const NeedsRecommendation = () => {
  const [mergedProducts, setMergedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAndMerge = async () => {
      try {
        const dbProducts = await adminService.getAllProducts();
        
        // Merge DB data with local metadata (theme, desc, designImage)
        const merged = metadataList.map(meta => {
          // Normalize names: lowercase and split into words for keyword matching
          const getKeywords = (n) => n.toLowerCase().split(/\s+/).filter(word => word.length > 1);
          const metaKeywords = getKeywords(meta.name);

          const dbMatch = dbProducts.find(p => {
            const dbKeywords = getKeywords(p.name);
            // Match if important keywords overlap significantly (e.g. "Pocket" and "3" exist in both)
            const commonKeywords = metaKeywords.filter(k => dbKeywords.includes(k));
            
            // Specialized Rule: Match if at least 2 significant keywords match, or one name is contained in the other
            const metaNameClean = meta.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const dbNameClean = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            return commonKeywords.length >= 2 || dbNameClean.includes(metaNameClean) || metaNameClean.includes(dbNameClean);
          });

          if (dbMatch) {
            return {
              ...meta,
              dbId: dbMatch.id,
              price1Day: dbMatch.price1Day,
              price2Days: dbMatch.price2Days,
              price3Days: dbMatch.price3Days,
              price4DaysPlus: dbMatch.price4DaysPlus,
              price6h: dbMatch.price6h,
              name: dbMatch.name, 
            };
          }
          return meta; 
        });

        setMergedProducts(merged);
      } catch (err) {
        console.error('Error syncing NeedsRecommendation:', err);
        setMergedProducts(metadataList); // Ultimate fallback
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndMerge();
  }, []);

  if (isLoading) {
    return (
      <section className="featured-products">
        <div className="container" style={{ textAlign: 'center', padding: '5rem' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem' }}>ĐANG ĐỒNG BỘ DỮ LIỆU VIP...</p>
        </div>
      </section>
    );
  }

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
            {mergedProducts.map(product => (
              <SwiperSlide key={product.id}>
                <div className="pricing-card">
                  
                  <div className="pricing-img-box">
                    <img src={product.designImage} alt={product.name} />
                  </div>
                  
                  <div className="pricing-content">
                    <h3 className="pricing-title">{product.name}</h3>
                    <p className="pricing-desc">{product.desc}</p>
                    
                    <div className="pricing-daily" style={{ color: product.theme }}>
                      Giá thuê: {new Intl.NumberFormat('vi-VN').format(String(product.price1Day).replace(/\./g, ''))}đ/1 ngày
                    </div>

                    <div className="pricing-table">
                      <div className="p-cell p-label">2 Ngày</div>
                      <div className="p-cell p-val">{new Intl.NumberFormat('vi-VN').format(String(product.price2Days).replace(/\./g, ''))}đ</div>
                      <div className="p-cell p-label border-bottom-none">3 Ngày</div>
                      <div className="p-cell p-val border-bottom-none">{new Intl.NumberFormat('vi-VN').format(String(product.price3Days).replace(/\./g, ''))}đ</div>
                    </div>

                    <div className="pricing-subtext" style={{ color: product.theme }}>
                      Từ ngày 4 trở đi {new Intl.NumberFormat('vi-VN').format(String(product.price4DaysPlus).replace(/\./g, ''))}đ/1 Ngày
                    </div>

                    <Link to={`/dat-lich?id=${product.dbId || product.id}`} className="btn-rent-now" style={{ backgroundColor: product.theme }}>
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
