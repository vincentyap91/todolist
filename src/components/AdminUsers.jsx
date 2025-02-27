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
  Switch
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import '../styles/AdminUsers.css';

const { Header, Content } = Layout;

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    checkAdminAccess();
    fetchUsers();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/check', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('无权限访问');
      }
    } catch (error) {
      messageApi.error('您没有权限访问此页面');
      navigate('/');
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('获取用户列表失败');
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      messageApi.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setCurrentUser(user);
    form.setFieldsValue({
      password: '',
      isApproved: user.isApproved
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${currentUser.username}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        throw new Error('更新用户信息失败');
      }

      messageApi.success('更新成功');
      setIsModalVisible(false);
      fetchUsers();
    } catch (error) {
      messageApi.error(error.message);
    }
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'SUPER_ADMIN' ? 'gold' : 'blue'}>
          {role === 'SUPER_ADMIN' ? '超级管理员' : '普通用户'}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'isApproved',
      key: 'isApproved',
      render: (isApproved, record) => (
        <Space>
          <Tag color={isApproved ? 'success' : 'warning'}>
            {isApproved ? '已批准' : '待审核'}
          </Tag>
          <Tag color={record.isOnline ? 'green' : 'default'}>
            {record.isOnline ? '在线' : '离线'}
          </Tag>
        </Space>
      )
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.role !== 'SUPER_ADMIN' && (
            <>
              <Button 
                type="primary"
                onClick={() => handleEditUser(record)}
              >
                编辑
              </Button>
              <Switch
                checked={record.isApproved}
                onChange={(checked) => handleApproveUser(record.username, checked)}
                checkedChildren="已批准"
                unCheckedChildren="待审核"
                disabled={record.role === 'SUPER_ADMIN'}
              />
            </>
          )}
        </Space>
      ),
    },
  ];

  const handleApproveUser = async (username, isApproved) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${username}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isApproved })
      });

      if (!response.ok) {
        throw new Error('更新用户状态失败');
      }

      messageApi.success('更新成功');
      fetchUsers();
    } catch (error) {
      messageApi.error(error.message);
    }
  };

  return (
    <Layout className="layout">
      {contextHolder}
      <Header className="header">
        <div className="header-content">
          <h2 style={{ color: 'white', margin: 0 }}>用户管理</h2>
          <Button type="primary" onClick={() => navigate('/')}>
            返回主页
          </Button>
        </div>
      </Header>

      <Content className="content">
        <Card className="user-card">
          <Table
            columns={columns}
            dataSource={users}
            rowKey="username"
            loading={loading}
          />
        </Card>

        <Modal
          title="编辑用户"
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={() => setIsModalVisible(false)}
          okText="确定"
          cancelText="取消"
        >
          <Form
            form={form}
            layout="vertical"
          >
            <Form.Item
              name="password"
              label="新密码"
              rules={[
                { required: false },
                { min: 6, message: '密码长度至少为6位' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="留空表示不修改密码"
              />
            </Form.Item>

            <Form.Item
              name="isApproved"
              label="批准状态"
              valuePropName="checked"
            >
              <Switch
                checkedChildren={<CheckCircleOutlined />}
                unCheckedChildren={<CloseCircleOutlined />}
              />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
}

export default AdminUsers; 