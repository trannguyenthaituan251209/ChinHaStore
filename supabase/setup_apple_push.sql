-- ==============================================================================
-- CHINHASTORE: THIẾT LẬP APPLE REMOTE WEB PUSH (APNs / VAPID) CHO PWA IPHONE
-- Chạy đoạn SQL này trong: Supabase Dashboard -> SQL Editor -> Run
-- ==============================================================================

-- 1. Tạo bảng lưu trữ Token Apple Push (độc nhất cho mỗi iPhone cài PWA)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint TEXT UNIQUE NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Kích hoạt Row Level Security (RLS) để bảo vệ dữ liệu
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Tạo chính sách bảo mật cho phép Web App PWA lưu và cập nhật Push Token
DROP POLICY IF EXISTS "Allow public push_subscriptions manage" ON public.push_subscriptions;
CREATE POLICY "Allow public push_subscriptions manage" 
ON public.push_subscriptions 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 4. Đảm bảo bảng bookings có REPLICA IDENTITY FULL
ALTER TABLE public.bookings REPLICA IDENTITY FULL;

-- 5. Kích hoạt Real-time Replication nếu chưa có (kiểm tra an toàn tránh lỗi 42710)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  END IF;
END $$;

-- ==============================================================================
-- HOÀN TẤT: Bảng push_subscriptions đã sẵn sàng lưu token của iPhone!
-- ==============================================================================
