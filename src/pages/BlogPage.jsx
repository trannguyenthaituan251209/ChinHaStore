import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronRight, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { blogService } from '../services/blogService';
import BlogCard from '../components/BlogCard';
import './BlogPage.css';

const BlogPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams] = useSearchParams();
  const selectedType = ['announcement', 'guide'].includes(searchParams.get('type'))
    ? searchParams.get('type')
    : 'all';

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
    (selectedType === 'all' || post.content_type === selectedType) &&
    (post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Thông Báo &amp; Cẩm Nang | ChinHaStore</title>
          <link rel="canonical" href="https://chinhastore.com/blog" />
          <meta name="description" content="Cập nhật thông báo từ ChinHaStore và đọc cẩm nang nhiếp ảnh, hướng dẫn sử dụng thiết bị, kinh nghiệm thuê máy ảnh tại Buôn Ma Thuột." />
        </Helmet>
        <div className="blog-page-loading">
          <div className="spinner"></div>
          <p>ĐANG TẢI NỘI DUNG...</p>
        </div>
      </>
    );
  }

  return (
    <div className="blog-page">
      <Helmet>
        <title>Thông Báo &amp; Cẩm Nang | ChinHaStore</title>
        <link rel="canonical" href="https://chinhastore.com/blog" />
        <meta name="description" content="Cập nhật thông báo từ ChinHaStore và đọc cẩm nang nhiếp ảnh, hướng dẫn sử dụng thiết bị, kinh nghiệm thuê máy ảnh tại Buôn Ma Thuột." />
        <meta name="robots" content={posts.length ? 'index, follow' : 'noindex, follow'} />
      </Helmet>

      <div className="catalog-header-bar">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">Trang chủ</Link>
            <ChevronRight size={14} />
            <span>Thông báo &amp; Cẩm nang</span>
          </div>
          <h1 className="catalog-title">Thông báo &amp; Cẩm nang</h1>
        </div>
      </div>

      <div className="container blog-container">
        <nav className="blog-type-filters" aria-label="Lọc nội dung">
          <Link to="/blog" className={selectedType === 'all' ? 'active' : ''} aria-current={selectedType === 'all' ? 'page' : undefined}>Tất cả</Link>
          <Link to="/blog?type=announcement" className={selectedType === 'announcement' ? 'active' : ''} aria-current={selectedType === 'announcement' ? 'page' : undefined}>Thông báo</Link>
          <Link to="/blog?type=guide" className={selectedType === 'guide' ? 'active' : ''} aria-current={selectedType === 'guide' ? 'page' : undefined}>Cẩm nang</Link>
        </nav>

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
