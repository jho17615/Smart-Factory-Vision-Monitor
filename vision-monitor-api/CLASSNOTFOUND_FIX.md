# ClassNotFoundException 해결 가이드

## 🚨 오류 메시지
```
Error: Could not find or load main class com.smartfactory.visionmonitor.VisionMonitorApplication
Caused by: java.lang.ClassNotFoundException
```

## 💡 원인
Maven 빌드가 아직 실행되지 않아서 `.class` 파일이 생성되지 않았습니다.

---

## ✅ 해결 방법 (순서대로 시도)

### 🔥 방법 1: Maven Clean & Install (가장 확실!)

**IntelliJ에서:**
```
1. 우측 Maven 탭 클릭
2. vision-monitor-api → Lifecycle → clean 더블클릭
3. 완료되면 → Lifecycle → install 더블클릭
4. "BUILD SUCCESS" 확인
5. 다시 실행!
```

**또는 터미널에서:**
```bash
cd C:\vision-monitor-api
mvn clean install
```

성공하면 이렇게 출력됩니다:
```
[INFO] BUILD SUCCESS
[INFO] Total time: XX.XXX s
```

---

### 🔥 방법 2: IntelliJ 빌드

```
1. Build → Build Project (Ctrl+F9)
2. 하단에 "Build completed successfully" 확인
3. 다시 실행!
```

---

### 🔥 방법 3: Rebuild Project

```
1. Build → Rebuild Project
2. 빌드 완료 대기
3. 다시 실행!
```

---

### 🔥 방법 4: Maven으로 직접 실행

**Run Configuration 대신 Maven 플러그인 사용:**
```
1. 우측 Maven 탭
2. vision-monitor-api → Plugins → spring-boot
3. spring-boot:run 더블클릭
```

이 방법은 빌드를 자동으로 수행합니다!

---

### 🔥 방법 5: 캐시 삭제 후 재빌드

```
1. File → Invalidate Caches... → Invalidate and Restart
2. IntelliJ 재시작 후
3. 우측 Maven 탭 → Reload 버튼 (새로고침)
4. Maven → Lifecycle → clean → install
5. 실행!
```

---

## 🔍 상세 체크리스트

### ✅ 확인 1: target 폴더가 생성되었나?

**프로젝트 구조 확인:**
```
vision-monitor-api/
├── src/
├── target/  ◀ 이 폴더가 있어야 함!
│   └── classes/
│       └── com/
│           └── smartfactory/
│               └── visionmonitor/
│                   └── VisionMonitorApplication.class  ◀ 이 파일 필요!
├── pom.xml
└── ...
```

**target 폴더가 없거나 비어있으면:**
→ Maven 빌드가 안 된 것입니다!

**해결:**
```bash
mvn clean install
```

### ✅ 확인 2: Maven 의존성이 다운로드되었나?

**확인 방법:**
```
우측 Maven 탭 → vision-monitor-api → Dependencies
```

**다음이 보여야 합니다:**
```
Dependencies
├─ org.springframework.boot:spring-boot-starter-web:3.2.0
├─ org.springframework.boot:spring-boot-starter-data-jpa:3.2.0
├─ com.mysql:mysql-connector-j:8.x.x
├─ org.projectlombok:lombok:1.18.x
└─ ...
```

**Dependencies가 비어있거나 빨간색 오류 표시:**
```
우측 Maven 탭 → 새로고침 버튼 (Reload All Maven Projects)
```

### ✅ 확인 3: 소스 폴더가 제대로 인식되었나?

**프로젝트 트리에서 확인:**
```
src/main/java  ◀ 파란색 폴더 아이콘이어야 함!
```

**회색 폴더면:**
```
1. src/main/java 우클릭
2. Mark Directory as → Sources Root
```

### ✅ 확인 4: Module 설정 확인

```
File → Project Structure (Ctrl+Alt+Shift+S)
→ Modules
→ vision-monitor-api 선택
→ Sources 탭

확인:
✅ src/main/java가 Sources로 표시됨 (파란색)
✅ src/main/resources가 Resources로 표시됨 (보라색)
✅ target 폴더가 Excluded로 표시됨 (빨간색)
```

---

## 🎯 가장 빠른 해결책

### Option A: Maven으로 빌드 후 실행
```bash
# 터미널/cmd에서
cd C:\vision-monitor-api
mvn clean install
mvn spring-boot:run
```

### Option B: IntelliJ Maven 탭 사용
```
1. Maven 탭 열기
2. clean 더블클릭
3. install 더블클릭
4. spring-boot:run 더블클릭
```

### Option C: IntelliJ 빌드 후 실행
```
1. Build → Rebuild Project
2. VisionMonitorApplication 실행
```

---

## 💻 터미널에서 확인

### Maven 설치 확인
```bash
mvn -version
```

**출력 예시:**
```
Apache Maven 3.x.x
Java version: 17.0.x
```

### Maven 빌드 테스트
```bash
cd C:\vision-monitor-api
mvn clean compile
```

**성공 메시지:**
```
[INFO] BUILD SUCCESS
[INFO] Compiling XX source files to target\classes
```

**실패하면:**
- 오류 메시지 확인
- pom.xml 문법 오류 가능성
- 인터넷 연결 확인 (의존성 다운로드 필요)

---

## 🔧 여전히 안 되면?

### 1. 프로젝트 다시 import

```
1. IntelliJ에서 프로젝트 닫기 (File → Close Project)
2. C:\vision-monitor-api 폴더에서 다음 삭제:
   - .idea 폴더
   - target 폴더
   - *.iml 파일
3. IntelliJ 재시작
4. File → Open → pom.xml 파일 선택
5. "Open as Project" 클릭
6. Maven 자동 import 완료 대기
7. Maven → clean → install
8. 실행!
```

### 2. IntelliJ 설정 초기화

```
1. File → Invalidate Caches...
2. 모든 항목 체크
3. Invalidate and Restart
```

### 3. 수동으로 Output 경로 설정

```
File → Project Structure → Modules → vision-monitor-api
→ Paths 탭
→ Compiler output:
  Output path: C:\vision-monitor-api\target\classes
  Test output path: C:\vision-monitor-api\target\test-classes
```

---

## 📋 성공 확인

빌드가 성공하면:

### 1. target 폴더 확인
```
vision-monitor-api/target/classes/com/smartfactory/visionmonitor/
└── VisionMonitorApplication.class  ◀ 이 파일이 생성됨!
```

### 2. 실행 시 출력
```
=========================================
  Vision Monitor API Server Started!
  Port: 8080
  Context Path: /api
=========================================

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
```

---

## ⚡ 가장 추천하는 방법

**바로 이것만 하세요:**

### IntelliJ에서
```
1. 우측 Maven 탭 클릭
2. vision-monitor-api 확장
3. Lifecycle → clean 더블클릭 (기존 빌드 삭제)
4. Lifecycle → install 더블클릭 (새로 빌드)
5. Plugins → spring-boot → spring-boot:run 더블클릭 (실행)
```

### 터미널에서
```bash
cd C:\vision-monitor-api
mvn clean install spring-boot:run
```

한 줄로 끝!

---

## 🎓 왜 이 오류가 발생했나?

1. **`.java` 파일만 있음** → 소스 코드
2. **Maven 빌드 필요** → `.java`를 `.class`로 컴파일
3. **`.class` 파일 생성** → `target/classes/` 폴더에 저장
4. **JVM 실행** → `.class` 파일을 로드해서 실행

빌드를 안 하면 `.class` 파일이 없어서 ClassNotFoundException 발생!

---

지금 바로 시도해보세요:
```
우측 Maven 탭 → Lifecycle → clean → install
```

이것만 하면 99% 해결됩니다! 🚀
