import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/UniversalMenu.css';

const UniversalMenu = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="universal-menu-overlay" onClick={onClose}>
            <div className="universal-menu" onClick={e => e.stopPropagation()}>
                <div className="universal-menu-header">
                    <h2>Dijital Ajanda</h2>
                    <button className="universal-menu-close" onClick={onClose}>×</button>
                </div>
                <nav className="universal-menu-nav">
                    <Link to="/home" className="universal-menu-item" onClick={onClose}>
                        <span className="menu-icon">🏠</span>
                        Anasayfa
                    </Link>
                    <Link to="/dashboard" className="universal-menu-item" onClick={onClose}>
                        <span className="menu-icon">📊</span>
                        Dashboard
                    </Link>
                    <Link to="/calendar" className="universal-menu-item" onClick={onClose}>
                        <span className="menu-icon">📅</span>
                        Takvim
                    </Link>
                </nav>
            </div>
        </div>
    );
};

export default UniversalMenu; 