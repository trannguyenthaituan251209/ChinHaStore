import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import adminService from '../services/adminService';
import ProductCard from '../components/ProductCard';
import './BookingPage.css';

const BookingPage = () => {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id');

  const [step, setStep] = useState(1);
  const [productList, setProductList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [selectedCamera, setSelectedCamera] = useState(initialId || '');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(tomorrow);
  const [rentalType, setRentalType] = useState('DAY'); 
  const [shiftType, setShiftType] = useState('A'); 
  
  const [cusName, setCusName] = useState('');
  const [cusPhone, setCusPhone] = useState('');
  const [cusEmail, setCusEmail] = useState('');
  const [cusCity, setCusCity] = useState('Hồ Chí Minh');
  const [cusSocial, setCusSocial] = useState('');
  
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [availabilitySnapshot, setAvailabilitySnapshot] = useState(null);

  const renderGuideContent = () => (
    <div className="guide-content">
      <div className="guide-item">
        <span>1</span>
        <p>Chọn thiết bị và thời gian nhận máy thuê theo ngày, nhận máy buổi sáng hoặc buổi tối. Ngoài ra bạn có thể thuê 6 tiếng đối với một số máy</p>
      </div>
      <div className="guide-item">
        <span>2</span>
        <p>Sau khi chọn máy, khung thời gian nhận và xác nhận máy khả dụng, nhấn <b>Bước tiếp theo</b>.</p>
      </div>
      <div className="guide-item">
        <span>3</span>
        <p>Điền thông tin vào form để ChinHaStore liên hệ xác nhận</p>
      </div>
      <div className="guide-item">
        <span>4</span>
        <p><b>Xác nhận, nhận cọc</b> và tận hưởng khoảng khắc của bạn</p>
      </div>
    </div>
  );

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await adminService.getAllProducts();
        const activeProducts = data.filter(p => p.status === 'active');
        setProductList(activeProducts);
        
        // Ensure starting product is active
        if (!selectedCamera && activeProducts.length > 0) {
          setSelectedCamera(initialId || activeProducts[0].id);
        } else if (selectedCamera && !activeProducts.some(p => p.id === selectedCamera)) {
          // If a direct link target is disabled, reset to first active
          setSelectedCamera(activeProducts[0]?.id || '');
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchSnapshot = async () => {
      if (selectedCamera) {
        try {
          const data = await adminService.getProductAvailabilityData(selectedCamera);
          setAvailabilitySnapshot(data);
        } catch (err) {
          console.error("Snapshot error:", err);
        }
      }
    };
    fetchSnapshot();
  }, [selectedCamera]);

  const currentProduct = productList.find(p => p.id === selectedCamera) || productList[0] || {};

  useEffect(() => {
    window.scrollTo(0, 0);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [step]);

  useEffect(() => {
    const runCalculation = async () => {
      if (startDate && (endDate || rentalType === 'SHIFT')) {
        await calculateBooking();
      } else {
        setResult(null);
      }
    };
    runCalculation();
  }, [startDate, endDate, selectedCamera, rentalType, shiftType, availabilitySnapshot]);

  const calculateBooking = async () => {
    try {
      let startTimestamp, endTimestamp;
      
      if (rentalType === 'SHIFT') {
        const date = startDate;
        if (shiftType === 'A') {
          startTimestamp = `${date}T07:00:00`;
          endTimestamp = `${date}T13:00:00`;
        } else {
          startTimestamp = `${date}T14:00:00`;
          endTimestamp = `${date}T21:00:00`;
        }
      } else if (rentalType === 'DAY') {
        startTimestamp = `${startDate}T07:30:00`;
        endTimestamp = `${endDate}T07:30:00`;
      } else if (rentalType === 'NIGHT') {
        startTimestamp = `${startDate}T19:00:00`;
        endTimestamp = `${endDate}T19:00:00`;
      }

      const start = new Date(startTimestamp);
      const end = new Date(endTimestamp);

      const formatNumber = (num) => {
        if (!num) return '0';
        const clean = num.toString().replace(/\./g, '');
        return parseInt(clean).toLocaleString('vi-VN').replace(/,/g, '.');
      };

      const formatDate = (d) => d.toLocaleString('vi-VN', { 
        weekday: 'long', day: '2-digit', month: '2-digit' 
      });

      if (end <= start) {
        setResult(null);
        return;
      }

      // LOCAL AVAILABILITY CHECK (Instant & DB-Friendly)
      let isAvailable = true;
      if (availabilitySnapshot && availabilitySnapshot.totalUnits > 0) {
        const checkConflicts = availabilitySnapshot.bookings.filter(b => {
          const bStart = new Date(b.start);
          const bEnd = new Date(b.end);
          return start < bEnd && end > bStart;
        });

        const busyUnitIdsCount = new Set(checkConflicts.map(c => c.unitId)).size;
        if (busyUnitIdsCount >= availabilitySnapshot.totalUnits) {
          isAvailable = false;
        }
      } else {
        // Fallback to legacy server check if no snapshot yet
        const availableUnitId = await adminService.findAvailableUnit(selectedCamera, start.toISOString(), end.toISOString());
        if (!availableUnitId) isAvailable = false;
      }

      if (!isAvailable) {
        // DISCOVER ALTERNATIVE SLOTS
        const suggestions = [];
        if (availabilitySnapshot) {
          const requestedDuration = end - start;
          for (let i = 0; i < 30; i++) {
            const candidateStart = new Date();
            candidateStart.setDate(candidateStart.getDate() + i + 1);
            candidateStart.setHours(start.getHours(), start.getMinutes(), 0, 0);
            const candidateEnd = new Date(candidateStart.getTime() + requestedDuration);

            const potentialConflicts = availabilitySnapshot.bookings.filter(b => {
              const bStart = new Date(b.start);
              const bEnd = new Date(b.end);
              return candidateStart < bEnd && candidateEnd > bStart;
            });

            const busySlotCount = new Set(potentialConflicts.map(c => c.unitId)).size;
            if (busySlotCount < availabilitySnapshot.totalUnits) {
              const fmt = (d) => `${d.getDate()}/${d.getMonth() + 1}`;
              suggestions.push({
                start: candidateStart,
                end: candidateEnd,
                display: `${fmt(candidateStart)} - ${fmt(candidateEnd)}`
              });
              if (suggestions.length >= 6) break;
            }
          }
        }

        setResult({ 
          status: 'conflict', 
          recommendations: getRecommendations(start, end),
          availableSlots: suggestions,
          times: { start: formatDate(start), end: formatDate(end) }
        });
        return;
      }

      let price = 0;
      let breakdown = [];
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const parsePrice = (p) => parseInt(p?.toString().replace(/\./g, '') || 0);

      if (rentalType === 'SHIFT') {
        const p6 = currentProduct.price6h || '0';
        price = formatNumber(p6);
        breakdown.push({ label: 'Gói thuê 6 giờ', value: price });
      } else {
        const p1 = currentProduct.price1Day || '0';
        const p2 = currentProduct.price2Days || '0';
        const p3 = currentProduct.price3Days || '0';
        const pExtra = currentProduct.price4DaysPlus || '0';

        if (diffDays === 1) {
          price = formatNumber(p1);
          breakdown.push({ label: 'Giá 1 ngày', value: price });
        } else if (diffDays === 2) {
          price = formatNumber(p2);
          breakdown.push({ label: 'Giá 2 ngày', value: price });
        } else if (diffDays === 3) {
          price = formatNumber(p3);
          breakdown.push({ label: 'Giá 3 ngày đầu', value: formatNumber(p3) });
        } else {
          const base3Val = parsePrice(p3);
          const extraRate = parsePrice(pExtra);
          const totalRaw = base3Val + (extraRate * (diffDays - 3));
          price = formatNumber(totalRaw);

          breakdown.push({ label: 'Giá 3 ngày đầu', value: formatNumber(p3) });
          for (let i = 4; i <= diffDays; i++) {
            breakdown.push({ label: `Ngày thứ ${i}`, value: formatNumber(pExtra) });
          }
        }
      }

      setResult({ 
        status: 'success', 
        price, 
        breakdown,
        days: diffDays,
        times: { 
          start: formatDate(start),
          end: formatDate(end)
        },
        recommendations: getRecommendations(start, end)
      });
    } catch (err) {
      console.error('Calculation error:', err);
    }
  };

  const getRecommendations = (start, end) => {
    const currentCat = currentProduct.category?.toLowerCase() || '';
    let filtered = [];
    if (currentCat.includes('máy ảnh') || currentCat.includes('body')) {
      filtered = productList.filter(p => p.category?.toLowerCase().includes('lens') || p.category?.toLowerCase().includes('ống kính'));
    } else {
      filtered = productList.filter(p => !p.category?.toLowerCase().includes(currentCat));
    }
    if (filtered.length === 0) {
      filtered = productList.filter(p => p.id !== selectedCamera);
    }
    return filtered.slice(0, 4);
  };

  const handleNextStep = () => {
    if (result?.status === 'success') {
      setStep(2);
      window.scrollTo(0, 0);
    }
  };

  const handleFinalSubmit = async () => {
    if (!cusName || !cusPhone) {
      alert('Vui lòng điền đầy đủ Họ tên và Số điện thoại');
      return;
    }
    setIsSubmitting(true);
    try {
      await adminService.createBooking({
        customerName: cusName,
        phone: cusPhone,
        email: cusEmail,
        city: cusCity,
        social: cusSocial,
        product_id: selectedCamera,
        start_time: startDate + 'T' + (rentalType==='SHIFT'?(shiftType==='A'?'07:00:00':'14:00:00'):(rentalType==='DAY'?'07:30:00':'19:00:00')), 
        end_time: (rentalType==='SHIFT'?startDate:endDate) + 'T' + (rentalType==='SHIFT'?(shiftType==='A'?'13:00:00':'21:00:00'):(rentalType==='DAY'?'07:30:00':'19:00:00')),
        total_price: parseInt(result.price.replace(/\./g, '')),
        rentalType: rentalType,
        source: 'Website',
        breakdown: result.breakdown
      });
      setStep(3);
    } catch (error) {
      alert('Lỗi: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="booking-loading">VIP LOADING...</div>;

  return (
    <div className="booking-page animate-in">
      <div className="container">
        <div className="booking-progress">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`}><span>1</span> CHỌN MÁY & NGÀY</div>
          <div className="line"></div>
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`}><span>2</span> THÔNG TIN LIÊN HỆ</div>
          <div className="line"></div>
          <div className={`step-dot ${step >= 3 ? 'active' : ''}`}><span>3</span> HOÀN TẤT</div>
        </div>

        {step < 3 && (
          <div className="booking-grid">
            <div className="booking-form-side">
              <h1 className="booking-title">ĐẶT LỊCH THUÊ MÁY</h1>
              
              {step === 1 && (
                <div className="step-content">
                  <div className="form-group">
                    <label>THIẾT BỊ</label>
                    <select value={selectedCamera} onChange={(e) => setSelectedCamera(e.target.value)}>
                      {productList.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>HẠNG MỤC THUÊ</label>
                    <div className="rental-type-selector">
                      <button 
                        className={rentalType === 'DAY' ? 'active' : ''} 
                        onClick={() => setRentalType('DAY')}
                      >
                        Lấy Ban Ngày (07:30)
                      </button>
                      <button 
                        className={rentalType === 'NIGHT' ? 'active' : ''} 
                        onClick={() => setRentalType('NIGHT')}
                      >
                        Lấy Ban Đêm (19:00)
                      </button>
                      <button 
                        className={`shift-btn ${rentalType === 'SHIFT' ? 'active' : ''} ${(currentProduct.price6h === '0' || !currentProduct.price6h) ? 'disabled' : ''}`}
                        disabled={currentProduct.price6h === '0' || !currentProduct.price6h}
                        onClick={() => setRentalType('SHIFT')}
                      >
                        Thuê 6 Giờ
                      </button>
                    </div>
                    {(currentProduct.price6h === '0' || !currentProduct.price6h) && (
                      <span className="restricted-notice">Thiết bị này không hỗ trợ gói thuê 6 giờ</span>
                    )}
                  </div>

                  {rentalType === 'SHIFT' ? (
                    <div className="form-group animate-in">
                      <label>CHỌN CA THUÊ</label>
                      <div className="shift-selector">
                        <button className={`shift-box ${shiftType === 'A' ? 'active' : ''}`} onClick={() => setShiftType('A')}>
                          <span>Ca Sáng (07:00 - 13:00)</span>
                        </button>
                        <button className={`shift-box ${shiftType === 'B' ? 'active' : ''}`} onClick={() => setShiftType('B')}>
                          <span>Ca Chiều (14:00 - 21:00)</span>
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="date-row">
                    <div className="form-group">
                      <label>NGÀY BẮT ĐẦU</label>
                      <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => {
                          const newStart = e.target.value;
                          setStartDate(newStart);
                          const nextDay = new Date(new Date(newStart).getTime() + 86400000).toISOString().split('T')[0];
                          setEndDate(nextDay);
                        }} 
                        min={today} 
                      />
                    </div>
                    {rentalType !== 'SHIFT' && (
                       <div className="form-group">
                        <label>NGÀY KẾT THÚC</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} />
                      </div>
                    )}
                  </div>

                  <div className="guide-inline-desktop">
                    {renderGuideContent()}
                  </div>
                  
                  <div className="guide-link-mobile" onClick={() => setShowGuideModal(true)}>
                    Hướng dẫn đặt thuê máy?
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="step-content animate-in">
                  <div className="form-group">
                    <label>HỌ VÀ TÊN *</label>
                    <input type="text" placeholder="Nhập tên của bạn" value={cusName} onChange={(e) => setCusName(e.target.value)} />
                  </div>
                  <div className="form-row-2-desktop">
                    <div className="form-group">
                      <label>SỐ ĐIỆN THOẠI *</label>
                      <input type="tel" placeholder="0xxx xxx xxx" value={cusPhone} onChange={(e) => setCusPhone(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>EMAIL (TÙY CHỌN)</label>
                      <input type="email" placeholder="email@example.com" value={cusEmail} onChange={(e) => setCusEmail(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>KHU VỰC THUÊ</label>
                    <div className="city-selector">
                      <button className={`city-box ${cusCity === 'Hồ Chí Minh' ? 'active' : ''}`} onClick={() => setCusCity('Hồ Chí Minh')}>Hồ Chí Minh</button>
                      <button className={`city-box ${cusCity === 'Buôn Ma Thuột' ? 'active' : ''}`} onClick={() => setCusCity('Buôn Ma Thuột')}>Buôn Ma Thuột</button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Mạng xã hội (Facebook/Zalo)</label>
                    <input type="text" placeholder="Link Facebook hoặc số Zalo" value={cusSocial} onChange={(e) => setCusSocial(e.target.value)} />
                  </div>
                  <button className="btn-back-step" onClick={() => setStep(1)}>← QUAY LẠI CHỌN MÁY</button>
                </div>
              )}
            </div>

            <div className="booking-result-side">
              {!result ? (
                <div className="result-placeholder">
                  <p>Vui lòng hoàn tất thông tin để xem báo giá dự kiến.</p>
                </div>
              ) : result.status === 'success' ? (
                <div className="result-box success">
                  <div className="res-camera-info">
                    <img src={currentProduct.image} alt="" />
                    <h3>{currentProduct.name}</h3>
                  </div>
                  <div className="res-schedule">
                    <div className="schedule-item"><small>NHẬN MÁY</small><p>{result.times.start}</p></div>
                    <div className="schedule-item"><small>TRẢ MÁY</small><p>{result.times.end}</p></div>
                  </div>

                  <div className="res-breakdown">
                    {result.breakdown.map((item, idx) => (
                      <div key={idx} className="breakdown-line">
                        <span>{item.label}:</span>
                        <span>{item.value} VNĐ</span>
                      </div>
                    ))}
                  </div>

                  <div className="res-price-row">
                    <span>Dự kiến tổng cộng:</span>
                    <span className="res-total">{result.price} VNĐ</span>
                  </div>
                  {step === 1 ? (
                    <button className="btn-confirm-booking" onClick={handleNextStep}>BƯỚC TIẾP THEO</button>
                  ) : (
                    <button 
                      className="btn-confirm-booking" 
                      disabled={isSubmitting} 
                      onClick={handleFinalSubmit}
                    >
                      {isSubmitting ? 'ĐANG GỬI...' : 'XÁC NHẬN ĐẶT LỊCH'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="result-box conflict">
                  <div className="res-camera-info">
                    <img src={currentProduct.image} alt="" />
                    <h3>{currentProduct.name}</h3>
                  </div>
                  <div className="res-schedule">
                    <div className="schedule-item"><small>NHẬN MÁY</small><p>{result.times.start}</p></div>
                    <div className="schedule-item"><small>TRẢ MÁY</small><p>{result.times.end}</p></div>
                  </div>
                  <div className="res-conflict-alert">
                    <h3>Máy đã bận!</h3>
                    <p>Khung giờ này đã có khách đặt trước.</p>
                  </div>
                  <button 
                    className="btn-scroll-rec" 
                    onClick={() => document.querySelector('.recommendation-row')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    XEM GỢI Ý THAY THẾ
                  </button>

                  {result.availableSlots && result.availableSlots.length > 0 && (
                    <div className="res-suggestions">
                      <p className="res-suggestions-title">Gợi ý khung giờ khác cho bạn:</p>
                      <div className="res-suggestions-grid">
                        {result.availableSlots.map((slot, i) => (
                          <div 
                            key={i} 
                            className="res-suggestion-card"
                            onClick={() => {
                              setStartDate(slot.start.toISOString().split('T')[0]);
                              if (rentalType !== 'SHIFT') {
                                setEndDate(slot.end.toISOString().split('T')[0]);
                              }
                            }}
                          >
                            {slot.display}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="success-container animate-in">
            <div className="success-icon">✓</div>
            <h1>GỬI THÔNG TIN THÀNH CÔNG!</h1>
            <p className="success-msg">
              Cảm ơn <strong>{cusName}</strong>. Chúng tôi đã nhận được yêu cầu đặt lịch của bạn.<br/>
              ChinHaStore sẽ liên hệ với bạn sớm nhất qua số điện thoại <strong>{cusPhone}</strong> để xác nhận.
            </p>
            
            <div className="order-summary-box">
              <h3>Tóm tắt yêu cầu:</h3>
              <p><strong>Thiết bị:</strong> {currentProduct.name}</p>
              <p><strong>Thời gian:</strong> {result?.times.start} - {result?.times.end}</p>
              <p><strong>Tổng cộng:</strong> {result?.price} VNĐ</p>
            </div>

            <button className="btn-confirm-booking" style={{maxWidth: '300px'}} onClick={() => window.location.reload()}>QUAY LẠI TRANG CHỦ</button>
          </div>
        )}

        {/* FULL WIDTH RECOMMENDATIONS */}
        {step < 3 && result && result.recommendations && result.recommendations.length > 0 && (
          <div className="recommendation-row animate-in" id="recommendations">
            <h2 className="rec-row-title">NGAY KHUNG GIỜ BẠN CHỌN, CHÚNG TÔI CÒN CÓ</h2>
            <div className="rec-product-grid">
              {result.recommendations.map(rec => (
                <ProductCard key={rec.id} product={rec} onClick={(p) => setSelectedCamera(p.id)} />
              ))}
            </div>
          </div>
        )}
      </div>

      {showGuideModal && (
        <div className="guide-modal-overlay" onClick={() => setShowGuideModal(false)}>
          <div className="guide-modal-content" onClick={e => e.stopPropagation()}>
            <div className="guide-modal-header">
              <h3>HƯỚNG DẪN THUÊ MÁY</h3>
              <button className="close-modal" onClick={() => setShowGuideModal(false)}>&times;</button>
            </div>
            <div className="guide-modal-body">
              {renderGuideContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPage;
