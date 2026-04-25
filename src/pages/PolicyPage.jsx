import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import './PolicyPage.css';

const PolicyPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="policy-page animate-in">
      <Helmet>
        <title>Chính Sách & Điều Khoản | ChinHaStore</title>
        <meta name="description" content="Chính sách thuê máy, điều khoản dịch vụ và bảo mật thông tin tại ChinHaStore." />
      </Helmet>

      <div className="policy-hero">
        <div className="container">
          <h1>CHÍNH SÁCH & ĐIỀU KHOẢN</h1>
          <p>Thông tin minh bạch, bảo vệ quyền lợi khách hàng là ưu tiên hàng đầu tại ChinHaStore.</p>
        </div>
      </div>

      <div className="container">
        <div className="policy-content-wrapper">
          <aside className="policy-sidebar">
            <nav>
              <ul>
                <li><a href="#rental">Chính sách thuê máy</a></li>
                <li><a href="#payment">Quy định thanh toán</a></li>
                <li><a href="#warranty">Chính sách bảo quản</a></li>
                <li><a href="#privacy">Bảo mật thông tin</a></li>
                <li><a href="#general">Điều khoản chung</a></li>
              </ul>
            </nav>
          </aside>

          <main className="policy-main">
            <section id="rental">
              <h2>1. CHÍNH SÁCH THUÊ MÁY</h2>
              <h3>Giới thiệu về ChinHaStore</h3>
              <p>ChinHaStore là nền tảng đặt thuê máy ảnh trực tuyến, được xây dựng nhằm mang đến giải pháp nhanh chóng và tiện lợi cho những ai có nhu cầu sử dụng thiết bị quay chụp. Thông qua website, khách hàng có thể dễ dàng tìm kiếm, lựa chọn và đặt thuê các thiết bị phù hợp mà không cần phải đến trực tiếp cửa hàng.</p>
              
              <h3>Mô tả dịch vụ</h3>
              <ul>
                <li>Cho thuê máy ảnh từ cơ bản đến chuyên nghiệp.</li>
                <li>Cho thuê ống kính (lens) đa dạng dòng sản phẩm.</li>
                <li>Cho thuê các phụ kiện hỗ trợ như tripod, đèn, pin, thẻ nhớ...</li>
              </ul>

              <h3>Hình thức và thời gian thuê</h3>
              <p><strong>Thuê theo ca (6 tiếng):</strong></p>
              <ul>
                <li>Ca sáng: 07:00 – 13:00</li>
                <li>Ca chiều: 14:00 – 21:00</li>
              </ul>
              <p><strong>Thuê theo ngày:</strong> Nhận thiết bị vào 07:30 hoặc 19:00. Thời gian thuê được tính tròn theo ngày dựa trên mốc giờ nhận.</p>

              <h3>Quy trình giao nhận</h3>
              <ul>
                <li><strong>Nhận tại cửa hàng:</strong> 23 Lê Thánh Tông, Buôn Ma Thuột.</li>
                <li><strong>Giao tận nơi:</strong> Hỗ trợ giao tận địa chỉ yêu cầu (có tính phí vận chuyển).</li>
                <li>Khách hàng có trách nhiệm kiểm tra tình trạng thiết bị (ngoại hình, chức năng) tại thời điểm bàn giao.</li>
              </ul>
            </section>

            <section id="payment">
              <h2>2. QUY ĐỊNH THANH TOÁN & HỦY ĐƠN</h2>
              <h3>Thanh toán giữ lịch</h3>
              <ul>
                <li>Sau khi đơn hàng được xác nhận, khách hàng cần thanh toán một phần hoặc toàn bộ giá trị đơn hàng để giữ lịch.</li>
                <li>Đơn hàng chỉ được xem là hoàn tất đặt chỗ khi ChinHaStore xác nhận đã nhận được khoản thanh toán.</li>
              </ul>

              <h3>Chính sách hủy đơn và hoàn tiền</h3>
              <ul>
                <li><strong>Hủy trước ≥ 24 giờ:</strong> Hoàn lại 100% số tiền đã thanh toán.</li>
                <li><strong>Hủy trong vòng &lt; 24 giờ:</strong> Hoàn lại 50% số tiền đã thanh toán (bù đắp chi phí giữ máy).</li>
                <li><strong>Hủy sát giờ hoặc không đến nhận:</strong> Không hoàn tiền.</li>
                <li>Thời gian xử lý hoàn tiền từ 1 – 3 ngày làm việc.</li>
              </ul>

              <h3>Đặt cọc thiết bị</h3>
              <p>Khách hàng lựa chọn một trong hai hình thức: 
                <br/>1. <strong>Cơ bản:</strong> CCCD + 3.000.000 VNĐ.
                <br/>2. <strong>Tài sản:</strong> CCCD + Tài sản (Laptop/Lens...) có giá trị tương đương.
              </p>
            </section>

            <section id="warranty">
              <h2>3. TRÁCH NHIỆM & XỬ LÝ SỰ CỐ</h2>
              <h3>Trách nhiệm của khách hàng</h3>
              <ul>
                <li>Sử dụng thiết bị đúng mục đích, không tự ý tháo lắp, sửa chữa.</li>
                <li>Bảo quản thiết bị cẩn thận, tránh va đập, rơi vỡ hoặc vào nước.</li>
                <li>Hoàn trả thiết bị đúng thời gian và địa điểm đã thỏa thuận.</li>
              </ul>

              <h3>Trách nhiệm bồi thường</h3>
              <ul>
                <li>Khách hàng bồi thường nếu thiết bị hư hỏng, mất mát do lỗi chủ quan.</li>
                <li>Mức bồi thường dựa trên chi phí sửa chữa thực tế hoặc giá trị thị trường của thiết bị nếu không thể khắc phục.</li>
                <li>ChinHaStore cam kết cung cấp máy đúng mô tả và hỗ trợ kỹ thuật suốt quá trình thuê.</li>
              </ul>
            </section>

            <section id="privacy">
              <h2>4. BẢO MẬT THÔNG TIN</h2>
              <p>ChinHaStore cam kết bảo vệ thông tin cá nhân của khách hàng theo quy định của pháp luật Việt Nam:</p>
              <ul>
                <li><strong>Mục đích:</strong> Chỉ thu thập thông tin (Họ tên, SĐT, Địa chỉ) để xử lý đơn hàng và hỗ trợ khách hàng.</li>
                <li><strong>Phạm vi sử dụng:</strong> Thông tin chỉ sử dụng nội bộ, không chia sẻ cho bên thứ ba khi chưa có sự đồng ý.</li>
                <li><strong>Bảo mật:</strong> Áp dụng các biện pháp kỹ thuật để ngăn chặn truy cập trái phép vào dữ liệu khách hàng.</li>
                <li><strong>Quyền của khách hàng:</strong> Bạn có quyền yêu cầu kiểm tra, cập nhật hoặc xóa thông tin cá nhân bất kỳ lúc nào.</li>
              </ul>
            </section>

            <section id="general">
              <h2>5. ĐIỀU KHOẢN CHUNG</h2>
              <ul>
                <li>Mọi tranh chấp được ưu tiên giải quyết thông qua thương lượng.</li>
                <li>ChinHaStore có quyền cập nhật các điều khoản này và sẽ thông báo công khai trên website.</li>
                <li>Khi đặt thuê, khách hàng được xem là đã đọc và đồng ý với toàn bộ nội dung trên.</li>
              </ul>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default PolicyPage;
