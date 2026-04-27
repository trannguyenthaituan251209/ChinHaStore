import React, { useState } from 'react';
import { 
  Search, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  FileText,
  Clock,
  RefreshCcw,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  CalendarDays
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
  const [billType, setBillType] = useState('type1'); // 'type1', 'type2', 'type3', 'type4'
  const [productList, setProductList] = useState([]);
  const [conflictError, setConflictError] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [serverSuggestions, setServerSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Future Tab Date Navigation
  const [selectedFutureDate, setSelectedFutureDate] = useState(new Date());

  // Filter Categories
  const [filterDevice, setFilterDevice] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Pagination for History (Large datasets)
  const [historyData, setHistoryData] = useState([]);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const PAGE_SIZE = 50;

  // Reload helper
  const reloadBookings = async () => {
    try {
      setError(null);
      setLoading(true);
      const [bookings, productsData] = await Promise.all([
        adminService.getAllBookings(),
        adminService.getAllProducts()
      ]);
      setData(bookings || []);
      setProductList(productsData || []);
      
      // Default product for form
      if (productsData && productsData.length > 0) {
        setFormData(prev => ({ ...prev, product_id: productsData[0].id }));
      }
    } catch (err) {
      setError('Lỗi khi cập nhật danh sách thiết bị/đặt lịch.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    // 1. Trigger automated status transitions (Confirmed -> Renting -> Completed)
    adminService.autoSyncStatuses();

    reloadBookings();
    
    // Real-time synchronization
    const channel = supabase
      .channel('booking_manager_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        reloadBookings();
        if (activeSubtab === 'past') fetchHistoryPage(historyPage);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        reloadBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSubtab, historyPage]);

  // SERVER-SIDE SEARCH WITH DEBOUNCE
  React.useEffect(() => {
    if (!searchQuery) {
      setServerSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        // When searching by ID/Text, we ignore subtab filters to allow Global Search
        const searchFilters = {};
        // Only apply filters if the query is very short or empty (not the case here since we check searchQuery)
        // But for better UX, if they type an ID, they want to find it anywhere.

        const results = await adminService.searchBookingsById(searchQuery, searchFilters);
        setServerSuggestions(results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Specialized History Fetcher (Server-side)
  const fetchHistoryPage = async (page) => {
    try {
      setError(null);
      setIsHistoryLoading(true);
      const result = await adminService.getBookingsPaginated(page, PAGE_SIZE, { status: 'Returned' });
      setHistoryData(result.data || []);
      setHistoryCount(result.count || 0);
    } catch (err) {
      setError('Lỗi khi tải lịch sử thuê máy.');
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
      !searchQuery || (b.booking_id?.toLowerCase() || "").includes(searchQuery.toLowerCase());

    // 2. Main Logic Subtabs
    let matchesTab = true;
    const now = new Date();
    const isActuallyRenting = (b) => {
      const start = new Date(b.start_time);
      const end = new Date(b.end_time);
      return (b.status === 'Renting' || b.status === 'Confirmed') && start <= now && end >= now;
    };

    if (activeSubtab === 'renting') matchesTab = isActuallyRenting(b) || b.status === 'Renting';
    else if (activeSubtab === 'future') {
      const start = new Date(b.start_time);
      const isSameDate = start.toDateString() === selectedFutureDate.toDateString();
      matchesTab = (b.status === 'Pending' || b.status === 'Renting' || b.status === 'Confirmed') && isSameDate;
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
  const mainListData = filteredData
    .filter(b => b.is_seen || b.source !== 'Website' || b.status !== 'Pending')
    .sort((a, b) => {
      // Priority sorting: Renting (0) > Pending (1) > Others (2)
      const getWeight = (s) => {
        if (s === 'Renting') return 0;
        if (s === 'Pending') return 1;
        if (s === 'Confirmed') return 2;
        return 3;
      };
      
      const weightA = getWeight(a.status);
      const weightB = getWeight(b.status);
      
      if (weightA !== weightB) return weightA - weightB;
      
      // Secondary sort: Recent first (start_time descending)
      return new Date(b.start_time) - new Date(a.start_time);
    });

  // Use server search results if searching, otherwise use filtered local data
  const effectiveData = searchQuery ? serverSuggestions : mainListData;

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
    
    // Auto-map deposit based on customer choice or admin override
    const mapping = {
      'standard': 'CCCD + 3.000.000 VNĐ',
      'property': 'CCCD + TÀI SẢN TƯƠNG ĐƯƠNG',
      'student': 'CCCD + 500k-1M + VNEID IMAGE'
    };
    setDepositProperty(mapping[booking.deposit_type] || 'CĂN CƯỚC CÔNG DÂN');
    setBillType('type1'); // Reset to type 1 when opening
    setIsBillOpen(true);
  };

  const handleDownloadBill = async () => {
    const invoiceElement = document.querySelector('.bill-invoice-v2');
    if (!invoiceElement) return;

    try {
      showStatus('Bắt đầu chuẩn bị hóa đơn...', 'success');
      
      const originalImgs = [];
      const imgElements = invoiceElement.querySelectorAll('.bill-v2-product-image img');
      
      // 100% Local Base64 Placeholder SVG to ensure zero-CORS failure
      const localPlaceholder = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNGNUY1RjUiLz48dGV4dCB4PSI2MCIgeT0iNjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iI0FBQSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q0hJTkhBIFNUT1JFPC90ZXh0Pjwvc3ZnPg==";

      for (const img of imgElements) {
        if (img.src && img.src.startsWith('http')) {
          try {
            let dataUrl = null;

            // Attempt 1: High-Performance Image CDN Proxy (weserv.nl)
            try {
              const controller1 = new AbortController();
              const timeout1 = setTimeout(() => controller1.abort(), 12000); 
              
              const cleanUrl = img.src.replace(/^https?:\/\//, '');
              const proxy1 = `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&output=jpg&q=80`;
              
              const response1 = await fetch(proxy1, { signal: controller1.signal });
              if (response1.ok) {
                const blob = await response1.blob();
                dataUrl = await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result);
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                });
              }
              clearTimeout(timeout1);
            } catch (e1) {
              console.warn('CDN Proxy failed, attempting secondary fallbacks...', e1.message);
            }

            // Attempt 2: AllOrigins (Secondary Failover)
            if (!dataUrl) {
              try {
                const controller2 = new AbortController();
                const timeout2 = setTimeout(() => controller2.abort(), 8000);
                const proxy2 = `https://api.allorigins.win/get?url=${encodeURIComponent(img.src)}`;
                const response2 = await fetch(proxy2, { signal: controller2.signal });
                const data2 = await response2.json();
                clearTimeout(timeout2);
                if (data2.contents) dataUrl = data2.contents;
              } catch (e2) {
                console.warn('All proxies failed:', e2.message);
              }
            }

            if (dataUrl) {
              originalImgs.push({ el: img, src: img.src });
              img.src = dataUrl;
            } else {
              throw new Error('Image host blocked all capture attempts');
            }
          } catch (e) {
            console.warn('Final Image Guard: applying local placeholder...', e.message);
            originalImgs.push({ el: img, src: img.src });
            img.src = localPlaceholder;
          }
        }
      }

      showStatus('Đang Render hóa đơn 1:1...', 'success');
      const canvas = await html2canvas(invoiceElement, {
        scale: 3, 
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false,
        onclone: (clonedDoc) => {
          const el = clonedDoc.querySelector('.bill-invoice-v2');
          if (el) {
            el.style.width = '450px';
            el.style.maxWidth = 'none';
            
            // Critical Fix: Sync the Base64 swap to the clone
            const clonedImgs = el.querySelectorAll('.bill-v2-product-image img');
            originalImgs.forEach((orig, idx) => {
              if (clonedImgs[idx]) {
                clonedImgs[idx].src = orig.el.src; // Use the already-swapped Base64 src
              }
            });
          }
        }
      });

      // Cleanup
      originalImgs.forEach(item => { item.el.src = item.src; });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Hoa_Don_${selectedBooking?.id?.slice(0, 8)}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showStatus('Tải xuống thành công!', 'success');
    } catch (err) {
      console.error('Download failure:', err);
      showStatus('Lỗi khi tải: ' + (err.message || 'Lỗi xử lý ảnh'), 'error');
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
      status: booking.status,
      deposit_type: booking.deposit_type || 'standard',
      city: booking.city || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (booking) => {
    setBookingToDelete(booking);
    setDeletePassword('');
    setIsDeleteModalOpen(true);
  };

  const confirmDeletion = async () => {
    if (!deletePassword) return;
    setIsSubmitting(true);
    try {
      await adminService.verifyPassword(deletePassword);
      await adminService.deleteBooking(bookingToDelete.id);
      setIsDeleteModalOpen(false);
      showStatus('Đã xóa đơn đặt lịch vĩnh viễn', 'success');
      
      // Await reloads to ensure UI is consistent before finishing submit state
      if (activeSubtab === 'past') {
        await fetchHistoryPage(historyPage);
      } else {
        await reloadBookings();
      }
    } catch (err) {
      showStatus(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Global Keyboard Listener for Modals
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsBillOpen(false);
        setIsModalOpen(false);
        setIsDeleteModalOpen(false);
      }
      if (e.key === 'Enter') {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT' && e.target.tagName !== 'TEXTAREA') {
          setIsBillOpen(false);
          setIsModalOpen(false);
          setIsDeleteModalOpen(false);
        }
      }
    };
    
    if (isBillOpen || isModalOpen || isDeleteModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBillOpen, isModalOpen, isDeleteModalOpen]);

  // Form State
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    product_id: '',
    start_time: '',
    end_time: '',
    total_price: '0',
    status: 'Pending',
    deposit_type: 'standard',
    city: ''
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
        full_name: formData.customerName,
        city: formData.city
      });

      if (formData.id) {
        // 2. Specialized Update with Identity re-mapping
        await adminService.updateBooking(formData.id, {
          customer_id: customerId, // Support potential re-mapping
          product_id: formData.product_id, // Support product correction
          start_time: formData.start_time,
          end_time: formData.end_time,
          total_price: Number(formData.total_price),
          status: formData.status,
          deposit_type: formData.deposit_type,
          city: formData.city
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

  const handlePrevDay = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newDate = new Date(selectedFutureDate);
    newDate.setDate(newDate.getDate() - 1);
    if (newDate >= today) {
      setSelectedFutureDate(newDate);
    }
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedFutureDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedFutureDate(newDate);
  };

  const formatDateLabel = (date) => {
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Hôm nay';
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) return 'Ngày mai';
    
    return new Intl.DateTimeFormat('vi-VN', { weekday: 'long' }).format(date);
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
              placeholder="Tìm theo Mã đơn (ID)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              style={{ fontFamily: 'ShopeeDisplayR, sans-serif' }}
            />
            
            {/* SUGGESTION DROPDOWN - Now powered by Server Search */}
            {isSearchFocused && searchQuery && (
              <div className="search-suggestions-dropdown custom-scrollbar" style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#fff',
                border: '1px solid #000',
                zIndex: 1000,
                maxHeight: '300px',
                overflowY: 'auto',
                marginTop: '5px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
              }}>
                {isSearching ? (
                  <div style={{ padding: '15px', textAlign: 'center', fontSize: '0.8rem', color: '#666' }}>Đang tìm...</div>
                ) : (
                  <>
                    {serverSuggestions.map(b => (
                      <div 
                        key={b.id} 
                        className="suggestion-item"
                        onClick={() => {
                          setSearchQuery(b.booking_id);
                          setIsSearchFocused(false);
                        }}
                        style={{
                          padding: '10px 15px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #eee',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span style={{ fontWeight: 900, fontSize: '0.9rem' }}>#{b.booking_id}</span>
                        <span style={{ fontSize: '0.8rem', color: '#666' }}>{b.customerName}</span>
                      </div>
                    ))}
                    {serverSuggestions.length === 0 && (
                      <div style={{ padding: '15px', textAlign: 'center', fontSize: '0.8rem', color: '#999' }}>
                        Không có mã ID khớp.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
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
                status: defaultStatus,
                deposit_type: 'standard',
                city: ''
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
              <option value="Renting">Đang thuê</option>
              <option value="Returned">Đã hoàn thành</option>
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
                    <th>Thành tiền</th>
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
                        <span className="status-text pending">
                          Chờ xác nhận
                        </span>
                      </td>
                      <td><strong>{b.totalPrice} VNĐ</strong></td>
                      <td>
                        <button className="action-btn tick" onClick={() => handleMarkAsSeen(b.id)} title="Đánh dấu đã xem">
                          <CheckCircle size={18} style={{color: '#28a745'}} />
                        </button>
                        <button className="action-btn edit" onClick={() => handleEdit(b)} title="Sửa"><Edit3 size={16} /></button>
                        <button className="action-btn delete" onClick={() => handleDelete(b)} title="Xóa"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      )}

      {activeSubtab === 'future' && (
        <div className="upcoming-date-navigator animate-in">
          <button 
            className="nav-btn" 
            onClick={handlePrevDay}
            disabled={selectedFutureDate.toDateString() === new Date().toDateString()}
          >
            <ChevronLeft size={24} />
          </button>

          <div className="nav-date-display">
            <span className="nav-date-sub">{formatDateLabel(selectedFutureDate)}</span>
            <span className="nav-date-main">
              {new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(selectedFutureDate)}
            </span>
          </div>

          <button className="nav-btn" onClick={handleNextDay}>
            <ChevronRight size={24} />
          </button>

          {selectedFutureDate.toDateString() !== new Date().toDateString() && (
            <button className="btn-today-reset" onClick={() => setSelectedFutureDate(new Date())}>
              Về hôm nay
            </button>
          )}
        </div>
      )}

      <h3 className="bookings-title">
        {activeSubtab === 'future' 
          ? `Lịch nhận máy ngày ${new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(selectedFutureDate)}` 
          : activeSubtab === 'renting' ? 'Danh sách máy đang thuê'
          : activeSubtab === 'past' ? 'Lịch sử thuê máy'
          : 'Danh sách hóa đơn'
        }
      </h3>
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
                <th>Thành tiền</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(searchQuery ? serverSuggestions : (activeSubtab === 'past' ? historyData : mainListData)).map(b => (
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
                    <div style={{fontSize: '0.75rem', color: '#000', fontWeight: '900', marginTop: '4px', letterSpacing: '0.5px'}}>ID: {b.booking_id || b.id.slice(0,8)}</div>
                  </td>
                  <td><span style={{fontSize: '0.85rem', color: '#666', fontWeight: 600}}>{getTimeAgo(b.created_at)}</span></td>
                  <td><span className={`source-tag ${b.source.toLowerCase()}`}>{b.source}</span></td>
                  <td>
                    <span className={`status-text ${b.status.toLowerCase()}`}>
                      {b.status === 'Pending' ? 'Chờ xác nhận' :
                       b.status === 'Confirmed' ? 'Đã chốt lịch' :
                       b.status === 'Renting' ? 'Đang thuê' :
                       b.status === 'Returned' ? 'Đã hoàn thành' : b.status}
                    </span>
                  </td>
                  <td><strong>{b.totalPrice} VNĐ</strong></td>
                  <td>
                    {activeSubtab === 'bills' && (
                      <button className="btn-bill-view" onClick={() => handleBillView(b)}>
                        <FileText size={14} />
                        Hóa đơn
                      </button>
                    )}
                    <button className="action-btn edit" onClick={() => handleEdit(b)} title="Sửa"><Edit3 size={16} /></button>
                    <button className="action-btn delete" onClick={() => handleDelete(b)} title="Xóa"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {(activeSubtab === 'past' ? historyData : filteredData).length === 0 && (
                <tr>
                  <td colSpan="8" style={{textAlign: 'center', padding: '3rem', color: '#BBB'}}>Không tìm thấy kết quả phù hợp.</td>
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
          let breakdown = [];
          
          if (selectedBooking) {
            subTotalNum = Number(selectedBooking.totalPrice?.replace(/\D/g, '')) || 0;
            const discountNum = Number(discountAmount.replace(/\D/g, '')) || 0;
            finalTotalNum = subTotalNum - discountNum;

            // Generate breakdown
            const product = productList.find(p => p.id === selectedBooking.product_id);
            if (product && selectedBooking.start_time && selectedBooking.end_time) {
              const start = new Date(selectedBooking.start_time);
              const end = new Date(selectedBooking.end_time);
              const diffMs = end - start;
              const diffHrs = diffMs / (1000 * 60 * 60);
              const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
              const fmt = (num) => new Intl.NumberFormat('vi-VN').format(num);

              const p6h = Number(product.price6h?.toString().replace(/\./g, '')) || 0;
              const p1d = Number(product.price1Day?.toString().replace(/\./g, '')) || 0;
              const p2d = Number(product.price2Days?.toString().replace(/\./g, '')) || 0;
              const p3d = Number(product.price3Days?.toString().replace(/\./g, '')) || 0;
              const pExtra = Number(product.price4DaysPlus?.toString().replace(/\./g, '')) || 0;

              if (diffHrs <= 6) {
                breakdown.push({ label: 'Gói 6 giờ', value: `${fmt(p6h)} VNĐ` });
              } else if (diffDays === 1) {
                breakdown.push({ label: 'Giá thuê 1 ngày', value: `${fmt(p1d)} VNĐ` });
              } else if (diffDays === 2) {
                breakdown.push({ label: 'Giá thuê 2 ngày', value: `${fmt(p2d)} VNĐ` });
              } else if (diffDays === 3) {
                breakdown.push({ label: 'Giá thuê 3 ngày', value: `${fmt(p3d)} VNĐ` });
              } else if (diffDays >= 4) {
                breakdown.push({ label: 'Giá thuê 3 ngày', value: `${fmt(p3d)} VNĐ` });
                for (let i = 4; i <= diffDays; i++) {
                  breakdown.push({ label: `Ngày phát sinh ${i}`, value: `${fmt(pExtra)} VNĐ` });
                }
              }
            }
          }
          // Calculate deposit logic: 1 day or >5 days = 100%, 2-5 days = 50%
          const startDT = new Date(selectedBooking.start_time);
          const endDT = new Date(selectedBooking.end_time);
          const dDays = Math.ceil((endDT - startDT) / (1000 * 60 * 60 * 24)) || 1;
          
          let dPercent = 100;
          if (dDays >= 2 && dDays <= 5) dPercent = 50;
          
          const dAmount = Math.round(finalTotalNum * (dPercent / 100));
          const dAmountStr = new Intl.NumberFormat('vi-VN').format(dAmount);
          
          // Extract numeric security deposit from depositProperty string (e.g., "CCCD + 3.000.000 VNĐ")
          const securityDepositNum = Number(depositProperty.replace(/\D/g, '')) || 0;
          const displayTotalWithSecurity = finalTotalNum + securityDepositNum;
          const finalTotalStr = new Intl.NumberFormat('vi-VN').format(displayTotalWithSecurity);
          const remainingAmount = displayTotalWithSecurity - dAmount;

          return (
            <div className="admin-modal-overlay">
              <div className="admin-modal animate-in" style={{maxWidth: '500px', width: '95%'}}>
                <header className="modal-header">
              <h3>Xuất hóa đơn</h3>
              <button className="close-btn" onClick={() => setIsBillOpen(false)}>×</button>
            </header>

            <div style={{ overflowY: 'auto', padding: '1.5rem', flex: 1, backgroundColor: '#f5f5f5' }}>
                <div className="bill-type-selector" style={{display: 'flex', gap: '5px', marginBottom: '15px', overflowX: 'auto', paddingBottom: '5px'}}>
                  <button className={`type-tab ${billType === 'type1' ? 'active' : ''}`} onClick={() => setBillType('type1')}>HĐ cọc</button>
                  <button className={`type-tab ${billType === 'type2' ? 'active' : ''}`} onClick={() => setBillType('type2')}>P.Thu cọc</button>
                  <button className={`type-tab ${billType === 'type3' ? 'active' : ''}`} onClick={() => setBillType('type3')}>HĐ Còn lại</button>
                  <button className={`type-tab ${billType === 'type4' ? 'active' : ''}`} onClick={() => setBillType('type4')}>P.Thu cuối</button>
                </div>

                <div style={{display: 'flex', gap: '1rem',paddingBottom:'1rem'}}>
                  <div style={{flex: 1}}>
                    <label style={{fontSize:'0.8rem', fontWeight: 600, display: 'block', marginBottom: '8px'}}>TÀI SẢN CỌC:</label>
                    <input type="text" value={depositProperty} onChange={e => setDepositProperty(e.target.value)} style={{width:'100%', padding:'10px', border: '1px solid #ccc', borderRadius: '4px'}} />
                  </div>
                  <div style={{flex: 1}}>
                    <label style={{fontSize:'0.8rem', fontWeight: 600, display: 'block', marginBottom: '8px'}}>GIẢM GIÁ (VNĐ):</label>
                    <input type="text" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} style={{width:'100%', padding:'10px', border: '1px solid #ccc', borderRadius: '4px'}} />
                  </div>
                </div>

              <div className="bill-invoice-v2" id="invoice-capture-area">
              <div className="bill-v2-header">
                <h2>CHINHA STORE</h2>
                <p>
                  {billType === 'type1' && 'HÓA ĐƠN THANH TOÁN GIỮ LỊCH'}
                  {billType === 'type3' && 'HÓA ĐƠN THANH TOÁN CÒN LẠI'}
                  {billType === 'type4' && 'BIÊN LAI THANH TOÁN'}
                </p>
                <p style={{fontSize: '0.7rem', fontWeight: 'bold', marginTop: '4px', color: '#000'}}>Mã hợp đồng: {selectedBooking.booking_id || selectedBooking.id.toUpperCase()}</p>
              </div>
              
              <hr className="bill-v2-divider" />
              
              <div className="bill-v2-product-section">
                <div className="bill-v2-product-image">
                  {selectedBooking.productImage ? (
                    <img src={selectedBooking.productImage} alt="Product" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
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
                    <div className="date-box border-red">
                      <span>NGÀY TRẢ</span>
                      <strong>{selectedBooking.endDate}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bill-v2-customer-section">
                <p>Tên khách hàng: {selectedBooking.customerName.toUpperCase()}</p>
                <p>Số điện thoại: {selectedBooking.phone}</p>
                <p>Nhận máy tại: {selectedBooking.city || 'TẠI CỬA HÀNG (22 LÊ THÁNH TÔNG)'}</p>
                <p>Tài sản cọc: {depositProperty.toUpperCase()}</p>
                <p>Nền tảng đặt lịch : {selectedBooking.rentalType === 'Manual' ? 'Đặt trực tiếp' : 'Qua Website'}</p>
              </div>
              
              <hr className="bill-v2-divider" />
              
              <div className="bill-v2-details-section">
                <p className="details-title">CHI TIẾT</p>
                {breakdown.map((item, idx) => (
                  <div key={idx} className="bill-v2-toc-item">
                    <span className="bill-v2-toc-label">{item.label}</span>
                    <div className="bill-v2-toc-dots"></div>
                    <span className="bill-v2-toc-value">{item.value}</span>
                  </div>
                ))}
              </div>

              <hr className="bill-v2-divider" />
              
              <div className="bill-v2-total-section">
                <div className="total-row"><span>TỔNG CHI PHÍ:</span> <span>{selectedBooking.totalPrice} VNĐ</span></div>
                <div className="total-row"><span>GIẢM GIÁ:</span> <span>{new Intl.NumberFormat('vi-VN').format(Number(discountAmount.replace(/\D/g, '')) || 0)} VNĐ</span></div>
                
                {(billType === 'type1' || billType === 'type2') ? (
                  <>
                    <div className="total-row main-total" style={{borderTop: '2px dashed #000', paddingTop: '10px', marginTop: '10px'}}>
                      <span>{billType === 'type1' ? 'TIỀN CỌC CẦN THANH TOÁN' : 'SỐ TIỀN ĐÃ CỌC'} ({dPercent}%):</span> 
                      <span style={{color: '#f60'}}>{dAmountStr} VNĐ</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="total-row"><span>ĐÃ THANH TOÁN GIỮ LỊCH:</span> <span>{dAmountStr} VNĐ</span></div>
                    {securityDepositNum > 0 && (
                      <div className="total-row"><span>TIỀN CỌC CHÂN MÁY/TÀI SẢN:</span> <span>{new Intl.NumberFormat('vi-VN').format(securityDepositNum)} VNĐ</span></div>
                    )}
                    <div className="total-row main-total" style={{borderTop: '2px dashed #000', paddingTop: '10px', marginTop: '10px'}}>
                      <span>{billType === 'type3' ? 'SỐ TIỀN CẦN THANH TOÁN CÒN LẠI' : 'SỐ TIỀN ĐÃ TẤT TOÁN'}:</span> 
                      <span style={{color: '#f60'}}>
                        {billType === 'type3' ? new Intl.NumberFormat('vi-VN').format(remainingAmount) : finalTotalStr} VNĐ
                      </span>
                    </div>
                  </>
                )}
                <p style={{fontSize: '0.65rem', color: '#666', textAlign: 'right', marginTop: '5px'}}>
                  {billType === 'type1' && '* Thanh toán cọc để xác nhận giữ lịch.'}
                  {billType === 'type2' && '* Đã nhận được tiền cọc giữ thiết bị.'}
                  {billType === 'type3' && '* Thanh toán phần còn lại khi nhận máy.'}
                  {billType === 'type4' && '* Đã hoàn tất mọi nghĩa vụ thanh toán.'}
                </p>
              </div>
              
              {(billType === 'type1' || billType === 'type3') && (
                <div className="bill-v2-qr-section" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                  <img 
                    src={`https://img.vietqr.io/image/seabank-000000407891-compact2.jpg?amount=${billType === 'type1' ? dAmount : remainingAmount}&addInfo=${selectedBooking.booking_id || selectedBooking.id.slice(0, 8)}${billType === 'type3' ? ' CON LAI' : ''}`} 
                    alt="QR Code" 
                    className="qr-img" 
                    crossOrigin="anonymous" 
                  />
                  <p>SEABANK</p>
                  <p>MAN HI CHIN</p>
                </div>
              )}
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

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && bookingToDelete && (
        <div className="admin-modal-overlay">
          <div className="admin-modal animate-in delete-confirm-modal" style={{ maxWidth: '450px' }}>
            <header className="modal-header">
              <h3 style={{ color: '#4b3c3cff' }}> XÁC NHẬN XÓA VĨNH VIỄN</h3>
              <button className="close-btn" onClick={() => setIsDeleteModalOpen(false)}>×</button>
            </header>
            
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <p style={{ marginBottom: '1rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                Hành động này sẽ <strong>xóa vĩnh viễn</strong> dữ liệu đặt lịch sau khỏi hệ thống. Thao tác này không thể hoàn tác.
              </p>
              
              <div className="delete-event-details" style={{ 
                backgroundColor: '#eb9173ff', 
                border: '1px solid #f9f9f9ff', 
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ marginBottom: '0.5rem' }}><strong>Khách hàng:</strong> {bookingToDelete.customerName}</div>
                <div style={{ marginBottom: '0.5rem' }}><strong>SĐT:</strong> {bookingToDelete.phone}</div>
                <div style={{ marginBottom: '0.5rem' }}><strong>Thiết bị:</strong> {bookingToDelete.productName}</div>
                <div><strong>Thời gian:</strong> {bookingToDelete.startDate} - {bookingToDelete.endDate}</div>
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '0.85rem' }}>
                  NHẬP MẬT KHẨU QUẢN TRỊ ĐỂ XÁC NHẬN:
                </label>
                <input 
                  type="password" 
                  className="login-input"
                  style={{ width: '100%', borderColor: '#fca5a5' }}
                  placeholder="Nhập mật khẩu của bạn..."
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  autoFocus
                  autoComplete="new-password"
                  name="admin-delete-verify-v2"
                />
              </div>
            </div>

            <footer className="modal-footer" style={{ borderTop: '1px solid #fee2e2', padding: '1rem', display: 'flex', gap: '1rem' }}>
              <button 
                className="btn-cancel" 
                style={{ flex: 1, backgroundColor: '#f3f4f6', color: '#4b5563' }}
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Hủy bỏ
              </button>
              <button 
                className="btn-save" 
                style={{ flex: 1, backgroundColor: '#ef4444' }}
                disabled={!deletePassword || isSubmitting}
                onClick={confirmDeletion}
              >
                {isSubmitting ? 'Đang xác minh...' : 'XÓA NGAY'}
              </button>
            </footer>
          </div>
        </div>
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
                <label>Địa chỉ nhận / trả máy</label>
                <input 
                  type="text" 
                  placeholder="VD: 123 Lê Thánh Tông, Buôn Ma Thuột..."
                  value={formData.city} 
                  onChange={e => setFormData({...formData, city: e.target.value})}
                />
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
                    <option value="Renting">Đang thuê</option>
                    <option value="Returned">Đã hoàn thành</option>
                    <option value="Cancelled">Đã hủy</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>PHƯƠNG THỨC ĐẶT CỌC (ADMIN OVERRIDE)</label>
                <select 
                  value={formData.deposit_type}
                  onChange={e => setFormData({...formData, deposit_type: e.target.value})}
                  style={{ borderColor: formData.deposit_type === 'student' ? '#eb9173' : '#d5d5d5' }}
                >
                  <option value="standard">Cơ bản: CCCD + 3.000.000 VNĐ</option>
                  <option value="property">Tài sản: CCCD + Tài sản tương đương</option>
                  <option value="student">Ưu đãi HSSV: CCCD + 500k-1M + VNEID</option>
                </select>
                {formData.deposit_type === 'student' && (
                  <small style={{ color: '#eb9173', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                    💡 Chế độ ưu đãi HSSV đang được kích hoạt cho đơn này.
                  </small>
                )}
              </div>
               <div className="modal-footer">
                {conflictError && (
                  <div className="conflict-monitor-box animate-in">
                    <div className="modal-conflict-msg">{conflictError}</div>
                    <div className="conflict-details-list">
                      <p>Sản phẩm đã bận bởi các lịch sau:</p>
                      {conflicts.map(c => (
                        <div key={c.id} className="conflict-detail-item">
                          <span>Mã #{c.booking_id || c.id.slice(0,5)}: <strong>{c.customerName}</strong></span>
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
