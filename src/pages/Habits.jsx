import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalMenu from '../components/UniversalMenu';
import api from '../services/api';
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaFire,
    FaTimes
} from 'react-icons/fa';
import '../styles/Habits.css';

const MOTIVATION = 'Küçük adımlar, büyük değişimler yaratır.';

// Tatlı simge seti
const HABIT_ICONS = [
    { id: 'water', icon: '💧', label: 'Su' },
    { id: 'book', icon: '📖', label: 'Kitap' },
    { id: 'run', icon: '🏃', label: 'Koşu' },
    { id: 'meditation', icon: '🧘', label: 'Meditasyon' },
    { id: 'pill', icon: '💊', label: 'İlaç' },
    { id: 'plant', icon: '🌱', label: 'Bitki' },
    { id: 'write', icon: '✏️', label: 'Yazı' },
    { id: 'music', icon: '🎵', label: 'Müzik' },
    { id: 'apple', icon: '🍎', label: 'Beslenme' },
    { id: 'cloud', icon: '☁️', label: 'Bulut' },
    { id: 'star', icon: '⭐', label: 'Yıldız' },
    { id: 'sleep', icon: '💤', label: 'Uyku' },
    { id: 'target', icon: '🎯', label: 'Hedef' },
    { id: 'muscle', icon: '💪', label: 'Güç' },
    { id: 'clean', icon: '🧹', label: 'Temizlik' },
    { id: 'heart', icon: '❤️', label: 'Sağlık' },
    { id: 'brain', icon: '🧠', label: 'Beyin' },
    { id: 'coffee', icon: '☕', label: 'Kahve' },
];

const Habits = () => {
    const navigate = useNavigate();
    const [habits, setHabits] = useState([]);
    const [modal, setModal] = useState({ open: false, mode: 'add', habitId: null });
    const [detailModal, setDetailModal] = useState({ open: false, habit: null });
    const [checkedDays, setCheckedDays] = useState({});
    const [checkedCounts, setCheckedCounts] = useState({});
    const [streakCelebration, setStreakCelebration] = useState({ show: false, streak: 0 });
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
        icon: '💧',
        reminderTime: ''
    });
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [iconPickerOpen, setIconPickerOpen] = useState(false);
    const [error, setError] = useState(null);
    const userId = parseInt(localStorage.getItem('userId') || '1', 10);

    useEffect(() => {
        loadHabits();
    }, []);

    const loadHabits = async () => {
        try {
            setError(null);
            const response = await api.get(`/api/Habits/user/${userId}`);
            setHabits(response.data);
        } catch (error) {
            console.error('Error loading habits:', error);
            setError('Veriler yüklenemedi. Backend bağlantısı koptu veya zaman aşımına uğradı.');
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
                icon: habit.icon || '💧',
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
                icon: '💧',
                reminderTime: ''
            });
        }
    };

    const handleCloseModal = () => {
        setModal({ open: false, mode: 'add', habitId: null });
        setIconPickerOpen(false);
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

    const handleToggleEntry = async (habitId, entryId) => {
        try {
            await api.put(`/api/Habits/${habitId}/entry/${entryId}/toggle`);
            await loadHabits();

            // Seri hesapla ve kutla
            const habit = habits.find(h => h.id === habitId);
            if (habit) {
                const streak = getStreak(habit);
                if (streak > 0) {
                    showStreakCelebration(streak);
                }
            }
        } catch (error) {
            console.error('Error toggling entry:', error);
        }
    };

    const handleToggleDay = async (habitId, date) => {
        const habit = habits.find(h => h.id === habitId);
        const hasCompletion = habit?.completions?.some(c =>
            (c.completedAt || c.date || '').split('T')[0] === date
        );

        try {
            if (hasCompletion) {
                // Silme işlemi - completion'ı bul ve sil
                const completion = habit.completions.find(c =>
                    (c.completedAt || c.date || '').split('T')[0] === date
                );
                if (completion) {
                    await api.delete(`/api/Habits/${habitId}/completion/${completion.id}`);
                }
            } else {
                // Ekleme işlemi
                await api.post(`/api/Habits/${habitId}/complete`, {
                    date: new Date(date).toISOString(),
                    count: 1,
                    notes: ''
                });
            }
            await loadHabits();
        } catch (error) {
            console.error('Error toggling habit:', error);
        }
    };

    const showStreakCelebration = (streak) => {
        setStreakCelebration({ show: true, streak });
        setTimeout(() => {
            setStreakCelebration({ show: false, streak: 0 });
        }, 3000);
    };

    const handleOpenDetailModal = (habit) => {
        // Initialize checkedDays for this habit based on targetFrequency
        const initialChecked = {};
        for (let i = 0; i < habit.targetFrequency; i++) {
            initialChecked[i] = false;
        }
        setCheckedDays(initialChecked);
        setDetailModal({ open: true, habit });
    };

    const handleCloseDetailModal = () => {
        setDetailModal({ open: false, habit: null });
        setCheckedDays({});
        // Not: checkedCounts'u sıfırlamıyoruz, kullanıcı görebilsin
    };

    const handleToggleCheckbox = (index) => {
        const newCheckedDays = {
            ...checkedDays,
            [index]: !checkedDays[index]
        };
        setCheckedDays(newCheckedDays);

        // İşaretlenen sayıyı hesapla
        const checkedCount = Object.values(newCheckedDays).filter(Boolean).length;

        // Habit için checkbox sayısını güncelle
        if (detailModal.habit) {
            setCheckedCounts(prev => ({
                ...prev,
                [detailModal.habit.id]: checkedCount
            }));
        }

        // Küçük feedback - işaretlenen sayıyı göster
        if (newCheckedDays[index]) {
            showStreakCelebration(checkedCount);
        }
    };

    const handleMarkComplete = async (habitId) => {
        try {
            await api.put(`/api/Habits/${habitId}/markComplete`);
            await loadHabits();
            handleCloseDetailModal();

            // Büyük kutlama için farklı bir state kullanabiliriz
            // Şimdilik aynı kutlamayı daha uzun süre göstereceğiz
            setStreakCelebration({ show: true, streak: detailModal.habit.targetFrequency, isBig: true });
            setTimeout(() => {
                setStreakCelebration({ show: false, streak: 0, isBig: false });
            }, 5000); // 5 saniye göster (normal 3 saniye)
        } catch (error) {
            console.error('Error marking habit complete:', error);
        }
    };

    const allChecked = () => {
        if (!detailModal.habit) return false;
        const total = detailModal.habit.targetFrequency || 1;
        for (let i = 0; i < total; i++) {
            if (!checkedDays[i]) return false;
        }
        return true;
    };

    const isCompleted = (habit, date) => {
        return habit.completions?.some(c =>
            (c.completedAt || c.date || '').split('T')[0] === date
        );
    };

    const getStreak = (habit) => {
        // Önce lokal checkbox sayısına bak
        if (checkedCounts[habit.id]) {
            return checkedCounts[habit.id];
        }

        if (!habit.completions || habit.completions.length === 0) return 0;

        const sortedCompletions = habit.completions
            .sort((a, b) => new Date(b.completedAt || b.date) - new Date(a.completedAt || a.date));

        let streak = 0;
        let currentDate = new Date();

        for (let i = 0; i < 365; i++) {
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

    const filteredHabits = habits.filter(habit => {
        const matchesFilter = activeFilter === 'all' || habit.category === activeFilter;
        const matchesSearch = habit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            habit.description?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const habitCategories = ['Personal', 'Health', 'Work', 'Learning', 'Fitness', 'Mindfulness', 'Other'];
    const habitTypes = ['Daily', 'Weekly', 'Monthly', 'Custom'];
    const frequencyUnits = ['day', 'week', 'month'];

    return (
        <div className="habits-container">
            <UniversalMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

            {error && (
                <div style={{ padding: '15px', background: '#fee2e2', color: '#dc2626', borderRadius: '12px', marginBottom: '20px', textAlign: 'center', border: '1px solid #fca5a5' }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Hero Header */}
            <div className="habits-hero">
                <div className="habits-hero-content">
                    <div className="habits-hero-text">
                        <h1>Alışkanlıklarım</h1>
                        <p>{MOTIVATION}</p>
                    </div>
                    <div className="habits-hero-stats">
                        <div className="hero-stat">
                            <span className="hero-stat-number">{habits.length}</span>
                            <span className="hero-stat-label">Toplam</span>
                        </div>
                        <div className="hero-stat">
                            <span className="hero-stat-number">
                                {habits.filter(h => isCompleted(h, new Date().toISOString().split('T')[0])).length}
                            </span>
                            <span className="hero-stat-label">Bugün</span>
                        </div>
                        <div className="hero-stat fire">
                            <span className="hero-stat-number">
                                {Math.max(...habits.map(h => getStreak(h)), 0)}
                            </span>
                            <span className="hero-stat-label">🔥 Seri</span>
                        </div>
                    </div>
                    <button className="add-habit-btn" onClick={() => handleOpenModal()}>
                        <FaPlus /> Yeni Alışkanlık
                    </button>
                </div>
            </div>

            {/* Alışkanlık Listesi - Yuvarlak Halkalar */}
            <div className="habits-list">
                {filteredHabits.map(habit => (
                    <div key={habit.id} className="habit-row">
                        <div className="habit-info">
                            <div
                                className="habit-icon-circle"
                                style={{ backgroundColor: habit.color }}
                            >
                                {habit.icon}
                            </div>
                            <div className="habit-details">
                                <h3>{habit.title}</h3>
                                <div className="habit-meta-info">
                                    <span className="streak-badge">
                                        <FaFire /> {getStreak(habit)} gün
                                    </span>
                                    <span className="category-badge">
                                        {getCategoryText(habit.category)}
                                    </span>
                                    {habit.completedAt && (
                                        <span className="completed-badge">
                                            ✅ Tamamlandı
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Aksiyonlar */}
                        <div className="habit-row-actions">
                            <button
                                className="habit-action-btn detail"
                                onClick={() => handleOpenDetailModal(habit)}
                                title="Detay Gör"
                            >
                                👁️
                            </button>
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
                        <div className="modal-header">
                            <h2>{modal.mode === 'add' ? 'Yeni Alışkanlık' : 'Alışkanlığı Düzenle'}</h2>
                            <button className="modal-close-btn" onClick={handleCloseModal}>
                                <FaTimes />
                            </button>
                        </div>

                        {/* Simge Seçici */}
                        <div className="form-group">
                            <label>Simge Seç</label>
                            <div className="icon-preview-wrapper">
                                <button
                                    type="button"
                                    className="icon-preview-btn"
                                    style={{ backgroundColor: formData.color }}
                                    onClick={() => setIconPickerOpen(!iconPickerOpen)}
                                >
                                    {formData.icon}
                                </button>
                                <span className="icon-hint">Tıklayarak simge seç</span>
                            </div>

                            {iconPickerOpen && (
                                <div className="icon-picker-grid">
                                    {HABIT_ICONS.map(item => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            className={`icon-picker-item ${formData.icon === item.icon ? 'selected' : ''}`}
                                            onClick={() => {
                                                setFormData({ ...formData, icon: item.icon });
                                                setIconPickerOpen(false);
                                            }}
                                        >
                                            <span className="picker-icon">{item.icon}</span>
                                            <span className="picker-label">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Alışkanlık Adı *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Örn: Günde 8 bardak su iç"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Açıklama</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Alışkanlık açıklaması"
                                rows="2"
                            />
                        </div>

                        <div className="form-row">
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

                            <div className="form-group">
                                <label>Renk</label>
                                <div className="color-picker-wrapper">
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    />
                                    <span className="color-preview" style={{ backgroundColor: formData.color }}></span>
                                </div>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Tür</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    {habitTypes.map(type => (
                                        <option key={type} value={type}>
                                            {type === 'Daily' ? 'Günlük' : type === 'Weekly' ? 'Haftalık' : type === 'Monthly' ? 'Aylık' : 'Özel'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Hedef Sıklık</label>
                                <div className="frequency-input">
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.targetFrequency}
                                        onChange={(e) => setFormData({ ...formData, targetFrequency: parseInt(e.target.value) || 1 })}
                                    />
                                    <select
                                        value={formData.frequencyUnit}
                                        onChange={(e) => setFormData({ ...formData, frequencyUnit: e.target.value })}
                                    >
                                        <option value="day">/ gün</option>
                                        <option value="week">/ hafta</option>
                                        <option value="month">/ ay</option>
                                    </select>
                                </div>
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

                        <div className="form-group">
                            <label>Hatırlatma Saati</label>
                            <input
                                type="time"
                                value={formData.reminderTime}
                                onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
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

            {/* Detay Modal */}
            {detailModal.open && detailModal.habit && (
                <div className="detail-modal-overlay" onClick={handleCloseDetailModal}>
                    <div className="detail-modal" onClick={e => e.stopPropagation()}>
                        <div className="detail-modal-header">
                            <div className="detail-modal-title">
                                <div className="detail-icon-circle" style={{ backgroundColor: detailModal.habit.color }}>
                                    {detailModal.habit.icon}
                                </div>
                                <div>
                                    <h2>{detailModal.habit.title}</h2>
                                    <p className="detail-frequency">
                                        {detailModal.habit.targetFrequency} {detailModal.habit.frequencyUnit === 'day' ? 'kez/gün' : detailModal.habit.frequencyUnit === 'week' ? 'kez/hafta' : 'kez/ay'}
                                    </p>
                                </div>
                            </div>
                            <button className="detail-close-btn" onClick={handleCloseDetailModal}>
                                <FaTimes />
                            </button>
                        </div>

                        <div className="detail-modal-body">
                            {/* Tamamlandı mı kontrolü */}
                            {detailModal.habit.completedAt ? (
                                <div className="habit-completed-message">
                                    <span className="completed-icon">✅</span>
                                    <p>Bu alışkanlık {new Date(detailModal.habit.completedAt).toLocaleDateString('tr-TR')} tarihinde tamamlandı!</p>
                                </div>
                            ) : (
                                <>
                                    {/* Checkbox Grid */}
                                    <div className="checkbox-grid">
                                        {Array.from({ length: detailModal.habit.targetFrequency || 1 }, (_, i) => (
                                            <div key={i} className="checkbox-item">
                                                <button
                                                    className={`checkbox-circle ${checkedDays[i] ? 'checked' : ''}`}
                                                    style={{
                                                        borderColor: detailModal.habit.color,
                                                        backgroundColor: checkedDays[i] ? detailModal.habit.color : 'transparent'
                                                    }}
                                                    onClick={() => handleToggleCheckbox(i)}
                                                >
                                                    {checkedDays[i] && (
                                                        <span className="checkbox-icon">{detailModal.habit.icon}</span>
                                                    )}
                                                </button>
                                                <span className="checkbox-label">Gün {i + 1}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Tamamla Butonu */}
                                    {allChecked() && (
                                        <button
                                            className="complete-habit-btn"
                                            onClick={() => handleMarkComplete(detailModal.habit.id)}
                                        >
                                            🎉 Alışkanlığı Tamamla
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Seri Kutlama (Duolingo Tarzı) */}
            {streakCelebration.show && (
                <div className="streak-celebration">
                    <div className="streak-celebration-content">
                        <div className="streak-flame">🔥</div>
                        <div className="streak-number">{streakCelebration.streak}</div>
                        <div className="streak-text">Günlük Seri!</div>
                        <div className="streak-confetti">
                            🎉✨🎊⭐🌟
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Habits;