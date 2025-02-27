import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Profile.css';
import { getUser, updateUser, loadUsers } from '../utils/dataService';
import { getDisplayName } from '../utils/userUtils';

function Profile() {
  const [user, setUser] = useState({
    name: '',
    email: '',
    username: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    username: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = localStorage.getItem('user');
        if (!currentUser) {
          navigate('/login');
          return;
        }

        const userDetails = await getUser(currentUser);
        if (userDetails) {
          setUser(userDetails);
          setEditForm({
            name: userDetails.name || '',
            username: userDetails.username || ''
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('加载用户数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const updatedUser = await updateUser(user.email, {
        name: editForm.name,
        username: editForm.username
      });

      if (updatedUser) {
        setUser(updatedUser);
        localStorage.setItem('user', updatedUser.name);
        setIsEditing(false);
      } else {
        setError('保存失败');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('更新资料失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>个人资料</h2>
        <span className="display-name">当前显示名称: {getDisplayName(user)}</span>
      </div>
      
      <div className="profile-card">
        {error && <div className="error-message">{error}</div>}
        
        {!isEditing ? (
          <div className="profile-info">
            <div className="info-group">
              <label>姓名:</label>
              <p>{user.name}</p>
            </div>
            <div className="info-group">
              <label>用户名:</label>
              <p>{user.username || '未设置 (建议设置用户名以便登录)'}</p>
            </div>
            <div className="info-group">
              <label>邮箱:</label>
              <p>{user.email}</p>
            </div>
            
            <div className="profile-actions">
              <button 
                onClick={() => setIsEditing(true)}
                className="edit-profile-button"
              >
                编辑资料
              </button>
              <button 
                onClick={() => navigate('/todos')}
                className="back-button"
              >
                返回任务
              </button>
              <button 
                onClick={() => {
                  localStorage.removeItem('isLoggedIn');
                  localStorage.removeItem('user');
                  navigate('/login');
                }}
                className="logout-button"
              >
                退出登录
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="edit-form">
            <div className="form-group">
              <label>姓名:</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                placeholder="输入你的姓名"
                required
              />
            </div>
            <div className="form-group">
              <label>用户名:</label>
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                placeholder="设置用户名 (用于登录)"
              />
              <small className="input-hint">设置后可用于登录，建议使用字母、数字的组合</small>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="save-profile-button">
                保存
              </button>
              <button 
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setError('');
                  setEditForm({
                    name: user.name,
                    username: user.username || ''
                  });
                }}
                className="cancel-profile-button"
              >
                取消
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Profile; 