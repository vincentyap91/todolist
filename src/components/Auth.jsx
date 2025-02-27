import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Auth.css';
import { loadUsers, addPendingUser, getUser } from '../utils/dataService';

function Auth() {
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (activeTab === 'login') {
        // 超级管理员登录
        if (formData.username === 'vincent' && formData.password === 'qwe123') {
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('user', 'vincent');
          navigate('/todos');
          return;
        }

        // 普通用户登录
        const { approvedUsers } = await loadUsers();
        const user = approvedUsers.find(u => 
          (u.email === formData.username || 
           u.username === formData.username) && 
          u.password === formData.password
        );

        if (user) {
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('user', user.email); // 始终存储邮箱作为唯一标识符
          navigate('/todos');
        } else {
          setError('用户名/邮箱或密码错误');
        }
      } else {
        // 注册逻辑
        const { approvedUsers, pendingUsers } = await loadUsers();
        
        // 检查邮箱是否已存在
        const emailExists = [...pendingUsers, ...approvedUsers].some(
          user => user.email === formData.username
        );

        if (emailExists) {
          setError('此邮箱已被注册！');
          return;
        }

        await addPendingUser({
          email: formData.username,
          password: formData.password,
          username: '',
          registeredAt: new Date().toISOString()
        });
        
        setSuccess(true);
        setFormData({ username: '', password: '' });
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error.message || '操作失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-tabs">
          <button 
            className={`tab-button ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('login');
              setError('');
              setSuccess(false);
            }}
          >
            登录
          </button>
          <button 
            className={`tab-button ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('register');
              setError('');
              setSuccess(false);
            }}
          >
            注册
          </button>
        </div>

        <h2>{activeTab === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        {success && activeTab === 'register' ? (
          <div className="success-message">
            <h3>注册申请已提交！</h3>
            <p>请等待管理员审核您的账号。</p>
            <p>审核通过后，您可以：</p>
            <ul>
              <li>使用邮箱和密码登录</li>
              <li>在个人资料页面设置您的用户名</li>
              <li>开始使用所有功能</li>
            </ul>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>{activeTab === 'login' ? '邮箱/用户名' : '邮箱'}</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder={activeTab === 'login' ? "输入邮箱或用户名" : "输入邮箱"}
                disabled={loading}
                required
              />
            </div>
            <div className="form-group">
              <label>密码</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="输入密码"
                disabled={loading}
                required
              />
            </div>
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? '处理中...' : (activeTab === 'login' ? '登录' : '注册')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Auth; 