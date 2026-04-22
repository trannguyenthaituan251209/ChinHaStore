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
    const [activeImage, setActiveImage] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await adminService.getProductBySlug(slug);
                if (data) {
                    setProduct(data);
                    setActiveImage(data.image || data.image_url);

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
            <div className="container" style={{ padding: '10rem 2rem', textAlign: 'center' }}>
                <h2>Sản phẩm không tồn tại hoặc đã ngừng kinh doanh</h2>
                <Link to="/all-camera" className="btn-save" style={{ marginTop: '2rem', display: 'inline-block' }}>Quay lại kho máy</Link>
            </div>
        );
    }

    const formattedPrice = new Intl.NumberFormat('vi-VN').format(product.price1Day || 0);

    // Prepare gallery images
    const gallery = [product.image || product.image_url, ...(product.gallery_images || [])].filter(Boolean);

    return (
        <div className="product-detail-page animate-in">
            <div className="product-detail-breadcrumb">
                <Link to="/">Trang chủ</Link> <span>&gt;</span> <Link to="/all-camera">Kho máy</Link> <span>&gt;</span> <span className="active">{product.name}</span>
            </div>

            <header className="product-detail-header">
                <h1 className="product-detail-main-title">{product.display_title || product.name}</h1>
                <div className="product-detail-meta">
                    <span className="author">Thai Tuan, {new Date().toLocaleDateString('vi-VN')}</span>
                </div>
            </header>

            <section className="product-detail-hero">
                <div className="product-detail-hero-content">
                    {/* LEFT: GALLERY COLUMN */}
                    <div className="product-gallery-container">
                        <div className={`thumbnail-list ${gallery.length > 3 ? 'scrollable' : ''}`}>
                            {gallery.map((img, idx) => (
                                <div 
                                    key={idx} 
                                    className={`thumb-item ${activeImage === img ? 'active' : ''}`}
                                    onClick={() => setActiveImage(img)}
                                >
                                    <img src={img} alt={`Thumbnail ${idx + 1}`} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CENTER: MAIN VISUAL */}
                    <div className="product-hero-visual">
                        <img 
                            src={activeImage || product.designImage || product.image || '/assets/image/placeholder.png'} 
                            alt={product.name} 
                            className="hero-main-img"
                        />
                    </div>

                    {/* RIGHT: SPECS & COMBO */}
                    <div className="product-hero-specs-panel">
                        <div className="specs-group">
                            <h3>THÔNG SỐ CHI TIẾT</h3>
                            <div className="specs-list-mini">
                                <div className="spec-row">
                                    <span className="label">Cảm biến:</span>
                                    <span className="value">{product.sensor || 'N/A'}</span>
                                </div>
                                <div className="spec-row">
                                    <span className="label">Khả năng quay video:</span>
                                    <span className="value">{product.videoRes || 'N/A'}</span>
                                </div>
                                <div className="spec-row">
                                    <span className="label">Dải ISO:</span>
                                    <span className="value">{product.isoRange || 'N/A'}</span>
                                </div>
                                <div className="spec-row">
                                    <span className="label">Hệ Ngàm:</span>
                                    <span className="value">{product.mount || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="combo-group">
                            <h3>COMBO THUÊ BAO GỒM</h3>
                            <div className="combo-items-grid">
                                {product.combo_items && product.combo_items.length > 0 ? (
                                    product.combo_items.map((item, idx) => (
                                        <div key={idx} className="combo-item">
                                            <div className="combo-icon">
                                                <img src={item.icon || "https://img.icons8.com/ios/50/000000/box.png"} alt={item.name} />
                                            </div>
                                            <span>{item.name}</span>
                                        </div>
                                    ))
                                ) : (
                                    <>
                                        <div className="combo-item">
                                            <div className="combo-icon"><img src="https://img.icons8.com/ios/50/000000/camera-bag.png" alt="Bag" /></div>
                                            <span>Túi đựng máy</span>
                                        </div>
                                        <div className="combo-item">
                                            <div className="combo-icon"><img src="https://img.icons8.com/ios/50/000000/sd-card.png" alt="SD" /></div>
                                            <span>Thẻ nhớ</span>
                                        </div>
                                        <div className="combo-item">
                                            <div className="combo-icon"><img src="https://img.icons8.com/ios/50/000000/memory-card-reader.png" alt="Reader" /></div>
                                            <span>Đầu đọc thẻ</span>
                                        </div>
                                        <div className="combo-item">
                                            <div className="combo-icon"><img src="https://img.icons8.com/ios/50/000000/battery-level.png" alt="Battery" /></div>
                                            <span>Pin máy</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="hero-price-action">
                            <div className="price-box">
                                <span className="price-val">{formattedPrice}VNĐ</span>
                                <span className="price-unit">/Ngày</span>
                            </div>
                            <button 
                                className="btn-book-hero"
                                onClick={() => navigate(`/dat-lich?id=${product.id}`)}
                            >
                                ĐẶT THUÊ NGAY
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* BODY CONTENT */}
            <div className="product-detail-body">
                {/* Main Content */}
                <div className="product-description-container">
                    <div className="description-header">
                        <h2>BÀI VIẾT GIỚI THIỆU</h2>
                    </div>
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
