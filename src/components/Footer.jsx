import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="container">
        
        <div className="footer-top">
          <div className="footer-brand">
            <h2 className="footer-logo">CHINHA STORE</h2>
            <p className="footer-tagline">Lưu giữ trọn vẹn từng khoảnh khắc thanh xuân của bạn thông qua những thước phim nghệ thuật.</p>
          </div>

          <div className="footer-links">
            <h4 className="footer-heading">KHÁM PHÁ</h4>
            <ul>
              <li><a href="#hero">Trang chủ</a></li>
              <li><a href="#products">Sản phẩm</a></li>
              <li><a href="#how-it-works">Quy trình</a></li>
              <li><a href="#booking">Đặt lịch online</a></li>
            </ul>
          </div>

          <div className="footer-social">
            <h4 className="footer-heading">KẾT NỐI</h4>
            <div className="social-links-list">
              <a href="https://facebook.com/chinhastore" target="_blank" rel="noreferrer">Facebook</a>
              <a href="https://instagram.com/chinhastore" target="_blank" rel="noreferrer">Instagram</a>
              <a href="https://zalo.me" target="_blank" rel="noreferrer">Zalo messenger</a>
            </div>
          </div>

          <div className="footer-contact">
            <h4 className="footer-heading">LIÊN HỆ</h4>
            <p>123 Đường Sáng Tạo, Quận 1, TP. HCM</p>
            <p>090 123 4567</p>
            <p>hi@chinhastore.vn</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} CHINHA STORE OFFICIAL. ALL RIGHTS RESERVED.</p>
          <div className="footer-legal">
            <a href="/policy">Chính sách bảo mật</a>
            <a href="/terms">Điều khoản dịch vụ</a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
