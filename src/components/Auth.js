import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Divider,
  Alert,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  OutlinedInput,
  Checkbox,
  FormControlLabel,
  Link
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Lock as LockIcon,
  Email as EmailIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

const Auth = ({ onLogin, onRegister }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'info' });
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleCheckboxChange = (event) => {
    setFormData({
      ...formData,
      agreeToTerms: event.target.checked
    });
  };

  const showAlertMessage = (message, severity = 'info') => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'info' }), 3000);
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      showAlertMessage('사용자명을 입력해주세요.', 'error');
      return false;
    }
    if (!formData.password) {
      showAlertMessage('비밀번호를 입력해주세요.', 'error');
      return false;
    }
    if (!isLoginMode) {
      if (!formData.email.trim()) {
        showAlertMessage('이메일을 입력해주세요.', 'error');
        return false;
      }
      if (!formData.email.includes('@')) {
        showAlertMessage('올바른 이메일 형식을 입력해주세요.', 'error');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        showAlertMessage('비밀번호가 일치하지 않습니다.', 'error');
        return false;
      }
      if (formData.password.length < 8) {
        showAlertMessage('비밀번호는 8자 이상이어야 합니다.', 'error');
        return false;
      }
      if (!formData.agreeToTerms) {
        showAlertMessage('이용약관에 동의해주세요.', 'error');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (isLoginMode) {
        await onLogin(formData.username, formData.password);
      } else {
        await onRegister(formData.username, formData.email, formData.password);
      }
    } catch (error) {
      showAlertMessage(error.message, 'error');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={8}
          sx={{
            p: 4,
            borderRadius: 2,
            background: 'white',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* 헤더 */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <SecurityIcon sx={{ fontSize: 40, color: '#1976d2', mr: 1 }} />
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                의사PT
              </Typography>
            </Box>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              환자 중증도 추론 시스템
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isLoginMode ? '안전한 로그인으로 서비스를 이용하세요' : '회원가입으로 서비스를 시작하세요'}
            </Typography>
          </Box>

          {/* 알림 */}
          {alert.show && (
            <Alert severity={alert.severity} sx={{ mb: 3 }}>
              {alert.message}
            </Alert>
          )}

          {/* 폼 */}
          <Box component="form" noValidate>
            {/* 사용자명 */}
            <TextField
              fullWidth
              label="사용자명"
              value={formData.username}
              onChange={handleInputChange('username')}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            {/* 이메일 (회원가입 모드에서만) */}
            {!isLoginMode && (
              <TextField
                fullWidth
                label="이메일"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                onKeyPress={handleKeyPress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />
            )}

            {/* 비밀번호 */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>비밀번호</InputLabel>
              <OutlinedInput
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange('password')}
                onKeyPress={handleKeyPress}
                startAdornment={
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                }
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
                label="비밀번호"
              />
            </FormControl>

            {/* 비밀번호 확인 (회원가입 모드에서만) */}
            {!isLoginMode && (
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>비밀번호 확인</InputLabel>
                <OutlinedInput
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  onKeyPress={handleKeyPress}
                  startAdornment={
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  }
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  }
                  label="비밀번호 확인"
                />
              </FormControl>
            )}

            {/* 이용약관 동의 (회원가입 모드에서만) */}
            {!isLoginMode && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.agreeToTerms}
                    onChange={handleCheckboxChange}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    <Link href="#" underline="hover">이용약관</Link> 및{' '}
                    <Link href="#" underline="hover">개인정보처리방침</Link>에 동의합니다.
                  </Typography>
                }
                sx={{ mb: 3 }}
              />
            )}

            {/* 제출 버튼 */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSubmit}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                }
              }}
            >
              {isLoginMode ? '로그인' : '회원가입'}
            </Button>
          </Box>

          {/* 구분선 */}
          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              또는
            </Typography>
          </Divider>

          {/* 모드 전환 */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {isLoginMode ? '아직 계정이 없으신가요?' : '이미 계정이 있으신가요?'}
            </Typography>
            <Button
              variant="text"
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setFormData({
                  username: '',
                  email: '',
                  password: '',
                  confirmPassword: '',
                  agreeToTerms: false
                });
                setAlert({ show: false, message: '', severity: 'info' });
              }}
              sx={{ fontWeight: 'bold' }}
            >
              {isLoginMode ? '회원가입' : '로그인'}
            </Button>
          </Box>

          {/* 푸터 */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              © 2024 의사PT. 모든 권리 보유.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Auth; 