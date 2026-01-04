import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import './UniversalMenu.css';

const MenuIcon = ({ onClick }) => {
  const { isDarkMode } = useTheme();
  return (
    <div className="menu-icon" onClick={onClick}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? "#e0e0e0" : "#222"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="18" x2="20" y2="18" />
      </svg>
    </div>
  );
};

const UniversalMenu = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

  // Add click outside handler
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && !event.target.closest('.side-menu') && !event.target.closest('.menu-icon')) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <>
      <MenuIcon onClick={() => setMenuOpen(!menuOpen)} />
      {menuOpen && (
        <>
          <div className="side-menu-overlay" onClick={() => setMenuOpen(false)} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }} />
          <div className="side-menu" style={{ zIndex: 1000 }}>
            <div className="side-menu-header">Menü</div>
            <ul>
              <li onClick={() => { setMenuOpen(false); navigate('/home'); }}>🏠 Anasayfa</li>
              <li onClick={() => { setMenuOpen(false); navigate('/dashboard'); }}>📊 Dashboard</li>
              <li onClick={() => { setMenuOpen(false); navigate('/calendar'); }}>📅 Takvim</li>
              <li onClick={() => { setMenuOpen(false); navigate('/profile'); }}>👤 Profil</li>
            </ul>

            <div className="theme-toggle-container">
              <span className="theme-label">Tema</span>
              <label className="switch">
                <input type="checkbox" checked={isDarkMode} onChange={toggleTheme} />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default UniversalMenu; 