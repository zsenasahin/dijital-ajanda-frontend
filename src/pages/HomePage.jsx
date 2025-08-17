import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalMenu from '../components/UniversalMenu';
import '../styles/HomePage.css';
import axios from 'axios';

const LogoutIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const FocusIcon = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C7 2 2 7 2 12s5 10 10 10 10-5 10-10S17 2 12 2z" stroke="#fff"/>
    <path d="M15 9a3 3 0 0 0-6 0c0 1.5 1.5 2.5 3 2.5s3-1 3-2.5z" stroke="#fff"/>
    <circle cx="12" cy="12" r="10" stroke="#38f9d7" strokeWidth="0.5"/>
  </svg>
);

const TimerIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="13" r="8" stroke="#fff"/>
    <line x1="12" y1="13" x2="12" y2="9" stroke="#fff"/>
    <line x1="12" y1="13" x2="15" y2="13" stroke="#fff"/>
  </svg>
);

const ChronoIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="13" r="8" stroke="#fff"/>
    <polyline points="12 13 16 13 16 17" stroke="#fff"/>
    <line x1="12" y1="13" x2="12" y2="9" stroke="#fff"/>
  </svg>
);

const TaskIcon = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" stroke="#fff"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="#fff"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const TIMER_DEFAULT = 25 * 60; // 25:00

const initialWidgets = [
  { id: 'clock', type: 'clock', visible: true },
  { id: 'goals', type: 'goals', visible: false },
  { id: 'dashboard', type: 'dashboard', visible: false },
  { id: 'books', type: 'books', visible: false },
  { id: 'journal', type: 'journal', visible: false },
  { id: 'projects', type: 'projects', visible: false },
  { id: 'kanban', type: 'kanban', visible: false },
];

const HomePage = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [mode, setMode] = useState('clock'); // 'clock', 'timer', 'chrono'
  const [timer, setTimer] = useState(TIMER_DEFAULT);
  const [timerRunning, setTimerRunning] = useState(false);
  const [chrono, setChrono] = useState(0);
  const [chronoRunning, setChronoRunning] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [showTasks, setShowTasks] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef();
  const chronoRef = useRef();
  const [widgets, setWidgets] = useState(initialWidgets);
  const [menuOpen, setMenuOpen] = useState(false);
  const [focusCount, setFocusCount] = useState(0);
  const [focusTotalSeconds, setFocusTotalSeconds] = useState(0);
  const [focusStartTime, setFocusStartTime] = useState(null);

  // Welcome & clock
  useEffect(() => {
    if (mode !== 'clock') return;
    const timer = setTimeout(() => setShowWelcome(false), 2000);
    const updateClock = () => setCurrentTime(new Date().toLocaleTimeString());
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);
    return () => { clearTimeout(timer); clearInterval(clockInterval); };
  }, [mode]);

  // Timer
  useEffect(() => {
    if (mode !== 'timer' || !timerRunning) return;
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev > 0) return prev - 1;
        setTimerRunning(false);
        clearInterval(timerRef.current);
        return 0;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timerRunning, mode]);

  // Chrono
  useEffect(() => {
    if (mode !== 'chrono' || !chronoRunning) return;
    chronoRef.current = setInterval(() => setChrono((prev) => prev + 1), 1000);
    return () => clearInterval(chronoRef.current);
  }, [chronoRunning, mode]);

  // Mode değişince timer/chrono resetle
  useEffect(() => {
    if (mode === 'timer') { setTimer(TIMER_DEFAULT); setTimerRunning(false); }
    if (mode === 'chrono') { setChrono(0); setChronoRunning(false); }
  }, [mode]);

  // Format helpers
  const formatTime = (sec) => `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;

  // Tooltip state
  const [focusTooltip, setFocusTooltip] = useState(false);
  const [modeTooltip, setModeTooltip] = useState(false);

  // Widget'ı ana sayfada göster/gizle
  const showWidget = (type) => {
    setWidgets((prev) => prev.map(w => w.type === type ? { ...w, visible: true } : w));
  };
  const hideWidget = (type) => {
    setWidgets((prev) => prev.map(w => w.type === type ? { ...w, visible: false } : w));
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    
    const userId = 1; // TODO: Giriş yapan kullanıcıdan al
    const today = new Date();
    // DateOnly formatı için yyyy-MM-dd stringi oluştur
    const dateOnly = today.toISOString().split('T')[0];

    try {
      const response = await axios.post('https://localhost:7255/api/DailyTasks', {
        userId,
        title: newTask.trim(),
        isCompleted: false,
        date: dateOnly
      });
      setTasks(prev => [...prev, response.data]);
      setNewTask('');
    } catch (err) {
      alert('Görev eklenirken hata oluştu!');
      console.error(err);
    }
  };

  const toggleTask = (taskId) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (taskId) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  // Timer başlat/durdur fonksiyonları
  const handleFocusStart = () => {
    setTimerRunning(true);
    setFocusStartTime(Date.now());
  };
  const handleFocusStop = () => {
    setTimerRunning(false);
    if (focusStartTime) {
      const elapsed = Math.floor((Date.now() - focusStartTime) / 1000);
      setFocusTotalSeconds(total => total + elapsed);
      setFocusStartTime(null);
    }
  };

  function formatDuration(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    let result = '';
    if (h > 0) result += `${h} sa `;
    if (m > 0 || h === 0) result += `${m} dk`;
    return result.trim();
  }

  // Render
  return (
    <div className="home-container">
      {/* Sol üst universal menü */}
      <UniversalMenu />
      {/* Sağ üst focus simgesi */}
      <div className="top-icons">
        <div className="task-icon-wrapper">
          <div className="task-icon" onClick={() => setShowTasks(!showTasks)}>
            <TaskIcon />
            <span className="task-count">{tasks.length}</span>
          </div>
          {showTasks && (
            <div className="task-container">
              <form onSubmit={handleAddTask} className="task-form">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Yeni Görev"
                  className="task-input"
                />
                <button type="submit" className="task-add-btn" title="Ekle">+</button>
              </form>
              <div className="task-list">
                {tasks.map(task => (
                  <div key={task.id} className="task-item">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      className="task-checkbox"
                    />
                    <span className={`task-text ${task.completed ? 'completed' : ''}`}>{task.title || task.text}</span>
                    <button onClick={() => deleteTask(task.id)} className="task-delete-btn" title="Sil">
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="focus-mode-icon-wrapper">
          <div className="focus-mode-icon" onClick={() => setMode(mode === 'clock' ? 'timer' : 'clock')} onMouseEnter={()=>setFocusTooltip(true)} onMouseLeave={()=>setFocusTooltip(false)}>
            <FocusIcon />
            <span className="focus-mode-count">{formatDuration(focusTotalSeconds)}</span>
            {focusTooltip && <span className="focus-tooltip">focus mode</span>}
          </div>
        </div>
      </div>
      {/* Ortadaki ana alan */}
      <div className="center-content">
        {mode === 'clock' && (
          showWelcome ? (
            <div className="welcome-message"><h1>Aventra'ya hoşgeldin</h1></div>
          ) : (
            <div className="clock-container"><h1>{currentTime}</h1></div>
          )
        )}
        {mode === 'timer' && (
          <div className="circle-timer">
            <div className="circle-timer-icon" onClick={()=>setMode('chrono')} onMouseEnter={()=>setModeTooltip(true)} onMouseLeave={()=>setModeTooltip(false)}>
              <TimerIcon />
              {modeTooltip && <span className="mode-tooltip">kronometre</span>}
            </div>
            <div className="circle-timer-time">{formatTime(timer)}</div>
            <div className="circle-timer-buttons">
              {timerRunning ? (
                <button className="timer-btn" onClick={handleFocusStop}>Durdur</button>
              ) : (
                <button className="timer-btn" onClick={handleFocusStart}>Başlat</button>
              )}
            </div>
          </div>
        )}
        {mode === 'chrono' && (
          <div className="circle-timer">
            <div className="circle-timer-icon" onClick={()=>setMode('timer')} onMouseEnter={()=>setModeTooltip(true)} onMouseLeave={()=>setModeTooltip(false)}>
              <ChronoIcon />
              {modeTooltip && <span className="mode-tooltip">zamanlayıcı</span>}
            </div>
            <div className="circle-timer-time">{formatTime(chrono)}</div>
            <div className="circle-timer-buttons">
              {chronoRunning ? (
                <button className="timer-btn" onClick={()=>setChronoRunning(false)}>Durdur</button>
              ) : (
                <button className="timer-btn" onClick={()=>setChronoRunning(true)}>Başlat</button>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Hızlı erişim butonları */}
      <div className="quick-access-buttons">
        <button className="quick-btn" onClick={() => navigate('/dashboard')} title="Dashboard">
          📊
        </button>
        <button className="quick-btn" onClick={() => navigate('/goals')} title="Hedefler">
          🎯
        </button>
        <button className="quick-btn" onClick={() => navigate('/habits')} title="Alışkanlıklar">
          🔄
        </button>
        <button className="quick-btn" onClick={() => navigate('/books')} title="Kitaplar">
          📚
        </button>
        <button className="quick-btn" onClick={() => navigate('/journal')} title="Günlük">
          📝
        </button>
        <button className="quick-btn" onClick={() => navigate('/projects')} title="Projeler">
          📋
        </button>
        <button className="quick-btn" onClick={() => navigate('/kanban')} title="Kanban">
          📊
        </button>
      </div>
      
      {/* Sağ alt çıkış butonu */}
      <button className="logout-button" onClick={()=>navigate('/')}> <LogoutIcon /> </button>
    </div>
  );
};

export default HomePage;
