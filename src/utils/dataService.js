const API_URL = 'http://localhost:5000/api';

// 登录
export const loginUser = async (username, password) => {
  try {
    console.log('Attempting login with:', { username }); // 调试日志

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    });
    
    console.log('Login response status:', response.status); // 调试日志
    
    const data = await response.json();
    console.log('Login response data:', data); // 调试日志
    
    if (!response.ok) {
      throw new Error(data.message || '登录失败');
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// 获取用户信息
export const getUser = async (token) => {
  try {
    const response = await fetch(`${API_URL}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('获取用户信息失败');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

// 获取所有用户（管理员功能）
export const loadUsers = async (token) => {
  try {
    const response = await fetch(`${API_URL}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return await response.json();
  } catch (error) {
    console.error('Error loading users:', error);
    throw error;
  }
};

export const updateUser = async (email, userData) => {
  try {
    console.log('Updating user:', email, 'with data:', userData); // 调试日志
    const response = await fetch(`${API_URL}/users/${email}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      console.error('Update response not ok:', response.status); // 调试日志
      return null;
    }
    
    const updatedUser = await response.json();
    console.log('User updated:', updatedUser); // 调试日志
    return updatedUser;
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
};

export const addPendingUser = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/users/pending`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    return await response.json();
  } catch (error) {
    console.error('Error adding pending user:', error);
    throw error;
  }
};

export const approveUser = async (email) => {
  try {
    const response = await fetch(`${API_URL}/users/approve/${email}`, {
      method: 'POST',
    });
    return response.ok;
  } catch (error) {
    console.error('Error approving user:', error);
    return false;
  }
};

// 获取待办事项
export const getTodos = async (token) => {
  try {
    const response = await fetch(`${API_URL}/todos`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('获取待办事项失败');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting todos:', error);
    return [];
  }
};

// 添加待办事项
export const addTodo = async (token, text) => {
  try {
    const response = await fetch(`${API_URL}/todos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ text })
    });
    if (!response.ok) throw new Error('Failed to add todo');
    return await response.json();
  } catch (error) {
    console.error('Error adding todo:', error);
    return null;
  }
};

// 更新待办事项
export const updateTodo = async (token, todoId, updates) => {
  try {
    const response = await fetch(`${API_URL}/todos/${todoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update todo');
    return await response.json();
  } catch (error) {
    console.error('Error updating todo:', error);
    return null;
  }
};

// 删除待办事项
export const deleteTodo = async (token, todoId) => {
  try {
    const response = await fetch(`${API_URL}/todos/${todoId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to delete todo');
    return true;
  } catch (error) {
    console.error('Error deleting todo:', error);
    return false;
  }
};

// 注册新用户
export const registerUser = async (username, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '注册失败');
    }
    
    return data;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
}; 