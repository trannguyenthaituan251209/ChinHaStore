import React from 'react';
import './HomePageSkeleton.css';

/**
 * HomePageSkeleton:
 * Khung giữ chỗ mô phỏng sát tỷ lệ và cấu trúc thực tế của Homepage.
 * Ngăn chặn tuyệt đối hiện tượng Header và Footer dính vào nhau khi đang nạp code-chunk,
 * đồng thời tạo hiệu ứng shimmer cao cấp giúp giữ chân người dùng (dwell-time).
 */
const HomePageSkeleton = () => {
  return (
    <div className="home-page-skeleton" aria-busy="true" aria-label="Đang tải trang chủ...">
      {/* 1. HERO SECTION SKELETON */}
      <div className="sk-hero">
        <div className="sk-hero-content">
          <div className="sk-hero-title sk-shimmer-warm"></div>
          <div className="sk-hero-desc sk-shimmer-warm"></div>
          <div className="sk-hero-btns">
            <div className="sk-hero-btn sk-shimmer-warm"></div>
            <div className="sk-hero-btn sk-shimmer-warm"></div>
          </div>
        </div>
        <div className="sk-hero-illustration sk-shimmer-warm"></div>
      </div>

      {/* 2. SECTION X6 SKELETON */}
      <div className="sk-journey-section">
        <div className="sk-journey-wrapper">
          <div className="sk-journey-text">
            <div className="sk-journey-title sk-shimmer"></div>
            <div className="sk-journey-line sk-shimmer"></div>
            <div className="sk-journey-line short sk-shimmer"></div>
            <div className="sk-journey-pill sk-shimmer"></div>
          </div>
          <div className="sk-journey-art sk-shimmer"></div>
        </div>
      </div>

      {/* 3. SECTION LUNA ULTRA SKELETON */}
      <div className="sk-journey-section">
        <div className="sk-journey-center-wrapper">
          <div className="sk-journey-title sk-shimmer" style={{ width: '50%' }}></div>
          <div className="sk-journey-line sk-shimmer" style={{ width: '70%' }}></div>
          <div className="sk-journey-pill sk-shimmer"></div>
          <div className="sk-journey-center-art sk-shimmer"></div>
        </div>
      </div>

      {/* 4. SECTION FUJIFILM XS10 SKELETON (DARK) */}
      <div className="sk-journey-section sk-journey-section--dark">
        <div className="sk-journey-center-wrapper">
          <div className="sk-journey-title sk-shimmer-dark" style={{ width: '55%' }}></div>
          <div className="sk-journey-line sk-shimmer-dark" style={{ width: '65%' }}></div>
          <div className="sk-journey-pill sk-shimmer-dark"></div>
          <div className="sk-journey-center-art sk-shimmer-dark"></div>
        </div>
      </div>

      {/* 5. NEWS & ANNOUNCEMENTS SKELETON */}
      <div className="sk-news-section">
        <div className="sk-news-wrapper">
          <div className="sk-news-card sk-shimmer"></div>
          <div className="sk-news-card sk-shimmer"></div>
        </div>
      </div>
    </div>
  );
};

export default HomePageSkeleton;

