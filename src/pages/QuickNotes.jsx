import React, { useState, useEffect } from 'react';
import UniversalMenu from '../components/UniversalMenu';
import api from '../services/api';
import {
    FaPlus,
    FaThumbtack,
    FaTrash,
    FaSearch
} from 'react-icons/fa';
import '../styles/QuickNotes.css';

const NOTE_COLORS = [
    { id: 'yellow', color: '#fef3c7', label: 'Sarı' },
    { id: 'green', color: '#d1fae5', label: 'Yeşil' },
    { id: 'blue', color: '#dbeafe', label: 'Mavi' },
    { id: 'pink', color: '#fce7f3', label: 'Pembe' },
    { id: 'purple', color: '#ede9fe', label: 'Mor' },
    { id: 'orange', color: '#fed7aa', label: 'Turuncu' }
];

const QuickNotes = () => {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [selectedColor, setSelectedColor] = useState('#fef3c7');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const userId = parseInt(localStorage.getItem('userId') || '1', 10);

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        try {
            const response = await api.get(`/api/Notes/user/${userId}`);
            setNotes(response.data);
        } catch (error) {
            console.error('Error loading notes:', error);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;

        try {
            await api.post('/api/Notes', {
                content: newNote,
                color: selectedColor,
                userId
            });
            setNewNote('');
            setIsAdding(false);
            loadNotes();
        } catch (error) {
            console.error('Error adding note:', error);
        }
    };

    const handleDeleteNote = async (id) => {
        try {
            await api.delete(`/api/Notes/${id}`);
            loadNotes();
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    };

    const handleTogglePin = async (id) => {
        try {
            await api.put(`/api/Notes/${id}/pin`);
            loadNotes();
        } catch (error) {
            console.error('Error toggling pin:', error);
        }
    };

    const filteredNotes = notes.filter(note =>
        note.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="notes-container">
            <UniversalMenu />

            {/* Hero Header */}
            <div className="notes-hero">
                <div className="notes-hero-content">
                    <div className="notes-hero-text">
                        <h1>📝 Hızlı Notlar</h1>
                        <p>Anında not al, hiçbir şeyi unutma</p>
                    </div>
                    <div className="notes-hero-stats">
                        <div className="hero-stat">
                            <span className="hero-stat-number">{notes.length}</span>
                            <span className="hero-stat-label">Toplam</span>
                        </div>
                        <div className="hero-stat pinned">
                            <span className="hero-stat-number">{notes.filter(n => n.isPinned).length}</span>
                            <span className="hero-stat-label">📌 Sabitlenmiş</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Arama ve Ekleme */}
            <div className="notes-toolbar">
                <div className="search-wrapper">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Not ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                <button
                    className="add-note-btn"
                    onClick={() => setIsAdding(true)}
                >
                    <FaPlus /> Yeni Not
                </button>
            </div>

            {/* Yeni Not Ekleme Alanı */}
            {isAdding && (
                <div className="new-note-card" style={{ backgroundColor: selectedColor }}>
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Notunuzu yazın..."
                        autoFocus
                    />
                    <div className="new-note-actions">
                        <div className="color-picker">
                            {NOTE_COLORS.map(c => (
                                <button
                                    key={c.id}
                                    type="button"
                                    className={`color-btn ${selectedColor === c.color ? 'selected' : ''}`}
                                    style={{ backgroundColor: c.color }}
                                    onClick={() => setSelectedColor(c.color)}
                                />
                            ))}
                        </div>
                        <div className="action-buttons">
                            <button className="cancel-btn" onClick={() => { setIsAdding(false); setNewNote(''); }}>
                                İptal
                            </button>
                            <button className="save-btn" onClick={handleAddNote}>
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notlar Grid */}
            <div className="notes-grid">
                {filteredNotes.map(note => (
                    <div
                        key={note.id}
                        className={`note-card ${note.isPinned ? 'pinned' : ''}`}
                        style={{ backgroundColor: note.color }}
                    >
                        <div className="note-content">
                            {note.content}
                        </div>
                        <div className="note-footer">
                            <span className="note-date">{formatDate(note.createdAt)}</span>
                            <div className="note-actions">
                                <button
                                    className={`pin-btn ${note.isPinned ? 'active' : ''}`}
                                    onClick={() => handleTogglePin(note.id)}
                                    title={note.isPinned ? 'Sabitlemeyi kaldır' : 'Sabitle'}
                                >
                                    <FaThumbtack />
                                </button>
                                <button
                                    className="delete-btn"
                                    onClick={() => handleDeleteNote(note.id)}
                                    title="Sil"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredNotes.length === 0 && !isAdding && (
                <div className="empty-state">
                    <div className="empty-icon">📝</div>
                    <h3>Henüz not yok</h3>
                    <p>İlk notunuzu ekleyerek başlayın!</p>
                    <button onClick={() => setIsAdding(true)}>İlk Notunu Ekle</button>
                </div>
            )}
        </div>
    );
};

export default QuickNotes;
