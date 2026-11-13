import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogService } from '../services/blogService';
import './HolidayHero.css';

const HolidayHero = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [feedLoading, setFeedLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const announcementsResult = await Promise.allSettled([
                blogService.getHomepageAnnouncements(4)
            ]);

            if (announcementsResult[0].status === 'fulfilled') {
                setAnnouncements(announcementsResult[0].value || []);
            } else {
                console.error('Failed to fetch homepage announcements:', announcementsResult[0].reason);
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


                {!feedLoading && announcements.length > 0 && (
                    <div className="home-content-feed home-content-feed--announcements-only">
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
                                        <div className="announcement-feature-meta">
                                            <span className="feed-type-label">Thông báo mới nhất</span>
                                            {announcementDate(announcements[0]) && (
                                                <>
                                                    <span className="feed-meta-dot">•</span>
                                                    <time>{announcementDate(announcements[0])}</time>
                                                </>
                                            )}
                                        </div>
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

                    </div>
                )}
            </div>
        </section>
    );
};

export default HolidayHero;
