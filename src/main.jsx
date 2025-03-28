import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import App from './App.jsx'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import './index.css'
import Login from './components/Login'
import Register from './components/Register'
import TodoList from './components/TodoList'
import AdminUsers from './components/AdminUsers'

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/todos",
    element: <TodoList />,
  },
  {
    path: "/admin/users",
    element: <AdminUsers />,
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#6366f1',
          borderRadius: 8,
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  </React.StrictMode>,
) 