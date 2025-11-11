import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UniversalMenu.css';

const MenuIcon = ({ onClick }) => (
  <div className="menu-icon" onClick={onClick}>
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  </div>
);

const UniversalMenu = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <MenuIcon onClick={() => setMenuOpen(!menuOpen)} />
      {menuOpen && (
        <div className="side-menu">
          <div className="side-menu-header">Menü</div>
          <ul>
            <li onClick={() => { setMenuOpen(false); navigate('/home'); }}>Anasayfa</li>
            <li onClick={() => { setMenuOpen(false); navigate('/dashboard'); }}>Dashboard</li>
            <li onClick={() => { setMenuOpen(false); navigate('/calendar'); }}>Takvim</li>
          </ul>
        </div>
      )}
    </>
  );
};

export default UniversalMenu; 