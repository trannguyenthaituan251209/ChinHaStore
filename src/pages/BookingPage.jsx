import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import adminService from '../services/adminService';
import ProductCard from '../components/ProductCard';
import html2canvas from 'html2canvas';
import { Turnstile } from '@marsidev/react-turnstile';
import './BookingPage.css';

const BookingPage = () => {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id');

  const [step, setStep] = useState(1);
  const [productList, setProductList] = useState([]);
  const [globalAccessories, setGlobalAccessories] = useState([]);
  const [selectedAccessories, setSelectedAccessories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  const [selectedCamera, setSelectedCamera] = useState(initialId || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rentalType, setRentalType] = useState('DAY');
  const [shiftType, setShiftType] = useState('A');

  const [cusName, setCusName] = useState('');
  const [cusPhone, setCusPhone] = useState('');
  const [cusEmail, setCusEmail] = useState('');
  const [cusCity, setCusCity] = useState('Buôn Ma Thuột');
  const [cusAddress, setCusAddress] = useState('');
  const [receiveMethod, setReceiveMethod] = useState('store'); // 'store' or 'delivery'
  const [cusSocial, setCusSocial] = useState('');
  const [cusDepositType, setCusDepositType] = useState('standard');

  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [availabilitySnapshot, setAvailabilitySnapshot] = useState(null);
  const [isCopyingAccount, setIsCopyingAccount] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSuccessNotice, setShowSuccessNotice] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState('');
  const [isPolicyAccepted, setIsPolicyAccepted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const turnstileRef = useRef(null);

  const [paymentOption, setPaymentOption] = useState(null); // 'wait' | 'pay' | null
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [siteSettings, setSiteSettings] = useState({
    pickup_time_day: '07:30',
    pickup_time_night: '19:00',
    pickup_time_shift_a: '07:00',
    return_time_shift_a: '13:00',
    pickup_time_shift_b: '14:00',
    return_time_shift_b: '21:00'
  });

  // Address Autocomplete states
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [selProvCode, setSelProvCode] = useState('');
  const [selDistCode, setSelDistCode] = useState('');
  const [selWardCode, setSelWardCode] = useState('');

  const [provName, setProvName] = useState('');
  const [distName, setDistName] = useState('');
  const [wardName, setWardName] = useState('');

  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/p/')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(err => console.error('Failed to fetch provinces', err));
  }, []);

  const handleProvinceChange = (e) => {
    const code = e.target.value;
    setSelProvCode(code);
    setProvName(e.target.options[e.target.selectedIndex].text);
    setSelDistCode('');
    setDistName('');
    setSelWardCode('');
    setWardName('');
    setDistricts([]);
    setWards([]);

    if (code) {
      fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`)
        .then(res => res.json())
        .then(data => setDistricts(data.districts || []))
        .catch(err => console.error('Failed to fetch districts', err));
    }
  };

  const handleDistrictChange = (e) => {
    const code = e.target.value;
    setSelDistCode(code);
    setDistName(e.target.options[e.target.selectedIndex].text);
    setSelWardCode('');
    setWardName('');
    setWards([]);

    if (code) {
      fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`)
        .then(res => res.json())
        .then(data => setWards(data.wards || []))
        .catch(err => console.error('Failed to fetch wards', err));
    }
  };

  const handleWardChange = (e) => {
    const code = e.target.value;
    setSelWardCode(code);
    setWardName(e.target.options[e.target.selectedIndex].text);
  };

  // New state for cross-device recovery
  const [remoteDraft, setRemoteDraft] = useState(null);
  const [showRemotePrompt, setShowRemotePrompt] = useState(false);
  const [localDraft, setLocalDraft] = useState(null);
  const [showLocalPrompt, setShowLocalPrompt] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // 1. CHECK LOCAL STORAGE ON MOUNT
  useEffect(() => {
    const saved = localStorage.getItem('booking_draft');
    if (saved) {
      try {
        const d = JSON.parse(saved);
        // Only show prompt if it's potentially useful (it has a camera or we're on Step 2)
        if (d.selectedCamera || d.step > 1 || d.cusName) {
          setLocalDraft(d);

          // AUTO-REPLACE IDENTITY INFO (Persistent across all cameras)
          if (d.cusName) setCusName(d.cusName);
          if (d.cusPhone) setCusPhone(d.cusPhone);
          if (d.cusEmail) setCusEmail(d.cusEmail);
          if (d.cusCity) setCusCity(d.cusCity);
          if (d.cusAddress) setCusAddress(d.cusAddress);
          if (d.cusSocial) setCusSocial(d.cusSocial);
          if (d.cusDepositType) setCusDepositType(d.cusDepositType);
          if (d.receiveMethod) setReceiveMethod(d.receiveMethod);

          // Decide if we should show the prompt for FULL session recovery (Camera/Dates/Step)
          if (initialId && d.selectedCamera !== initialId) {
            setShowLocalPrompt(true);
          } else if (d.step > 1 || d.cusName) {
            setShowLocalPrompt(true);
          } else if (!initialId) {
            setShowLocalPrompt(true);
          }
        }
      } catch (err) { console.error('Error reading local draft:', err); }
    }
    setHasInitialized(true);
  }, []);

  // 2. SAVE DATA TO LOCAL STORAGE & SUPABASE DRAFT
  useEffect(() => {
    if (!hasInitialized || step >= 3 || showLocalPrompt || showRemotePrompt) return; // Don't save if not ready, finished, or during recovery prompt

    const draftData = {
      selectedCamera, startDate, endDate, rentalType, shiftType,
      cusName, cusPhone, cusEmail, cusCity, cusAddress, receiveMethod, cusSocial, cusDepositType,
      step
    };

    // Always update local for same-device recovery
    localStorage.setItem('booking_draft', JSON.stringify(draftData));

    // Debounced remote backup if we have a phone number
    const timer = setTimeout(() => {
      if (cusPhone && cusPhone.length >= 10) {
        adminService.saveBookingDraft(cusPhone, draftData);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [hasInitialized, selectedCamera, startDate, endDate, rentalType, shiftType, cusName, cusPhone, cusEmail, cusCity, cusAddress, receiveMethod, cusSocial, cusDepositType, step, showLocalPrompt, showRemotePrompt]);

  // 3. CHECK FOR REMOTE DRAFT WHEN PHONE IS ENTERED
  useEffect(() => {
    const checkRemote = async () => {
      if (cusPhone && cusPhone.length >= 10 && !remoteDraft) {
        const d = await adminService.getBookingDraft(cusPhone);
        if (d && (d.step > 1 || d.cusName)) {
          // We found a draft that has more info than the current local state
          setRemoteDraft(d);
          setShowRemotePrompt(true);
        }
      }
    };
    checkRemote();
  }, [cusPhone]);

  const applyDraft = (draft) => {
    if (!draft) return;
    const d = draft;
    console.log('Restoring draft:', d);

    if (d.selectedCamera) setSelectedCamera(d.selectedCamera);
    if (d.startDate) setStartDate(d.startDate);
    if (d.endDate) setEndDate(d.endDate);
    if (d.rentalType) setRentalType(d.rentalType);
    if (d.shiftType) setShiftType(d.shiftType);
    if (d.cusName) setCusName(d.cusName);
    if (d.cusPhone) setCusPhone(d.cusPhone);
    if (d.cusEmail) setCusEmail(d.cusEmail);
    if (d.cusCity) setCusCity(d.cusCity);
    if (d.cusAddress) setCusAddress(d.cusAddress);
    if (d.receiveMethod) setReceiveMethod(d.receiveMethod);
    if (d.cusSocial) setCusSocial(d.cusSocial);
    if (d.cusDepositType) setCusDepositType(d.cusDepositType);
    if (d.step && Number(d.step) < 3) {
      setStep(Number(d.step));
    }

    setShowLocalPrompt(false);
    setShowRemotePrompt(false);
  };

  const getDraftSummary = (draft) => {
    if (!draft || !draft.selectedCamera) return '';
    const camName = productList.find(p => p.id === draft.selectedCamera)?.name || 'Thiết bị';

    const formatD = (dStr) => {
      if (!dStr) return '';
      const parts = dStr.split('-');
      if (parts.length !== 3) return dStr;
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    let timeStr = '';
    if (!draft.startDate) {
      return `${camName} (Chưa chọn ngày)`;
    }

    if (draft.rentalType === 'SHIFT') {
      const sType = draft.shiftType === 'B' ? '14:00 - 21:00' : '07:00 - 13:00';
      timeStr = `${sType} ngày ${formatD(draft.startDate)}`;
    } else if (draft.rentalType === 'DAY') {
      timeStr = `07:30 ${formatD(draft.startDate)} - 07:30 ${formatD(draft.endDate)}`;
    } else if (draft.rentalType === 'NIGHT') {
      timeStr = `19:00 ${formatD(draft.startDate)} - 19:00 ${formatD(draft.endDate)}`;
    } else {
      timeStr = `${formatD(draft.startDate)} - ${formatD(draft.endDate)}`;
    }

    return `${camName} - ${timeStr}`;
  };

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
        const [pData, aData, settings] = await Promise.all([
          adminService.getAllProducts(),
          adminService.getAllAccessories().catch(() => []),
          adminService.getSiteSettings()
        ]);
        const activeProducts = pData.filter(p => p.status?.toLowerCase() === 'active');
        setProductList(activeProducts);

        // Accessories do not have a status field currently, so we use all of them
        setGlobalAccessories(aData);
        if (settings) setSiteSettings(settings);

        if (selectedCamera && !activeProducts.some(p => p.id === selectedCamera)) {
          setSelectedCamera('');
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

  const currentProduct = productList.find(p => p.id === selectedCamera) || {
    name: 'Hãy chọn thiết bị',
    image: 'https://via.placeholder.com/150?text=No+Selection'
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [step]);

  useEffect(() => {
    const runCalculation = async () => {
      if (selectedCamera && startDate && (endDate || rentalType === 'SHIFT')) {
        await calculateBooking();
      } else {
        setResult(null);
      }
    };
    runCalculation();
  }, [startDate, endDate, selectedCamera, rentalType, shiftType, availabilitySnapshot, productList, selectedAccessories, siteSettings]);

  useEffect(() => {
    let interval;
    if (step === 3 && paymentOption === 'pay' && createdBookingId && !isPaymentConfirmed) {
      interval = setInterval(async () => {
        try {
          const b = await adminService.getBookingById(createdBookingId);
          if (b && b.status === 'Confirmed') {
            setIsPaymentConfirmed(true);
            clearInterval(interval);
          }
        } catch(e) { }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [step, paymentOption, createdBookingId, isPaymentConfirmed]);

  useEffect(() => {
    let timer;
    if (step === 3 && paymentOption === 'pay' && !isPaymentConfirmed && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (step === 3 && paymentOption === 'pay' && !isPaymentConfirmed && timeLeft === 0) {
      handleCancelTransaction(true);
    }
    return () => clearInterval(timer);
  }, [step, paymentOption, isPaymentConfirmed, timeLeft]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (step === 3 && paymentOption === 'pay' && !isPaymentConfirmed) {
        e.preventDefault();
        e.returnValue = "Bạn muốn hủy giao dịch này chứ?";
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [step, paymentOption, isPaymentConfirmed]);

  const handleCancelTransaction = async (isAuto = false) => {
    try {
      const { supabase } = await import('../utils/supabase');
      const booking = await adminService.getBookingById(createdBookingId);
      if (booking) {
        await supabase.from('bookings').update({ status: 'Cancelled' }).eq('id', booking.id);
      }
    } catch(e) { console.error("Cancel error", e); }
    
    alert(isAuto ? "Đã hết thời gian thanh toán (10 phút). Giao dịch đã bị hủy." : "Giao dịch thanh toán đã bị hủy.");
    window.location.reload();
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const calculateBooking = async () => {
    try {
      let startTimestamp, endTimestamp;

      if (rentalType === 'SHIFT') {
        const date = startDate;
        if (shiftType === 'A') {
          startTimestamp = `${date}T${siteSettings.pickup_time_shift_a}:00`;
          endTimestamp = `${date}T${siteSettings.return_time_shift_a}:00`;
        } else {
          startTimestamp = `${date}T${siteSettings.pickup_time_shift_b}:00`;
          endTimestamp = `${date}T${siteSettings.return_time_shift_b}:00`;
        }
      } else if (rentalType === 'DAY') {
        startTimestamp = `${startDate}T${siteSettings.pickup_time_day}:00`;
        endTimestamp = `${endDate}T${siteSettings.pickup_time_day}:00`;
      } else if (rentalType === 'NIGHT') {
        startTimestamp = `${startDate}T${siteSettings.pickup_time_night}:00`;
        endTimestamp = `${endDate}T${siteSettings.pickup_time_night}:00`;
      }

      const start = new Date(startTimestamp);
      const end = new Date(endTimestamp);

      const formatNumber = (num) => {
        if (!num) return '0';
        const clean = num.toString().replace(/\./g, '');
        return parseInt(clean).toLocaleString('vi-VN').replace(/,/g, '.');
      };

      const formatDate = (d) => d.toLocaleString('vi-VN', {
        hour: '2-digit', minute: '2-digit',
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

      // ---------------------------------
      // CÁC TÙY CHỌN PHỤ KIỆN
      // ---------------------------------
      let accessoryTotal = 0;
      selectedAccessories.forEach(acc => {
        const accPrice = Number(acc.price) || 0;
        const qty = acc.selected_quantity || 1;
        const configPricing = acc.config?.pricing || {};
        const configUI = acc.config?.ui || {};
        
        let itemTotal = 0;
        const calculateBy = configPricing.calculate_by || acc.charge_type || 'once';
        let effectivePrice = accPrice;

        if (rentalType === 'SHIFT' && configPricing.shift_price) {
          effectivePrice = Number(configPricing.shift_price);
        }

        const unitDisplay = configUI.unit_label ? '/' + configUI.unit_label : '';

        if (calculateBy === 'per_day') {
          const daysToMultiply = rentalType === 'SHIFT' ? 1 : diffDays;
          itemTotal = effectivePrice * qty * daysToMultiply;
          breakdown.push({ label: `Phụ kiện: ${acc.name} (${formatNumber(effectivePrice)}đ${unitDisplay} x ${qty} x ${daysToMultiply} ${rentalType === 'SHIFT' ? 'Ca' : 'Ngày'})`, value: formatNumber(itemTotal) });
        } else {
          itemTotal = effectivePrice * qty;
          breakdown.push({ label: `Phụ kiện: ${acc.name} (${formatNumber(effectivePrice)}đ${unitDisplay} x ${qty})`, value: formatNumber(itemTotal) });
        }
        accessoryTotal += itemTotal;
      });

      price = formatNumber(parseInt(price.replace(/\./g, '')) + accessoryTotal);

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

  const getRecommendations = () => {
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
    if (!captchaToken) {
      alert('Vui lòng xác thực bạn không phải là robot');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await adminService.createSecureBooking(captchaToken, {
        customerName: cusName,
        phone: cusPhone,
        email: cusEmail,
        city: receiveMethod === 'store'
          ? 'Nhận tại cửa hàng (23 Lê Thánh Tông)'
          : (wardName && distName && provName
            ? `${cusAddress ? cusAddress + ', ' : ''}${wardName}, ${distName}, ${provName}`
            : (cusAddress ? `${cusAddress}, ${cusCity}` : cusCity)),
        social: cusSocial,
        product_id: selectedCamera,
        start_time: startDate + 'T' + (rentalType === 'SHIFT' ? (shiftType === 'A' ? `${siteSettings.pickup_time_shift_a}:00` : `${siteSettings.pickup_time_shift_b}:00`) : (rentalType === 'DAY' ? `${siteSettings.pickup_time_day}:00` : `${siteSettings.pickup_time_night}:00`)),
        end_time: (rentalType === 'SHIFT' ? startDate : endDate) + 'T' + (rentalType === 'SHIFT' ? (shiftType === 'A' ? `${siteSettings.return_time_shift_a}:00` : `${siteSettings.return_time_shift_b}:00`) : (rentalType === 'DAY' ? `${siteSettings.pickup_time_day}:00` : `${siteSettings.pickup_time_night}:00`)),
        total_price: parseInt(result.price.replace(/\./g, '')),
        rentalType: rentalType,
        deposit_type: cusDepositType,
        source: 'Website',
        breakdown: result.breakdown,
        optional_accessories: selectedAccessories
      });

      if (created && created.booking_id) {
        setCreatedBookingId(created.booking_id);
      }
      // Clear draft on success
      localStorage.removeItem('booking_draft');
      if (cusPhone) adminService.deleteBookingDraft(cusPhone);

      setStep(3);
      setShowSuccessNotice(true);
    } catch (error) {
      alert('Lỗi: ' + error.message);
      // Reset captcha if verification failed so user can try again
      setCaptchaToken('');
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyAccountNum = () => {
    navigator.clipboard.writeText('000000407891');
    setIsCopyingAccount(true);
    setTimeout(() => setIsCopyingAccount(false), 2000);
  };

  const handleDownloadInvoice = async () => {
    const invoiceElement = document.getElementById('invoice-capture-area');
    if (!invoiceElement) return;

    try {
      setIsDownloading(true);

      const originalImgs = [];
      const imgElements = invoiceElement.querySelectorAll('.bill-v2-product-image img');
      const localPlaceholder = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNGNUY1RjUiLz48dGV4dCB4PSI2MCIgeT0iNjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iI0FBQSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q0hJTkhBIFNUT1JFPC90ZXh0Pjwvc3ZnPg==";

      for (const img of imgElements) {
        if (img.src && img.src.startsWith('http')) {
          try {
            let dataUrl = null;
            // weserv proxy
            try {
              const proxy1 = `https://images.weserv.nl/?url=${encodeURIComponent(img.src.replace(/^https?:\/\//, ''))}&output=jpg&q=80`;
              const response1 = await fetch(proxy1);
              if (response1.ok) {
                const blob = await response1.blob();
                dataUrl = await new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result);
                  reader.readAsDataURL(blob);
                });
              }
            } catch (e1) { console.warn('Proxy 1 failed:', e1.message); }

            if (dataUrl) {
              originalImgs.push({ el: img, src: img.src });
              img.src = dataUrl;
            }
          } catch (e) {
            console.warn('CORS fallback failed:', e.message);
            originalImgs.push({ el: img, src: img.src });
            img.src = localPlaceholder;
          }
        }
      }

      const canvas = await html2canvas(invoiceElement, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('invoice-capture-area');
          if (el) {
            el.style.display = 'block';
            el.style.width = '450px';
            const clonedImgs = el.querySelectorAll('.bill-v2-product-image img');
            originalImgs.forEach((orig, idx) => {
              if (clonedImgs[idx]) clonedImgs[idx].src = orig.el.src;
            });
          }
        }
      });

      originalImgs.forEach(item => { item.el.src = item.src; });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `ChinHaStore_Receipt.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download failure:', err);
      alert('Lỗi khi tải hóa đơn.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) return <div className="booking-loading">VIP LOADING...</div>;

  let calculatedDeposit = 0;
  if (result) {
    const priceNum = Number(result.price?.toString().replace(/\./g, '')) || 0;
    const durationDays = result.breakdown?.filter(i => i.label?.toLowerCase().includes('ngày')).length || 1;
    let dPerc = 100;
    if (durationDays >= 2 && durationDays <= 5) dPerc = 50;
    calculatedDeposit = Math.round(priceNum * (dPerc / 100));
  }

  return (
    <div className="booking-page animate-in">
      <Helmet>
        <title>Đặt Lịch Thuê Máy | Thuê Máy Ảnh Buôn Ma Thuột - ChinHaStore</title>
        <link rel="canonical" href="https://chinhastore.com/dat-lich" />
        <meta name="description" content="Đặt lịch thuê máy ảnh nhanh chóng tại Buôn Ma Thuột (BMT). Thuê Canon EOS R50, Fujifilm, Ricoh luôn sẵn sàng. Thủ tục đơn giản, hỗ trợ 24/7. LH: 0842204207." />
        <meta name="keywords" content="đặt lịch thuê máy ảnh bmt, thuê canon r50 buôn ma thuột, thủ tục thuê máy ảnh bmt, thuê máy ảnh bmt online" />
      </Helmet>
      {/* Success Notification Bar */}
      {step === 3 && showSuccessNotice && (
        <div className="success-notification-bar animate-slide-down">
          <p>
            ChinHaStore đã nhận được thông tin đặt lịch của bạn và sẽ liên hệ trong vòng 15 phút
            <br />
            <span style={{ fontSize: '0.82rem', color: '#fff', marginTop: '4px', display: 'block', fontWeight: 600 }}>
              Dưới đây là thông tin bạn đã đặt. Hãy tải hóa đơn về máy nếu bạn cần
            </span>
          </p>
          <div className="draft-actions">
            <button className="btn-close-draft" onClick={() => setShowSuccessNotice(false)}>
              ĐÓNG
            </button>
          </div>
        </div>
      )}

      {/* Recovery Prompts (Local or Remote) */}
      {(showLocalPrompt || showRemotePrompt) && (
        <div className="draft-recovery-bar animate-slide-down">
          <p>
            {showRemotePrompt
              ? "Bạn có một bản nháp từ thiết bị này. Khôi phục thông tin?"
              : "Phát hiện đơn hàng chưa hoàn tất từ trước. Bạn có muốn khôi phục?"}
            <br />
            <span style={{ fontSize: '0.82rem', color: '#ffffffff', marginTop: '4px', display: 'block', fontWeight: 600 }}>
              Bản nháp: {getDraftSummary(showRemotePrompt ? remoteDraft : localDraft)}
            </span>
          </p>
          <div className="draft-actions">
            <button onClick={() => applyDraft(showRemotePrompt ? remoteDraft : localDraft)}>
              QUAY LẠI BOOKING TRƯỚC ĐÓ
            </button>
            <button
              className="btn-close-draft"
              onClick={() => {
                setShowLocalPrompt(false);
                setShowRemotePrompt(false);
              }}
            >
              BỎ QUA
            </button>
          </div>
        </div>
      )}

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
                      {(!selectedCamera || !productList.some(p => p.id === selectedCamera)) && (
                        <option value="" disabled>Hãy chọn thiết bị</option>
                      )}
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
                        Lấy Ban Ngày ({siteSettings.pickup_time_day})
                      </button>
                      <button
                        className={rentalType === 'NIGHT' ? 'active' : ''}
                        onClick={() => setRentalType('NIGHT')}
                      >
                        Lấy Ban Đêm ({siteSettings.pickup_time_night})
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
                          <span>Ca Sáng ({siteSettings.pickup_time_shift_a} - {siteSettings.return_time_shift_a})</span>
                        </button>
                        <button className={`shift-box ${shiftType === 'B' ? 'active' : ''}`} onClick={() => setShiftType('B')}>
                          <span>Ca Chiều ({siteSettings.pickup_time_shift_b} - {siteSettings.return_time_shift_b})</span>
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

                  {/* VÙNG CHỌN PHỤ KIỆN ĐÍNH KÈM */}
                  {currentProduct && globalAccessories.filter(a => a.applicable_categories.includes('Tất cả') || a.applicable_categories.includes(currentProduct.category)).length > 0 && (
                    <div className="form-group accessories-section animate-in" style={{ marginTop: '1.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1a202c' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                        TÙY CHỌN THUÊ KÈM
                      </label>
                      <div className="accessories-grid" style={{ display: 'grid', gap: '0.8rem', marginTop: '0.5rem' }}>
                        {globalAccessories
                          .filter(a => a.applicable_categories.includes('Tất cả') || a.applicable_categories.includes(currentProduct.category))
                          .map(acc => {
                            const selectedAcc = selectedAccessories.find(sa => sa.id === acc.id);
                            const isSelected = !!selectedAcc;
                            const isNumberInput = acc.config?.ui?.input_type === 'number';
                            const quantity = selectedAcc ? selectedAcc.selected_quantity : 0;
                            const unitLabel = acc.config?.ui?.unit_label || '';

                            const updateQty = (newQty) => {
                              if (newQty <= 0) {
                                setSelectedAccessories(selectedAccessories.filter(sa => sa.id !== acc.id));
                              } else {
                                if (isSelected) {
                                  setSelectedAccessories(selectedAccessories.map(sa => sa.id === acc.id ? { ...sa, selected_quantity: newQty } : sa));
                                } else {
                                  setSelectedAccessories([...selectedAccessories, { ...acc, selected_quantity: newQty }]);
                                }
                              }
                            };

                            return (
                              <div key={acc.id} className={`accessory-card ${isSelected ? 'selected' : ''}`} style={{
                                display: 'flex', alignItems: 'center', padding: '12px', border: `1px solid ${isSelected ? '#000' : '#DDD'}`,
                                borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: isSelected ? '#F8F8F8' : '#FFF'
                              }} onClick={() => {
                                if (!isNumberInput) {
                                  if (isSelected) updateQty(0);
                                  else updateQty(1);
                                }
                              }}>
                                {!isNumberInput ? (
                                  <input 
                                    type="checkbox"
                                    className="accessory-checkbox" 
                                    checked={isSelected}
                                    readOnly
                                  />
                                ) : (
                                  <div style={{ marginRight: '12px', display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden', background: '#fff' }} onClick={(e) => e.stopPropagation()}>
                                    <button 
                                      type="button" 
                                      onClick={() => updateQty(quantity - 1)}
                                      style={{ padding: '6px 10px', background: '#f5f5f5', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                    >-</button>
                                    <input 
                                      type="number" 
                                      value={quantity}
                                      onChange={(e) => updateQty(parseInt(e.target.value) || 0)}
                                      style={{ width: '40px', textAlign: 'center', border: 'none', padding: '6px 0', fontSize: '0.9rem', MozAppearance: 'textfield' }}
                                    />
                                    <button 
                                      type="button" 
                                      onClick={() => updateQty(quantity + 1)}
                                      style={{ padding: '6px 10px', background: '#f5f5f5', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                    >+</button>
                                  </div>
                                )}
                                <div style={{ flex: 1 }} onClick={() => {
                                  if (isNumberInput && !isSelected) updateQty(1);
                                }}>
                                  <div style={{ fontWeight: '600', color: '#111', fontSize: '0.85rem', }}>
                                    {acc.name} {unitLabel && <span style={{fontWeight: 'normal', color: '#666', fontSize: '0.8rem'}}>({unitLabel})</span>}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px', }}>
                                    +{new Intl.NumberFormat('vi-VN').format(acc.price)}đ {acc.config?.pricing?.calculate_by === 'per_day' || (!acc.config && acc.charge_type === 'per_day') ? '/ Ngày' : '/ Lần'}
                                    {acc.config?.pricing?.shift_price && ` (Thuê ca: ${new Intl.NumberFormat('vi-VN').format(acc.config.pricing.shift_price)}đ)`}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        }
                      </div>
                    </div>
                  )}

                  <div className="guide-inline-desktop" style={{ marginTop: '2rem' }}>
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
                      <button
                        className={`city-box ${cusCity === 'Hồ Chí Minh' ? 'active' : ''}`}
                        disabled={true}
                        style={{ position: 'relative', opacity: 0.6, cursor: 'not-allowed' }}
                      >
                        Hồ Chí Minh
                        <span style={{ display: 'block', fontSize: '0.7rem', color: '#888', marginTop: '2px', textTransform: 'lowercase' }}>(Coming back soon)</span>
                      </button>
                      <button
                        className={`city-box ${cusCity === 'Buôn Ma Thuột' ? 'active' : ''}`}
                        onClick={() => setCusCity('Buôn Ma Thuột')}
                      >
                        Buôn Ma Thuột
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>HÌNH THỨC NHẬN MÁY</label>
                    <div className="receive-method-selector">
                      <button
                        className={`method-box ${receiveMethod === 'store' ? 'active' : ''}`}
                        onClick={() => setReceiveMethod('store')}
                      >
                        Nhận tại cửa hàng
                      </button>
                      <button
                        className={`method-box ${receiveMethod === 'delivery' ? 'active' : ''}`}
                        onClick={() => setReceiveMethod('delivery')}
                      >
                        Giao tận nơi
                        <p style={{ display: 'block', fontSize: '0.7rem', color: 'rgba(174, 174, 174, 1)', marginTop: '2px' }}>(Có tính phí)</p>
                      </button>
                    </div>
                  </div>

                  {receiveMethod === 'store' ? (
                    <div className="form-group store-address-box">
                      <label>ĐỊA CHỈ CỬA HÀNG</label>
                      <div className="store-address-content">
                        <p>23 Lê Thánh Tông, Phường Buôn Ma Thuột, Tỉnh Đắk Lắk</p>
                        <a
                          href="https://maps.app.goo.gl/jNToF7Fc4keUdDkBA"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="map-link-btn"
                          title="Xem trên Google Maps"
                        >
                          Xem bản đồ
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label>ĐỊA CHỈ NHẬN MÁY</label>
                      <div className="address-dropdowns" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.8rem' }}>
                        <select className="address-select" value={selProvCode} onChange={handleProvinceChange}>
                          <option value="">Chọn Tỉnh/Thành</option>
                          {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                        </select>
                        <select className="address-select" value={selDistCode} onChange={handleDistrictChange} disabled={!selProvCode}>
                          <option value="">Chọn Quận/Huyện</option>
                          {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                        </select>
                        <select className="address-select" value={selWardCode} onChange={handleWardChange} disabled={!selDistCode}>
                          <option value="">Chọn Phường/Xã</option>
                          {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder="Số nhà, Tên đường (địa chỉ chi tiết)..."
                        value={cusAddress}
                        onChange={(e) => setCusAddress(e.target.value)}
                      />
                      <small className="form-notice">
                        * Phí giao hàng tính theo ứng dụng (Grab/Be/XanhSM) và do khách hàng thanh toán trực tiếp.
                      </small>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Mạng xã hội (Facebook/Zalo)</label>
                    <input type="text" placeholder="Link Facebook hoặc số Zalo" value={cusSocial} onChange={(e) => setCusSocial(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label>HÌNH THỨC ĐẶT CỌC (CHỌN 1 TRONG 2)</label>
                    <div className="deposit-selector-grid">
                      <div
                        className={`deposit-option-card ${cusDepositType === 'standard' ? 'active' : ''}`}
                        onClick={() => setCusDepositType('standard')}
                      >
                        <div className="option-header">CƠ BẢN</div>
                        <div className="option-desc">CCCD + 3.000.000 VNĐ</div>
                      </div>
                      <div
                        className={`deposit-option-card ${cusDepositType === 'property' ? 'active' : ''}`}
                        onClick={() => setCusDepositType('property')}
                      >
                        <div className="option-header">TÀI SẢN</div>
                        <div className="option-desc">CCCD + Tài sản (Laptop/Lens/...) tương đương</div>
                      </div>
                    </div>
                  </div>

                  <button className="btn-back-step" onClick={() => setStep(1)}>← QUAY LẠI CHỌN MÁY</button>
                </div>
              )}
            </div>

            <div className="booking-result-side">
              {!result ? (
                <div className="result-placeholder">
                  <p>
                    {!selectedCamera
                      ? 'Vui lòng chọn thiết bị để xem báo giá.'
                      : (!startDate || (rentalType !== 'SHIFT' && !endDate))
                        ? 'Vui lòng chọn đầy đủ ngày nhận và trả máy.'
                        : 'Vui lòng hoàn tất thông tin để xem báo giá dự kiến.'}
                  </p>
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
                    <button
                      className={`btn-confirm-booking ${(!selectedCamera || !startDate || (rentalType !== 'SHIFT' && !endDate)) ? 'disabled' : ''}`}
                      onClick={handleNextStep}
                      disabled={!selectedCamera || !startDate || (rentalType !== 'SHIFT' && !endDate)}
                    >
                      BƯỚC TIẾP THEO
                    </button>
                  ) : (
                    <div className="policy-acceptance-container">
                      <label className="policy-checkbox-label">
                        <input
                          type="checkbox"
                          checked={isPolicyAccepted}
                          onChange={(e) => setIsPolicyAccepted(e.target.checked)}
                        />
                        <span>
                          Bằng việc bấm thuê bạn đồng ý và chấp nhận <a href="/chinh-sach" target="_blank" rel="noreferrer">Chính sách và điều khoản</a> của ChinHaStore
                        </span>
                      </label>

                      <div className="captcha-wrapper" style={{ margin: '15px 0', display: 'flex', justifyContent: 'center', minHeight: '65px' }}>
                        {step === 2 && !showLocalPrompt && !showRemotePrompt && isPolicyAccepted && (
                          <Turnstile
                            ref={turnstileRef}
                            siteKey="0x4AAAAAADKQ-kplunorEsim"
                            onSuccess={(token) => setCaptchaToken(token)}
                            onError={(err) => {
                              console.error('Turnstile Error:', err);
                              setCaptchaToken('');
                            }}
                            onExpire={() => {
                              console.warn('Turnstile Expired, resetting...');
                              setCaptchaToken('');
                            }}
                            retry="auto"
                            refreshExpired="auto"
                          />
                        )}
                      </div>

                      <button
                        className={`btn-confirm-booking ${(!isPolicyAccepted || !captchaToken) ? 'disabled' : ''}`}
                        disabled={isSubmitting || !isPolicyAccepted || !captchaToken}
                        onClick={handleFinalSubmit}
                      >
                        {isSubmitting ? 'ĐANG GỬI...' : 'XÁC NHẬN ĐẶT LỊCH'}
                      </button>
                    </div>
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

        {step === 3 && !paymentOption && (
          <div className="payment-step-container animate-in">
            <h2 className="payment-step-title">Bước cuối cùng</h2>
            <p className="payment-step-subtitle">Chọn hình thức hoàn tất đơn đặt thuê của bạn</p>
            
            <div className="payment-options-list">
              
              <div 
                className="payment-option-row hover-fade"
                onClick={() => setPaymentOption('pay')}
              >
                <div className="payment-option-content">
                  <h3 className="payment-option-header-gradient">Chốt đơn ngay!</h3>
                  <p className="payment-option-desc payment-option-desc-gold">Thanh toán trực tiếp và đơn thuê của bạn sẽ tự động được đăng ký. Không cần lo lắng mất lịch thuê, thanh toán ngay<br/>QR hỗ trợ tất cả ngân hàng Việt Nam trừ VNPay</p>
                </div>
                <div className="payment-option-arrow">→</div>
              </div>

              <div 
                className="payment-option-row hover-fade"
                onClick={() => setPaymentOption('wait')}
              >
                <div className="payment-option-content">
                  <h3 className="payment-option-header-solid">Hoàn tất sau</h3>
                  <p className="payment-option-desc payment-option-desc-gray">Bạn còn cân nhắc? Đừng lo, đơn của bạn đã được gửi đi. ChinHaStore sẽ liên lạc và tư vấn cho bạn. Bấm để nhận hóa đơn ngay. Thanh toán sớm để chốt lịch nhé</p>
                </div>
                <div className="payment-option-arrow">→</div>
              </div>

            </div>
          </div>
        )}

        {step === 3 && paymentOption === 'pay' && !isPaymentConfirmed && (
          <div className="qr-payment-container animate-in" style={{maxWidth: '500px', margin: '3rem auto', textAlign: 'center', background: '#fff', padding: '3rem 2rem', borderRadius: '24px', boxShadow: '0 12px 40px rgba(0,0,0,0.1)'}}>
            <h2 style={{color: '#83713f', marginBottom: '1rem', fontSize: '1.8rem'}}>Thanh Toán Tiền Cọc</h2>
            <p style={{marginBottom: '2rem', color: '#555', fontSize: '1.05rem', lineHeight: '1.5'}}>Mở ứng dụng ngân hàng và quét mã QR dưới đây để thanh toán tự động.</p>
            
            <div className="qr-code-box" style={{display: 'inline-block', padding: '1rem', border: '2px solid #eee', borderRadius: '16px', marginBottom: '1rem', background: '#fff', position: 'relative'}}>
              <img 
                src={`https://qr.sepay.vn/img?bank=TPBank&acc=00003565930&template=compact&amount=${calculatedDeposit}&des=CHINHA%20${createdBookingId}`}
                alt="QR Code"
                style={{width: '280px', height: '280px', display: 'block'}}
              />
              <div style={{position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold'}}>
                Còn lại: {formatTime(timeLeft)}
              </div>
            </div>
            
            <div style={{fontSize: '1.2rem', fontWeight: 'bold', color: '#333', marginBottom: '2rem'}}>
              Số tiền: <span style={{color: '#83713f'}}>{new Intl.NumberFormat('vi-VN').format(calculatedDeposit)} VNĐ</span>
            </div>

            <div className="payment-status" style={{padding: '1.2rem', background: '#f8f9fa', borderRadius: '12px', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'}}>
              <div className="spinner" style={{width: '24px', height: '24px', border: '3px solid #ddd', borderTopColor: '#83713f', borderRadius: '50%', animation: 'spin 1s linear infinite'}} />
              <span style={{fontWeight: 'bold', color: '#444', fontSize: '1.1rem'}}>Đang chờ thanh toán...</span>
            </div>

            <button 
              className="btn-back"
              onClick={() => setShowCancelModal(true)}
              style={{background: 'none', border: 'none', color: '#dc3545', textDecoration: 'underline', cursor: 'pointer', fontSize: '1rem', padding: '0.5rem'}}
            >
              Hủy giao dịch
            </button>

            {showCancelModal && (
              <div className="cancel-modal" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999}}>
                <div style={{background: '#fff', padding: '2rem', borderRadius: '16px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.2)'}}>
                  <h3 style={{marginBottom: '1rem', color: '#333', fontSize: '1.5rem'}}>Xác nhận hủy</h3>
                  <p style={{marginBottom: '2rem', color: '#666', fontSize: '1.05rem', lineHeight: 1.5}}>Bạn muốn hủy giao dịch này chứ? Đơn đặt lịch của bạn sẽ bị hủy bỏ ngay lập tức.</p>
                  <div style={{display: 'flex', gap: '1rem', justifyContent: 'center'}}>
                    <button onClick={() => setShowCancelModal(false)} style={{padding: '0.8rem 1.5rem', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', cursor: 'pointer', flex: 1, fontWeight: 'bold'}}>Không, để tôi thanh toán</button>
                    <button onClick={() => handleCancelTransaction(false)} style={{padding: '0.8rem 1.5rem', border: 'none', borderRadius: '8px', background: '#dc3545', color: '#fff', cursor: 'pointer', flex: 1, fontWeight: 'bold'}}>Đồng ý hủy</button>
                  </div>
                </div>
              </div>
            )}
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {step === 3 && (paymentOption === 'wait' || isPaymentConfirmed) && (
          <div className="ticket-container animate-in">
            <div className="booking-ticket" id="main-ticket-view">
              <div className="ticket-header">
                <h1>PHIẾU THANH TOÁN GIỮ LỊCH</h1>
                {isPaymentConfirmed ? (
                  <div style={{display: 'inline-block', background: '#4caf50', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '8px', boxShadow: '0 2px 8px rgba(76,175,80,0.4)'}}>ĐÃ THANH TOÁN</div>
                ) : null}
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#000000' }}>Mã yêu cầu: #{createdBookingId || 'PROCESSING'}</p>
                <p>Vui lòng cung cấp mã này nếu có thắc mắc cần giải đáp</p>
              </div>

              <div className="ticket-body">
                <div className="ticket-grid-2">
                  <div className="ticket-section">
                    <div className="ticket-label">Khách Hàng</div>
                    <div className="ticket-value">{cusName}</div>
                    <div className="ticket-sub-value">{cusPhone}</div>
                  </div>
                  <div className="ticket-section">
                    <div className="ticket-label">Nhận Máy Tại</div>
                    <div className="ticket-value">
                      {receiveMethod === 'store' ? 'Cửa hàng (23 Lê Thánh Tông)' : (cusAddress || cusCity)}
                    </div>
                  </div>
                  <div className="ticket-section">
                    <div className="ticket-label">Thiết bị</div>
                    <div className="ticket-equipment-box">
                      <div className="ticket-value">{currentProduct.name}</div>
                      {currentProduct.image && (
                        <img src={currentProduct.image} alt="Device" className="ticket-device-img" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="ticket-section">
                  <div className="ticket-label">Thời gian thuê</div>
                  <div className="ticket-value">{result?.times.start} đến {result?.times.end}</div>
                </div>

                <div className="ticket-divider"></div>

                <div className="ticket-section">
                  <div className="ticket-label">Chi tiết giá</div>
                  {result?.breakdown.map((item, idx) => (
                    <div key={idx} className="ticket-line">
                      <span className="ticket-label-text">{item.label}</span>
                      <span className="ticket-dots"></span>
                      <span className="ticket-value-text">{item.value} đ</span>
                    </div>
                  ))}
                </div>
                <div className="ticket-divider"></div>

                <div className="ticket-section bank-details-on-ticket">
                  <div className="ticket-label">Thông tin thanh toán</div>
                  <div className="bank-info-line">
                    <span className="bank-info-label">Ngân hàng:</span>
                    <strong className="bank-info-val">SeaBank</strong>
                  </div>
                  <div className="bank-info-line">
                    <span className="bank-info-label">Số tài khoản:</span>
                    <div className="account-number-box">
                      <strong className="bank-info-val">000000407891</strong>
                      <button className="btn-copy-mini" onClick={handleCopyAccountNum}>
                        {isCopyingAccount ? 'ĐÃ SAO CHÉP' : 'SAO CHÉP'}
                      </button>
                    </div>
                  </div>
                  <div className="bank-info-line">
                    <span className="bank-info-label">Chủ tài khoản:</span>
                    <strong className="bank-info-val">MAN HI CHIN</strong>
                  </div>
                  <div className="notice-box">
                    <p className="notice-text">ChinHa Store đã nhận được thông tin của bạn. Chúng tôi sẽ liên hệ lại trong vòng 15 phút để xác nhận đơn hàng và chốt lịch khi nhận được thanh toán giữ chỗ của bạn. Nếu sau 15 phút bạn không được liên hệ vui lòng gọi số 0842204207 (Hi Chin) hoặc 0911792003 (Thái Tuấn). Lưu ý: Giờ hoạt động của ChinHaStore là từ 7:30 sáng đến 22:00 hàng ngày </p>
                  </div>
                </div>

                <div className="ticket-divider"></div>

                <div className="ticket-summary-row">
                  {(() => {
                    const priceNum = Number(result?.price?.replace(/\./g, '')) || 0;
                    const durationDays = result?.breakdown?.filter(i => i.label?.toLowerCase().includes('ngày')).length || 1;
                    let dPerc = 100;
                    if (durationDays >= 2 && durationDays <= 5) dPerc = 50;
                    const dAmount = Math.round(priceNum * (dPerc / 100));

                    return (
                      <>
                        <div className="ticket-summary-left">
                          <img
                            src={`https://qr.sepay.vn/img?bank=TPBank&acc=00003565930&template=compact&amount=${dAmount}&des=CHINHA%20${createdBookingId}`}
                            alt="QR Code"
                            className="ticket-summary-qr"
                          />
                          <div className="qr-text-small">QUÉT ĐỂ ĐẶT CỌC</div>
                        </div>

                        <div className="ticket-summary-right">
                          <div className="summary-item">
                            <span className="summary-label">HÌNH THỨC CỌC</span>
                            <span className="summary-val">{cusDepositType === 'standard' ? 'CƠ BẢN' : 'TÀI SẢN'}</span>
                          </div>
                          <div className="summary-item">
                            <span className="summary-label">SỐ TIỀN CỌC ({dPerc}%)</span>
                            <span className="summary-val accent">{new Intl.NumberFormat('vi-VN').format(dAmount)} đ</span>
                          </div>
                          <div className="ticket-total-mini">
                            <div className="ticket-label">TỔNG CỘNG</div>
                            <div className="ticket-value-total">{result?.price} đ</div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="ticket-actions-row">
                <button className="btn-ticket-action primary" onClick={handleDownloadInvoice} disabled={isDownloading}>
                  {isDownloading ? 'ĐANG XỬ LÝ...' : 'Tải Hóa Đơn'}
                </button>
              </div>

              <div className="ticket-footer">
                <p>ChinHaStore sẽ liên hệ và nhận cọc để xác nhận lịch thuê.</p>
                <p className="footer-brand">CHINHASTORE.OFFICIAL</p>
              </div>
            </div>

            {/* HIDDEN INVOICE AREA FOR CAPTURE (MATCHES ADMIN DESIGN) */}
            <div id="invoice-capture-area" style={{ position: 'absolute', left: '-9999px', top: '0', display: 'none' }}>
              <div className="bill-invoice-v2">
                <div className="bill-v2-header">
                  <h2>CHINHA STORE</h2>
                  <p>HÓA ĐƠN THANH TOÁN GIỮ LỊCH</p>
                  <p style={{ fontSize: '0.7rem', fontWeight: 'bold', marginTop: '4px' }}>Mã hợp đồng: #{createdBookingId}</p>
                </div>
                <hr className="bill-v2-divider" />
                <div className="bill-v2-product-section">
                  {currentProduct.image && (
                    <div className="bill-v2-product-image">
                      <img src={currentProduct.image} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div className="bill-v2-product-info">
                    <h4 className="camera-name">{currentProduct.name?.toUpperCase()}</h4>
                    <div className="bill-v2-dates">
                      <div className="date-box">
                        <span>NHẬN MÁY</span>
                        <strong>{result?.times.start}</strong>
                      </div>
                      <div className="date-box">
                        <span>TRẢ MÁY</span>
                        <strong>{result?.times.end}</strong>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bill-v2-customer-section">
                  <p>Khách hàng: {cusName.toUpperCase()}</p>
                  <p>SĐT: {cusPhone}</p>
                  <p>Nhận máy: {receiveMethod === 'store' ? 'Tại cửa hàng (23 Lê Thánh Tông)' : `Giao tận nơi (${(wardName && distName && provName ? `${cusAddress ? cusAddress + ', ' : ''}${wardName}, ${distName}, ${provName}` : (cusAddress ? `${cusAddress}, ${cusCity}` : cusCity))})`}</p>
                  <p>Hình thức cọc: {cusDepositType === 'standard' ? 'Cơ bản' : 'Tài sản (CCCD + Tài sản tương đương)'}</p>
                </div>
                <hr className="bill-v2-divider" />
                <div className="bill-v2-details-section">
                  {result?.breakdown.map((item, idx) => (
                    <div key={idx} className="bill-v2-toc-item">
                      <span className="bill-v2-toc-label">{item.label}</span>
                      <div className="bill-v2-toc-dots"></div>
                      <span className="bill-v2-toc-value">{item.value} VNĐ</span>
                    </div>
                  ))}
                </div>
                <div className="bill-v2-total-section">
                  <div className="total-row main-total">
                    <span>TỔNG CHI PHÍ DỰ KIẾN:</span>
                    <span style={{ color: '#f60' }}>{result?.price} VNĐ</span>
                  </div>
                </div>
                <div className="bill-v2-qr-section">
                  <img
                    src={`https://qr.sepay.vn/img?bank=TPBank&acc=00003565930&template=compact&amount=${Math.round((Number(result?.price?.replace(/\./g, '')) || 0) * ((result?.breakdown?.filter(i => i.label?.toLowerCase().includes('ngày')).length || 1) >= 2 && (result?.breakdown?.filter(i => i.label?.toLowerCase().includes('ngày')).length || 1) <= 5 ? 0.5 : 1))}&des=CHINHA%20${createdBookingId}`}
                    alt="QR"
                    style={{ width: '120px', height: '120px', marginBottom: '10px' }}
                  />
                  <p style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '5px' }}>THÔNG TIN THANH TOÁN CỌC</p>
                  <p style={{ fontSize: '0.8rem' }}>SEABANK: 000000407891</p>
                  <p style={{ fontSize: '0.8rem' }}>CHỦ TK: MAN HI CHIN</p>
                </div>
              </div>
            </div>

            <button className="btn-return-home" onClick={() => window.location.reload()}>
              XÁC NHẬN & QUAY LẠI
            </button>
          </div>
        )}

        {/* FULL WIDTH RECOMMENDATIONS */}
        {step < 3 && result && result.recommendations && result.recommendations.length > 0 && (
          <div className="recommendation-row animate-in" id="recommendations">
            <h2 className="rec-row-title">NGAY KHUNG GIỜ BẠN CHỌN, CHÚNG TÔI CÒN CÓ</h2>
            <div className="rec-product-grid">
              {result.recommendations.map(rec => (
                <ProductCard
                  key={rec.id}
                  product={rec}
                  onClick={(p) => {
                    setSelectedCamera(p.id);
                    document.querySelector('.booking-page')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                />
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
