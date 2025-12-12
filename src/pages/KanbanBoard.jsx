import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalMenu from '../components/UniversalMenu';
import api from '../services/api';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
    FaPlus, 
    FaEdit, 
    FaTrash, 
    FaClock, 
    FaUser, 
    FaFlag,
    FaCalendarAlt,
    FaProjectDiagram
} from 'react-icons/fa';
import '../styles/KanbanBoard.css';

const SortableTaskCard = ({ task, onEdit, onDelete, projects, getPriorityColor, getPriorityText }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="task-header">
        <h4>{task.title}</h4>
        <div className="task-actions">
          <button
            className="task-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
          >
            <FaEdit />
          </button>
          <button
            className="task-action-btn delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
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

const KanbanBoard = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [modal, setModal] = useState({ open: false, mode: 'add', taskId: null });
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
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    );

    const columns = {
        todo: {
            id: 'todo',
            title: 'Yapılacak',
            color: '#6b7280',
            tasks: []
        },
        inProgress: {
            id: 'inProgress',
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
            // Tasks ve Projects'i ayrı ayrı yükle, biri hata verse bile diğeri yüklensin
            let tasksData = [];
            let projectsData = [];
            
            try {
                const tasksResponse = await api.get(`/api/Tasks/user/${userId}`);
                tasksData = tasksResponse.data || [];
            } catch (tasksError) {
                console.error('Error loading tasks:', tasksError);
                // Tasks yüklenemezse boş array kullan
                tasksData = [];
            }
            
            try {
                const projectsResponse = await api.get(`/api/Projects/user/${userId}`);
                projectsData = projectsResponse.data || [];
            } catch (projectsError) {
                console.error('Error loading projects:', projectsError);
                // Projects yüklenemezse boş array kullan
                projectsData = [];
            }

            setTasks(tasksData);
            setProjects(projectsData);
            
            console.log('Loaded tasks:', tasksData.length);
            console.log('Loaded projects:', projectsData.length);
        } catch (error) {
            console.error('Error loading data:', error);
            // Sessizce devam et, kullanıcıya alert gösterme
        }
    };

    const organizeTasksIntoColumns = () => {
        const organized = { ...columns };
        
        tasks.forEach(task => {
            // Status'u normalize et
            let status = task.status?.toLowerCase() || 'todo';
            // Eğer status "done" veya "completed" ise "done" olarak ayarla
            if (status === 'completed' || status === 'done') {
                status = 'done';
            } else if (status === 'inprogress' || status === 'in progress') {
                status = 'inProgress';
            } else if (status === 'review') {
                status = 'review';
            } else {
                status = 'todo';
            }
            
            const columnId = status;
            if (organized[columnId]) {
                organized[columnId].tasks.push(task);
            }
        });

        return organized;
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        
        if (!over) return;

        const activeTask = tasks.find(t => t.id === active.id);
        const targetColumn = over.id;

        if (!activeTask || activeTask.status === targetColumn) return;

        // Status'u küçük harfe çevir (backend küçük harf bekliyor)
        const newStatus = targetColumn === 'todo' ? 'todo' :
                         targetColumn === 'inProgress' ? 'inprogress' :
                         targetColumn === 'review' ? 'review' : 'done';

        try {
            await api.put(`/api/Tasks/${active.id}/status`, {
                status: newStatus
            });

            // Update local state
            const updatedTasks = tasks.map(task => 
                task.id === active.id 
                    ? { ...task, status: newStatus }
                    : task
            );
            setTasks(updatedTasks);
        } catch (error) {
            console.error('Error updating task status:', error);
        }
    };

    const handleOpenModal = (task = null) => {
        if (task) {
            setModal({ open: true, mode: 'edit', taskId: task.id });
            // Priority'yi capitalize et (backend küçük harf gönderiyor)
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

        const taskData = {
            title: formData.title.trim(),
            description: formData.description || '',
            priority: formData.priority || 'Medium',
            status: 'todo',
            dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
            projectId: formData.projectId ? parseInt(formData.projectId) : null,
            userId: userId
        };

        try {
            let response;
            if (modal.mode === 'add') {
                response = await api.post('/api/Tasks', taskData);
                console.log('Task created:', response.data);
            } else {
                // Update için sadece gerekli alanları gönder
                const updateData = {
                    title: taskData.title,
                    description: taskData.description,
                    priority: taskData.priority,
                    status: taskData.status,
                    dueDate: taskData.dueDate,
                    projectId: taskData.projectId
                };
                response = await api.put(`/api/Tasks/${modal.taskId}`, updateData);
                console.log('Task updated:', response.data);
            }
            handleCloseModal();
            await loadData();
        } catch (error) {
            console.error('Error saving task:', error);
            console.error('Error response:', error.response);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || error.response?.data || error.message || 'Görev kaydedilirken bir hata oluştu';
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

    const organizedColumns = organizeTasksIntoColumns();

    return (
        <div className="kanban-container">
            <UniversalMenu />
            
            <div className="kanban-header">
                <div className="kanban-title">
                    <h1>Proje Yönetimi</h1>
                    <p>Görevlerinizi organize edin ve takip edin</p>
                </div>
                <button className="add-task-btn" onClick={() => handleOpenModal()}>
                    <FaPlus /> Yeni Görev
                </button>
            </div>

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
                onDragEnd={handleDragEnd}
            >
                <div className="kanban-board">
                    {Object.values(organizedColumns).map(column => (
                        <div key={column.id} className="kanban-column">
                            <div className="column-header" style={{ borderTopColor: column.color }}>
                                <h3>{column.title}</h3>
                                <span className="task-count">{column.tasks.length}</span>
                            </div>
                            
                            <div className="column-content">
                                <SortableContext
                                    items={column.tasks.map(t => t.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {column.tasks.map((task) => (
                                        <SortableTaskCard
                                            key={task.id}
                                            task={task}
                                            onEdit={handleOpenModal}
                                            onDelete={handleDelete}
                                            projects={projects}
                                            getPriorityColor={getPriorityColor}
                                            getPriorityText={getPriorityText}
                                        />
                                    ))}
                                </SortableContext>
                            </div>
                        </div>
                    ))}
                </div>
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
