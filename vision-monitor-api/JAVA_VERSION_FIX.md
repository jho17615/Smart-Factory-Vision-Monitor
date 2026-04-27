# Java 버전 오류 해결 가이드

## 🚨 오류: java.lang.ExceptionInInitializerError

이 오류는 **IntelliJ의 Java 버전 설정**과 **프로젝트 Java 버전**이 일치하지 않을 때 발생합니다.

## ✅ 해결 방법

### 1단계: 설치된 JDK 확인

**IntelliJ에서 확인:**
```
File → Project Structure → Project Settings → Project
→ SDK 항목 확인
```

**17이 없으면 다운로드:**
- Oracle JDK 17: https://www.oracle.com/java/technologies/downloads/#java17
- 또는 OpenJDK 17: https://adoptium.net/

### 2단계: IntelliJ 프로젝트 설정

#### 방법 1: File → Project Structure에서 설정

1. **File → Project Structure** (Ctrl+Alt+Shift+S)
2. **Project Settings → Project**
   - SDK: `17` 선택
   - Language level: `17 - Sealed types, always-strict floating-point semantics` 선택
3. **Project Settings → Modules**
   - `vision-monitor-api` 선택
   - Language level: `17` 선택
4. **Platform Settings → SDKs**
   - JDK 17이 있는지 확인
   - 없으면 `+` 버튼으로 추가

#### 방법 2: Settings에서 컴파일러 설정

1. **File → Settings** (Ctrl+Alt+S)
2. **Build, Execution, Deployment → Compiler → Java Compiler**
   - Project bytecode version: `17` 선택
   - Per-module bytecode version도 모두 `17`로 설정

### 3단계: Maven 설정 새로고침

1. **우측 Maven 탭** 클릭
2. **새로고침 아이콘** (Reload All Maven Projects) 클릭
3. Maven이 의존성을 다시 다운로드할 때까지 대기

### 4단계: IntelliJ 캐시 삭제 (필요시)

```
File → Invalidate Caches... → Invalidate and Restart
```

### 5단계: 다시 빌드

```
Build → Rebuild Project
```

---

## 🔍 상세 체크리스트

### ✅ 확인 사항 1: JDK 설치 확인

**터미널/cmd에서 확인:**
```bash
java -version
```

**예상 출력:**
```
java version "17.0.x"
OpenJDK Runtime Environment (build 17.0.x+x)
```

**17이 아니면:**
- JDK 17 다운로드: https://adoptium.net/temurin/releases/?version=17
- Windows: 설치 후 `JAVA_HOME` 환경변수 설정

### ✅ 확인 사항 2: IntelliJ SDK 설정

```
File → Project Structure → Platform Settings → SDKs
```

**JDK 17이 목록에 있어야 함:**
```
17 (java version "17.0.x")
  ├─ /usr/lib/jvm/java-17-openjdk  (Linux)
  ├─ C:\Program Files\Java\jdk-17   (Windows)
  └─ /Library/Java/JavaVirtualMachines/jdk-17.jdk  (Mac)
```

**없으면 추가:**
1. `+` 버튼 클릭
2. `Add JDK...` 선택
3. JDK 17 설치 경로 선택

### ✅ 확인 사항 3: pom.xml 확인

파일 내용 확인:
```xml
<properties>
    <java.version>17</java.version>
    <maven.compiler.source>17</maven.compiler.source>
    <maven.compiler.target>17</maven.compiler.target>
</properties>
```

### ✅ 확인 사항 4: .idea 설정 확인

**`.idea/misc.xml`:**
```xml
<component name="ProjectRootManager" version="2" languageLevel="JDK_17" default="true" project-jdk-name="17" project-jdk-type="JavaSDK">
```

**`.idea/compiler.xml`:**
```xml
<component name="CompilerConfiguration">
  <bytecodeTargetLevel target="17" />
</component>
```

---

## 🔧 여전히 안 되면?

### 옵션 1: 프로젝트 재import

1. IntelliJ 종료
2. `.idea` 폴더 삭제
3. IntelliJ 재시작
4. `File → Open` → `pom.xml` 파일 직접 선택
5. "Open as Project" 선택

### 옵션 2: Maven 명령어로 빌드 테스트

```bash
# 프로젝트 디렉토리에서
mvn clean install

# 정상 빌드되면
mvn spring-boot:run
```

**Maven이 정상 빌드되면** IntelliJ 설정 문제입니다.

### 옵션 3: Lombok 플러그인 확인

```
File → Settings → Plugins → "Lombok" 검색 → 설치
```

설치 후 IntelliJ 재시작

### 옵션 4: Annotation Processing 활성화

```
File → Settings → Build, Execution, Deployment 
  → Compiler → Annotation Processors
  → ✅ Enable annotation processing 체크
```

---

## 📋 최종 확인 체크리스트

완료되면 체크:

- [ ] JDK 17 설치됨 (`java -version`으로 확인)
- [ ] IntelliJ Project Structure → SDK가 17
- [ ] IntelliJ Project Structure → Language level이 17
- [ ] IntelliJ Settings → Java Compiler → Project bytecode version이 17
- [ ] Maven 프로젝트 새로고침 완료
- [ ] Lombok 플러그인 설치됨
- [ ] Annotation Processing 활성화됨
- [ ] `Build → Rebuild Project` 성공

모두 체크했는데도 안 되면:
```
File → Invalidate Caches... → Invalidate and Restart
```

---

## 🎯 빠른 해결 (요약)

```
1. File → Project Structure → Project → SDK: 17 선택
2. File → Settings → Java Compiler → Project bytecode: 17
3. Maven 탭 → 새로고침 아이콘 클릭
4. Build → Rebuild Project
5. Run → VisionMonitorApplication
```

이제 정상 실행됩니다! 🚀

---

## 💡 추가 팁

### Windows에서 여러 Java 버전 관리

**JAVA_HOME 환경변수 설정:**
```
시스템 속성 → 고급 → 환경 변수 → 시스템 변수
→ JAVA_HOME = C:\Program Files\Java\jdk-17
→ Path에 %JAVA_HOME%\bin 추가
```

### Mac에서 여러 Java 버전 관리

**~/.zshrc 또는 ~/.bash_profile:**
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

### Maven Wrapper 사용 (권장)

프로젝트에 Maven Wrapper 추가하면 Java 버전 문제 최소화:
```bash
mvn wrapper:wrapper
./mvnw spring-boot:run  # Unix/Mac
mvnw.cmd spring-boot:run  # Windows
```

---

문제가 계속되면 IntelliJ의 **Help → Show Log in Explorer**에서 로그 파일을 확인하세요.
