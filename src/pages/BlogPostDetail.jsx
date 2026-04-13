import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, User, ChevronLeft, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { blogService } from '../services/blogService';
import './BlogPostDetail.css';

const BlogPostDetail = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchPost = async () => {
      try {
        const data = await blogService.getPostBySlug(slug);
        setPost(data);
      } catch (err) {
        console.error('Failed to fetch post:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="blog-detail-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container error-container">
        <h2>Bài viết không tồn tại</h2>
        <Link to="/blog">Quay lại cẩm nang</Link>
      </div>
    );
  }

  const formattedDate = new Date(post.created_at).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="blog-post-detail animate-in">
      <Helmet>
        <title>{post.title} | Blog ChinHaStore</title>
        <meta name="description" content={post.excerpt || post.title} />
        <link rel="canonical" href={`https://chinhastore.online/blog/${post.slug}`} />
      </Helmet>

      <div className="detail-hero">
        <div className="detail-hero-overlay"></div>
        <img src={post.thumbnail_url} alt={post.title} className="detail-hero-bg" />
        <div className="container detail-hero-content">
          <Link to="/blog" className="back-link">
            <ChevronLeft size={18} /> Quay lại cẩm năng
          </Link>
          <h1 className="post-title-main">{post.title}</h1>
          <div className="post-meta-main">
            <span><Calendar size={18} /> {formattedDate}</span>
            <span><User size={18} /> {post.author}</span>
            <span><Clock size={18} /> 5 phút đọc</span>
          </div>
        </div>
      </div>

      <div className="container post-body-container">
        <div className="post-article-content">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{post.content}</ReactMarkdown>
        </div>
        
        <div className="post-footer">
          <div className="share-box">
             <span>CHIA SẺ BÀI VIẾT:</span>
             <div className="share-links">
               <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`)}>Facebook</button>
               <button onClick={() => navigator.clipboard.writeText(window.location.href)}>Sao chép link</button>
             </div>
          </div>
          <div className="post-tags">
            #ChinHaStore #Photography #Tips #BMT
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPostDetail;
