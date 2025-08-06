import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Auth from './components/Auth';
import Chat from './components/Chat';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // 토큰이 있으면 자동 로그인
  useEffect(() => {
    if (token) {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData) {
        setIsAuthenticated(true);
        setUser(userData);
      }
    }
  }, [token]);

  // API 호출 헬퍼 함수
  const apiCall = async (url, options = {}) => {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '요청 실패');
    }

    return data;
  };

  // 로그인 처리
  const handleLogin = async (username, password) => {
    const data = await apiCall('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setIsAuthenticated(true);
  };

  // 회원가입 처리
  const handleRegister = async (username, email, password) => {
    const data = await apiCall('/api/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setIsAuthenticated(true);
  };

  // 로그아웃 처리
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {isAuthenticated ? (
        <Chat user={user} onLogout={handleLogout} />
      ) : (
        <Auth onLogin={handleLogin} onRegister={handleRegister} />
      )}
    </ThemeProvider>
  );
}

export default App;
