import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import '../styles/Login.css';
import API_BASE_URL from '../config/api';

const { Title } = Typography;

function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    try {
      console.log('尝试登录:', values);
      console.log('API URL:', `${API_BASE_URL}/api/auth/login`);

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values),
      });

      // 检查响应状态
      if (response.status === 429) {
        message.error('请求太频繁，请稍后再试');
        return;
      }

      console.log('服务器响应状态:', response.status);
      const data = await response.json();
      console.log('登录响应:', data);

      if (response.ok) {
        // 确保正确存储 token 和用户信息
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        message.success('登录成功');
        
        // 所有用户都先导航到任务页面
        navigate('/todos');
      } else {
        message.error(data.message || '登录失败');
      }
    } catch (error) {
      console.error('登录失败:', error);
      message.error('登录失败，请重试');
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <Title level={2} className="login-title">登录</Title>
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="login-button"
              loading={loading}
              block
            >
              登录
            </Button>
          </Form.Item>

          <div className="register-link">
            还没有账号？ <Link to="/register">注册新账户</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default Login; 