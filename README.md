# 의사PT - 환자 중증도 추론 시스템

의료 데이터를 기반으로 환자의 중증도를 추론하는 AI 시스템입니다.

## 주요 기능

- 🔐 **사용자 인증**: 로그인/회원가입 기능
- 💬 **채팅 인터페이스**: 직관적인 대화형 인터페이스
- 📊 **데이터 시각화**: 환자 데이터 차트 및 분석 결과 표시
- 💾 **대화 저장**: 채팅 세션 저장 및 불러오기
- 🤖 **AI 분석**: 환자 중증도 추론 및 특징 중요도 분석

## 기술 스택

### Frontend
- React 19
- Material-UI (MUI)
- JavaScript (ES6+)

### Backend
- Node.js
- Express.js
- MySQL
- JWT 인증
- bcryptjs (비밀번호 해시화)

## 설치 및 설정

### 1. 저장소 클론
```bash
git clone <repository-url>
cd doctor-pt
```

### 2. 의존성 설치
```bash
npm install
```

### 3. MySQL 데이터베이스 설정

1. MySQL 서버가 실행 중인지 확인
2. `doctor_pt` 데이터베이스 생성:
```sql
CREATE DATABASE doctor_pt;
```

### 4. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가:

```env
# 데이터베이스 설정
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=doctor_pt

# JWT 설정
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# 서버 설정
PORT=5000
```

### 5. 데이터베이스 테이블 생성

서버를 처음 실행하면 자동으로 필요한 테이블들이 생성됩니다:

- `users`: 사용자 정보
- `chat_sessions`: 채팅 세션 정보
- `messages`: 메시지 내용

## 실행 방법

### 개발 모드 (프론트엔드 + 백엔드 동시 실행)
```bash
npm run dev
```

### 개별 실행

**백엔드 서버만 실행:**
```bash
npm run server
```

**프론트엔드만 실행:**
```bash
npm start
```

### 환경 설정

1. `.env` 파일을 생성하고 데이터베이스 정보를 설정:
```bash
cp env.example .env
```

2. `.env` 파일에서 MySQL 연결 정보 수정:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=doctor_pt
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
```

### 프로덕션 빌드
```bash
npm run build
```

## API 엔드포인트

### 인증
- `POST /api/register` - 회원가입
- `POST /api/login` - 로그인

### 채팅 세션
- `GET /api/chat-sessions` - 채팅 세션 목록 조회
- `POST /api/chat-sessions` - 새 채팅 세션 생성
- `GET /api/chat-sessions/:sessionId/messages` - 세션 메시지 조회
- `POST /api/chat-sessions/:sessionId/messages` - 메시지 저장

### 예측
- `POST /predict` - 환자 중증도 추론

## 사용 방법

1. **회원가입/로그인**: 우측 상단의 로그인 버튼을 클릭하여 계정을 생성하거나 로그인
2. **새 대화 시작**: 사이드바의 "새 대화 시작" 버튼 클릭
3. **질문 입력**: 환자에 관한 질문을 입력하고 전송
4. **결과 확인**: AI가 분석한 중증도 점수, 특징 중요도, 분석 리포트 확인
5. **대화 저장**: 로그인한 사용자의 대화는 자동으로 저장됨
6. **이전 대화 불러오기**: 사이드바에서 이전 채팅 세션 선택

## 데이터베이스 스키마

### users 테이블
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### chat_sessions 테이블
```sql
CREATE TABLE chat_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) DEFAULT '새 대화',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### messages 테이블
```sql
CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  sender ENUM('user', 'assistant') NOT NULL,
  text TEXT NOT NULL,
  data JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);
```

## 보안

- 비밀번호는 bcryptjs로 해시화되어 저장
- JWT 토큰을 통한 인증
- SQL 인젝션 방지를 위한 prepared statements 사용
- CORS 설정으로 보안 강화

## 문제 해결

### MySQL 연결 오류
- MySQL 서버가 실행 중인지 확인
- 데이터베이스 접속 정보가 올바른지 확인
- `.env` 파일의 설정값 확인

### 포트 충돌
- 5000번 포트가 사용 중인 경우 `.env` 파일에서 `PORT` 변경

### 빌드 오류
- `npm install` 재실행
- node_modules 폴더 삭제 후 재설치

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
