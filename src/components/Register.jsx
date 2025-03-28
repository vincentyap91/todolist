import React from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';

const Register = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    try {
      console.log('发送注册请求:', values);
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });
      
      // 添加详细日志
      console.log('注册响应状态码:', response.status);
      
      // 先获取响应文本
      const responseText = await response.text();
      console.log('注册响应文本:', responseText);
      
      // 尝试解析JSON (仅当返回内容看起来像JSON时)
      let data;
      if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('解析响应JSON失败:', e);
          throw new Error('服务器返回了无效的JSON格式');
        }
      } else {
        // 如果不是JSON格式，可能是HTML错误页面
        if (response.status === 404) {
          throw new Error('注册接口不存在，请检查服务器配置');
        } else {
          throw new Error(`服务器返回了非JSON响应 (状态码: ${response.status})`);
        }
      }
      
      if (!response.ok) {
        throw new Error(data?.message || '注册失败');
      }
      
      message.success('注册成功！请登录');
      navigate('/login');
    } catch (error) {
      console.error('注册出错:', error);
      message.error(`注册失败: ${error.message}`);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#f0f2f5'
    }}>
      <Card 
        title="用户注册" 
        style={{ 
          width: 400,
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}
      >
        <Form
          form={form}
          name="register"
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              注册
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            已有账号？ 
            <Button type="link" onClick={() => navigate('/login')}>
              立即登录
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register; 