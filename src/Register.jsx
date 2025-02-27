import React, { useState } from 'react';
import './Register.css';

const Register = ({ onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 获取现有的待审核用户列表
    const pendingUsers = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
    
    // 检查用户名是否已存在
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const isPending = pendingUsers.some(user => user.username === username);
    const isExisting = existingUsers.some(user => user.username === username);

    if (isPending) {
      setError('Registration pending approval');
      return;
    }

    if (isExisting) {
      setError('Username already exists');
      return;
    }

    // 添加到待审核列表
    const newUser = {
      username,
      password,
      email,
      requestDate: new Date().toISOString()
    };

    localStorage.setItem('pendingUsers', JSON.stringify([...pendingUsers, newUser]));
    alert('Registration submitted. Waiting for admin approval.');
    onBack();
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2>Register</h2>
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
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
            required
          />
        </div>
        <div className="button-group">
          <button type="submit" className="register-button">Register</button>
          <button type="button" className="back-button" onClick={onBack}>
            Back to Login
          </button>
        </div>
      </form>
    </div>
  );
};

export default Register; 