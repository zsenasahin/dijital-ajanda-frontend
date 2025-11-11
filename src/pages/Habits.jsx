import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalMenu from '../components/UniversalMenu';
import api from '../services/api';
import { 
    FaPlus, 
    FaEdit, 
    FaTrash, 
    FaCheckCircle, 
    FaCalendarAlt,
    FaClock,
    FaFlag,
    FaChartLine,
    FaFire,
    FaRegCalendarCheck
} from 'react-icons/fa';
import '../styles/Habits.css';

const MOTIVATION = 'Küçük adımlar, büyük değişimler yaratır.';

const Habits = () => {
    const navigate = useNavigate();
    const [habits, setHabits] = useState([]);
    const [modal, setModal] = useState({ open: false, mode: 'add', habitId: null });
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'Daily',
        category: 'Personal',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        targetFrequency: 1,
        frequencyUnit: 'day',
        color: '#10b981',
        icon: '🔄',
        reminderTime: ''
    });
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const userId = parseInt(localStorage.getItem('userId') || '1', 10);

    useEffect(() => {
        loadHabits();
    }, []);

    const loadHabits = async () => {
        try {
            const response = await api.get(`/api/Habits/user/${userId}`);
            setHabits(response.data);
        } catch (error) {
            console.error('Error loading habits:', error);
        }
    };

    const handleOpenModal = (habit = null) => {
        if (habit) {
            setModal({ open: true, mode: 'edit', habitId: habit.id });
            setFormData({
                title: habit.title,
                description: habit.description || '',
                type: habit.type || 'Daily',
                category: habit.category || 'Personal',
                startDate: habit.startDate ? habit.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
                endDate: habit.endDate ? habit.endDate.split('T')[0] : '',
                targetFrequency: habit.targetFrequency || 1,
                frequencyUnit: habit.frequencyUnit || 'day',
                color: habit.color || '#10b981',
                icon: habit.icon || '🔄',
                reminderTime: habit.reminderTime || ''
            });
        } else {
            setModal({ open: true, mode: 'add', habitId: null });
            setFormData({
                title: '',
                description: '',
                type: 'Daily',
                category: 'Personal',
                startDate: new Date().toISOString().split('T')[0],
                endDate: '',
                targetFrequency: 1,
                frequencyUnit: 'day',
                color: '#10b981',
                icon: '🔄',
                reminderTime: ''
            });
        }
    };

    const handleCloseModal = () => {
        setModal({ open: false, mode: 'add', habitId: null });
    };

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            alert('Lütfen bir başlık girin');
            return;
        }

        const habitData = {
            ...formData,
            userId: userId,
            isActive: true,
            startDate: formData.startDate || new Date().toISOString().split('T')[0],
            endDate: formData.endDate ? formData.endDate : null,
            targetFrequency: parseInt(formData.targetFrequency)
        };

        try {
            if (modal.mode === 'add') {
                await api.post('/api/Habits', habitData);
            } else {
                await api.put(`/api/Habits/${modal.habitId}`, habitData);
            }
            handleCloseModal();
            loadHabits();
        } catch (error) {
            console.error('Error saving habit:', error);
            alert('Alışkanlık kaydedilirken bir hata oluştu');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bu alışkanlığı silmek istediğinizden emin misiniz?')) {
            try {
                await api.delete(`/api/Habits/${id}`);
                loadHabits();
            } catch (error) {
                console.error('Error deleting habit:', error);
                alert('Alışkanlık silinirken bir hata oluştu');
            }
        }
    };

    const handleCompleteHabit = async (habitId) => {
        try {
            await api.post(`/api/Habits/${habitId}/complete`, {
                date: new Date().toISOString(),
                count: 1,
                notes: ''
            });
            await loadHabits();
        } catch (error) {
            console.error('Error completing habit:', error);
            const errorMessage = error.response?.data?.message || error.response?.data || 'Alışkanlık tamamlanırken bir hata oluştu';
            alert(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage, null, 2));
        }
    };

    const getCategoryColor = (category) => {
        switch (category) {
            case 'Personal': return '#10b981';
            case 'Health': return '#3b82f6';
            case 'Work': return '#f59e0b';
            case 'Learning': return '#8b5cf6';
            case 'Fitness': return '#ef4444';
            case 'Mindfulness': return '#06b6d4';
            default: return '#6b7280';
        }
    };

    const getCategoryText = (category) => {
        switch (category) {
            case 'Personal': return 'Kişisel';
            case 'Health': return 'Sağlık';
            case 'Work': return 'İş';
            case 'Learning': return 'Öğrenme';
            case 'Fitness': return 'Fitness';
            case 'Mindfulness': return 'Farkındalık';
            default: return category;
        }
    };

    const getTypeText = (type) => {
        switch (type) {
            case 'Daily': return 'Günlük';
            case 'Weekly': return 'Haftalık';
            case 'Monthly': return 'Aylık';
            case 'Custom': return 'Özel';
            default: return type;
        }
    };

    const getTodayCompletions = (habit) => {
        const today = new Date().toISOString().split('T')[0];
        return habit.completions?.filter(c => (c.completedAt || c.date || '').split('T')[0] === today).length || 0;
    };

    const getStreak = (habit) => {
        if (!habit.completions || habit.completions.length === 0) return 0;
        
        const sortedCompletions = habit.completions
            .sort((a, b) => new Date(b.completedAt || b.date) - new Date(a.completedAt || a.date));
        
        let streak = 0;
        let currentDate = new Date();
        
        for (let i = 0; i < 30; i++) { // Check last 30 days
            const dateStr = currentDate.toISOString().split('T')[0];
            const hasCompletion = sortedCompletions.some(c => (c.completedAt || c.date || '').split('T')[0] === dateStr);
            
            if (hasCompletion) {
                streak++;
            } else {
                break;
            }
            
            currentDate.setDate(currentDate.getDate() - 1);
        }
        
        return streak;
    };

    const filteredHabits = habits.filter(habit => {
        const matchesFilter = activeFilter === 'all' || habit.category === activeFilter;
        const matchesSearch = habit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            habit.description?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const habitTypes = ['Daily', 'Weekly', 'Monthly', 'Custom'];
    const habitCategories = ['Personal', 'Health', 'Work', 'Learning', 'Fitness', 'Mindfulness', 'Other'];
    const frequencyUnits = ['day', 'week', 'month'];

    return (
        <div className="habits-container">
            <UniversalMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
            
            <div className="habits-header">
                <div className="habits-title">
                    <h1>🔄 Alışkanlıklarım</h1>
                    <p>{MOTIVATION}</p>
                </div>
                <button className="add-habit-btn" onClick={() => handleOpenModal()}>
                    <FaPlus /> Yeni Alışkanlık
                </button>
            </div>

            <div className="habits-stats">
                <div className="stat-item">
                    <span className="stat-number">{habits.length}</span>
                    <span className="stat-label">Toplam Alışkanlık</span>
                </div>
                <div className="stat-item">
                    <span className="stat-number">
                        {habits.filter(h => getTodayCompletions(h) > 0).length}
                    </span>
                    <span className="stat-label">Bugün Tamamlanan</span>
                </div>
                <div className="stat-item">
                    <span className="stat-number">
                        {Math.max(...habits.map(h => getStreak(h)), 0)}
                    </span>
                    <span className="stat-label">En Uzun Seri</span>
                </div>
                <div className="stat-item">
                    <span className="stat-number">
                        {habits.filter(h => h.isActive).length}
                    </span>
                    <span className="stat-label">Aktif</span>
                </div>
            </div>

            <div className="habits-filters">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Alışkanlık ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-buttons">
                    <button 
                        className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('all')}
                    >
                        Tümü ({habits.length})
                    </button>
                    {habitCategories.map(category => (
                        <button 
                            key={category}
                            className={`filter-btn ${activeFilter === category ? 'active' : ''}`}
                            onClick={() => setActiveFilter(category)}
                        >
                            {getCategoryText(category)} ({habits.filter(h => h.category === category).length})
                        </button>
                    ))}
                </div>
            </div>

            <div className="habits-grid">
                {filteredHabits.map(habit => (
                    <div key={habit.id} className="habit-card">
                        <div className="habit-header">
                            <div className="habit-icon" style={{ backgroundColor: habit.color }}>
                                {habit.icon}
                            </div>
                            <div className="habit-actions">
                                <button
                                    className="habit-action-btn"
                                    onClick={() => handleOpenModal(habit)}
                                >
                                    <FaEdit />
                                </button>
                                <button
                                    className="habit-action-btn delete"
                                    onClick={() => handleDelete(habit.id)}
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                        
                        <div className="habit-content">
                            <h3 className="habit-title">{habit.title}</h3>
                            {habit.description && (
                                <p className="habit-description">{habit.description}</p>
                            )}
                            
                            <div className="habit-meta">
                                <div className="habit-type">
                                    <FaClock />
                                    <span>{getTypeText(habit.type)}</span>
                                </div>
                                <div className="habit-category">
                                    <FaFlag style={{ color: getCategoryColor(habit.category) }} />
                                    <span>{getCategoryText(habit.category)}</span>
                                </div>
                                <div className="habit-frequency">
                                    <FaRegCalendarCheck />
                                    <span>{habit.targetFrequency}x {habit.frequencyUnit === 'day' ? 'gün' : habit.frequencyUnit === 'week' ? 'hafta' : 'ay'}</span>
                                </div>
                            </div>
                            
                            <div className="habit-progress">
                                <div className="progress-header">
                                    <span>Bugün</span>
                                    <span>{getTodayCompletions(habit)} / {habit.targetFrequency}</span>
                                </div>
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill" 
                                        style={{ 
                                            width: `${Math.min(100, (getTodayCompletions(habit) / habit.targetFrequency) * 100)}%`,
                                            backgroundColor: getTodayCompletions(habit) >= habit.targetFrequency ? '#10b981' : '#f59e0b'
                                        }}
                                    ></div>
                                </div>
                            </div>
                            
                            <div className="habit-stats">
                                <div className="stat">
                                    <FaFire style={{ color: '#f59e0b' }} />
                                    <span>{getStreak(habit)} gün seri</span>
                                </div>
                                <div className="stat">
                                    <FaChartLine style={{ color: '#3b82f6' }} />
                                    <span>{habit.completions?.length || 0} toplam</span>
                                </div>
                            </div>
                            
                            <div className="habit-actions">
                                {getTodayCompletions(habit) < habit.targetFrequency ? (
                                    <button 
                                        className="action-btn primary"
                                        onClick={() => handleCompleteHabit(habit.id)}
                                    >
                                        <FaCheckCircle /> Tamamla
                                    </button>
                                ) : (
                                    <button className="action-btn success" disabled>
                                        <FaCheckCircle /> Bugün Tamamlandı
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredHabits.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">🔄</div>
                    <h3>Henüz alışkanlık eklenmemiş</h3>
                    <p>İlk alışkanlığınızı ekleyerek değişim yolculuğunuza başlayın!</p>
                    <button onClick={() => handleOpenModal()}>İlk Alışkanlığını Ekle</button>
                </div>
            )}

            {/* Modal */}
            {modal.open && (
                <div className="habits-modal-overlay" onClick={handleCloseModal}>
                    <div className="habits-modal" onClick={e => e.stopPropagation()}>
                        <h2>{modal.mode === 'add' ? 'Yeni Alışkanlık' : 'Alışkanlığı Düzenle'}</h2>
                        
                        <div className="form-group">
                            <label>Alışkanlık Adı *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Alışkanlık adı"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Açıklama</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Alışkanlık açıklaması"
                                rows="3"
                            />
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Tip</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    {habitTypes.map(type => (
                                        <option key={type} value={type}>{getTypeText(type)}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label>Kategori</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {habitCategories.map(category => (
                                        <option key={category} value={category}>{getCategoryText(category)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Başlangıç Tarihi</label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Bitiş Tarihi (Opsiyonel)</label>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Hedef Sıklık</label>
                                <input
                                    type="number"
                                    value={formData.targetFrequency}
                                    onChange={(e) => setFormData({ ...formData, targetFrequency: parseInt(e.target.value) })}
                                    placeholder="1"
                                    min="1"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Frekans Birimi</label>
                                <select
                                    value={formData.frequencyUnit}
                                    onChange={(e) => setFormData({ ...formData, frequencyUnit: e.target.value })}
                                >
                                    {frequencyUnits.map(unit => (
                                        <option key={unit} value={unit}>
                                            {unit === 'day' ? 'Gün' : unit === 'week' ? 'Hafta' : 'Ay'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Renk</label>
                                <input
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>İkon</label>
                                <input
                                    type="text"
                                    value={formData.icon}
                                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    placeholder="🔄"
                                />
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>Hatırlatma Saati (HH:MM)</label>
                            <input
                                type="time"
                                value={formData.reminderTime}
                                onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                                placeholder="09:00"
                            />
                        </div>
                        
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={handleCloseModal}>
                                İptal
                            </button>
                            <button className="btn-primary" onClick={handleSubmit}>
                                {modal.mode === 'add' ? 'Oluştur' : 'Güncelle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Habits; 