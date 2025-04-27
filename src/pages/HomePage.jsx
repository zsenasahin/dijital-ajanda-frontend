import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HomePage.css';

const LogoutIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const HomePage = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Hide welcome message after 3 seconds
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 3000);

    // Update clock every second
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());
    };

    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(clockInterval);
    };
  }, []);

  const handleLogout = () => {
    // Burada gerekirse logout işlemleri yapılabilir (örn: token temizleme)
    navigate('/');
  };

  return (
    <div className="home-container">
      {showWelcome ? (
        <div className="welcome-message">
          <h1>Kişisel asistanına hoşgeldin</h1>
        </div>
      ) : (
        <div className="clock-container">
          <h1>{currentTime}</h1>
        </div>
      )}
      <button className="logout-button" onClick={handleLogout}>
        <LogoutIcon />
      </button>
    </div>
  );
};

export default HomePage; 