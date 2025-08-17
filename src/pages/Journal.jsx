import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalMenu from '../components/UniversalMenu';
import axios from 'axios';
import { 
    FaPlus, 
    FaEdit, 
    FaTrash, 
    FaSmile, 
    FaCloud, 
    FaMapMarkerAlt,
    FaImage,
    FaSave
} from 'react-icons/fa';
import '../styles/Journal.css';

const Journal = () => {
    const navigate = useNavigate();
    const [entries, setEntries] = useState([]);
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
        isPrivate: false
    });
    const [menuOpen, setMenuOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const userId = localStorage.getItem('userId') || 1;

    const moods = ['😊', '😢', '😡', '😴', '😐', '🤔', '😍', '😤', '🥳', '😌'];
    const weatherOptions = ['☀️ Güneşli', '🌤️ Parçalı Bulutlu', '☁️ Bulutlu', '🌧️ Yağmurlu', '⛈️ Fırtınalı', '❄️ Karlı', '🌫️ Sisli'];

    useEffect(() => {
        loadEntries();
    }, []);

    const loadEntries = async () => {
        try {
            const response = await axios.get(`https://localhost:7255/api/Journal/user/${userId}`);
            setEntries(response.data);
        } catch (error) {
            console.error('Error loading entries:', error);
        }
    };

    const handleOpenModal = (entry = null) => {
        if (entry) {
            setModal({ open: true, mode: 'edit', entryId: entry.id });
            setFormData({
                title: entry.title,
                content: entry.content || '',
                mood: entry.mood || '😊',
                moodScore: entry.moodScore || 5,
                weather: entry.weather || '',
                location: entry.location || '',
                tags: entry.tags || [],
                images: entry.images || [],
                isPrivate: entry.isPrivate || false
            });
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
                isPrivate: false
            });
        }
    };

    const handleCloseModal = () => {
        setModal({ open: false, mode: 'add', entryId: null });
    };

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            alert('Lütfen bir başlık girin');
            return;
        }

        const entryData = {
            ...formData,
            userId: userId,
            date: selectedDate
        };

        try {
            if (modal.mode === 'add') {
                await axios.post('https://localhost:7255/api/Journal', entryData);
            } else {
                await axios.put(`https://localhost:7255/api/Journal/${modal.entryId}`, entryData);
            }
            handleCloseModal();
            loadEntries();
        } catch (error) {
            console.error('Error saving entry:', error);
            alert('Günlük kaydedilirken bir hata oluştu');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bu günlük girişini silmek istediğinizden emin misiniz?')) {
            try {
                await axios.delete(`https://localhost:7255/api/Journal/${id}`);
                loadEntries();
            } catch (error) {
                console.error('Error deleting entry:', error);
                alert('Günlük silinirken bir hata oluştu');
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

    const filteredEntries = entries.filter(entry => 
        entry.date.split('T')[0] === selectedDate
    );

    return (
        <div className="journal-container">
            <UniversalMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
            
            <div className="journal-header">
                <div className="journal-title">
                    <h1>📝 Günlüğüm</h1>
                    <p>Günlük deneyimlerinizi kaydedin ve duygularınızı takip edin</p>
                </div>
                <button className="add-entry-btn" onClick={() => handleOpenModal()}>
                    <FaPlus /> Yeni Günlük
                </button>
            </div>

            <div className="journal-date-selector">
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="date-input"
                />
            </div>

            <div className="journal-content">
                {filteredEntries.length > 0 ? (
                    filteredEntries.map(entry => (
                        <div key={entry.id} className="journal-entry">
                            <div className="entry-header">
                                <div className="entry-mood">
                                    <span className="mood-emoji">{entry.mood}</span>
                                    <div className="mood-info">
                                        <span className="mood-score" style={{ color: getMoodColor(entry.moodScore) }}>
                                            {entry.moodScore}/10
                                        </span>
                                        <span className="mood-text">{getMoodText(entry.moodScore)}</span>
                                    </div>
                                </div>
                                <div className="entry-actions">
                                    <button 
                                        className="action-btn edit"
                                        onClick={() => handleOpenModal(entry)}
                                    >
                                        <FaEdit />
                                    </button>
                                    <button 
                                        className="action-btn delete"
                                        onClick={() => handleDelete(entry.id)}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                            
                            <h3 className="entry-title">{entry.title}</h3>
                            
                            {entry.content && (
                                <p className="entry-content">{entry.content}</p>
                            )}
                            
                            <div className="entry-meta">
                                {entry.weather && (
                                    <span className="meta-item">
                                        <FaCloud /> {entry.weather}
                                    </span>
                                )}
                                
                                {entry.location && (
                                    <span className="meta-item">
                                        <FaMapMarkerAlt /> {entry.location}
                                    </span>
                                )}
                                
                                {entry.tags.length > 0 && (
                                    <div className="entry-tags">
                                        {entry.tags.map(tag => (
                                            <span key={tag} className="tag">{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {entry.images.length > 0 && (
                                <div className="entry-images">
                                    {entry.images.map((image, index) => (
                                        <img key={index} src={image} alt={`Günlük resmi ${index + 1}`} />
                                    ))}
                                </div>
                            )}
                            
                            <div className="entry-footer">
                                <span className="entry-time">
                                    {new Date(entry.date).toLocaleDateString('tr-TR', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                                {entry.isPrivate && (
                                    <span className="private-badge">🔒 Özel</span>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">📝</div>
                        <h3>Bu tarihte henüz günlük yazılmamış</h3>
                        <p>İlk günlük girişinizi yazarak başlayın!</p>
                        <button onClick={() => handleOpenModal()}>Günlük Yaz</button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {modal.open && (
                <div className="journal-modal-overlay" onClick={handleCloseModal}>
                    <div className="journal-modal" onClick={e => e.stopPropagation()}>
                        <h2>{modal.mode === 'add' ? 'Yeni Günlük' : 'Günlüğü Düzenle'}</h2>
                        
                        <div className="form-group">
                            <label>Başlık *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Günlük başlığı"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>İçerik</label>
                            <textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder="Bugün neler yaşadınız?"
                                rows="6"
                            />
                        </div>
                        
                        <div className="form-row">
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
                            
                            <div className="form-group">
                                <label>Ruh Hali Puanı (1-10)</label>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={formData.moodScore}
                                    onChange={(e) => setFormData({ ...formData, moodScore: parseInt(e.target.value) })}
                                    className="mood-slider"
                                />
                                <span className="mood-value">{formData.moodScore}/10</span>
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
                                            {tag}
                                            <button onClick={() => removeTag(tag)}>×</button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>Resimler</label>
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
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.isPrivate}
                                    onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                                />
                                Özel günlük (sadece siz görebilirsiniz)
                            </label>
                        </div>
                        
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
        </div>
    );
};

export default Journal;
