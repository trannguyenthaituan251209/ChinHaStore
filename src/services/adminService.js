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

    return {
      rentingToday: rentingToday || 0,
      weeklyCustomers: 0, // Placeholder: requires complex weekly aggregation
      weeklyDelta: '0%',
      todayRevenue: new Intl.NumberFormat('vi-VN').format(todayRevenue),
      upcomingEvents: upcomingEvents || 0,
      todayVisits: 0, // Requires a separate analytics/traffic table
      visitsDelta: '0%',
      bookingNew: bookingNew || 0,
      bookingReturned: bookingReturned || 0,
      bookingConfirmed: bookingConfirmed || 0
    };
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
        products (name),
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
      }) : 'N/A';

      return {
        id: b.id,
        customerName: b.customers?.full_name || 'Khách lẻ',
        phone: b.customers?.phone || '',
        productName: b.products?.name || 'Sản phẩm',
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
      }) : 'N/A';

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

    // 1. ALWAYS check for high-precision match (Phone + Name) first
    // This prevents violating the UNIQUE(phone, full_name) constraint
    const { data: exactMatch } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', cleanPhone)
      .ilike('full_name', cleanName)
      .maybeSingle();

    if (exactMatch) return exactMatch.id;

    // 2. If NOT a placeholder, we can also check if phone alone exists
    // (This helps find existing customers if they change their name slightly but keep their real phone)
    const isPlaceholder = cleanPhone === '0' || cleanPhone.toLowerCase() === 'none' || cleanPhone.length < 5;

    if (!isPlaceholder) {
      const { data: phoneMatch } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (phoneMatch) return phoneMatch.id;
    }

    // 3. Create new if neither high-precision nor phone-only match exists
    const { data: created, error } = await supabase
      .from('customers')
      .insert({
        phone: cleanPhone,
        full_name: cleanName,
        email,
        city,
        social
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
      .in('status', ['Confirmed', 'Returned'])
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
      .in('status', ['Confirmed', 'Returned'])
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
      .in('status', ['Confirmed', 'Returned'])
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
        });
      };

      // Initialize EmailJS once at the start
      emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

      // Generate both a raw array (for loops) and a pre-formatted string (for backup)
      const breakdownData = (breakdown || []).map(item => ({
        label: item.label,
        value: item.value
      }));

      // Generate HTML rows - FLAT STRING (no newlines) to prevent EmailJS corruption
      const priceTableHtml = (breakdown || []).length > 0 
        ? breakdown.map(item => `<tr><td style="color: #4a5568; padding: 5px 0;">${item.label}:</td><td style="text-align: right; color: #1a202c; font-weight: 500;">${item.value} VNĐ</td></tr>`).join('')
        : '<tr><td colspan="2" style="color: #718096; padding: 5px 0;">Đang tính toán...</td></tr>';

      // Data for both internal replacement and EmailJS
      const templateData = {
        customer_name: bookingData.customerName || 'Quý khách',
        phone: bookingData.phone || 'Chưa cung cấp',
        product_name: product?.name || 'Sản phẩm',
        product_image: product?.image_url || 'https://via.placeholder.com/100',
        start_date: format(bookingData.start_time),
        end_date: format(bookingData.end_time),
        total_price: new Intl.NumberFormat('vi-VN').format(bookingData.total_price),
        location: bookingData.city || 'Chưa rõ',
        social: bookingData.social || 'Chưa rõ',
        rental_package: bookingData.rentalType || 'Thanh toán linh hoạt',
        price_table: priceTableHtml,
        price_breakdown_rows: priceTableHtml 
      };

      const replaceAll = (text) => {
        if (!text) return 'ChinHaStore Notification';
        let result = text;
        Object.entries(templateData).forEach(([key, val]) => {
          if (typeof val === 'string' || typeof val === 'number') {
            // Remove any potential hidden characters that break EmailJS
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
        
        console.log('--- EMAILJS SENDING (ADMIN THREAD) ---');
        console.log('Recipient:', adminTo);

        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_ADMIN_TEMPLATE_ID || import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          {
            ...templateData,
            header_title: 'THÔNG BÁO ĐƠN HÀNG MỚI',
            greeting: 'Chào Mẫn Hi Chin,',
            intro_text: 'Bạn vừa nhận được một yêu cầu đặt máy mới từ Website ChinHaStore. Vui lòng kiểm tra chi tiết bên dưới:',
            footer_note: 'Yêu cầu này cần được xử lý sớm trên Admin Dashboard. Hãy liên hệ khách hàng ngay để xác nhận lịch trình.',
            subject: adminSubject,
            to_email: adminTo
          }
        );
        console.log('✅ Admin Notification Sent');
      }

      // 2. Send Customer Invoice
      const customerTo = cusEmail ? cusEmail.trim() : '';
      if (config.customer_invoice.enabled && customerTo) {
        const customerSubject = replaceAll(config.customer_invoice.subject);

        console.log('--- EMAILJS SENDING (CUSTOMER THREAD) ---');
        console.log('Recipient:', customerTo);

        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          {
            ...templateData,
            header_title: 'XÁC NHẬN ĐẶT HÀNG',
            greeting: `Xin chào ${templateData.customer_name},`,
            intro_text: `Cảm ơn bạn đã lựa chọn ChinHaStore! Chúng mình đã nhận được yêu cầu đặt thuê máy ${templateData.product_name} của bạn. Chi tiết lịch trình và báo giá được liệt kê bên dưới:`,
            footer_note: `Lưu ý: Nhân viên ChinHaStore sẽ liên hệ với bạn sớm nhất có thể qua số điện thoại ${templateData.phone} để chốt lịch và nhận cọc. Đơn hàng chỉ được xác nhận chính thức sau khi đặt cọc thành công.`,
            subject: customerSubject,
            to_email: customerTo
          }
        );
        console.log('✅ Customer Invoice Sent');
      }

    } catch (err) {
      console.error('Error in sendBookingEmails:', err);
    }
  }
};

export default adminService;
