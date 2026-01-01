import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalMenu from '../components/UniversalMenu';
import api from '../services/api';
import '../styles/Profile.css';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import {
    FaUser,
    FaEdit,
    FaSave,
    FaTimes,
    FaSmile,
    FaMeh,
    FaFrown,
    FaChartArea,
    FaCalendarAlt,
    FaJournalWhills
} from 'react-icons/fa';

const ProfilePage = () => {
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId') || 1;
    const userName = localStorage.getItem('userName') || 'Kullanıcı';

    const [profile, setProfile] = useState({
        displayName: '',
        bio: '',
        avatar: '',
        theme: 'light',
        language: 'tr'
    });

    const [moodHistory, setMoodHistory] = useState([]);
    const [moodSummary, setMoodSummary] = useState({
        totalEntries: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        averageScore: 0.5
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editedProfile, setEditedProfile] = useState({});
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);

    useEffect(() => {
        loadProfileData();
        loadMoodHistory();
    }, [userId, days]);

    const loadProfileData = async () => {
        try {
            const response = await api.get(`/api/Profile/user/${userId}`);
            setProfile(response.data);
            setEditedProfile(response.data);
        } catch (error) {
            console.error('Profil yüklenirken hata:', error);
        }
    };

    const loadMoodHistory = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/Profile/mood-history/${userId}?days=${days}`);
            
            // Grafik için veriyi formatla
            const formattedHistory = response.data.history.map(item => ({
                ...item,
                date: new Date(item.date).toLocaleDateString('tr-TR', { 
                    day: '2-digit', 
                    month: 'short' 
                }),
                fullDate: new Date(item.date).toLocaleDateString('tr-TR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                // Score'u yüzde olarak göster
                scorePercent: Math.round(item.sentimentScore * 100)
            }));

            setMoodHistory(formattedHistory);
            setMoodSummary(response.data.summary);
        } catch (error) {
            console.error('Mood history yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            await api.put(`/api/Profile/user/${userId}`, editedProfile);
            setProfile(editedProfile);
            setIsEditing(false);
        } catch (error) {
            console.error('Profil kaydedilirken hata:', error);
        }
    };

    const handleCancelEdit = () => {
        setEditedProfile(profile);
        setIsEditing(false);
    };

    // Sentiment'a göre renk belirleme
    const getSentimentColor = (label) => {
        switch (label) {
            case 'Positive': return '#10b981';
            case 'Negative': return '#ef4444';
            default: return '#f59e0b';
        }
    };

    // Özel tooltip component'i
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="mood-tooltip">
                    <p className="tooltip-date">{data.fullDate}</p>
                    <p className="tooltip-title">📝 {data.title}</p>
                    <p className="tooltip-score" style={{ color: getSentimentColor(data.sentimentLabel) }}>
                        {data.sentimentLabel === 'Positive' && '😊 '}
                        {data.sentimentLabel === 'Negative' && '😔 '}
                        {data.sentimentLabel === 'Neutral' && '😐 '}
                        Duygu Skoru: {data.scorePercent}%
                    </p>
                </div>
            );
        }
        return null;
    };

    // Gradient tanımları
    const gradientOffset = () => {
        const dataMax = Math.max(...moodHistory.map(i => i.sentimentScore));
        const dataMin = Math.min(...moodHistory.map(i => i.sentimentScore));

        if (dataMax <= 0.5) return 0;
        if (dataMin >= 0.5) return 1;

        return (0.5 - dataMin) / (dataMax - dataMin);
    };

    const off = gradientOffset();

    return (
        <div className="profile-container">
            <UniversalMenu />

            {/* Profil Header */}
            <div className="profile-header">
                <div className="profile-hero">
                    <div className="profile-avatar-section">
                        <div className="profile-avatar">
                            {profile.avatar ? (
                                <img src={profile.avatar} alt="Avatar" />
                            ) : (
                                <FaUser />
                            )}
                        </div>
                        {isEditing && (
                            <input
                                type="text"
                                placeholder="Avatar URL"
                                value={editedProfile.avatar || ''}
                                onChange={(e) => setEditedProfile({...editedProfile, avatar: e.target.value})}
                                className="avatar-input"
                            />
                        )}
                    </div>

                    <div className="profile-info">
                        {isEditing ? (
                            <>
                                <input
                                    type="text"
                                    placeholder="Görünen İsim"
                                    value={editedProfile.displayName || ''}
                                    onChange={(e) => setEditedProfile({...editedProfile, displayName: e.target.value})}
                                    className="name-input"
                                />
                                <textarea
                                    placeholder="Biyografi..."
                                    value={editedProfile.bio || ''}
                                    onChange={(e) => setEditedProfile({...editedProfile, bio: e.target.value})}
                                    className="bio-input"
                                />
                            </>
                        ) : (
                            <>
                                <h1 className="profile-name">
                                    {profile.displayName || userName || 'Kullanıcı'}
                                </h1>
                                <p className="profile-bio">
                                    {profile.bio || 'Henüz biyografi eklenmemiş. Düzenle butonuna tıklayarak ekleyebilirsin.'}
                                </p>
                            </>
                        )}

                        <div className="profile-actions">
                            {isEditing ? (
                                <>
                                    <button className="save-btn" onClick={handleSaveProfile}>
                                        <FaSave /> Kaydet
                                    </button>
                                    <button className="cancel-btn" onClick={handleCancelEdit}>
                                        <FaTimes /> İptal
                                    </button>
                                </>
                            ) : (
                                <button className="edit-btn" onClick={() => setIsEditing(true)}>
                                    <FaEdit /> Düzenle
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mood Summary Cards */}
            <div className="mood-summary-section">
                <h2 className="section-title">
                    <FaChartArea /> Duygu Durum Özeti
                </h2>
                
                <div className="mood-summary-cards">
                    <div className="summary-card total-card">
                        <div className="card-icon">
                            <FaJournalWhills />
                        </div>
                        <div className="card-content">
                            <span className="card-value">{moodSummary.totalEntries}</span>
                            <span className="card-label">Toplam Günlük</span>
                        </div>
                    </div>

                    <div className="summary-card positive-card">
                        <div className="card-icon">
                            <FaSmile />
                        </div>
                        <div className="card-content">
                            <span className="card-value">{moodSummary.positiveCount}</span>
                            <span className="card-label">Pozitif Gün</span>
                        </div>
                    </div>

                    <div className="summary-card neutral-card">
                        <div className="card-icon">
                            <FaMeh />
                        </div>
                        <div className="card-content">
                            <span className="card-value">{moodSummary.neutralCount}</span>
                            <span className="card-label">Nötr Gün</span>
                        </div>
                    </div>

                    <div className="summary-card negative-card">
                        <div className="card-icon">
                            <FaFrown />
                        </div>
                        <div className="card-content">
                            <span className="card-value">{moodSummary.negativeCount}</span>
                            <span className="card-label">Negatif Gün</span>
                        </div>
                    </div>
                </div>

                {/* Ortalama Skor Göstergesi */}
                <div className="average-score-section">
                    <div className="average-score-bar">
                        <div className="score-labels">
                            <span className="label-negative">😔 Negatif</span>
                            <span className="label-neutral">😐 Nötr</span>
                            <span className="label-positive">😊 Pozitif</span>
                        </div>
                        <div className="score-track">
                            <div 
                                className="score-indicator" 
                                style={{ 
                                    left: `${moodSummary.averageScore * 100}%`,
                                    backgroundColor: moodSummary.averageScore >= 0.6 ? '#10b981' : 
                                                    moodSummary.averageScore <= 0.4 ? '#ef4444' : '#f59e0b'
                                }}
                            />
                        </div>
                        <p className="average-label">
                            Ortalama Duygu Skoru: <strong>{Math.round(moodSummary.averageScore * 100)}%</strong>
                        </p>
                    </div>
                </div>
            </div>

            {/* Mood Chart Section */}
            <div className="mood-chart-section">
                <div className="chart-header">
                    <h2 className="section-title">
                        <FaCalendarAlt /> Duygu Durum Grafiği
                    </h2>
                    <div className="chart-controls">
                        <select 
                            value={days} 
                            onChange={(e) => setDays(Number(e.target.value))}
                            className="days-select"
                        >
                            <option value={7}>Son 7 Gün</option>
                            <option value={14}>Son 14 Gün</option>
                            <option value={30}>Son 30 Gün</option>
                            <option value={60}>Son 60 Gün</option>
                            <option value={90}>Son 90 Gün</option>
                        </select>
                    </div>
                </div>

                <div className="chart-container">
                    {loading ? (
                        <div className="chart-loading">
                            <div className="loading-spinner"></div>
                            <p>Veriler yükleniyor...</p>
                        </div>
                    ) : moodHistory.length === 0 ? (
                        <div className="chart-empty">
                            <FaJournalWhills className="empty-icon" />
                            <h3>Henüz günlük yazısı yok</h3>
                            <p>Günlük yazmaya başladığında duygu durum analizin burada görünecek.</p>
                            <button onClick={() => navigate('/journal')} className="write-journal-btn">
                                Günlük Yazmaya Başla
                            </button>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={400}>
                            <AreaChart data={moodHistory} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset={off} stopColor="#10b981" stopOpacity={0.8} />
                                        <stop offset={off} stopColor="#ef4444" stopOpacity={0.8} />
                                    </linearGradient>
                                    <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis 
                                    dataKey="date" 
                                    stroke="#94a3b8"
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                />
                                <YAxis 
                                    domain={[0, 1]} 
                                    tickFormatter={(value) => `${Math.round(value * 100)}%`}
                                    stroke="#94a3b8"
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="sentimentScore"
                                    name="Duygu Skoru"
                                    stroke="#667eea"
                                    strokeWidth={3}
                                    fill="url(#splitColor)"
                                    dot={{ 
                                        fill: '#667eea', 
                                        strokeWidth: 2, 
                                        r: 4,
                                        stroke: '#fff'
                                    }}
                                    activeDot={{ 
                                        r: 8, 
                                        stroke: '#667eea',
                                        strokeWidth: 2,
                                        fill: '#fff'
                                    }}
                                />
                                {/* Nötr çizgisi */}
                                <Area
                                    type="monotone"
                                    dataKey={() => 0.5}
                                    name="Nötr Seviye"
                                    stroke="#f59e0b"
                                    strokeDasharray="5 5"
                                    strokeWidth={2}
                                    fill="none"
                                    dot={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Chart Legend */}
                {moodHistory.length > 0 && (
                    <div className="chart-legend">
                        <div className="legend-item">
                            <span className="legend-color positive"></span>
                            <span>Pozitif Bölge (60%+)</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-color neutral"></span>
                            <span>Nötr Bölge (40-60%)</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-color negative"></span>
                            <span>Negatif Bölge (40%-)</span>
                        </div>
                    </div>
                )}
            </div>

            {/* AI Analysis Info */}
            <div className="ai-info-section">
                <div className="ai-badge">
                    <span className="ai-icon">🤖</span>
                    <span>AI Destekli Analiz</span>
                </div>
                <p>
                    Duygu durum analizleri, günlük yazılarınızdaki kelimeler ve ifadeler 
                    kullanılarak yapay zeka tarafından otomatik olarak hesaplanır. 
                    Bu analiz, genel ruh halinizi takip etmenize yardımcı olur.
                </p>
            </div>
        </div>
    );
};

export default ProfilePage;
