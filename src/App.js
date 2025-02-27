import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Login from './Login';
import Register from './Register';
import './App.css';

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
    <div className="app-container">
      <div className="header">
        <div className="header-content">
          <h1>Todo List</h1>
          {localStorage.getItem('currentUser') === 'Vincent' && (
            <div className="tabs">
              <button 
                className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
                onClick={() => setActiveTab('tasks')}
              >
                Tasks
              </button>
              <button 
                className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
                Pending Approval
              </button>
            </div>
          )}
        </div>
        <div className="header-actions">
          <div className="profile-section">
            <div className="profile-info">
              <div className="profile-icon">
                {localStorage.getItem('currentUser').charAt(0).toUpperCase()}
              </div>
              <div className="profile-details">
                <span className="username">
                  {localStorage.getItem('currentUser')}
                  {localStorage.getItem('currentUser') === 'Vincent' && 
                    <span className="admin-badge">Admin</span>
                  }
                </span>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </div>

      {localStorage.getItem('currentUser') === 'Vincent' && activeTab === 'admin' ? (
        <AdminPanel />
      ) : (
        <>
          <div className="add-todo">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new task"
              onKeyPress={handleKeyPress}
            />
            <button onClick={() => addTodo(newTodo)}>Add</button>
          </div>

          <div className="task-count">
            <span>{todos.length} tasks</span>
            <span className="task-completed">
              {todos.filter(todo => todo.completed).length} completed
            </span>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="todos">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {todos.map((todo, index) => (
                    <Draggable
                      key={todo.id}
                      draggableId={todo.id.toString()}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="todo-item"
                        >
                          {/* ... rest of todo item content ... */}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </>
      )}
    </div>
  );
}

export default App;
