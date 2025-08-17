import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
import CalendarPage from './pages/CalendarPage';
import Habits from './pages/Habits';
import Books from './pages/Books';
import Journal from './pages/Journal';
import Projects from './pages/Projects';
import KanbanBoard from './pages/KanbanBoard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/habits" element={<Habits />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/books" element={<Books />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/kanban" element={<KanbanBoard />} />
      </Routes>
    </Router>
  );
}

export default App;
