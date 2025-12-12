import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalMenu from '../components/UniversalMenu';
import api from '../services/api';
import { 
    FaPlus, 
    FaEdit, 
    FaTrash, 
    FaSmile, 
    FaCloud, 
    FaMapMarkerAlt,
    FaImage,
    FaSave,
    FaLock,
    FaUnlock,
    FaSearch,
    FaFilter,
    FaCalendar,
    FaTag,
    FaStar,
    FaBook
} from 'react-icons/fa';
import '../styles/Journal.css';

const Journal = () => {
    const navigate = useNavigate();
    const [entries, setEntries] = useState([]);
    const [filteredEntries, setFilteredEntries] = useState([]);
    const [modal, setModal] = useState({ open: false, mode: 'add', entryId: null });
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        mood: '😊',
        moodScore: 5,
        weather: '',
        location: '',
        tags: [],
        images: [],
        isPrivate: false,
        password: ''
    });
    const [originalPassword, setOriginalPassword] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [passwordModal, setPasswordModal] = useState({ open: false, entry: null, action: 'view' });
    const [passwordInput, setPasswordInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMood, setFilterMood] = useState('all');
    const [viewMode, setViewMode] = useState('grid'); // grid or list
    const userId = parseInt(localStorage.getItem('userId') || '1', 10);

    const moods = ['😊', '😢', '😡', '😴', '😐', '🤔', '😍', '😤', '🥳', '😌'];
    const weatherOptions = ['☀️ Güneşli', '🌤️ Parçalı Bulutlu', '☁️ Bulutlu', '🌧️ Yağmurlu', '⛈️ Fırtınalı', '❄️ Karlı', '🌫️ Sisli'];

    // localStorage'dan unlocked entries'i yükle
    useEffect(() => {
        const savedUnlocked = localStorage.getItem(`unlockedEntries_${userId}`);
        if (savedUnlocked) {
            try {
                const unlockedArray = JSON.parse(savedUnlocked);
                if (Array.isArray(unlockedArray) && unlockedArray.length > 0) {
                    setUnlockedEntries(new Set(unlockedArray));
                }
            } catch (e) {
                console.error('Error loading unlocked entries:', e);
            }
        }
    }, [userId]);

    useEffect(() => {
        loadEntries();
    }, []);

    useEffect(() => {
        filterEntries();
    }, [entries, searchTerm, filterMood]);

    // Unlocked entries state - localStorage'dan yüklenecek
    const [unlockedEntries, setUnlockedEntries] = useState(new Set());

    // Unlocked entries'i localStorage'a kaydet
    const saveUnlockedEntries = (newSet) => {
        setUnlockedEntries(newSet);
        localStorage.setItem(`unlockedEntries_${userId}`, JSON.stringify(Array.from(newSet)));
    };

    const loadEntries = async () => {
        try {
            const response = await api.get(`/api/Journal/user/${userId}`);
            setEntries(response.data || []);
        } catch (error) {
            console.error('Error loading entries:', error);
            const errorMessage = error.response?.data?.message || error.response?.data || 'Notlar yüklenirken bir hata oluştu';
            alert(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage, null, 2));
        }
    };

    const filterEntries = () => {
        let filtered = [...entries].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

        if (searchTerm) {
            filtered = filtered.filter(entry => 
                entry.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (filterMood !== 'all') {
            filtered = filtered.filter(entry => entry.mood === filterMood);
        }

        setFilteredEntries(filtered);
    };

    const handleOpenModal = (entry = null) => {
        if (entry) {
            if (entry.isPrivate && entry.password && !unlockedEntries.has(entry.id)) {
                setPasswordModal({ open: true, entry: entry, action: 'edit' });
                return;
            }
            
            setModal({ open: true, mode: 'edit', entryId: entry.id });
            if (entry.date) {
                const entryDate = new Date(entry.date).toISOString().split('T')[0];
                setSelectedDate(entryDate);
            }
            setFormData({
                title: entry.title || '',
                content: entry.content || '',
                mood: entry.mood || '😊',
                moodScore: entry.moodScore || 5,
                weather: entry.weather || '',
                location: entry.location || '',
                tags: entry.tags || [],
                images: entry.images || [],
                isPrivate: entry.isPrivate || false,
                password: ''
            });
            setOriginalPassword(entry.password || '');
        } else {
            setModal({ open: true, mode: 'add', entryId: null });
            setFormData({
                title: '',
                content: '',
                mood: '😊',
                moodScore: 5,
                weather: '',
                location: '',
                tags: [],
                images: [],
                isPrivate: false,
                password: ''
            });
            setOriginalPassword('');
        }
    };

    const handleCloseModal = () => {
        setModal({ open: false, mode: 'add', entryId: null });
        setOriginalPassword('');
    };

    const handleOpenDetail = (entry) => {
        if (entry.isPrivate && entry.password && !unlockedEntries.has(entry.id)) {
            setPasswordModal({ open: true, entry: entry, action: 'view' });
            return;
        }
        setSelectedEntry(entry);
    };

    const handleCloseDetail = () => {
        setSelectedEntry(null);
    };

    const handlePasswordSubmit = () => {
        if (!passwordModal.entry) return;
        
        const entry = passwordModal.entry;
        if (passwordInput === entry.password) {
            const newUnlocked = new Set([...unlockedEntries, entry.id]);
            saveUnlockedEntries(newUnlocked);
            
            if (passwordModal.action === 'view') {
                setSelectedEntry(entry);
            } else if (passwordModal.action === 'edit') {
                handleOpenModal(entry);
            } else if (passwordModal.action === 'delete') {
                handleDelete(entry.id);
            }
            
            setPasswordModal({ open: false, entry: null, action: 'view' });
            setPasswordInput('');
        } else {
            alert('Şifre yanlış!');
            setPasswordInput('');
        }
    };

    const handleDeleteWithPassword = (entry) => {
        if (entry.isPrivate && entry.password && !unlockedEntries.has(entry.id)) {
            setPasswordModal({ open: true, entry: entry, action: 'delete' });
            return;
        }
        if (window.confirm('Bu notu silmek istediğinizden emin misiniz?')) {
            handleDelete(entry.id);
        }
    };

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            alert('Lütfen bir başlık girin');
            return;
        }

        if (formData.isPrivate) {
            if (modal.mode === 'add' && !formData.password) {
                alert('Kilitli not için şifre girmelisiniz');
                return;
            }
            if (modal.mode === 'edit' && !formData.password && !originalPassword) {
                alert('Kilitli not için şifre girmelisiniz');
                return;
            }
        }

        const dateObj = new Date(selectedDate);
        const isoDate = dateObj.toISOString();

        let passwordToSend = '';
        if (modal.mode === 'add') {
            passwordToSend = formData.isPrivate && formData.password ? formData.password : '';
        } else {
            if (!formData.isPrivate) {
                passwordToSend = '';
            } else if (formData.password && formData.password.trim() !== '') {
                passwordToSend = formData.password;
            } else if (originalPassword) {
                passwordToSend = originalPassword;
            } else {
                passwordToSend = '';
            }
        }

        const entryData = {
            ...formData,
            userId: userId,
            date: isoDate,
            content: formData.content || '',
            mood: formData.mood || '',
            weather: formData.weather || '',
            location: formData.location || '',
            tags: formData.tags || [],
            images: formData.images || [],
            password: passwordToSend
        };

        try {
            if (modal.mode === 'add') {
                await api.post('/api/Journal', entryData);
            } else {
                await api.put(`/api/Journal/${modal.entryId}`, entryData);
            }
            handleCloseModal();
            await loadEntries();
        } catch (error) {
            console.error('Error saving entry:', error);
            const errorMessage = error.response?.data?.message || error.response?.data || 'Not kaydedilirken bir hata oluştu';
            alert(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage, null, 2));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bu notu silmek istediğinizden emin misiniz?')) {
            try {
                await api.delete(`/api/Journal/${id}`);
                const newUnlocked = new Set(unlockedEntries);
                newUnlocked.delete(id);
                saveUnlockedEntries(newUnlocked);
                await loadEntries();
            } catch (error) {
                console.error('Error deleting entry:', error);
                const errorMessage = error.response?.data?.message || error.response?.data || 'Not silinirken bir hata oluştu';
                alert(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage, null, 2));
            }
        }
    };

    const addTag = (tag) => {
        if (tag.trim() && !formData.tags.includes(tag.trim())) {
            setFormData({ ...formData, tags: [...formData.tags, tag.trim()] });
        }
    };

    const removeTag = (tagToRemove) => {
        setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) });
    };

    const addImage = (imageUrl) => {
        if (imageUrl.trim() && !formData.images.includes(imageUrl.trim())) {
            setFormData({ ...formData, images: [...formData.images, imageUrl.trim()] });
        }
    };

    const removeImage = (imageToRemove) => {
        setFormData({ ...formData, images: formData.images.filter(img => img !== imageToRemove) });
    };

    const getMoodColor = (score) => {
        if (score >= 8) return '#10b981';
        if (score >= 6) return '#f59e0b';
        if (score >= 4) return '#f97316';
        return '#ef4444';
    };

    const getMoodText = (score) => {
        if (score >= 8) return 'Mükemmel';
        if (score >= 6) return 'İyi';
        if (score >= 4) return 'Orta';
        return 'Kötü';
    };

    return (
        <div className="journal-container">
            <UniversalMenu />
            
            <div className="journal-header">
                <div className="journal-title">
                    <h1 className="title-animated">
                        <FaBook className="title-icon" /> Notlarım
                    </h1>
                    <p className="subtitle-animated">{entries.length} not kaydı</p>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="journal-toolbar">
                <div className="search-container">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Notlarda ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="filter-container">
                    <FaFilter className="filter-icon" />
                    <select
                        value={filterMood}
                        onChange={(e) => setFilterMood(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">Tüm Ruh Halleri</option>
                        {moods.map(mood => (
                            <option key={mood} value={mood}>{mood}</option>
                        ))}
                    </select>
                </div>
                <div className="view-toggle">
                    <button
                        className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                        title="Grid Görünümü"
                    >
                        ⬜
                    </button>
                    <button
                        className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                        title="Liste Görünümü"
                    >
                        ☰
                    </button>
                </div>
            </div>

            <button className="fab" onClick={() => handleOpenModal()} aria-label="Yeni Not">
                <FaPlus />
            </button>

            <div className="journal-content">
                {filteredEntries.length > 0 ? (
                    <div className={`journal-entries-${viewMode}`}>
                        {filteredEntries.map((entry, index) => (
                            <div 
                                key={entry.id} 
                                className={`journal-entry-card ${entry.isPrivate && entry.password && !unlockedEntries.has(entry.id) ? 'locked' : ''}`}
                                onClick={() => handleOpenDetail(entry)}
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                {entry.isPrivate && entry.password && !unlockedEntries.has(entry.id) && (
                                    <div className="locked-overlay">
                                        <div className="locked-badge">
                                            <FaLock /> Kilitli Not
                                        </div>
                                    </div>
                                )}
                                <div className="entry-card-header">
                                    <div className="entry-mood-minimal">
                                        <span className="mood-emoji-small">{entry.mood || '😊'}</span>
                                        <span className="mood-score-small" style={{ color: getMoodColor(entry.moodScore || 5) }}>
                                            {entry.moodScore || 5}/10
                                        </span>
                                    </div>
                                    <div className="entry-actions-minimal">
                                        <button 
                                            className="action-btn-minimal edit"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenModal(entry);
                                            }}
                                            title="Düzenle"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button 
                                            className="action-btn-minimal delete"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteWithPassword(entry);
                                            }}
                                            title="Sil"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                                
                                <h3 className="entry-title-minimal">
                                    {entry.isPrivate && entry.password && !unlockedEntries.has(entry.id) 
                                        ? '••••••••' 
                                        : entry.title}
                                </h3>
                                
                                {entry.content && (
                                    <p className="entry-content-minimal">
                                        {entry.isPrivate && entry.password && !unlockedEntries.has(entry.id)
                                            ? '•••••••• •••••••• •••••••• •••••••• ••••••••'
                                            : entry.content.length > 100 
                                                ? entry.content.substring(0, 100) + '...' 
                                                : entry.content}
                                    </p>
                                )}
                                
                                {entry.tags && entry.tags.length > 0 && (
                                    <div className="entry-tags-preview">
                                        {entry.tags.slice(0, 3).map(tag => (
                                            <span key={tag} className="tag-preview">
                                                <FaTag /> {tag}
                                            </span>
                                        ))}
                                        {entry.tags.length > 3 && (
                                            <span className="tag-more">+{entry.tags.length - 3}</span>
                                        )}
                                    </div>
                                )}
                                
                                <div className="entry-meta-minimal">
                                    <span className="entry-date-minimal">
                                        <FaCalendar /> {new Date(entry.date || entry.createdAt).toLocaleDateString('tr-TR', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </span>
                                    {entry.isPrivate && (
                                        <span className="private-badge-minimal">
                                            {unlockedEntries.has(entry.id) ? <FaUnlock /> : <FaLock />}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">📝</div>
                        <h3>Henüz not yazılmamış</h3>
                        <p>İlk notunuzu yazarak başlayın!</p>
                        <button onClick={() => handleOpenModal()} className="empty-action-btn">
                            <FaPlus /> Not Yaz
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {modal.open && (
                <div className="journal-modal-overlay" onClick={handleCloseModal}>
                    <div className="journal-modal" onClick={e => e.stopPropagation()}>
                        <h2>{modal.mode === 'add' ? 'Yeni Not' : 'Notu Düzenle'}</h2>
                        
                        <div className="form-group">
                            <label>Başlık *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Not başlığı"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>İçerik</label>
                            <textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder="Notlarınızı buraya yazın..."
                                rows="6"
                            />
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Tarih</label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Ruh Hali</label>
                                <div className="mood-selector">
                                    {moods.map(mood => (
                                        <button
                                            key={mood}
                                            type="button"
                                            className={`mood-btn ${formData.mood === mood ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, mood })}
                                        >
                                            {mood}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>Ruh Hali Puanı (1-10)</label>
                            <div className="mood-slider-container">
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={formData.moodScore}
                                    onChange={(e) => setFormData({ ...formData, moodScore: parseInt(e.target.value) })}
                                    className="mood-slider"
                                />
                                <span className="mood-value" style={{ color: getMoodColor(formData.moodScore) }}>
                                    {formData.moodScore}/10 - {getMoodText(formData.moodScore)}
                                </span>
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Hava Durumu</label>
                                <select
                                    value={formData.weather}
                                    onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                                >
                                    <option value="">Seçin</option>
                                    {weatherOptions.map(weather => (
                                        <option key={weather} value={weather}>{weather}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label>Konum</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="Neredeydiniz?"
                                />
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>Etiketler</label>
                            <div className="tags-input">
                                <input
                                    type="text"
                                    placeholder="Etiket ekleyin ve Enter'a basın"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addTag(e.target.value);
                                            e.target.value = '';
                                        }
                                    }}
                                />
                                <div className="tags-list">
                                    {formData.tags.map(tag => (
                                        <span key={tag} className="tag">
                                            <FaTag /> {tag}
                                            <button onClick={() => removeTag(tag)}>×</button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>Resimler (URL)</label>
                            <div className="images-input">
                                <input
                                    type="url"
                                    placeholder="Resim URL'si ekleyin ve Enter'a basın"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addImage(e.target.value);
                                            e.target.value = '';
                                        }
                                    }}
                                />
                                <div className="images-list">
                                    {formData.images.map((image, index) => (
                                        <div key={index} className="image-item">
                                            <img src={image} alt={`Resim ${index + 1}`} />
                                            <button onClick={() => removeImage(image)}>×</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.isPrivate}
                                    onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked, password: e.target.checked ? formData.password : '' })}
                                />
                                <FaLock /> Kilitli not (şifre ile korumalı)
                            </label>
                        </div>
                        
                        {formData.isPrivate && (
                            <div className="form-group">
                                <label>Şifre {modal.mode === 'add' ? '*' : '(Değiştirmek için yeni şifre girin)'}</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={modal.mode === 'add' ? "Not için şifre oluşturun" : "Yeni şifre girin (boş bırakırsanız mevcut şifre korunur)"}
                                    required={modal.mode === 'add' && formData.isPrivate}
                                />
                            </div>
                        )}
                        
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={handleCloseModal}>
                                İptal
                            </button>
                            <button className="btn-primary" onClick={handleSubmit}>
                                <FaSave /> {modal.mode === 'add' ? 'Kaydet' : 'Güncelle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detay Görünümü */}
            {selectedEntry && (
                <div className="journal-detail-overlay" onClick={handleCloseDetail}>
                    <div className="journal-detail-page" onClick={e => e.stopPropagation()}>
                        <div className="detail-page-header">
                            <button className="detail-close-btn" onClick={handleCloseDetail}>
                                ✕
                            </button>
                            <div className="detail-actions">
                                <button 
                                    className="detail-action-btn edit"
                                    onClick={() => {
                                        handleCloseDetail();
                                        handleOpenModal(selectedEntry);
                                    }}
                                >
                                    <FaEdit /> Düzenle
                                </button>
                                <button 
                                    className="detail-action-btn delete"
                                    onClick={() => {
                                        if (window.confirm('Bu notu silmek istediğinizden emin misiniz?')) {
                                            handleDelete(selectedEntry.id);
                                            handleCloseDetail();
                                        }
                                    }}
                                >
                                    <FaTrash /> Sil
                                </button>
                            </div>
                        </div>
                        
                        <div className="detail-page-content">
                            <div className="detail-date-line">
                                {new Date(selectedEntry.date || selectedEntry.createdAt).toLocaleDateString('tr-TR', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </div>
                            
                            <div className="detail-mood-section">
                                <span className="detail-mood-emoji">{selectedEntry.mood || '😊'}</span>
                                <div className="detail-mood-info">
                                    <span className="detail-mood-score" style={{ color: getMoodColor(selectedEntry.moodScore || 5) }}>
                                        {selectedEntry.moodScore || 5}/10
                                    </span>
                                    <span className="detail-mood-text">{getMoodText(selectedEntry.moodScore || 5)}</span>
                                </div>
                            </div>
                            
                            <h1 className="detail-title">{selectedEntry.title}</h1>
                            
                            {selectedEntry.content && (
                                <div className="detail-content">
                                    {selectedEntry.content.split('\n').map((paragraph, index) => (
                                        <p key={index}>{paragraph}</p>
                                    ))}
                                </div>
                            )}
                            
                            {(selectedEntry.weather || selectedEntry.location) && (
                                <div className="detail-meta">
                                    {selectedEntry.weather && (
                                        <div className="detail-meta-item">
                                            <FaCloud /> {selectedEntry.weather}
                                        </div>
                                    )}
                                    {selectedEntry.location && (
                                        <div className="detail-meta-item">
                                            <FaMapMarkerAlt /> {selectedEntry.location}
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                                <div className="detail-tags">
                                    {selectedEntry.tags.map(tag => (
                                        <span key={tag} className="detail-tag">
                                            <FaTag /> {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                            
                            {selectedEntry.images && selectedEntry.images.length > 0 && (
                                <div className="detail-images">
                                    {selectedEntry.images.map((image, index) => (
                                        <img key={index} src={image} alt={`Not resmi ${index + 1}`} />
                                    ))}
                                </div>
                            )}
                            
                            {selectedEntry.isPrivate && (
                                <div className="detail-private-badge">
                                    <FaLock /> Özel Not
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Şifre Modal */}
            {passwordModal.open && passwordModal.entry && (
                <div className="password-modal-overlay" onClick={() => setPasswordModal({ open: false, entry: null, action: 'view' })}>
                    <div className="password-modal" onClick={e => e.stopPropagation()}>
                        <div className="password-modal-icon">
                            <FaLock />
                        </div>
                        <h2>Kilitli Not</h2>
                        <p>Bu nota erişmek için şifre girin</p>
                        <input
                            type="password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            placeholder="Şifre"
                            className="password-input"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handlePasswordSubmit();
                                }
                            }}
                            autoFocus
                        />
                        <div className="password-modal-actions">
                            <button 
                                className="btn-secondary" 
                                onClick={() => {
                                    setPasswordModal({ open: false, entry: null, action: 'view' });
                                    setPasswordInput('');
                                }}
                            >
                                İptal
                            </button>
                            <button className="btn-primary" onClick={handlePasswordSubmit}>
                                <FaUnlock /> Aç
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Journal;
