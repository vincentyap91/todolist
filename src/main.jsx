import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import './index.css'

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
      <App />
    </ConfigProvider>
  </React.StrictMode>,
) 