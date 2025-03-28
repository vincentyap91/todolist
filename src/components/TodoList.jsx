import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, Input, Button, Checkbox, Spin, message, Card, Typography, Space, Modal, Form, Avatar, Tooltip, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, UserOutlined, LogoutOutlined, MenuOutlined, CheckCircleOutlined, ClockCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import API_BASE_URL from '../config/api';

const { Text, Title } = Typography;
const { Search } = Input;

const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTodo, setNewTodo] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentTodo, setCurrentTodo] = useState(null);
  const [editText, setEditText] = useState('');
  const [user, setUser] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [displayTodos, setDisplayTodos] = useState([]);
  const dragNode = useRef(null);
  const navigate = useNavigate();
  const [addingTodo, setAddingTodo] = useState(false);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    // 获取当前用户信息
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userInfo);
    console.log('当前用户信息:', userInfo);
    
    console.log('组件加载，获取任务...');
    fetchTodos();
  }, []);
  
  // 当 todos 变化时，更新 displayTodos
  useEffect(() => {
    setDisplayTodos([...todos]);
  }, [todos]);
  
  const fetchTodos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/todos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('获取任务失败');
      }
      
      // 记录原始响应
      const responseText = await response.text();
      console.log('任务列表响应文本:', responseText);
      
      // 解析 JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('解析任务列表 JSON 失败:', e);
        throw new Error('服务器返回了无效的 JSON 响应');
      }
      
      console.log('获取的任务数据:', data);
      
      // 确保按照 order 字段排序
      if (Array.isArray(data)) {
        const sortedTodos = [...data].sort((a, b) => a.order - b.order);
        console.log('排序后的任务:', sortedTodos.map(t => ({ id: t.id, text: t.text.substring(0, 15), order: t.order })));
        
        setTodos(sortedTodos);
        setDisplayTodos(sortedTodos);
      } else {
        throw new Error('服务器返回了无效的任务列表');
      }
    } catch (error) {
      console.error('获取任务失败:', error);
      setError(`获取任务失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理拖拽开始
  const handleDragStart = (e, index) => {
    console.log('拖拽开始:', index);
    setDraggedItem(index);
    
    // 添加拖拽数据以兼容某些浏览器
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index);
    }
  };
  
  // 处理拖拽结束
  const handleDragEnd = async (e) => {
    console.log('拖拽结束，从位置', draggedItem, '到位置', dragOverItem);
    
    // 如果没有开始拖拽或没有目标位置，则不执行任何操作
    if (draggedItem === null || dragOverItem === null) {
      console.log('拖拽无效 - 缺少起始或目标位置');
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }
    
    // 如果拖拽到相同位置，不执行任何操作
    if (draggedItem === dragOverItem) {
      console.log('拖拽到相同位置 - 不做任何更改');
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }
    
    console.log(`准备重新排序: 从位置 ${draggedItem} 到位置 ${dragOverItem}`);
    
    // 创建一个新的任务数组副本
    const newTodos = [...todos];
    // 获取拖拽的任务
    const draggedTask = newTodos[draggedItem];
    // 从原位置删除
    newTodos.splice(draggedItem, 1);
    // 插入到新位置
    newTodos.splice(dragOverItem, 0, draggedTask);
    
    // 更新每个任务的顺序值
    const reorderedTodos = newTodos.map((todo, idx) => ({
      ...todo,
      order: idx  // 更新顺序字段
    }));
    
    // 立即更新本地状态以反映新顺序
    setTodos(reorderedTodos);
    setDisplayTodos(reorderedTodos);
    
    // 显示保存提示
    message.loading({ content: '正在保存任务顺序...', key: 'reorderSaving' });
    
    try {
      // 获取排序后的任务 ID 数组
      const todoIds = reorderedTodos.map(todo => todo.id);
      console.log('发送重排序请求，任务 ID 顺序:', todoIds);
      
      // 发送请求到后端保存新顺序
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/todos/reorder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ todoIds })
      });
      
      console.log('重排序请求状态码:', response.status);
      
      // 先获取响应文本以便调试
      const responseText = await response.text();
      console.log('重排序响应文本:', responseText);
      
      if (!response.ok) {
        throw new Error(`保存失败: ${responseText}`);
      }
      
      // 尝试解析响应为 JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('解析响应 JSON 失败:', e);
        throw new Error('服务器返回了无效的 JSON 响应');
      }
      
      // 如果服务器返回了更新后的任务列表，则使用它来更新状态
      if (Array.isArray(data)) {
        console.log('使用服务器返回的数据更新本地状态');
        const sortedTodos = [...data].sort((a, b) => a.order - b.order);
        setTodos(sortedTodos);
        setDisplayTodos(sortedTodos);
      }
      
      // 显示成功消息
      message.success({ content: '任务顺序已保存', key: 'reorderSaving' });
    } catch (error) {
      console.error('保存任务顺序失败:', error);
      message.error({ content: `保存失败: ${error.message}`, key: 'reorderSaving' });
      
      // 如果保存失败，重新获取任务列表
      fetchTodos();
    } finally {
      // 重置拖拽状态
      setDraggedItem(null);
      setDragOverItem(null);
    }
  };
  
  // 处理拖拽悬停
  const handleDragOver = (e, index) => {
    e.preventDefault();
    
    if (draggedItem !== index) {
      console.log('拖拽悬停在位置:', index);
      setDragOverItem(index);
    }
  };
  
  // 处理放置
  const handleDrop = (e, index) => {
    e.preventDefault();
    console.log('拖拽放下在位置:', index);
    // 实际保存操作在 handleDragEnd 中执行
  };
  
  const handleAddTodo = async () => {
    if (newTodo.trim() === '') {
      message.warning('任务内容不能为空');
      return;
    }
    
    try {
      setAddingTodo(true);
      const token = localStorage.getItem('token');
      
      // 计算新任务的顺序 - 应该是当前任务列表的长度
      const newOrder = todos.length;
      console.log('添加新任务，顺序:', newOrder);
      
      const response = await fetch(`${API_BASE_URL}/api/todos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          text: newTodo,
          order: newOrder // 明确设置顺序
        })
      });
      
      if (!response.ok) {
        throw new Error('添加任务失败');
      }
      
      const newTodoData = await response.json();
      console.log('添加的新任务:', newTodoData);
      
      // 将新任务添加到列表末尾
      const updatedTodos = [...todos, newTodoData];
      
      // 确保按照 order 字段排序
      const sortedTodos = updatedTodos.sort((a, b) => a.order - b.order);
      
      setTodos(sortedTodos);
      setDisplayTodos(sortedTodos);
      setNewTodo('');
      message.success('任务添加成功');
    } catch (error) {
      console.error('添加任务失败:', error);
      message.error(`添加任务失败: ${error.message}`);
    } finally {
      setAddingTodo(false);
    }
  };
  
  const handleToggleComplete = async (id, completed) => {
    try {
      const token = localStorage.getItem('token');
      console.log('切换任务状态:', id, '当前状态:', completed);
      
      const response = await fetch(`${API_BASE_URL}/api/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ completed: !completed })
      });
      
      console.log('切换任务状态响应:', response.status);
      
      if (!response.ok) {
        throw new Error('更新任务状态失败');
      }
      
      const data = await response.json();
      console.log('更新后的任务:', data);
      
      setTodos(todos.map(todo => todo.id === id ? data : todo));
    } catch (error) {
      console.error('更新任务状态失败:', error);
      message.error('更新任务状态失败');
    }
  };
  
  // 打开编辑模态框
  const showEditModal = (todo) => {
    console.log('打开编辑模态框:', todo);
    console.log('任务ID类型:', typeof todo.id, '值:', todo.id);
    
    setCurrentTodo({
      id: todo.id,
      text: todo.text || '',
      completed: todo.completed
    });
    setEditText(todo.text || '');
    setEditModalVisible(true);
  };
  
  // 处理保存编辑
  const handleSaveEdit = async () => {
    if (!currentTodo) {
      console.error('当前任务为空');
      return;
    }
    
    const todoId = currentTodo.id;
    console.log('保存编辑任务ID:', todoId, '类型:', typeof todoId, '新内容:', editText);
    
    if (!editText.trim()) {
      message.warning('任务内容不能为空');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/todos/${todoId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          text: editText.trim(),
          // 保留当前任务的顺序
          order: currentTodo.order
        })
      });
      
      console.log('编辑任务响应状态:', response.status);
      
      if (!response.ok) {
        let errorText = await response.text();
        console.error('编辑任务错误响应:', errorText);
        throw new Error('更新任务失败');
      }
      
      const data = await response.json();
      console.log('更新后的任务数据:', data);
      
      // 更新本地任务列表，保留所有任务的顺序
      const updatedTodos = todos.map(todo => 
        todo.id === todoId ? { ...data, order: todo.order } : todo
      );
      
      // 确保按照 order 字段排序
      const sortedTodos = [...updatedTodos].sort((a, b) => a.order - b.order);
      
      setTodos(sortedTodos);
      setDisplayTodos(sortedTodos);
      setEditModalVisible(false);
      message.success('任务更新成功');
    } catch (error) {
      console.error('更新任务失败:', error);
      message.error('更新任务失败');
    }
  };
  
  // 处理取消编辑
  const handleCancelEdit = () => {
    console.log('取消编辑');
    setEditModalVisible(false);
  };
  
  const handleDeleteTodo = async (id) => {
    try {
      const token = localStorage.getItem('token');
      console.log('删除任务:', id);
      
      const response = await fetch(`${API_BASE_URL}/api/todos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('删除任务响应状态:', response.status);
      
      if (!response.ok) {
        throw new Error('删除任务失败');
      }
      
      setTodos(todos.filter(todo => todo.id !== id));
      message.success('任务删除成功');
    } catch (error) {
      console.error('删除任务失败:', error);
      message.error('删除任务失败');
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('退出登录成功');
    navigate('/login');
  };
  
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>加载中...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Text type="danger">{error}</Text>
        <div style={{ marginTop: '20px' }}>
          <Button type="primary" onClick={fetchTodos}>重试</Button>
        </div>
      </div>
    );
  }
  
  // 获取任务项的样式
  const getTodoItemStyle = (index) => {
    // 基础样式 - 使用单独的内边距值而不是简写
    const baseStyle = {
      paddingTop: '10px',
      paddingRight: '10px',
      paddingBottom: '10px',
      paddingLeft: '10px',
      marginTop: '5px',
      marginBottom: '5px',
      backgroundColor: 'white',
      cursor: 'move',
      transition: 'all 0.3s',
      borderRadius: '4px'
    };

    // 当前被拖拽的项目
    if (draggedItem === index) {
      return {
        ...baseStyle,
        opacity: 0.5,
        transform: 'scale(0.98)',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
        borderRadius: '4px',
        borderWidth: '2px',
        borderStyle: 'dashed',
        borderColor: '#1890ff'
      };
    }

    // 拖拽悬停目标
    if (dragOverItem === index) {
      const isDraggedBelow = draggedItem < dragOverItem;
      
      return {
        ...baseStyle,
        // 使用单独的属性而不是简写
        borderTopWidth: isDraggedBelow ? '0px' : '4px',
        borderRightWidth: '0px',
        borderBottomWidth: isDraggedBelow ? '4px' : '0px',
        borderLeftWidth: '0px',
        borderStyle: 'solid',
        borderColor: '#1890ff',
        // 根据边框变化调整内边距
        paddingTop: isDraggedBelow ? '10px' : '6px',
        paddingBottom: isDraggedBelow ? '6px' : '10px',
        backgroundColor: '#f0f8ff'
      };
    }

    return baseStyle;
  };
  
  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      backgroundColor: '#f5f7fa',
      minHeight: '100vh'
    }}>
      {/* 顶部导航栏 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        padding: '15px 20px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            style={{ backgroundColor: '#1890ff', marginRight: '10px' }} 
            icon={<CheckCircleOutlined />} 
          />
          <Title level={3} style={{ margin: 0 }}>我的待办事项</Title>
        </div>
        <Space>
          {user && user.role === 'admin' && (
            <Button 
              type="primary" 
              icon={<UserOutlined />} 
              onClick={() => navigate('/admin/users')}
              style={{ borderRadius: '4px' }}
            >
              用户管理
            </Button>
          )}
          <Button 
            type="primary" 
            danger
            icon={<LogoutOutlined />} 
            onClick={handleLogout}
            style={{ borderRadius: '4px' }}
          >
            退出登录
          </Button>
        </Space>
      </div>
      
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ClockCircleOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            <span>待办事项列表</span>
            {draggedItem !== null && (
              <Text type="secondary" style={{ marginLeft: '10px', fontSize: '14px' }}>
                正在移动任务...
              </Text>
            )}
          </div>
        } 
        style={{ 
          marginBottom: '20px', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
        bodyStyle={{ padding: '20px' }}
      >
        <div style={{ display: 'flex', marginBottom: '20px' }}>
          <Search
            placeholder="添加新任务..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onSearch={() => {
              if (newTodo.trim()) {
                handleAddTodo();
              } else {
                message.warning('任务内容不能为空');
              }
            }}
            enterButton={
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                disabled={!newTodo.trim()}
              >
                添加
              </Button>
            }
            style={{ width: '100%' }}
          />
        </div>
        
        <div style={{ 
          backgroundColor: displayTodos.length > 0 ? '#f9f9f9' : 'transparent',
          borderRadius: '4px',
          padding: displayTodos.length > 0 ? '10px' : '0',
          position: 'relative'
        }}>
          {/* 拖拽指示器 */}
          {draggedItem !== null && (
            <div style={{
              position: 'fixed',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#1890ff',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              zIndex: 10000,
              pointerEvents: 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <MenuOutlined style={{ marginRight: '8px' }} />
                正在移动: {displayTodos[draggedItem]?.text || '任务'}
              </div>
            </div>
          )}
          
          {saving && (
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#fff7e6', 
              borderRadius: '4px', 
              marginBottom: '10px',
              textAlign: 'center'
            }}>
              正在保存任务顺序...
            </div>
          )}
          
          {displayTodos.map((todo, index) => (
            <div
              key={todo.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              style={getTodoItemStyle(index)}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div style={{ 
                    cursor: 'grab', 
                    marginRight: '12px',
                    padding: '5px',
                    borderRadius: '4px',
                    backgroundColor: draggedItem === index ? '#e6f7ff' : 'transparent'
                  }}>
                    <MenuOutlined style={{ 
                      color: draggedItem === index ? '#1890ff' : '#bbb',
                    }} />
                  </div>
                  <Checkbox
                    checked={todo.completed}
                    onChange={() => handleToggleComplete(todo.id, todo.completed)}
                    style={{ marginRight: '12px' }}
                  />
                  <span style={{ 
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    color: todo.completed ? '#999' : 'inherit',
                    flex: 1,
                    fontSize: '16px'
                  }}>
                    {todo.text || <Text type="secondary">(无内容)</Text>}
                  </span>
                </div>
                <Space>
                  <Tooltip title="编辑">
                    <Button 
                      icon={<EditOutlined />} 
                      size="small"
                      type="text"
                      onClick={() => showEditModal(todo)}
                    />
                  </Tooltip>
                  <Tooltip title="删除">
                    <Button 
                      icon={<DeleteOutlined />} 
                      size="small" 
                      type="text"
                      danger
                      onClick={() => handleDeleteTodo(todo.id)}
                    />
                  </Tooltip>
                </Space>
              </div>
              
              {/* 拖拽位置指示器 */}
              {draggedItem !== null && draggedItem !== index && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: draggedItem > index ? 0 : 'auto',
                  bottom: draggedItem < index ? 0 : 'auto',
                  height: '3px',
                  backgroundColor: dragOverItem === index ? '#1890ff' : 'transparent',
                  transition: 'all 0.2s'
                }} />
              )}
            </div>
          ))}
          
          {displayTodos.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 0', 
              color: '#999',
              backgroundColor: '#f9f9f9',
              borderRadius: '6px'
            }}>
              <ClockCircleOutlined style={{ fontSize: '32px', marginBottom: '10px' }} />
              <p>暂无任务，请添加新任务</p>
            </div>
          )}
        </div>
      </Card>
      
      {/* 编辑任务模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <EditOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            <span>编辑任务</span>
          </div>
        }
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={handleCancelEdit}
        okText="保存"
        cancelText="取消"
        destroyOnClose={true}
        centered
      >
        {currentTodo && (
          <Form layout="vertical">
            <Form.Item
              label="任务内容"
              rules={[{ required: true, message: '请输入任务内容' }]}
            >
              <Input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="请输入任务内容"
                autoFocus
                style={{ padding: '10px' }}
              />
            </Form.Item>
          </Form>
        )}
      </Modal>
      
      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAddTodo} 
          loading={addingTodo}
        >
          添加任务
        </Button>
        <Button 
          type="default" 
          icon={<ReloadOutlined />} 
          onClick={() => {
            console.log('手动刷新任务...');
            fetchTodos();
          }} 
          loading={loading}
        >
          刷新任务
        </Button>
      </div>
    </div>
  );
};

export default TodoList; 