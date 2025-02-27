import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin, onRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (username === 'Vincent' && password === 'qwe123') {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentUser', 'Vincent');
      onLogin(true);
    } else {
      // 检查普通用户
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.username === username && u.password === password);
      
      if (user) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', username);
        onLogin(true);
      } else {
        setError('Invalid username or password');
      }
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />
        </div>
        <button type="submit" className="login-button">Login</button>
        <button 
          type="button" 
          className="register-link" 
          onClick={onRegister}
        >
          New user? Register here
        </button>
      </form>
    </div>
  );
};

export default Login; 