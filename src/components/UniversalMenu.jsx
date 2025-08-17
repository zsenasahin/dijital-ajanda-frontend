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
                    <Link to="/dashboard" className="universal-menu-item" onClick={onClose}>
                        <span className="menu-icon">📊</span>
                        Dashboard
                    </Link>
                    <Link to="/home" className="universal-menu-item" onClick={onClose}>
                        <span className="menu-icon">🏠</span>
                        Ana Sayfa
                    </Link>
                    <Link to="/calendar" className="universal-menu-item" onClick={onClose}>
                        <span className="menu-icon">📅</span>
                        Takvim
                    </Link>
                    <Link to="/goals" className="universal-menu-item" onClick={onClose}>
                        <span className="menu-icon">🎯</span>
                        Hedefler
                    </Link>
                    <Link to="/habits" className="universal-menu-item" onClick={onClose}>
                        <span className="menu-icon">🔄</span>
                        Alışkanlıklar
                    </Link>
                    <Link to="/books" className="universal-menu-item" onClick={onClose}>
                        <span className="menu-icon">📚</span>
                        Kitaplar
                    </Link>
                    <Link to="/journal" className="universal-menu-item" onClick={onClose}>
                        <span className="menu-icon">📝</span>
                        Günlük
                    </Link>
                    <Link to="/projects" className="universal-menu-item" onClick={onClose}>
                        <span className="menu-icon">📋</span>
                        Projeler
                    </Link>
                    <Link to="/kanban" className="universal-menu-item" onClick={onClose}>
                        <span className="menu-icon">📊</span>
                        Kanban Board
                    </Link>
                </nav>
            </div>
        </div>
    );
};

export default UniversalMenu; 