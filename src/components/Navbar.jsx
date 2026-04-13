import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Store Hours: 07:30 - 21:00 (BMT Time - UTC+7)
  const isStoreOpen = () => {
    // We adjust for UTC+7
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const bmtTime = new Date(utcTime + (3600000 * 7));
    
    const hours = bmtTime.getHours();
    const minutes = bmtTime.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    
    const openTime = 7 * 60 + 30; // 07:30
    const closeTime = 21 * 60;    // 21:00
    
    return totalMinutes >= openTime && totalMinutes < closeTime;
  };

  return (
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
          <Link to="/">ChinHaStore</Link>
        </div>

        {/* Navigation Links */}
        <ul className={`navbar-links ${isMobileMenuOpen ? 'open' : ''}`}>
          <li><Link to="/" onClick={() => setIsMobileMenuOpen(false)}>TRANG CHỦ</Link></li>
          <li><Link to="/all-camera" onClick={() => setIsMobileMenuOpen(false)}>KHO MÁY</Link></li>
          <li><Link to="/dat-lich" onClick={() => setIsMobileMenuOpen(false)}>ĐẶT THUÊ</Link></li>
        </ul>

        {/* Live Status Indicator */}
        <div className="navbar-status">
          <span className={`status-dot ${isStoreOpen() ? 'pulsing' : 'closed'}`}></span>
          <span className="status-text">
            {isStoreOpen() ? 'ĐANG MỞ CỬA' : 'ĐÃ ĐÓNG CỬA'}
          </span>
        </div>
        
      </div>
    </nav>
  );
};

export default Navbar;
