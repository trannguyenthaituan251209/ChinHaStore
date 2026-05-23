import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Phone } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <>
      <nav className="navbar">
        <div className="container navbar-container">

          {/* Hamburger Menu (Mobile Only, left side) */}
          <div
            className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>

          {/* Logo */}
          <div className="navbar-logo">
            <Link to="/">
              <img src="/assets/image/main_logo.png" alt="ChinHaStore" className="logo-image" />
            </Link>
          </div>

          {/* Navigation Links */}
          <ul className={`navbar-links ${isMobileMenuOpen ? 'open' : ''}`}>
            <li><NavLink to="/" onClick={() => setIsMobileMenuOpen(false)}>TRANG CHỦ</NavLink></li>
            <li><NavLink to="/all-camera" onClick={() => setIsMobileMenuOpen(false)}>KHO MÁY</NavLink></li>
            <li><NavLink to="/chinh-sach" onClick={() => setIsMobileMenuOpen(false)}>CHÍNH SÁCH</NavLink></li>
          </ul>

          {/* Right Section: CTA & Phone */}
          {isHome && (
            <div className="navbar-right">
              <Link to="/dat-lich" className="btn-nav-cta">ĐẶT MÁY NGAY</Link>
              <a href="tel:0842204207" className="btn-nav-phone" title="Gọi Hotline: 0842204207">
                <Phone size={18} />
              </a>
            </div>
          )}

        </div>
      </nav>
      {/* Spacer to prevent content from jumping up behind the fixed navbar */}
      <div className="navbar-spacer"></div>
    </>
  );
};

export default Navbar;
