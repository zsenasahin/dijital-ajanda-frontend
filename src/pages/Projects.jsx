import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalMenu from '../components/UniversalMenu';
import api from '../services/api';
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaProjectDiagram,
    FaCalendarAlt,
    FaFlag,
    FaChartLine,
    FaTasks,
    FaArrowRight,
    FaTimes,
    FaCheckCircle,
    FaSpinner
} from 'react-icons/fa';
import '../styles/Projects.css';

const Projects = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [modal, setModal] = useState({ open: false, mode: 'add', projectId: null });
    const [tasksModal, setTasksModal] = useState({ open: false, project: null, tasks: [], loading: false });
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'Planned',
        priority: 'Medium',
        startDate: '',
        endDate: '',
        progress: 0,
        color: '#6366f1',
        icon: '📋',
        tags: []
    });
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const userId = parseInt(localStorage.getItem('userId') || '1', 10);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const response = await api.get(`/api/Projects/user/${userId}`);
            setProjects(response.data);
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    };

    const handleOpenModal = (project = null) => {
        if (project) {
            setModal({ open: true, mode: 'edit', projectId: project.id });
            // Tags'i parse et - backend string olarak gönderiyor
            let tagsArray = [];
            if (project.tags) {
                if (typeof project.tags === 'string') {
                    try {
                        tagsArray = project.tags ? project.tags.split(',').map(t => t.trim()).filter(t => t) : [];
                    } catch (e) {
                        tagsArray = [];
                    }
                } else if (Array.isArray(project.tags)) {
                    tagsArray = project.tags;
                }
            }

            setFormData({
                title: project.title || '',
                description: project.description || '',
                status: project.status || 'Planned',
                priority: project.priority || 'Medium',
                startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
                progress: project.progress || 0,
                color: project.color || '#6366f1',
                icon: project.icon || '📋',
                tags: tagsArray
            });
        } else {
            setModal({ open: true, mode: 'add', projectId: null });
            setFormData({
                title: '',
                description: '',
                status: 'Planned',
                priority: 'Medium',
                startDate: new Date().toISOString().split('T')[0],
                endDate: '',
                progress: 0,
                color: '#6366f1',
                icon: '📋',
                tags: []
            });
        }
    };

    const handleCloseModal = () => {
        setModal({ open: false, mode: 'add', projectId: null });
    };

    const handleViewTasks = async (project) => {
        setTasksModal({ open: true, project: project, tasks: [], loading: true });
        try {
            // First try to get tasks by project if endpoint exists, otherwise get all user tasks and filter
            // Assuming we need to fetch all user tasks and filter for now as we did in Kanban
            const response = await api.get(`/api/Tasks/user/${userId}`);
            const projectTasks = response.data.filter(t => t.projectId === project.id);
            setTasksModal({ open: true, project: project, tasks: projectTasks, loading: false });
        } catch (error) {
            console.error('Error loading tasks:', error);
            setTasksModal(prev => ({ ...prev, loading: false }));
        }
    };

    const closeTasksModal = () => {
        setTasksModal({ open: false, project: null, tasks: [], loading: false });
    };

    const navigateToTask = (taskId) => {
        navigate('/kanban', { state: { taskId: taskId } });
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.title.trim()) {
            alert('Lütfen bir başlık girin');
            return;
        }

        const tagsString = Array.isArray(formData.tags)
            ? formData.tags.filter(t => t && t.trim()).join(',')
            : (formData.tags || '');

        let startDateValue = formData.startDate;
        if (!startDateValue) {
            startDateValue = new Date().toISOString().split('T')[0];
        }

        const projectData = {
            title: formData.title.trim(),
            description: formData.description || '',
            status: formData.status || 'Planned',
            priority: formData.priority || 'Medium',
            startDate: startDateValue,
            endDate: formData.endDate && formData.endDate.trim() ? formData.endDate : null,
            progress: formData.progress ? parseFloat(formData.progress) : 0,
            color: formData.color || '#6366f1',
            icon: formData.icon || '📋',
            tags: tagsString,
            userId: userId
        };

        try {
            if (modal.mode === 'add') {
                await api.post('/api/Projects', projectData);
            } else {
                await api.put(`/api/Projects/${modal.projectId}`, projectData);
            }
            handleCloseModal();
            await loadProjects();
        } catch (error) {
            console.error('Error saving project:', error);
            const errorMessage = error.response?.data?.message || error.response?.data || 'Proje kaydedilirken bir hata oluştu';
            alert(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage, null, 2));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bu projeyi silmek istediğinizden emin misiniz?')) {
            try {
                await api.delete(`/api/Projects/${id}`);
                loadProjects();
            } catch (error) {
                console.error('Error deleting project:', error);
                alert('Proje silinirken bir hata oluştu');
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Planned': return '#6b7280';
            case 'InProgress': return '#3b82f6';
            case 'OnHold': return '#f59e0b';
            case 'Completed': return '#10b981';
            case 'Cancelled': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'Planned': return 'Planlandı';
            case 'InProgress': return 'Devam Ediyor';
            case 'OnHold': return 'Beklemede';
            case 'Completed': return 'Tamamlandı';
            case 'Cancelled': return 'İptal Edildi';
            default: return status;
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Low': return '#10b981';
            case 'Medium': return '#f59e0b';
            case 'High': return '#f97316';
            case 'Critical': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getPriorityText = (priority) => {
        switch (priority) {
            case 'Low': return 'Düşük';
            case 'Medium': return 'Orta';
            case 'High': return 'Yüksek';
            case 'Critical': return 'Kritik';
            default: return priority;
        }
    };

    const getProgressColor = (progress) => {
        if (progress >= 80) return '#10b981';
        if (progress >= 60) return '#f59e0b';
        if (progress >= 40) return '#f97316';
        return '#ef4444';
    };

    const filteredProjects = projects.filter(project => {
        const matchesFilter = activeFilter === 'all' || project.status === activeFilter;
        const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.description?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const projectIcons = ['📋', '🚀', '💡', '🎯', '🔧', '📱', '🌐', '📊', '🎨', '📚', '🏠', '🚗', '✈️', '🎵', '🎮'];

    return (
        <div className="projects-container">
            <UniversalMenu />

            <div className="projects-header">
                <div className="projects-title">
                    <h1><FaProjectDiagram /> Projelerim</h1>
                    <p>{projects.length} proje kaydı</p>
                </div>
            </div>

            <div className="projects-filters">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Proje ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-buttons">
                    <button
                        className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('all')}
                    >
                        Tümü ({projects.length})
                    </button>
                    <button
                        className={`filter-btn ${activeFilter === 'Planned' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('Planned')}
                    >
                        Planlandı ({projects.filter(p => p.status === 'Planned').length})
                    </button>
                    <button
                        className={`filter-btn ${activeFilter === 'InProgress' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('InProgress')}
                    >
                        Devam Ediyor ({projects.filter(p => p.status === 'InProgress').length})
                    </button>
                    <button
                        className={`filter-btn ${activeFilter === 'Completed' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('Completed')}
                    >
                        Tamamlanan ({projects.filter(p => p.status === 'Completed').length})
                    </button>
                </div>
            </div>

            <div className="projects-grid">
                {filteredProjects.map((project, index) => (
                    <div key={project.id} className="project-card" style={{ '--index': index }}>
                        <div className="project-header">
                            <div className="project-icon" style={{ backgroundColor: project.color }}>
                                {project.icon}
                            </div>
                            <div className="project-actions">
                                <button
                                    className="action-btn edit"
                                    onClick={() => handleOpenModal(project)}
                                >
                                    <FaEdit />
                                </button>
                                <button
                                    className="action-btn delete"
                                    onClick={() => handleDelete(project.id)}
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>

                        <div className="project-content">
                            <h3 className="project-title">{project.title}</h3>

                            {project.description && (
                                <p className="project-description">{project.description}</p>
                            )}

                            <div className="project-meta">
                                <div className="project-status">
                                    <span
                                        className="status-badge"
                                        style={{ backgroundColor: getStatusColor(project.status) }}
                                    >
                                        {getStatusText(project.status)}
                                    </span>
                                </div>

                                <div className="project-priority">
                                    <FaFlag style={{ color: getPriorityColor(project.priority) }} />
                                    <span>{getPriorityText(project.priority)}</span>
                                </div>
                            </div>

                            <div className="project-dates">
                                <div className="date-item">
                                    <FaCalendarAlt />
                                    <span>Başlangıç: {new Date(project.startDate).toLocaleDateString('tr-TR')}</span>
                                </div>
                                {project.endDate && (
                                    <div className="date-item">
                                        <FaCalendarAlt />
                                        <span>Bitiş: {new Date(project.endDate).toLocaleDateString('tr-TR')}</span>
                                    </div>
                                )}
                            </div>

                            <div className="project-progress">
                                <div className="progress-header">
                                    <span>İlerleme</span>
                                    <span className="progress-percentage">{project.progress}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{
                                            width: `${project.progress}%`,
                                            backgroundColor: getProgressColor(project.progress)
                                        }}
                                    ></div>
                                </div>
                            </div>

                            {project.tags && (() => {
                                const tagsArray = typeof project.tags === 'string'
                                    ? project.tags.split(',').map(t => t.trim()).filter(t => t)
                                    : (Array.isArray(project.tags) ? project.tags : []);
                                return tagsArray.length > 0 && (
                                    <div className="project-tags">
                                        {tagsArray.map(tag => (
                                            <span key={tag} className="tag">{tag}</span>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="project-footer">
                            <button
                                className="view-tasks-btn"
                                onClick={() => handleViewTasks(project)}
                            >
                                <FaTasks /> Görevleri Gör
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredProjects.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon"><FaProjectDiagram /></div>
                    <h3>Henüz proje eklenmemiş</h3>
                    <p>İlk projenizi ekleyerek başlayın!</p>
                    <button onClick={() => handleOpenModal()}><FaPlus /> İlk Projeyi Ekle</button>
                </div>
            )}

            <button className="add-project-btn" onClick={() => handleOpenModal()} aria-label="Yeni Proje">
                <FaPlus />
            </button>

            {/* Project Edit/Add Modal */}
            {modal.open && (
                <div className="projects-modal-overlay" onClick={handleCloseModal}>
                    <div className="projects-modal" onClick={e => e.stopPropagation()}>
                        <h2>{modal.mode === 'add' ? 'Yeni Proje' : 'Projeyi Düzenle'}</h2>

                        <div className="form-group">
                            <label>Proje Adı *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Proje adı"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Açıklama</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Proje açıklaması"
                                rows="3"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Durum</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="Planned">Planlandı</option>
                                    <option value="InProgress">Devam Ediyor</option>
                                    <option value="OnHold">Beklemede</option>
                                    <option value="Completed">Tamamlandı</option>
                                    <option value="Cancelled">İptal Edildi</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Öncelik</label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                >
                                    <option value="Low">Düşük</option>
                                    <option value="Medium">Orta</option>
                                    <option value="High">Yüksek</option>
                                    <option value="Critical">Kritik</option>
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

                        <div className="form-group">
                            <label>İlerleme (%)</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={formData.progress}
                                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                                className="progress-slider"
                            />
                            <span className="progress-value">{formData.progress}%</span>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Renk</label>
                                <input
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    className="color-picker"
                                />
                            </div>

                            <div className="form-group">
                                <label>İkon</label>
                                <div className="icon-selector">
                                    {projectIcons.map(icon => (
                                        <button
                                            key={icon}
                                            type="button"
                                            className={`icon-btn ${formData.icon === icon ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, icon })}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
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
                                            const tag = e.target.value.trim();
                                            if (tag && !formData.tags.includes(tag)) {
                                                setFormData({ ...formData, tags: [...formData.tags, tag] });
                                            }
                                            e.target.value = '';
                                        }
                                    }}
                                />
                                <div className="tags-list">
                                    {formData.tags.map(tag => (
                                        <span key={tag} className="tag">
                                            {tag}
                                            <button onClick={() => setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })}>×</button>
                                        </span>
                                    ))}
                                </div>
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

            {/* List Tasks Modal */}
            {tasksModal.open && (
                <div className="projects-modal-overlay tasks-modal-overlay" onClick={closeTasksModal}>
                    <div className="projects-modal tasks-modal" onClick={e => e.stopPropagation()}>
                        <div className="tasks-modal-header">
                            <h2>
                                {tasksModal.project?.icon} {tasksModal.project?.title} - Görevler
                            </h2>
                            <button className="close-btn" onClick={closeTasksModal}>
                                <FaTimes />
                            </button>
                        </div>

                        <div className="tasks-list-container">
                            {tasksModal.loading ? (
                                <div className="loading-state">
                                    <FaSpinner className="spinner" />
                                    <p>Görevler yükleniyor...</p>
                                </div>
                            ) : tasksModal.tasks.length > 0 ? (
                                <div className="tasks-list">
                                    {tasksModal.tasks.map(task => (
                                        <div key={task.id} className="task-item">
                                            <div className="task-info">
                                                <h4>{task.title}</h4>
                                                <div className="task-badges">
                                                    <span className={`badge-status ${task.status?.toLowerCase()}`}>
                                                        {task.status === 'todo' ? 'Yapılacak' :
                                                            task.status === 'inprogress' ? 'Devam Ediyor' :
                                                                task.status === 'review' ? 'İncelemede' : 'Tamamlandı'}
                                                    </span>
                                                    <span className="badge-priority">
                                                        <FaFlag style={{ color: getPriorityColor(task.priority) }} />
                                                        {getPriorityText(task.priority)}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                className="task-detail-btn"
                                                onClick={() => navigateToTask(task.id)}
                                                title="Detayı Gör"
                                            >
                                                Detayı Gör <FaArrowRight />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="no-tasks-state">
                                    <FaTasks />
                                    <p>Bu projeye ait görev bulunmuyor.</p>
                                    <button
                                        className="btn-primary create-task-btn"
                                        onClick={() => navigate('/kanban')}
                                    >
                                        Görev Oluşturmak İçin Kanbana Git
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;
