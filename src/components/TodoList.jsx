import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Layout, 
  Card, 
  Input, 
  Button, 
  List, 
  Checkbox, 
  Typography, 
  Space, 
  Modal,
  message,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DragOutlined,
  UserOutlined,
  LogoutOutlined,
  LockOutlined
} from '@ant-design/icons';
import '../styles/TodoList.css';
import ChangePassword from './ChangePassword';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

function TodoList() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    checkUserRole();
    fetchTodos();
  }, []);

  const checkUserRole = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/user/role', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserRole(data.role);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const fetchTodos = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/todos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('获取待办事项失败');
      }

      const data = await response.json();
      setTodos(data);
    } catch (error) {
      console.error('Error fetching todos:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (value) => {
    if (!value.trim()) {
      messageApi.warning('请输入待办事项内容');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: value.trim() })
      });

      if (!response.ok) {
        throw new Error('添加待办事项失败');
      }

      const newTodoItem = await response.json();
      setTodos([...todos, newTodoItem]);
      setNewTodo('');
      messageApi.success('添加成功');
    } catch (error) {
      console.error('Error adding todo:', error);
      messageApi.error(error.message || '添加失败');
    }
  };

  const handleToggleTodo = async (id) => {
    try {
      const todo = todos.find(t => t.id === id);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completed: !todo.completed })
      });

      if (!response.ok) {
        throw new Error('更新待办事项失败');
      }

      const updatedTodo = await response.json();
      setTodos(todos.map(t => t.id === id ? updatedTodo : t));
      setError('');
    } catch (error) {
      console.error('Error updating todo:', error);
      setError(error.message);
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/todos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('删除待办事项失败');
      }

      setTodos(todos.filter(t => t.id !== id));
      setError('');
    } catch (error) {
      console.error('Error deleting todo:', error);
      setError(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      localStorage.removeItem('token');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  const handleDragEnd = useCallback(async (result) => {
    if (!result.destination || result.destination.index === result.source.index) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    try {
      setTodos(prevTodos => {
        const newTodos = Array.from(prevTodos);
        const [removed] = newTodos.splice(sourceIndex, 1);
        newTodos.splice(destinationIndex, 0, removed);
        return newTodos;
      });

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/todos/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          todoId: result.draggableId,
          sourceIndex: sourceIndex,
          destinationIndex: destinationIndex
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '更新顺序失败');
      }

      if (data.todos) {
        setTodos(data.todos);
      }

      message.success('排序更新成功');
    } catch (error) {
      console.error('Error reordering todos:', error);
      message.error(error.message || '保存排序失败');
      
      fetchTodos();
    }
  }, [fetchTodos]);

  const handleEdit = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/todos/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: editText.trim() })
      });

      if (!response.ok) {
        throw new Error('更新待办事项失败');
      }

      const updatedTodo = await response.json();
      setTodos(todos.map(t => t.id === editingId ? updatedTodo : t));
      setEditingId(null);
      setEditText('');
      setError('');
    } catch (error) {
      console.error('Error updating todo:', error);
      setError(error.message);
    }
  };

  const showDeleteConfirm = (todoId) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个待办事项吗？',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        handleDeleteTodo(todoId);
      },
    });
  };

  if (loading) {
    return <div className="todo-loading">加载中...</div>;
  }

  return (
    <Layout className="layout">
      {contextHolder}
      <Header className="header">
        <div className="header-content">
          <Title level={3} style={{ margin: 0, color: 'white' }}>
            我的待办事项
          </Title>
          <Space>
            {userRole === 'SUPER_ADMIN' && (
              <Tooltip title="用户管理">
                <Button 
                  type="primary" 
                  icon={<UserOutlined />}
                  onClick={() => navigate('/admin/users')}
                >
                  用户管理
                </Button>
              </Tooltip>
            )}
            <Tooltip title="修改密码">
              <Button 
                type="primary"
                icon={<LockOutlined />}
                onClick={() => setChangePasswordVisible(true)}
              >
                修改密码
              </Button>
            </Tooltip>
            <Tooltip title="退出登录">
              <Button 
                type="primary" 
                danger 
                icon={<LogoutOutlined />}
                onClick={handleLogout}
              >
                退出登录
              </Button>
            </Tooltip>
          </Space>
        </div>
      </Header>

      <Content className="content">
        <Card className="todo-card">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Search
              placeholder="添加新的待办事项..."
              enterButton={
                <Button type="primary" icon={<PlusOutlined />}>
                  添加
                </Button>
              }
              size="large"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onSearch={handleAddTodo}
            />

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="todos">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`todo-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                  >
                    {todos.map((todo, index) => (
                      <Draggable
                        key={todo.id}
                        draggableId={todo.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`todo-item-wrapper ${snapshot.isDragging ? 'dragging' : ''}`}
                          >
                            <List.Item
                              className={`todo-item ${todo.completed ? 'completed' : ''}`}
                            >
                              <div className="todo-item-content">
                                <div
                                  {...provided.dragHandleProps}
                                  className="drag-handle"
                                >
                                  <DragOutlined />
                                </div>
                                <Checkbox
                                  checked={todo.completed}
                                  onChange={() => handleToggleTodo(todo.id)}
                                />
                                {editingId === todo.id ? (
                                  <Input
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    onPressEnter={() => handleSaveEdit(todo.id)}
                                    onBlur={() => handleSaveEdit(todo.id)}
                                    autoFocus
                                  />
                                ) : (
                                  <span 
                                    className={`todo-text ${todo.completed ? 'completed' : ''}`}
                                    style={{ flex: 1 }}
                                  >
                                    {todo.text}
                                  </span>
                                )}
                                <Space>
                                  <Button
                                    type="text"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEdit(todo)}
                                    disabled={todo.completed}
                                  />
                                  <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => showDeleteConfirm(todo.id)}
                                  />
                                </Space>
                              </div>
                            </List.Item>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </Space>
        </Card>
      </Content>
      
      <ChangePassword 
        visible={changePasswordVisible}
        onCancel={() => setChangePasswordVisible(false)}
      />
    </Layout>
  );
}

export default TodoList; 