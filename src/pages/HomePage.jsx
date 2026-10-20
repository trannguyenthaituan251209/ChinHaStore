import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import HeroSection from '../components/HeroSection';
import HolidayHero from '../components/HolidayHero';
import FeaturedProducts from '../components/FeaturedProducts';
import NeedsRecommendation from '../components/NeedsRecommendation';
import HowItWorks from '../components/HowItWorks';
import Commitments from '../components/Commitments';
import BlogSection from '../components/BlogSection';
import FinalCTA from '../components/FinalCTA';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <Helmet>
        <title>Thuê Máy Ảnh tại Buôn Ma Thuột | ChinHaStore</title>
        <link rel="canonical" href="https://chinhastore.com/" />
        <meta name="description" content="ChinHaStore cho thuê máy ảnh tại Buôn Ma Thuột, Đắk Lắk. Xem máy đang có, giá thuê theo thời lượng và đặt lịch trực tuyến; hỗ trợ giao nhận theo khu vực phục vụ." />
      </Helmet>
      <HeroSection />
      <section className="local-service-intro" aria-labelledby="local-service-heading">
        <div className="container local-service-intro__content">
          <p className="local-service-intro__eyebrow">CHINHASTORE · ĐẮK LẮK</p>
          <h2 id="local-service-heading">Thuê máy ảnh tại Buôn Ma Thuột</h2>
          <p>
            Xem các mẫu máy đang được cho thuê và giá theo từng thời lượng ngay trong kho máy.
            Bạn có thể chọn thiết bị, gửi yêu cầu đặt lịch trực tuyến và trao đổi với ChinHaStore
            về phương án giao nhận trong khu vực phục vụ.
          </p>
          <Link to="/all-camera" className="local-service-intro__link">Xem máy và bảng giá <span aria-hidden="true">→</span></Link>
        </div>
      </section>
      <HowItWorks />
      <HolidayHero />
      <FeaturedProducts />
      <NeedsRecommendation />
      <Commitments />
      <BlogSection />
      <FinalCTA />
    </div>
  );
};

export default HomePage;
