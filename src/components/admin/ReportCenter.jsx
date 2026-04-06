import { 
  FileSpreadsheet, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  BarChart3
} from 'lucide-react';
import '../../pages/AdminDashboard.css';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { adminService } from '../../services/adminService';

const ReportCenter = ({ showStatus }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getReportData();
      setStats(data);
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tải báo cáo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleExportExcel = async () => {
    try {
      const { data: bookings } = await adminService.getAllBookings(); // We use the mapper version
      
      const ws = XLSX.utils.json_to_sheet(bookings.map(b => ({
        'ID': b.id,
        'Khách hàng': b.customerName,
        'SĐT': b.phone,
        'Sản phẩm': b.productName,
        'Bắt đầu': b.startDate,
        'Kết thúc': b.endDate,
        'Tổng tiền': b.totalPrice,
        'Nguồn': b.source,
        'Trạng thái': b.status
      })));
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Rental History");
      XLSX.writeFile(wb, `ChinHaStore_Report_${new Date().toLocaleDateString('vi-VN')}.xlsx`);
      showStatus('Đã xuất file Excel thành công', 'success');
    } catch (err) {
      showStatus('Lỗi khi xuất file: ' + err.message, 'error');
    }
  };

  return (
    <div className="report-center animate-in">
      <div className="report-header">
        <div className="report-title-group">
          <h2>Báo Cáo & Thống Kê</h2>
          <p>Dữ liệu tổng hợp từ hệ thống Supabase</p>
        </div>
        <button className="btn-export-excel" onClick={handleExportExcel}>
          <FileSpreadsheet size={18} />
          <span>XUẤT EXCEL</span>
        </button>
      </div>

      {loading && <p style={{textAlign: 'center', padding: '3rem'}}>Đang tính toán dữ liệu...</p>}
      {error && <p style={{textAlign: 'center', color: 'red', padding: '3rem'}}>{error}</p>}

      {!loading && stats && (
        <>
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="stat-header">
                <h4>Doanh Thu Tổng</h4>
                <TrendingUp size={20} color="#2E7D32" />
              </div>
              <div className="report-num">
                {new Intl.NumberFormat('vi-VN').format(stats.totalRevenue)} <small>VND</small>
              </div>
              <div className="admin-stat-delta">
                <span className="delta-perc positive">▲ Toàn thời gian</span>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="stat-header">
                <h4>Đơn Hoàn Tất</h4>
                <CheckCircle size={20} color="#2E7D32" />
              </div>
              <div className="report-num">{stats.completedCount} <small>đơn</small></div>
            </div>

            <div className="admin-stat-card">
              <div className="stat-header">
                <h4>Đơn Đã Hủy</h4>
                <AlertCircle size={20} color="#dc3545" />
              </div>
              <div className="report-num accent-red">{stats.cancelledCount} <small>đơn</small></div>
            </div>
          </div>

          <div className="report-tools-box animate-in">
            <div className="report-section-title">
              <BarChart3 size={20} />
              <h3>Thiết Bị Hiệu Suất Cao</h3>
            </div>
            
            <div className="performance-list">
              {Object.values(stats.productPerformance)
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5)
                .map((p, idx) => (
                  <div key={idx} className="performance-item">
                    <div className="p-info">
                      <strong>{p.name}</strong>
                      <span>{p.count} lượt thuê</span>
                    </div>
                    <div className="p-revenue">
                      {new Intl.NumberFormat('vi-VN').format(p.revenue)} VNĐ
                    </div>
                  </div>
                ))}
              {Object.keys(stats.productPerformance).length === 0 && (
                <p className="empty-msg">Chưa có dữ liệu hiệu suất.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportCenter;
