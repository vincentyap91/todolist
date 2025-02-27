import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ApprovalPage.css';

function ApprovalPage() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [showPassword, setShowPassword] = useState({});
  const navigate = useNavigate();
  const currentUser = localStorage.getItem('user');

  // 检查是否是超级管理员
  useEffect(() => {
    if (currentUser !== 'vincent') {
      navigate('/todos');
    }
    loadPendingUsers();
  }, []);

  // 加载待审批用户
  const loadPendingUsers = () => {
    const users = JSON.parse(localStorage.getItem('pendingUsers')) || [];
    setPendingUsers(users);
    // 初始化所有用户的密码显示状态为 false
    const initialShowPassword = {};
    users.forEach(user => {
      initialShowPassword[user.email] = false;
    });
    setShowPassword(initialShowPassword);
  };

  const togglePasswordVisibility = (email) => {
    setShowPassword(prev => ({
      ...prev,
      [email]: !prev[email]
    }));
  };

  const handleApprove = (user) => {
    // 将用户添加到已批准用户列表
    const approvedUsers = JSON.parse(localStorage.getItem('approvedUsers')) || [];
    approvedUsers.push(user);
    localStorage.setItem('approvedUsers', JSON.stringify(approvedUsers));

    // 从待审批列表中移除
    const updatedPending = pendingUsers.filter(u => u.email !== user.email);
    setPendingUsers(updatedPending);
    localStorage.setItem('pendingUsers', JSON.stringify(updatedPending));
  };

  const handleReject = (user) => {
    // 从待审批列表中移除
    const updatedPending = pendingUsers.filter(u => u.email !== user.email);
    setPendingUsers(updatedPending);
    localStorage.setItem('pendingUsers', JSON.stringify(updatedPending));
  };

  return (
    <div className="approval-container">
      <div className="approval-content">
        <div className="approval-header">
          <h1>User Approval Dashboard</h1>
          <div className="header-controls">
            <div className="admin-profile">
              <div className="admin-icon">A</div>
              <span className="admin-name">Admin</span>
            </div>
            <button onClick={() => navigate('/todos')} className="back-button">
              Back to Tasks
            </button>
          </div>
        </div>

        <div className="pending-users">
          {pendingUsers.length === 0 ? (
            <div className="empty-state">
              No pending approvals at the moment.
            </div>
          ) : (
            pendingUsers.map((user, index) => (
              <div key={index} className="user-card">
                <div className="user-info">
                  <div className="user-icon">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-details">
                    <h3>{user.name}</h3>
                    <p>{user.email}</p>
                    <div className="password-field">
                      <span>Password: </span>
                      <div className="password-container">
                        <input
                          type={showPassword[user.email] ? "text" : "password"}
                          value={user.password}
                          readOnly
                          className="password-input"
                        />
                        <button
                          onClick={() => togglePasswordVisibility(user.email)}
                          className="toggle-password"
                          title={showPassword[user.email] ? "Hide password" : "Show password"}
                        >
                          {showPassword[user.email] ? "👁️" : "👁️‍🗨️"}
                        </button>
                      </div>
                    </div>
                    <p className="register-date">
                      Registered: {new Date(user.registeredAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="action-buttons">
                  <button
                    onClick={() => handleApprove(user)}
                    className="approve-button"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(user)}
                    className="reject-button"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ApprovalPage; 