import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalMenu from '../components/UniversalMenu';
import api from '../services/api';
import { 
    FaPlus, 
    FaEdit, 
    FaTrash, 
    FaBullseye, 
    FaCalendarAlt,
    FaFlag,
    FaCheckCircle,
    FaClock,
    FaChartLine
} from 'react-icons/fa';
import '../styles/Goals.css';

const Goals = () => {
    const navigate = useNavigate();
    const [goals, setGoals] = useState([]);
    const [modal, setModal] = useState({ open: false, mode: 'add', goalId: null });
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'Daily',
        category: 'Personal',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        priority: 1,
        targetValue: '',
        unit: '',
        color: '#6366f1',
        icon: '🎯'
    });
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const userId = parseInt(localStorage.getItem('userId') || '1', 10);

    useEffect(() => {
        loadGoals();
    }, []);

    const loadGoals = async () => {
        try {
            const response = await api.get(`/api/Goals/user/${userId}`);
            setGoals(response.data);
        } catch (error) {
            console.error('Error loading goals:', error);
        }
    };

    const handleOpenModal = (goal = null) => {
        if (goal) {
            setModal({ open: true, mode: 'edit', goalId: goal.id });
            setFormData({
                title: goal.title,
                description: goal.description || '',
                type: goal.type || 'Daily',
                category: goal.category || 'Personal',
                startDate: goal.startDate ? goal.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
                endDate: goal.endDate ? goal.endDate.split('T')[0] : '',
                priority: goal.priority || 1,
                targetValue: goal.targetValue || '',
                unit: goal.unit || '',
                color: goal.color || '#6366f1',
                icon: goal.icon || '🎯'
            });
        } else {
            setModal({ open: true, mode: 'add', goalId: null });
            setFormData({
                title: '',
                description: '',
                type: 'Daily',
                category: 'Personal',
                startDate: new Date().toISOString().split('T')[0],
                endDate: '',
                priority: 1,
                targetValue: '',
                unit: '',
                color: '#6366f1',
                icon: '🎯'
            });
        }
    };

    const handleCloseModal = () => {
        setModal({ open: false, mode: 'add', goalId: null });
    };

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            alert('Lütfen bir başlık girin');
            return;
        }

        const goalData = {
            ...formData,
            userId: userId,
            status: 'NotStarted',
            currentValue: 0,
            isCompleted: false,
            targetValue: formData.targetValue !== '' && formData.targetValue !== null
                ? parseFloat(String(formData.targetValue).replace(',', '.'))
                : null,
            // Tarihleri ISO'ya çevirmek yerine input'un verdiği yyyy-MM-dd stringini gönderiyoruz
            startDate: formData.startDate || new Date().toISOString().split('T')[0],
            endDate: formData.endDate ? formData.endDate : null
        };

        try {
            if (modal.mode === 'add') {
                await api.post('/api/Goals', goalData);
            } else {
                await api.put(`/api/Goals/${modal.goalId}`, goalData);
            }
            handleCloseModal();
            await loadGoals();
        } catch (error) {
            console.error('Error saving goal:', error);
            alert('Hedef kaydedilirken bir hata oluştu');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bu hedefi silmek istediğinizden emin misiniz?')) {
            try {
                await api.delete(`/api/Goals/${id}`);
                loadGoals();
            } catch (error) {
                console.error('Error deleting goal:', error);
                alert('Hedef silinirken bir hata oluştu');
            }
        }
    };

    const handleProgressUpdate = async (goalId, newValue) => {
        try {
            await api.put(`/api/Goals/${goalId}/progress`, {
                currentValue: newValue
            });
            loadGoals();
        } catch (error) {
            console.error('Error updating goal progress:', error);
        }
    };

    const handleStatusChange = async (goalId, newStatus) => {
        try {
            await api.put(`/api/Goals/${goalId}`, {
                status: newStatus,
                isCompleted: newStatus === 'Completed'
            });
            loadGoals();
        } catch (error) {
            console.error('Error updating goal status:', error);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 1: return '#10b981';
            case 2: return '#f59e0b';
            case 3: return '#f97316';
            case 4: return '#ef4444';
            case 5: return '#7c3aed';
            default: return '#6b7280';
        }
    };

    const getPriorityText = (priority) => {
        switch (priority) {
            case 1: return 'Düşük';
            case 2: return 'Orta';
            case 3: return 'Yüksek';
            case 4: return 'Kritik';
            case 5: return 'Acil';
            default: return 'Orta';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'NotStarted': return '#6b7280';
            case 'InProgress': return '#3b82f6';
            case 'OnHold': return '#f59e0b';
            case 'Completed': return '#10b981';
            case 'Cancelled': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'NotStarted': return 'Başlanmadı';
            case 'InProgress': return 'Devam Ediyor';
            case 'OnHold': return 'Beklemede';
            case 'Completed': return 'Tamamlandı';
            case 'Cancelled': return 'İptal Edildi';
            default: return status;
        }
    };

    const getProgressPercentage = (goal) => {
        if (!goal.targetValue || goal.targetValue === 0) return 0;
        return Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
    };

    const filteredGoals = goals.filter(goal => {
        const matchesFilter = activeFilter === 'all' || goal.status === activeFilter;
        const matchesSearch = goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            goal.description?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const goalTypes = ['Daily', 'Weekly', 'Monthly', 'Yearly'];
    const goalCategories = ['Personal', 'Work', 'Health', 'Learning', 'Finance', 'Relationships', 'Hobbies', 'Other'];

    return (
        <div className="goals-container">
            <UniversalMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
            
            <div className="goals-header">
                <div className="goals-title">
                    <h1>🎯 Hedeflerim</h1>
                    <p>Hayallerinizi hedeflere, hedeflerinizi gerçekliğe dönüştürün</p>
                </div>
                <button className="add-goal-btn" onClick={() => handleOpenModal()}>
                    <FaPlus /> Yeni Hedef
                </button>
            </div>

            <div className="goals-stats">
                <div className="stat-item">
                    <span className="stat-number">{goals.length}</span>
                    <span className="stat-label">Toplam Hedef</span>
                </div>
                <div className="stat-item">
                    <span className="stat-number">
                        {goals.filter(g => g.status === 'Completed').length}
                    </span>
                    <span className="stat-label">Tamamlanan</span>
                </div>
                <div className="stat-item">
                    <span className="stat-number">
                        {goals.filter(g => g.status === 'InProgress').length}
                    </span>
                    <span className="stat-label">Devam Eden</span>
                </div>
                <div className="stat-item">
                    <span className="stat-number">
                        {goals.filter(g => g.status === 'NotStarted').length}
                    </span>
                    <span className="stat-label">Bekleyen</span>
                </div>
            </div>

            <div className="goals-filters">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Hedef ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-buttons">
                    <button 
                        className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('all')}
                    >
                        Tümü ({goals.length})
                    </button>
                    <button 
                        className={`filter-btn ${activeFilter === 'NotStarted' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('NotStarted')}
                    >
                        Başlanmadı ({goals.filter(g => g.status === 'NotStarted').length})
                    </button>
                    <button 
                        className={`filter-btn ${activeFilter === 'InProgress' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('InProgress')}
                    >
                        Devam Eden ({goals.filter(g => g.status === 'InProgress').length})
                    </button>
                    <button 
                        className={`filter-btn ${activeFilter === 'Completed' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('Completed')}
                    >
                        Tamamlanan ({goals.filter(g => g.status === 'Completed').length})
                    </button>
                </div>
            </div>

            <div className="goals-grid">
                {filteredGoals.map(goal => (
                    <div key={goal.id} className="goal-card">
                        <div className="goal-header">
                            <div className="goal-icon" style={{ backgroundColor: goal.color }}>
                                {goal.icon}
                            </div>
                            <div className="goal-actions">
                                <button
                                    className="goal-action-btn"
                                    onClick={() => handleOpenModal(goal)}
                                >
                                    <FaEdit />
                                </button>
                                <button
                                    className="goal-action-btn delete"
                                    onClick={() => handleDelete(goal.id)}
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                        
                        <div className="goal-content">
                            <h3 className="goal-title">{goal.title}</h3>
                            {goal.description && (
                                <p className="goal-description">{goal.description}</p>
                            )}
                            
                            <div className="goal-meta">
                                <div className="goal-type">
                                    <FaClock />
                                    <span>{goal.type}</span>
                                </div>
                                <div className="goal-category">
                                    <FaFlag />
                                    <span>{goal.category}</span>
                                </div>
                                <div className="goal-priority">
                                    <FaFlag style={{ color: getPriorityColor(goal.priority) }} />
                                    <span>{getPriorityText(goal.priority)}</span>
                                </div>
                            </div>
                            
                            {goal.targetValue && (
                                <div className="goal-progress">
                                    <div className="progress-header">
                                        <span>İlerleme</span>
                                        <span>{goal.currentValue || 0} / {goal.targetValue} {goal.unit}</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill" 
                                            style={{ width: `${getProgressPercentage(goal)}%` }}
                                        ></div>
                                    </div>
                                    <span className="progress-percentage">{getProgressPercentage(goal)}%</span>
                                </div>
                            )}
                            
                            <div className="goal-status">
                                <span 
                                    className="status-badge" 
                                    style={{ backgroundColor: getStatusColor(goal.status) }}
                                >
                                    {getStatusText(goal.status)}
                                </span>
                            </div>
                            
                            <div className="goal-actions">
                                {goal.status === 'NotStarted' && (
                                    <button 
                                        className="action-btn primary"
                                        onClick={() => handleStatusChange(goal.id, 'InProgress')}
                                    >
                                        Başla
                                    </button>
                                )}
                                
                                {goal.status === 'InProgress' && (
                                    <button 
                                        className="action-btn success"
                                        onClick={() => handleStatusChange(goal.id, 'Completed')}
                                    >
                                        <FaCheckCircle /> Tamamla
                                    </button>
                                )}
                                
                                {goal.targetValue && goal.status === 'InProgress' && (
                                    <button 
                                        className="action-btn info"
                                        onClick={() => {
                                            const newValue = prompt(`Yeni ilerleme değeri girin (${goal.unit}):`, goal.currentValue || 0);
                                            if (newValue !== null) {
                                                handleProgressUpdate(goal.id, parseFloat(newValue));
                                            }
                                        }}
                                    >
                                        <FaChartLine /> İlerleme Güncelle
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredGoals.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">🎯</div>
                    <h3>Henüz hedef eklenmemiş</h3>
                    <p>İlk hedefinizi ekleyerek başarı yolculuğunuza başlayın!</p>
                    <button onClick={() => handleOpenModal()}>İlk Hedefini Ekle</button>
                </div>
            )}

            {/* Modal */}
            {modal.open && (
                <div className="goals-modal-overlay" onClick={handleCloseModal}>
                    <div className="goals-modal" onClick={e => e.stopPropagation()}>
                        <h2>{modal.mode === 'add' ? 'Yeni Hedef' : 'Hedefi Düzenle'}</h2>
                        
                        <div className="form-group">
                            <label>Hedef Başlığı *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Hedef başlığı"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Açıklama</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Hedef açıklaması"
                                rows="3"
                            />
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Hedef Tipi</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    {goalTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label>Kategori</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {goalCategories.map(category => (
                                        <option key={category} value={category}>{category}</option>
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
                                <label>Bitiş Tarihi</label>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Öncelik</label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                                >
                                    <option value={1}>Düşük</option>
                                    <option value={2}>Orta</option>
                                    <option value={3}>Yüksek</option>
                                    <option value={4}>Kritik</option>
                                    <option value={5}>Acil</option>
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label>Hedef Değeri</label>
                                <input
                                    type="number"
                                    value={formData.targetValue}
                                    onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                                    placeholder="0"
                                    min="0"
                                    step="0.1"
                                />
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>Birim</label>
                            <input
                                type="text"
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                placeholder="kitap, km, saat, vs."
                            />
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
                                    placeholder="🎯"
                                />
                            </div>
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

export default Goals; 