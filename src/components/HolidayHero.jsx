import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { blogService } from '../services/blogService';
import { TrendingUp } from 'lucide-react';
import PromoOsmo from './PromoOsmo';
import './HolidayHero.css';

const HolidayHero = () => {
    const navigate = useNavigate();
    const [topProducts, setTopProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [announcements, setAnnouncements] = useState([]);
    const [guides, setGuides] = useState([]);
    const [feedLoading, setFeedLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const [rentalsResult, announcementsResult, guidesResult] = await Promise.allSettled([
                adminService.getTopRentals(),
                blogService.getHomepageAnnouncements(4),
                blogService.getLatestGuides(2)
            ]);

            if (rentalsResult.status === 'fulfilled') {
                setTopProducts((rentalsResult.value || []).slice(0, 4));
            } else {
                console.error('Failed to fetch top rentals:', rentalsResult.reason);
            }
            setLoadingProducts(false);

            if (announcementsResult.status === 'fulfilled') {
                setAnnouncements(announcementsResult.value || []);
            } else {
                console.error('Failed to fetch homepage announcements:', announcementsResult.reason);
            }
            if (guidesResult.status === 'fulfilled') {
                setGuides(guidesResult.value || []);
            } else {
                console.error('Failed to fetch homepage guides:', guidesResult.reason);
            }
            setFeedLoading(false);
        };
        fetchData();
    }, []);

    const announcementDate = (post) => post?.created_at
        ? new Date(post.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '';

    const postSummary = (post, maxLength = 150) => {
        const source = typeof post?.excerpt === 'string' && post.excerpt
            ? post.excerpt
            : typeof post?.content === 'string'
                ? post.content
                : '';
        const plainText = source
            .replace(/<[^>]*>/g, ' ')
            .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
            .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
            .replace(/[#*_`>~-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (!plainText) return '';
        return plainText.length > maxLength ? `${plainText.slice(0, maxLength).trim()}…` : plainText;
    };

    return (
        <section className="holiday-hero">
            <div className="container">


                {!feedLoading && (announcements.length > 0 || guides.length > 0) && (
                    <div className={`home-content-feed ${announcements.length === 0 ? 'home-content-feed--guides-only' : ''} ${guides.length === 0 ? 'home-content-feed--announcements-only' : ''}`}>
                        {announcements.length > 0 && (
                            <section className="home-feed-section home-announcements" aria-labelledby="home-announcements-title">
                                <div className="home-feed-heading">
                                    <div>
                                        <p className="home-feed-eyebrow">CẬP NHẬT TỪ CHINHASTORE</p>
                                        <h2 id="home-announcements-title">Thông báo</h2>
                                    </div>
                                    <Link to="/blog?type=announcement" className="home-feed-view-all">Tất cả thông báo</Link>
                                </div>

                                <Link
                                    to={`/blog/${announcements[0].slug}`}
                                    className={`announcement-feature ${announcements[0].thumbnail_url ? '' : 'announcement-feature--text-only'}`}
                                >
                                    {announcements[0].thumbnail_url && (
                                        <div className="announcement-feature-image">
                                            <img src={announcements[0].thumbnail_url} alt="" />
                                        </div>
                                    )}
                                    <div className="announcement-feature-content">
                                        <span className="feed-type-label">Thông báo mới nhất</span>
                                        {announcementDate(announcements[0]) && <time>{announcementDate(announcements[0])}</time>}
                                        <h3>{announcements[0].title}</h3>
                                        {announcements[0].excerpt && <p>{announcements[0].excerpt}</p>}
                                        <span className="feed-text-link">Xem chi tiết</span>
                                    </div>
                                </Link>

                                {announcements.length > 1 && (
                                    <ul className="announcement-list">
                                        {announcements.slice(1).map((post) => (
                                            <li key={post.id}>
                                                <Link to={`/blog/${post.slug}`}>
                                                    <span className="announcement-list-content">
                                                        <strong>{post.title}</strong>
                                                        {postSummary(post, 115) && <span className="announcement-summary">{postSummary(post, 115)}</span>}
                                                    </span>
                                                    {announcementDate(post) && <time dateTime={post.created_at}>{announcementDate(post)}</time>}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        )}

                        {guides.length > 0 && (
                            <section className="home-feed-section home-guides" aria-labelledby="home-guides-title">
                                <div className="home-feed-heading">
                                    <div>
                                        <p className="home-feed-eyebrow">KIẾN THỨC NHIẾP ẢNH</p>
                                        <h2 id="home-guides-title">Cẩm nang</h2>
                                    </div>
                                    <Link to="/blog?type=guide" className="home-feed-view-all">Tất cả cẩm nang</Link>
                                </div>
                                <div className="home-guide-list">
                                    {guides.map((post) => (
                                        <Link
                                            to={`/blog/${post.slug}`}
                                            className={`home-guide-card ${post.thumbnail_url ? '' : 'home-guide-card--text-only'}`}
                                            key={post.id}
                                        >
                                            {post.thumbnail_url && (
                                                <div className="home-guide-image">
                                                    <img src={post.thumbnail_url} alt="" />
                                                </div>
                                            )}
                                            <div className="home-guide-content">
                                                <h3>{post.title}</h3>
                                                <div className="home-guide-meta">
                                                    {announcementDate(post) && <time dateTime={post.created_at}>{announcementDate(post)}</time>}
                                                    <span>{post.author || 'ChinHaStore'}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}

                <PromoOsmo />

                {/* BOTTOM SECTION: TOP RENTALS */}
                <div className="top-rentals-wrapper">
                    <div className="rentals-banner">
                        <img src="https://imghosting.in/host/h56ktq" alt="Top Rentals Banner" className="banner-img-main" />
                    </div>

                    <div className="rentals-products">
                        {loadingProducts ? (
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
