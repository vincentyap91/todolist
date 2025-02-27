import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ApprovedUsers.css';

function ApprovedUsers() {
  const [approvedUsers, setApprovedUsers] = useState([]);
  const navigate = useNavigate();
  const currentUser = localStorage.getItem('user');

  // 检查是否是超级管理员
  useEffect(() => {
    if (currentUser !== 'vincent') {
      navigate('/todos');
    }
    loadApprovedUsers();
  }, []);

  const loadApprovedUsers = () => {
    const users = JSON.parse(localStorage.getItem('approvedUsers')) || [];
    setApprovedUsers(users);
  };

  const handleDelete = (user) => {
    const updatedUsers = approvedUsers.filter(u => u.email !== user.email);
    setApprovedUsers(updatedUsers);
    localStorage.setItem('approvedUsers', JSON.stringify(updatedUsers));
  };

  return (
    <div className="approved-users-container">
      <div className="approved-users-content">
        <div className="approved-users-header">
          <h1>Approved Users</h1>
          <div className="header-controls">
            <div className="admin-profile">
              <div className="admin-icon">A</div>
              <span className="admin-name">Admin</span>
            </div>
            <div className="nav-buttons">
              <button onClick={() => navigate('/approve')} className="nav-button">
                Pending Approvals
              </button>
              <button onClick={() => navigate('/todos')} className="nav-button">
                Back to Tasks
              </button>
            </div>
          </div>
        </div>

        <div className="users-list">
          {approvedUsers.length === 0 ? (
            <div className="empty-state">
              No approved users yet.
            </div>
          ) : (
            <div className="users-grid">
              {approvedUsers.map((user, index) => (
                <div key={index} className="user-card">
                  <div className="user-card-header">
                    <div className="user-icon">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <button
                      onClick={() => handleDelete(user)}
                      className="delete-button"
                      title="Delete User"
                    >
                      ×
                    </button>
                  </div>
                  <div className="user-info">
                    <h3>{user.name}</h3>
                    <p>{user.email}</p>
                    <span className="approved-badge">Approved</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ApprovedUsers; 