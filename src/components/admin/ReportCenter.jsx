import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { adminService } from '../../services/adminService';
import { 
  FileSpreadsheet, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import '../../pages/AdminDashboard.css';

// Custom Tooltip component for a clean, non-boring look
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: '#fff',
        padding: '10px 15px',
        border: '1px solid #000',
        fontFamily: 'ShopeeDisplayR, sans-serif'
      }}>
        <p style={{ fontWeight: 700, margin: 0 }}>{payload[0].payload.name}</p>
        <p style={{ margin: '5px 0 0 0', color: '#1cc2ba' }}>
          Doanh thu: {new Intl.NumberFormat('vi-VN').format(payload[0].value)} VNĐ
        </p>
        <p style={{ margin: '2px 0 0 0', color: '#666', fontSize: '0.8rem' }}>
          Đã thuê: {payload[0].payload.count} lần
        </p>
      </div>
    );
  }
  return null;
};

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

  const handleExportExcel = async (type = 'all') => {
    try {
      showStatus('Đang chuẩn bị dữ liệu Excel...', 'info');
      let dataToExport = [];
      let fileName = '';

      if (type === 'all') {
        const bookings = await adminService.getAllBookings();
        dataToExport = bookings;
        fileName = `ChinHaStore_TatCaDoanhThu_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}`;
      } else {
        // Export currently filtered range
        dataToExport = dailyData.bookings.map(b => ({
          ...b,
          // Map dailyData.bookings fields to match the main export format if needed
          status: 'Confirmed/Returned' // In this view, they are filtered active ones
        }));
        fileName = `ChinHaStore_BaoCao_${startDate}_den_${endDate}`;
      }

      if (dataToExport.length === 0) {
        showStatus('Không có dữ liệu để xuất!', 'error');
        return;
      }

      const ws = XLSX.utils.json_to_sheet(dataToExport.map(b => ({
        'Ngày': b.date || b.startDate,
        'Khách hàng': b.customerName,
        'Sản phẩm': b.productName,
        'Tổng tiền (VNĐ)': b.totalPrice,
        'SĐT': b.phone || 'N/A',
        'Trạng thái': b.status || 'N/A',
        'Nguồn': b.source || 'Hệ thống'
      })));
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Báo cáo doanh thu");
      XLSX.writeFile(wb, `${fileName}.xlsx`);
      showStatus('Xuất file Excel thành công!', 'success');
    } catch (err) {
      console.error(err);
      showStatus('Lỗi khi xuất file: ' + err.message, 'error');
    }
  };

  // Daily/Range Revenue State
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyData, setDailyData] = useState({ totalRevenue: 0, performance: [], bookings: [] });
  const [isDailyLoading, setIsDailyLoading] = useState(false);

  const fetchDailyRevenueData = async (sDate, eDate) => {
    try {
      setIsDailyLoading(true);
      const data = await adminService.getRevenueByDateRange(sDate, eDate);
      setDailyData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDailyLoading(false);
    }
  };

  // Auto-fill logic: When startDate changes, set endDate to startDate + 1 day
  const handleStartDateChange = (val) => {
    setStartDate(val);
    const nextDay = new Date(val);
    nextDay.setDate(nextDay.getDate() + 1);
    setEndDate(nextDay.toISOString().split('T')[0]);
  };

  useEffect(() => {
    if (startDate && endDate) fetchDailyRevenueData(startDate, endDate);
  }, [startDate, endDate]);

  // Format data for Recharts
  const chartData = stats ? Object.values(stats.productPerformance)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5) : [];

  return (
    <div className="report-center animate-in">
      <div className="report-header" style={{ fontFamily: 'ShopeeDisplayR, sans-serif' }}>
        <div className="report-title-group">
          <h2 style={{ fontFamily: 'ShopeeDisplayB, sans-serif' }}>Báo Cáo & Thống Kê</h2>
          <p style={{ fontFamily: 'ShopeeDisplayR, sans-serif' }}>Dữ liệu tổng hợp từ hệ thống Supabase</p>
        </div>
        <button className="btn-export-excel" onClick={() => handleExportExcel('all')} style={{ fontFamily: 'ShopeeDisplayB, sans-serif' }}>
          <FileSpreadsheet size={18} />
          <span>XUẤT TOÀN BỘ DOANH THU</span>
        </button>
      </div>

      {loading && <p style={{textAlign: 'center', padding: '3rem'}}>Đang tính toán dữ liệu...</p>}
      {error && <p style={{textAlign: 'center', color: 'red', padding: '3rem'}}>{error}</p>}

      {!loading && stats && (
        <>
          <div className="admin-stats-grid">
            <div className="admin-stat-card" style={{ fontFamily: 'ShopeeDisplayR, sans-serif' }}>
              <div className="stat-header">
                <h4 style={{ fontFamily: 'ShopeeDisplayM, sans-serif' }}>Doanh Thu Tổng</h4>
                <TrendingUp size={20} color="#2E7D32" />
              </div>
              <div className="report-num" style={{ fontFamily: 'ShopeeDisplayB, sans-serif' }}>
                {new Intl.NumberFormat('vi-VN').format(stats.totalRevenue)} <small style={{ fontFamily: 'ShopeeDisplayR, sans-serif' }}>VND</small>
              </div>
              <div className="admin-stat-delta">
                <span className="delta-perc positive" style={{ fontFamily: 'ShopeeDisplayR, sans-serif' }}>▲ Toàn thời gian</span>
              </div>
            </div>

            <div className="admin-stat-card" style={{ fontFamily: 'ShopeeDisplayR, sans-serif' }}>
              <div className="stat-header">
                <h4 style={{ fontFamily: 'ShopeeDisplayM, sans-serif' }}>Đơn Hoàn Tất</h4>
                <CheckCircle size={20} color="#2E7D32" />
              </div>
              <div className="report-num" style={{ fontFamily: 'ShopeeDisplayB, sans-serif' }}>{stats.completedCount} <small style={{ fontFamily: 'ShopeeDisplayR, sans-serif' }}>đơn</small></div>
            </div>

            <div className="admin-stat-card" style={{ fontFamily: 'ShopeeDisplayR, sans-serif' }}>
              <div className="stat-header">
                <h4 style={{ fontFamily: 'ShopeeDisplayM, sans-serif' }}>Đơn Đã Hủy</h4>
                <AlertCircle size={20} color="#dc3545" />
              </div>
              <div className="report-num accent-red" style={{ fontFamily: 'ShopeeDisplayB, sans-serif' }}>{stats.cancelledCount} <small style={{ fontFamily: 'ShopeeDisplayR, sans-serif' }}>đơn</small></div>
            </div>
          </div>

          {/* PERFORMANCE CHART */}
          <div className="report-tools-box animate-in" style={{ fontFamily: 'ShopeeDisplayR, sans-serif' }}>
            <div className="report-section-title">
              <BarChart3 size={20} />
              <h3 style={{ fontFamily: 'ShopeeDisplayB, sans-serif' }}>Thiết Bị Hiệu Suất Cao</h3>
            </div>
            
            <div className="performance-chart-container" style={{ height: '350px', width: '100%', marginTop: '2rem' }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                    <XAxis 
                      type="number" 
                      hide={true} 
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={120}
                      tick={{ fontFamily: 'ShopeeDisplayR, sans-serif', fontSize: 13, fill: '#333' }}
                      axisLine={{ stroke: '#000', strokeWidth: 1 }}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                    <Bar 
                      dataKey="revenue" 
                      fill="#1cc2ba" 
                      radius={0} 
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="empty-msg" style={{ fontFamily: 'ShopeeDisplayR, sans-serif', textAlign: 'center', padding: '2rem' }}>Chưa có dữ liệu hiệu suất.</p>
              )}
            </div>
          </div>

          {/* DATE RANGE REVENUE REPORT - OPTIMIZED & RESPONSIVE */}
          <div className="daily-detailed-report animate-in" style={{ marginTop: '3rem', fontFamily: 'ShopeeDisplayR, sans-serif' }}>
            
            <style>{`
              @media (max-width: 768px) {
                .report-top-grid { grid-template-columns: 1fr !important; }
                .report-bottom-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
                .report-total-num { font-size: 2.8rem !important; }
                .report-date-box { padding: 1.5rem !important; }
              }
              .custom-scrollbar::-webkit-scrollbar { width: 5px; }
              .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
              .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; }
            `}</style>

            {/* TOP ROW: Date & Summary */}
            <div className="report-top-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginBottom: '3rem' }}>
              
              {/* Date Box with Range Pickers */}
              <div className="report-date-box" style={{ 
                border: '1px solid #111', 
                padding: '1.2rem', 
                display: 'flex', 
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div>
                   <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Từ ngày (Bắt đầu):</label>
                   <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #EEE',
                      padding: '0.5rem',
                      fontFamily: 'ShopeeDisplayM, sans-serif',
                      fontSize: '1.1rem',
                      color: '#000',
                      outline: 'none',
                      width: '100%',
                      cursor: 'pointer',
                      borderRadius: 0
                    }}
                  />
                </div>
                <div>
                   <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Đến ngày (Kết thúc):</label>
                   <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #EEE',
                      padding: '0.5rem',
                      fontFamily: 'ShopeeDisplayM, sans-serif',
                      fontSize: '1.1rem',
                      color: '#000',
                      outline: 'none',
                      width: '100%',
                      cursor: 'pointer',
                      borderRadius: 0
                    }}
                  />
                </div>
              </div>

              {/* Total Revenue Summary & Export */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ 
                  border: '1px solid #111', 
                  padding: '1.5rem 2.5rem',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  flex: 1
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                     <strong style={{ fontFamily: 'ShopeeDisplayB, sans-serif', fontSize: '0.9rem', textTransform: 'uppercase' }}>TỔNG DOANH THU THEO KỲ</strong>
                     <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                        {new Date(startDate).toLocaleDateString('vi-VN')} - {new Date(endDate).toLocaleDateString('vi-VN')}
                     </span>
                  </div>
                  <div className="report-total-num" style={{ 
                    textAlign: 'right', 
                    fontSize: '4.2rem', 
                    fontFamily: 'ShopeeDisplayB, sans-serif', 
                    color: '#7AD321',
                    lineHeight: 1,
                    marginTop: '0.5rem'
                  }}>
                    {isDailyLoading ? '...' : new Intl.NumberFormat('vi-VN').format(dailyData.totalRevenue)}
                    <span style={{ fontSize: '1.8rem', marginLeft: '5px' }}>VND</span>
                  </div>
                </div>

                <button 
                  className="btn-export-range-action" 
                  onClick={() => handleExportExcel('range')}
                  style={{
                    backgroundColor: '#1cc2ba',
                    color: '#FFF',
                    border: 'none',
                    padding: '1.2rem',
                    fontFamily: 'ShopeeDisplayB, sans-serif',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 0 #159a94'
                  }}
                >
                  <FileSpreadsheet size={22} /> XUẤT EXCEL CHO KỲ BÁO CÁO NÀY
                </button>
              </div>
            </div>

            {/* BOTTOM ROW: Two Correlation Tables */}
            <div className="report-bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '4rem' }}>
              
              {/* Performance Table */}
              <div style={{ border: '1px solid #f0f0f0', padding: '1rem' }}>
                <h4 style={{ fontFamily: 'ShopeeDisplayB, sans-serif', fontSize: '0.75rem', marginBottom: '1rem', textTransform: 'uppercase', opacity: 0.6 }}>Hiệu suất thiết bị</h4>
                <div className="custom-scrollbar" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #000', position: 'sticky', top: 0, backgroundColor: '#FFF' }}>
                        <th style={{ textAlign: 'left', padding: '1rem 0', fontFamily: 'ShopeeDisplayM, sans-serif', fontSize: '1rem', color: '#000' }}>Loại máy</th>
                        <th style={{ textAlign: 'center', padding: '1rem 0', fontFamily: 'ShopeeDisplayM, sans-serif', fontSize: '1rem', color: '#000' }}>Lượt thuê</th>
                        <th style={{ textAlign: 'right', padding: '1rem 0', fontFamily: 'ShopeeDisplayM, sans-serif', fontSize: '1rem', color: '#000' }}>Doanh thu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyData.performance.map((item, i) => (
                        <tr key={i} style={i < dailyData.performance.length - 1 ? { borderBottom: '1px solid #EEE' } : {}}>
                          <td style={{ padding: '0.8rem 0', fontSize: '0.9rem' }}>{item.name}</td>
                          <td style={{ padding: '0.8rem 0', textAlign: 'center', fontSize: '0.9rem' }}>{item.count}</td>
                          <td style={{ padding: '0.8rem 0', textAlign: 'right', fontSize: '0.9rem' }}>{new Intl.NumberFormat('vi-VN').format(item.revenue)}</td>
                        </tr>
                      ))}
                      {dailyData.performance.length === 0 && (
                        <tr><td colSpan="3" style={{ padding: '2rem 0', textAlign: 'center', opacity: 0.5 }}>Không có dữ liệu</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transactions Table */}
              <div style={{ border: '1px solid #f0f0f0', padding: '1rem' }}>
                <h4 style={{ fontFamily: 'ShopeeDisplayB, sans-serif', fontSize: '0.75rem', marginBottom: '1rem', textTransform: 'uppercase', opacity: 0.6 }}>Danh sách đơn thuê</h4>
                <div className="custom-scrollbar" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #000', position: 'sticky', top: 0, backgroundColor: '#FFF' }}>
                        <th style={{ textAlign: 'left', padding: '1rem 0', fontFamily: 'ShopeeDisplayM, sans-serif', fontSize: '1rem', color: '#000' }}>Ngày</th>
                        <th style={{ textAlign: 'left', padding: '1rem 0', fontFamily: 'ShopeeDisplayM, sans-serif', fontSize: '1rem', color: '#000' }}>Tên Khách</th>
                        <th style={{ textAlign: 'left', padding: '1rem 0', fontFamily: 'ShopeeDisplayM, sans-serif', fontSize: '1rem', color: '#000' }}>Loại máy</th>
                        <th style={{ textAlign: 'right', padding: '1rem 0', fontFamily: 'ShopeeDisplayM, sans-serif', fontSize: '1rem', color: '#000' }}>Tổng tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyData.bookings.map((item, i) => (
                        <tr key={i} style={i < dailyData.bookings.length - 1 ? { borderBottom: '1px solid #EEE' } : {}}>
                          <td style={{ padding: '0.8rem 0', fontSize: '0.85rem', opacity: 0.6 }}>{item.date}</td>
                          <td style={{ padding: '0.8rem 0', fontSize: '0.9rem' }}>{item.customerName}</td>
                          <td style={{ padding: '0.8rem 0', fontSize: '0.9rem' }}>{item.productName}</td>
                          <td style={{ padding: '0.8rem 0', textAlign: 'right', fontSize: '0.9rem' }}>{new Intl.NumberFormat('vi-VN').format(item.totalPrice)}</td>
                        </tr>
                      ))}
                      {dailyData.bookings.length === 0 && (
                        <tr><td colSpan="4" style={{ padding: '2rem 0', textAlign: 'center', opacity: 0.5 }}>Không có dữ liệu</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportCenter;
