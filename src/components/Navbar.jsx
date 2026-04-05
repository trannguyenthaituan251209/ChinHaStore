import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
          <Link to="/">ChinHaStore</Link>
        </div>

        {/* Navigation Links */}
        <ul className={`navbar-links ${isMobileMenuOpen ? 'open' : ''}`}>
          <li><Link to="/" onClick={() => setIsMobileMenuOpen(false)}>TRANG CHỦ</Link></li>
          <li><Link to="/all-camera" onClick={() => setIsMobileMenuOpen(false)}>KHO MÁY</Link></li>
          <li><Link to="/dat-lich" onClick={() => setIsMobileMenuOpen(false)}>ĐẶT THUÊ</Link></li>
          <li><Link to="/policy" onClick={() => setIsMobileMenuOpen(false)}>CHÍNH SÁCH</Link></li>
        </ul>
        
      </div>
    </nav>
  );
};

export default Navbar;
