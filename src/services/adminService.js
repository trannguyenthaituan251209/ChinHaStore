import { supabase } from '../utils/supabase';

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
        unit_id: b.unit_id
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
        product_id: b.product_id
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
      full_name: bookingData.customerName
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

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        customer_id: customerId,
        product_id: bookingData.product_id,
        unit_id: unitId,
        start_time: `${bookingData.start_time}:00+07:00`,
        end_time: `${bookingData.end_time}:00+07:00`,
        rental_type: bookingData.rentalType,
        total_price: bookingData.total_price,
        source: bookingData.source || 'Admin',
        status: bookingData.status || 'Pending'
      })
      .select()
      .single();

    if (error) throw error;
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

    const finalUpdates = { ...updates };
    if (finalUpdates.start_time) finalUpdates.start_time = `${finalUpdates.start_time}:00+07:00`;
    if (finalUpdates.end_time) finalUpdates.end_time = `${finalUpdates.end_time}:00+07:00`;

    const { error } = await supabase
      .from('bookings')
      .update(finalUpdates)
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
      status: p.status || 'active'
    }));
  },

  async createProduct(product) {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateProduct(id, updates) {
    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
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
  }
}

export default adminService;
