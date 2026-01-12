# 짤-칵! 구현 문서

## 배포 URL
https://kakao-sun-flower.github.io/jjal-kak/

---

## 1. 서비스 개요

### 핵심 컨셉
사용자가 문장을 입력하면 AI가 키워드를 추출하고, 네이버에서 관련 짤 이미지를 검색하여 보여주는 No-DB 클라이언트 기반 서비스.

### 주요 기능
- **2단계 검색 전략**:
  1. 먼저 검색어 + "짤"/"밈"으로 직접 검색
  2. 결과 부족 시 AI 키워드 추출 후 재검색
- **네이버 이미지 검색**: 최대 10개 이미지 표시
- **추천 문구 검색**: 입력 없이 버튼 클릭 시 추천 문구로 자동 검색
- **텍스트 오버레이**: 선택한 이미지에 텍스트 합성
- **다운로드/복사**: PNG 다운로드 및 클립보드 복사
- **헤더 클릭 리셋**: "짤-칵!" 클릭 시 초기 화면으로 복귀

---

## 2. 기술 스택

| 구분 | 기술 | 용도 |
|------|------|------|
| Frontend | React + Vite | SPA 프레임워크 |
| AI | OpenAI API (GPT-3.5-turbo) | 키워드 추출 (로컬 전용) |
| CORS 프록시 | allorigins.win, corsproxy.io | 검색 페이지 HTML 가져오기 |
| 이미지 프록시 | wsrv.nl, images.weserv.nl | 핫링크 차단 우회 |
| 이미지 합성 | Canvas API | 텍스트 오버레이 렌더링 |
| 배포 | GitHub Pages + gh-pages | 정적 호스팅 |
| 스타일 | CSS | 다크 테마 UI |

---

## 3. 서비스 아키텍처

```
[사용자 입력] (또는 추천 문구)
    ↓
[1단계: 직접 검색]
    ├─→ 네이버: "검색어 짤" 검색
    └─→ 네이버: "검색어 밈" 검색
    ↓
[결과 5개 미만?] ──Yes──→ [2단계: 키워드 추출]
    │                         ↓ (로컬: OpenAI / 배포: 폴백)
    │                    [키워드 + "짤"/"밈" 재검색]
    │                         ↓
    └──────No───────→ [결과 합치기 + 중복 제거 (최대 10개)]
    ↓
[이미지 프록시] → 재시도 로직 (wsrv.nl → images.weserv.nl → corsproxy.io)
    ↓
[이미지 그리드 표시]
    ↓
[이미지 편집기] → 텍스트 오버레이 (Canvas)
    ↓
[다운로드/복사] → CORS 실패 시 원본 URL 열기
```

> **참고**: 구글은 CORS 프록시를 차단하여 네이버만 사용합니다.
> 검색 실패 시 구글/DC인사이드/에펨코리아 바로가기 링크를 제공합니다.

---

## 4. 프로젝트 구조

```
jjal-kak/
├── index.html
├── package.json
├── vite.config.js           # base: '/jjal-kak/' (GitHub Pages용)
├── .env                     # VITE_OPENAI_API_KEY (로컬 전용)
├── .gitignore
├── PLAN.md
├── src/
│   ├── main.jsx             # 앱 진입점
│   ├── App.jsx              # 메인 컴포넌트 (헤더 클릭 리셋)
│   ├── App.css              # 전역 스타일 (다크 테마)
│   ├── components/
│   │   ├── SearchInput.jsx  # 문장 입력 폼 (추천 문구 기능)
│   │   ├── KeywordTags.jsx  # 키워드 태그 (수정/삭제/추가)
│   │   ├── ImageGrid.jsx    # 이미지 그리드 컨테이너
│   │   ├── ImageCard.jsx    # 개별 이미지 카드 (재시도 로직)
│   │   └── ImageEditor.jsx  # 텍스트 오버레이 편집기 (CORS 처리)
│   ├── services/
│   │   ├── openai.js        # OpenAI 키워드 추출 + 폴백
│   │   ├── imageProxy.js    # wsrv.nl 프록시 URL 생성
│   │   └── imageSources.js  # 네이버 이미지 검색 + 중복 제거
│   └── utils/
│       └── download.js      # PNG 다운로드, 클립보드 복사
```

---

## 5. 핵심 구현 상세

### 5.1 이미지 검색 (imageSources.js)

#### CORS 프록시 전략
```javascript
const CORS_PROXIES = [
  { name: 'allorigins-json', getUrl: (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}` },
  { name: 'corsproxy-io', getUrl: (url) => `https://corsproxy.io/?${encodeURIComponent(url)}` },
  { name: 'cors-proxy-shs', getUrl: (url) => `https://proxy.cors.sh/${url}` }
]
```

#### URL 정규화 (중복 제거)
```javascript
function normalizeUrl(url) {
  let normalized = url.replace(/^https?:\/\//, '').replace(/^www\./, '')
  normalized = normalized.replace(/[?&](w|h|width|height|size|quality|q|fit|crop|auto|format|f)=[^&]*/gi, '')
  return normalized.toLowerCase()
}
```

### 5.2 이미지 카드 (ImageCard.jsx)

#### 재시도 로직
```javascript
// 실패 시 다른 프록시로 재시도
if (retryCount === 1) {
  setCurrentSrc(`https://images.weserv.nl/?url=${encodeURIComponent(originalUrl)}`)
} else if (retryCount === 2) {
  setCurrentSrc(`https://wsrv.nl/?url=${encodeURIComponent(originalUrl)}`)
}
```

### 5.3 이미지 편집기 (ImageEditor.jsx)

#### CORS 상태 추적
```javascript
const [canvasClean, setCanvasClean] = useState(true)

// CORS 없이 로드된 경우
if (retryCount === 3) {
  setCanvasClean(false)  // 복사/다운로드 제한
  tryLoad(targetUrl, false)
}
```

#### 다운로드/복사 처리
- `canvasClean === true`: 정상 다운로드/복사
- `canvasClean === false`: 원본 URL 열기 (복사 비활성화)

### 5.4 키워드 추출 (openai.js)

#### 로컬 개발 (API 키 있음)
```javascript
const response = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: `...키워드 추출 프롬프트...` }]
})
```

#### 배포 환경 (API 키 없음 - 폴백)
```javascript
function fallbackExtract(sentence) {
  const koreanWords = sentence
    .replace(/[은는이가을를의와과에서로부터까지]/g, ' ')  // 조사 제거
    .split(/\s+/)
    .filter(word => word.length >= 2)
    .slice(0, 5)
  return { korean: koreanWords }
}
```

---

## 6. UI/UX

### 다크 테마 디자인
- 배경: `linear-gradient(135deg, #1a1a2e, #16213e)`
- 주요 색상: 오렌지-레드 그라데이션 (`#f39c12`, `#e74c3c`)
- 반응형: 모바일 768px 브레이크포인트

### 사용자 흐름
1. "짤-칵!" 클릭 → 초기 화면으로 리셋
2. 문장 입력 또는 그냥 "짤 찾기" 클릭 (추천 문구 사용)
3. 키워드 추출 → 태그로 표시 (수정 가능)
4. 네이버 검색 → 최대 10개 이미지 표시
5. 이미지 클릭 → 편집기 모달
6. 텍스트 입력/스타일 조정
7. 다운로드 또는 클립보드 복사

### 검색 실패 시
- "검색 결과를 가져오지 못했습니다" 메시지
- 네이버/구글/DC인사이드/에펨코리아 바로가기 버튼 제공

---

## 7. 실행 방법

### 로컬 개발
```bash
npm install
npm run dev
# http://localhost:5173 접속
```

### 배포
```bash
npm run deploy
# GitHub Pages에 자동 배포
# predeploy에서 API 키 제외: VITE_OPENAI_API_KEY=''
```

### 환경 변수 (.env) - 로컬 전용
```
VITE_OPENAI_API_KEY=your_api_key_here
```
> 배포 시 API 키는 포함되지 않으며, 폴백 키워드 추출 사용

---

## 8. 제한사항 및 참고

### CORS 프록시 한계
- 무료 CORS 프록시 서비스는 불안정할 수 있음
- 구글/빙 등 대형 검색엔진은 프록시 요청을 차단함
- 현재 네이버만 안정적으로 동작
- 일부 이미지는 CORS 제한으로 복사 불가 (다운로드로 대체)

### 저작권
- 검색된 이미지의 저작권은 원저작자에게 있음
- 출처 표기 (이미지 편집기에 소스 링크 표시)

### API 키 보안
- 클라이언트 전용 서비스로 API 키 노출 위험
- 배포 환경에서는 API 키 미포함 (폴백 사용)
- 프로덕션에서는 서버리스 함수 권장

---

## 9. 향후 개선 가능 사항
- 서버리스 함수로 OpenAI API 호출 (Cloudflare Workers 등)
- 자체 백엔드 프록시 서버 구축
- 이미지 캐싱
- 더 많은 검색 소스 추가
- 사용자 즐겨찾기 기능 (로컬스토리지)
