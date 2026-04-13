import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User } from 'lucide-react';
import './BlogCard.css';

const BlogCard = ({ post }) => {
  const formattedDate = new Date(post.created_at).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <Link to={`/blog/${post.slug}`} className="blog-card animate-in">
      <div className="blog-card-image">
        <img 
          src={post.thumbnail_url || 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2070&auto=format&fit=crop'} 
          alt={post.title} 
        />
        <div className="blog-card-overlay">
          <span>Đọc bài viết ➔</span>
        </div>
      </div>
      
      <div className="blog-card-content">
        <div className="blog-card-meta">
          <span><Calendar size={14} /> {formattedDate}</span>
          <span><User size={14} /> ChinHaStore</span>
        </div>
        
        <h3 className="blog-card-title">{post.title}</h3>
        <p className="blog-card-excerpt">
          {post.excerpt || post.content.substring(0, 100).replace(/[#*]/g, '') + '...'}
        </p>
      </div>
    </Link>
  );
};

export default BlogCard;
