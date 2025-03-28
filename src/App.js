import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Login from './components/Login';
import Register from './components/Register';
import './App.css';
import { App as AntApp } from 'antd';
import TodoList from './components/TodoList';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserManagement from './components/UserManagement';
import Users from './pages/admin/Users';
import PrivateRoute from './components/PrivateRoute';
import AdminUsers from './components/AdminUsers';

// 受保护的路由组件
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });

  const [todos, setTodos] = useState(() => {
    const savedTodos = localStorage.getItem('todos');
    return savedTodos ? JSON.parse(savedTodos) : [];
  });

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const [newTodo, setNewTodo] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 10;

  // 计算当前页的任务
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = todos.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(todos.length / tasksPerPage);

  const [showRegister, setShowRegister] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const pendingUsers = JSON.parse(localStorage.getItem('pendingUsers') || '[]');

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const saveEdit = (id) => {
    if (editValue.trim()) {
      setTodos(todos.map(todo =>
        todo.id === id ? { ...todo, text: editValue } : todo
      ));
      setEditingId(null);
      setEditValue('');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(todos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setTodos(items);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
  };

  const addTodo = (text) => {
    if (text.trim()) {
      const newTodo = {
        id: Date.now(),
        text: text,
        completed: false
      };
      setTodos([...todos, newTodo]);
      setNewTodo('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTodo(newTodo);
    }
  };

  // 分页处理函数
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // 添加管理员审核功能
  const handleApproveUser = (user) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const pendingUsers = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
    
    // 添加到已批准用户列表
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
    
    // 从待审核列表中移除
    const updatedPending = pendingUsers.filter(u => u.username !== user.username);
    localStorage.setItem('pendingUsers', JSON.stringify(updatedPending));

    // 添加成功通知
    alert(`User ${user.username} has been approved successfully!`);
  };

  const handleRejectUser = (username) => {
    const pendingUsers = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
    const updatedPending = pendingUsers.filter(u => u.username !== username);
    localStorage.setItem('pendingUsers', JSON.stringify(updatedPending));

    // 添加拒绝通知
    alert(`User ${username} has been rejected.`);
  };

  // 修改管理员面板组件
  const AdminPanel = () => {
    const pendingUsers = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
    const currentUser = localStorage.getItem('currentUser');
    const isSuperAdmin = currentUser === 'Vincent';
    
    return (
      <div className="admin-panel">
        <h3>
          {isSuperAdmin ? (
            <>Pending Approvals ({pendingUsers.length})</>
          ) : (
            'Pending Approvals'
          )}
        </h3>
        {pendingUsers.length === 0 ? (
          <div className="no-pending">No pending registrations</div>
        ) : (
          pendingUsers.map(user => (
            <div key={user.username} className="pending-user">
              <div className="user-info">
                <strong>{user.username}</strong>
                {isSuperAdmin && (
                  <>
                    <div className="user-email">{user.email}</div>
                    <small>Requested: {new Date(user.requestDate).toLocaleDateString()}</small>
                  </>
                )}
              </div>
              {isSuperAdmin && (
                <div className="approval-buttons">
                  <button 
                    onClick={() => {
                      if (window.confirm(`Approve user ${user.username}?`)) {
                        handleApproveUser(user);
                      }
                    }} 
                    className="approve-btn"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm(`Reject user ${user.username}?`)) {
                        handleRejectUser(user.username);
                      }
                    }} 
                    className="reject-btn"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    );
  };

  if (!isLoggedIn) {
    if (showRegister) {
      return <Register onBack={() => setShowRegister(false)} />;
    }
    return (
      <Login 
        onLogin={setIsLoggedIn} 
        onRegister={() => setShowRegister(true)}
      />
    );
  }

  return (
    <AntApp>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/todos" 
            element={
              <PrivateRoute>
                <TodoList />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <PrivateRoute adminOnly>
                <AdminUsers />
              </PrivateRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/todos" />} />
        </Routes>
      </Router>
    </AntApp>
  );
}

export default App;
