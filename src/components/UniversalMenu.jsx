import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/UniversalMenu.css';

const UniversalMenu = ({ isOpen: externalIsOpen, onClose: externalOnClose }) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    
    // Eğer external props varsa onları kullan, yoksa internal state kullan
    const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
    const handleClose = externalOnClose || (() => setInternalIsOpen(false));
    const handleToggle = () => {
        if (externalIsOpen === undefined) {
            setInternalIsOpen(!internalIsOpen);
        } else if (externalOnClose) {
            externalOnClose();
        }
    };

    return (
        <>
            {/* Menü Butonu - sadece internal state kullanılıyorsa göster */}
            {externalIsOpen === undefined && (
                <button 
                    className="universal-menu-button"
                    onClick={handleToggle}
                    aria-label="Menü"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
            )}

            {/* Menü Overlay */}
            {isOpen && (
                <div className="universal-menu-overlay" onClick={handleClose}>
                    <div className="universal-menu" onClick={e => e.stopPropagation()}>
                        <div className="universal-menu-header">
                            <h2>Dijital Ajanda</h2>
                            <button className="universal-menu-close" onClick={handleClose}>×</button>
                        </div>
                        <nav className="universal-menu-nav">
                            <Link to="/home" className="universal-menu-item" onClick={handleClose}>
                                <span className="menu-icon">🏠</span>
                                Anasayfa
                            </Link>
                            <Link to="/dashboard" className="universal-menu-item" onClick={handleClose}>
                                <span className="menu-icon">📊</span>
                                Dashboard
                            </Link>
                            <Link to="/calendar" className="universal-menu-item" onClick={handleClose}>
                                <span className="menu-icon">📅</span>
                                Takvim
                            </Link>
                            <Link to="/journal" className="universal-menu-item" onClick={handleClose}>
                                <span className="menu-icon">📝</span>
                                Notlar
                            </Link>
                            <Link to="/projects" className="universal-menu-item" onClick={handleClose}>
                                <span className="menu-icon">📋</span>
                                Projeler
                            </Link>
                            <Link to="/kanban" className="universal-menu-item" onClick={handleClose}>
                                <span className="menu-icon">📊</span>
                                Proje Yönetimi
                            </Link>
                            <Link to="/goals" className="universal-menu-item" onClick={handleClose}>
                                <span className="menu-icon">🎯</span>
                                Hedefler
                            </Link>
                            <Link to="/habits" className="universal-menu-item" onClick={handleClose}>
                                <span className="menu-icon">🔄</span>
                                Alışkanlıklar
                            </Link>
                            <Link to="/books" className="universal-menu-item" onClick={handleClose}>
                                <span className="menu-icon">📚</span>
                                Kitaplar
                            </Link>
                        </nav>
                    </div>
                </div>
            )}
        </>
    );
};

export default UniversalMenu; 