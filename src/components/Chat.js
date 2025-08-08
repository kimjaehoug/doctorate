import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  TextField,
  Button,
  Paper,
  Container,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Fab,
  Alert,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  Add as AddIcon,
  Chat as ChatIcon,
  Logout as LogoutIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalHospital as HospitalIcon
} from '@mui/icons-material';

const Chat = ({ user, onLogout, onViewChange }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "안녕하세요! 저는 의사PT입니다. 환자에 관한 질문이나 지식이 필요하시면 언제든 말씀해 주세요. 테스트",
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // 채팅 세션 관련 상태
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessionMenuAnchor, setSessionMenuAnchor] = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  // 알림 상태
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'info' });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 컴포넌트 마운트 시 채팅 세션 로드
  useEffect(() => {
    loadChatSessions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // API 호출 헬퍼 함수 - 로컬 서버용
  const apiCall = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    // 로컬 서버로 호출
    const fullUrl = url.startsWith('http') ? url : `http://localhost:5001${url}`;
    const response = await fetch(fullUrl, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '요청 실패');
    }

    return data;
  };

  // 알림 표시 함수
  const showAlert = (message, severity = 'info') => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'info' }), 3000);
  };

  // 채팅 세션 목록 로드
  const loadChatSessions = async () => {
    try {
      const sessions = await apiCall('/api/chat-sessions');
      setChatSessions(sessions);
    } catch (error) {
      console.error('채팅 세션 로드 오류:', error);
    }
  };

  // 새 채팅 세션 생성
  const createNewSession = async () => {
    try {
      const session = await apiCall('/api/chat-sessions', {
        method: 'POST',
        body: JSON.stringify({ title: '새 대화' })
      });

      setChatSessions(prev => [session, ...prev]);
      setCurrentSessionId(session.id);
      setMessages([
        {
          id: 1,
          text: "안녕하세요! 저는 의사PT입니다. 환자에 관한 질문이나 지식이 필요하시면 언제든 말씀해 주세요.",
          sender: 'assistant',
          timestamp: new Date()
        }
      ]);
      showAlert('새 대화가 시작되었습니다', 'success');
    } catch (error) {
      showAlert('새 대화 생성에 실패했습니다', 'error');
    }
  };

  // 대화 이름 변경
  const updateSessionTitle = async (sessionId, newTitle) => {
    try {
      await apiCall(`/api/chat-sessions/${sessionId}`, {
        method: 'PUT',
        body: JSON.stringify({ title: newTitle })
      });

      setChatSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, title: newTitle }
            : session
        )
      );
      setEditingSessionId(null);
      setEditingTitle('');
      showAlert('대화 이름이 변경되었습니다', 'success');
    } catch (error) {
      showAlert('대화 이름 변경에 실패했습니다', 'error');
    }
  };

  // 대화 이름 편집 시작
  const startEditingTitle = (session) => {
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  // 대화 이름 편집 취소
  const cancelEditingTitle = () => {
    setEditingSessionId(null);
    setEditingTitle('');
  };

  // 대화 삭제
  const deleteSession = async (sessionId) => {
    try {
      await apiCall(`/api/chat-sessions/${sessionId}`, {
        method: 'DELETE'
      });

      setChatSessions(prev => prev.filter(session => session.id !== sessionId));
      
      // 현재 선택된 세션이 삭제된 경우, 첫 번째 세션 선택하거나 새 대화 시작
      if (currentSessionId === sessionId) {
        const remainingSessions = chatSessions.filter(session => session.id !== sessionId);
        if (remainingSessions.length > 0) {
          selectSession(remainingSessions[0].id);
        } else {
          setCurrentSessionId(null);
          setMessages([
            {
              id: 1,
              text: "안녕하세요! 저는 의사PT입니다. 환자에 관한 질문이나 지식이 필요하시면 언제든 말씀해 주세요.",
              sender: 'assistant',
              timestamp: new Date()
            }
          ]);
        }
      }
      
      showAlert('대화가 삭제되었습니다', 'success');
    } catch (error) {
      showAlert('대화 삭제에 실패했습니다', 'error');
    }
  };

  // 채팅 세션 선택
  const selectSession = async (sessionId) => {
    try {
      const messages = await apiCall(`/api/chat-sessions/${sessionId}/messages`);
      console.log('로드된 메시지들:', messages); // 디버깅용
      
      setCurrentSessionId(sessionId);
      setMessages(messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })));
    } catch (error) {
      showAlert('대화 불러오기에 실패했습니다', 'error');
    }
  };

  // 메시지 저장
  const saveMessage = async (message) => {
    if (!currentSessionId) return;

    try {
      // 이미지 데이터 완전 저장 (개인 사용)
      const sanitizedData = message.data ? {
        ...message.data,
        // 이미지 데이터 완전 저장
        plot_base64: message.data.plot_base64,
        feature_importance_plot: message.data.feature_importance_plot,
        vitals_preview_plot: message.data.vitals_preview_plot,
      } : null;

      await apiCall(`/api/chat-sessions/${currentSessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          sender: message.sender,
          text: message.text,
          data: sanitizedData
        })
      });
    } catch (error) {
      console.error('메시지 저장 오류:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // 의료 관련 질문인지 판단 (간단한 인사말 포함)
    const medicalKeywords = [
      '환자', '증상', '병', '아픔', '통증', '열', '기침', '두통', '복통', '어지럼', '피로',
      '혈압', '혈당', '심장', '폐', '간', '신장', '뇌', '관절', '근육', '뼈',
      '약', '치료', '수술', '진단', '검사', '병원', '의사', '간호사', '응급',
      '중증도', '위험', '생명', '회복', '완치', '재발', '합병증', '부작용',
      '혈액', '소변', '대변', '가래', '구토', '설사', '변비', '불면', '식욕',
      '체중', '호흡', '맥박', '체온', '의식', '기억', '집중', '기분', '스트레스'
    ];

    const greetingKeywords = [
      '안녕', '반갑', '안녕하세요', '안녕하십니까', '안녕하신가요',
      '좋은', '오늘', '날씨', '기분', '어떻게', '지내', '잘', '괜찮',
      '고맙', '감사', '수고', '힘내', '화이팅', '파이팅'
    ];

    const isMedicalQuestion = medicalKeywords.some(keyword => 
      inputText.toLowerCase().includes(keyword.toLowerCase())
    );

    const isGreeting = greetingKeywords.some(keyword => 
      inputText.toLowerCase().includes(keyword.toLowerCase())
    );

    // 의료 질문이 아니고 인사말도 아니면 거부
    if (!isMedicalQuestion && !isGreeting) {
      const rejectionMessage = {
        id: messages.length + 1,
        text: "죄송합니다. 저는 의료 관련 질문이나 간단한 인사말에만 답변할 수 있습니다. 환자 증상, 진단, 치료 등 의료와 관련된 질문을 해주세요.",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, rejectionMessage]);
      return;
    }

    const userMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // 첫 번째 메시지이고 세션이 없으면 새 세션 생성 후 메시지 저장
    if (!currentSessionId && messages.length === 1) {
      try {
        const session = await apiCall('/api/chat-sessions', {
          method: 'POST',
          body: JSON.stringify({ 
            title: inputText.length > 20 ? inputText.substring(0, 20) + '...' : inputText 
          })
        });

        setChatSessions(prev => [session, ...prev]);
        setCurrentSessionId(session.id);
        
        // 세션 생성 후 사용자 메시지 저장
        await saveMessage(userMessage);
      } catch (error) {
        showAlert('새 대화 생성에 실패했습니다', 'error');
        return;
      }
    } else if (currentSessionId) {
      // 기존 세션이 있으면 바로 저장
      saveMessage(userMessage);
    }

    try {
      // API 호출 - 로컬 서버를 통해 AI 서버로 프록시
      const response = await fetch('/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputText
        })
      });

      if (!response.ok) {
        throw new Error('API 요청 실패');
      }

      const data = await response.json();
      
      // 응답에서 프롬프트 제거 함수
      const removePromptFromResponse = (text) => {
        const prompts = [
          "다음 환자 정보를 바탕으로 간결하고 정확한 분석 보고서를 작성하세요.",
          "다음 환자 정보를 바탕으로 분석 보고서를 작성하세요.",
          "환자 정보를 바탕으로 분석 보고서를 작성하세요.",
          "다음 환자 정보를 분석해주세요.",
          "환자 정보를 분석해주세요.",
          "분석 보고서를 작성하세요.",
          "간결하고 정확한 분석 보고서를 작성하세요."
        ];
        
        let cleanedText = text;
        prompts.forEach(prompt => {
          cleanedText = cleanedText.replace(prompt, '').trim();
        });
        
        return cleanedText;
      };
      
      // API 응답을 메시지로 변환
      let responseText = '';
      let hasOtherData = false;
      
      // normal_text를 제외한 다른 데이터가 있는지 확인
      if (data.patient_id !== null && data.patient_id !== undefined) hasOtherData = true;
      if (data.hadm_id !== null && data.hadm_id !== undefined) hasOtherData = true;
      if (data.severity_score !== null && data.severity_score !== undefined) hasOtherData = true;
      if (data.feature_importance !== null && data.feature_importance !== undefined) hasOtherData = true;
      if (data.feature_importance_plot !== null && data.feature_importance_plot !== undefined) hasOtherData = true;
      if (data.vitals_preview_plot !== null && data.vitals_preview_plot !== undefined) hasOtherData = true;
      if (data.report !== null && data.report !== undefined) hasOtherData = true;
      if (data.plot_base64 !== null && data.plot_base64 !== undefined) hasOtherData = true;
      
      // normal_text만 있고 나머지가 모두 null인 경우
      if (!hasOtherData && data.normal_text) {
        console.log(responseText);
        responseText = data.normal_text;
        
        // "--- 답변 ---" 위의 부분 제거
        const answerIndex = responseText.indexOf('--- 답변 ---');
        if (answerIndex !== -1) {
          responseText = responseText.substring(answerIndex + '--- 답변 ---'.length).trim();
        }
      } else {
        // 기존 형식으로 응답 구성
        responseText = `환자 ID: ${data.patient_id}\n`;
        responseText += `중증도 점수: ${data.severity_score}\n\n`;
        responseText += `특징 중요도:\n${data.feature_importance}\n\n`;
        responseText += `분석 리포트:\n${removePromptFromResponse(data.report)}`;
      }

      // 데이터 프리뷰 차트가 있으면 먼저 표시
      if (data.vitals_preview_plot) {
        const previewMessage = {
          id: messages.length + 2,
          text: "환자 데이터 프리뷰",
          sender: 'assistant',
          timestamp: new Date(),
          data: { vitals_preview_plot: data.vitals_preview_plot },
          isPreview: true
        };
        setMessages(prev => [...prev, previewMessage]);
        
        // 메시지 저장
        if (currentSessionId) {
          saveMessage(previewMessage);
        }
      }

      const assistantMessage = {
        id: messages.length + (data.vitals_preview_plot ? 3 : 2),
        text: responseText,
        sender: 'assistant',
        timestamp: new Date(),
        data: data // 전체 데이터 저장 (차트 표시용)
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // 메시지 저장
      if (currentSessionId) {
        saveMessage(assistantMessage);
      }
    } catch (error) {
      console.error('API 호출 오류:', error);
      const errorMessage = {
        id: messages.length + 2,
        text: "죄송합니다. 서버와의 통신 중 오류가 발생했습니다. 다시 시도해 주세요.",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // 메시지 저장
      if (currentSessionId) {
        saveMessage(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const drawerWidth = 280;

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* 사이드바 */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ChatIcon color="primary" />
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              의사PT
            </Typography>
          </Box>
          
          {/* 네비게이션 버튼 */}
          <Button
            color="inherit"
            startIcon={<HospitalIcon />}
            onClick={() => onViewChange('dashboard')}
            sx={{ ml: 'auto', mr: 2 }}
          >
            환자 대시보드
          </Button>
        </Toolbar>
        <Divider />
        
        {/* 새 대화 시작 버튼 */}
        <Box sx={{ p: 2 }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<AddIcon />}
            onClick={createNewSession}
            sx={{ mb: 2 }}
          >
            새 대화 시작
          </Button>
        </Box>
        <Divider />
        
        {/* 채팅 세션 목록 */}
        <List>
          {chatSessions.map((session) => (
            <ListItem key={session.id} disablePadding>
              {editingSessionId === session.id ? (
                // 편집 모드
                <Box sx={{ p: 1, width: '100%' }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        updateSessionTitle(session.id, editingTitle);
                      } else if (e.key === 'Escape') {
                        cancelEditingTitle();
                      }
                    }}
                    autoFocus
                    sx={{ mb: 1 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => updateSessionTitle(session.id, editingTitle)}
                    >
                      저장
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={cancelEditingTitle}
                    >
                      취소
                    </Button>
                  </Box>
                </Box>
              ) : (
                // 일반 모드
                <ListItemButton
                  selected={currentSessionId === session.id}
                  onClick={() => selectSession(session.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    startEditingTitle(session);
                  }}
                >
                  <ListItemIcon>
                    <ChatIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={session.title}
                    secondary={new Date(session.updated_at).toLocaleDateString()}
                  />
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingTitle(session);
                      }}
                      sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('이 대화를 삭제하시겠습니까?')) {
                          deleteSession(session.id);
                        }
                      }}
                      sx={{ 
                        opacity: 0.7, 
                        '&:hover': { 
                          opacity: 1,
                          color: 'error.main'
                        } 
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </ListItemButton>
              )}
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* 메인 채팅 영역 */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* 헤더 */}
        <AppBar position="static" elevation={1} sx={{ backgroundColor: 'white', color: 'black' }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              중증도 추론
            </Typography>
            
            {/* 사용자 메뉴 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">
                {user?.username}
              </Typography>
              <IconButton onClick={(e) => setSessionMenuAnchor(e.currentTarget)}>
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={sessionMenuAnchor}
                open={Boolean(sessionMenuAnchor)}
                onClose={() => setSessionMenuAnchor(null)}
              >
                <MenuItem onClick={onLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  로그아웃
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        {/* 알림 */}
        {alert.show && (
          <Alert 
            severity={alert.severity} 
            sx={{ position: 'fixed', top: 70, right: 20, zIndex: 1000 }}
            onClose={() => setAlert({ show: false, message: '', severity: 'info' })}
          >
            {alert.message}
          </Alert>
        )}

        {/* 메시지 영역 */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, backgroundColor: '#f5f5f5' }}>
          <Container maxWidth="md">
            {messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2
                }}
              >
                <Paper
                  sx={{
                    p: 2,
                    maxWidth: '70%',
                    backgroundColor: message.sender === 'user' ? 'primary.main' : 'white',
                    color: message.sender === 'user' ? 'white' : 'text.primary',
                    borderRadius: 2,
                    position: 'relative'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    {message.sender === 'assistant' && (
                      <Avatar sx={{ width: 24, height: 24, bgcolor: 'grey.600' }}>
                        <BotIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                    )}
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                        {message.text}
                      </Typography>
                      
                      {/* 환자 데이터 프리뷰 차트 */}
                      {message.data && message.data.vitals_preview_plot && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                            환자 데이터 프리뷰 (최근 24시간)
                          </Typography>
                          {console.log('vitals_preview_plot 데이터:', message.data.vitals_preview_plot.substring(0, 100) + '...')}
                          <img 
                            src={`data:image/png;base64,${message.data.vitals_preview_plot}`}
                            alt="환자 데이터 프리뷰"
                            style={{ 
                              maxWidth: '100%', 
                              height: 'auto',
                              borderRadius: '8px',
                              border: '1px solid #e0e0e0'
                            }}
                            onError={(e) => console.error('프리뷰 이미지 로드 실패:', e)}
                            onLoad={() => console.log('프리뷰 이미지 로드 성공')}
                          />
                        </Box>
                      )}
                      
                      {/* 메인 분석 차트들 */}
                      {message.data && message.data.plot_base64 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                            분석 차트
                          </Typography>
                          {console.log('plot_base64 데이터:', message.data.plot_base64.substring(0, 100) + '...')}
                          <img 
                            src={`data:image/png;base64,${message.data.plot_base64}`}
                            alt="분석 차트"
                            style={{ 
                              maxWidth: '100%', 
                              height: 'auto',
                              borderRadius: '8px',
                              border: '1px solid #e0e0e0'
                            }}
                            onError={(e) => console.error('이미지 로드 실패:', e)}
                            onLoad={() => console.log('이미지 로드 성공')}
                          />
                        </Box>
                      )}
                      {message.data && message.data.feature_importance_plot && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                            특징 중요도 차트
                          </Typography>
                          {console.log('feature_importance_plot 데이터:', message.data.feature_importance_plot.substring(0, 100) + '...')}
                          <img 
                            src={`data:image/png;base64,${message.data.feature_importance_plot}`}
                            alt="특징 중요도 차트"
                            style={{ 
                              maxWidth: '100%', 
                              height: 'auto',
                              borderRadius: '8px',
                              border: '1px solid #e0e0e0'
                            }}
                            onError={(e) => console.error('특징 중요도 이미지 로드 실패:', e)}
                            onLoad={() => console.log('특징 중요도 이미지 로드 성공')}
                          />
                        </Box>
                      )}
                      <Typography variant="caption" sx={{ opacity: 0.7, mt: 0.5, display: 'block' }}>
                        {message.timestamp.toLocaleTimeString()}
                      </Typography>
                    </Box>
                    {message.sender === 'user' && (
                      <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                        <PersonIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                    )}
                  </Box>
                </Paper>
              </Box>
            ))}
            
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                <Paper sx={{ p: 2, backgroundColor: 'white', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: 'grey.600' }}>
                      <BotIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                    <Box className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            )}
            
            <div ref={messagesEndRef} />
          </Container>
        </Box>

        {/* 입력 영역 */}
        <Paper sx={{ p: 2, backgroundColor: 'white', borderTop: 1, borderColor: 'divider' }}>
          <Container maxWidth="md">
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="환자에 관한 질문을 입력하세요..."
                variant="outlined"
                size="small"
              />
              <Fab
                color="primary"
                size="small"
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
              >
                <SendIcon />
              </Fab>
            </Box>
          </Container>
        </Paper>
      </Box>
    </Box>
  );
};

export default Chat; 