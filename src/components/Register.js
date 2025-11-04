import React, { useState } from 'react';
import api from '../services/api';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userData = {
      userName: username,
      email,
      password
    };

    try {
      const response = await api.post('/api/auth/register', userData);
      console.log('User registered:', response.data);
      // Başarılı kayıt sonrası yönlendirme yapabilir ya da kullanıcıyı bilgilendirebilirsin
    } catch (error) {
      console.error('There was an error registering the user!', error);
      // Hata durumunda kullanıcıyı bilgilendirebilirsin 
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
