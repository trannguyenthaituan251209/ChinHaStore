import React from 'react';
import HeroSection from '../components/HeroSection';
import FeaturedProducts from '../components/FeaturedProducts';
import NeedsRecommendation from '../components/NeedsRecommendation';
import HowItWorks from '../components/HowItWorks';
import Commitments from '../components/Commitments';
import FinalCTA from '../components/FinalCTA';

const HomePage = () => {
  return (
    <div className="home-page">
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
