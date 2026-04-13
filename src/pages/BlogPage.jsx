import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { blogService } from '../services/blogService';
import BlogCard from '../components/BlogCard';
import './BlogPage.css';

const BlogPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchPosts = async () => {
      try {
        const data = await blogService.getAllPosts();
        setPosts(data);
      } catch (err) {
        console.error('Failed to fetch blog posts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="blog-page-loading">
        <div className="spinner"></div>
        <p>ĐANG TẢI CẨM NANG...</p>
      </div>
    );
  }

  return (
    <div className="blog-page">
      <Helmet>
        <title>Cẩm Nang Nhiếp Ảnh | Blog ChinHaStore</title>
        <meta name="description" content="Khám phá các mẹo chụp ảnh, review máy ảnh và tin tức thuê máy tại Buôn Ma Thuột. Cập nhật xu hướng nhiếp ảnh mới nhất." />
      </Helmet>

      <div className="catalog-header-bar">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">Trang chủ</Link>
            <ChevronRight size={14} />
            <span>Cẩm nang</span>
          </div>
          <h1 className="catalog-title">CHINHA BLOG</h1>
        </div>
      </div>

      <div className="container blog-container">
        <div className="blog-search-bar">
          <div className="search-input-wrapper">
            <Search size={20} />
            <input 
              type="text" 
              placeholder="Tìm kiếm bài viết..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredPosts.length > 0 ? (
          <div className="blog-grid-full">
            {filteredPosts.map(post => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="empty-blog">
            <p>Không tìm thấy bài viết nào phù hợp.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPage;
