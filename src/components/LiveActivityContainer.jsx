import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import './LiveActivity.css';

const LiveActivityContainer = () => {
    const [activities, setActivities] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [onlineCount, setOnlineCount] = useState(8); // Start with a realistic baseline

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const recent = await adminService.getRecentActivity();
                if (recent && recent.length > 0) {
                    setActivities(recent);
                }
            } catch (err) {
                console.error('Failed to fetch activities:', err);
            }
        };

        fetchActivities();
        // Update online count randomly for "Living" feel
        const interval = setInterval(() => {
            setOnlineCount(prev => {
                const change = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
                return Math.max(5, Math.min(25, prev + change));
            });
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activities.length > 0) {
            // Initial delay
            const initialTimeout = setTimeout(() => setIsVisible(true), 3000);
            
            const rotationInterval = setInterval(() => {
                setIsVisible(false);
                setTimeout(() => {
                    setCurrentIndex(prev => (prev + 1) % activities.length);
                    setIsVisible(true);
                }, 500); // Animation duration
            }, 60000); // Wait 1 minute between notifications

            return () => {
                clearTimeout(initialTimeout);
                clearInterval(rotationInterval);
            };
        }
    }, [activities]);

    if (activities.length === 0) return null;

    const current = activities[currentIndex];

    // Format time: "5 phút trước" etc.
    const formatTime = (isoString) => {
        const diff = new Date() - new Date(isoString);
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'vừa xong';
        if (mins < 60) return `${mins} phút trước`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs} giờ trước`;
        return new Date(isoString).toLocaleDateString('vi-VN');
    };

    return (
        <div className={`live-activity-container ${isVisible ? 'visible' : ''}`}>
            <div className="live-activity-card">
                <div className="live-indicator">
                    <span className="dot pulse"></span>
                    <span className="live-text">TRỰC TUYẾN: {onlineCount}</span>
                </div>
                <div className="activity-content">
                    <p className="activity-main">
                        Khách tại <span className="highlight">{current.city}</span> vừa đặt <span className="highlight">{current.productName}</span>
                    </p>
                    <span className="activity-time">{formatTime(current.time)}</span>
                </div>
                <button className="close-btn" onClick={() => setIsVisible(false)} aria-label="Close">×</button>
            </div>
        </div>
    );
};

export default LiveActivityContainer;
