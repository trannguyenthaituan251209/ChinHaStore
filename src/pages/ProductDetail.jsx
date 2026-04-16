import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, Video, Zap, Maximize, Calendar, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { adminService } from '../services/adminService';
import ProductCard from '../components/ProductCard';
import './ProductDetail.css';

const ProductDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await adminService.getProductBySlug(slug);
                if (data) {
                    setProduct(data);
                    
                    // Fetch related products (same category)
                    const allProducts = await adminService.getAllProducts();
                    const related = allProducts
                        .filter(p => p.category === data.category && p.id !== data.id && p.status === 'active')
                        .slice(0, 4);
                    setRelatedProducts(related);
                }
            } catch (err) {
                console.error('Failed to fetch product details:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [slug]);

    if (loading) {
        return (
            <div className="admin-loading-page">
                <div className="spinner"></div>
                <span>Đang tải thông số máy...</span>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="container" style={{padding: '10rem 2rem', textAlign: 'center'}}>
                <h2>Sản phẩm không tồn tại hoặc đã ngừng kinh doanh</h2>
                <Link to="/all-camera" className="btn-save" style={{marginTop: '2rem', display: 'inline-block'}}>Quay lại kho máy</Link>
            </div>
        );
    }

    const formattedPrice = new Intl.NumberFormat('vi-VN').format(product.price1Day || 0);

    return (
        <div className="product-detail-page animate-in">
            {/* HERO SECTION */}
            <section className="product-detail-hero">
                <div className="product-detail-hero-content">
                    <div className="product-hero-info">
                        <Link to="/all-camera" className="back-to-catalog">
                            <ChevronLeft size={18} /> QUAY LẠI TẤT CẢ MÁY ẢNH
                        </Link>
                        <h1 className="product-detail-title">{product.name}</h1>
                        <div className="product-hero-badges">
                            <span className="product-badge">{product.category}</span>
                            <span className="product-badge">{product.mount || 'N/A Mount'}</span>
                        </div>
                        <div className="product-hero-price">
                            {formattedPrice}VNĐ <small>/Ngày</small>
                        </div>
                    </div>
                    <div className="product-hero-image">
                        <img src={product.designImage || product.image || '/assets/image/placeholder.png'} alt={product.name} />
                    </div>
                </div>
            </section>

            {/* BODY CONTENT */}
            <div className="product-detail-body">
                {/* Main Content */}
                <div className="product-description-container">
                    <h2>Giới thiệu sản phẩm</h2>
                    <div className="product-markdown-content">
                        {product.description ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                {product.description}
                            </ReactMarkdown>
                        ) : (
                            <p>Đang cập nhật nội dung giới thiệu chi tiết cho sản phẩm này.</p>
                        )}
                    </div>
                </div>

                {/* Sidebar Specs */}
                <aside className="product-sidebar-specs">
                    <div className="specs-card">
                        <h3>Thông số kỹ thuật</h3>
                        <div className="specs-list">
                            <div className="spec-item">
                                <span className="spec-label">Cảm biến</span>
                                <span className="spec-value">{product.sensor || 'Đang cập nhật'}</span>
                            </div>
                            <div className="spec-item">
                                <span className="spec-label">Quay Video</span>
                                <span className="spec-value">{product.videoRes || 'Đang cập nhật'}</span>
                            </div>
                            <div className="spec-item">
                                <span className="spec-label">Dải ISO</span>
                                <span className="spec-value">{product.isoRange || 'Đang cập nhật'}</span>
                            </div>
                            <div className="spec-item">
                                <span className="spec-label">Hệ ngàm</span>
                                <span className="spec-value">{product.mount || 'Đang cập nhật'}</span>
                            </div>
                        </div>

                        <button 
                            className="btn-book-now-fixed"
                            onClick={() => navigate(`/dat-lich?id=${product.id}`)}
                        >
                            ĐẶT LỊCH THUÊ NGAY
                        </button>
                    </div>
                </aside>
            </div>

            {/* RELATED PRODUCTS */}
            {relatedProducts.length > 0 && (
                <section className="related-machines-section">
                    <h2>SẢN PHẨM TƯƠNG TỰ</h2>
                    <div className="related-grid">
                        {relatedProducts.map(p => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default ProductDetail;
