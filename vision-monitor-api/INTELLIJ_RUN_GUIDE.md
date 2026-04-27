# IntelliJ 실행 버튼이 안 보일 때 해결 방법

## 🚨 문제: 실행 버튼이 비활성화되거나 안 보임

## ✅ 해결 방법

### 방법 1: Maven 프로젝트로 인식시키기 (가장 중요!)

1. **프로젝트를 다시 import:**
   ```
   File → Close Project
   File → Open → pom.xml 파일 직접 선택 (폴더가 아닌 pom.xml!)
   → "Open as Project" 선택
   ```

2. **Maven 자동 import 활성화:**
   ```
   File → Settings (Ctrl+Alt+S)
   → Build, Execution, Deployment → Build Tools → Maven
   → ✅ "Import Maven projects automatically" 체크
   ```

3. **Maven 새로고침:**
   ```
   View → Tool Windows → Maven (우측 탭)
   → 새로고침 아이콘 클릭 (Reload All Maven Projects)
   ```

### 방법 2: Run Configuration 직접 만들기

1. **상단 메뉴바에서:**
   ```
   Run → Edit Configurations...
   ```

2. **+ 버튼 클릭 → Application 선택**

3. **다음 정보 입력:**
   ```
   Name: VisionMonitorApplication
   
   Build and run:
   - Java: 17 선택
   - -cp: vision-monitor-api 선택
   
   Main class: 
   com.smartfactory.visionmonitor.VisionMonitorApplication
   (또는 ... 버튼 클릭해서 찾기)
   
   Working directory:
   $MODULE_WORKING_DIR$
   
   Use classpath of module:
   vision-monitor-api
   ```

4. **Apply → OK**

5. **이제 상단에 실행 버튼이 보입니다!**

### 방법 3: Spring Boot Maven Plugin으로 실행

**Maven 탭 사용:**
```
우측 Maven 탭 열기
→ vision-monitor-api 
→ Plugins 
→ spring-boot 
→ spring-boot:run 더블클릭
```

또는 **터미널에서:**
```bash
mvn spring-boot:run
```

### 방법 4: main 메서드에서 직접 실행

1. **VisionMonitorApplication.java 파일 열기**

2. **main 메서드 옆에 녹색 실행 아이콘이 보이는지 확인**
   ```java
   public static void main(String[] args) {  // ◀ 여기 왼쪽에 녹색 ▶ 아이콘
   ```

3. **아이콘이 안 보이면:**
   - 파일 우클릭 → "Run 'VisionMonitorApplication.main()'"
   - 또는 Ctrl+Shift+F10

### 방법 5: JDK 설정 확인

**가장 흔한 원인: JDK가 제대로 설정 안 됨**

1. **File → Project Structure (Ctrl+Alt+Shift+S)**

2. **Project Settings → Project**
   ```
   SDK: 17 (java version "17.0.x")
   Language level: 17 - Sealed types...
   ```
   
   **17이 없으면:**
   - New... → Add JDK... → JDK 17 설치 경로 선택

3. **Project Settings → Modules**
   ```
   vision-monitor-api 선택
   → Sources 탭
   → Language level: 17 선택
   ```

4. **Apply → OK**

### 방법 6: 프로젝트 다시 빌드

```
Build → Rebuild Project
```

빌드 완료 후 실행 버튼이 활성화됩니다.

---

## 🔍 체크리스트

실행이 안 되면 다음을 순서대로 확인:

- [ ] **Maven 프로젝트로 인식됨?**
  - 우측에 Maven 탭이 보이고
  - vision-monitor-api → Dependencies가 보임

- [ ] **JDK 17 설정됨?**
  - File → Project Structure → Project → SDK: 17

- [ ] **소스 폴더 인식됨?**
  - src/main/java가 파란색 폴더 아이콘
  - 회색이면 Mark Directory as → Sources Root

- [ ] **Spring Boot 의존성 다운로드 완료?**
  - 우측 하단에 다운로드 진행 중이 아닌지 확인
  - Maven 탭 → Reload 후 완료될 때까지 대기

---

## 💡 가장 빠른 해결책

### Option A: pom.xml로 다시 열기

```
1. IntelliJ에서 프로젝트 닫기 (File → Close Project)
2. File → Open
3. pom.xml 파일 직접 선택 (vision-monitor-api/pom.xml)
4. "Open as Project" 클릭
5. Maven import 완료 대기 (우측 하단 진행바)
6. VisionMonitorApplication.java 열기
7. main 메서드 옆 녹색 ▶ 클릭
```

### Option B: Maven으로 바로 실행

```
1. 우측 Maven 탭 클릭
2. vision-monitor-api → Plugins → spring-boot → spring-boot:run 더블클릭
```

### Option C: 터미널 사용

```bash
cd C:\vision-monitor-api
mvn clean install
mvn spring-boot:run
```

---

## 🎯 스크린샷으로 확인해야 할 부분

### 1. Maven 탭 (우측)
```
Maven
└─ vision-monitor-api
   ├─ Lifecycle
   ├─ Plugins
   │  └─ spring-boot
   │     └─ spring-boot:run ◀ 이것 더블클릭!
   └─ Dependencies
      ├─ spring-boot-starter-web
      ├─ spring-boot-starter-data-jpa
      └─ mysql-connector-j
```

### 2. 프로젝트 구조 (좌측)
```
vision-monitor-api
└─ src
   └─ main
      └─ java (파란색 폴더) ◀ 파란색이어야 함!
         └─ com.smartfactory.visionmonitor
            └─ VisionMonitorApplication ◀ 여기에 main이 있음
```

### 3. 상단 Run Configuration
```
[VisionMonitorApplication] ▼  | ▶ (녹색 실행 버튼) | ⏸ (정지)
```

이 부분이 보여야 정상입니다!

---

## 🔧 여전히 안 되면?

### 방법 1: IntelliJ 캐시 삭제
```
File → Invalidate Caches...
→ Invalidate and Restart
```

### 방법 2: .idea 폴더 삭제 후 재import
```
1. IntelliJ 종료
2. vision-monitor-api/.idea 폴더 삭제
3. vision-monitor-api/target 폴더 삭제
4. IntelliJ 재시작
5. File → Open → pom.xml 선택
```

### 방법 3: IntelliJ 플러그인 확인
```
File → Settings → Plugins
→ 설치됨 확인:
  ✅ Maven
  ✅ Spring Boot
  ✅ Lombok
```

---

## 📋 정상 실행 시 출력

성공하면 콘솔에 이렇게 출력됩니다:

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
 :: Spring Boot ::                (v3.2.0)

... 시작 로그 ...

Started VisionMonitorApplication in X.XXX seconds
```

---

## 💬 어디가 막혔나요?

다음 중 어떤 상황인가요?

1. **Maven 탭이 안 보임** → View → Tool Windows → Maven
2. **JDK 17이 없음** → JDK 17 다운로드 필요
3. **main 메서드 옆 실행 버튼 안 보임** → 위의 방법 2로 Run Configuration 생성
4. **빌드는 되는데 실행 안 됨** → Run Configuration 확인
5. **아무것도 안 보임** → pom.xml로 다시 열기 (방법 1)

구체적으로 어떤 상황인지 알려주시면 더 정확히 도와드리겠습니다!
