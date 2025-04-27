import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <div className="landing-content">
        <h1>Dijital Ajanda ile hayatını planla, kişisel asisitanını oluştur</h1>
        <button onClick={() => navigate('/login')}>Bize Katıl</button>
      </div>
    </div>
  );
};

export default LandingPage; 