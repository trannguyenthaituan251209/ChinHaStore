import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogService } from '../services/blogService';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './PromotionBanner.css';

const PromotionBanner = () => {
    const [banners, setBanners] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const data = await blogService.getBanners();
                setBanners(data);
            } catch (err) {
                console.error('Failed to fetch banners:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchBanners();
    }, []);

    // Auto-scroll
    useEffect(() => {
        if (banners.length <= 1) return;
        
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 5000);
        
        return () => clearInterval(timer);
    }, [banners]);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    };

    if (loading || banners.length === 0) return null;

    return (
        <section className="promotion-banner-section">
            <div className="banner-container">
                <div 
                    className="banner-track"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {banners.map((banner) => (
                        <div key={banner.id} className="banner-slide">
                            <Link to={`/blog/${banner.slug}`} className="banner-link">
                                <div className="banner-image-wrapper">
                                    <img 
                                        src={banner.thumbnail_url} 
                                        alt={banner.title} 
                                        className="banner-image"
                                    />
                                </div>
                                <div className="banner-info-bar">
                                    <div className="banner-content">
                                        <div className="banner-text">
                                            <span className="banner-tag">Chương Trình Mới</span>
                                            <h2 className="banner-title">{banner.title}</h2>
                                            <p className="banner-excerpt">{banner.excerpt}</p>
                                        </div>
                                        <button className="btn-banner-action">
                                            Xem Chi Tiết ➔
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>

                {banners.length > 1 && (
                    <>
                        <button className="banner-nav prev" onClick={prevSlide}>
                            <ChevronLeft size={24} />
                        </button>
                        <button className="banner-nav next" onClick={nextSlide}>
                            <ChevronRight size={24} />
                        </button>
                        
                        <div className="banner-dots">
                            {banners.map((_, idx) => (
                                <button 
                                    key={idx} 
                                    className={`dot ${idx === currentIndex ? 'active' : ''}`}
                                    onClick={() => setCurrentIndex(idx)}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
};

export default PromotionBanner;
