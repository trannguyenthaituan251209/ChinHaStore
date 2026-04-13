import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogService } from '../services/blogService';
import BlogCard from './BlogCard';
import './BlogSection.css';

const BlogSection = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const data = await blogService.getLatestPosts(3);
        setPosts(data);
      } catch (err) {
        console.error('Failed to fetch blog posts:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLatest();
  }, []);

  if (isLoading) return null; // Or skeleton
  if (posts.length === 0) return null;

  return (
    <section className="blog-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">CẨM NANG NHIẾP ẢNH</h2>
          <p className="section-subtitle">
            Khám phá các bí kíp chụp ảnh, review thiết bị và tin tức mới nhất từ ChinHaStore
          </p>
        </div>

        <div className="blog-grid">
          {posts.map(post => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>

        <div className="view-all-container">
          <Link to="/blog" className="btn-view-all-blog">
            Xem tất cả bài viết
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
