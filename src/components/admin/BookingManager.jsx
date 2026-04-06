import React, { useState } from 'react';
import { 
  Search, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  FileText,
  Clock,
  RefreshCcw,
  CheckCircle
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { supabase } from '../../utils/supabase';
import html2canvas from 'html2canvas';
import '../../pages/AdminDashboard.css';

const BookingManager = ({ showStatus, searchQuery, setSearchQuery }) => {
  const [activeSubtab, setActiveSubtab] = useState('renting'); // 'renting', 'future', 'past', 'bills'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [depositProperty, setDepositProperty] = useState('CĂN CƯỚC CÔNG DÂN');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [productList, setProductList] = useState([]);
  const [conflictError, setConflictError] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter Categories
  const [filterDevice, setFilterDevice] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Pagination for History (Large datasets)
  const [historyData, setHistoryData] = useState([]);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const PAGE_SIZE = 50;

  // Reload helper
  const reloadBookings = async () => {
    try {
      setLoading(true);
      const [bookings, productsData] = await Promise.all([
        adminService.getAllBookings(),
        adminService.getAllProducts()
      ]);
      setData(bookings);
      setProductList(productsData);
      
      // Default product for form
      if (productsData.length > 0) {
        setFormData(prev => ({ ...prev, product_id: productsData[0].id }));
      }
    } catch (err) {
      setError('Lỗi khi cập nhật danh sách.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    reloadBookings();
    
    // Real-time synchronization
    const channel = supabase
      .channel('booking_manager_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        reloadBookings();
        if (activeSubtab === 'past') fetchHistoryPage(historyPage);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSubtab, historyPage]);

  // Specialized History Fetcher (Server-side)
  const fetchHistoryPage = async (page) => {
    try {
      setIsHistoryLoading(true);
      const result = await adminService.getBookingsPaginated(page, PAGE_SIZE, { status: 'Returned' });
      setHistoryData(result.data);
      setHistoryCount(result.count);
    } catch (err) {
      setError('Lỗi khi tải lịch sử.');
    } finally {
      setIsHistoryLoading(false);
    }
  };

  React.useEffect(() => {
    if (activeSubtab === 'past') {
      fetchHistoryPage(historyPage);
    }
  }, [activeSubtab, historyPage]);

  // Filter logic
  const filteredData = data.filter(b => {
    const matchesSearch = 
      (b.customerName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (b.phone || "").includes(searchQuery) ||
      (b.id?.toLowerCase() || "").includes(searchQuery.toLowerCase());

    // 2. Main Logic Subtabs
    let matchesTab = true;
    const now = new Date();
    const isActuallyRenting = (b) => {
      const start = new Date(b.start_time);
      const end = new Date(b.end_time);
      return b.status === 'Confirmed' && start <= now && end >= now;
    };

    if (activeSubtab === 'renting') matchesTab = isActuallyRenting(b);
    else if (activeSubtab === 'future') {
      const start = new Date(b.start_time);
      matchesTab = (b.status === 'Pending' || (b.status === 'Confirmed' && start > now));
    }
    else if (activeSubtab === 'past') matchesTab = b.status === 'Returned';
    
    // 3. New Advanced Categories (Device, Source, Status)
    const matchesDevice = filterDevice === 'all' || b.product_id === filterDevice;
    const matchesSource = filterSource === 'all' || b.source === filterSource;
    const matchesStatus = filterStatus === 'all' || b.status === filterStatus;

    return matchesSearch && matchesTab && matchesDevice && matchesSource && matchesStatus;
  });

  const pendingWebsiteBookings = data.filter(b => b.source === 'Website' && !b.is_seen && b.status === 'Pending');
  
  // The main table should only show acknowledged bookings, non-website bookings, or already processed bookings
  const mainListData = filteredData.filter(b => b.is_seen || b.source !== 'Website' || b.status !== 'Pending');

  const handleMarkAsSeen = async (id) => {
    try {
      await adminService.markBookingAsSeen(id);
      showStatus('Đã đánh dấu xem đơn hàng', 'success');
      reloadBookings();
    } catch (err) {
      showStatus('Lỗi khi đánh dấu đã xem: ' + err.message, 'error');
    }
  };

  const resetFilters = () => {
    setFilterDevice('all');
    setFilterSource('all');
    setFilterStatus('all');
    setSearchQuery('');
  };

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Vừa xong';
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Khoảng ${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `Khoảng ${days} ngày trước`;
  };

  const handleBillView = (booking) => {
    setSelectedBooking(booking);
    setDiscountAmount('0');
    setIsBillOpen(true);
  };

  const handleDownloadBill = async () => {
    const invoiceElement = document.querySelector('.bill-invoice-v2');
    if (!invoiceElement) return;

    try {
      showStatus('Đang tạo ảnh hóa đơn...', 'success');
      const canvas = await html2canvas(invoiceElement, {
        scale: 2, 
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Hoa_Don_${selectedBooking?.id?.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      showStatus('Lỗi khi xuất hóa đơn: ' + err.message, 'error');
    }
  };

  const handleEdit = (booking) => {
    const toLocalISO = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const offset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    };

    setFormData({
      id: booking.id,
      customerName: booking.customerName,
      phone: booking.phone,
      product_id: booking.product_id,
      start_time: toLocalISO(booking.start_time), 
      end_time: toLocalISO(booking.end_time),
      total_price: booking.totalPrice?.replace(/\./g, '') || '0',
      status: booking.status
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn đặt lịch này?')) {
      try {
        await adminService.deleteBooking(id);
        showStatus('Đã xóa đơn đặt lịch', 'success');
        reloadBookings();
      } catch (err) {
        showStatus('Lỗi khi xóa: ' + err.message, 'error');
      }
    }
  };

  // Global Keyboard Listener for Modals
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsBillOpen(false);
        setIsModalOpen(false);
      }
      if (e.key === 'Enter') {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT' && e.target.tagName !== 'TEXTAREA') {
          setIsBillOpen(false);
          setIsModalOpen(false);
        }
      }
    };
    
    if (isBillOpen || isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBillOpen, isModalOpen]);

  // Form State
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    product_id: '',
    start_time: '',
    end_time: '',
    total_price: '0',
    status: 'Pending'
  });

  // Auto-calculate price & Check Live Conflict
  React.useEffect(() => {
    const checkLiveLogic = async () => {
      if (formData.product_id && formData.start_time && formData.end_time && productList.length > 0) {
        const product = productList.find(p => p.id === formData.product_id);
        
        // 1. Calculate Price
        if (product) {
          const calculated = adminService.calculatePrice(product, formData.start_time, formData.end_time);
          setFormData(prev => ({ ...prev, total_price: calculated.toString() }));
        }

        // 2. Check Conflict (Perform check regardless of status to warn admin of busy units)
        setIsChecking(true);
        try {
          const availableUnitId = await adminService.findAvailableUnit(
            formData.product_id, 
            formData.start_time, 
            formData.end_time,
            formData.id || null
          );
          
          if (!availableUnitId) {
            setConflictError('Thời gian bạn thêm không khả dụng');
            // Fetch detailed conflicts to help the admin
            const conflictDetails = await adminService.getDetailedConflicts(
              formData.product_id,
              formData.start_time,
              formData.end_time,
              formData.id || null
            );
            setConflicts(conflictDetails);
          } else {
            setConflictError(null);
            setConflicts([]);
          }
        } catch (err) {
          console.error('Live check error:', err);
        } finally {
          setIsChecking(false);
        }
      } else {
        setConflictError(null);
        setConflicts([]);
      }
    };

    checkLiveLogic();
  }, [formData.product_id, formData.start_time, formData.end_time, formData.status, productList]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const start = new Date(formData.start_time);
    const end = new Date(formData.end_time);

    // Validation
    if (end < start) {
      showStatus('LỖI: Ngày kết thúc không thể trước ngày bắt đầu.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Ensure customer identity is resolved/updated
      const customerId = await adminService.getOrCreateCustomer({
        phone: formData.phone,
        full_name: formData.customerName
      });

      if (formData.id) {
        // 2. Specialized Update with Identity re-mapping
        await adminService.updateBooking(formData.id, {
          customer_id: customerId, // Support potential re-mapping
          product_id: formData.product_id, // Support product correction
          start_time: formData.start_time,
          end_time: formData.end_time,
          total_price: Number(formData.total_price),
          status: formData.status
        });
      } else {
        // 3. Specialized Create
        await adminService.createBooking({
          ...formData,
          rentalType: 'Manual',
          total_price: Number(formData.total_price)
        });
      }
      setIsModalOpen(false);
      showStatus('Đã lưu thông tin đặt lịch', 'success');
      reloadBookings();
      if (activeSubtab === 'past') fetchHistoryPage(historyPage);
    } catch (err) {
      showStatus('Lỗi khi lưu: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="booking-manager animate-in">
      
      <div className="manager-toolbar">
        <div className="manager-toolbar-top">
          <div className="manager-subtabs">
            <button className={activeSubtab === 'renting' ? 'active' : ''} onClick={() => { setActiveSubtab('renting'); resetFilters(); }}>Đang thuê</button>
            <button className={activeSubtab === 'future' ? 'active' : ''} onClick={() => { setActiveSubtab('future'); resetFilters(); }}>
              Sắp tới
              {pendingWebsiteBookings.length > 0 && <span className="tab-badge">{pendingWebsiteBookings.length}</span>}
            </button>
            <button className={activeSubtab === 'past' ? 'active' : ''} onClick={() => { setActiveSubtab('past'); resetFilters(); }}>Lịch sử</button>
            <button className={activeSubtab === 'bills' ? 'active' : ''} onClick={() => { setActiveSubtab('bills'); resetFilters(); }}>Hóa đơn</button>
          </div>

          <div className="manager-search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Tìm theo Tên, SĐT, Mã đơn..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="manager-toolbar-actions">
            <button 
              className={`icon-btn refresh-btn ${loading || isHistoryLoading ? 'syncing' : ''}`} 
              title="Làm mới dữ liệu"
              onClick={() => {
                if (activeSubtab === 'past') fetchHistoryPage(historyPage);
                else reloadBookings();
              }}
            >
              <RefreshCcw size={18} />
            </button>
            
            <button className="btn-add-manual" onClick={() => { 
              const pad = (n) => n.toString().padStart(2, '0');
              const d1 = new Date();
              const d2 = new Date(); d2.setDate(d1.getDate() + 1);
              const startStr = `${d1.getFullYear()}-${pad(d1.getMonth()+1)}-${pad(d1.getDate())}T07:00`;
              const endStr = `${d2.getFullYear()}-${pad(d2.getMonth()+1)}-${pad(d2.getDate())}T07:00`;
              
              // If start_time is in the past, default to "Returned" (Đã trả máy)
              const isPast = d1 < new Date();
              const defaultStatus = isPast ? 'Returned' : 'Pending';

              setFormData({ 
                customerName: '', 
                phone: '', 
                product_id: productList[0]?.id || '', 
                start_time: startStr, 
                end_time: endStr, 
                total_price: '0', 
                status: defaultStatus 
              }); 
              setIsModalOpen(true); 
            }}>
              <PlusCircle size={18} />
              Thêm đặt lịch
            </button>
          </div>
        </div>

        <div className="manager-filters-row animate-in">
          <div className="filter-group">
            <label>Thiết bị:</label>
            <select value={filterDevice} onChange={(e) => setFilterDevice(e.target.value)}>
              <option value="all">Tất cả thiết bị</option>
              {productList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Nguồn:</label>
            <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
              <option value="all">Tất cả nguồn</option>
              <option value="Shopee">Shopee</option>
              <option value="Facebook">Facebook</option>
              <option value="Manual">Manual</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Trạng thái:</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              <option value="Pending">Chờ xác nhận</option>
              <option value="Confirmed">Đã chốt lịch</option>
              <option value="Returned">Đã trả máy</option>
              <option value="Cancelled">Đã hủy</option>
            </select>
          </div>

          {(filterDevice !== 'all' || filterSource !== 'all' || filterStatus !== 'all') && (
            <button className="btn-clear-filters" onClick={resetFilters}>Xóa lọc</button>
          )}
        </div>
      </div>

      {activeSubtab === 'future' && pendingWebsiteBookings.length > 0 && (
        <div className="new-bookings-section animate-in">
            <h3 className="new-bookings-title">Booking mới trong hôm nay</h3>
            <div className="manager-table-wrapper" style={{border: 'none', background: 'transparent'}}>
              <table className="manager-table">
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Thiết bị</th>
                    <th>Thời gian</th>
                    <th>Tạo lúc</th>
                    <th>Nguồn</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingWebsiteBookings.map(b => (
                    <tr key={b.id} className="new-booking-row">
                      <td>
                        <strong>{b.customerName}</strong>
                        <div style={{fontSize: '0.7rem', color: '#888'}}>{b.phone}</div>
                      </td>
                      <td>{b.productName}</td>
                      <td>
                        <div className="time-block">
                          <span className="time-label">Nhận:</span> {b.startDate}
                        </div>
                        <div className="time-block">
                          <span className="time-label">Trả:</span> {b.endDate}
                        </div>
                      </td>
                      <td><span style={{fontSize: '0.85rem', color: '#666', fontWeight: 600}}>{getTimeAgo(b.created_at)}</span></td>
                      <td><span className={`source-tag ${b.source.toLowerCase()}`}>{b.source}</span></td>
                      <td>
                        <span className={`status-badge ${b.status.toLowerCase()}`}>
                          Chờ xác nhận
                        </span>
                      </td>
                      <td>
                        <button className="action-btn tick" onClick={() => handleMarkAsSeen(b.id)} title="Đánh dấu đã xem">
                          <CheckCircle size={18} style={{color: '#28a745'}} />
                        </button>
                        <button className="action-btn edit" onClick={() => handleEdit(b)} title="Sửa"><Edit3 size={16} /></button>
                        <button className="action-btn delete" onClick={() => handleDelete(b.id)} title="Xóa"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      )}
      <h3 className="bookings-title">Danh sách đặt lịch sắp tới</h3>
      <div className="manager-table-wrapper">
        {loading && <div style={{padding: '2rem', textAlign: 'center'}}>Đang tải danh sách...</div>}
        {error && <div style={{padding: '2rem', textAlign: 'center', color: 'red'}}>{error}</div>}
        
        {!loading && !error && (
          <table className="manager-table">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Thiết bị</th>
                <th>Thời gian</th>
                <th>Tạo lúc</th>
                <th>Nguồn</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(activeSubtab === 'past' ? historyData : mainListData).map(b => (
                <tr key={b.id}>
                  <td>
                    <strong>{b.customerName}</strong>
                    <div style={{fontSize: '0.7rem', color: '#888'}}>{b.phone}</div>
                  </td>
                  <td>{b.productName}</td>
                  <td>
                    <div className="time-block">
                      <span className="time-label">Nhận:</span> {b.startDate}
                    </div>
                    <div className="time-block">
                      <span className="time-label">Trả:</span> {b.endDate}
                    </div>
                    <div style={{fontSize: '0.7rem', color: '#999', marginTop: '4px'}}>Mã: {b.id}</div>
                  </td>
                  <td><span style={{fontSize: '0.85rem', color: '#666', fontWeight: 600}}>{getTimeAgo(b.created_at)}</span></td>
                  <td><span className={`source-tag ${b.source.toLowerCase()}`}>{b.source}</span></td>
                  <td>
                    <span className={`status-badge ${b.status.toLowerCase()}`}>
                      {b.status === 'Pending' ? 'Chờ xác nhận' :
                       b.status === 'Confirmed' ? 'Đã chốt lịch' :
                       b.status === 'Returned' ? 'Đã trả máy' :
                       b.status === 'Cancelled' ? 'Đã hủy' : b.status}
                    </span>
                  </td>
                  <td>
                    {activeSubtab === 'bills' && (
                      <button className="btn-bill-view" onClick={() => handleBillView(b)}>
                        <FileText size={14} />
                        Hóa đơn
                      </button>
                    )}
                    <button className="action-btn edit" onClick={() => handleEdit(b)} title="Sửa"><Edit3 size={16} /></button>
                    <button className="action-btn delete" onClick={() => handleDelete(b.id)} title="Xóa"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {(activeSubtab === 'past' ? historyData : filteredData).length === 0 && (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: '3rem', color: '#BBB'}}>Không tìm thấy kết quả phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Specialized History Pagination Controller */}
        {activeSubtab === 'past' && historyCount > PAGE_SIZE && (
          <div className="table-pagination animate-in">
            <button 
              className="page-btn" 
              disabled={historyPage === 0 || isHistoryLoading}
              onClick={() => setHistoryPage(p => p - 1)}
            >
              Trang trước
            </button>
            <span className="page-indicator">
              Trang <strong>{historyPage + 1}</strong> / {Math.ceil(historyCount / PAGE_SIZE)}
              <small>({historyCount} mục)</small>
            </span>
            <button 
              className="page-btn" 
              disabled={(historyPage + 1) * PAGE_SIZE >= historyCount || isHistoryLoading}
              onClick={() => setHistoryPage(p => p + 1)}
            >
              Trang sau
            </button>
          </div>
        )}
      </div>

      {/* Bill Modal */}
      {isBillOpen && selectedBooking && (
        (() => {
          let subTotalNum = 0;
          let finalTotalNum = 0;
          if (selectedBooking && selectedBooking.totalPrice) {
            subTotalNum = Number(selectedBooking.totalPrice.replace(/\D/g, ''));
            const discountNum = Number(discountAmount.replace(/\D/g, '')) || 0;
            finalTotalNum = subTotalNum - discountNum;
          }
          const finalTotalStr = new Intl.NumberFormat('vi-VN').format(finalTotalNum);

          return (
            <div className="admin-modal-overlay">
              <div className="admin-modal animate-in" style={{maxWidth: '500px', width: '95%'}}>
                <header className="modal-header">
              <h3>Xuất hóa đơn</h3>
              <button className="close-btn" onClick={() => setIsBillOpen(false)}>×</button>
            </header>

            <div style={{ overflowY: 'auto', padding: '1.5rem', flex: 1, backgroundColor: '#f5f5f5' }}>
                <div style={{display: 'flex', gap: '1rem'}}>
                  <div style={{flex: 1}}>
                    <label style={{fontSize:'0.8rem', fontWeight: 600, display: 'block', marginBottom: '8px'}}>TÀI SẢN CỌC:</label>
                    <input type="text" value={depositProperty} onChange={e => setDepositProperty(e.target.value)} style={{width:'100%', padding:'10px', border: '1px solid #ccc', borderRadius: '4px'}} />
                  </div>
                  <div style={{flex: 1}}>
                    <label style={{fontSize:'0.8rem', fontWeight: 600, display: 'block', marginBottom: '8px'}}>GIẢM GIÁ (VNĐ):</label>
                    <input type="text" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} style={{width:'100%', padding:'10px', border: '1px solid #ccc', borderRadius: '4px'}} />
                  </div>
                </div>

              <div className="bill-invoice-v2">
              <div className="bill-v2-header">
                <h2>CHIN HA STORE</h2>
                <p>MÃ HỢP ĐỒNG: {selectedBooking.id.toUpperCase()}</p>
              </div>
              
              <hr className="bill-v2-divider" />
              
              <div className="bill-v2-product-section">
                <div className="bill-v2-product-image">
                  {selectedBooking.productImage ? (
                    <img src={selectedBooking.productImage} alt="Product" style={{width: '100%', height: '100%', objectFit: 'cover'}} crossOrigin="anonymous" />
                  ) : (
                    <div className="image-placeholder">ẢNH SẢN PHẨM</div>
                  )}
                </div>
                <div className="bill-v2-product-info">
                  <h4 className="camera-name">TÊN MÁY ẢNH: {selectedBooking.productName.toUpperCase()}</h4>
                  <div className="bill-v2-dates">
                    <div className="date-box border-purple">
                      <span>NGÀY NHẬN</span>
                      <strong>{selectedBooking.startDate}</strong>
                    </div>
                    <div className="date-box">
                      <span>NGÀY TRẢ</span>
                      <strong>{selectedBooking.endDate}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bill-v2-customer-section">
                <p>TÊN KHÁCH HÀNG: {selectedBooking.customerName.toUpperCase()}</p>
                <p>SĐT: {selectedBooking.phone}</p>
                <p>TÀI SẢN CỌC: {depositProperty.toUpperCase()}</p>
              </div>
              
              <hr className="bill-v2-divider" />
              
              <div className="bill-v2-details-section">
                <p className="details-title">CHI TIẾT</p>
                <p>THỜI GIAN ĐẶT: {selectedBooking.startDate} đến {selectedBooking.endDate}</p>
                <p>PHÂN LOẠI THUÊ: {selectedBooking.rentalType === 'Manual' ? 'Đặt trực tiếp' : 'Qua Website'}</p>
              </div>

              <hr className="bill-v2-divider" />
              
              <div className="bill-v2-total-section">
                <div className="total-row"><span>TẠM TÍNH:</span> <span>{selectedBooking.totalPrice} VNĐ</span></div>
                <div className="total-row"><span>GIẢM GIÁ:</span> <span>{new Intl.NumberFormat('vi-VN').format(Number(discountAmount.replace(/\D/g, '')) || 0)} VNĐ</span></div>
                <div className="total-row main-total"><span>TỔNG CỘNG:</span> <span>{finalTotalStr} VNĐ</span></div>
              </div>
              
              <div className="bill-v2-qr-section" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <img 
                  src={`https://img.vietqr.io/image/seabank-0364344419-compact2.jpg?amount=${finalTotalNum}&addInfo=${selectedBooking.id.slice(0, 8)}`} 
                  alt="QR Code" 
                  className="qr-img" 
                  crossOrigin="anonymous" 
                />
                <p>SEABANK</p>
                <p>MAN HI CHIN</p>
              </div>
              </div>
            </div>

            <div style={{ padding: '1rem', background: '#fff', borderTop: '1px solid #ddd' }}>
              <button className="btn-download-bill" style={{ width: '100%', margin: 0, padding: '1rem' }} onClick={handleDownloadBill}>
                TẢI XUỐNG ẢNH HÓA ĐƠN
              </button>
            </div>
          </div>
        </div>
        );
        })()
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal animate-in">
            <header className="modal-header">
              <h3>{formData.id ? 'Chỉnh sửa đặt lịch' : 'Thêm đặt lịch mới'}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </header>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group half">
                  <label>Tên khách hàng</label>
                  <input 
                    type="text" 
                    value={formData.customerName} 
                    onChange={e => setFormData({...formData, customerName: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group half">
                  <label>Số điện thoại</label>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Thiết bị</label>
                <select 
                  value={formData.product_id}
                  onChange={e => setFormData({...formData, product_id: e.target.value})}
                >
                  {productList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group half">
                  <label>Bắt đầu (Date & Time)</label>
                  <input 
                    type="datetime-local" 
                    value={formData.start_time}
                    onChange={e => {
                      const newStart = e.target.value;
                      let newEnd = formData.end_time;
                      let newStatus = formData.status;
                      
                      if (newStart) {
                        const d = new Date(newStart);
                        const now = new Date();
                        
                        // Auto-Status Logic
                        if (d < now) {
                          newStatus = 'Returned';
                        }
                        
                        d.setDate(d.getDate() + 1);
                        const pad = (n) => n.toString().padStart(2, '0');
                        newEnd = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                        setFormData({...formData, start_time: newStart, end_time: newEnd, status: newStatus});
                      } else {
                        setFormData({...formData, start_time: newStart});
                      }
                    }}
                    required 
                  />
                </div>
                <div className="form-group half">
                  <label>Kết thúc (Date & Time)</label>
                  <input 
                    type="datetime-local" 
                    value={formData.end_time}
                    onChange={e => setFormData({...formData, end_time: e.target.value})}
                    required 
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group half">
                  <label>Thành tiền (VND)</label>
                  <input 
                    type="number" 
                    value={formData.total_price}
                    onChange={e => setFormData({...formData, total_price: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group half">
                  <label>Trạng thái</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Pending">Chờ xác nhận</option>
                    <option value="Confirmed">Đã chốt lịch</option>
                    <option value="Returned">Đã trả máy</option>
                    <option value="Cancelled">Đã hủy</option>
                  </select>
                </div>
              </div>
               <div className="modal-footer">
                {conflictError && (
                  <div className="conflict-monitor-box animate-in">
                    <div className="modal-conflict-msg">{conflictError}</div>
                    <div className="conflict-details-list">
                      <p>Sản phẩm đã bận bởi các lịch sau:</p>
                      {conflicts.map(c => (
                        <div key={c.id} className="conflict-detail-item">
                          <span>Mã #{c.id.slice(0,5)}: <strong>{c.customerName}</strong></span>
                          <small>({new Date(c.start).toLocaleDateString('vi-VN')} - {new Date(c.end).toLocaleDateString('vi-VN')})</small>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.id && formData.status === 'Pending' && !conflictError && (
                  <button 
                    type="button" 
                    className="btn-confirm-deposit" 
                    onClick={() => setFormData({...formData, status: 'Confirmed'})}
                  >
                    Chốt lịch
                  </button>
                )}
                <button type="submit" className="btn-save" disabled={!!conflictError || isChecking || isSubmitting}>
                  {isSubmitting ? 'Đang lưu...' : isChecking ? 'Đang kiểm tra...' : 'Xác nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default BookingManager;
