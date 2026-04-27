import { supabase } from '../utils/supabase';

export const analyticsService = {
  // Increment daily visits
  async recordVisit() {
    // Check if we already counted this session to avoid over-counting on refreshes
    if (sessionStorage.getItem('site_visited_today')) return;

    const today = new Date().toISOString().split('T')[0];

    try {
      // Try to increment for today via RPC
      const { error: rpcError } = await supabase.rpc('increment_daily_visit', { target_date: today });

      // If RPC fails (404 or others), try fallback but catch silently
      if (rpcError) {
        const { data: current } = await supabase
          .from('site_analytics')
          .select('visit_count')
          .eq('date', today)
          .maybeSingle();

        if (current) {
          await supabase
            .from('site_analytics')
            .update({ visit_count: (current.visit_count || 0) + 1 })
            .eq('date', today);
        } else {
          // First visit of the day
          await supabase
            .from('site_analytics')
            .insert([{ date: today, visit_count: 1 }]);
        }
      }
      
      sessionStorage.setItem('site_visited_today', 'true');
    } catch (err) {
      // Silently fail for analytics to keep console clean
    }
  },

  // Get visits for today
  async getTodayVisits() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('site_analytics')
      .select('visit_count')
      .eq('date', today)
      .single();

    if (error || !data) return 0;
    return data.visit_count;
  },

  // Get summary for stats
  async getStatsSummary() {
    const today = new Date().toISOString().split('T')[0];
    
    // Get today
    const { data: todayData } = await supabase
      .from('site_analytics')
      .select('visit_count')
      .eq('date', today)
      .single();

    // Get total (optional, but good for context)
    const { data: allData } = await supabase
      .from('site_analytics')
      .select('visit_count');

    const total = allData?.reduce((sum, item) => sum + (item.visit_count || 0), 0) || 0;

    return {
      today: todayData?.visit_count || 0,
      total: total
    };
  }
};
