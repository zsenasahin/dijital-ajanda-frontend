import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalMenu from '../components/UniversalMenu';
import axios from 'axios';
import '../styles/Habits.css';
import backgroundImage from '../assets/habbit-tracker.jpg';

const Habits = () => {
    const navigate = useNavigate();
    const [habits, setHabits] = useState([]);
    const [modal, setModal] = useState({ open: false, mode: 'add', habitId: null });
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        completedDays: []
    });
    const [menuOpen, setMenuOpen] = useState(false);
    const userId = 1;

    useEffect(() => {
        loadHabits();
    }, []);

    const loadHabits = async () => {
        try {
            const response = await axios.get('https://localhost:7255/api/Habits');
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
                startDate: habit.startDate.split('T')[0],
                endDate: habit.endDate ? habit.endDate.split('T')[0] : '',
                completedDays: habit.completedDays || []
            });
        } else {
            setModal({ open: true, mode: 'add', habitId: null });
            setFormData({
                title: '',
                description: '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: '',
                completedDays: []
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
            userId: userId
        };

        try {
            if (modal.mode === 'add') {
                await axios.post('https://localhost:7255/api/Habits', habitData);
            } else {
                await axios.put(`https://localhost:7255/api/Habits/${modal.habitId}`, habitData);
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
                await axios.delete(`https://localhost:7255/api/Habits/${id}`);
                loadHabits();
            } catch (error) {
                console.error('Error deleting habit:', error);
                alert('Alışkanlık silinirken bir hata oluştu');
            }
        }
    };

    const toggleDayCompletion = async (habitId, dayIndex) => {
        try {
            const habit = habits.find(h => h.id === habitId);
            const completedDays = [...(habit.completedDays || [])];
            
            if (completedDays.includes(dayIndex)) {
                completedDays.splice(completedDays.indexOf(dayIndex), 1);
            } else {
                completedDays.push(dayIndex);
            }

            await axios.put(`https://localhost:7255/api/Habits/${habitId}`, {
                ...habit,
                completedDays
            });
            
            loadHabits();
        } catch (error) {
            console.error('Error updating habit completion:', error);
            alert('Alışkanlık güncellenirken bir hata oluştu');
        }
    };

    const getDaysBetweenDates = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = [];
        let currentDate = new Date(start);

        while (currentDate <= end) {
            days.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return days;
    };

    return (
        <div className="habits-page">
            <UniversalMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
            
            <div className="habits-cover" style={{ backgroundImage: `url(${backgroundImage})` }}>
                <div className="habits-cover-content">
                    <h1 className="habits-cover-title">Alışkanlıklar</h1>
                    <button className="habits-new-btn-small" onClick={() => handleOpenModal()}>
                        + Yeni
                    </button>
                </div>
            </div>

            <div className="habits-list-section">
                {habits.map((habit) => {
                    const days = getDaysBetweenDates(habit.startDate, habit.endDate);
                    return (
                        <div key={habit.id} className="habits-task">
                            <div className="habits-task-header">
                                <div className="habit-task-container">
                                    <h3 className="habits-task-title">{habit.title}</h3>
                                    <p className="habit-description">{habit.description}</p>
                                    <div className="habit-dates">
                                        <span>Başlangıç: {new Date(habit.startDate).toLocaleDateString('tr-TR')}</span>
                                        {habit.endDate && <span>Bitiş: {new Date(habit.endDate).toLocaleDateString('tr-TR')}</span>}
                                    </div>
                                    <div className="habit-days">
                                        {days.map((day, index) => (
                                            <button
                                                key={index}
                                                className={`habit-day ${habit.completedDays?.includes(index) ? 'completed' : ''}`}
                                                onClick={() => toggleDayCompletion(habit.id, index)}
                                                title={day.toLocaleDateString('tr-TR')}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="habit-actions">
                                    <button className="habits-toggle-btn" onClick={() => handleOpenModal(habit)}>✎</button>
                                    <button className="habits-toggle-btn" onClick={() => handleDelete(habit.id)}>×</button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {modal.open && (
                <div className="habits-popup-overlay">
                    <div className="habits-popup">
                        <h2>{modal.mode === 'add' ? 'Yeni Alışkanlık' : 'Alışkanlığı Düzenle'}</h2>
                        <div className="form-group">
                            <label>Başlık</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Açıklama</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Başlangıç Tarihi</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                required
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
                        <div className="habits-popup-actions">
                            <button onClick={handleCloseModal}>İptal</button>
                            <button onClick={handleSubmit} className="submit-button">
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