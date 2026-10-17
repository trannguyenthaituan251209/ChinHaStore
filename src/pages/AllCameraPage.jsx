import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, Filter, ArrowUpDown, ChevronRight, LayoutGrid, List, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { adminService } from '../services/adminService';
import ProductCard from '../components/ProductCard';
import './AllCameraPage.css';

const AllCameraPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ counts: {}, hotProductId: null });

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [sortOrder, setSortOrder] = useState('default');
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchAllAndStats = async () => {
      try {
        const [pData, sData] = await Promise.all([
          adminService.getAllProducts(),
          adminService.getMonthlyProductStats()
        ]);
        setProducts(pData);
        setStats(sData);
      } catch (err) {
        console.error('Error fetching catalog or stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllAndStats();
  }, []);

  // Drive available filters from data
  const categories = useMemo(() => {
    const cats = products.map(p => p.category?.split(' / ')[0] || 'Khác');
    return ['All', ...new Set(cats)];
  }, [products]);

  const brands = useMemo(() => {
    const bds = products.map(p => p.name.split(' ')[0]);
    return ['All', ...new Set(bds)];
  }, [products]);

  // Filtering & Sorting Logic
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => p.status === 'active');

    // Search
    if (searchTerm) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category?.includes(selectedCategory));
    }

    // Brand
    if (selectedBrand !== 'All') {
      result = result.filter(p => p.name.startsWith(selectedBrand));
    }

    // Sorting
    const getPrice = (p) => Number(p.price1Day?.toString().replace(/\./g, '')) || 0;

    if (sortOrder === 'price-asc') {
      result.sort((a, b) => getPrice(a) - getPrice(b));
    } else if (sortOrder === 'price-desc') {
      result.sort((a, b) => getPrice(b) - getPrice(a));
    } else if (sortOrder === 'rating-desc') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [products, searchTerm, selectedCategory, selectedBrand, sortOrder]);

  // Đếm số filter đang active (để hiển thị badge khi collapsed)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedCategory !== 'All') count++;
    if (selectedBrand !== 'All') count++;
    return count;
  }, [searchTerm, selectedCategory, selectedBrand]);

  if (loading) return (
    <div className="catalog-loading">
      <div className="spinner"></div>
      <p>ĐANG TẢI KHO MÁY AUTHORITATIVE...</p>
    </div>
  );

  return (
    <div className="all-camera-page animate-in">
      <Helmet>
        <title>Kho Máy Ảnh | Thuê Máy Ảnh Buôn Ma Thuột - ChinHaStore</title>
        <link rel="canonical" href="https://chinhastore.com/all-camera" />
        <meta name="description" content="Khám phá kho máy ảnh tại Buôn Ma Thuột (BMT). Thuê Canon EOS R50, Ricoh GR IV, Fujifilm X100VI và nhiều dòng máy hot khác. Bảng giá thuê máy ảnh tốt nhất BMT." />
        <meta name="keywords" content="kho máy ảnh bmt, thuê canon r50 bmt, thuê fujifilm bmt, giá thuê máy ảnh buôn ma thuột, thuê máy ảnh fujifilm bmt" />

        {/* JSON-LD Product List Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": products.slice(0, 15).map((p, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "item": {
                "@type": "Product",
                "name": p.name,
                "image": p.image_url,
                "description": `Dịch vụ cho thuê ${p.name} uy tín tại Buôn Ma Thuột.`,
                "offers": {
                  "@type": "Offer",
                  "price": p.price_1day?.toString().replace(/\./g, '') || "0",
                  "priceCurrency": "VND",
                  "availability": "https://schema.org/InStock",
                  "seller": {
                    "@type": "LocalBusiness",
                    "name": "ChinHaStore"
                  }
                }
              }
            }))
          })}
        </script>
      </Helmet>
      {/* Breadcrumb / Top Bar */}
      <div className="catalog-header-bar">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">Trang chủ</Link>
            <ChevronRight size={14} />
            <span>Kho máy ảnh</span>
          </div>
          <h1 className="catalog-title">Tận hưởng tối đa với kho thiết bị đa dạng đang chờ bạn khám phá</h1>
        </div>
      </div>

      <div className="container catalog-container">
        {/* Sidebar Filters */}
        <aside className={`catalog-sidebar ${filterOpen ? 'filter-open' : 'filter-closed'}`}>

          {/* Mobile toggle bar — hit area toàn bộ thanh */}
          <button
            className="filter-toggle-bar"
            onClick={() => setFilterOpen(prev => !prev)}
            aria-expanded={filterOpen}
            aria-label="Mở/đóng bộ lọc"
          >
            <span className="filter-toggle-left">
              <SlidersHorizontal size={16} />
              <span>BỘ LỌC</span>
              {activeFilterCount > 0 && (
                <span className="filter-badge">{activeFilterCount}</span>
              )}
            </span>
            <ChevronDown
              size={18}
              className={`filter-chevron ${filterOpen ? 'rotated' : ''}`}
            />
          </button>

          {/* Nội dung filter — ẩn/hiện với animation */}
          <div className="filter-content">
            <div className="sidebar-section">
              <h3><Search size={16} /> TÌM KIẾM</h3>
              <div className="search-box-vip">
                <input
                  type="text"
                  placeholder="Tìm tên máy, dòng máy..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="sidebar-section">
              <h3><Filter size={16} /> PHÂN LOẠI</h3>
              <div className="filter-list">
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={selectedCategory === cat ? 'active' : ''}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat === 'All' ? 'Tất cả dòng máy' : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="sidebar-section">
              <h3>THƯƠNG HIỆU</h3>
              <div className="filter-list">
                {brands.map(brand => (
                  <button
                    key={brand}
                    className={selectedBrand === brand ? 'active' : ''}
                    onClick={() => setSelectedBrand(brand)}
                  >
                    {brand === 'All' ? 'Tất cả thương hiệu' : brand}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </aside>

        {/* Main Content */}
        <main className="catalog-content">
          <div className="catalog-controls">
            {/* View mode toggle */}
            <div className="view-modes">
              <button
                className={viewMode === 'grid' ? 'active' : ''}
                onClick={() => setViewMode('grid')}
                title="Dạng lưới"
              >
                <LayoutGrid size={17} />
              </button>
              <button
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => setViewMode('list')}
                title="Dạng danh sách"
              >
                <List size={17} />
              </button>
            </div>

            {/* Sort */}
            <div className="sort-box">
              <ArrowUpDown size={15} />
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="default">Sắp xếp mặc định</option>
                <option value="price-asc">Giá thấp đến cao</option>
                <option value="price-desc">Giá cao đến thấp</option>
                <option value="rating-desc">Đánh giá tốt nhất</option>
              </select>
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className={viewMode === 'grid' ? 'catalog-grid' : 'catalog-list'}>
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  monthlyCount={stats.counts[product.id] || 0}
                  isHot={stats.hotProductId === product.id}
                  viewMode={viewMode}
                />
              ))}
            </div>
          ) : (
            <div className="empty-results">
              <p>Không tìm thấy thiết bị phù hợp với lựa chọn của bạn.</p>
              <button onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setSelectedBrand('All'); }}>
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AllCameraPage;
