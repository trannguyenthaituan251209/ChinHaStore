import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { blogService } from '../services/blogService';
import { TrendingUp } from 'lucide-react';
import './HolidayHero.css';

const HolidayHero = () => {
    const navigate = useNavigate();
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [links, setLinks] = useState({ 
        hero: '/blog',
        main: '/blog', 
        sub1: '/blog', 
        sub2: '/blog' 
    });

    const posters = {
        hero: 'https://imghosting.in/host/s8w6ja',
        heroMobile: 'https://imghosting.in/host/xxrvhy',
        main: 'https://imghosting.in/host/u3qx25',
        sub1: 'https://imghosting.in/host/wvnixs',
        sub2: 'https://imghosting.in/host/vpxfuq'
    };

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rentals, banners] = await Promise.all([
                    adminService.getTopRentals(),
                    blogService.getBanners()
                ]);
                setTopProducts(rentals.slice(0, 4));
                
                // Map banners by slot assignment
                if (banners && banners.length > 0) {
                    const posterLinks = { hero: '/blog', main: '/blog', sub1: '/blog', sub2: '/blog' };
                    banners.forEach(b => {
                        if (b.banner_slot) {
                            posterLinks[b.banner_slot] = `/blog/${b.slug}`;
                        }
                    });
                    setLinks(posterLinks);
                }
            } catch (err) {
                console.error('Failed to fetch holiday data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <section className="holiday-hero">
            <div className="container">
                {/* HERO INFOGRAPHIC POSTER (Static) */}
                <div className="hero-infographic">
                    <img 
                        src={isMobile ? posters.heroMobile : posters.hero} 
                        alt="ChinHaStore - Dịch vụ cho thuê máy ảnh chất lượng cao tại Buôn Ma Thuột." 
                        className="hero-poster-img"
                    />
                </div>

                {/* TOP SECTION: POSTER LAYOUT 1-2 */}
                <div className="poster-layout">
                    <Link to={links.main} className="poster-main">
                        <img src={posters.main} alt="Main Holiday Promotion" />
                        <div className="poster-overlay">
                            <span className="holiday-tag">SỰ KIỆN ĐẠI LỄ 30/4 - 1/5</span>
                        </div>
                    </Link>
                    <div className="poster-subs">
                        <Link to={links.sub1} className="poster-sub-item">
                            <img src={posters.sub1} alt="Promotion 1" />
                        </Link>
                        <Link to={links.sub2} className="poster-sub-item">
                            <img src={posters.sub2} alt="Promotion 2" />
                        </Link>
                    </div>
                </div>

                {/* BOTTOM SECTION: TOP RENTALS */}
                <div className="top-rentals-wrapper">
                    <div className="rentals-banner">
                        <img src="https://imghosting.in/host/h56ktq" alt="Top Rentals Banner" className="banner-img-main" />
                    </div>

                    <div className="rentals-products">
                        {loading ? (
                            <div className="rentals-loading">
                                <div className="mini-spinner"></div>
                            </div>
                        ) : (
                            <div className="products-grid-holiday">
                                {topProducts.map((product) => (
                                    <div key={product.id} className="holiday-product-card">
                                        <div className="card-image-bleed">
                                            <div className="badge-promo">HOT</div>
                                            <img src={product.image || product.image_url} alt={product.name} />
                                        </div>
                                        <div className="card-info-holiday">
                                            <div className="product-meta-top">
                                                <span className="rental-count">
                                                    <TrendingUp size={12} /> {product.rentalCount || 0} lượt thuê
                                                </span>
                                            </div>
                                            <h3 className="holiday-product-name">{product.name}</h3>
                                            <div className="holiday-price-row">
                                                <span className="price-label">Chỉ từ</span>
                                                <span className="price-value">
                                                    {new Intl.NumberFormat('vi-VN').format(product.price1Day || product.price_1day)}đ
                                                </span>
                                            </div>
                                            <div className="holiday-card-actions">
                                                <button 
                                                    className="btn-holiday-book"
                                                    onClick={() => navigate(`/dat-lich?id=${product.id}`)}
                                                >
                                                    CHỌN THUÊ
                                                </button>
                                                <button 
                                                    className="btn-holiday-detail"
                                                    onClick={() => navigate(`/camera/${product.slug}`)}
                                                >
                                                    CHI TIẾT
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HolidayHero;
