const API_BASE_URL = 'http://localhost:5000/api';

export const login = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '登录失败');
  }

  return response.json();
};

export const checkAuth = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('未登录');
  }

  const response = await fetch(`${API_BASE_URL}/admin/check`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('验证失败');
  }

  return response.json();
}; 