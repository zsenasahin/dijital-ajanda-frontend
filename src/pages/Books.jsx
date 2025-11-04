import React, { useState, useEffect } from 'react';
import UniversalMenu from '../components/UniversalMenu';
import api from '../services/api';
import { 
    FaPlus, 
    FaEdit, 
    FaTrash, 
    FaBook, 
    FaStar,
    FaEye,
    FaCheckCircle
} from 'react-icons/fa';
import '../styles/Books.css';

const Books = () => {
    const [books, setBooks] = useState([]);
    const [modal, setModal] = useState({ open: false, mode: 'add', bookId: null });
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        isbn: '',
        description: '',
        totalPages: '',
        currentPage: '',
        status: 'ToRead',
        rating: 0,
        review: '',
        coverImage: '',
        tags: []
    });
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const userId = parseInt(localStorage.getItem('userId') || '1', 10);

    useEffect(() => {
        loadBooks();
    }, []);

    const loadBooks = async () => {
        try {
            const response = await api.get(`/api/Books/user/${userId}`);
            setBooks(response.data);
        } catch (error) {
            console.error('Error loading books:', error);
        }
    };

    const handleOpenModal = (book = null) => {
        if (book) {
            setModal({ open: true, mode: 'edit', bookId: book.id });
            setFormData({
                title: book.title,
                author: book.author || '',
                isbn: book.isbn || '',
                description: book.description || '',
                totalPages: book.totalPages || '',
                currentPage: book.currentPage || '',
                status: book.status || 'ToRead',
                rating: book.rating || 0,
                review: book.review || '',
                coverImage: book.coverImage || '',
                tags: book.tags || []
            });
        } else {
            setModal({ open: true, mode: 'add', bookId: null });
            setFormData({
                title: '',
                author: '',
                isbn: '',
                description: '',
                totalPages: '',
                currentPage: '',
                status: 'ToRead',
                rating: 0,
                review: '',
                coverImage: '',
                tags: []
            });
        }
    };

    const handleCloseModal = () => {
        setModal({ open: false, mode: 'add', bookId: null });
    };

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            alert('Lütfen bir başlık girin');
            return;
        }

        const bookData = {
            ...formData,
            userId: userId,
            totalPages: formData.totalPages !== '' ? parseInt(formData.totalPages) : null,
            currentPage: formData.currentPage !== '' ? parseInt(formData.currentPage) : null,
            rating: parseInt(formData.rating)
        };

        try {
            if (modal.mode === 'add') {
                await api.post('/api/Books', bookData);
            } else {
                await api.put(`/api/Books/${modal.bookId}`, bookData);
            }
            handleCloseModal();
            await loadBooks();
        } catch (error) {
            console.error('Error saving book:', error);
            alert('Kitap kaydedilirken bir hata oluştu');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bu kitabı silmek istediğinizden emin misiniz?')) {
            try {
                await api.delete(`/api/Books/${id}`);
                loadBooks();
            } catch (error) {
                console.error('Error deleting book:', error);
                alert('Kitap silinirken bir hata oluştu');
            }
        }
    };

    const handleStatusChange = async (bookId, newStatus) => {
        try {
            await api.put(`/api/Books/${bookId}/status`, {
                status: newStatus
            });
            loadBooks();
        } catch (error) {
            console.error('Error updating book status:', error);
        }
    };

    const handleProgressUpdate = async (bookId, currentPage) => {
        try {
            await api.put(`/api/Books/${bookId}/progress`, {
                currentPage: currentPage
            });
            loadBooks();
        } catch (error) {
            console.error('Error updating reading progress:', error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ToRead': return '#6b7280';
            case 'CurrentlyReading': return '#3b82f6';
            case 'Completed': return '#10b981';
            case 'Abandoned': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'ToRead': return 'Okunacak';
            case 'CurrentlyReading': return 'Okunuyor';
            case 'Completed': return 'Tamamlandı';
            case 'Abandoned': return 'Yarım Bırakıldı';
            default: return status;
        }
    };

    const getRatingStars = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (
            <FaStar 
                key={i} 
                className={i < rating ? 'star filled' : 'star empty'} 
            />
        ));
    };

    const filteredBooks = books.filter(book => {
        const matchesFilter = activeFilter === 'all' || book.status === activeFilter;
        const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            book.author.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getReadingProgress = (book) => {
        if (!book.totalPages || !book.currentPage) return 0;
        return Math.round((book.currentPage / book.totalPages) * 100);
    };

    return (
        <div className="books-container">
            <UniversalMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
            
            <div className="books-header">
                <div className="books-title">
                    <h1>📚 Kitaplığım</h1>
                    <p>Okuma hedeflerinizi takip edin ve kitaplarınızı organize edin</p>
                </div>
                <button className="add-book-btn" onClick={() => handleOpenModal()}>
                    <FaPlus /> Yeni Kitap
                </button>
            </div>

            <div className="books-filters">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Kitap veya yazar ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-buttons">
                    <button 
                        className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('all')}
                    >
                        Tümü ({books.length})
                    </button>
                    <button 
                        className={`filter-btn ${activeFilter === 'ToRead' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('ToRead')}
                    >
                        Okunacak ({books.filter(b => b.status === 'ToRead').length})
                    </button>
                    <button 
                        className={`filter-btn ${activeFilter === 'CurrentlyReading' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('CurrentlyReading')}
                    >
                        Okunuyor ({books.filter(b => b.status === 'CurrentlyReading').length})
                    </button>
                    <button 
                        className={`filter-btn ${activeFilter === 'Completed' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('Completed')}
                    >
                        Tamamlanan ({books.filter(b => b.status === 'Completed').length})
                    </button>
                </div>
            </div>

            <div className="books-grid">
                {filteredBooks.map(book => (
                    <div key={book.id} className="book-card">
                        <div className="book-cover">
                            {book.coverImage ? (
                                <img src={book.coverImage} alt={book.title} />
                            ) : (
                                <div className="book-placeholder">
                                    <FaBook />
                                </div>
                            )}
                            <div className="book-status-badge" style={{ backgroundColor: getStatusColor(book.status) }}>
                                {getStatusText(book.status)}
                            </div>
                        </div>
                        
                        <div className="book-content">
                            <h3 className="book-title">{book.title}</h3>
                            <p className="book-author">{book.author}</p>
                            
                            {book.description && (
                                <p className="book-description">{book.description}</p>
                            )}
                            
                            <div className="book-meta">
                                {book.totalPages && (
                                    <span className="book-pages">
                                        <FaBook /> {book.totalPages} sayfa
                                    </span>
                                )}
                                
                                {book.rating > 0 && (
                                    <div className="book-rating">
                                        {getRatingStars(book.rating)}
                                    </div>
                                )}
                            </div>
                            
                            {book.status === 'CurrentlyReading' && book.totalPages && (
                                <div className="reading-progress">
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill" 
                                            style={{ width: `${getReadingProgress(book)}%` }}
                                        ></div>
                                    </div>
                                    <span className="progress-text">
                                        {book.currentPage || 0} / {book.totalPages} sayfa
                                    </span>
                                </div>
                            )}
                            
                            <div className="book-actions">
                                <button 
                                    className="action-btn primary"
                                    onClick={() => handleOpenModal(book)}
                                >
                                    <FaEdit /> Düzenle
                                </button>
                                
                                {book.status === 'ToRead' && (
                                    <button 
                                        className="action-btn success"
                                        onClick={() => handleStatusChange(book.id, 'CurrentlyReading')}
                                    >
                                        <FaEye /> Okumaya Başla
                                    </button>
                                )}
                                
                                {book.status === 'CurrentlyReading' && (
                                    <button 
                                        className="action-btn success"
                                        onClick={() => handleStatusChange(book.id, 'Completed')}
                                    >
                                        <FaCheckCircle /> Tamamla
                                    </button>
                                )}
                                
                                <button 
                                    className="action-btn danger"
                                    onClick={() => handleDelete(book.id)}
                                >
                                    <FaTrash /> Sil
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredBooks.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">📚</div>
                    <h3>Henüz kitap eklenmemiş</h3>
                    <p>İlk kitabınızı ekleyerek okuma yolculuğunuza başlayın!</p>
                    <button onClick={() => handleOpenModal()}>İlk Kitabını Ekle</button>
                </div>
            )}

            {/* Modal */}
            {modal.open && (
                <div className="books-modal-overlay" onClick={handleCloseModal}>
                    <div className="books-modal" onClick={e => e.stopPropagation()}>
                        <h2>{modal.mode === 'add' ? 'Yeni Kitap' : 'Kitabı Düzenle'}</h2>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Kitap Adı *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Kitap adı"
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Yazar</label>
                                <input
                                    type="text"
                                    value={formData.author}
                                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                    placeholder="Yazar adı"
                                />
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>ISBN</label>
                                <input
                                    type="text"
                                    value={formData.isbn}
                                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                                    placeholder="ISBN numarası"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Durum</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="ToRead">Okunacak</option>
                                    <option value="CurrentlyReading">Okunuyor</option>
                                    <option value="Completed">Tamamlandı</option>
                                    <option value="Abandoned">Yarım Bırakıldı</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Toplam Sayfa</label>
                                <input
                                    type="number"
                                    value={formData.totalPages}
                                    onChange={(e) => setFormData({ ...formData, totalPages: e.target.value })}
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Mevcut Sayfa</label>
                                <input
                                    type="number"
                                    value={formData.currentPage}
                                    onChange={(e) => setFormData({ ...formData, currentPage: e.target.value })}
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>Puan</label>
                            <div className="rating-input">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        type="button"
                                        className={`star-btn ${star <= formData.rating ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, rating: star })}
                                    >
                                        <FaStar />
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>Açıklama</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Kitap hakkında kısa açıklama"
                                rows="3"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Kapak Resmi URL</label>
                            <input
                                type="url"
                                value={formData.coverImage}
                                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                                placeholder="https://example.com/cover.jpg"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Değerlendirme</label>
                            <textarea
                                value={formData.review}
                                onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                                placeholder="Kitap hakkında düşünceleriniz..."
                                rows="4"
                            />
                        </div>
                        
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={handleCloseModal}>
                                İptal
                            </button>
                            <button className="btn-primary" onClick={handleSubmit}>
                                {modal.mode === 'add' ? 'Ekle' : 'Güncelle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Books;
