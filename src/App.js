import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import Goals from './pages/Goals';
import CalendarPage from './pages/CalendarPage';

const HabitsPage = () => <div style={{padding:'3rem',textAlign:'center'}}>Alışkanlıklar sayfası (yakında)</div>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
      </Routes>
    </Router>
  );
}

export default App;
