import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import TodoList from './components/TodoList';
import AdminUsers from './components/AdminUsers';
import PrivateRoute from './components/PrivateRoute';
import './App.css';
import config from './config';
import { App as AntApp } from 'antd';

function App() {
  return (
    <AntApp>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/todos" element={<TodoList />} />
          <Route path="/admin/users" element={<AdminUsers />} />
        </Routes>
      </Router>
    </AntApp>
  );
}

export default App; 