import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <div className="landing-content">
        <h3>
          <span>Aventra'ya Hoş Geldin!</span>
        </h3>
        <p>Hayat bir macera; her anı kaydetmeye, büyümeye ve keşfetmeye değer. </p>
        <p>Hedeflerini belirle, alışkanlıklarını inşa et ve odaklanarak yolculuğunu başlat.</p>
        <button onClick={() => navigate('/login')}>Bize Katıl</button>
      </div>
    </div>
  );
};

export default LandingPage;
