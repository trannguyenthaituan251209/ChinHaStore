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
  AlertCircle
} from 'lucide-react';
import Papa from 'papaparse';
import { adminService } from '../../services/adminService';
import '../../pages/AdminDashboard.css';

const DatabaseModifier = () => {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera', 'customer', 'booking'
  const [data, setData] = useState({ cameras: [], customers: [], bookings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [modalType, setModalType] = useState(null); // 'camera', 'customer', 'booking' or null
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
    price_4days_plus: ''
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
    } catch (err) {
      if (err.message.includes('violates foreign key constraint')) {
        alert('⚠️ Không thể xóa vĩnh viễn: Mục này đang có dữ liệu trong lịch sử thuê. Bạn nên dùng chức năng "Lưu trữ" thay vì Xóa.');
      } else {
        alert('Lỗi khi xóa: ' + err.message);
      }
    }
  };

  const handleToggleArchive = async (id, currentStatus) => {
    const newStatus = currentStatus === 'archived' ? 'active' : 'archived';
    try {
      await adminService.updateProductStatus(id, newStatus);
      fetchData();
    } catch (err) {
      alert('Lỗi khi thay đổi trạng thái: ' + err.message);
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
        price_4days_plus: item.price_4days_plus || '0'
      });
    }
    setModalType(type);
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
        price_4days_plus: '0'
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
    } catch (err) {
      alert('Lỗi khi lưu sản phẩm: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const ProductItem = ({ p }) => (
    <div className={`mini-item ${p.status === 'archived' ? 'item-archived' : ''}`}>
      <div className="mini-img-box">
        <Package size={20} />
        {p.image_url && <img src={p.image_url} alt="" />}
      </div>
      <div className="item-details" style={{flex: 1}}>
        <strong>{p.name} {p.status === 'archived' && <small>(Đã ẩn)</small>}</strong>
        <span>{new Intl.NumberFormat('vi-VN').format(p.price_1day)} VNĐ/Ngày</span>
      </div>
      <div className="item-actions">
        <button className="action-btn archive" onClick={() => handleToggleArchive(p.id, p.status)} title={p.status === 'archived' ? 'Khôi phục' : 'Lưu trữ'}>
          <FileUp size={16} />
        </button>
        <button className="action-btn edit" onClick={() => handleEdit('camera', p)} title="Sửa"><Edit3 size={16} /></button>
        <button className="action-btn delete" onClick={() => handleDelete('camera', p.id)} title="Xóa vĩnh viễn"><Trash2 size={16} /></button>
      </div>
    </div>
  );

  const CustomerItem = ({ c }) => (
    <div className="mini-item">
      <div className="mini-icon-circle">
        <UserIcon size={18} />
      </div>
      <div className="item-details" style={{flex: 1}}>
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
      <div className="item-details" style={{flex: 1}}>
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
        {loading && <p style={{textAlign: 'center', padding: '2rem'}}>Đang tải dữ liệu...</p>}
        {error && <p style={{textAlign: 'center', color: 'red', padding: '2rem'}}>{error}</p>}

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
                          // Map CSV rows to DB format
                          // Assuming simple mapping for this implementation
                          const mappedBookings = importData.map(row => ({
                            customerName: row.customerName || row.name || 'Khách',
                            phone: row.phone || row.sdt || '',
                            product_id: data.cameras[0]?.id, // Default to first for safety, user can refine
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

      {/* Simple Mutation UI placeholder or Link to dedicated managers */}
      {modalType === 'camera' && (
        <div className="admin-modal-overlay">
          <div className="admin-modal animate-in" style={{maxWidth: '500px'}}>
            <header className="modal-header">
              <h3>{currentItem ? 'SỬA THÔNG TIN MÁY' : 'THÊM MÁY MỚI'}</h3>
              <button className="close-btn" onClick={() => setModalType(null)}>×</button>
            </header>
            <form className="admin-form" onSubmit={handleSaveProduct}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Tên máy ảnh</label>
                  <input 
                    type="text" 
                    required 
                    value={productForm.name}
                    onChange={e => setProductForm({...productForm, name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Phân loại</label>
                  <select 
                    value={productForm.category}
                    onChange={e => setProductForm({...productForm, category: e.target.value})}
                  >
                    <option value="Mirrorless">Mirrorless</option>
                    <option value="Compact">Compact</option>
                    <option value="Action">Action</option>
                    <option value="Film">Film</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Ảnh URL</label>
                  <input 
                    type="text" 
                    placeholder="https://..."
                    value={productForm.image_url}
                    onChange={e => setProductForm({...productForm, image_url: e.target.value})}
                  />
                </div>
                
                <h4 className="span-all" style={{marginTop: '0.5rem', opacity: 0.8, fontSize: '0.9rem'}}>BẢNG GIÁ (VNĐ)</h4>
                
                <div className="form-group">
                  <label>6 Giờ</label>
                  <input 
                    type="text" 
                    value={productForm.price_6h}
                    onChange={e => setProductForm({...productForm, price_6h: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>1 Ngày</label>
                  <input 
                    type="text" 
                    value={productForm.price_1day}
                    onChange={e => setProductForm({...productForm, price_1day: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>2 Ngày</label>
                  <input 
                    type="text" 
                    value={productForm.price_2days}
                    onChange={e => setProductForm({...productForm, price_2days: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>3 Ngày</label>
                  <input 
                    type="text" 
                    value={productForm.price_3days}
                    onChange={e => setProductForm({...productForm, price_3days: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Ngày thứ 4+</label>
                  <input 
                    type="text" 
                    value={productForm.price_4days_plus}
                    onChange={e => setProductForm({...productForm, price_4days_plus: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setModalType(null)}>HỦY</button>
                <button type="submit" className="btn-save" disabled={isSaving}>
                  {isSaving ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Placeholder for others */}
      {(modalType === 'customer' || modalType === 'booking') && (
        <div className="admin-modal-overlay">
          <div className="admin-modal animate-in" style={{maxWidth: '400px'}}>
            <header className="modal-header">
              <h3>{currentItem ? 'CẬP NHẬT' : 'THÊM MỚI'}</h3>
              <button className="close-btn" onClick={() => setModalType(null)}>×</button>
            </header>
            <div style={{padding: '2rem', textAlign: 'center'}}>
              <p>Trình chỉnh sửa chi tiết cho <strong>{modalType}</strong> sẽ ra mắt ở phiên bản sau.</p>
              <button className="btn-save" style={{marginTop: '1.5rem'}} onClick={() => setModalType(null)}>Đã hiểu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseModifier;
