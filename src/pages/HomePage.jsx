import React from 'react';
import { Helmet } from 'react-helmet-async';
import HeroSection from '../components/HeroSection';
import PromotionBanner from '../components/PromotionBanner';
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
        <title>Thuê Máy Ảnh Buôn Ma Thuột | ChinHaStore - Canon R50 & Fujifilm</title>
        <link rel="canonical" href="https://chinhastore.online/" />
        <meta name="description" content="Dịch vụ cho thuê máy ảnh uy tín tại Buôn Ma Thuột (BMT). Thuê Canon R50, Fujifilm, Ricoh GR III. Hotline 0842204207. Hỗ trợ 24/7." />
        <meta name="keywords" content="thue may anh, thue may anh bmt, thuê máy ảnh, thuê Canon R50, thuê máy ảnh Buôn Ma Thuột" />
        
        {/* JSON-LD LocalBusiness Schema */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "ChinHaStore",
              "image": "https://chinhastore.online/assets/image/hero_section.png",
              "@id": "https://chinhastore.online",
              "url": "https://chinhastore.online",
              "telephone": "0842204207",
              "priceRange": "$$",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "23 Lê Thánh Tông",
                "addressLocality": "Buôn Ma Thuột",
                "addressRegion": "Đắk Lắk",
                "postalCode": "630000",
                "addressCountry": "VN"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 12.6841,
                "longitude": 108.0387
              },
              "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday"
                ],
                "opens": "07:30",
                "closes": "21:00"
              },
              "sameAs": [
                "https://www.facebook.com/people/Thu%C3%AA-m%C3%A1y-%E1%BA%A3nh-BMT/61574591176497/",
                "https://www.instagram.com/thuemayanh.bmt/"
              ]
            }
          `}
        </script>
      </Helmet>
      <HeroSection />
      <PromotionBanner />
      <FeaturedProducts />
      <NeedsRecommendation />
      <HowItWorks />
      <Commitments />
      <BlogSection />
      <FinalCTA />
    </div>
  );
};

export default HomePage;
