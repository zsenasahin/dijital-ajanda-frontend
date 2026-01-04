import React, { useState, useEffect } from 'react';
import UniversalMenu from '../components/UniversalMenu';
import api from '../services/api';
import {
    FaPlus,
    FaArrowUp,
    FaArrowDown,
    FaTrash,
    FaCalendarAlt,
    FaChartPie
} from 'react-icons/fa';
import '../styles/Finance.css';

const EXPENSE_CATEGORIES = [
    { id: 'food', label: 'Yemek', icon: '🍔', color: '#f59e0b' },
    { id: 'transport', label: 'Ulaşım', icon: '🚗', color: '#3b82f6' },
    { id: 'entertainment', label: 'Eğlence', icon: '🎬', color: '#8b5cf6' },
    { id: 'market', label: 'Market', icon: '🛒', color: '#10b981' },
    { id: 'bills', label: 'Faturalar', icon: '📄', color: '#ef4444' },
    { id: 'health', label: 'Sağlık', icon: '💊', color: '#ec4899' },
    { id: 'clothing', label: 'Giyim', icon: '👕', color: '#06b6d4' },
    { id: 'other', label: 'Diğer', icon: '📦', color: '#6b7280' }
];

const INCOME_CATEGORIES = [
    { id: 'salary', label: 'Maaş', icon: '💰', color: '#10b981' },
    { id: 'freelance', label: 'Serbest', icon: '💼', color: '#3b82f6' },
    { id: 'investment', label: 'Yatırım', icon: '📈', color: '#8b5cf6' },
    { id: 'gift', label: 'Hediye', icon: '🎁', color: '#ec4899' },
    { id: 'other', label: 'Diğer', icon: '📦', color: '#6b7280' }
];

const Finance = () => {
    const [transactions, setTransactions] = useState([]);
    const [modal, setModal] = useState({ open: false, type: 'expense' });
    const [formData, setFormData] = useState({
        type: 'expense',
        amount: '',
        category: 'food',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [summary, setSummary] = useState({
        income: 0,
        expense: 0,
        balance: 0
    });
    const [weeklySummary, setWeeklySummary] = useState(null);
    const [monthlySummary, setMonthlySummary] = useState(null);
    const [activeTab, setActiveTab] = useState('daily');
    const userId = parseInt(localStorage.getItem('userId') || '1', 10);

    useEffect(() => {
        loadTransactions();
        loadWeeklySummary();
        loadMonthlySummary();
    }, []);

    const loadTransactions = async () => {
        try {
            const response = await api.get(`/api/Finance/user/${userId}`);
            setTransactions(response.data);
            calculateDailySummary(response.data);
        } catch (error) {
            console.error('Error loading transactions:', error);
        }
    };

    const loadWeeklySummary = async () => {
        try {
            const response = await api.get(`/api/Finance/user/${userId}/weekly`);
            setWeeklySummary(response.data);
        } catch (error) {
            console.error('Error loading weekly summary:', error);
        }
    };

    const loadMonthlySummary = async () => {
        try {
            const now = new Date();
            const response = await api.get(`/api/Finance/user/${userId}/monthly/${now.getFullYear()}/${now.getMonth() + 1}`);
            setMonthlySummary(response.data);
        } catch (error) {
            console.error('Error loading monthly summary:', error);
        }
    };

    const calculateDailySummary = (data) => {
        const today = new Date().toISOString().split('T')[0];
        const todayTransactions = data.filter(t => t.date.split('T')[0] === today);

        const income = todayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = todayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

        setSummary({ income, expense, balance: income - expense });
    };

    const handleSubmit = async () => {
        if (!formData.amount || formData.amount <= 0) {
            alert('Lütfen geçerli bir tutar girin');
            return;
        }

        try {
            await api.post('/api/Finance', {
                ...formData,
                amount: parseFloat(formData.amount),
                userId
            });
            setModal({ open: false, type: 'expense' });
            setFormData({
                type: 'expense',
                amount: '',
                category: 'food',
                description: '',
                date: new Date().toISOString().split('T')[0]
            });
            loadTransactions();
            loadWeeklySummary();
            loadMonthlySummary();
        } catch (error) {
            console.error('Error saving transaction:', error);
            alert('İşlem kaydedilirken bir hata oluştu');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bu işlemi silmek istediğinizden emin misiniz?')) {
            try {
                await api.delete(`/api/Finance/${id}`);
                loadTransactions();
                loadWeeklySummary();
                loadMonthlySummary();
            } catch (error) {
                console.error('Error deleting transaction:', error);
            }
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    };

    const getCategoryInfo = (categoryId, type) => {
        const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
        return categories.find(c => c.id === categoryId) || { label: categoryId, icon: '📦', color: '#6b7280' };
    };

    const getComparisonText = (change) => {
        if (change > 0) return `+${change.toFixed(1)}% geçen aya göre`;
        if (change < 0) return `${change.toFixed(1)}% geçen aya göre`;
        return 'Geçen ayla aynı';
    };

    return (
        <div className="finance-container">
            <UniversalMenu />

            {/* Hero Header */}
            <div className="finance-hero">
                <div className="finance-hero-content">
                    <div className="finance-hero-text">
                        <h1>💰 Finansal Takip</h1>
                        <p>Gelir ve giderlerinizi takip edin</p>
                    </div>
                    <div className="finance-quick-actions">
                        <button
                            className="quick-action-btn income"
                            onClick={() => {
                                setFormData({ ...formData, type: 'income', category: 'salary' });
                                setModal({ open: true, type: 'income' });
                            }}
                        >
                            <FaArrowUp /> Gelir Ekle
                        </button>
                        <button
                            className="quick-action-btn expense"
                            onClick={() => {
                                setFormData({ ...formData, type: 'expense', category: 'food' });
                                setModal({ open: true, type: 'expense' });
                            }}
                        >
                            <FaArrowDown /> Gider Ekle
                        </button>
                    </div>
                </div>
            </div>

            {/* Özet Kartları */}
            <div className="summary-cards">
                <div className="summary-card income-card">
                    <div className="card-icon"><FaArrowUp /></div>
                    <div className="card-info">
                        <span className="card-label">Bugünkü Gelir</span>
                        <span className="card-amount">{formatCurrency(summary.income)}</span>
                    </div>
                </div>
                <div className="summary-card expense-card">
                    <div className="card-icon"><FaArrowDown /></div>
                    <div className="card-info">
                        <span className="card-label">Bugünkü Gider</span>
                        <span className="card-amount">{formatCurrency(summary.expense)}</span>
                    </div>
                </div>
                <div className={`summary-card balance-card ${summary.balance >= 0 ? 'positive' : 'negative'}`}>
                    <div className="card-icon"><FaChartPie /></div>
                    <div className="card-info">
                        <span className="card-label">Günlük Bakiye</span>
                        <span className="card-amount">{formatCurrency(summary.balance)}</span>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="finance-tabs">
                <button
                    className={`tab-btn ${activeTab === 'daily' ? 'active' : ''}`}
                    onClick={() => setActiveTab('daily')}
                >
                    Günlük
                </button>
                <button
                    className={`tab-btn ${activeTab === 'weekly' ? 'active' : ''}`}
                    onClick={() => setActiveTab('weekly')}
                >
                    Haftalık
                </button>
                <button
                    className={`tab-btn ${activeTab === 'monthly' ? 'active' : ''}`}
                    onClick={() => setActiveTab('monthly')}
                >
                    Aylık
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'daily' && (
                <div className="transactions-list">
                    <h3>Son İşlemler</h3>
                    {transactions.slice(0, 10).map(t => {
                        const categoryInfo = getCategoryInfo(t.category, t.type);
                        return (
                            <div key={t.id} className={`transaction-item ${t.type}`}>
                                <div className="transaction-icon" style={{ backgroundColor: categoryInfo.color }}>
                                    {categoryInfo.icon}
                                </div>
                                <div className="transaction-details">
                                    <span className="transaction-category">{categoryInfo.label}</span>
                                    <span className="transaction-desc">{t.description || '-'}</span>
                                    <span className="transaction-date">
                                        {new Date(t.date).toLocaleDateString('tr-TR')}
                                    </span>
                                </div>
                                <div className="transaction-amount">
                                    <span className={t.type}>{t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}</span>
                                    <button className="delete-btn" onClick={() => handleDelete(t.id)}>
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {transactions.length === 0 && (
                        <div className="no-transactions">
                            <p>Henüz işlem yok. Gelir veya gider ekleyerek başlayın!</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'weekly' && weeklySummary && (
                <div className="period-summary">
                    <div className="period-header">
                        <h3>Bu Hafta</h3>
                        <span className="period-date">
                            {new Date(weeklySummary.weekStart).toLocaleDateString('tr-TR')} - {new Date(weeklySummary.weekEnd).toLocaleDateString('tr-TR')}
                        </span>
                    </div>
                    <div className="period-stats">
                        <div className="period-stat income">
                            <span className="stat-label">Toplam Gelir</span>
                            <span className="stat-value">{formatCurrency(weeklySummary.income)}</span>
                        </div>
                        <div className="period-stat expense">
                            <span className="stat-label">Toplam Gider</span>
                            <span className="stat-value">{formatCurrency(weeklySummary.expense)}</span>
                        </div>
                        <div className={`period-stat balance ${weeklySummary.balance >= 0 ? 'positive' : 'negative'}`}>
                            <span className="stat-label">Bakiye</span>
                            <span className="stat-value">{formatCurrency(weeklySummary.balance)}</span>
                        </div>
                    </div>
                    {weeklySummary.categoryBreakdown?.length > 0 && (
                        <div className="category-breakdown">
                            <h4>Kategori Dağılımı</h4>
                            <div className="breakdown-list">
                                {weeklySummary.categoryBreakdown.map((cat, i) => {
                                    const catInfo = getCategoryInfo(cat.category, 'expense');
                                    return (
                                        <div key={i} className="breakdown-item">
                                            <span className="breakdown-icon">{catInfo.icon}</span>
                                            <span className="breakdown-name">{catInfo.label}</span>
                                            <span className="breakdown-amount">{formatCurrency(cat.amount)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'monthly' && monthlySummary && (
                <div className="period-summary">
                    <div className="period-header">
                        <h3>Bu Ay</h3>
                        <span className="period-date">
                            {new Date(monthlySummary.year, monthlySummary.month - 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                    <div className="period-stats">
                        <div className="period-stat income">
                            <span className="stat-label">Toplam Gelir</span>
                            <span className="stat-value">{formatCurrency(monthlySummary.income)}</span>
                            {monthlySummary.comparison && (
                                <span className={`comparison ${monthlySummary.comparison.incomeChange >= 0 ? 'up' : 'down'}`}>
                                    {getComparisonText(monthlySummary.comparison.incomeChange)}
                                </span>
                            )}
                        </div>
                        <div className="period-stat expense">
                            <span className="stat-label">Toplam Gider</span>
                            <span className="stat-value">{formatCurrency(monthlySummary.expense)}</span>
                            {monthlySummary.comparison && (
                                <span className={`comparison ${monthlySummary.comparison.expenseChange <= 0 ? 'up' : 'down'}`}>
                                    {getComparisonText(monthlySummary.comparison.expenseChange)}
                                </span>
                            )}
                        </div>
                        <div className={`period-stat balance ${monthlySummary.balance >= 0 ? 'positive' : 'negative'}`}>
                            <span className="stat-label">Bakiye</span>
                            <span className="stat-value">{formatCurrency(monthlySummary.balance)}</span>
                        </div>
                    </div>
                    {monthlySummary.categoryBreakdown?.length > 0 && (
                        <div className="category-breakdown">
                            <h4>Kategori Dağılımı</h4>
                            <div className="breakdown-list">
                                {monthlySummary.categoryBreakdown.map((cat, i) => {
                                    const catInfo = getCategoryInfo(cat.category, 'expense');
                                    return (
                                        <div key={i} className="breakdown-item">
                                            <span className="breakdown-icon">{catInfo.icon}</span>
                                            <span className="breakdown-name">{catInfo.label}</span>
                                            <span className="breakdown-amount">{formatCurrency(cat.amount)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {modal.open && (
                <div className="finance-modal-overlay" onClick={() => setModal({ open: false, type: 'expense' })}>
                    <div className="finance-modal" onClick={e => e.stopPropagation()}>
                        <h2>{formData.type === 'income' ? '💰 Gelir Ekle' : '💸 Gider Ekle'}</h2>

                        <div className="form-group">
                            <label>Tutar (₺) *</label>
                            <input
                                type="number"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                            />
                        </div>

                        <div className="form-group">
                            <label>Kategori</label>
                            <div className="category-grid">
                                {(formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        className={`category-btn ${formData.category === cat.id ? 'selected' : ''}`}
                                        style={{ '--cat-color': cat.color }}
                                        onClick={() => setFormData({ ...formData, category: cat.id })}
                                    >
                                        <span>{cat.icon}</span>
                                        <span>{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Açıklama</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="İsteğe bağlı açıklama"
                            />
                        </div>

                        <div className="form-group">
                            <label>Tarih</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setModal({ open: false, type: 'expense' })}>
                                İptal
                            </button>
                            <button className="btn-primary" onClick={handleSubmit}>
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Finance;
