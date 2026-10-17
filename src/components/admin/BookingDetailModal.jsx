import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Phone, 
  Calendar, 
  Camera, 
  User, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  FileText, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import './BookingDetailModal.css';

const BookingDetailModal = ({ 
  booking, 
  onClose, 
  onEdit, 
  onDelete, 
  onOpenBill, 
  onStatusUpdated,
  showStatus 
}) => {
  const [copied, setCopied] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  if (!booking) return null;

  const bookingCode = booking.booking_id || (booking.id ? String(booking.id).slice(0, 8).toUpperCase() : '');
  const secretPath = '/quanly-chinha-trungtam';
  const detailUrl = `${window.location.origin}${secretPath}?tab=manager&booking=${bookingCode || booking.id}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(detailUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleQuickStatusChange = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      await adminService.updateBookingStatus(booking.id, newStatus);
      if (showStatus) {
        showStatus(`Đã cập nhật trạng thái đơn #${bookingCode} sang [${newStatus}]`, 'success');
      }
      if (onStatusUpdated) {
        onStatusUpdated(newStatus);
      }
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái:', err);
      if (showStatus) {
        showStatus('Lỗi: ' + (err.message || 'Không thể cập nhật trạng thái'), 'error');
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return { label: 'Chờ xác nhận', className: 'status-pending' };
      case 'Confirmed':
        return { label: 'Đã chốt lịch', className: 'status-confirmed' };
      case 'Renting':
        return { label: 'Đang thuê', className: 'status-renting' };
      case 'Returned':
        return { label: 'Đã hoàn thành', className: 'status-returned' };
      case 'Cancelled':
        return { label: 'Đã hủy', className: 'status-cancelled' };
      default:
        return { label: status || 'Không rõ', className: 'status-default' };
    }
  };

  const statusBadge = getStatusBadge(booking.status);

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div 
        className="booking-detail-modal animate-in" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP BANNER / HEADER */}
        <header className="booking-detail-header">
          <div className="booking-detail-title-group">
            <div className="booking-detail-code-row">
              <span className="booking-detail-id-label">MÃ ĐƠN:</span>
              <h2 className="booking-detail-code">#{bookingCode}</h2>
              <span className={`booking-detail-badge ${statusBadge.className}`}>
                {statusBadge.label}
              </span>
              {booking.source && (
                <span className="booking-detail-source">
                  {booking.source}
                </span>
              )}
            </div>
            
            <div className="booking-detail-slug-bar">
              <span className="booking-slug-text" title={detailUrl}>
                {detailUrl}
              </span>
              <button 
                type="button" 
                className="btn-booking-copy-slug" 
                onClick={handleCopyLink}
                title="Sao chép link trực tiếp đơn này"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Đã chép' : 'Sao chép link'}</span>
              </button>
            </div>
          </div>

          <button 
            type="button" 
            className="booking-detail-close-btn" 
            onClick={onClose}
            title="Đóng cửa sổ"
          >
            <X size={20} />
          </button>
        </header>

        {/* STATUS QUICK CONTROL BAR */}
        <div className="booking-detail-status-bar">
          <span className="status-bar-label">ĐỔI TRẠNG THÁI:</span>
          <div className="status-bar-actions">
            {booking.status !== 'Confirmed' && (
              <button 
                type="button" 
                disabled={updatingStatus}
                onClick={() => handleQuickStatusChange('Confirmed')}
                className="btn-status-pill pill-confirmed"
              >
                Chốt lịch
              </button>
            )}
            {booking.status !== 'Renting' && (
              <button 
                type="button" 
                disabled={updatingStatus}
                onClick={() => handleQuickStatusChange('Renting')}
                className="btn-status-pill pill-renting"
              >
                Giao máy (Đang thuê)
              </button>
            )}
            {booking.status !== 'Returned' && (
              <button 
                type="button" 
                disabled={updatingStatus}
                onClick={() => handleQuickStatusChange('Returned')}
                className="btn-status-pill pill-returned"
              >
                Hoàn thành
              </button>
            )}
            {booking.status !== 'Cancelled' && (
              <button 
                type="button" 
                disabled={updatingStatus}
                onClick={() => handleQuickStatusChange('Cancelled')}
                className="btn-status-pill pill-cancelled"
              >
                Hủy đơn
              </button>
            )}
          </div>
        </div>

        {/* BODY CONTENT - GRID SECTIONS */}
        <div className="booking-detail-body custom-scrollbar">
          {/* SECTION 1: THÔNG TIN KHÁCH HÀNG */}
          <section className="booking-detail-section">
            <h4 className="booking-detail-section-title">
              <User size={16} /> THÔNG TIN KHÁCH HÀNG
            </h4>
            <div className="booking-detail-grid">
              <div className="booking-detail-field">
                <span className="field-label">Họ và tên:</span>
                <span className="field-value font-bold">{booking.customerName || 'Khách lẻ'}</span>
              </div>
              <div className="booking-detail-field">
                <span className="field-label">Số điện thoại:</span>
                <span className="field-value field-phone">
                  <a href={`tel:${booking.phone}`} className="phone-link">
                    <Phone size={14} /> {booking.phone || 'Chưa có'}
                  </a>
                  {booking.phone && (
                    <a 
                      href={`https://zalo.me/${booking.phone.replace(/\D/g, '')}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="zalo-link"
                    >
                      Zalo
                    </a>
                  )}
                </span>
              </div>
              <div className="booking-detail-field full-width">
                <span className="field-label">Địa chỉ / Khu vực:</span>
                <span className="field-value">
                  <MapPin size={14} /> {booking.city || 'Tại cửa hàng (22 Lê Thánh Tông)'}
                </span>
              </div>
              <div className="booking-detail-field">
                <span className="field-label">Tài sản cọc:</span>
                <span className="field-value">
                  {booking.deposit_type === 'student' ? 'Ưu đãi HSSV (CCCD + 500k-1M + VNEID)' :
                   booking.deposit_type === 'property' ? 'Tài sản tương đương' :
                   'Cơ bản (CCCD + 3.000.000 VNĐ)'}
                </span>
              </div>
              <div className="booking-detail-field">
                <span className="field-label">Thời điểm đặt:</span>
                <span className="field-value">
                  {booking.created_at ? new Date(booking.created_at).toLocaleString('vi-VN') : 'N/A'}
                </span>
              </div>
            </div>
          </section>

          {/* SECTION 2: THÔNG TIN THIẾT BỊ & THỜI GIAN */}
          <section className="booking-detail-section">
            <h4 className="booking-detail-section-title">
              <Camera size={16} /> THIẾT BỊ & THỜI GIAN THUÊ
            </h4>
            <div className="booking-product-card">
              {booking.productImage ? (
                <img 
                  src={booking.productImage} 
                  alt={booking.productName} 
                  className="booking-product-thumb" 
                />
              ) : (
                <div className="booking-product-thumb placeholder">NO IMG</div>
              )}
              <div className="booking-product-info">
                <h5 className="booking-product-name">{booking.productName}</h5>
                <div className="booking-product-meta">
                  <span>Serial: <strong>{booking.unitName || 'Chưa gán thân máy'}</strong></span>
                  <span>Phương thức: <strong>{booking.rentalType === 'Manual' ? 'Đặt trực tiếp' : 'Đặt qua Website'}</strong></span>
                </div>
              </div>
            </div>

            <div className="booking-detail-grid mt-2">
              <div className="booking-detail-field">
                <span className="field-label">Thời gian nhận máy:</span>
                <span className="field-value font-bold">{booking.startDate}</span>
              </div>
              <div className="booking-detail-field">
                <span className="field-label">Thời gian trả máy:</span>
                <span className="field-value font-bold">{booking.endDate}</span>
              </div>
            </div>

            {/* Phụ kiện đi kèm nếu có */}
            {booking.optional_accessories && booking.optional_accessories.length > 0 && (
              <div className="booking-accessories-box">
                <span className="field-label">Phụ kiện đính kèm:</span>
                <div className="booking-accessories-list">
                  {booking.optional_accessories.map((acc, idx) => (
                    <span key={idx} className="accessory-tag">
                      {acc.name} (x{acc.selected_quantity || 1}) - {new Intl.NumberFormat('vi-VN').format(acc.price || 0)}đ
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* SECTION 3: TÀI CHÍNH & THANH TOÁN */}
          <section className="booking-detail-section">
            <h4 className="booking-detail-section-title">
              <FileText size={16} /> TÀI CHÍNH & HÓA ĐƠN
            </h4>
            <div className="booking-finance-summary">
              <div className="finance-row">
                <span>Tổng giá trị đơn thuê:</span>
                <strong className="finance-total">{booking.totalPrice} VNĐ</strong>
              </div>
              {booking.invoice_versions && booking.invoice_versions.length > 0 && (
                <div className="finance-versions-note">
                  Đã có <strong>{booking.invoice_versions.length}</strong> bản hóa đơn được chỉnh sửa/lưu trữ.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* FOOTER ACTIONS */}
        <footer className="booking-detail-footer">
          <div className="footer-left-actions">
            {onDelete && (
              <button 
                type="button" 
                className="btn-detail-action btn-detail-delete"
                onClick={() => { onClose(); onDelete(booking); }}
              >
                <Trash2 size={15} /> Xóa đơn
              </button>
            )}
          </div>
          <div className="footer-right-actions">
            {onEdit && (
              <button 
                type="button" 
                className="btn-detail-action btn-detail-edit"
                onClick={() => { onClose(); onEdit(booking); }}
              >
                <Edit3 size={15} /> Chỉnh sửa
              </button>
            )}
            {onOpenBill && (
              <button 
                type="button" 
                className="btn-detail-action btn-detail-bill"
                onClick={() => { onClose(); onOpenBill(booking); }}
              >
                <FileText size={15} /> Hóa đơn (In/Tải ảnh)
              </button>
            )}
            <button 
              type="button" 
              className="btn-detail-action btn-detail-close" 
              onClick={onClose}
            >
              Đóng
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default BookingDetailModal;
