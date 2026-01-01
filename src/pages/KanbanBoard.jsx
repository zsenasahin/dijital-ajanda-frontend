import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import UniversalMenu from '../components/UniversalMenu';
import api from '../services/api';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    useDroppable,
} from '@dnd-kit/core';
import {
    useDraggable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaClock,
    FaUser,
    FaFlag,
    FaCalendarAlt,
    FaProjectDiagram,
    FaGripVertical
} from 'react-icons/fa';
import '../styles/KanbanBoard.css';

// Draggable Task Card
const DraggableTaskCard = ({ task, onEdit, onDelete, projects, getPriorityColor, getPriorityText }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
    } = useDraggable({ id: task.id });

    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleEditClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onEdit(task);
    };

    const handleDeleteClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete(task.id);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`task-card ${isDragging ? 'dragging' : ''}`}
        >
            <div className="task-header">
                <div className="drag-handle" {...attributes} {...listeners}>
                    <FaGripVertical />
                </div>
                <h4>{task.title}</h4>
                <div className="task-actions">
                    <button
                        className="task-action-btn edit-btn"
                        onClick={handleEditClick}
                        title="Düzenle"
                    >
                        <FaEdit />
                    </button>
                    <button
                        className="task-action-btn delete-btn"
                        onClick={handleDeleteClick}
                        title="Sil"
                    >
                        <FaTrash />
                    </button>
                </div>
            </div>

            {task.description && (
                <p className="task-description">{task.description}</p>
            )}

            <div className="task-meta">
                <div className="task-priority">
                    <FaFlag style={{ color: getPriorityColor(task.priority) }} />
                    <span>{getPriorityText(task.priority)}</span>
                </div>

                {task.estimatedHours && (
                    <div className="task-hours">
                        <FaClock />
                        <span>{task.estimatedHours}h</span>
                    </div>
                )}

                {task.dueDate && (
                    <div className="task-due">
                        <FaCalendarAlt />
                        <span>{new Date(task.dueDate).toLocaleDateString('tr-TR')}</span>
                    </div>
                )}

                {task.projectId && (
                    <div className="task-project">
                        <FaProjectDiagram />
                        <span>
                            {projects.find(p => p.id === task.projectId)?.title || 'Proje'}
                        </span>
                    </div>
                )}
            </div>

            {task.assignee && (
                <div className="task-assignee">
                    <FaUser />
                    <span>{task.assignee}</span>
                </div>
            )}
        </div>
    );
};

// Droppable Column
const DroppableColumn = ({ column, children }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: column.id,
    });

    return (
        <div className="kanban-column">
            <div className="column-header" style={{ borderTopColor: column.color }}>
                <h3>{column.title}</h3>
                <span className="task-count">{column.tasks.length}</span>
            </div>

            <div
                ref={setNodeRef}
                className={`column-content ${isOver ? 'dragging-over' : ''}`}
            >
                {children}
            </div>
        </div>
    );
};

const KanbanBoard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [modal, setModal] = useState({ open: false, mode: 'add', taskId: null });
    const [activeId, setActiveId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        estimatedHours: '',
        dueDate: '',
        projectId: '',
        assignee: ''
    });
    const userId = parseInt(localStorage.getItem('userId') || '1', 10);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor)
    );

    const columns = {
        todo: {
            id: 'todo',
            title: 'Yapılacak',
            color: '#6b7280',
            tasks: []
        },
        inprogress: {
            id: 'inprogress',
            title: 'Devam Ediyor',
            color: '#3b82f6',
            tasks: []
        },
        review: {
            id: 'review',
            title: 'İnceleme',
            color: '#f59e0b',
            tasks: []
        },
        done: {
            id: 'done',
            title: 'Tamamlandı',
            color: '#10b981',
            tasks: []
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            let tasksData = [];
            let projectsData = [];

            try {
                const tasksResponse = await api.get(`/api/Tasks/user/${userId}`);
                tasksData = tasksResponse.data || [];
            } catch (tasksError) {
                console.error('Error loading tasks:', tasksError);
                tasksData = [];
            }

            try {
                const projectsResponse = await api.get(`/api/Projects/user/${userId}`);
                projectsData = projectsResponse.data || [];
            } catch (projectsError) {
                console.error('Error loading projects:', projectsError);
                projectsData = [];
            }

            setTasks(tasksData);
            setProjects(projectsData);

            // Eğer location.state'den taskId gelirse modalı aç
            if (location.state?.taskId && tasksData.length > 0) {
                const targetTask = tasksData.find(t => t.id === location.state.taskId);
                if (targetTask) {
                    handleOpenModal(targetTask);
                    // State'i temizle
                    navigate(location.pathname, { replace: true, state: {} });
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    // location.state değiştiğinde de kontrol et
    useEffect(() => {
        if (location.state?.taskId && tasks.length > 0) {
            const targetTask = tasks.find(t => t.id === location.state.taskId);
            if (targetTask) {
                handleOpenModal(targetTask);
                navigate(location.pathname, { replace: true, state: {} });
            }
        }
    }, [location.state, tasks]);

    const organizeTasksIntoColumns = () => {
        const organized = JSON.parse(JSON.stringify(columns));

        tasks.forEach(task => {
            let status = task.status?.toLowerCase() || 'todo';
            if (status === 'completed' || status === 'done') {
                status = 'done';
            } else if (status === 'inprogress' || status === 'in progress') {
                status = 'inprogress';
            } else if (status === 'review') {
                status = 'review';
            } else {
                status = 'todo';
            }

            if (organized[status]) {
                organized[status].tasks.push(task);
            }
        });

        return organized;
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeTask = tasks.find(t => t.id === active.id);
        if (!activeTask) return;

        const columnIds = ['todo', 'inprogress', 'review', 'done'];
        let targetColumnId = over.id;

        if (!columnIds.includes(targetColumnId)) {
            const overTask = tasks.find(t => t.id === over.id);
            if (overTask) {
                let overStatus = overTask.status?.toLowerCase() || 'todo';
                if (overStatus === 'completed') overStatus = 'done';
                targetColumnId = overStatus;
            } else {
                return;
            }
        }

        const currentStatus = activeTask.status?.toLowerCase() || 'todo';
        const normalizedCurrentStatus = currentStatus === 'completed' ? 'done' : currentStatus;

        if (normalizedCurrentStatus === targetColumnId) return;

        try {
            await api.put(`/api/Tasks/${active.id}/status`, {
                status: targetColumnId
            });

            const updatedTasks = tasks.map(task =>
                task.id === active.id
                    ? { ...task, status: targetColumnId }
                    : task
            );
            setTasks(updatedTasks);
        } catch (error) {
            console.error('Error updating task status:', error);
            alert('Görev durumu güncellenirken hata oluştu');
        }
    };

    const handleOpenModal = (task = null) => {
        if (task) {
            setModal({ open: true, mode: 'edit', taskId: task.id });
            const priority = task.priority
                ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1).toLowerCase()
                : 'Medium';
            setFormData({
                title: task.title || '',
                description: task.description || '',
                priority: priority,
                estimatedHours: task.estimatedHours || '',
                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                projectId: task.projectId ? String(task.projectId) : '',
                assignee: task.assignee || ''
            });
        } else {
            setModal({ open: true, mode: 'add', taskId: null });
            setFormData({
                title: '',
                description: '',
                priority: 'Medium',
                estimatedHours: '',
                dueDate: '',
                projectId: '',
                assignee: ''
            });
        }
    };

    const handleCloseModal = () => {
        setModal({ open: false, mode: 'add', taskId: null });
    };

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            alert('Lütfen bir başlık girin');
            return;
        }

        try {
            let response;
            if (modal.mode === 'add') {
                const taskData = {
                    title: formData.title.trim(),
                    description: formData.description || '',
                    priority: formData.priority || 'Medium',
                    status: 'todo',
                    dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
                    projectId: formData.projectId ? parseInt(formData.projectId) : null,
                    userId: userId
                };
                response = await api.post('/api/Tasks', taskData);
            } else {
                const updateData = {
                    title: formData.title.trim(),
                    description: formData.description || '',
                    priority: formData.priority || 'Medium',
                    dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
                    projectId: formData.projectId ? parseInt(formData.projectId) : null
                };
                response = await api.put(`/api/Tasks/${modal.taskId}`, updateData);
            }
            handleCloseModal();
            await loadData();
        } catch (error) {
            console.error('Error saving task:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Görev kaydedilirken bir hata oluştu';
            alert('Hata: ' + (typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage, null, 2)));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
            try {
                await api.delete(`/api/Tasks/${id}`);
                loadData();
            } catch (error) {
                console.error('Error deleting task:', error);
                alert('Görev silinirken bir hata oluştu');
            }
        }
    };

    const getPriorityColor = (priority) => {
        const p = priority?.toLowerCase() || 'medium';
        switch (p) {
            case 'low': return '#10b981';
            case 'medium': return '#f59e0b';
            case 'high': return '#f97316';
            case 'critical': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getPriorityText = (priority) => {
        const p = priority?.toLowerCase() || 'medium';
        switch (p) {
            case 'low': return 'Düşük';
            case 'medium': return 'Orta';
            case 'high': return 'Yüksek';
            case 'critical': return 'Kritik';
            default: return priority;
        }
    };

    const organizedColumns = organizeTasksIntoColumns();
    const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

    return (
        <div className="kanban-container">
            <UniversalMenu />

            {/* FAB Button for new task */}
            <button className="add-task-fab" onClick={() => handleOpenModal()} title="Yeni Görev">
                <FaPlus />
            </button>

            <div className="kanban-stats">
                <div className="stat-item">
                    <span className="stat-number">{tasks.length}</span>
                    <span className="stat-label">Toplam Görev</span>
                </div>
                <div className="stat-item">
                    <span className="stat-number">
                        {tasks.filter(t => (t.status?.toLowerCase() === 'done' || t.status?.toLowerCase() === 'completed')).length}
                    </span>
                    <span className="stat-label">Tamamlanan</span>
                </div>
                <div className="stat-item">
                    <span className="stat-number">
                        {tasks.filter(t => (t.status?.toLowerCase() === 'inprogress' || t.status?.toLowerCase() === 'in progress')).length}
                    </span>
                    <span className="stat-label">Devam Eden</span>
                </div>
                <div className="stat-item">
                    <span className="stat-number">
                        {tasks.filter(t => (t.status?.toLowerCase() === 'todo' || !t.status)).length}
                    </span>
                    <span className="stat-label">Bekleyen</span>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="kanban-board">
                    {Object.values(organizedColumns).map(column => (
                        <DroppableColumn key={column.id} column={column}>
                            {column.tasks.map((task) => (
                                <DraggableTaskCard
                                    key={task.id}
                                    task={task}
                                    onEdit={handleOpenModal}
                                    onDelete={handleDelete}
                                    projects={projects}
                                    getPriorityColor={getPriorityColor}
                                    getPriorityText={getPriorityText}
                                />
                            ))}
                            {column.tasks.length === 0 && (
                                <div className="empty-column">
                                    <p>Görev yok</p>
                                </div>
                            )}
                        </DroppableColumn>
                    ))}
                </div>

                <DragOverlay>
                    {activeTask ? (
                        <div className="task-card dragging-overlay">
                            <div className="task-header">
                                <h4>{activeTask.title}</h4>
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Modal */}
            {modal.open && (
                <div className="kanban-modal-overlay" onClick={handleCloseModal}>
                    <div className="kanban-modal" onClick={e => e.stopPropagation()}>
                        <h2>{modal.mode === 'add' ? 'Yeni Görev' : 'Görevi Düzenle'}</h2>

                        <div className="form-group">
                            <label>Başlık *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Görev başlığı"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Açıklama</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Görev açıklaması"
                                rows="3"
                            />
                        </div>

                        <div className="form-row">
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

                            <div className="form-group">
                                <label>Tahmini Süre (saat)</label>
                                <input
                                    type="number"
                                    value={formData.estimatedHours}
                                    onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Bitiş Tarihi</label>
                                <input
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Proje</label>
                                <select
                                    value={formData.projectId}
                                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                >
                                    <option value="">Proje Seçin</option>
                                    {projects.map(project => (
                                        <option key={project.id} value={project.id}>
                                            {project.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Atanan Kişi</label>
                            <input
                                type="text"
                                value={formData.assignee}
                                onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                                placeholder="Atanan kişi adı"
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

export default KanbanBoard;
