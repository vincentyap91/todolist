import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Modal, Form, Input, message, Switch } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, ReloadOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import API_BASE_URL from '../config/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching users with token:', token); // 添加调试日志

      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('获取用户列表失败');
      }

      const data = await response.json();
      console.log('Received users data:', data); // 添加调试日志
      setUsers(data);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 修改密码
  const handlePasswordChange = async (values) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oldPassword: values.oldPassword,
          newPassword: values.newPassword
        })
      });

      if (!response.ok) {
        throw new Error('修改密码失败');
      }

      message.success('密码修改成功');
      setIsPasswordModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('修改密码失败:', error);
      message.error('修改密码失败');
    }
  };

  // 处理用户状态更改
  const handleStatusChange = async (userId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus ? 'active' : 'pending' })
      });

      if (!response.ok) {
        throw new Error('更新状态失败');
      }

      message.success('用户状态更新成功');
      fetchUsers(); // 刷新用户列表
    } catch (error) {
      console.error('更新用户状态失败:', error);
      message.error('更新用户状态失败');
    }
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'gold' : 'blue'}>
          {role === 'admin' ? '超级管理员' : '普通用户'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'success' : 'warning'}>
          {status === 'active' ? '已批准' : '待审核'}
        </Tag>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {record.role !== 'admin' && (
            <Switch
              checkedChildren="已批准"
              unCheckedChildren="待审核"
              checked={record.status === 'active'}
              onChange={(checked) => handleStatusChange(record.id, checked)}
            />
          )}
          <Button 
            type="link" 
            onClick={() => handleEdit(record)}
            disabled={record.role === 'admin' && record.username !== 'admin'}
          >
            修改密码
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        backgroundColor: '#fff',
        padding: '16px 24px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0 }}>用户管理</h1>
        <div>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />}
            onClick={fetchUsers}
            style={{ marginRight: '8px' }}
          >
            刷新列表
          </Button>
          <Button 
            type="primary" 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/todos')}
          >
            返回任务页面
          </Button>
        </div>
      </div>

      <div style={{
        backgroundColor: '#fff',
        padding: '24px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Table 
          columns={columns} 
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </div>

      <Modal
        title="修改密码"
        open={isPasswordModalVisible}
        onCancel={() => {
          setIsPasswordModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        maskClosable={false}
      >
        <Form
          form={form}
          onFinish={handlePasswordChange}
          layout="vertical"
        >
          <Form.Item
            name="oldPassword"
            label="当前密码"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度至少6位' }
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
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
              确认修改
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement; 