import React from 'react';
import { Helmet } from 'react-helmet-async';
import HeroSection from '../components/HeroSection';
import FeaturedProducts from '../components/FeaturedProducts';
import NeedsRecommendation from '../components/NeedsRecommendation';
import HowItWorks from '../components/HowItWorks';
import Commitments from '../components/Commitments';
import FinalCTA from '../components/FinalCTA';

const HomePage = () => {
  return (
    <div className="home-page">
      <Helmet>
        <title>Thuê Máy Ảnh Buôn Ma Thuột | ChinHaStore - Canon R50 & Fujifilm</title>
        <meta name="description" content="Dịch vụ cho thuê máy ảnh uy tín tại Buôn Ma Thuột (BMT). Thuê Canon R50, Fujifilm, Ricoh GR III. Hotline 0842204207. Hỗ trợ 24/7." />
        <meta name="keywords" content="thue may anh, thue may anh bmt, thuê máy ảnh, thuê Canon R50, thuê máy ảnh Buôn Ma Thuột" />
      </Helmet>
      <HeroSection />
      <FeaturedProducts />
      <NeedsRecommendation />
      <HowItWorks />
      <Commitments />
      <FinalCTA />
    </div>
  );
};

export default HomePage;
