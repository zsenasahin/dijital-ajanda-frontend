import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalMenu from '../components/UniversalMenu';
import axios from 'axios';
import '../styles/Goals.css';
import backgroundImage from '../assets/backlog-arkaplan-resmi.jpg';

const Goals = () => {
    const navigate = useNavigate();
    const [goals, setGoals] = useState([]);
    const [modal, setModal] = useState({ open: false, mode: 'add', goalId: null });
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start: '',
        end: '',
        status: 'Not Started',
        priority: 1,
        category: '',
        isCompleted: false
    });
    const [menuOpen, setMenuOpen] = useState(false);
    const userId = 1; // Örnek kullanıcı id'si

    useEffect(() => {
        loadGoals();
    }, []);

    const loadGoals = async () => {
        try {
            const response = await axios.get(`https://localhost:7255/api/Backlog/user/${userId}`);
            setGoals(response.data);
        } catch (error) {
            console.error('Error loading goals:', error);
        }
    };

    const handleOpenModal = (goal = null) => {
        if (goal) {
            setModal({ open: true, mode: 'edit', goalId: goal.id });
            console.log(goal)
            setFormData({
                title: goal.title,
                description: goal.description || '',
                start: goal.start ? goal.start.split('T')[0] :'',
                end: goal.end ? goal.end.split('T')[0] : '',
                status: goal.status || 'Not Started',
                priority: goal.priority || 1,
                category: goal.category || '',
                isCompleted: goal.isCompleted || false
            });
        } else {
            setModal({ open: true, mode: 'add', goalId: null });
            setFormData({
                title: '',
                description: '',
                start: new Date().toISOString().split('T')[0],
                end: '',
                status: 'Not Started',
                priority: 1,
                category: '',
                isCompleted: false
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
            userId: userId
        };

        try {
            if (modal.mode === 'add') {
                await axios.post('https://localhost:7255/api/Backlog', goalData);
            } else {
                await axios.put(`https://localhost:7255/api/Backlog/${modal.goalId}`, goalData);
            }
            handleCloseModal();
            loadGoals();
        } catch (error) {
            console.error('Error saving goal:', error);
            alert('Hedef kaydedilirken bir hata oluştu');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bu hedefi silmek istediğinizden emin misiniz?')) {
            try {
                await axios.delete(`https://localhost:7255/api/Backlog/${id}`);
                loadGoals();
            } catch (error) {
                console.error('Error deleting goal:', error);
                alert('Hedef silinirken bir hata oluştu');
            }
        }
    };

    return (
        <div className="goals-container">
            <UniversalMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

            <div className="goals-cover" style={{ backgroundImage: `url(${backgroundImage})` }}>
                <div className="goals-cover-content">
                    <h1 className="goals-cover-title">Hedefler</h1>

                </div>

            </div>
            <div className='goals-section'>

                <div className="goals-list-section">
                    {goals.map((goal) => (
                        <div key={goal.id} className="goals-task">
                            <div className="goals-task-header">
                                <div className="goal-task-container">
                                    <h3 className="goals-task-title">{goal.title}</h3>
                                    <p className="goal-description">{goal.description}</p>
                                    <div className="goal-details">
                                        <span className={`status ${goal.status?.toLowerCase()}`}>{goal.status}</span>
                                        <span className={`priority priority-${goal.priority}`}>
                                            {goal.priority === 1 ? 'Düşük' : goal.priority === 2 ? 'Orta' : 'Yüksek'}
                                        </span>
                                        {goal.category && <span className="category">{goal.category}</span>}
                                    </div>
                                    <div className="goal-dates">
                                        <span>Başlangıç: {new Date(goal.start).toLocaleDateString('tr-TR')}</span>
                                        {goal.end && <span>Bitiş: {new Date(goal.end).toLocaleDateString('tr-TR')}</span>}
                                    </div>
                                </div>
                                <div className="goal-actions">
                                    <button className="goals-toggle-btn" onClick={() => handleOpenModal(goal)}>✎</button>
                                    <button className="goals-toggle-btn" onClick={() => handleDelete(goal.id)}>×</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div> 
               <div>
                 <button className="goals-new-btn" onClick={() => handleOpenModal()}>
                    + Yeni Hedef
                </button>
               </div>
            </div>

            {modal.open && (
                <div className="goals-popup-overlay">
                    <div className="goals-popup">
                        <h2>{modal.mode === 'add' ? 'Yeni Hedef' : 'Hedefi Düzenle'}</h2>
                        <input
                            type="text"
                            placeholder="Başlık"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                        <textarea
                            placeholder="Açıklama"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                        <input
                            type="date"
                            value={formData.start}
                            onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                            required
                        />
                        <input
                            type="date"
                            value={formData.end}
                            onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                        />
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="Not Started">Başlanmadı</option>
                            <option value="In Progress">Devam Ediyor</option>
                            <option value="Completed">Tamamlandı</option>
                        </select>
                        <select
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                        >
                            <option value={1}>Düşük</option>
                            <option value={2}>Orta</option>
                            <option value={3}>Yüksek</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Kategori"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        />
                        <label>
                            <input
                                type="checkbox"
                                checked={formData.isCompleted}
                                onChange={(e) => setFormData({ ...formData, isCompleted: e.target.checked })}
                            />
                            Tamamlandı
                        </label>
                        <div className="goals-popup-actions">
                            <button onClick={handleCloseModal}>İptal</button>
                            <button onClick={handleSubmit}>
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