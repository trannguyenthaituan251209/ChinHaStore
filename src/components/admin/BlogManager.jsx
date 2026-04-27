import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Save, 
  X, 
  Image as ImageIcon,
  Eye,
  FileText,
  Bold,
  Italic,
  Link as LinkIcon,
  Heading2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { blogService } from '../../services/blogService';
import './BlogManager.css';

const BlogManager = ({ showStatus }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPost, setCurrentPost] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await blogService.adminGetAllPosts();
      setPosts(data);
    } catch (err) {
      showStatus('Không thể tải danh sách bài viết.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setCurrentPost({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      thumbnail_url: '',
      is_banner: false,
      banner_slot: '',
      status: 'published'
    });
    setIsEditing(true);
  };

  const handleEdit = (post) => {
    setCurrentPost(post);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      try {
        await blogService.deletePost(id);
        showStatus('Xóa bài viết thành công!');
        fetchPosts();
      } catch (err) {
        showStatus('Lỗi khi xóa bài viết.', 'error');
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (currentPost.id) {
        await blogService.updatePost(currentPost.id, currentPost);
        showStatus('Cập nhật bài viết thành công!');
      } else {
        await blogService.createPost(currentPost);
        showStatus('Đã đăng bài viết mới!');
      }
      setIsEditing(false);
      fetchPosts();
    } catch (err) {
      showStatus('Lỗi khi lưu bài viết. Vui lòng kiểm tra slug (phải là duy nhất).', 'error');
    }
  };

  // Helper to sync slug from title if empty
  const handleTitleBlur = () => {
    if (!currentPost.slug && currentPost.title) {
        const slug = currentPost.title
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[đĐ]/g, "d")
            .replace(/([^0-9a-z-\s])/g, "")
            .replace(/(\s+)/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-+|-+$/g, "");
        setCurrentPost({ ...currentPost, slug });
    }
  };

  const insertShortcut = (before, after) => {
    const textarea = document.getElementById('content-editor');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const beforeText = text.substring(0, start);
    const selectedText = text.substring(start, end);
    const afterText = text.substring(end);
    
    const newContent = beforeText + before + selectedText + after + afterText;
    setCurrentPost({ ...currentPost, content: newContent });
    
    // Restore focus
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + before.length, end + before.length);
    }, 10);
  };

  if (loading && !isEditing) return <div className="admin-loading">Đang tải dữ liệu...</div>;

  return (
    <div className="blog-manager animate-in">
      <div className="admin-section-header">
        <div className="admin-section-header-content" >
          <h2>Quản Lý Cẩm Nang</h2>
          <p>Tạo và chỉnh sửa các bài viết hướng dẫn, tin tức</p>
        </div>
        <button className="btn-primary-admin" onClick={handleCreate}>
          <Plus size={18} /> Viết Bài Mới
        </button>
      </div>

      {isEditing ? (
        <form className="blog-edit-form" onSubmit={handleSave}>
          <div className="form-header">
            <h3>{currentPost.id ? 'Chỉnh sửa bài viết' : 'Bài viết mới'}</h3>
            <div className="form-actions-top">
                <button type="button" className="btn-secondary-admin" onClick={() => setShowPreview(!showPreview)}>
                   {showPreview ? <FileText size={16} /> : <Eye size={16} />} {showPreview ? 'Sửa Nội Dung' : 'Xem Trước'}
                </button>
                <button type="button" className="admin-modal-close-btn" onClick={() => setIsEditing(false)}><X size={20} /></button>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-main-col">
              <div className="field-group">
                <label>Tiêu đề bài viết</label>
                <input 
                  type="text" 
                  value={currentPost.title}
                  onChange={(e) => setCurrentPost({ ...currentPost, title: e.target.value })}
                  onBlur={handleTitleBlur}
                  placeholder="Ví dụ: Cách chụp ảnh đẹp bằng Canon R50"
                  required
                />
              </div>

              <div className="field-group">
                <label>Nội dung (Markdown)</label>
                {!showPreview ? (
                  <div className="markdown-editor-wrapper">
                    <div className="markdown-toolbar">
                      <button type="button" onClick={() => insertShortcut('**', '**')} title="In đậm"><Bold size={16} /></button>
                      <button type="button" onClick={() => insertShortcut('*', '*')} title="In nghiêng"><Italic size={16} /></button>
                      <button type="button" onClick={() => insertShortcut('## ', '')} title="Tiêu đề"><Heading2 size={16} /></button>
                      <button type="button" onClick={() => insertShortcut('[', '](url)')} title="Chèn link"><LinkIcon size={16} /></button>
                      <div className="toolbar-sep"></div>
                      <span className="toolbar-hint">Tip: Xuống dòng 2 lần để bắt đầu đoạn mới</span>
                    </div>
                    <textarea 
                        id="content-editor"
                        className="content-textarea"
                        value={currentPost.content}
                        onChange={(e) => setCurrentPost({ ...currentPost, content: e.target.value })}
                        placeholder="Sử dụng Markdown để trình bày..."
                        required
                    />
                  </div>
                ) : (
                  <div className="preview-box">
                    <div className="markdown-preview post-article-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                            {currentPost.content || '*Chưa có nội dung...*'}
                        </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="form-side-col">
              <div className="field-group">
                <label>Đường dẫn tĩnh (Slug)</label>
                <input 
                  type="text" 
                  value={currentPost.slug}
                  onChange={(e) => setCurrentPost({ ...currentPost, slug: e.target.value })}
                  placeholder="cach-chup-anh-dep"
                  required
                />
              </div>

              <div className="field-group">
                <label>Ảnh bìa (URL)</label>
                <div className="url-input-box">
                    <ImageIcon size={16} />
                    <input 
                        type="url" 
                        value={currentPost.thumbnail_url}
                        onChange={(e) => setCurrentPost({ ...currentPost, thumbnail_url: e.target.value })}
                        placeholder="https://..."
                    />
                </div>
              </div>

              <div className="field-group">
                <label>Mô tả ngắn (Excerpt)</label>
                <textarea 
                  value={currentPost.excerpt}
                  onChange={(e) => setCurrentPost({ ...currentPost, excerpt: e.target.value })}
                  placeholder="Tóm tắt ngắn gọn bài viết..."
                  rows={4}
                />
              </div>

      <div className="field-group checkbox-group">
        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={currentPost.is_banner}
            onChange={(e) => setCurrentPost({ ...currentPost, is_banner: e.target.checked })}
          />
          <span>Đánh dấu là Banner (Trang chủ)</span>
        </label>
      </div>

      {currentPost.is_banner && (
        <div className="field-group animate-in">
          <label>Vị trí đặt Banner</label>
          <select 
            className="banner-slot-select"
            value={currentPost.banner_slot || ''}
            onChange={(e) => setCurrentPost({ ...currentPost, banner_slot: e.target.value })}
            required={currentPost.is_banner}
          >
            <option value="">-- Chọn vị trí --</option>
            <option value="hero">Hero Infographic (Trên cùng)</option>
            <option value="main">Main Banner (Poster lớn giữa)</option>
            <option value="sub1">Sub Banner 1 (Phải - Trên)</option>
            <option value="sub2">Sub Banner 2 (Phải - Dưới)</option>
          </select>
        </div>
      )}

              <button type="submit" className="btn-save-post">
                <Save size={18} /> {currentPost.id ? 'Cập Nhật Bài Viết' : 'Xuất Bản Ngay'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="posts-table-wrapper">
          <table className="posts-table">
            <thead>
              <tr>
                <th>Bài viết</th>
                <th>Trạng thái</th>
                <th>Lượt xem</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.id}>
                  <td>
                    <div className="post-info-cell">
                      <img src={post.thumbnail_url} alt="" />
                      <div>
                        <strong>{post.title}</strong>
                        <p>/{post.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="status-badges">
                      <span className={`status-badge ${post.status}`}>
                         {post.status === 'published' ? 'Công khai' : 'Bản nháp'}
                      </span>
                      {post.is_banner && <span className="status-badge banner">Banner</span>}
                    </div>
                  </td>
                  <td>
                    <div className="view-count-cell">
                      <Eye size={14} /> {post.views || 0}
                    </div>
                  </td>
                  <td>{new Date(post.created_at).toLocaleDateString('vi-VN')}</td>
                  <td className="actions-cell">
                    <button className="icon-btn-admin edit" onClick={() => handleEdit(post)} title="Sửa">
                      <Edit size={16} />
                    </button>
                    <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="icon-btn-admin view" title="Xem trên web">
                      <ExternalLink size={16} />
                    </a>
                    <button className="icon-btn-admin delete" onClick={() => handleDelete(post.id)} title="Xóa">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                   <td colSpan="4" className="empty-table">Chưa có bài viết nào. Hãy viết bài đầu tiên!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BlogManager;
