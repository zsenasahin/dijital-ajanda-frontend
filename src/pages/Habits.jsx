import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalMenu from '../components/UniversalMenu';
import axios from 'axios';
import '../styles/Habits.css';
import backgroundImage from '../assets/habbit-tracker-page.jpg';

const MOTIVATION = 'Küçük adımlar, büyük değişimler yaratır.';

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
    const [showModal, setShowModal] = useState(false);
    const userId = localStorage.getItem('userId') || 1;

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

    const handleAddHabit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.startDate || !formData.endDate) return;
        const userId = localStorage.getItem('userId') || 1;
        try {
            const response = await axios.post('https://localhost:7255/api/Habits', {
                title: formData.title,
                description: '',
                startDate: new Date(formData.startDate),
                endDate: new Date(formData.endDate),
                completedDays: [],
                userId: Number(userId)
            });
            setFormData({ title: '', startDate: '', endDate: '', completedDays: [] });
            setShowModal(false);
            setHabits(prev => [...prev, response.data]);
        } catch (err) {
            alert('Alışkanlık eklenirken hata oluştu!');
            console.error(err);
        }
    };

    const toggleDay = (habitIdx, dayIdx) => {
        setHabits(habits => habits.map((h, i) => i === habitIdx ? {
            ...h,
            completed: h.completedDays.map((c, j) => j === dayIdx ? !c : c)
        } : h));
        loadHabits();
    };

    return (
        <div className="habits-bg" style={{ backgroundImage: `url(${backgroundImage})` }}>
            <div className="habits-center-box">
                <div className="motivation-text">{MOTIVATION}</div>
                <button className="add-habit-btn" onClick={() => setShowModal(true)}>Ekle</button>
            </div>
            {showModal && (
                <div className="habit-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="habit-modal" onClick={e => e.stopPropagation()}>
                        <h2>Alışkanlık Ekle</h2>
                        <form onSubmit={handleAddHabit}>
                            <input type="text" placeholder="Alışkanlık adı" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                            <div className="habit-modal-dates">
                                <label>Başlangıç: <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} required /></label>
                                <label>Bitiş: <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} required /></label>
                            </div>
                            <div className="habit-modal-actions">
                                <button type="button" onClick={() => setShowModal(false)}>İptal</button>
                                <button type="submit">Ekle</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Habits; 