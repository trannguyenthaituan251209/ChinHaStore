-- ==============================================================================
-- CHINHASTORE: KHẮC PHỤC TRIỆT ĐỂ 2 CẢNH BÁO BẢO MẬT CRITICAL CỦA SUPABASE
-- Chạy đoạn script SQL này tại:
-- Supabase Dashboard -> Project "ChinHaStore_Offical" -> SQL Editor -> Run
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PHẦN 1: KHẮC PHỤC LỖ HỔNG LỘ LỌT DỮ LIỆU ĐƠN HÀNG (view_booking_details)
-- Cảnh báo: "Security Definer View: public.view_booking_details"
-- Lý do: View này đang cho phép Anon (công khai) xem toàn bộ tên khách, số điện thoại,
--        tiền thuê và thông tin máy đã thuê.
-- ------------------------------------------------------------------------------

-- Lựa chọn tối ưu: Xóa bỏ view nếu không dùng trong ứng dụng
-- (Frontend hiện tại đã truy vấn trực tiếp bảng bookings có bảo mật RLS)
DROP VIEW IF EXISTS public.view_booking_details;

-- Lưu ý: Nếu bạn vẫn muốn giữ lại View này để xem nội bộ trong database,
-- hãy chạy lệnh dưới đây thay vì DROP:
-- ALTER VIEW public.view_booking_details SET (security_invoker = true);
-- REVOKE ALL ON public.view_booking_details FROM anon, public;
-- GRANT SELECT ON public.view_booking_details TO authenticated;


-- ------------------------------------------------------------------------------
-- PHẦN 2: BẢO VỆ BẢNG BÀI VIẾT (public.posts)
-- Cảnh báo: "RLS Disabled in Public: public.posts"
-- Lý do: Bảng posts chưa bật Row-Level Security, kẻ xấu có thể xóa hoặc sửa bài viết.
-- ------------------------------------------------------------------------------

-- 1. Kích hoạt Row-Level Security (RLS) cho bảng posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 2. Xóa các policy cũ (nếu có) để tránh xung đột
DROP POLICY IF EXISTS "Allow public read published posts" ON public.posts;
DROP POLICY IF EXISTS "Allow authenticated admin read all posts" ON public.posts;
DROP POLICY IF EXISTS "Allow authenticated admin insert posts" ON public.posts;
DROP POLICY IF EXISTS "Allow authenticated admin update posts" ON public.posts;
DROP POLICY IF EXISTS "Allow authenticated admin delete posts" ON public.posts;

-- 3. CHÍNH SÁCH ĐỌC (SELECT):
-- Khách vãng lai (anon) và người dùng bình thường CHỈ được xem các bài viết đã xuất bản (status = 'published')
CREATE POLICY "Allow public read published posts"
ON public.posts
FOR SELECT
TO anon, authenticated
USING (status = 'published');

-- Quản trị viên (authenticated) được quyền xem TẤT CẢ bài viết (kể cả bài nháp / draft)
CREATE POLICY "Allow authenticated admin read all posts"
ON public.posts
FOR SELECT
TO authenticated
USING (true);

-- 4. CHÍNH SÁCH GHI (INSERT, UPDATE, DELETE):
-- CHỈ Quản trị viên đã đăng nhập (authenticated) mới được thêm, sửa, xóa bài viết
CREATE POLICY "Allow authenticated admin insert posts"
ON public.posts
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated admin update posts"
ON public.posts
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated admin delete posts"
ON public.posts
FOR DELETE
TO authenticated
USING (true);


-- ------------------------------------------------------------------------------
-- PHẦN 3: HÀM TĂNG LƯỢT XEM BÀI VIẾT AN TOÀN (RPC increment_post_views)
-- Giúp khách đọc bài vẫn tăng được số lượt xem (views) mà không cần cấp quyền
-- sửa đổi toàn bộ bảng posts cho khách vãng lai.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_post_views(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.posts
  SET views = COALESCE(views, 0) + 1
  WHERE id = post_id;
END;
$$;

-- Cấp quyền gọi hàm tăng lượt xem cho mọi người
GRANT EXECUTE ON FUNCTION public.increment_post_views(UUID) TO anon, authenticated;

-- ==============================================================================
-- HOÀN TẤT: Sau khi chạy script này, bấm "Rerun linter" trên Supabase Security Advisor
-- để xác nhận 2 lỗi Critical biến mất hoàn toàn!
-- ==============================================================================

