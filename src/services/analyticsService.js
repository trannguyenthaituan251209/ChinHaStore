import { supabase } from '../utils/supabase';

export const analyticsService = {
  // Increment daily visits
  async recordVisit() {
    // Check if we already counted this session to avoid over-counting on refreshes
    if (sessionStorage.getItem('site_visited_today')) return;

    const today = new Date().toISOString().split('T')[0];

    try {
      // 1. Try to increment for today via RPC (Recommended approach)
      const { error: rpcError } = await supabase.rpc('increment_daily_visit', { target_date: today });

      if (rpcError) {
        console.warn('RPC increment_daily_visit failed (possibly missing or RLS issue):', rpcError.message);
        
        // 2. Fallback: Try direct UPSERT (requires RLS to allow anon INSERT & UPDATE)
        const { error: upsertError } = await supabase
          .from('site_analytics')
          .upsert({ date: today, visit_count: 1 }, { onConflict: 'date' });

        if (upsertError) {
          console.error('Direct upsert to site_analytics failed (RLS violation):', upsertError.message);
          return; // Stop here, do not set sessionStorage so it can retry later if fixed
        }
      }
      
      sessionStorage.setItem('site_visited_today', 'true');
    } catch (err) {
      console.error('Analytics record error:', err.message);
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
