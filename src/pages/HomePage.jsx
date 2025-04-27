import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HomePage.css';

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

const TIMER_DEFAULT = 25 * 60; // 25:00

const HomePage = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [mode, setMode] = useState('clock'); // 'clock', 'timer', 'chrono'
  const [timer, setTimer] = useState(TIMER_DEFAULT);
  const [timerRunning, setTimerRunning] = useState(false);
  const [chrono, setChrono] = useState(0);
  const [chronoRunning, setChronoRunning] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef();
  const chronoRef = useRef();

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

  // Render
  return (
    <div className="home-container">
      {/* Sağ üst focus simgesi */}
      <div className="focus-mode-icon" onClick={() => setMode(mode === 'clock' ? 'timer' : 'clock')} onMouseEnter={()=>setFocusTooltip(true)} onMouseLeave={()=>setFocusTooltip(false)}>
        <FocusIcon />
        <span className="focus-mode-count">0</span>
        {focusTooltip && <span className="focus-tooltip">focus mode</span>}
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
                <button className="timer-btn" onClick={()=>setTimerRunning(false)}>Durdur</button>
              ) : (
                <button className="timer-btn" onClick={()=>setTimerRunning(true)}>Başlat</button>
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

      {/* Sağ alt çıkış butonu */}
      <button className="logout-button" onClick={()=>navigate('/')}> <LogoutIcon /> </button>
    </div>
  );
};

export default HomePage;
