export const products = [
  { 
    id: 'canon-r50', 
    name: 'Canon EOS R50', 
    desc: 'Thiết kế tối giản, siêu di động nhưng mang sự tiện dụng của dòng hệ sinh thái Canon. Lựa chọn điểm 10 cho những vlogger và content creator thích xê dịch.',
    price1Day: '180.000', price2Days: '320.000', price3Days: '440.000', price4DaysPlus: '140.000',
    price6h: '100.000', 
    image: '/assets/image/canon_r50.jpg', 
    designImage: '/assets/image/r50_design.png',
    theme: '#b95674',
    rating: '4.9',
    category: 'Vlog / Beginner'
  },
  { 
    id: 'pocket-3', 
    name: 'DJI Osmo Pocket 3', 
    desc: 'Thiết kế cực gọn nhẹ, siêu di động nhưng mang sự mạnh mẽ mượt mà khó tin. Lựa chọn điểm 10 cho những vlogger và content creator thích xê dịch.',
    price1Day: '180.000', price2Days: '320.000', price3Days: '440.000', price4DaysPlus: '140.000',
    price6h: '100.000',
    image: '/assets/image/pocket_3.jpg', 
    designImage: '/assets/image/pocket3_design.png',
    theme: '#b56262',
    rating: '5.0',
    category: 'Action / Vlog'
  },
  { 
    id: 'xt30', 
    name: 'Fujifilm X-T30', 
    desc: 'Thiết kế tối giản, siêu di động nhưng vẫn mang sức mạnh của dòng máy X-Series. X-T30 là lựa chọn điểm 10 cho những vlogger và content creator thích xê dịch.',
    price1Day: '180.000', price2Days: '320.000', price3Days: '440.000', price4DaysPlus: '140.000',
    price6h: '100.000',
    image: '/assets/image/fujifilm_xt30.jpg', 
    designImage: '/assets/image/XT30_design.png',
    theme: '#a36d35',
    rating: '4.8',
    category: 'Vintage / Street'
  },
  { 
    id: 'g7x', 
    name: 'Canon G7x mark II', 
    desc: 'Thiết kế tối giản, siêu gọn nhẹ cực dễ dàng bỏ túi. Mang sức mạnh khủng phục vụ vlog, lựa chọn điểm 10 cho content creator thích xê dịch.', 
    price1Day: '150.000', price2Days: '280.000', price3Days: '400.000', price4DaysPlus: '120.000', 
    price6h: '80.000',
    image: '/assets/image/canon_g7x.jpg', 
    designImage: '/assets/image/g7x_design.png',
    theme: '#ac5151',
    rating: '5.0',
    category: 'Compact / Vlog'
  },
  { 
    id: 'ricoh-gr4', 
    name: 'Ricoh GR IV', 
    desc: 'Thiết kế tối giản, siêu di động nhưng mang khả năng chớp lấy nét đường phố tuyệt đỉnh. Trợ thủ điểm 10 cho những vlogger và content creator thích xê dịch.', 
    price1Day: '250.000', price2Days: '480.000', price3Days: '680.000', price4DaysPlus: '200.000', 
    price6h: '150.000',
    image: '/assets/image/ricoh_griv.jpg', 
    designImage: '/assets/image/RicohGR4_design.png',
    theme: '#878242',
    rating: '4.9',
    category: 'Street / Pro'
  },
  { 
    id: 'xm5', 
    name: 'Fujifilm X-M5', 
    desc: 'Thiết kế tối giản, siêu di động nhưng vẫn mang sức mạnh của dòng máy X-Series. Khẳng định điểm 10 cho những vlogger và content creator thích xê dịch.', 
    price1Day: '220.000', price2Days: '400.000', price3Days: '580.000', price4DaysPlus: '180.000', 
    price6h: '120.000',
    image: '/assets/image/fujifilm_xm5.jpg', 
    designImage: '/assets/image/XM5_design.png',
    theme: '#3578a3',
    rating: '4.7',
    category: 'Compact / Pro'
  },
  { 
    id: 'xs20', 
    name: 'Fujifilm X-S20', 
    desc: 'Thiết kế vừa vặn, báng cầm sâu chắc tay mang sức mạnh của hệ máy lai Hybrid cao cấp. Lựa chọn điểm 10 cho vlogger và nhà làm phim.', 
    price1Day: '400.000', price2Days: '750.000', price3Days: '1.050.000', price4DaysPlus: '320.000', 
    price6h: '250.000',
    image: '/assets/image/fujifilm_xs20.jpg', 
    designImage: '/assets/image/XS20_design.png',
    theme: '#6fa335',
    rating: '5.0',
    category: 'Hybrid / Pro'
  },
  { 
    id: 'x100vi', 
    name: 'Fujifilm X100VI', 
    desc: 'Thiết kế vintage cổ điển, siêu di động đi kèm vòng xoay giả lập Film. Sự hoàn thiện điểm 10 cho thế hệ content creator gen Z.', 
    price1Day: '200.000', price2Days: '380.000', price3Days: '540.000', price4DaysPlus: '160.000', 
    price6h: '120.000',
    image: '/assets/image/fujifilm_x100vi.jpg', 
    designImage: '/assets/image/X100VI_design.png',
    theme: '#35a382',
    rating: '5.0',
    category: 'Iconic / Pro'
  }
];

// Mock database for "Occupied Time Slots" to test recommendations
// Using full timestamp ISO strings (YYYY-MM-DDTHH:mm:SS)
export const mockAvailability = {
  'canon-r50': [
    // Someone takes Ca A on April 10
    { start: '2026-04-10T07:00:00', end: '2026-04-10T13:00:00' },
    // Someone takes 3 full days (Gói Ngày)
    { start: '2026-04-20T07:30:00', end: '2026-04-23T07:30:00' }
  ],
  'xt30': [
    // Busy for a 6h Ca B on April 5
    { start: '2026-04-05T14:00:00', end: '2026-04-05T21:00:00' }
  ]
};
