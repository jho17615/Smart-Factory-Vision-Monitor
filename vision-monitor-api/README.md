# Smart Factory Vision Monitor - Spring Boot API

## 프로젝트 개요

C# 로컬 데이터 수집 프로그램과 React 웹 대시보드를 연결하는 Spring Boot REST API 서버입니다.

## 시스템 아키텍처

```
┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
│   C# Application    │         │  Spring Boot API    │         │   React Dashboard   │
│   (로컬 PC)          │────────▶│   (서버)             │◀────────│   (웹 브라우저)      │
│                     │         │                     │         │                     │
│ - CSV 파싱          │         │ - REST API 제공     │         │ - 실시간 모니터링   │
│ - 실시간 판정       │         │ - 데이터 조회       │         │ - 원격 제어         │
│ - MySQL 저장        │         │ - CORS 처리         │         │ - 통계 시각화       │
└─────────────────────┘         └─────────────────────┘         └─────────────────────┘
         │                               │
         │                               │
         └───────────────┬───────────────┘
                         ▼
                 ┌──────────────────┐
                 │  MySQL Database  │
                 │                  │
                 │ - measurements   │
                 │ - judgments      │
                 └──────────────────┘
```

## 기술 스택

- **Java**: 17
- **Spring Boot**: 3.2.0
- **Spring Data JPA**: 데이터베이스 접근
- **MySQL Connector**: 8.x
- **Lombok**: 코드 간소화
- **Maven**: 빌드 도구

## 프로젝트 구조

```
vision-monitor-api/
├── src/
│   ├── main/
│   │   ├── java/com/smartfactory/visionmonitor/
│   │   │   ├── VisionMonitorApplication.java      # 메인 애플리케이션
│   │   │   ├── config/
│   │   │   │   └── CorsConfig.java                # CORS 설정
│   │   │   ├── controller/
│   │   │   │   └── ApiController.java             # REST API 컨트롤러
│   │   │   ├── service/
│   │   │   │   ├── StatisticsService.java         # 통계 비즈니스 로직
│   │   │   │   └── MeasurementService.java        # 측정 데이터 로직
│   │   │   ├── repository/
│   │   │   │   ├── MeasurementRepository.java     # 측정값 DB 접근
│   │   │   │   └── JudgmentRepository.java        # 판정 결과 DB 접근
│   │   │   ├── model/
│   │   │   │   ├── Measurement.java               # 측정값 엔티티
│   │   │   │   └── Judgment.java                  # 판정 결과 엔티티
│   │   │   └── dto/
│   │   │       └── DTOs.java                      # 데이터 전송 객체
│   │   └── resources/
│   │       └── application.yml                    # 애플리케이션 설정
│   └── test/
│       └── java/                                  # 테스트 코드
├── pom.xml                                        # Maven 설정
├── frontend-api.js                                # React용 수정된 API 파일
└── README.md                                      # 이 파일
```

## API 엔드포인트

### 1. 실시간 통계 조회
```
GET /api/statistics/latest

Response:
{
  "totalCount": 47234,
  "yieldRate": 96.8,
  "machineStatus": "RUNNING",
  "lastUpdate": "2024-12-03T14:30:00"
}
```

### 2. 최근 측정 데이터 조회
```
GET /api/measurements/recent?limit=100

Response: [
  {
    "id": 1,
    "measureTime": "2024-12-03T14:30:00",
    "itemName": "ITEM-001",
    "measurementName": "vertical_upper_diameter_avg",
    "measurementValue": 46.050,
    "result": "OK"
  },
  ...
]
```

### 3. 항목별 NG 개수 조회
```
GET /api/statistics/ng-by-item

Response:
{
  "UPPER_DIAMETER_AVG": 12,
  "LOWER_DIAMETER_1": 8,
  "LOWER_DIAMETER_2": 7,
  ...
}
```

### 4. 원격 제어 명령 전송
```
POST /api/commands

Request Body:
{
  "commandType": "UPDATE_THRESHOLD",
  "parameters": {
    "item": "vertical_upper_diameter_avg",
    "upperLimit": 46.106,
    "lowerLimit": 45.994
  }
}

Response:
{
  "success": true,
  "message": "명령이 성공적으로 전송되었습니다."
}
```

### 5. 헬스 체크
```
GET /api/health

Response:
{
  "status": "UP",
  "service": "Vision Monitor API"
}
```

## 설치 및 실행

### 1. 사전 요구사항

- JDK 17 이상 설치
- Maven 3.6+ 설치
- MySQL 서버 실행 중 (포트 3306)
- C# 프로그램으로 데이터베이스 테이블 생성됨

### 2. IntelliJ에서 프로젝트 열기

1. IntelliJ IDEA 실행
2. `Open` → `vision-monitor-api` 폴더 선택
3. Maven 프로젝트로 인식되면 자동으로 의존성 다운로드

### 3. 데이터베이스 설정 확인

`src/main/resources/application.yml` 파일에서 데이터베이스 정보 확인:

```yaml
spring:
  datasource:
    url: jdbc:mysql://127.0.0.1:3306/test
    username: jho
    password: 1234
```

### 4. 애플리케이션 실행

#### IntelliJ에서 실행:
1. `VisionMonitorApplication.java` 파일 열기
2. `main` 메서드 좌측의 실행 버튼 클릭
3. 또는 `Run` → `Run 'VisionMonitorApplication'`

#### Maven 명령어로 실행:
```bash
cd vision-monitor-api
mvn clean install
mvn spring-boot:run
```

### 5. 실행 확인

서버가 정상 실행되면 다음 메시지가 출력됩니다:

```
=========================================
  Vision Monitor API Server Started!
  Port: 8080
  Context Path: /api
=========================================
```

브라우저에서 확인:
```
http://localhost:8080/api/health
```

## React 프론트엔드 연결

### 1. api.js 파일 교체

프로젝트의 `frontend-api.js` 파일을 React 프로젝트의 `src/services/api.js`로 복사:

```bash
cp frontend-api.js [React프로젝트경로]/src/services/api.js
```

### 2. React 개발 서버 실행

```bash
cd [React프로젝트경로]
npm run dev
```

React 앱이 `http://localhost:5173`에서 실행됩니다.

### 3. 연동 테스트

1. C# 프로그램으로 CSV 데이터 import 실행
2. Spring Boot API 서버가 데이터베이스에서 데이터를 읽음
3. React 대시보드에서 실시간 데이터 확인

## 개발 팁

### 로그 확인

application.yml의 로깅 레벨 조정:

```yaml
logging:
  level:
    com.smartfactory: DEBUG
    org.springframework.web: INFO
```

### CORS 이슈 발생 시

`CorsConfig.java`에서 허용할 Origin 추가:

```java
.allowedOrigins(
    "http://localhost:5173",
    "http://localhost:3000",
    "http://your-domain.com"
)
```

### 데이터베이스 연결 확인

```bash
mysql -u jho -p1234 -h 127.0.0.1 test
```

```sql
-- 데이터 확인
SELECT COUNT(*) FROM vertical_measurements;
SELECT COUNT(*) FROM quality_judgments;

-- 최근 데이터 조회
SELECT * FROM vertical_measurements ORDER BY created_at DESC LIMIT 10;
```

## 문제 해결

### 1. 포트 8080이 이미 사용 중

application.yml에서 포트 변경:

```yaml
server:
  port: 8081
```

React의 api.js에서도 포트 수정:
```javascript
const API_BASE_URL = 'http://localhost:8081/api';
```

### 2. MySQL 연결 실패

- MySQL 서버 실행 확인
- 사용자 권한 확인
- 방화벽 설정 확인

### 3. JPA 엔티티 매핑 오류

- C# 프로그램의 테이블 구조와 Java 엔티티 클래스가 일치하는지 확인
- 컬럼명의 대소문자 확인 (snake_case vs camelCase)

## 다음 단계

1. **실시간 데이터 푸시**: WebSocket 또는 Server-Sent Events 구현
2. **인증/권한**: Spring Security 추가
3. **캐싱**: Redis를 통한 성능 개선
4. **모니터링**: Spring Boot Actuator 추가
5. **배포**: Docker 컨테이너화, AWS EC2 배포

## 라이선스

이 프로젝트는 학술 프로젝트 용도로 개발되었습니다.

## 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.
