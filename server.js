const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// 미들웨어
app.use(cors({
  origin: ['http://localhost:3001', 'http://127.0.0.1:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MySQL 연결 설정
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'doctor_pt',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// MySQL 풀 생성
const pool = mysql.createPool(dbConfig);

// JWT 시크릿 키
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 데이터베이스 초기화
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // 사용자 테이블 생성
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 채팅 세션 테이블 생성
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) DEFAULT '새 대화',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 메시지 테이블 생성
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT NOT NULL,
        sender ENUM('user', 'assistant') NOT NULL,
        text TEXT NOT NULL,
        data JSON,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
      )
    `);

    connection.release();
    console.log('데이터베이스 초기화 완료');
  } catch (error) {
    console.error('데이터베이스 초기화 오류:', error);
    console.log('MySQL 연결 없이 서버가 실행됩니다. 일부 기능이 제한될 수 있습니다.');
  }
}

// JWT 토큰 검증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '액세스 토큰이 필요합니다' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '유효하지 않은 토큰입니다' });
    }
    req.user = user;
    next();
  });
};

// 회원가입
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: '모든 필드를 입력해주세요' });
    }

    const connection = await pool.getConnection();
    
    // 중복 확인
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      connection.release();
      return res.status(400).json({ error: '이미 존재하는 사용자명 또는 이메일입니다' });
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const [result] = await connection.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    connection.release();

    // JWT 토큰 생성
    const token = jwt.sign({ userId: result.insertId, username }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: '회원가입이 완료되었습니다',
      token,
      user: { id: result.insertId, username, email }
    });

  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 로그인
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '사용자명과 비밀번호를 입력해주세요' });
    }

    const connection = await pool.getConnection();
    
    // 사용자 조회
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    connection.release();

    if (users.length === 0) {
      return res.status(401).json({ error: '사용자명 또는 비밀번호가 올바르지 않습니다' });
    }

    const user = users[0];

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: '사용자명 또는 비밀번호가 올바르지 않습니다' });
    }

    // JWT 토큰 생성
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: '로그인이 완료되었습니다',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });

  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 채팅 세션 목록 조회
app.get('/api/chat-sessions', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [sessions] = await connection.execute(
      'SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC',
      [req.user.userId]
    );

    connection.release();
    res.json(sessions);

  } catch (error) {
    console.error('채팅 세션 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 새 채팅 세션 생성
app.post('/api/chat-sessions', authenticateToken, async (req, res) => {
  try {
    const { title } = req.body;
    const connection = await pool.getConnection();
    
    const [result] = await connection.execute(
      'INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)',
      [req.user.userId, title || '새 대화']
    );

    connection.release();
    res.status(201).json({ id: result.insertId, title: title || '새 대화' });

  } catch (error) {
    console.error('채팅 세션 생성 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 채팅 세션 이름 변경
app.put('/api/chat-sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title } = req.body;
    const connection = await pool.getConnection();
    
    // 세션 소유권 확인
    const [sessions] = await connection.execute(
      'SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?',
      [sessionId, req.user.userId]
    );

    if (sessions.length === 0) {
      connection.release();
      return res.status(404).json({ error: '채팅 세션을 찾을 수 없습니다' });
    }

    // 세션 이름 업데이트
    await connection.execute(
      'UPDATE chat_sessions SET title = ? WHERE id = ?',
      [title, sessionId]
    );

    connection.release();
    res.json({ message: '대화 이름이 변경되었습니다' });

  } catch (error) {
    console.error('채팅 세션 이름 변경 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 채팅 세션 삭제
app.delete('/api/chat-sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const connection = await pool.getConnection();
    
    // 세션 소유권 확인
    const [sessions] = await connection.execute(
      'SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?',
      [sessionId, req.user.userId]
    );

    if (sessions.length === 0) {
      connection.release();
      return res.status(404).json({ error: '채팅 세션을 찾을 수 없습니다' });
    }

    // 세션 삭제 (CASCADE로 인해 관련 메시지도 자동 삭제됨)
    await connection.execute(
      'DELETE FROM chat_sessions WHERE id = ?',
      [sessionId]
    );

    connection.release();
    res.json({ message: '대화가 삭제되었습니다' });

  } catch (error) {
    console.error('채팅 세션 삭제 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 채팅 세션의 메시지 조회
app.get('/api/chat-sessions/:sessionId/messages', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const connection = await pool.getConnection();
    
    // 세션 소유권 확인
    const [sessions] = await connection.execute(
      'SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?',
      [sessionId, req.user.userId]
    );

    if (sessions.length === 0) {
      connection.release();
      return res.status(404).json({ error: '채팅 세션을 찾을 수 없습니다' });
    }

    const [messages] = await connection.execute(
      'SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC',
      [sessionId]
    );

    // data 필드를 JSON으로 파싱
    const parsedMessages = messages.map(message => ({
      ...message,
      data: message.data ? JSON.parse(message.data) : null
    }));

    connection.release();
    res.json(parsedMessages);

  } catch (error) {
    console.error('메시지 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 메시지 저장
app.post('/api/chat-sessions/:sessionId/messages', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { sender, text, data } = req.body;
    const connection = await pool.getConnection();
    
    // 세션 소유권 확인
    const [sessions] = await connection.execute(
      'SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?',
      [sessionId, req.user.userId]
    );

    if (sessions.length === 0) {
      connection.release();
      return res.status(404).json({ error: '채팅 세션을 찾을 수 없습니다' });
    }

    // 메시지 저장
    const [result] = await connection.execute(
      'INSERT INTO messages (session_id, sender, text, data) VALUES (?, ?, ?, ?)',
      [sessionId, sender, text, data ? JSON.stringify(data) : null]
    );

    // 세션 업데이트 시간 갱신
    await connection.execute(
      'UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [sessionId]
    );

    connection.release();
    res.status(201).json({ id: result.insertId });

  } catch (error) {
    console.error('메시지 저장 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// AI 서버로 프록시하는 /predict 엔드포인트
app.post('/predict', async (req, res) => {
  try {
    const response = await fetch('http://210.117.143.172:3878/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      throw new Error(`AI 서버 오류: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('AI 서버 프록시 오류:', error);
    res.status(500).json({ 
      error: 'AI 서버와의 통신 중 오류가 발생했습니다',
      details: error.message 
    });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
  initializeDatabase();
}); 