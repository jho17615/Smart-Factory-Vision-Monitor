# Vision Monitor API - 빠른 시작 가이드

## ⚡ 5분 안에 시작하기

### 1단계: IntelliJ에서 프로젝트 열기 (1분)

```
1. IntelliJ IDEA 실행
2. File → Open → vision-monitor-api 폴더 선택
3. Maven 의존성 자동 다운로드 대기 (우측 하단 진행상황 확인)
```

### 2단계: MySQL 연결 확인 (1분)

**현재 설정:**
- 호스트: 127.0.0.1
- 포트: 3306
- 데이터베이스: test
- 사용자: jho
- 비밀번호: 1234

**변경이 필요하면:**
`src/main/resources/application.yml` 파일 수정

### 3단계: 실행하기 (1분)

**방법 1: IntelliJ에서 실행**
```
VisionMonitorApplication.java → 우클릭 → Run
```

**방법 2: 터미널에서 실행**
```bash
cd vision-monitor-api
mvn spring-boot:run
```

### 4단계: 동작 확인 (1분)

브라우저에서 접속:
```
http://localhost:8080/api/health
```

응답 확인:
```json
{
  "status": "UP",
  "service": "Vision Monitor API"
}
```

### 5단계: React 연결 (1분)

1. `frontend-api.js` 파일을 React 프로젝트로 복사:
   ```bash
   cp frontend-api.js [React프로젝트]/src/services/api.js
   ```

2. React 개발 서버 실행:
   ```bash
   npm run dev
   ```

## ✅ 전체 시스템 테스트

### 테스트 시나리오

1. **C# 프로그램 실행** → CSV 파일 import
2. **Spring Boot API 확인** → 로그에서 데이터 조회 확인
3. **React 대시보드 열기** → 실시간 데이터 표시 확인

### API 테스트 (Postman 또는 curl)

```bash
# 1. 통계 조회
curl http://localhost:8080/api/statistics/latest

# 2. 최근 측정 데이터
curl http://localhost:8080/api/measurements/recent?limit=10

# 3. NG 통계
curl http://localhost:8080/api/statistics/ng-by-item

# 4. 명령 전송
curl -X POST http://localhost:8080/api/commands \
  -H "Content-Type: application/json" \
  -d '{"commandType":"TEST","parameters":{}}'
```

## 🔧 주요 설정 파일

### application.yml
```yaml
server:
  port: 8080              # API 서버 포트

spring:
  datasource:
    url: jdbc:mysql://127.0.0.1:3306/test
    username: jho         # MySQL 사용자명
    password: 1234        # MySQL 비밀번호
```

### React api.js
```javascript
const API_BASE_URL = 'http://localhost:8080/api';
```

## 🐛 문제 해결

### 문제 1: 포트 8080이 이미 사용 중
```yaml
# application.yml에서 변경
server:
  port: 8081
```

### 문제 2: MySQL 연결 실패
```bash
# MySQL 서버 실행 확인
systemctl status mysql

# 또는
mysql -u jho -p1234 -h 127.0.0.1
```

### 문제 3: CORS 오류
```java
// CorsConfig.java에 Origin 추가
.allowedOrigins("http://localhost:5173", "http://your-domain")
```

### 문제 4: 데이터가 안 보임
```sql
-- MySQL에서 데이터 확인
SELECT COUNT(*) FROM vertical_measurements;
SELECT * FROM vertical_measurements ORDER BY created_at DESC LIMIT 5;
```

## 📊 로그 확인

### IntelliJ 콘솔
실행 중 로그가 실시간으로 표시됩니다:
```
2024-12-03 14:30:00 - GET /api/statistics/latest - 실시간 통계 조회 요청
2024-12-03 14:30:00 - 통계 조회 완료 - 총: 100, OK: 95, NG: 5
```

### 로그 레벨 조정
```yaml
# application.yml
logging:
  level:
    com.smartfactory: DEBUG    # 자세한 로그
    com.smartfactory: INFO     # 일반 로그
    com.smartfactory: WARN     # 경고만
```

## 🚀 성능 최적화 팁

1. **데이터베이스 인덱스 확인**
   - C# 프로그램이 이미 생성한 인덱스 사용

2. **JPA 쿼리 최적화**
   - `show-sql: true`로 실행되는 SQL 확인
   - N+1 문제 주의

3. **커넥션 풀 설정**
   ```yaml
   spring:
     datasource:
       hikari:
         maximum-pool-size: 10
   ```

## 📁 프로젝트 구조 요약

```
vision-monitor-api/
├── pom.xml                    # Maven 설정 (의존성)
├── application.yml            # 앱 설정 (DB, 포트)
├── VisionMonitorApplication   # 메인 클래스
├── controller/ApiController   # REST API 엔드포인트
├── service/                   # 비즈니스 로직
│   ├── StatisticsService      # 통계 계산
│   └── MeasurementService     # 데이터 조회
├── repository/                # DB 접근
│   ├── MeasurementRepository
│   └── JudgmentRepository
└── model/                     # 엔티티 (테이블 매핑)
    ├── Measurement
    └── Judgment
```

## 🎯 다음에 할 일

1. ✅ Spring Boot API 실행
2. ✅ React 연결
3. ⬜ 실시간 데이터 업데이트 (WebSocket)
4. ⬜ 사용자 인증 추가
5. ⬜ AWS 배포

## 💡 개발 모드 vs 운영 모드

### 개발 모드 (현재)
- 포트: 8080
- 로그: DEBUG 레벨
- CORS: 모든 로컬호스트 허용
- Hot reload: Spring DevTools

### 운영 모드 (나중에)
- 포트: 80 또는 443
- 로그: WARN 레벨
- CORS: 특정 도메인만
- Docker + AWS EC2

## 📞 도움말

문제가 계속되면:
1. IntelliJ 콘솔 로그 확인
2. MySQL 접속 테스트
3. 포트 충돌 확인
4. README.md의 상세 가이드 참고
