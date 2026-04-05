import React, { useState } from 'react';
import './Navbar.css';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          <a href="/">ChinHaStore</a>
        </div>

        {/* Navigation Links */}
        <ul className={`navbar-links ${isMobileMenuOpen ? 'open' : ''}`}>
          <li><a href="/">TRANG CHỦ</a></li>
          <li><a href="/rent">ĐẶT THUÊ</a></li>
          <li><a href="/news">TIN TỨC</a></li>
          <li><a href="/policy">CHÍNH SÁCH</a></li>
        </ul>
        
      </div>
    </nav>
  );
};

export default Navbar;
