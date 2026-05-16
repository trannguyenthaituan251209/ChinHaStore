<<<<<<< HEAD
# 📸 ChinHaStore - Nền Tảng Cho Thuê Máy Ảnh Chuyên Nghiệp

ChinHaStore là một hệ thống ứng dụng Web toàn diện (Full-stack Web Application) phục vụ cho dịch vụ kinh doanh và cho thuê thiết bị quay chụp (Máy ảnh, Lens, Gimbal, Phụ kiện) tại khu vực Buôn Ma Thuột (BMT). 

Dự án được thiết kế với giao diện cao cấp, hiện đại (Premium Boutique Style) và hệ thống quản trị (Admin Dashboard) mạnh mẽ, tự động hóa quy trình đặt lịch và quản lý kho hàng.

---

## ✨ Tính Năng Nổi Bật (Core Features)

### 🛒 Dành Cho Khách Hàng (Public Storefront)
*   **Giao diện Premium & Responsive:** Tối ưu hóa UI/UX trên cả Desktop, Tablet và Mobile. Sử dụng tông màu Tối (Dark mode) kết hợp Vàng Kim (Gold) sang trọng.
*   **Hệ Thống Đặt Lịch Thông Minh (Smart Booking):** 
    *   Tự động kiểm tra lịch trống (Availability) theo thời gian thực (Real-time).
    *   Ngăn chặn đặt trùng lịch (Inventory Collision).
    *   Tính toán giá thuê linh hoạt theo số ngày và tiền cọc.
*   **Danh Mục & Sản Phẩm Chi Tiết:** Tích hợp Markdown để hiển thị thông số kỹ thuật, bài viết chuẩn SEO.
*   **Blog & Tin Tức:** Hệ thống chia sẻ kiến thức nhiếp ảnh và cập nhật khuyến mãi.
*   **Tối Ưu SEO (Search Engine Optimization):** Meta tags động, sitemap, JSON-LD schema chuẩn Google dành cho Local Business.

### 🛡️ Dành Cho Quản Trị Viên (Admin Dashboard)
*   **URL Đăng Nhập Bí Mật:** Đường dẫn quản trị được mã hóa và ẩn khỏi người dùng thông thường.
*   **AppLock & Bảo Mật:** Khóa ứng dụng dựa trên IP, nhận diện thiết bị và Cloudflare Turnstile.
*   **Quản Lý Đơn Hàng (Booking Manager):** Theo dõi trạng thái đơn (Chờ xác nhận, Sắp tới, Đang thuê, Đã hoàn tất). Tự động sắp xếp ưu tiên.
*   **Hệ Thống Hóa Đơn (Invoice System):** Xuất hóa đơn, tính toán chi phí phát sinh, tiền cọc.
*   **Email Tự Động (EmailJS):** Tự động gửi email xác nhận đặt lịch cho khách hàng và email thông báo cho Admin ngay lập tức.
*   **Trình Quản Lý Dữ Liệu (Database Modifier):** Thêm, sửa, xóa Sản phẩm, Danh mục, Bài viết Blog trực tiếp trên giao diện CMS.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

*   **Frontend:** React.js, Vite, React Router DOM, Lucide Icons.
*   **Backend & Database:** Supabase (PostgreSQL, Row Level Security - RLS, Storage).
*   **Styling:** Vanilla CSS (BEM Architecture, Flexbox/Grid).
*   **Bảo Mật:** Cloudflare Turnstile (Chống Spam/Bot).
*   **Dịch Vụ Khác:** EmailJS (Gửi Email tự động).

---

## 📂 Cấu Trúc Thư Mục (Project Structure)

```text
ChinHaStore_Offical/
├── public/                 # Tài nguyên tĩnh (Hình ảnh, Video, Favicon, Sitemap)
├── src/
│   ├── components/         # Các UI component có thể tái sử dụng (Navbar, Footer, ProductCard...)
│   │   └── admin/          # Component dành riêng cho trang Quản trị (AppLock, BookingManager...)
│   ├── pages/              # Các trang chính (HomePage, BookingPage, AdminDashboard...)
│   ├── services/           # Logic giao tiếp với Backend/API (adminService, blogService, emailJS...)
│   ├── App.jsx             # File điều hướng (Routing) chính của ứng dụng
│   └── index.css           # CSS Global và Design System (Colors, Typography)
├── supabase/               # Cấu hình Supabase Edge Functions (Xác thực Turnstile)
├── .env.example            # Mẫu file biến môi trường
└── package.json            # Danh sách thư viện và scripts
```

---

## 🚀 Hướng Dẫn Cài Đặt (Getting Started)

### Yêu cầu hệ thống:
*   Node.js (v18 trở lên)
*   NPM hoặc Yarn

### Bước 1: Clone dự án và cài đặt thư viện
```bash
git clone https://github.com/trannguyenthaituan251209/ChinHaStore.git
cd ChinHaStore_Offical
npm install
```

### Bước 2: Thiết lập Biến Môi Trường (Environment Variables)
Tạo một file `.env` ở thư mục gốc của dự án dựa trên file `.env.example`:
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key

# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_ADMIN_TEMPLATE_ID=your_admin_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key

# Cloudflare Turnstile
VITE_TURNSTILE_SITE_KEY=your_site_key
```

### Bước 3: Chạy ứng dụng (Môi trường Phát triển)
```bash
npm run dev
```
Trang web sẽ chạy tại: `http://localhost:5173`

---

## 🔒 Cơ Chế Bảo Mật (Security Note)
*   Dự án sử dụng **Row Level Security (RLS)** trên Supabase để đảm bảo dữ liệu khách hàng được bảo mật tuyệt đối. Người dùng thông thường (Anonymous) chỉ có quyền đọc (Select) thông tin sản phẩm và thêm mới (Insert) đơn đặt lịch.
*   Mọi thao tác thay đổi dữ liệu (Update/Delete) đều yêu cầu đăng nhập bằng tài khoản Admin với Access Token hợp lệ.
*   **Cloudflare Turnstile** được tích hợp ở trang đặt lịch để ngăn chặn các cuộc tấn công spam bot đơn hàng giả mạo.

---

## 👨‍💻 Tác Giả & Bản Quyền
Dự án được thiết kế và phát triển độc quyền cho **ChinHaStore - Cho Thuê Máy Ảnh Buôn Ma Thuột**.
*   **Developer:** ThaiTuan
*   **UI/UX Design:** Phong cách Minimalist, Premium & High-conversion.


