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

const InteractiveCalendar = ({ data, selectedDate, onSelectDate }) => {
  const [viewDate, setViewDate] = useState(new Date(selectedDate));
  
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); 
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Mon = 0
  
  const days = [];
  for (let i = 0; i < startOffset; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  
  const getBookingCount = (date) => {
    if (!date) return 0;
    return data.filter(b => {
      if (b.status === 'Returned' || b.status === 'Cancelled') return false;
      const start = new Date(b.start_time);
      return start.toDateString() === date.toDateString();
    }).length;
  };

  const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

  return (
    <div className="admin-minicalendar animate-in">
      <div className="minicalendar-header">
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))}>TRƯỚC</button>
        <div className="minicalendar-title">{monthNames[month]} {year}</div>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))}>SAU</button>
      </div>
      <div className="minicalendar-grid">
        <div className="minicalendar-dayname">T2</div>
        <div className="minicalendar-dayname">T3</div>
        <div className="minicalendar-dayname">T4</div>
        <div className="minicalendar-dayname">T5</div>
        <div className="minicalendar-dayname">T6</div>
        <div className="minicalendar-dayname">T7</div>
        <div className="minicalendar-dayname">CN</div>
        
        {days.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} className="minicalendar-cell empty"></div>;
          
          const isSelected = date.toDateString() === selectedDate.toDateString();
          const isToday = date.toDateString() === new Date().toDateString();
          const count = getBookingCount(date);
          
          return (
            <div 
              key={date.getDate()} 
              className={`minicalendar-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => onSelectDate(date)}
            >
              <div className="minicalendar-date">{date.getDate()}</div>
              {count > 0 && <div className="minicalendar-badge">{count} đơn</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

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
  const [customLineItems, setCustomLineItems] = useState([]);
  const [invoiceStoreName, setInvoiceStoreName] = useState('CHINHA STORE');
  const [invoiceSubtitle, setInvoiceSubtitle] = useState('HÓA ĐƠN DỊCH VỤ THUÊ THIẾT BỊ');
  const [invoiceStoreAddress, setInvoiceStoreAddress] = useState('TẠI CỬA HÀNG (22 LÊ THÁNH TÔNG)');
  const [invoiceCustomerName, setInvoiceCustomerName] = useState('');
  const [invoiceCustomerPhone, setInvoiceCustomerPhone] = useState('');
  const [invoiceShowQr, setInvoiceShowQr] = useState(true);

  // Invoice version history states
  const [invoiceVersions, setInvoiceVersions] = useState([]);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(-1);

  // Quick fill presets states and helper methods
  const [invoiceTitlePresets, setInvoiceTitlePresets] = useState([
    'Hóa đơn cọc lịch',
    'Biên lai nhận cọc lịch',
    'Hóa đơn cọc thiết bị',
    'Biên lai cọc thiết bị'
  ]);
  const [depositPresets, setDepositPresets] = useState([
    'CCCD + 3.000.000 VNĐ',
    'CCCD + Tài sản (Laptop/Lens/...) tương đương'
  ]);

  const addTitlePreset = () => {
    const newVal = prompt('Nhập tiêu đề hóa đơn mới để lưu làm mẫu nhanh:');
    if (newVal && newVal.trim()) {
      setInvoiceTitlePresets(prev => [...prev, newVal.trim()]);
    }
  };

  const addDepositPreset = () => {
    const newVal = prompt('Nhập tài sản cọc mới để lưu làm mẫu nhanh:');
    if (newVal && newVal.trim()) {
      setDepositPresets(prev => [...prev, newVal.trim()]);
    }
  };

  const handleVersionChange = (index) => {
    setSelectedVersionIndex(index);
    if (index === -1) {
      // Reset to original booking defaults
      setInvoiceStoreName('CHINHA STORE');
      setInvoiceSubtitle('');
      setInvoiceStoreAddress(selectedBooking.city || 'TẠI CỬA HÀNG (22 LÊ THÁNH TÔNG)');
      setInvoiceCustomerName(selectedBooking.customerName || '');
      setInvoiceCustomerPhone(selectedBooking.phone || '');
      setInvoiceShowQr(true);
      setDiscountAmount('0');
      
      // Recalculate original price line item
      let defaultPrice = 0;
      let label = 'Giá thuê';
      if (productList.length > 0) {
        const product = productList.find(p => p.id === selectedBooking.product_id);
        if (product && selectedBooking.start_time && selectedBooking.end_time) {
          const start = new Date(selectedBooking.start_time);
          const end = new Date(selectedBooking.end_time);
          const diffMs = end - start;
          const diffHrs = diffMs / (1000 * 60 * 60);
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          
          if (diffHrs <= 6) {
            defaultPrice = Number(product.price6h?.toString().replace(/\./g, '')) || 0;
            label = 'Gói 6 giờ';
          } else if (diffDays === 1) {
            defaultPrice = Number(product.price1Day?.toString().replace(/\./g, '')) || 0;
            label = 'Giá thuê 1 ngày';
          } else if (diffDays === 2) {
            defaultPrice = Number(product.price2Days?.toString().replace(/\./g, '')) || 0;
            label = 'Giá thuê 2 ngày';
          } else if (diffDays >= 3) {
            defaultPrice = Number(product.price3Days?.toString().replace(/\./g, '')) || 0;
            label = `Giá thuê ${diffDays} ngày`;
            if (diffDays > 3) {
              const pExtra = Number(product.price4DaysPlus?.toString().replace(/\./g, '')) || 0;
              defaultPrice = defaultPrice + (pExtra * (diffDays - 3));
            }
          }
        }
      }
      setCustomLineItems([
        { id: Date.now().toString(), label: label, value: defaultPrice, type: 'addition' }
      ]);
      
      // Auto-map deposit based on customer choice
      const mapping = {
        'standard': 'CCCD + 3.000.000 VNĐ',
        'property': 'CCCD + TÀI SẢN TƯƠNG ĐƯƠNG',
        'student': 'CCCD + 500k-1M + VNEID IMAGE'
      };
      setDepositProperty(mapping[selectedBooking.deposit_type] || 'CĂN CƯỚC CÔNG DÂN');
    } else {
      // Load saved version
      const ver = invoiceVersions[index];
      if (ver) {
        setInvoiceStoreName(ver.invoiceStoreName || 'CHINHA STORE');
        setInvoiceSubtitle(ver.invoiceSubtitle || '');
        setInvoiceStoreAddress(ver.invoiceStoreAddress || '');
        setInvoiceCustomerName(ver.invoiceCustomerName || '');
        setInvoiceCustomerPhone(ver.invoiceCustomerPhone || '');
        setDepositProperty(ver.depositProperty || '');
        setDiscountAmount(ver.discountAmount || '0');
        setInvoiceShowQr(ver.invoiceShowQr !== undefined ? ver.invoiceShowQr : true);
        setCustomLineItems(ver.customLineItems || []);
      }
    }
  };

  const deleteInvoiceVersion = async (e, index) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xóa bản chỉnh sửa này không?')) return;
    
    const updatedList = invoiceVersions.filter((_, idx) => idx !== index);
    
    try {
      showStatus('Đang xóa bản ghi trên Supabase...', 'success');
      const { error } = await supabase
        .from('bookings')
        .update({ invoice_versions: updatedList })
        .eq('id', selectedBooking.id);
        
      if (error) throw error;
      
      // Update local states
      setInvoiceVersions(updatedList);
      selectedBooking.invoice_versions = updatedList; // update active reference
      
      showStatus('Xóa bản chỉnh sửa thành công!', 'success');
      
      if (selectedVersionIndex === index) {
        handleVersionChange(-1); // reset to default
      } else if (selectedVersionIndex > index) {
        setSelectedVersionIndex(prev => prev - 1);
      }
    } catch (err) {
      console.error(err);
      showStatus('Không thể xóa bản ghi trên Supabase. Vui lòng thử lại!', 'error');
    }
  };
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
      console.error('Fetch products failed:', err);
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
      console.error('Fetch history page failed:', err);
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
    
    // Auto-generate line items based on product price and days
    let defaultPrice = 0;
    let label = 'Giá thuê';
    
    if (productList.length > 0) {
      const product = productList.find(p => p.id === booking.product_id);
      if (product && booking.start_time && booking.end_time) {
        const start = new Date(booking.start_time);
        const end = new Date(booking.end_time);
        const diffMs = end - start;
        const diffHrs = diffMs / (1000 * 60 * 60);
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffHrs <= 6) {
          defaultPrice = Number(product.price6h?.toString().replace(/\./g, '')) || 0;
          label = 'Gói 6 giờ';
        } else if (diffDays === 1) {
          defaultPrice = Number(product.price1Day?.toString().replace(/\./g, '')) || 0;
          label = 'Giá thuê 1 ngày';
        } else if (diffDays === 2) {
          defaultPrice = Number(product.price2Days?.toString().replace(/\./g, '')) || 0;
          label = 'Giá thuê 2 ngày';
        } else if (diffDays >= 3) {
          defaultPrice = Number(product.price3Days?.toString().replace(/\./g, '')) || 0;
          label = `Giá thuê ${diffDays} ngày`;
          if (diffDays > 3) {
            const pExtra = Number(product.price4DaysPlus?.toString().replace(/\./g, '')) || 0;
            defaultPrice = defaultPrice + (pExtra * (diffDays - 3));
          }
        }
      }
    }
    
    setCustomLineItems([
      { id: Date.now().toString(), label: label, value: defaultPrice, type: 'addition' }
    ]);
    
    // Set POS-like customization defaults
    setInvoiceStoreName('CHINHA STORE');
    setInvoiceSubtitle('');
    setInvoiceStoreAddress(booking.city || 'TẠI CỬA HÀNG (22 LÊ THÁNH TÔNG)');
    setInvoiceCustomerName(booking.customerName || '');
    setInvoiceCustomerPhone(booking.phone || '');
    // Load saved invoice versions for this booking directly from Supabase record
    setInvoiceVersions(booking.invoice_versions || []);
    setSelectedVersionIndex(-1); // start with default
    
    setIsBillOpen(true);
  };

  const handleDownloadBill = async () => {
    const invoiceElement = document.querySelector('.bill-invoice-v2');
    if (!invoiceElement) return;

    try {
      showStatus('Bắt đầu chuẩn bị hóa đơn...', 'success');
      
      // Auto-save the current customization state as a new version to Supabase
      try {
        const newVersion = {
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString('vi-VN'),
          invoiceStoreName,
          invoiceSubtitle,
          invoiceStoreAddress,
          invoiceCustomerName,
          invoiceCustomerPhone,
          depositProperty,
          discountAmount,
          invoiceShowQr,
          customLineItems
        };
        
        const currentList = selectedBooking.invoice_versions || [];
        
        // Check if identical to last saved to prevent duplicates
        const lastVer = currentList[currentList.length - 1];
        const isIdentical = lastVer && 
          lastVer.invoiceSubtitle === invoiceSubtitle &&
          lastVer.depositProperty === depositProperty &&
          lastVer.discountAmount === discountAmount &&
          JSON.stringify(lastVer.customLineItems) === JSON.stringify(customLineItems);
          
        if (!isIdentical) {
          const updatedList = [...currentList, newVersion];
          
          const { error } = await supabase
            .from('bookings')
            .update({ invoice_versions: updatedList })
            .eq('id', selectedBooking.id);
            
          if (error) throw error;
          
          setInvoiceVersions(updatedList);
          selectedBooking.invoice_versions = updatedList; // update active reference
          setSelectedVersionIndex(updatedList.length - 1);
        }
      } catch (e) {
        console.error('Error auto-saving invoice version to Supabase:', e);
      }

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
        windowWidth: 1000,
        onclone: (clonedDoc) => {
          const el = clonedDoc.querySelector('#invoice-capture-area');
          if (el) {
            el.style.width = '450px';
            el.style.maxWidth = 'none';
            el.style.margin = '0';
            el.style.position = 'absolute';
            el.style.left = '0';
            el.style.top = '0';
            
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
        <InteractiveCalendar 
          data={data} 
          selectedDate={selectedFutureDate} 
          onSelectDate={setSelectedFutureDate} 
        />
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
          const discountNum = Number(discountAmount.replace(/\D/g, '')) || 0;
          const totalAddition = customLineItems.filter(item => item.type !== 'discount').reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
          const totalDiscount = customLineItems.filter(item => item.type === 'discount').reduce((acc, curr) => acc + (Number(curr.value) || 0), 0) + discountNum;
          const finalTotalNum = totalAddition - totalDiscount;
              
          return (
            <div className="admin-modal-overlay">
              <div className="admin-modal animate-in" style={{maxWidth: '1200px', width: '95%', display: 'flex', flexDirection: 'column', height: '90vh'}}>
                <header className="modal-header">
                  <h3>Tùy biến Hóa Đơn</h3>
                  <button className="close-btn" onClick={() => setIsBillOpen(false)}>×</button>
                </header>

                <div className="bill-modal-flex-container">
                  {/* LEFT PANEL: MODIFIER */}
                  <div className="bill-modal-left-panel">
                    {/* Invoice Versions History Dropdown */}
                    <div className="bill-version-history-box">
                      <label className="bill-version-history-label">
                      LỊCH SỬ BẢN CHỈNH SỬA HÓA ĐƠN:
                      </label>
                      <div className="bill-version-history-select-row">
                        <select
                          value={selectedVersionIndex}
                          onChange={(e) => handleVersionChange(Number(e.target.value))}
                          className="bill-version-history-select"
                        >
                          <option value={-1}>Bản mặc định (Từ đơn gốc)</option>
                          {invoiceVersions.map((ver, idx) => (
                            <option key={`ver-option-${idx}`} value={idx}>
                              Bản sửa #{idx + 1} ({ver.timestamp})
                            </option>
                          ))}
                        </select>
                        {selectedVersionIndex !== -1 && (
                          <button
                            onClick={(e) => deleteInvoiceVersion(e, selectedVersionIndex)}
                            className="bill-version-history-delete-btn"
                            title="Xóa bản chỉnh sửa này"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                      <small className="bill-version-history-note">
                        * Hệ thống tự động lưu bản chỉnh sửa mới khi bạn bấm "TẢI XUỐNG ẢNH HÓA ĐƠN".
                      </small>
                    </div>

                    <h4 style={{ marginBottom: '15px', fontSize: '0.9rem', fontWeight: 'bold' }}>THÀNH PHẦN GIÁ (KÉO XUỐNG ĐỂ XEM HẾT)</h4>
                    {customLineItems.map(item => (
                      <div key={item.id} style={{ display: 'flex', gap: '5px', marginBottom: '10px', alignItems: 'center' }}>
                        <button 
                          onClick={() => setCustomLineItems(prev => prev.map(p => p.id === item.id ? {...p, type: p.type === 'discount' ? 'addition' : 'discount'} : p))}
                          style={{ 
                            flexShrink: 0, padding: '8px', 
                            background: item.type === 'discount' ? '#ff4d4f' : '#2ecc71', 
                            color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold', width: '35px' 
                          }}
                        >
                          {item.type === 'discount' ? '-' : '+'}
                        </button>
                        <input 
                          style={{ flex: 2, minWidth: 0, padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.85rem' }}
                          value={item.label}
                          placeholder="Tên phí/giảm..."
                          onChange={(e) => setCustomLineItems(prev => prev.map(p => p.id === item.id ? {...p, label: e.target.value} : p))}
                        />
                        <input 
                          type="number"
                          style={{ flex: 1.5, minWidth: 0, padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.85rem' }}
                          value={item.value}
                          placeholder="Số tiền..."
                          onChange={(e) => setCustomLineItems(prev => prev.map(p => p.id === item.id ? {...p, value: Number(e.target.value)} : p))}
                        />
                        <button 
                          onClick={() => setCustomLineItems(prev => prev.filter(p => p.id !== item.id))}
                          style={{ flexShrink: 0, padding: '8px 12px', background: '#eee', color: '#666', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                          title="Xóa"
                        >×</button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button 
                        onClick={() => setCustomLineItems(prev => [...prev, { id: Date.now().toString(), label: 'Phí phát sinh', value: 0, type: 'addition' }])}
                        style={{ flex: 1, padding: '10px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        + Thêm phí
                      </button>
                      <button 
                        onClick={() => setCustomLineItems(prev => [...prev, { id: Date.now().toString(), label: 'Giảm giá', value: 0, type: 'discount' }])}
                        style={{ flex: 1, padding: '10px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        + Thêm giảm giá
                      </button>
                    </div>

                    <h4 style={{ marginTop: '25px', marginBottom: '15px', fontSize: '0.9rem', fontWeight: 'bold' }}>THÔNG TIN BẢN IN HÓA ĐƠN</h4>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                      <div>
                        <label style={{fontSize:'0.8rem', fontWeight: 600, display: 'block', marginBottom: '8px'}}>TÊN CỬA HÀNG / THƯƠNG HIỆU:</label>
                        <input type="text" value={invoiceStoreName} onChange={e => setInvoiceStoreName(e.target.value)} style={{width:'100%', padding:'10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.85rem'}} />
                      </div>
                       <div>
                        <label style={{fontSize:'0.8rem', fontWeight: 600, display: 'block', marginBottom: '8px'}}>TIÊU ĐỀ HÓA ĐƠN:</label>
                        <input type="text" value={invoiceSubtitle} onChange={e => setInvoiceSubtitle(e.target.value)} style={{width:'100%', padding:'10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.85rem'}} />
                        
                        {/* Quick fill pills */}
                        <div className="bill-preset-container">
                          {invoiceTitlePresets.map((preset, index) => (
                            <button
                              key={`title-preset-${index}`}
                              type="button"
                              onClick={() => setInvoiceSubtitle(preset)}
                              className="bill-preset-btn"
                            >
                              {preset}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={addTitlePreset}
                            className="bill-preset-add-btn"
                            title="Thêm mẫu tiêu đề mới"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div>
                        <label style={{fontSize:'0.8rem', fontWeight: 600, display: 'block', marginBottom: '8px'}}>ĐỊA CHỈ NHẬN MÁY / CỬA HÀNG:</label>
                        <input type="text" value={invoiceStoreAddress} onChange={e => setInvoiceStoreAddress(e.target.value)} style={{width:'100%', padding:'10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.85rem'}} />
                      </div>
                      
                      <div style={{borderTop: '1px dashed #ccc', margin: '10px 0'}}></div>

                      <div>
                        <label style={{fontSize:'0.8rem', fontWeight: 600, display: 'block', marginBottom: '8px'}}>TÊN KHÁCH HÀNG:</label>
                        <input type="text" value={invoiceCustomerName} onChange={e => setInvoiceCustomerName(e.target.value)} style={{width:'100%', padding:'10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.85rem'}} />
                      </div>
                      <div>
                        <label style={{fontSize:'0.8rem', fontWeight: 600, display: 'block', marginBottom: '8px'}}>SỐ ĐIỆN THOẠI:</label>
                        <input type="text" value={invoiceCustomerPhone} onChange={e => setInvoiceCustomerPhone(e.target.value)} style={{width:'100%', padding:'10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.85rem'}} />
                      </div>
                      <div>
                        <label style={{fontSize:'0.8rem', fontWeight: 600, display: 'block', marginBottom: '8px'}}>TÀI SẢN THẾ CHẤP (CỌC):</label>
                        <input type="text" value={depositProperty} onChange={e => setDepositProperty(e.target.value)} style={{width:'100%', padding:'10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.85rem'}} />
                        
                        {/* Quick fill pills */}
                        <div className="bill-preset-container">
                          {depositPresets.map((preset, index) => (
                            <button
                              key={`deposit-preset-${index}`}
                              type="button"
                              onClick={() => setDepositProperty(preset)}
                              className="bill-preset-btn"
                            >
                              {preset}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={addDepositPreset}
                            className="bill-preset-add-btn"
                            title="Thêm mẫu tài sản cọc mới"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div style={{borderTop: '1px dashed #ccc', margin: '10px 0'}}></div>

                      <div>
                        <label style={{fontSize:'0.8rem', fontWeight: 600, display: 'block', marginBottom: '8px'}}>KHẤU TRỪ / GIẢM GIÁ CHUNG (VNĐ):</label>
                        <input type="number" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} style={{width:'100%', padding:'10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.85rem'}} />
                      </div>

                      <div style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0'}}>
                        <input 
                          type="checkbox" 
                          id="invoice-toggle-qr"
                          checked={invoiceShowQr} 
                          onChange={e => setInvoiceShowQr(e.target.checked)} 
                          style={{width: '18px', height: '18px', cursor: 'pointer'}}
                        />
                        <label htmlFor="invoice-toggle-qr" style={{fontSize:'0.8rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none'}}>HIỂN THỊ MÃ QR CHUYỂN KHOẢN</label>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT PANEL: INVOICE PREVIEW */}
                  <div className="bill-modal-right-panel">
                    <div className="bill-invoice-v2" id="invoice-capture-area" style={{ margin: '0 auto' }}>
                      <div className="bill-v2-header">
                        <h2>{invoiceStoreName.toUpperCase()}</h2>
                        <p>{invoiceSubtitle.toUpperCase()}</p>
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
                            <div className="date-box">
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
                        <p>Tên khách hàng: {invoiceCustomerName.toUpperCase()}</p>
                        <p>Số điện thoại: {invoiceCustomerPhone}</p>
                        <p>Nhận máy tại: {invoiceStoreAddress.toUpperCase()}</p>
                        <p>Tài sản cọc: {depositProperty.toUpperCase()}</p>
                        <p>Nền tảng đặt lịch: {selectedBooking.rentalType === 'Manual' ? 'Đặt trực tiếp' : 'Qua Website'}</p>
                      </div>
                      
                      <hr className="bill-v2-divider" />
                      
                      <div className="bill-v2-details-section">
                        <p className="details-title">CHI TIẾT THANH TOÁN</p>
                        {customLineItems.filter(item => item.type !== 'discount').map((item, idx) => (
                          <div key={idx} className="bill-v2-toc-item">
                            <span className="bill-v2-toc-label">{item.label}</span>
                            <div className="bill-v2-toc-dots"></div>
                            <span className="bill-v2-toc-value">
                              {new Intl.NumberFormat('vi-VN').format(item.value)} VNĐ
                            </span>
                          </div>
                        ))}
                      </div>

                      <hr className="bill-v2-divider" />
                      
                      <div className="bill-v2-total-section">
                        <div className="total-row">
                          <span>TẠM TÍNH:</span> 
                          <span>{new Intl.NumberFormat('vi-VN').format(totalAddition)} VNĐ</span>
                        </div>
                        
                        {/* Discount Breakdown */}
                        {customLineItems.filter(item => item.type === 'discount').map((item, idx) => (
                          <div key={`discount-${idx}`} className="total-row" style={{ color: '#ff4d4f', fontSize: '0.8rem', paddingLeft: '12px', opacity: 0.9 }}>
                            <span>↳ {item.label.toUpperCase()}:</span> 
                            <span>-{new Intl.NumberFormat('vi-VN').format(item.value)} VNĐ</span>
                          </div>
                        ))}
                        
                        {discountNum > 0 && (
                          <div className="total-row" style={{ color: '#ff4d4f', fontSize: '0.8rem', paddingLeft: '12px', opacity: 0.9 }}>
                            <span>↳ GIẢM GIÁ TỔNG CHUNG:</span> 
                            <span>-{new Intl.NumberFormat('vi-VN').format(discountNum)} VNĐ</span>
                          </div>
                        )}
                        
                        {totalDiscount > 0 && (
                          <div className="total-row" style={{ color: '#ff4d4f', marginTop: '4px' }}>
                            <span>TỔNG GIẢM GIÁ:</span> 
                            <span>-{new Intl.NumberFormat('vi-VN').format(totalDiscount)} VNĐ</span>
                          </div>
                        )}
                        
                        <div className="total-row main-total" style={{borderTop: '2px solid #000', paddingTop: '10px', marginTop: '10px'}}>
                          <span>TỔNG CỘNG:</span> 
                          <span>{new Intl.NumberFormat('vi-VN').format(finalTotalNum)} VNĐ</span>
                        </div>
                      </div>
                      
                      {invoiceShowQr && finalTotalNum > 0 && (
                        <div className="bill-v2-qr-section" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                          <img 
                            src={`https://img.vietqr.io/image/seabank-000000407891-compact2.jpg?amount=${finalTotalNum}&addInfo=${selectedBooking.booking_id || selectedBooking.id.slice(0, 8)}`} 
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
