import React, { useState } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';

const ChangePassword = ({ visible, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/user/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message);
      }

      message.success('密码修改成功');
      form.resetFields();
      onCancel();
    } catch (error) {
      message.error(error.message || '密码修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="修改密码"
      open={visible}
      onCancel={onCancel}
      okText="确认修改"
      cancelText="取消"
      confirmLoading={loading}
      onOk={() => form.submit()}
    >
      <Form
        form={form}
        onFinish={onFinish}
        layout="vertical"
      >
        <Form.Item
          name="currentPassword"
          label="当前密码"
          rules={[
            { required: true, message: '请输入当前密码' },
            { min: 6, message: '密码至少6个字符' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请输入当前密码"
          />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="新密码"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码至少6个字符' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请输入新密码"
          />
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
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请确认新密码"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChangePassword; 