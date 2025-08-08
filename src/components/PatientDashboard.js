import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  TextField,
  Button,
  Paper,
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  MonitorHeart as VitalIcon,
  Assessment as ChartIcon,
  Assessment,
  Chat as ChatIcon,
  Logout as LogoutIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PatientDashboard = ({ user, onLogout, onViewChange }) => {
  const [patientId, setPatientId] = useState('');
  const [admissionId, setAdmissionId] = useState('');
  const [patientData, setPatientData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);

  // 환자 정보 조회
  const fetchPatientData = async () => {
    if (!patientId.trim() || !admissionId.trim()) {
      setError('환자 ID와 입원번호를 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `환자 ${patientId}, hadm ${admissionId}를 중증도를 예측해줘`
        })
      });

      if (!response.ok) {
        throw new Error('환자 정보 조회에 실패했습니다.');
      }

      const data = await response.json();
      console.log('받은 환자 데이터:', data); // 디버깅용
      setPatientData(data);
    } catch (error) {
      console.error('환자 정보 조회 오류:', error);
      setError('환자 정보를 불러오는데 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchPatientData();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchPatientData();
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getSeverityColor = (score) => {
    if (score >= 0.7) return 'error';
    if (score >= 0.4) return 'warning';
    return 'success';
  };

  const getSeverityText = (score) => {
    if (score >= 0.7) return '고위험';
    if (score >= 0.4) return '중위험';
    return '저위험';
  };

  // 중증도 차트 데이터 생성 함수
  const createSeverityChartData = (severityScoreSeries) => {
    if (!severityScoreSeries || !Array.isArray(severityScoreSeries)) {
      return null;
    }

    // 시간 포맷팅 함수
    const formatTime = (isoString) => {
      try {
        const date = new Date(isoString);
        return date.toLocaleString('ko-KR', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        return isoString;
      }
    };

    const labels = severityScoreSeries.map(item => formatTime(item.time));
    const data = severityScoreSeries.map(item => item.prob * 100); // 퍼센트로 변환
    const stdData = severityScoreSeries.map(item => item.std * 100); // 표준편차도 퍼센트로 변환

    return {
      labels,
      datasets: [
        {
          label: '중증도 점수 (%)',
          data: data,
          borderColor: '#0078d4',
          backgroundColor: 'rgba(0, 120, 212, 0.1)',
          borderWidth: 3,
          pointBackgroundColor: '#0078d4',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          fill: true,
          tension: 0.4,
          pointHoverBackgroundColor: '#106ebe',
          pointHoverBorderColor: '#ffffff',
        },
        {
          label: '표준편차',
          data: stdData,
          borderColor: '#ff6b6b',
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          borderWidth: 2,
          borderDash: [5, 5],
          pointBackgroundColor: '#ff6b6b',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: false,
          tension: 0.4,
          pointHoverBackgroundColor: '#ff5252',
          pointHoverBorderColor: '#ffffff',
        }
      ]
    };
  };

  // 중증도 차트 옵션
  const severityChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '600'
          },
          color: '#2c3e50'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#0078d4',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function(context) {
            return `시간: ${context[0].label}`;
          },
          label: function(context) {
            if (context.dataset.label === '중증도 점수 (%)') {
              return `중증도: ${context.parsed.y.toFixed(1)}%`;
            } else if (context.dataset.label === '표준편차') {
              return `표준편차: ${context.parsed.y.toFixed(1)}%`;
            }
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#666',
          font: {
            size: 11,
            weight: '500'
          },
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#666',
          font: {
            size: 12,
            weight: '500'
          },
          callback: function(value) {
            return value + '%';
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    elements: {
      point: {
        hoverRadius: 8
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* 헤더 */}
      <AppBar position="static" elevation={0} sx={{ 
        background: 'linear-gradient(135deg, #0078d4 0%, #106ebe 100%)',
        color: 'white',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Toolbar sx={{ minHeight: '64px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              width: 40, 
              height: 40,
              backdropFilter: 'blur(10px)'
            }}>
              <HospitalIcon />
            </Avatar>
            <Typography variant="h6" component="div" sx={{ 
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}>
              환자 대시보드
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* 네비게이션 버튼 */}
          <Button
            variant="outlined"
            startIcon={<ChatIcon />}
            onClick={() => onViewChange('chat')}
            sx={{ 
              mr: 2,
              color: 'white',
              borderColor: 'rgba(255,255,255,0.3)',
              '&:hover': {
                borderColor: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            AI 상담
          </Button>

          {/* 사용자 메뉴 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ 
              width: 32, 
              height: 32,
              bgcolor: 'rgba(255,255,255,0.2)',
              fontSize: '0.875rem',
              fontWeight: 600
            }}>
              {user?.username?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {user?.username}
            </Typography>
            <IconButton 
              onClick={(e) => setUserMenuAnchor(e.currentTarget)}
              sx={{ 
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={() => setUserMenuAnchor(null)}
              PaperProps={{
                sx: {
                  mt: 1,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  borderRadius: 2
                }
              }}
            >
              <MenuItem onClick={onLogout} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                로그아웃
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 검색 영역 */}
      <Paper sx={{ 
        p: 3, 
        m: 2, 
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <Container maxWidth="md">
          <Typography variant="h6" sx={{ 
            mb: 3,
            fontWeight: 600,
            color: '#2c3e50',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <SearchIcon sx={{ color: '#0078d4' }} />
            환자 정보 조회
          </Typography>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="환자 ID"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="환자 ID를 입력하세요"
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'white',
                    '&:hover fieldset': {
                      borderColor: '#0078d4',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0078d4',
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="입원번호"
                value={admissionId}
                onChange={(e) => setAdmissionId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="입원번호를 입력하세요"
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'white',
                    '&:hover fieldset': {
                      borderColor: '#0078d4',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0078d4',
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="contained"
                startIcon={isLoading ? <CircularProgress size={20} /> : <SearchIcon />}
                onClick={handleSearch}
                disabled={isLoading}
                sx={{ 
                  height: 40,
                  background: 'linear-gradient(135deg, #0078d4 0%, #106ebe 100%)',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(0,120,212,0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #106ebe 0%, #005a9e 100%)',
                    boxShadow: '0 6px 16px rgba(0,120,212,0.4)',
                    transform: 'translateY(-1px)'
                  },
                  '&:disabled': {
                    background: '#e0e0e0',
                    color: '#9e9e9e'
                  }
                }}
              >
                {isLoading ? '조회 중...' : '환자 조회'}
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Paper>

      {/* 에러 메시지 */}
      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      {/* 환자 데이터 표시 */}
      {patientData && (
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
          <Container maxWidth="lg">
                         {/* 환자 기본 정보 */}
             <Card sx={{ mb: 3 }}>
               <CardHeader
                 avatar={
                   <Avatar sx={{ bgcolor: 'primary.main' }}>
                     <PersonIcon />
                   </Avatar>
                 }
                 title={`환자 ID: ${patientData.patient_id || 'N/A'}`}
                 subheader={`입원번호: ${patientData.hadm_id || 'N/A'}`}
                 action={
                   <IconButton onClick={fetchPatientData}>
                     <RefreshIcon />
                   </IconButton>
                 }
               />
             </Card>

            {/* 탭 메뉴 */}
            <Box sx={{ 
              borderBottom: '2px solid #e0e0e0', 
              mb: 3,
              backgroundColor: 'white',
              borderRadius: '8px 8px 0 0',
              px: 2
            }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    minHeight: 56,
                    color: '#666',
                    '&.Mui-selected': {
                      color: '#0078d4',
                    },
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#0078d4',
                    height: 3,
                    borderRadius: '2px 2px 0 0'
                  }
                }}
              >
                <Tab label="중증도 분석" icon={<ChartIcon />} />
                <Tab label="생체신호" icon={<VitalIcon />} />
                <Tab label="AI 상담" icon={<ChatIcon />} />
              </Tabs>
            </Box>

                         {/* 중증도 분석 탭 */}
             {activeTab === 0 && (
               <Grid container spacing={3}>
                 {/* 중증도 점수와 특징 중요도 - 가로 3개씩 세로 배열 */}
                 <Grid item xs={12}>
                   <Grid container spacing={2}>
                     {/* 중증도 점수 */}
                     <Grid item xs={12} sm={6} md={4}>
                       <Card sx={{ 
                         height: 220,
                         borderRadius: 3,
                         boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                         border: '1px solid rgba(0,0,0,0.05)',
                         background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                         transition: 'all 0.3s ease',
                         '&:hover': {
                           transform: 'translateY(-4px)',
                           boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                         }
                       }}>
                         <CardHeader
                           title="중증도 점수"
                           titleTypographyProps={{
                             sx: { fontWeight: 600, color: '#2c3e50' }
                           }}
                           avatar={
                             <Avatar sx={{ 
                               bgcolor: getSeverityColor(patientData.severity_score || 0),
                               boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                             }}>
                               <ChartIcon />
                             </Avatar>
                           }
                         />
                         <CardContent sx={{ 
                           textAlign: 'center',
                           display: 'flex',
                           flexDirection: 'column',
                           justifyContent: 'center',
                           alignItems: 'center',
                           height: 160
                         }}>
                           <Typography variant="h4" sx={{ 
                             mb: 1,
                             fontWeight: 700,
                             background: 'linear-gradient(135deg, #0078d4 0%, #106ebe 100%)',
                             backgroundClip: 'text',
                             WebkitBackgroundClip: 'text',
                             WebkitTextFillColor: 'transparent'
                           }}>
                             {patientData.severity_score !== null && patientData.severity_score !== undefined 
                               ? (patientData.severity_score * 100).toFixed(1) 
                               : 'N/A'}%
                           </Typography>
                           <Chip 
                             label={getSeverityText(patientData.severity_score || 0)} 
                             color={getSeverityColor(patientData.severity_score || 0)}
                             sx={{ 
                               mb: 2,
                               fontWeight: 600,
                               borderRadius: 2
                             }}
                           />
                           <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                             위험도: {(patientData.severity_score || 0) >= 0.7 ? '높음' : (patientData.severity_score || 0) >= 0.4 ? '보통' : '낮음'}
                           </Typography>
                         </CardContent>
                       </Card>
                     </Grid>

                     {/* 특징 중요도 카드들 - 3개씩 배치 */}
                     {typeof patientData.feature_importance === 'object' ? (
                       Object.entries(patientData.feature_importance)
                         .sort(([,a], [,b]) => b - a) // 값 기준 내림차순 정렬
                         .map(([key, value], index) => {
                           let color = 'primary.main'; // 기본 파란색
                           if (index === 0) color = 'error.main'; // 1위: 빨간색
                           else if (index === 1) color = 'warning.main'; // 2위: 주황색
                           
                           return (
                             <Grid item xs={12} sm={6} md={4} key={key} sx={{ height: 220 }}>
                               <Card sx={{ 
                                 height: '100%',
                                 borderRadius: 3,
                                 boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                 border: `2px solid ${color}`,
                                 position: 'relative',
                                 transition: 'all 0.3s ease',
                                 display: 'flex',
                                 flexDirection: 'column',
                                 background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                                 '&:hover': {
                                   transform: 'translateY(-4px)',
                                   boxShadow: `0 8px 32px ${color}20`,
                                   borderColor: color
                                 }
                               }}>
                                 <CardHeader
                                   title={
                                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                       <Box sx={{ 
                                         backgroundColor: color, 
                                         color: 'white',
                                         borderRadius: '50%',
                                         width: 28,
                                         height: 28,
                                         display: 'flex',
                                         alignItems: 'center',
                                         justifyContent: 'center',
                                         fontSize: '0.9rem',
                                         fontWeight: 'bold',
                                         boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                       }}>
                                         {index + 1}
                                       </Box>
                                       <Typography variant="h6" sx={{ 
                                         color: color, 
                                         fontWeight: 700,
                                         fontSize: '0.95rem'
                                       }}>
                                         {key.replace(/_/g, ' ').toUpperCase()}
                                       </Typography>
                                     </Box>
                                   }
                                   sx={{ pb: 1, flexShrink: 0, height: 60 }}
                                 />
                                 <CardContent sx={{ 
                                   textAlign: 'center', 
                                   pt: 0, 
                                   pb: 2, 
                                   flexGrow: 1,
                                   display: 'flex',
                                   flexDirection: 'column',
                                   justifyContent: 'center',
                                   alignItems: 'center',
                                   height: 160
                                 }}>
                                   <Typography variant="h3" sx={{ 
                                     color: color, 
                                     fontWeight: 700,
                                     mb: 2,
                                     textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                   }}>
                                     {typeof value === 'number' ? value.toFixed(3) : value}
                                   </Typography>
                                   <Box sx={{ 
                                     height: 8, 
                                     backgroundColor: 'rgba(0,0,0,0.1)', 
                                     borderRadius: 4,
                                     overflow: 'hidden',
                                     width: '80%',
                                     boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                                   }}>
                                     <Box sx={{ 
                                       height: '100%', 
                                       background: `linear-gradient(90deg, ${color} 0%, ${color}dd 100%)`,
                                       width: `${Math.min(100, (value / Math.max(...Object.values(patientData.feature_importance))) * 100)}%`,
                                       transition: 'width 0.5s ease',
                                       borderRadius: 4
                                     }} />
                                   </Box>
                                 </CardContent>
                               </Card>
                             </Grid>
                           );
                         })
                     ) : (
                       <Grid item xs={12}>
                         <Card>
                           <CardHeader title="주요 특징 중요도" />
                           <CardContent>
                             <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                               {patientData.feature_importance || '특징 중요도 정보가 없습니다.'}
                             </Typography>
                           </CardContent>
                         </Card>
                       </Grid>
                     )}
                   </Grid>
                 </Grid>

               </Grid>
             )}

             {/* 중증도 시계열 차트 - Container 밖으로 이동 */}
             {patientData.severity_score_series && createSeverityChartData(patientData.severity_score_series) && (
               <Box sx={{ mt: 3, px: 2 }}>
                 <Card sx={{ 
                   borderRadius: 3,
                   boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                   border: '1px solid rgba(0,0,0,0.05)',
                   background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                   transition: 'all 0.3s ease',
                   '&:hover': {
                     transform: 'translateY(-2px)',
                     boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                   }
                 }}>
                   <CardHeader 
                     title="중증도 변화 추이"
                     titleTypographyProps={{
                       sx: { fontWeight: 600, color: '#2c3e50' }
                     }}
                   />
                   <CardContent sx={{ 
                     height: 500, 
                     p: 3,
                     position: 'relative'
                   }}>
                     <div style={{ 
                       width: '100%', 
                       height: '100%',
                       position: 'relative'
                     }}>
                       <Line 
                         data={createSeverityChartData(patientData.severity_score_series)}
                         options={{
                           ...severityChartOptions,
                           responsive: true,
                           maintainAspectRatio: false
                         }}
                       />
                     </div>
                   </CardContent>
                 </Card>
               </Box>
             )}

             {/* AI 분석 리포트 - 전체 너비 */}
             <Box sx={{ mt: 3, px: 2 }}>
               <Card sx={{ 
                 borderRadius: 3,
                 boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                 border: '1px solid rgba(0,0,0,0.05)',
                 background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                 transition: 'all 0.3s ease',
                 '&:hover': {
                   transform: 'translateY(-2px)',
                   boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                 }
               }}>
                 <CardHeader 
                   title="AI 분석 리포트"
                   titleTypographyProps={{
                     sx: { fontWeight: 600, color: '#2c3e50' }
                   }}
                 />
                 <CardContent sx={{ p: 0 }}>
                   <Box sx={{ 
                     height: 300, 
                     overflow: 'auto',
                     p: 3,
                     background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                     border: '1px solid rgba(0,0,0,0.08)',
                     borderRadius: 2,
                     mx: 2,
                     mb: 2,
                     boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.05)'
                   }}>
                     <Typography variant="body2" sx={{ 
                       whiteSpace: 'pre-line',
                       lineHeight: 1.8,
                       color: '#2c3e50',
                       fontWeight: 500
                     }}>
                       {patientData.report || '분석 리포트가 없습니다.'}
                     </Typography>
                   </Box>
                 </CardContent>
               </Card>
             </Box>

                         {/* 생체신호 탭 */}
             {activeTab === 1 && (
               <Grid container spacing={3}>
                 {patientData.vitals_preview_plot && (
                   <Grid item xs={12}>
                     <Card sx={{ 
                       borderRadius: 3,
                       boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                       border: '1px solid rgba(0,0,0,0.05)',
                       background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                       transition: 'all 0.3s ease',
                       '&:hover': {
                         transform: 'translateY(-2px)',
                         boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                       }
                     }}>
                       <CardHeader 
                         title="생체신호 모니터링 (최근 24시간)"
                         titleTypographyProps={{
                           sx: { fontWeight: 600, color: '#2c3e50' }
                         }}
                       />
                       <CardContent>
                         <img 
                           src={`data:image/png;base64,${patientData.vitals_preview_plot}`}
                           alt="생체신호 차트"
                           style={{ 
                             width: '100%', 
                             height: 'auto',
                             borderRadius: '12px',
                             boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                           }}
                           onError={(e) => console.error('생체신호 차트 이미지 로드 실패:', e)}
                         />
                       </CardContent>
                     </Card>
                   </Grid>
                 )}
                 
                 <Grid item xs={12}>
                   <Card sx={{ 
                     borderRadius: 3,
                     boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                     border: '1px solid rgba(0,0,0,0.05)',
                     background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                     transition: 'all 0.3s ease',
                     '&:hover': {
                       transform: 'translateY(-2px)',
                       boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                     }
                   }}>
                     <CardHeader 
                       title="생체신호 요약"
                       titleTypographyProps={{
                         sx: { fontWeight: 600, color: '#2c3e50' }
                       }}
                     />
                     <CardContent>
                       <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                         생체신호 데이터가 차트로 표시됩니다. 혈압, 심박수, 체온 등의 변화를 모니터링할 수 있습니다.
                       </Typography>
                     </CardContent>
                   </Card>
                 </Grid>
               </Grid>
             )}

            {/* AI 상담 탭 */}
            {activeTab === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card>
                    <CardHeader title="AI 상담" />
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        이 환자에 대한 추가 질문이나 상담이 필요하시면 AI 상담 기능을 이용하세요.
                      </Typography>
                      <Button 
                        variant="contained" 
                        startIcon={<ChatIcon />}
                        onClick={() => onViewChange('chat')}
                      >
                        AI 상담 시작
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Container>
        </Box>
      )}

      {/* 환자 데이터가 없을 때 안내 */}
      {!patientData && !isLoading && (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '50vh',
          color: 'text.secondary'
        }}>
          <HospitalIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            환자 정보를 조회해주세요
          </Typography>
          <Typography variant="body2">
            환자 ID와 입원번호를 입력하여 환자 대시보드를 확인하세요.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PatientDashboard; 