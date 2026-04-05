export const mockBookings = [
  {
    id: 'B001',
    customerName: 'Mẫn Hi Chin',
    productName: 'Canon EOS R50',
    startDate: '2026-01-20',
    startTime: '07:30',
    endDate: '2026-01-21',
    endTime: '07:30',
    rentalType: 'DAY',
    totalPrice: '350.000',
    source: 'Website',
    status: 'Confirmed',
    phone: '0901234567'
  },
  {
    id: 'B002',
    customerName: 'Thái Trần',
    productName: 'Sony A7IV',
    startDate: '2026-01-21',
    startTime: '14:00',
    endDate: '2026-01-21',
    endTime: '21:00',
    rentalType: 'SHIFT',
    shift: 'B',
    totalPrice: '250.000',
    source: 'Zalo',
    status: 'Pending',
    phone: '0987654321'
  },
  {
    id: 'B003',
    customerName: 'Nguyễn Văn A',
    productName: 'DJI Osmo Pocket 3',
    startDate: '2026-01-22',
    startTime: '19:00',
    endDate: '2026-01-23',
    endTime: '19:00',
    rentalType: 'NIGHT',
    totalPrice: '300.000',
    source: 'Facebook',
    status: 'Returned',
    phone: '0911223344'
  }
];

export const adminStats = {
  rentingToday: 3,
  weeklyCustomers: 26,
  weeklyDelta: '+13%',
  todayRevenue: '2.450.000',
  upcomingEvents: 12,
  todayVisits: 961,
  visitsDelta: '-13%',
  bookingNew: 3,
  bookingReturned: 12,
  bookingConfirmed: 4
};
