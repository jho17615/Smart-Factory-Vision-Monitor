# Smart Factory Vision Monitor Dashboard

스마트 공장 비전 모니터링 시스템의 웹 대시보드

## 프로젝트 구조

```
smart-factory-dashboard/
├── public/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx
│   │   ├── StatisticsCard.jsx
│   │   ├── SimpleChart.jsx
│   │   ├── MeasurementTable.jsx
│   │   └── ControlPanel.jsx
│   ├── services/
│   │   └── api.js
│   ├── styles/
│   │   ├── index.css
│   │   ├── App.css
│   │   ├── Dashboard.css
│   │   └── StatisticsCard.css
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
└── package.json
```

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

서버가 실행되면 브라우저에서 `http://localhost:3000` 으로 접속합니다.

### 3. 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 폴더에 생성됩니다.

### 4. 프리뷰 실행

```bash
npm run preview
```

## 주요 기능

### 📊 실시간 모니터링
- 오늘 생산량
- 현재 수율
- NG 개수
- 장비 상태

### 📈 데이터 시각화
- 시간대별 수율 추이 차트
- 항목별 NG 현황

### 🎛️ 원격 제어
- 측정 기준값 조절 (상한/하한)
- 샘플링 속도 조절
- 데이터 수집 간격 조절
- 데이터 수집 시작/중지

### 📋 데이터 테이블
- 최근 측정 데이터 표시
- 페이지네이션
- OK/NG 결과 색상 구분

## Spring Boot API 연동

현재는 Mock 데이터를 사용하고 있습니다. 
실제 Spring Boot API와 연동하려면 `src/services/api.js` 파일의 주석 처리된 부분을 활성화하세요.

```javascript
// 예시: 실시간 통계 조회
export const getRealtimeStatistics = async () => {
  const response = await fetch('/api/statistics/latest');
  return response.json();
};
```

## 모바일 최적화

- 반응형 디자인 (모바일, 태블릿, 데스크톱 지원)
- 터치 최적화 (버튼 최소 높이 44px)
- 부드러운 스크롤
- 가로/세로 모드 지원

## 기술 스택

- React 18
- Vite 5
- CSS Modules
- SVG Charts (순수 SVG, 라이브러리 없음)

## 개발자

- jho (Smart Factory Vision Monitor Project)
