import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalMenu from '../components/UniversalMenu';
import axios from 'axios';
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
    const [menuOpen, setMenuOpen] = useState(false);
    const userId = localStorage.getItem('userId') || 1;

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
            const [tasksResponse, projectsResponse] = await Promise.all([
                axios.get(`https://localhost:7255/api/Tasks/user/${userId}`),
                axios.get(`https://localhost:7255/api/Projects/user/${userId}`)
            ]);

            setTasks(tasksResponse.data);
            setProjects(projectsResponse.data);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const organizeTasksIntoColumns = () => {
        const organized = { ...columns };
        
        tasks.forEach(task => {
            const columnId = task.status.toLowerCase().replace(/\s+/g, '');
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

        const newStatus = targetColumn === 'todo' ? 'Todo' :
                         targetColumn === 'inProgress' ? 'InProgress' :
                         targetColumn === 'review' ? 'Review' : 'Done';

        try {
            await axios.put(`https://localhost:7255/api/Tasks/${active.id}/status`, {
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
            setFormData({
                title: task.title,
                description: task.description || '',
                priority: task.priority || 'Medium',
                estimatedHours: task.estimatedHours || '',
                dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
                projectId: task.projectId || '',
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
            ...formData,
            userId: userId,
            status: 'Todo',
            estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : null,
            dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null
        };

        try {
            if (modal.mode === 'add') {
                await axios.post('https://localhost:7255/api/Tasks', taskData);
            } else {
                await axios.put(`https://localhost:7255/api/Tasks/${modal.taskId}`, taskData);
            }
            handleCloseModal();
            loadData();
        } catch (error) {
            console.error('Error saving task:', error);
            alert('Görev kaydedilirken bir hata oluştu');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
            try {
                await axios.delete(`https://localhost:7255/api/Tasks/${id}`);
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
            <UniversalMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
            
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
                        {tasks.filter(t => t.status === 'Done').length}
                    </span>
                    <span className="stat-label">Tamamlanan</span>
                </div>
                <div className="stat-item">
                    <span className="stat-number">
                        {tasks.filter(t => t.status === 'InProgress').length}
                    </span>
                    <span className="stat-label">Devam Eden</span>
                </div>
                <div className="stat-item">
                    <span className="stat-number">
                        {tasks.filter(t => t.status === 'Todo').length}
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
