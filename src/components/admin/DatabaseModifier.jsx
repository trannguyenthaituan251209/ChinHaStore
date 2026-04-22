import React, { useState, useEffect } from 'react';
import {
  Camera,
  Users,
  Calendar,
  PlusCircle,
  Edit3,
  Trash2,
  Package,
  User as UserIcon,
  ShoppingBag,
  RefreshCcw,
  FileUp,
  CheckCircle,
  AlertCircle,
  Settings,
  FileText,
  Eye,
  Bold,
  Italic,
  Heading2,
  Link as LinkIcon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import Papa from 'papaparse';
import { adminService } from '../../services/adminService';
import '../../pages/AdminDashboard.css';

const DatabaseModifier = ({ showStatus }) => {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera', 'customer', 'booking'
  const [data, setData] = useState({ cameras: [], customers: [], bookings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [modalType, setModalType] = useState(null); // 'camera', 'customer', 'booking', 'desc_editor'
  const [currentItem, setCurrentItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Form States
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Mirrorless',
    image_url: '',
    price_6h: '',
    price_1day: '',
    price_2days: '',
    price_3days: '',
    price_4days_plus: '',
    quantity: 1,
    status: 'active',
    slug: '',
    description: '',
    sensor: '',
    videoRes: '',
    isoRange: '',
    mount: '',
    design_image_url: '',
    gallery_images: [],
    display_title: '',
    combo_items: []
  });

  const [customerForm, setCustomerForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    city: '',
    social: '',
    status: 'active'
  });

  const [bookingForm, setBookingForm] = useState({
    customerName: '',
    phone: '',
    product_id: '',
    start_time: '',
    end_time: '',
    total_price: '0',
    status: 'Pending',
    city: ''
  });

  // Import States
  const [importData, setImportData] = useState([]);
  const [importStatus, setImportStatus] = useState('idle'); // 'idle', 'review', 'importing', 'done'
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cameras, customers, bookings] = await Promise.all([
        adminService.getAllProducts(),
        adminService.getAllCustomers(),
        adminService.getAllBookings()
      ]);
      setData({ cameras, customers, bookings });
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tải dữ liệu từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (type, id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mục này? Vĩnh viễn xóa sạch dữ liệu liên quan!')) return;
    try {
      if (type === 'camera') await adminService.deleteProduct(id);
      if (type === 'customer') await adminService.deleteCustomer(id);
      if (type === 'booking') await adminService.deleteBooking(id);
      fetchData();
      showStatus('Đã xóa dữ liệu thành công', 'success');
    } catch (err) {
      if (err.message.includes('violates foreign key constraint')) {
        showStatus('⚠️ Không thể xóa vĩnh viễn: Mục này đang có dữ liệu trong lịch sử thuê. Bạn nên dùng chức năng "Lưu trữ" thay vì Xóa.', 'error');
      } else {
        showStatus('Lỗi khi xóa: ' + err.message, 'error');
      }
    }
  };

  const handleToggleArchive = async (id, currentStatus) => {
    const newStatus = currentStatus === 'archived' ? 'active' : 'archived';
    try {
      await adminService.updateProductStatus(id, newStatus);
      fetchData();
      showStatus('Đã thay đổi trạng thái lưu trữ', 'success');
    } catch (err) {
      showStatus('Lỗi khi thay đổi trạng thái: ' + err.message, 'error');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      await adminService.updateProductStatus(id, newStatus);
      fetchData();
      showStatus(newStatus === 'active' ? 'Đã cho phép hiển thị trên web' : 'Đã dừng hiển thị trên web', 'success');
    } catch (err) {
      showStatus('Lỗi khi thay đổi trạng thái: ' + err.message, 'error');
    }
  };

  const handleEdit = (type, item) => {
    setCurrentItem(item);
    if (type === 'camera') {
      setProductForm({
        name: item.name || '',
        category: item.category || 'Mirrorless',
        image_url: item.image_url || '',
        price_6h: item.price_6h || '0',
        price_1day: item.price_1day || '0',
        price_2days: item.price_2days || '0',
        price_3days: item.price_3days || '0',
        price_4days_plus: item.price_4days_plus || '0',
        quantity: item.quantity || 1,
        status: item.status || 'active',
        slug: item.slug || '',
        description: item.description || '',
        sensor: item.sensor || '',
        videoRes: item.videoRes || '',
        isoRange: item.isoRange || '',
        mount: item.mount || '',
        design_image_url: item.design_image_url || item.designImage || '',
        gallery_images: item.gallery_images || [],
        display_title: item.display_title || '',
        combo_items: item.combo_items || []
      });
    } else if (type === 'customer') {
      setCustomerForm({
        full_name: item.full_name || '',
        phone: item.phone || '',
        email: item.email || '',
        city: item.city || '',
        social: item.social || '',
        status: item.status || 'active'
      });
    } else if (type === 'booking') {
      const toLocalISO = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().slice(0, 16);
      };

      setBookingForm({
        customerName: item.customerName || '',
        phone: item.phone || '',
        product_id: item.product_id || '',
        start_time: toLocalISO(item.start_time),
        end_time: toLocalISO(item.end_time),
        total_price: item.totalPrice?.replace(/\./g, '') || item.total_price || '0',
        status: item.status || 'Pending',
        city: item.city || ''
      });
    }
    setModalType(type);
  };

  const handleEditDescription = (item) => {
    setCurrentItem(item);
    setProductForm({
      name: item.name || '',
      category: item.category || 'Mirrorless',
      image_url: item.image_url || '',
      price_6h: item.price_6h || '0',
      price_1day: item.price_1day || '0',
      price_2days: item.price_2days || '0',
      price_3days: item.price_3days || '0',
      price_4days_plus: item.price_4days_plus || '0',
      quantity: item.quantity || 1,
      status: item.status || 'active',
      slug: item.slug || '',
      description: item.description || '',
      sensor: item.sensor || '',
      videoRes: item.videoRes || '',
      isoRange: item.isoRange || '',
      mount: item.mount || '',
      design_image_url: item.design_image_url || item.designImage || '',
      gallery_images: item.gallery_images || [],
      display_title: item.display_title || '',
      combo_items: item.combo_items || []
    });
    setModalType('desc_editor');
  };

  const handleAdd = (type) => {
    setCurrentItem(null);
    if (type === 'camera') {
      setProductForm({
        name: '',
        category: 'Mirrorless',
        image_url: '',
        price_6h: '0',
        price_1day: '0',
        price_2days: '0',
        price_3days: '0',
        price_4days_plus: '0',
        quantity: 1,
        status: 'active',
        slug: '',
        description: '',
        sensor: '',
        videoRes: '',
        isoRange: '',
        mount: '',
        design_image_url: '',
        gallery_images: [],
        display_title: '',
        combo_items: []
      });
    } else if (type === 'customer') {
      setCustomerForm({
        full_name: '',
        phone: '',
        email: '',
        city: '',
        social: '',
        status: 'active'
      });
    } else if (type === 'booking') {
      const pad = (n) => n.toString().padStart(2, '0');
      const d1 = new Date();
      const d2 = new Date(); d2.setDate(d1.getDate() + 1);

      setBookingForm({
        customerName: '',
        phone: '',
        product_id: data.cameras[0]?.id || '',
        start_time: `${d1.getFullYear()}-${pad(d1.getMonth() + 1)}-${pad(d1.getDate())}T07:30`,
        end_time: `${d2.getFullYear()}-${pad(d2.getMonth() + 1)}-${pad(d2.getDate())}T07:30`,
        total_price: '0',
        status: 'Pending',
        city: ''
      });
    }
    setModalType(type);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (currentItem) {
        await adminService.updateProduct(currentItem.id, productForm);
      } else {
        await adminService.createProduct(productForm);
      }
      setModalType(null);
      fetchData();
      showStatus('Đã lưu dữ liệu sản phẩm', 'success');
    } catch (err) {
      showStatus('Lỗi khi lưu sản phẩm: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (currentItem) {
        await adminService.updateCustomer(currentItem.id, customerForm);
      } else {
        await adminService.createCustomer(customerForm);
      }
      setModalType(null);
      fetchData();
      showStatus('Đã lưu thông tin khách hàng', 'success');
    } catch (err) {
      showStatus('Lỗi khi lưu khách hàng: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBooking = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (currentItem) {
        await adminService.updateBooking(currentItem.id, {
          ...bookingForm,
          total_price: Number(bookingForm.total_price)
        });
      } else {
        await adminService.createBooking({
          ...bookingForm,
          total_price: Number(bookingForm.total_price),
          rentalType: 'Manual'
        });
      }
      setModalType(null);
      fetchData();
      showStatus('Đã lưu thông tin đặt lịch', 'success');
    } catch (err) {
      showStatus('Lỗi khi lưu đặt lịch: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const ProductItem = ({ p }) => (
    <div className={`mini-item-v2 ${['archived', 'disabled'].includes(p.status) ? 'item-archived' : ''}`}>
      <div className="item-main-info">
        <div className="item-thumbnail">
          {p.image_url ? (
            <img src={p.image_url} alt={p.name} />
          ) : (
            <Package size={24} color="#CCC" />
          )}
        </div>
        <div className="item-text">
          <div className="item-category">{p.category}</div>
          <h4 className="item-name">{p.name}</h4>
          <div className="item-meta">
            <span className="price-tag">{new Intl.NumberFormat('vi-VN').format(p.price_1day)} VNĐ</span>
            <span className="qty-badge">QTY: {p.quantity}</span>
          </div>
        </div>
      </div>

      <div className="list-quick-toggle">
        <span className={`toggle-status-text ${p.status === 'active' ? 'on' : 'off'}`}>
          {p.status === 'active' ? 'Đang cho thuê' : 'Ngừng cho thuê'}
        </span>
        <label className="switch-slim">
          <input
            type="checkbox"
            checked={p.status === 'active'}
            onChange={() => handleToggleStatus(p.id, p.status)}
            disabled={p.status === 'archived'}
          />
          <span className="slider"></span>
        </label>
      </div>

      <div className="item-actions">
        <button className="action-btn desc" onClick={() => handleEditDescription(p)} title="Viết mô tả & specs"><FileText size={16} /></button>
        <button className="action-btn edit" onClick={() => handleEdit('camera', p)} title="Sửa nhanh"><Edit3 size={16} /></button>
        <button className="action-btn delete" onClick={() => handleDelete('camera', p.id)} title="Xóa vĩnh viễn"><Trash2 size={16} /></button>
      </div>
    </div>
  );

  const CustomerItem = ({ c }) => (
    <div className="mini-item">
      <div className="mini-icon-circle">
        <UserIcon size={18} />
      </div>
      <div className="item-details" style={{ flex: 1 }}>
        <strong>{c.full_name}</strong>
        <span>{c.phone}</span>
      </div>
      <div className="item-actions">
        <button className="action-btn edit" onClick={() => handleEdit('customer', c)} title="Sửa"><Edit3 size={16} /></button>
        <button className="action-btn delete" onClick={() => handleDelete('customer', c.id)} title="Xóa"><Trash2 size={16} /></button>
      </div>
    </div>
  );

  const BookingItem = ({ b }) => (
    <div className="mini-item">
      <div className="mini-icon-circle highlight">
        <ShoppingBag size={18} />
      </div>
      <div className="item-details" style={{ flex: 1 }}>
        <strong>#{b.id.slice(0, 6)} - {b.customerName}</strong>
        <span>{b.productName} ({b.status})</span>
      </div>
      <div className="item-actions">
        <button className="action-btn edit" onClick={() => handleEdit('booking', b)} title="Sửa"><Edit3 size={16} /></button>
        <button className="action-btn delete" onClick={() => handleDelete('booking', b.id)} title="Xóa"><Trash2 size={16} /></button>
      </div>
    </div>
  );

  return (
    <div className="database-modifier animate-in">
      <div className="modifier-tabs">
        <button className={activeTab === 'camera' ? 'active' : ''} onClick={() => setActiveTab('camera')}>
          <Camera size={18} />
          <span>MÁY ẢNH</span>
        </button>
        <button className={activeTab === 'customer' ? 'active' : ''} onClick={() => setActiveTab('customer')}>
          <Users size={18} />
          <span>KHÁCH HÀNG</span>
        </button>
        <button className={activeTab === 'booking' ? 'active' : ''} onClick={() => setActiveTab('booking')}>
          <Calendar size={18} />
          <span>ĐẶT LỊCH</span>
        </button>
        <button className={activeTab === 'import' ? 'active' : ''} onClick={() => setActiveTab('import')}>
          <FileUp size={18} />
          <span>DỮ LIỆU</span>
        </button>
      </div>

      <div className="modifier-content">
        {loading && <p style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</p>}
        {error && <p style={{ textAlign: 'center', color: 'red', padding: '2rem' }}>{error}</p>}

        {!loading && !error && (
          <>
            {activeTab === 'camera' && (
              <div className="modifier-section">
                <div className="section-header">
                  <h3>Catalog Sản Phẩm</h3>
                  <div className="header-actions-group">
                    <label className="archive-toggle-label">
                      <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
                      Máy đã ẩn
                    </label>
                    <button className={`icon-btn refresh-btn ${loading ? 'syncing' : ''}`} title="Làm mới" onClick={fetchData}>
                      <RefreshCcw size={16} />
                    </button>
                    <button className="btn-add-manual" onClick={() => handleAdd('camera')}>
                      <PlusCircle size={18} />
                      THÊM MÁY
                    </button>
                  </div>
                </div>
                <div className="mini-list">
                  {data.cameras
                    .filter(p => showArchived || p.status !== 'archived')
                    .map(p => <ProductItem key={p.id} p={p} />)}
                  {data.cameras.length === 0 && <p className="empty-msg">Chưa có máy ảnh nào.</p>}
                </div>
              </div>
            )}

            {activeTab === 'customer' && (
              <div className="modifier-section">
                <div className="section-header">
                  <h3>Cơ Sở Dữ Liệu Khách</h3>
                  <div className="header-actions-group">
                    <button className={`icon-btn refresh-btn ${loading ? 'syncing' : ''}`} title="Làm mới" onClick={fetchData}>
                      <RefreshCcw size={16} />
                    </button>
                    <button className="btn-add-manual" onClick={() => handleAdd('customer')}>
                      <PlusCircle size={18} />
                      THÊM KHÁCH
                    </button>
                  </div>
                </div>
                <div className="mini-list">
                  {data.customers.map(c => <CustomerItem key={c.id} c={c} />)}
                  {data.customers.length === 0 && <p className="empty-msg">Chưa có khách hàng nào.</p>}
                </div>
              </div>
            )}

            {activeTab === 'booking' && (
              <div className="modifier-section">
                <div className="section-header">
                  <h3>Nhật Ký Đặt Lịch</h3>
                  <div className="header-actions-group">
                    <button className={`icon-btn refresh-btn ${loading ? 'syncing' : ''}`} title="Làm mới" onClick={fetchData}>
                      <RefreshCcw size={16} />
                    </button>
                    <button className="btn-add-manual" onClick={() => handleAdd('booking')}>
                      <PlusCircle size={18} />
                      THÊM ĐƠN
                    </button>
                  </div>
                </div>
                <div className="mini-list">
                  {data.bookings.map(b => <BookingItem key={b.id} b={b} />)}
                  {data.bookings.length === 0 && <p className="empty-msg">Chưa có đơn đặt lịch nào.</p>}
                </div>
              </div>
            )}

            {activeTab === 'import' && (
              <div className="modifier-section import-center animate-in">
                <div className="section-header">
                  <h3>Trung Tâm Di Trú Dữ Liệu</h3>
                </div>

                {importStatus === 'idle' && (
                  <div className="import-drop-zone">
                    <FileUp size={48} />
                    <h4>Kéo thả file CSV chứa dữ liệu đặt lịch</h4>
                    <p>Hệ thống sẽ tự động ánh xạ cột Khách hàng, SĐT và Thiết bị.</p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          Papa.parse(file, {
                            header: true,
                            complete: (results) => {
                              setImportData(results.data.filter(row => row.customerName || row.phone));
                              setImportStatus('review');
                            }
                          });
                        }
                      }}
                    />
                  </div>
                )}

                {importStatus === 'review' && (
                  <div className="import-review-box animate-in">
                    <header className="review-header">
                      <span>Đã tìm thấy <strong>{importData.length}</strong> bản ghi.</span>
                      <div className="review-actions">
                        <button className="btn-cancel" onClick={() => setImportStatus('idle')}>Hủy</button>
                        <button className="btn-save" onClick={async () => {
                          setImportStatus('importing');
                          const mappedBookings = importData.map(row => ({
                            customerName: row.customerName || row.name || 'Khách',
                            phone: row.phone || row.sdt || '',
                            product_id: data.cameras[0]?.id, 
                            start_time: row.start_time || row.ngay_thue,
                            end_time: row.end_time || row.ngay_tra,
                            status: 'Returned',
                            source: 'LEGACY_IMPORT',
                            total_price: row.total_price || row.gia || 0
                          }));

                          const result = await adminService.bulkImportBookings(mappedBookings);
                          setImportResults(result);
                          setImportStatus('done');
                          fetchData();
                        }}>
                          BẮT ĐẦU DI TRÚ
                        </button>
                      </div>
                    </header>
                    <div className="import-preview-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Khách hàng</th>
                            <th>SĐT</th>
                            <th>Bắt đầu</th>
                            <th>Kết thúc</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importData.slice(0, 5).map((row, idx) => (
                            <tr key={idx}>
                              <td>{row.customerName || row.name}</td>
                              <td>{row.phone || row.sdt}</td>
                              <td>{row.start_time || row.ngay_thue}</td>
                              <td>{row.end_time || row.ngay_tra}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {importData.length > 5 && <p className="more-rows">... và {importData.length - 5} dòng khác.</p>}
                    </div>
                  </div>
                )}

                {importStatus === 'importing' && (
                  <div className="import-loading-box">
                    <div className="vip-spinner"></div>
                    <p>Đang xử lý di trú dữ liệu...</p>
                    <small>Vui lòng không đóng trình duyệt.</small>
                  </div>
                )}

                {importStatus === 'done' && importResults && (
                  <div className="import-result-box animate-in">
                    <CheckCircle size={48} color="#4CAF50" />
                    <h3>Di trú hoàn tất!</h3>
                    <div className="result-stats">
                      <div className="stat"><span>Thành công:</span> <strong>{importResults.success}</strong></div>
                      <div className="stat"><span>Tổng số:</span> <strong>{importResults.total}</strong></div>
                    </div>
                    {importResults.errors.length > 0 && (
                      <div className="result-errors">
                        <AlertCircle size={14} />
                        <span>Có {importResults.errors.length} lỗi xảy ra trong quá trình nạp.</span>
                      </div>
                    )}
                    <button className="btn-save" onClick={() => setImportStatus('idle')}>XONG</button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {modalType === 'camera' && (
        <div className="admin-modal-overlay">
          <div className="admin-modal animate-in" style={{ maxWidth: '500px' }}>
            <header className="modal-header">
              <h3>{currentItem ? 'SỬA THÔNG TIN MÁY' : 'THÊM MÁY MỚI'}</h3>
              <button className="close-btn" onClick={() => setModalType(null)}>×</button>
            </header>
            <form className="admin-form" onSubmit={handleSaveProduct}>
              <div className="product-form-layout">
                <div className="form-section-group">
                  <div className="form-group full-width">
                    <label>Tên máy ảnh</label>
                    <input
                      type="text"
                      required
                      value={productForm.name}
                      onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                      placeholder="VD: Canon EOS R50"
                    />
                  </div>

                  <div className="form-row-multi">
                    <div className="form-group">
                      <label>Phân loại</label>
                      <select
                        value={productForm.category}
                        onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                      >
                        <option value="Mirrorless">Mirrorless</option>
                        <option value="Compact">Compact</option>
                        <option value="Action">Action</option>
                        <option value="Film">Film</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Số lượng máy</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={productForm.quantity}
                        onChange={e => setProductForm({ ...productForm, quantity: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>Ảnh bìa (URL)</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={productForm.image_url}
                      onChange={e => setProductForm({ ...productForm, image_url: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <div className="toggle-switch-container" onClick={(e) => {
                      if (e.target.tagName !== 'INPUT') {
                        setProductForm({ ...productForm, status: productForm.status === 'active' ? 'disabled' : 'active' });
                      }
                    }}>
                      <div className="toggle-label-text">
                        <span className="main-label">Hiển thị trên Website</span>
                        <span className="sub-label">Cho phép khách hàng nhìn thấy và đặt thuê máy này</span>
                      </div>
                      <div className="switch">
                        <input
                          type="checkbox"
                          checked={productForm.status === 'active'}
                          onChange={(e) => setProductForm({ ...productForm, status: e.target.checked ? 'active' : 'disabled' })}
                        />
                        <span className="slider"></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-section-group">
                  <h4 className="section-subtitle-admin">GIÁ THUÊ (VNĐ)</h4>
                  <div className="form-row-multi">
                    <div className="form-group">
                      <label>6 Giờ</label>
                      <input type="text" value={productForm.price_6h} onChange={e => setProductForm({...productForm, price_6h: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>1 Ngày</label>
                      <input type="text" value={productForm.price_1day} onChange={e => setProductForm({...productForm, price_1day: e.target.value})} />
                    </div>
                  </div>
                  <div className="form-row-multi">
                    <div className="form-group">
                      <label>2 Ngày</label>
                      <input type="text" value={productForm.price_2days} onChange={e => setProductForm({...productForm, price_2days: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>3 Ngày</label>
                      <input type="text" value={productForm.price_3days} onChange={e => setProductForm({...productForm, price_3days: e.target.value})} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Từ ngày thứ 4</label>
                    <input type="text" value={productForm.price_4days_plus} onChange={e => setProductForm({...productForm, price_4days_plus: e.target.value})} />
                  </div>
                </div>
              </div>
              <footer className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setModalType(null)}>Hủy</button>
                <button type="submit" className="btn-save" disabled={isSaving}>
                  {isSaving ? 'ĐANG LƯU...' : 'LƯU SẢN PHẨM'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {modalType === 'customer' && (
        <div className="admin-modal-overlay">
          <div className="admin-modal animate-in" style={{ maxWidth: '500px' }}>
            <header className="modal-header">
              <h3>{currentItem ? 'SỬA THÔNG TIN KHÁCH' : 'THÊM KHÁCH MỚI'}</h3>
              <button className="close-btn" onClick={() => setModalType(null)}>×</button>
            </header>
            <form className="admin-form" onSubmit={handleSaveCustomer}>
              <div className="form-group">
                <label>Họ và tên</label>
                <input type="text" required value={customerForm.full_name} onChange={e => setCustomerForm({...customerForm, full_name: e.target.value})} />
              </div>
              <div className="form-row-multi">
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input type="text" required value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={customerForm.email} onChange={e => setCustomerForm({...customerForm, email: e.target.value})} />
                </div>
              </div>
              <footer className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setModalType(null)}>Hủy</button>
                <button type="submit" className="btn-save" disabled={isSaving}>LƯU THÔNG TIN</button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {modalType === 'booking' && (
        <div className="admin-modal-overlay">
          <div className="admin-modal animate-in" style={{ maxWidth: '500px' }}>
            <header className="modal-header">
              <h3>{currentItem ? 'SỬA ĐƠN ĐẶT LỊCH' : 'TẠO ĐƠN THỦ CÔNG'}</h3>
              <button className="close-btn" onClick={() => setModalType(null)}>×</button>
            </header>
            <form className="admin-form" onSubmit={handleSaveBooking}>
              <div className="form-group">
                <label>Tên khách hàng</label>
                <input type="text" required value={bookingForm.customerName} onChange={e => setBookingForm({...bookingForm, customerName: e.target.value})} />
              </div>
              <div className="form-group">
                <label>SĐT</label>
                <input type="text" required value={bookingForm.phone} onChange={e => setBookingForm({...bookingForm, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Thiết bị thuê</label>
                <select value={bookingForm.product_id} onChange={e => setBookingForm({...bookingForm, product_id: e.target.value})}>
                  {data.cameras.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-row-multi">
                <div className="form-group">
                  <label>Bắt đầu</label>
                  <input type="datetime-local" value={bookingForm.start_time} onChange={e => setBookingForm({...bookingForm, start_time: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Kết thúc</label>
                  <input type="datetime-local" value={bookingForm.end_time} onChange={e => setBookingForm({...bookingForm, end_time: e.target.value})} />
                </div>
              </div>
              <footer className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setModalType(null)}>Hủy</button>
                <button type="submit" className="btn-save" disabled={isSaving}>LƯU ĐƠN HÀNG</button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {modalType === 'desc_editor' && (
        <div className="admin-modal-overlay">
          <div className="admin-modal full-editor-modal animate-in">
            <header className="modal-header">
              <div className="header-left">
                <FileText size={20} />
                <h3>SOẠN THẢO CHI TIẾT: {productForm.name}</h3>
              </div>
              <div className="header-actions">
                <button type="button" className="btn-save-top" onClick={handleSaveProduct} disabled={isSaving}>
                  {isSaving ? 'ĐANG LƯU...' : 'LƯU TẤT CẢ'}
                </button>
                <button className="close-btn" onClick={() => setModalType(null)}>×</button>
              </div>
            </header>

            <div className="full-editor-form">
              <div className="full-editor-layout">
                <div className="editor-left">
                  <div className="editor-config-grid">
                    <div className="form-group full-width">
                      <label>Tiêu đề hiển thị (H1 - Heading chính của trang chi tiết)</label>
                      <input 
                        type="text" 
                        value={productForm.display_title} 
                        onChange={e => setProductForm({...productForm, display_title: e.target.value})}
                        placeholder="VD: Máy ảnh Canon EOS R50 - Chiếc máy ảnh quốc dân..."
                      />
                    </div>
                    <div className="form-group">
                      <label>URL Slug (SEO)</label>
                      <div className="slug-input-wrapper">
                        <input 
                          type="text" 
                          value={productForm.slug} 
                          onChange={e => setProductForm({...productForm, slug: e.target.value})}
                          placeholder="canon-eos-r50"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Link Banner Poster (16:9)</label>
                      <input 
                        type="text" 
                        value={productForm.design_image_url}
                        onChange={e => setProductForm({...productForm, design_image_url: e.target.value})}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="editor-config-grid tech-specs-editor-grid">
                    <div className="form-group">
                      <label>Cảm biến</label>
                      <input type="text" value={productForm.sensor} onChange={e => setProductForm({...productForm, sensor: e.target.value})} placeholder="Full-frame..." />
                    </div>
                    <div className="form-group">
                      <label>Video</label>
                      <input type="text" value={productForm.videoRes} onChange={e => setProductForm({...productForm, videoRes: e.target.value})} placeholder="4K60p..." />
                    </div>
                    <div className="form-group">
                      <label>ISO</label>
                      <input type="text" value={productForm.isoRange} onChange={e => setProductForm({...productForm, isoRange: e.target.value})} placeholder="100-51200..." />
                    </div>
                    <div className="form-group">
                      <label>Hệ ngàm</label>
                      <input type="text" value={productForm.mount} onChange={e => setProductForm({...productForm, mount: e.target.value})} placeholder="RF, E-mount..." />
                    </div>
                  </div>

                  <div className="editor-config-grid gallery-editor-grid" style={{gridTemplateColumns: '1fr'}}>
                    <div className="form-group full-width">
                      <div className="gallery-header-admin">
                        <span>ẢNH MÔ TẢ CHI TIẾT (GALLERY)</span>
                        <button 
                          type="button" 
                          className="btn-add-gallery"
                          onClick={() => {
                            const currentGallery = Array.isArray(productForm.gallery_images) ? productForm.gallery_images : [];
                            setProductForm({...productForm, gallery_images: [...currentGallery, '']});
                          }}
                        >
                          <PlusCircle size={14} /> Thêm ảnh
                        </button>
                      </div>
                      <div className="gallery-inputs-list">
                        {(productForm.gallery_images || []).map((url, idx) => (
                          <div key={idx} className="gallery-input-row">
                            <input 
                              type="text" 
                              value={url} 
                              placeholder={`Link ảnh mô tả ${idx + 1} (URL)`}
                              onChange={(e) => {
                                const newGallery = [...productForm.gallery_images];
                                newGallery[idx] = e.target.value;
                                setProductForm({...productForm, gallery_images: newGallery});
                              }}
                            />
                            <button 
                              type="button" 
                              className="btn-remove-gallery"
                              onClick={() => {
                                const newGallery = productForm.gallery_images.filter((_, i) => i !== idx);
                                setProductForm({...productForm, gallery_images: newGallery});
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="editor-config-grid combo-editor-grid" style={{gridTemplateColumns: '1fr', marginTop: '2rem', paddingTop: '2rem', borderTop: '1px dashed #eee'}}>
                    <div className="form-group full-width">
                      <div className="gallery-header-admin">
                        <span>PHỤ KIỆN COMBO ĐI KÈM</span>
                        <button 
                          type="button" 
                          className="btn-add-gallery"
                          onClick={() => {
                            const currentCombo = Array.isArray(productForm.combo_items) ? productForm.combo_items : [];
                            setProductForm({...productForm, combo_items: [...currentCombo, { name: '', icon: '' }]});
                          }}
                        >
                          <PlusCircle size={14} /> Thêm phụ kiện
                        </button>
                      </div>
                      <div className="combo-inputs-list">
                        {(productForm.combo_items || []).map((item, idx) => (
                          <div key={idx} className="gallery-input-row" style={{marginBottom: '0.5rem'}}>
                            <input 
                              type="text" 
                              style={{flex: 1}}
                              value={item.name} 
                              placeholder="Tên phụ kiện (VD: Túi đựng)"
                              onChange={(e) => {
                                const newCombo = [...productForm.combo_items];
                                newCombo[idx] = { ...newCombo[idx], name: e.target.value };
                                setProductForm({...productForm, combo_items: newCombo});
                              }}
                            />
                            <input 
                              type="text" 
                              style={{flex: 2}}
                              value={item.icon} 
                              placeholder="Link Icon/Ảnh (URL)"
                              onChange={(e) => {
                                const newCombo = [...productForm.combo_items];
                                newCombo[idx] = { ...newCombo[idx], icon: e.target.value };
                                setProductForm({...productForm, combo_items: newCombo});
                              }}
                            />
                            <button 
                              type="button" 
                              className="btn-remove-gallery"
                              onClick={() => {
                                const newCombo = productForm.combo_items.filter((_, i) => i !== idx);
                                setProductForm({...productForm, combo_items: newCombo});
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        {(!productForm.combo_items || productForm.combo_items.length === 0) && (
                          <p className="no-gallery-hint">Chưa có phụ kiện combo nào được thêm.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="editor-main-container">
                    <label>Nội dung giới thiệu (Markdown)</label>
                    <textarea 
                      className="main-markdown-textarea"
                      value={productForm.description}
                      onChange={e => setProductForm({...productForm, description: e.target.value})}
                      placeholder="Viết bài giới thiệu thiết bị tại đây..."
                    />
                  </div>
                </div>

                <div className="editor-right">
                  <div className="preview-header">
                    <Eye size={16} />
                    <span>XEM TRƯỚC NỘI DUNG</span>
                  </div>
                  <div className="preview-content">
                    {productForm.design_image_url && (
                      <div className="preview-poster">
                        <img src={productForm.design_image_url} alt="Poster" />
                      </div>
                    )}
                    <h1 className="preview-title">{productForm.display_title || productForm.name || 'Tiêu đề sản phẩm'}</h1>
                    <div className="preview-markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                        {productForm.description || '_Chưa có nội dung mô tả._'}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseModifier;
