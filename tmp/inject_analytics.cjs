const fs = require('fs');
const filePath = 'c:/Users/thait/Desktop/ChinHaStore_Offical/src/services/adminService.js';
let content = fs.readFileSync(filePath, 'utf8');

// The return structure in getDashboardStats
const replacement = `    // 7. Today Visits logic
    const todayStr = today.toISOString().split('T')[0];
    const { data: vData } = await supabase.from('daily_stats').select('visits').eq('date', todayStr).maybeSingle();
    const tVisits = vData?.visits || 0;

    // 8. Weekly Customers (Last 7 days)
    const last7Str = new Date(today.getTime() - 6 * 86400000).toISOString();
    const { data: cwD } = await supabase.from('bookings').select('customer_id').gte('created_at', last7Str).not('status', 'eq', 'Cancelled');
    const wCust = new Set(cwD?.map(b => b.customer_id)).size;

    return {
      rentingToday: rentingToday || 0,
      weeklyCustomers: wCust,
      weeklyDelta: '▼ 0%', 
      todayRevenue: new Intl.NumberFormat('vi-VN').format(todayRevenue),
      upcomingEvents: upcomingEvents || 0,
      todayVisits: tVisits,
      visitsDelta: '▲ 0%',
      bookingNew: bookingNew || 0,
      bookingReturned: bookingReturned || 0,
      bookingConfirmed: bookingConfirmed || 0
    };
  },

  async recordVisit() {
    try {
      const t = new Date().toISOString().split('T')[0];
      const { error } = await supabase.rpc('increment_visits', { target_date: t });
      if (error) {
        const { data: c } = await supabase.from('daily_stats').select('visits').eq('date', t).maybeSingle();
        await supabase.from('daily_stats').upsert({ date: t, visits: (c?.visits || 0) + 1 }, { onConflict: 'date' });
      }
    } catch(e) { console.warn('Stat block bypassed'); }
  },`;

const targetPart = /return\s*\{\s*rentingToday:[\s\S]*?bookingConfirmed\s*\|\|\s*0\s*\};/;
if (content.match(targetPart)) {
    content = content.replace(targetPart, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('SUCCESS: Analytics logic injected.');
} else {
    // Fallback if formatting is slightly different (e.g. without || 0)
    const fallbackTarget = /return\s*\{\s*rentingToday:[\s\S]*?\};/;
    if (content.match(fallbackTarget)) {
       content = content.replace(fallbackTarget, replacement);
       fs.writeFileSync(filePath, content, 'utf8');
       console.log('SUCCESS: Analytics logic injected via fallback.');
    } else {
       console.log('FAILURE: Target code block not found.');
    }
}
