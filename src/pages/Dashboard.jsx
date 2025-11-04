import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalMenu from '../components/UniversalMenu';
import api from '../services/api';
import '../styles/Dashboard.css';
import { 
    FaBullseye, 
    FaBook, 
    FaJournalWhills, 
    FaTasks, 
    FaProjectDiagram,
    FaChartLine,
    FaCalendarAlt,
    FaPlus
} from 'react-icons/fa';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        goals: { total: 0, completed: 0, inProgress: 0 },
        habits: { total: 0, todayCompleted: 0, streak: 0 },
        books: { total: 0, reading: 0, completed: 0 },
        tasks: { total: 0, completed: 0, pending: 0 }
    });
    const [recentGoals, setRecentGoals] = useState([]);
    const [recentHabits, setRecentHabits] = useState([]);
    const [recentBooks, setRecentBooks] = useState([]);
    const [menuOpen, setMenuOpen] = useState(false);
    const userId = localStorage.getItem('userId') || 1;

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // Load goals
            const goalsResponse = await api.get(`/api/Goals/user/${userId}`);
            const goals = goalsResponse.data;
            setRecentGoals(goals.slice(0, 3));
            
            // Load habits
            const habitsResponse = await api.get(`/api/Habits/user/${userId}`);
            const habits = habitsResponse.data;
            setRecentHabits(habits.slice(0, 3));
            
            // Load books
            const booksResponse = await api.get(`/api/Books/user/${userId}`);
            const books = booksResponse.data;
            setRecentBooks(books.slice(0, 3));

            // Calculate stats
            const goalsStats = {
                total: goals.length,
                completed: goals.filter(g => g.isCompleted).length,
                inProgress: goals.filter(g => g.status === 'InProgress').length
            };

            const habitsStats = {
                total: habits.length,
                todayCompleted: habits.filter(h => 
                    h.completions?.some(c => c.date.split('T')[0] === new Date().toISOString().split('T')[0])
                ).length,
                streak: Math.max(...habits.map(h => h.completions?.length || 0), 0)
            };

            const booksStats = {
                total: books.length,
                reading: books.filter(b => b.status === 'CurrentlyReading').length,
                completed: books.filter(b => b.status === 'Completed').length
            };

            setStats({
                goals: goalsStats,
                habits: habitsStats,
                books: booksStats,
                tasks: { total: 0, completed: 0, pending: 0 }
            });

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Günaydın';
        if (hour < 18) return 'İyi günler';
        return 'İyi akşamlar';
    };

    const getProgressColor = (percentage) => {
        if (percentage >= 80) return '#10b981';
        if (percentage >= 60) return '#f59e0b';
        if (percentage >= 40) return '#f97316';
        return '#ef4444';
    };

    return (
        <div className="dashboard-container">
            <UniversalMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
            
            <div className="dashboard-header">
                <div className="dashboard-greeting">
                    <h1>{getGreeting()}, Kullanıcı! 👋</h1>
                    <p>Bugün neler yapmak istiyorsun?</p>
                </div>
                <div className="dashboard-date">
                    <FaCalendarAlt />
                    <span>{new Date().toLocaleDateString('tr-TR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</span>
                </div>
            </div>

            <div className="dashboard-stats-grid">
                <div className="stat-card goals-stat">
                    <div className="stat-icon">
                        <FaBullseye />
                    </div>
                    <div className="stat-content">
                        <h3>Hedefler</h3>
                        <div className="stat-numbers">
                            <span className="stat-main">{stats.goals.total}</span>
                            <span className="stat-sub">toplam</span>
                        </div>
                        <div className="stat-progress">
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ 
                                        width: `${stats.goals.total > 0 ? (stats.goals.completed / stats.goals.total) * 100 : 0}%`,
                                        backgroundColor: getProgressColor(stats.goals.total > 0 ? (stats.goals.completed / stats.goals.total) * 100 : 0)
                                    }}
                                ></div>
                            </div>
                            <span className="progress-text">
                                {stats.goals.total > 0 ? Math.round((stats.goals.completed / stats.goals.total) * 100) : 0}% tamamlandı
                            </span>
                        </div>
                    </div>
                </div>

                <div className="stat-card habits-stat">
                    <div className="stat-icon">
                        <FaChartLine />
                    </div>
                    <div className="stat-content">
                        <h3>Alışkanlıklar</h3>
                        <div className="stat-numbers">
                            <span className="stat-main">{stats.habits.todayCompleted}</span>
                            <span className="stat-sub">bugün</span>
                        </div>
                        <div className="stat-progress">
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ 
                                        width: `${stats.habits.total > 0 ? (stats.habits.todayCompleted / stats.habits.total) * 100 : 0}%`,
                                        backgroundColor: getProgressColor(stats.habits.total > 0 ? (stats.habits.todayCompleted / stats.habits.total) * 100 : 0)
                                    }}
                                ></div>
                            </div>
                            <span className="progress-text">
                                {stats.habits.total > 0 ? Math.round((stats.habits.todayCompleted / stats.habits.total) * 100) : 0}% bugün tamamlandı
                            </span>
                        </div>
                    </div>
                </div>

                <div className="stat-card books-stat">
                    <div className="stat-icon">
                        <FaBook />
                    </div>
                    <div className="stat-content">
                        <h3>Kitaplar</h3>
                        <div className="stat-numbers">
                            <span className="stat-main">{stats.books.reading}</span>
                            <span className="stat-sub">okunuyor</span>
                        </div>
                        <div className="stat-progress">
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ 
                                        width: `${stats.books.total > 0 ? (stats.books.completed / stats.books.total) * 100 : 0}%`,
                                        backgroundColor: getProgressColor(stats.books.total > 0 ? (stats.books.completed / stats.books.total) * 100 : 0)
                                    }}
                                ></div>
                            </div>
                            <span className="progress-text">
                                {stats.books.total > 0 ? Math.round((stats.books.completed / stats.books.total) * 100) : 0}% tamamlandı
                            </span>
                        </div>
                    </div>
                </div>

                <div className="stat-card tasks-stat">
                    <div className="stat-icon">
                        <FaTasks />
                    </div>
                    <div className="stat-content">
                        <h3>Görevler</h3>
                        <div className="stat-numbers">
                            <span className="stat-main">{stats.tasks.pending}</span>
                            <span className="stat-sub">bekleyen</span>
                        </div>
                        <div className="stat-progress">
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ 
                                        width: `${stats.tasks.total > 0 ? (stats.tasks.completed / stats.tasks.total) * 100 : 0}%`,
                                        backgroundColor: getProgressColor(stats.tasks.total > 0 ? (stats.tasks.completed / stats.tasks.total) * 100 : 0)
                                    }}
                                ></div>
                            </div>
                            <span className="progress-text">
                                {stats.tasks.total > 0 ? Math.round((stats.tasks.completed / stats.tasks.total) * 100) : 0}% tamamlandı
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-sections">
                <div className="dashboard-section">
                    <div className="section-header">
                        <h2>Son Hedefler</h2>
                        <button 
                            className="section-action-btn"
                            onClick={() => navigate('/goals')}
                        >
                            <FaPlus /> Tümünü Gör
                        </button>
                    </div>
                    <div className="section-content">
                        {recentGoals.length > 0 ? (
                            recentGoals.map(goal => (
                                <div key={goal.id} className="goal-item" onClick={() => navigate('/goals')}>
                                    <div className="goal-icon" style={{ backgroundColor: goal.color }}>
                                        {goal.icon}
                                    </div>
                                    <div className="goal-info">
                                        <h4>{goal.title}</h4>
                                        <p>{goal.description}</p>
                                        <div className="goal-meta">
                                            <span className={`status ${goal.status?.toLowerCase()}`}>
                                                {goal.status}
                                            </span>
                                            <span className="priority priority-{goal.priority}">
                                                {goal.priority === 1 ? 'Düşük' : goal.priority === 2 ? 'Orta' : 'Yüksek'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <p>Henüz hedef eklenmemiş</p>
                                <button onClick={() => navigate('/goals')}>İlk Hedefini Ekle</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="dashboard-section">
                    <div className="section-header">
                        <h2>Günlük Alışkanlıklar</h2>
                        <button 
                            className="section-action-btn"
                            onClick={() => navigate('/habits')}
                        >
                            <FaPlus /> Tümünü Gör
                        </button>
                    </div>
                    <div className="section-content">
                        {recentHabits.length > 0 ? (
                            recentHabits.map(habit => (
                                <div key={habit.id} className="habit-item" onClick={() => navigate('/habits')}>
                                    <div className="habit-icon" style={{ backgroundColor: habit.color }}>
                                        {habit.icon}
                                    </div>
                                    <div className="habit-info">
                                        <h4>{habit.title}</h4>
                                        <p>{habit.description}</p>
                                        <div className="habit-meta">
                                            <span className="frequency">
                                                {habit.targetFrequency}x {habit.frequencyUnit}
                                            </span>
                                            <span className="category">
                                                {habit.category}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <p>Henüz alışkanlık eklenmemiş</p>
                                <button onClick={() => navigate('/habits')}>İlk Alışkanlığını Ekle</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="dashboard-section">
                    <div className="section-header">
                        <h2>Okuma Listesi</h2>
                        <button 
                            className="section-action-btn"
                            onClick={() => navigate('/books')}
                        >
                            <FaPlus /> Tümünü Gör
                        </button>
                    </div>
                    <div className="section-content">
                        {recentBooks.length > 0 ? (
                            recentBooks.map(book => (
                                <div key={book.id} className="book-item" onClick={() => navigate('/books')}>
                                    <div className="book-cover">
                                        {book.coverImage ? (
                                            <img src={book.coverImage} alt={book.title} />
                                        ) : (
                                            <div className="book-placeholder">
                                                <FaBook />
                                            </div>
                                        )}
                                    </div>
                                    <div className="book-info">
                                        <h4>{book.title}</h4>
                                        <p>{book.author}</p>
                                        <div className="book-meta">
                                            <span className={`status ${book.status?.toLowerCase()}`}>
                                                {book.status}
                                            </span>
                                            {book.rating > 0 && (
                                                <span className="rating">
                                                    {'⭐'.repeat(book.rating)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <p>Henüz kitap eklenmemiş</p>
                                <button onClick={() => navigate('/books')}>İlk Kitabını Ekle</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="dashboard-quick-actions">
                <h3>Hızlı Eylemler</h3>
                <div className="quick-actions-grid">
                    <button className="quick-action-btn" onClick={() => navigate('/goals')}>
                        <FaBullseye />
                        <span>Hedef Ekle</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => navigate('/habits')}>
                        <FaChartLine />
                        <span>Alışkanlık Ekle</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => navigate('/journal')}>
                        <FaJournalWhills />
                        <span>Günlük Yaz</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => navigate('/books')}>
                        <FaBook />
                        <span>Kitap Ekle</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => navigate('/projects')}>
                        <FaProjectDiagram />
                        <span>Proje Ekle</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => navigate('/tasks')}>
                        <FaTasks />
                        <span>Görev Ekle</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
