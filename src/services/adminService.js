import { supabase } from '../utils/supabase';
import emailjs from '@emailjs/browser';

/**
 * Service for administrative data fetching and calculations.
 */
export const adminService = {
  /**
   * Fetches the overall dashboard statistics.
   * Maps live database counts to the adminStats object used by the dashboard.
   */
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString();

    // 1. Renting Today: Bookings active right now (start <= now <= end)
    const { count: rentingToday } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .lte('start_time', new Date().toISOString())
      .gte('end_time', new Date().toISOString())
      .not('status', 'eq', 'Cancelled');

    // 2. Today's Revenue: Sum of total_price for bookings starting today
    const { data: revenueData } = await supabase
      .from('bookings')
      .select('total_price')
      .gte('start_time', todayISO)
      .lt('start_time', tomorrowISO)
      .not('status', 'eq', 'Cancelled');

    const todayRevenue = (revenueData || []).reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);

    // 3. New Bookings Today: Bookings created today
    const { count: bookingNew } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayISO)
      .lt('created_at', tomorrowISO);

    // 4. Returned Today: status = 'Returned' and possibly updated_at today
    const { count: bookingReturned } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Returned');
    // Note: Ideally we'd filter by completion date if available

    // 5. Confirmed Today
    const { count: bookingConfirmed } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Confirmed');

    // 6. Upcoming Events (Next 7 days)
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const { count: upcomingEvents } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('start_time', tomorrowISO)
      .lt('start_time', nextWeek.toISOString());

        // 7. Today Visits logic
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
  },

  /**
   * Fetches all bookings with joined customer and product information.
   */
  async getAllBookings() {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        customers (full_name, phone),
        products (name, image_url),
        inventory_units (serial_number)
      `)
      .order('start_time', { ascending: false });

    if (error) throw error;

    // Map DB structure to the mock format the UI expects
    return data.map(b => {
      const start = b.start_time ? new Date(b.start_time) : null;
      const end = b.end_time ? new Date(b.end_time) : null;
      const format = (d) => d ? d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour12: false,
        timeZone: 'Asia/Ho_Chi_Minh'
      }).replace(' ', ' - ') : 'N/A';

      return {
        id: b.id,
        customerName: b.customers?.full_name || 'Khách lẻ',
        phone: b.customers?.phone || '',
        productName: b.products?.name || 'Sản phẩm',
        productImage: b.products?.image_url || null,
        unitName: b.inventory_units?.serial_number || 'N/A',
        startDate: format(start),
        endDate: format(end),
        totalPrice: new Intl.NumberFormat('vi-VN').format(b.total_price),
        source: b.source || 'Website',
        status: b.status,
        rentalType: b.rental_type,
        start_time: b.start_time,
        end_time: b.end_time,
        customer_id: b.customer_id,
        product_id: b.product_id,
        unit_id: b.unit_id,
        deposit_type: b.deposit_type || 'standard',
        city: b.city || '',
        is_seen: b.is_seen,
        created_at: b.created_at
      };
    });
  },

  /**
   * Fetches bookings with server-side pagination (useful for large history).
   */
  async getBookingsPaginated(page = 0, pageSize = 50, filters = {}) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('bookings')
      .select(`
        *,
        customers (full_name, phone),
        products (name)
      `, { count: 'exact' })
      .order('start_time', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    // Add other filters if needed (product_id, etc.)
    if (filters.product_id && filters.product_id !== 'all') {
      query = query.eq('product_id', filters.product_id);
    }

    const { data, count, error } = await query.range(from, to);

    if (error) throw error;

    const mappedData = data.map(b => {
      const start = b.start_time ? new Date(b.start_time) : null;
      const end = b.end_time ? new Date(b.end_time) : null;
      const format = (d) => d ? d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour12: false,
        timeZone: 'Asia/Ho_Chi_Minh'
      }).replace(' ', ' - ') : 'N/A';

      return {
        id: b.id,
        customerName: b.customers?.full_name || 'Khách lẻ',
        phone: b.customers?.phone || '',
        productName: b.products?.name || 'Sản phẩm',
        startDate: format(start),
        endDate: format(end),
        totalPrice: new Intl.NumberFormat('vi-VN').format(b.total_price),
        source: b.source || 'Website',
        status: b.status,
        start_time: b.start_time,
        end_time: b.end_time,
        product_id: b.product_id,
        deposit_type: b.deposit_type || 'standard',
        city: b.city || '',
        is_seen: b.is_seen
      };
    });

    return { data: mappedData, count };
  },

  /**
   * Price calculation logic based on the store's rules.
   */
  calculatePrice(product, startTime, endTime) {
    if (!product || !startTime || !endTime) return 0;

    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffHrs = diffMs / (1000 * 60 * 60);
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffHrs <= 6) return Number(product.price_6h?.toString().replace(/\./g, '')) || 0;
    if (diffDays === 1) return Number(product.price_1day?.toString().replace(/\./g, '')) || 0;
    if (diffDays === 2) return Number(product.price_2days?.toString().replace(/\./g, '')) || 0;
    if (diffDays === 3) return Number(product.price_3days?.toString().replace(/\./g, '')) || 0;

    // 4+ days: price3Days + (extra days * price4DaysPlus)
    const base3 = Number(product.price_3days?.toString().replace(/\./g, '')) || 0;
    const extra = Number(product.price_4days_plus?.toString().replace(/\./g, '')) || 0;
    return base3 + (diffDays - 3) * extra;
  },

  /**
   * Find or create a customer by phone number and name (Multi-Factor Handshake).
   * Prevents accidental merges AND unique constraint violations.
   */
      async getOrCreateCustomer(customerData) {
    const { phone, full_name, email, city, social } = customerData;
    const cleanPhone = phone?.trim() || '0';
    const cleanName = full_name?.trim() || 'Khách lẻ';

    // 1. SEARCH FOR EXACT IDENTITY (NAME + PHONE)
    // This supports multi-identity scenarios (borrowed SIMs, etc.)
    const { data: exactMatch } = await supabase
      .from('customers')
      .select('id, full_name, phone')
      .eq('phone', cleanPhone)
      .ilike('full_name', cleanName)
      .maybeSingle();

    if (exactMatch) {
       // Optional: Update email/city if they are new
       if (email || city || social) {
         await supabase.from('customers').update({
           email: email || '',
           city: city || 'Hồ Chí Minh',
           social: social || '',
           updated_at: new Date().toISOString()
         }).eq('id', exactMatch.id);
       }
       return exactMatch.id;
    }

    // 2. CREATE NEW IDENTITY
    // Even if phone exists for another name, we create a new distinct record
    const { data: created, error } = await supabase
      .from('customers')
      .insert({
        phone: cleanPhone,
        full_name: cleanName,
        email: email || '',
        city: city || 'Hồ Chí Minh',
        social: social || '',
        status: 'active'
      })
      .select('id')
      .single();

    if (error) throw error;
    return created.id;
  },

  /**
   * Finds the first available physical unit for a product during a time range.
   */
  async findAvailableUnit(productId, startTime, endTime, excludeBookingId = null) {
    if (!productId) return null;

    // 1. Get all units for this product type
    const { data: units, error: uErr } = await supabase
      .from('inventory_units')
      .select('id, serial_number')
      .eq('product_id', productId)
      .eq('status', 'Available');

    if (uErr) {
      console.error('Find units error:', uErr);
      return null;
    }

    if (!units || units.length === 0) {
      console.warn('No physical units found for product:', productId);
      return null;
    }

    // 2. Scan which units are already busy/booked (ignore Pending/Cancelled)
    let query = supabase
      .from('bookings')
      .select('unit_id')
      .eq('product_id', productId)
      .in('status', ['Confirmed', 'Renting', 'Returned'])
      .lt('start_time', endTime)
      .gt('end_time', startTime);

    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId);
    }

    const { data: conflicts, error: cErr } = await query;

    if (cErr) {
      console.error('Check conflicts error:', cErr);
      return null;
    }

    const conflictedUnitIds = new Set(conflicts?.map(c => c.unit_id) || []);

    // 3. Pick the first unoccupied unit
    const availableUnit = units.find(u => !conflictedUnitIds.has(u.id));
    return availableUnit ? availableUnit.id : null;
  },

  /**
   * Fetches the 30-day occupancy snapshot for a specific product.
   * This allows for local availability checking on the frontend.
   */
  async getProductAvailabilityData(productId) {
    if (!productId) return { totalUnits: 0, bookings: [] };

    // 1. Get total units for this product
    const { data: units, error: uErr } = await supabase
      .from('inventory_units')
      .select('id')
      .eq('product_id', productId)
      .eq('status', 'Available');

    if (uErr) throw uErr;

    // 2. Get active bookings for the next 30 days
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(now.getDate() + 30);

    const { data: bookings, error: bErr } = await supabase
      .from('bookings')
      .select('unit_id, start_time, end_time')
      .eq('product_id', productId)
      .in('status', ['Confirmed', 'Renting', 'Returned'])
      .lt('start_time', thirtyDaysLater.toISOString())
      .gt('end_time', now.toISOString());

    if (bErr) throw bErr;

    return {
      totalUnits: units.length,
      bookings: bookings.map(b => ({
        unitId: b.unit_id,
        start: b.start_time,
        end: b.end_time
      }))
    };
  },

  /**
   * Fetches detailed booking information for all conflicts in a time range.
   */
  async getDetailedConflicts(productId, startTime, endTime, excludeBookingId = null) {
    if (!productId) return [];

    let query = supabase
      .from('bookings')
      .select(`
        id,
        start_time,
        end_time,
        customers (full_name)
      `)
      .eq('product_id', productId)
      .in('status', ['Confirmed', 'Renting', 'Returned'])
      .lt('start_time', endTime)
      .gt('end_time', startTime);

    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map(b => ({
      id: b.id,
      customerName: b.customers?.full_name || 'Khách lẻ',
      start: b.start_time,
      end: b.end_time
    }));
  },

  /**
   * Create a new booking.
   */
  async createBooking(bookingData) {
    const customerId = await this.getOrCreateCustomer({
      phone: bookingData.phone,
      full_name: bookingData.customerName,
      email: bookingData.email,
      city: bookingData.city,
      social: bookingData.social
    });

    // Auto-assign an available unit
    const unitId = await this.findAvailableUnit(
      bookingData.product_id,
      bookingData.start_time,
      bookingData.end_time
    );

    if (!unitId) {
      throw new Error('Sản phẩm hiện đã hết máy sẵn sàng vào thời gian này. Vui lòng chọn thời gian khác hoặc sản phẩm khác.');
    }

    const formatTimestamp = (ts) => {
      if (!ts) return null;
      if (ts.includes('+') || ts.includes('Z')) return ts;
      // If it already ends in :ss, don't add :00
      const timePart = ts.split('T')[1] || '';
      const hasSeconds = timePart.split(':').length === 3;
      return `${ts}${hasSeconds ? '' : ':00'}+07:00`;
    };

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        customer_id: customerId,
        product_id: bookingData.product_id,
        unit_id: unitId,
        start_time: formatTimestamp(bookingData.start_time),
        end_time: formatTimestamp(bookingData.end_time),
        rental_type: bookingData.rentalType,
        deposit_type: bookingData.deposit_type || 'standard',
        total_price: bookingData.total_price,
        source: bookingData.source || 'Admin',
        status: bookingData.status || 'Pending',
        is_seen: (bookingData.source && bookingData.source !== 'Website') ? true : false
      })
      .select()
      .single();

    if (error) throw error;

    // --- TRIGGER EMAIL NOTIFICATIONS ---
    // Fetch product name and image for placeholders
    const { data: product } = await supabase.from('products').select('name, image_url').eq('id', bookingData.product_id).single();
    this.sendBookingEmails(bookingData, product, bookingData.email, bookingData.breakdown);

    return data;
  },


  /**
   * Update a booking.
   */
  async updateBooking(id, updates) {
    const { start_time, end_time, status, product_id } = updates;

    // If updating time, status, or product, perform availability check
    if (start_time || end_time || status || product_id) {
      // Fetch current booking data to handle partial updates
      const { data: current, error: fErr } = await supabase
        .from('bookings')
        .select('product_id, start_time, end_time, status, unit_id')
        .eq('id', id)
        .single();

      if (fErr) throw fErr;

      const finalProductId = product_id || current.product_id;
      const finalStart = start_time || current.start_time;
      const finalEnd = end_time || current.end_time;
      const finalStatus = status || current.status;

      // Only check availability if status is active (Confirmed or Returned)
      if (['Confirmed', 'Returned'].includes(finalStatus)) {
        const availableUnitId = await this.findAvailableUnit(finalProductId, finalStart, finalEnd, id);

        if (!availableUnitId) {
          throw new Error('Sản phẩm hiện đã hết máy sẵn sàng vào thời gian này. Vui lòng chọn thời gian hoặc sản phẩm khác.');
        }

        // If the unit needs to change (or was assigned for the first time), update it
        updates.unit_id = availableUnitId;
      }
    }

    const formatTimestamp = (ts) => {
      if (!ts || typeof ts !== 'string') return ts;
      if (ts.includes('+') || ts.includes('Z')) return ts;
      const timePart = ts.split('T')[1] || '';
      const hasSeconds = timePart.split(':').length === 3;
      return `${ts}${hasSeconds ? '' : ':00'}+07:00`;
    };

    const finalUpdates = { ...updates, is_seen: true };
    if (finalUpdates.start_time) finalUpdates.start_time = formatTimestamp(finalUpdates.start_time);
    if (finalUpdates.end_time) finalUpdates.end_time = formatTimestamp(finalUpdates.end_time);

    const { error } = await supabase
      .from('bookings')
      .update(finalUpdates)
      .eq('id', id);
    if (error) throw error;
  },

  /**
   * Quick status update for a booking.
   */
  async updateBookingStatus(id, status) {
    const { error } = await supabase
      .from('bookings')
      .update({ status, is_seen: true })
      .eq('id', id);
    if (error) throw error;
  },

  /**
   * Mark a booking as acknowledged/seen.
   */
  async markBookingAsSeen(id) {
    const { error } = await supabase
      .from('bookings')
      .update({ is_seen: true })
      .eq('id', id);
    if (error) throw error;
  },

  /**
   * Delete a booking.
   */
  async deleteBooking(id) {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  /**
   * Products CRUD
   */
  async getAllProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    if (error) throw error;

    // Map snake_case database columns to camelCase for the UI
    return data.map(p => ({
      ...p,
      price6h: p.price_6h,
      price1Day: p.price_1day,
      price2Days: p.price_2days,
      price3Days: p.price_3days,
      price4DaysPlus: p.price_4days_plus,
      image: p.image_url,
      designImage: p.design_image_url,
      status: p.status || 'active',
      quantity: p.quantity || 1
    }));
  },

  async createProduct(product) {
    const { quantity, ...productData } = product;
    const { data, error } = await supabase
      .from('products')
      .insert({ 
        ...productData, 
        id: self.crypto.randomUUID(), // Manually generate ID to avoid null constraint
        quantity: parseInt(quantity) || 1 
      })
      .select()
      .single();
    if (error) throw error;

    // Create corresponding inventory units
    const units = [];
    for (let i = 1; i <= (parseInt(quantity) || 1); i++) {
      units.push({
        product_id: data.id,
        serial_number: `${data.name} #${i}`,
        status: 'Available'
      });
    }

    if (units.length > 0) {
      const { error: unitError } = await supabase.from('inventory_units').insert(units);
      if (unitError) console.error('Error creating units:', unitError);
    }

    return data;
  },

  async updateProduct(id, updates) {
    const { quantity, ...productData } = updates;
    
    // 1. Get current product to check quantity change
    const { data: current, error: fetchErr } = await supabase
      .from('products')
      .select('name, quantity')
      .eq('id', id)
      .single();
    
    if (fetchErr) throw fetchErr;

    // 2. Update product info
    const { error } = await supabase
      .from('products')
      .update({ ...productData, quantity: parseInt(quantity) })
      .eq('id', id);
    if (error) throw error;

    // 3. Sync Inventory Units if quantity changed
    const newQty = parseInt(quantity);
    const oldQty = current.quantity || 0;

    if (newQty > oldQty) {
      // Add more units
      const unitsToAdd = [];
      for (let i = oldQty + 1; i <= newQty; i++) {
        unitsToAdd.push({
          product_id: id,
          serial_number: `${current.name} #${i}`,
          status: 'Available'
        });
      }
      await supabase.from('inventory_units').insert(unitsToAdd);
    } else if (newQty < oldQty) {
      // Remove units (prioritize those without bookings if possible, but for now just simple removal)
      // Get all units for this product
      const { data: units } = await supabase
        .from('inventory_units')
        .select('id')
        .eq('product_id', id)
        .order('created_at', { ascending: false });

      if (units && units.length > (oldQty - newQty)) {
        const idsToRemove = units.slice(0, oldQty - newQty).map(u => u.id);
        await supabase.from('inventory_units').delete().in('id', idsToRemove);
      }
    }
  },

  async deleteProduct(id) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async updateProductStatus(id, status) {
    const { error } = await supabase
      .from('products')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
  },

  /**
   * Reporting Metrics fetcher.
   */
  async getRevenueByDateRange(startDateStr, endDateStr) {
    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDateStr || startDateStr);
    end.setHours(23, 59, 59, 999);

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        total_price, 
        status,
        start_time,
        products (name),
        customers (full_name)
      `)
      .gte("start_time", start.toISOString())
      .lte("start_time", end.toISOString())
      .not("status", "eq", "Cancelled");

    if (error) throw error;

    const stats = {
      totalRevenue: 0,
      performance: {}, // name -> { count, revenue }
      bookings: []     // [{ customer, product, price }]
    };

    (bookings || []).forEach(b => {
      const price = Number(b.total_price) || 0;
      const pName = b.products?.name || "Máy khác";
      const cName = b.customers?.full_name || "Khách lẻ";

      stats.totalRevenue += price;

      // Aggregated Performance
      if (!stats.performance[pName]) {
        stats.performance[pName] = { name: pName, count: 0, revenue: 0 };
      }
      stats.performance[pName].count++;
      stats.performance[pName].revenue += price;

      // Individual Bookings
      stats.bookings.push({
        customerName: cName,
        productName: pName,
        totalPrice: price,
        date: b.start_time ? new Date(b.start_time).toLocaleDateString("vi-VN") : "N/A"
      });
    });

    return {
      totalRevenue: stats.totalRevenue,
      performance: Object.values(stats.performance).sort((a, b) => b.revenue - a.revenue),
      bookings: stats.bookings
    };
  },

  async getReportData() {
    // 1. All Bookings for aggregation
    const { data: bookings, error: bErr } = await supabase
      .from('bookings')
      .select('total_price, status, product_id, products(name), start_time');

    if (bErr) throw bErr;

    const stats = {
      totalRevenue: 0,
      completedCount: 0,
      cancelledCount: 0,
      productPerformance: {} // id -> { name, count, revenue }
    };

    bookings.forEach(b => {
      const price = Number(b.total_price) || 0;
      if (b.status !== 'Cancelled') {
        stats.totalRevenue += price;
        if (b.status === 'Returned') stats.completedCount++;

        const pId = b.product_id;
        if (!stats.productPerformance[pId]) {
          stats.productPerformance[pId] = { name: b.products?.name || 'Unknown', count: 0, revenue: 0 };
        }
        stats.productPerformance[pId].count++;
        stats.productPerformance[pId].revenue += price;
      } else {
        stats.cancelledCount++;
      }
    });

    return stats;
  },

  /**
   * Customers CRUD
   */
  async getAllCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('full_name');
    if (error) throw error;
    return data;
  },

  async updateCustomer(id, updates) {
    const { error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  async deleteCustomer(id) {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  /**
   * Bulk import bookings from CSV/Real Data.
   * Handles customer creation/matching and batched inserts.
   */
  async bulkImportBookings(bookingsList) {
    const results = { success: 0, total: bookingsList.length, errors: [] };

    for (const item of bookingsList) {
      try {
        const customerId = await this.getOrCreateCustomer({
          phone: item.phone,
          full_name: item.customerName
        });

        const { error } = await supabase.from('bookings').insert({
          customer_id: customerId,
          product_id: item.product_id,
          unit_id: item.unit_id || null,
          start_time: item.start_time,
          end_time: item.end_time,
          rental_type: item.rentalType || 'Manual',
          total_price: Number(item.total_price) || 0,
          source: item.source || 'Imported',
          status: item.status || 'Returned'
        });

        if (error) throw error;
        results.success++;
      } catch (err) {
        results.errors.push({ item: item.customerName, error: err.message });
      }
    }
    return results;
  },

  // --- AUTHENTICATION HARDENING ---

  /**
   * Authoritative Sign In for Admin command center
   */
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  /**
   * RE-AUTHENTICATION HANDSHAKE:
   * Verification step before high-risk actions (e.g. Deletion).
   */
  async verifyPassword(password) {
    const { data: { user }, error: uErr } = await supabase.auth.getUser();
    if (uErr || !user) throw new Error('Không thể xác minh phiên làm việc.');

    const { error: pErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });
    
    if (pErr) throw new Error('Mật khẩu quản trị không chính xác.');
    return true;
  },

  /**
   * Specialized Sign Out to clear session persistence
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Identity Handshake: Retrieve current authoritative session
   */
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) return null;
    return user;
  },

  // --- EMAIL NOTIFICATION & SETTINGS ---

  /**
   * Fetch email templates from the settings table.
   * If doesn't exist, returns defaults.
   */
  async getEmailSettings() {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'email_config')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"

      const defaultSettings = {
        admin_notice: {
          enabled: true,
          recipient: 'manhichin.chinhastore@gmail.com',
          subject: '[NEW BOOKING] {{customer_name}} - {{product_name}}',
          body: `CHINHASTORE - THÔNG BÁO ĐƠN HÀNG MỚI\n\nChào Mẫn Hi Chin,\n\nBạn có một đơn đặt thuê thiết bị mới từ Website:\n\nTHÔNG TIN KHÁCH HÀNG:\n- Tên: {{customer_name}}\n- SĐT: {{phone}}\n- Địa chỉ: {{location}}\n- Mạng xã hội: {{social}}\n\nTHÔNG TIN THIẾT BỊ:\n- Máy: {{product_name}}\n- Gói thuê: {{rental_package}}\n- Thời gian: {{start_date}} - {{end_date}}\n\nDỰ KIẾN DOANH THU:\n- Tổng thanh toán: {{total_price}} VNĐ\n\nVui lòng truy cập Admin Dashboard để xác nhận lịch cho khách.\n\nTrân trọng,\nChinHaStore Hệ Thống`
        },
        customer_invoice: {
          enabled: true,
          subject: 'Xác nhận đặt thuê máy #{{customer_name}} - ChinHaStore',
          body: `<!DOCTYPE html>
<html lang="vi">
<body style="margin: 0; padding: 0; font-family: sans-serif; background-color: #f4f7f6; color: #333;">
    <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e1e9e5;">
        <div style="padding: 30px 20px; text-align: center; border-bottom: 2px solid #f0f4f2;">
            <img src="https://i.ibb.co/LXWYmSqM/logo.png" alt="Logo" style="height: 60px; margin-bottom: 15px;">
            <h1 style="margin: 0; color: #2d3e50; font-size: 22px;">XÁC NHẬN ĐẶT HÀNG</h1>
        </div>
        <div style="padding: 30px 25px;">
            <p style="font-size: 16px;">Xin chào <strong>{{customer_name}}</strong>,</p>
            <p style="font-size: 15px; color: #5a6a7a;">Chúng tôi gửi email này để xác nhận yêu cầu đặt thuê máy <strong>{{product_name}}</strong> của bạn.</p>
            <div style="background-color: #fafbfc; border-radius: 10px; padding: 20px; margin: 25px 0; border: 1px solid #edf2f0;">
                <table style="width: 100%;">
                    <tr>
                        <td style="color: #8899a6; font-size: 12px;">NHẬN MÁY</td>
                        <td style="color: #8899a6; font-size: 12px; text-align: right;">TRẢ MÁY</td>
                    </tr>
                    <tr>
                        <td style="font-size: 15px; font-weight: 700;">{{start_date}}</td>
                        <td style="font-size: 15px; font-weight: 700; text-align: right;">{{end_date}}</td>
                    </tr>
                </table>
            </div>
            <div style="border-bottom: 2px solid #f0f4f2; padding-bottom: 25px; margin-bottom: 25px;">
                <table style="width: 100%;">
                    <tr>
                        <td style="width: 80px;"><img src="{{product_image}}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;"></td>
                        <td style="padding-left: 20px;">
                            <div style="font-size: 17px; font-weight: 700;">{{product_name}}</div>
                            <div style="margin-top: 5px; color: #2b6cb0; font-weight: 600;">{{total_price}} VNĐ</div>
                        </td>
                    </tr>
                </table>
            </div>
            <div style="margin-bottom: 30px;">
                <h3 style="font-size: 14px; color: #8899a6; text-transform: uppercase;">Chi tiết bảng giá</h3>
                <table style="width: 100%; font-size: 14px; line-height: 2;">
                    {{price_breakdown_rows}}
                    <tr style="border-top: 2px solid #1a202c;">
                        <td style="padding-top: 15px; font-size: 16px; font-weight: 700;">Tổng cộng:</td>
                        <td style="padding-top: 15px; font-size: 20px; font-weight: 800; text-align: right;">{{total_price}} VNĐ</td>
                    </tr>
                </table>
            </div>
            <div style="background-color: #fff9f0; border-left: 4px solid #f6ad55; padding: 15px; border-radius: 4px; font-size: 13px; color: #7b341e;">
                <strong>Lưu ý:</strong> Chúng mình sẽ gọi xác nhận qua số <strong>{{phone}}</strong> sớm nhé!
            </div>
        </div>
    </div>
</body>
</html>`
        }
      };

      if (!data) {
        // Automatically seed defaults if missing (Optional, might fail if table missing)
        return defaultSettings;
      }

      return { ...defaultSettings, ...data.value };
    } catch (err) {
      console.warn('Settings table not found or error:', err.message);
      // Return defaults even if table missing so UI doesn't crash
      return {
        admin_notice: { enabled: true, recipient: 'manhichin.chinhastore@gmail.com', subject: '[NEW BOOKING] {{customer_name}}', body: 'New booking received.' },
        customer_invoice: { enabled: true, subject: 'Invoice', body: 'Thank you for your booking.' }
      };
    }
  },

  /**
   * Save email templates to the settings table.
   */
  async updateEmailSettings(config) {
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'email_config', value: config }, { onConflict: 'key' });
    
    if (error) throw error;
  },

  /**
   * Sends automated emails to admin and customer based on templates.
   */
  async sendBookingEmails(bookingData, product, cusEmail, breakdown = []) {
    try {
      const config = await this.getEmailSettings();
      
      const format = (d) => {
        if (!d) return 'Chưa rõ';
        const date = new Date(d);
        if (isNaN(date.getTime())) return 'Chưa rõ';
        return date.toLocaleString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit', 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            timeZone: 'Asia/Ho_Chi_Minh'
        }).replace(' ', ' - ');
      };

      emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

      // --- CALCULATE FINANCIALS FOR THE EMAIL ---
      const totalVal = Number(bookingData.total_price) || 0;
      const discVal = Number(String(bookingData.discount_amount || '0').replace(/\D/g, '')) || 0;
      const finalNet = totalVal - discVal;
      
      const startDT = new Date(bookingData.start_time);
      const endDT = new Date(bookingData.end_time);
      const dDays = Math.ceil((endDT - startDT) / (1000 * 60 * 60 * 24)) || 1;
      let dPercent = 100;
      if (dDays >= 2 && dDays <= 5) dPercent = 50;

      const dAmountNum = Math.round(finalNet * (dPercent / 100));
      const securityDepositNum = Number(String(bookingData.deposit_property || '').replace(/\D/g, '')) || 0;
      const totalCombined = finalNet + securityDepositNum;

      // Generate Boutique Price Table HTML for EmailJS (Flat string to prevent corruption)
      const priceTableHtml = (breakdown || []).length > 0 
        ? breakdown.map(item => `
            <tr>
              <td style="padding: 4px 5px 4px 0; white-space: nowrap; color: #333333; font-size: 14px;">${item.label}</td>
              <td width="100%" style="border-bottom: 1.5px dotted #cccccc; position: relative; bottom: 4px;">&nbsp;</td>
              <td align="right" style="padding: 4px 0 4px 5px; white-space: nowrap; font-weight: 700; color: #000000; font-size: 14px;">${item.value} VNĐ</td>
            </tr>
          `).join('')
        : '<tr><td colspan="3" style="color: #718096; padding: 5px 0;">Đang tính toán...</td></tr>';

      const templateData = {
        order_id: (bookingData.id || 'P-NEW').toUpperCase(),
        order_id_short: (bookingData.id || 'P-NEW').slice(0, 8).toUpperCase(),
        customer_name: bookingData.customerName || 'Quý khách',
        customer_phone: bookingData.phone || 'Chưa cung cấp',
        product_name: product?.name || 'Sản phẩm',
        product_image: product?.image_url || 'https://via.placeholder.com/100',
        start_date: format(bookingData.start_time),
        end_date: format(bookingData.end_time),
        delivery_info: bookingData.city || 'Tại cửa hàng (22 Lê Thánh Tông)',
        deposit_property: bookingData.deposit_property || 'CCCD + 3.000.000 VNĐ',
        source: bookingData.source || 'Website',
        
        // Formatted Prices
        total_price: new Intl.NumberFormat('vi-VN').format(totalCombined),
        discount_amount: new Intl.NumberFormat('vi-VN').format(discVal),
        deposit_amount: new Intl.NumberFormat('vi-VN').format(dAmountNum),
        deposit_amount_numeric: dAmountNum,
        remaining_amount: new Intl.NumberFormat('vi-VN').format(totalCombined - dAmountNum),
        
        // HTML Content
        price_table_html: priceTableHtml
      };

      const replaceAll = (text) => {
        if (!text) return 'ChinHaStore Notification';
        let result = text;
        Object.entries(templateData).forEach(([key, val]) => {
          if (typeof val === 'string' || typeof val === 'number') {
            const safeVal = String(val).replace(/\n/g, ' ').trim();
            result = result.split(`{{${key}}}`).join(safeVal);
          }
        });
        return result;
      };

      // 1. Send Admin Notification
      if (config.admin_notice.enabled) {
        const adminSubject = replaceAll(config.admin_notice.subject);
        const adminTo = (config.admin_notice.recipient && config.admin_notice.recipient.trim()) || 'manhichin.chinhastore@gmail.com';
        
        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_ADMIN_TEMPLATE_ID || import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          {
            ...templateData,
            subject: adminSubject,
            to_email: adminTo
          }
        );
      }

      // 2. Send Customer Invoice
      const customerTo = cusEmail ? cusEmail.trim() : '';
      if (config.customer_invoice.enabled && customerTo) {
        const customerSubject = replaceAll(config.customer_invoice.subject);

        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          {
            ...templateData,
            subject: customerSubject,
            to_email: customerTo
          }
        );
        console.log('✅ Customer Invoice Sent');
      }

    } catch (err) {
      console.error('Error in sendBookingEmails:', err);
    }
  },

  /**
   * Automatically transitions statuses based on current time.
   * Confirmed -> Renting (if start_time passed)
   * Renting -> Returned (if end_time passed)
   */
  async autoSyncStatuses() {
    try {
      const now = new Date().toISOString();
      
      // 1. Confirmed -> Renting (started but not yet finished)
      const { data: toRenting, error: e1 } = await supabase
        .from('bookings')
        .select('id')
        .eq('status', 'Confirmed')
        .lte('start_time', now)
        .gt('end_time', now);
      
      if (e1) throw e1;
      if (toRenting?.length > 0) {
        const ids = toRenting.map(b => b.id);
        await supabase.from('bookings').update({ status: 'Renting' }).in('id', ids);
        console.log(`Auto-synced ${ids.length} bookings to [Renting]`);
      }

      // 2. Renting/Confirmed -> Returned (Finished)
      const { data: toFinished, error: e2 } = await supabase
        .from('bookings')
        .select('id')
        .in('status', ['Confirmed', 'Renting'])
        .lte('end_time', now);

      if (e2) throw e2;
      if (toFinished?.length > 0) {
        const ids = toFinished.map(b => b.id);
        await supabase.from('bookings').update({ status: 'Returned' }).in('id', ids);
        console.log(`Auto-synced ${ids.length} bookings to [Returned/Completed]`);
      }
    } catch (err) {
      console.error('Error in autoSyncStatuses:', err);
    }
  },

  /**
   * Save a booking draft to Supabase.
   */
  async saveBookingDraft(phone, data) {
    if (!phone) return;
    const { error } = await supabase
      .from('booking_drafts')
      .upsert({ phone, data, updated_at: new Date().toISOString() }, { onConflict: 'phone' });
    if (error) console.error('Error saving draft:', error);
  },

  /**
   * Fetch a booking draft by phone.
   */
  async getBookingDraft(phone) {
    if (!phone) return null;
    const { data, error } = await supabase
      .from('booking_drafts')
      .select('data')
      .eq('phone', phone)
      .maybeSingle();
    if (error) {
      console.error('Error fetching draft:', error);
      return null;
    }
    return data?.data || null;
  },

  /**
   * Delete a booking draft.
   */
  async deleteBookingDraft(phone) {
    if (!phone) return;
    const { error } = await supabase
      .from('booking_drafts')
      .delete()
      .eq('phone', phone);
    if (error) console.error('Error deleting draft:', error);
  }
};

export default adminService;
