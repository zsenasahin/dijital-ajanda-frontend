import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaComments, FaTimes, FaPaperPlane, FaRobot, FaHome, FaBullseye, FaChartLine, FaBook, FaProjectDiagram, FaTasks } from 'react-icons/fa';
import '../styles/ChatbotWidget.css';
import api from '../services/api';

const quickActions = [
  { id: 'home', label: 'Anasayfa', icon: <FaHome />, path: '/home' },
  { id: 'dashboard', label: 'Dashboard', icon: <FaChartLine />, path: '/dashboard' },
  { id: 'goals', label: 'Hedefler', icon: <FaBullseye />, path: '/goals' },
  { id: 'habits', label: 'Alışkanlıklar', icon: <FaChartLine />, path: '/habits' },
  { id: 'books', label: 'Kitaplar', icon: <FaBook />, path: '/books' },
  { id: 'projects', label: 'Projeler', icon: <FaProjectDiagram />, path: '/projects' },
  { id: 'tasks', label: 'Görevler', icon: <FaTasks />, path: '/kanban' },
];

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: 'Merhaba, ben Aventra Asistan. Hedeflerini planlamana, alışkanlıklarını düzenlemene ve uygulama içinde hızlıca gezinmene yardım edebilirim. Ne yapmak istersin?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const toggleOpen = () => setIsOpen((prev) => !prev);

  const handleQuickAction = (action) => {
    navigate(action.path);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: 'assistant',
        text: `"${action.label}" sayfasına yönlendirdim. Başka bir konuda da yardımcı olabilirim.`,
      },
    ]);
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const userId = parseInt(localStorage.getItem('userId') || '0', 10);
      const response = await api.post('/api/Chat', {
        message: trimmed,
        currentPath: location.pathname,
        userId: userId > 0 ? userId : null,
      });

      const replyText =
        response.data?.reply ||
        'Şu anda yanıt üretemiyorum, ancak yine de sana yardımcı olmaya çalışacağım. Lütfen sorunu biraz daha detaylandır.';

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: replyText,
        },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          role: 'assistant',
          text: 'Üzgünüm, asistan şu anda yanıt veremiyor. Lütfen daha sonra tekrar dene.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chatbot-widget-container">
      {/* Floating Button */}
      {!isOpen && (
        <button className="chatbot-toggle-button" onClick={toggleOpen} aria-label="Sohbeti Aç">
          <FaComments />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <FaRobot className="chatbot-avatar" />
              <div>
                <div className="chatbot-title">Aventra Asistan</div>
                <div className="chatbot-subtitle">Mini yardımcı & hızlı kısayollar</div>
              </div>
            </div>
            <button className="chatbot-close-button" onClick={toggleOpen} aria-label="Sohbeti Kapat">
              <FaTimes />
            </button>
          </div>

          <div className="chatbot-body">
            <div className="chatbot-messages">
              {messages.map((m) => (
                <div key={m.id} className={`chatbot-message ${m.role === 'user' ? 'user' : 'assistant'}`}>
                  <div className="chatbot-message-bubble">{m.text}</div>
                </div>
              ))}
              {isLoading && (
                <div className="chatbot-message assistant">
                  <div className="chatbot-message-bubble chatbot-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
            </div>

            <div className="chatbot-quick-actions">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  className="chatbot-quick-action"
                  type="button"
                  onClick={() => handleQuickAction(action)}
                >
                  <span className="chatbot-quick-icon">{action.icon}</span>
                  <span className="chatbot-quick-label">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="chatbot-input-area">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Asistana bir şey sor veya ne yapmak istediğini yaz..."
              rows={2}
            />
            <button
              className="chatbot-send-button"
              type="button"
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;


