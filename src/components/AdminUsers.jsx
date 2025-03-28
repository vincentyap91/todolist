import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layout, 
  Card, 
  Table, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  message, 
  Tag,
  Switch,
  Select
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  EditOutlined
} from '@ant-design/icons';
import '../styles/AdminUsers.css';
import API_BASE_URL from '../config/api';

const { Header, Content } = Layout;
const { Option } = Select;

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    console.log('当前用户信息:', user); // 调试日志

    if (!user || user.role !== 'admin') {
      message.error('没有权限访问此页面');
      navigate('/todos');
      return;
    }

    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('使用的token:', token); // 调试日志

      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('API响应:', data); // 调试日志

      if (!response.ok) {
        throw new Error(data.message || '获取用户列表失败');
      }

      setUsers(data);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (user, checked) => {
    try {
      const newStatus = checked ? 'active' : 'pending';
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('更新用户状态失败');
      }

      message.success(`用户 ${user.username} 状态已更新为 ${checked ? '已激活' : '待审核'}`);
      
      // 更新本地用户列表
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, status: newStatus } : u
      ));
    } catch (error) {
      console.error('更新用户状态失败:', error);
      message.error('更新用户状态失败');
    }
  };

  const showEditModal = (user) => {
    setCurrentUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email || '',
      role: user.role,
      status: user.status
    });
    setEditModalVisible(true);
  };

  const showPasswordModal = (user) => {
    setCurrentUser(user);
    passwordForm.resetFields();
    setPasswordModalVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        throw new Error('更新用户信息失败');
      }

      message.success(`用户 ${currentUser.username} 信息已更新`);
      setEditModalVisible(false);
      fetchUsers(); // 重新获取用户列表
    } catch (error) {
      console.error('更新用户信息失败:', error);
      message.error('更新用户信息失败');
    }
  };

  const handlePasswordSubmit = async () => {
    try {
      const values = await passwordForm.validateFields();
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/${currentUser.id}/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: values.password })
      });

      if (!response.ok) {
        throw new Error('修改密码失败');
      }

      message.success(`用户 ${currentUser.username} 密码已修改`);
      setPasswordModalVisible(false);
    } catch (error) {
      console.error('修改密码失败:', error);
      message.error('修改密码失败');
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
      render: (email) => email || '-'
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? '管理员' : '普通用户'}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Switch
          checkedChildren="已激活"
          unCheckedChildren="待审核"
          checked={status === 'active'}
          onChange={(checked) => handleStatusChange(record, checked)}
          disabled={record.role === 'admin'}
        />
      )
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt) => new Date(createdAt).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => showEditModal(record)}
            disabled={record.role === 'admin' && record.username !== 'admin'}
          >
            编辑
          </Button>
          <Button 
            icon={<LockOutlined />} 
            onClick={() => showPasswordModal(record)}
          >
            修改密码
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Layout className="layout">
      {contextHolder}
      <Header className="header">
        <div className="header-content">
          <h2 style={{ color: 'white', margin: 0 }}>用户管理</h2>
          <div>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={fetchUsers}
              style={{ marginRight: '8px' }}
              loading={loading}
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
      </Header>

      <Content className="content">
        <Card className="user-card">
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
        </Card>

        <Modal
          title="编辑用户信息"
          open={editModalVisible}
          onOk={handleEditSubmit}
          onCancel={() => setEditModalVisible(false)}
          okText="确定"
          cancelText="取消"
        >
          <Form
            form={form}
            layout="vertical"
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input disabled />
            </Form.Item>
            <Form.Item
              name="email"
              label="邮箱"
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="role"
              label="角色"
              rules={[{ required: true, message: '请选择角色' }]}
            >
              <Select>
                <Option value="user">普通用户</Option>
                <Option value="admin">管理员</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select>
                <Option value="pending">待审核</Option>
                <Option value="active">已激活</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={`修改 ${currentUser?.username || ''} 的密码`}
          open={passwordModalVisible}
          onOk={handlePasswordSubmit}
          onCancel={() => setPasswordModalVisible(false)}
          okText="确定"
          cancelText="取消"
        >
          <Form
            form={passwordForm}
            layout="vertical"
          >
            <Form.Item
              name="password"
              label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码长度不能少于6个字符' }
              ]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="确认密码"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认新密码' },
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
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default AdminUsers; 