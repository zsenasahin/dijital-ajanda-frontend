import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/LoginPage.css';

const EyeIcon = ({ visible }) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {visible ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted');

    if (isLogin) {
      try {
        const response = await api.post('/api/auth/login', { email, password });
        const { userId, userName } = response.data || {};
        if (userId) {
          localStorage.setItem('userId', String(userId));
          localStorage.setItem('userName', userName || '');
          navigate('/home');
        } else {
          alert('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
        }
      } catch (err) {
        alert('Giriş sırasında hata oluştu: ' + (err.response?.data || err.message));
      }
    } else {
      // Register logic
      const userData = {
        userName: userName,
        email: email,
        password: password
      };

      console.log('Sending register request with data:', userData);

      try {
        const response = await api.post('/api/auth/register', userData);
        console.log('Register response:', response);
        
        if (response.data) {
          console.log('User registered successfully:', response.data);
          alert('Kayıt başarılı! Giriş yapabilirsiniz.');
          setIsLogin(true);
        }
      } catch (error) {
        console.error('Register error:', error);
        console.error('Error details:', error.response?.data);
        alert('Kayıt işlemi sırasında bir hata oluştu: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>{isLogin ? 'Giriş Yap' : 'Kayıt Ol'}</h2>
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Kullanıcı Adı</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required={!isLogin}
                placeholder="Kullanıcı adınızı giriniz"
              />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email adresinizi giriniz"
            />
          </div>
          <div className="form-group">
            <label>Şifre</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Şifrenizi giriniz"
              />
              <span 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                style={{ color: '#666' }}
              >
                <EyeIcon visible={showPassword} />
              </span>
            </div>
          </div>
          <button type="submit">{isLogin ? 'Giriş Yap' : 'Kayıt Ol'}</button>
        </form>
        <p className="toggle-text">
          {isLogin ? 'Hesabınız yok mu? ' : 'Zaten hesabınız var mı? '}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Kayıt Ol' : 'Giriş Yap'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage; 