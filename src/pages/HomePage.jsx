import React from 'react';
import { Helmet } from 'react-helmet-async';
import HeroSection from '../components/HeroSection';
import HolidayHero from '../components/HolidayHero';
import FeaturedProducts from '../components/FeaturedProducts';
import NeedsRecommendation from '../components/NeedsRecommendation';
import HowItWorks from '../components/HowItWorks';
import Commitments from '../components/Commitments';
import BlogSection from '../components/BlogSection';
import FinalCTA from '../components/FinalCTA';

const HomePage = () => {
  return (
    <div className="home-page">
      <Helmet>
        <title>Thuê Máy Ảnh tại Buôn Ma Thuột | ChinHaStore</title>
        <link rel="canonical" href="https://chinhastore.com/" />
        <meta name="description" content="ChinHaStore cho thuê máy ảnh tại Buôn Ma Thuột, Đắk Lắk. Xem máy đang có, giá thuê theo thời lượng và đặt lịch trực tuyến; hỗ trợ giao nhận theo khu vực phục vụ." />
      </Helmet>
      <HeroSection />
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
