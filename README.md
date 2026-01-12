# 짤-칵! 구현 문서

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

---

## 2. 기술 스택

| 구분 | 기술 | 용도 |
|------|------|------|
| Frontend | React + Vite | SPA 프레임워크 |
| AI | OpenAI API (GPT-3.5-turbo) | 키워드 추출 |
| CORS 프록시 | allorigins.win | 검색 페이지 HTML 가져오기 |
| 이미지 프록시 | wsrv.nl | 핫링크 차단 우회 |
| 이미지 합성 | html2canvas | 텍스트 오버레이 렌더링 |
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
[결과 5개 미만?] ──Yes──→ [2단계: AI 키워드 추출]
    │                         ↓
    │                    [키워드 + "짤"/"밈" 재검색]
    │                         ↓
    └──────No───────→ [결과 합치기 (최대 10개)]
    ↓
[이미지 프록시 (wsrv.nl)] → 핫링크 우회
    ↓
[이미지 그리드 표시]
    ↓
[이미지 편집기] → 텍스트 오버레이
    ↓
[다운로드/복사]
```

> **참고**: 구글은 CORS 프록시를 차단하여 네이버만 사용합니다.
> 검색 실패 시 구글/DC인사이드/에펨코리아 바로가기 링크를 제공합니다.

---

## 4. 프로젝트 구조

```
20260112/
├── index.html
├── package.json
├── vite.config.js
├── .env                         # VITE_OPENAI_API_KEY
├── src/
│   ├── main.jsx                 # 앱 진입점
│   ├── App.jsx                  # 메인 컴포넌트
│   ├── App.css                  # 전역 스타일 (다크 테마)
│   ├── components/
│   │   ├── SearchInput.jsx      # 문장 입력 폼 (추천 문구 기능 포함)
│   │   ├── KeywordTags.jsx      # 키워드 태그 (수정/삭제/추가)
│   │   ├── ImageGrid.jsx        # 이미지 그리드 컨테이너
│   │   ├── ImageCard.jsx        # 개별 이미지 카드
│   │   ├── ImageEditor.jsx      # 텍스트 오버레이 편집기
│   │   ├── KoreanSiteLinks.jsx  # 한국 사이트 바로가기
│   │   └── SourceTabs.jsx       # 소스 탭 (미사용)
│   ├── services/
│   │   ├── openai.js            # OpenAI 키워드 추출
│   │   ├── imageProxy.js        # wsrv.nl 프록시 URL 생성
│   │   └── imageSources.js      # 네이버 이미지 검색
│   └── utils/
│       ├── canvas.js            # Canvas 이미지+텍스트 합성
│       └── download.js          # PNG 다운로드, 클립보드 복사
```

---

## 5. 핵심 구현 상세

### 5.1 이미지 검색 (imageSources.js)

#### CORS 프록시 전략
```javascript
const CORS_PROXIES = [
  {
    name: 'allorigins-json',
    getUrl: (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    parseResponse: async (response) => {
      const json = await response.json()
      return json.contents
    }
  },
  // 백업 프록시들...
]
```

#### 네이버 검색
- 검색 URL: `https://search.naver.com/search.naver?where=image&query={검색어}+짤` 또는 `+밈`
- 파싱 패턴:
  - `search.pstatic.net/common/?src=...` 형식에서 원본 URL 추출
  - `"thumb":"..."`, `"originalUrl":"..."` JSON 패턴
- 결과: 랜덤으로 최대 10개 선택

### 5.2 이미지 프록시 (imageProxy.js)

```javascript
export function getProxyUrl(originalUrl, options = {}) {
  const params = new URLSearchParams({ url: originalUrl })
  if (options.width) params.set('w', options.width)
  if (options.height) params.set('h', options.height)
  return `https://wsrv.nl/?${params.toString()}`
}
```

### 5.3 키워드 추출 (openai.js)

```javascript
// OpenAI API 호출 (한국어 키워드만 추출)
const response = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [{
    role: 'user',
    content: `다음 문장에서 짤/밈 검색에 적합한 한국어 키워드를 추출...`
  }]
})
// 응답: {"korean": ["키워드1", "키워드2"]}

// API 키 없을 경우 폴백: 조사 제거 후 단어 추출
```

### 5.4 추천 문구 검색 (SearchInput.jsx)

```javascript
const PLACEHOLDERS = [
  '부장님한테 혼나서 우는 중',
  '월요일 출근하기 싫어',
  '퇴근하고 싶다',
  '배고파 죽겠어',
  '커피 없이 못 살아'
]

// 입력 없이 버튼 클릭 시 placeholder로 검색
const searchText = input.trim() || placeholder
```

---

## 6. UI/UX

### 다크 테마 디자인
- 배경: `linear-gradient(135deg, #1a1a2e, #16213e)`
- 주요 색상: 오렌지-레드 그라데이션 (`#f39c12`, `#e74c3c`)
- 반응형: 모바일 768px 브레이크포인트

### 사용자 흐름
1. 문장 입력 또는 그냥 "짤 찾기" 클릭 (추천 문구 사용)
2. AI 키워드 추출 → 태그로 표시 (수정 가능)
3. 네이버 검색 → 최대 6개 이미지 표시
4. 이미지 클릭 → 편집기 모달
5. 텍스트 입력/스타일 조정
6. 다운로드 또는 클립보드 복사

### 검색 실패 시
- "검색 결과를 가져오지 못했습니다" 메시지
- 네이버/구글/DC인사이드/에펨코리아 바로가기 버튼 제공

---

## 7. 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:5173 접속
```

### 환경 변수 (.env)
```
VITE_OPENAI_API_KEY=your_api_key_here
```
> API 키가 없어도 기본 키워드 추출 기능으로 동작

---

## 8. 제한사항 및 참고

### CORS 프록시 한계
- 무료 CORS 프록시 서비스는 불안정할 수 있음
- 구글/빙 등 대형 검색엔진은 프록시 요청을 차단함
- 현재 네이버만 안정적으로 동작
- 프로덕션에서는 자체 백엔드 프록시 권장

### 저작권
- 검색된 이미지의 저작권은 원저작자에게 있음
- 출처 표기 권장 (이미지 카드에 소스 표시)

### 향후 개선 가능 사항
- 자체 백엔드 프록시 서버 구축 (구글 검색 지원)
- 이미지 캐싱
- 더 많은 검색 소스 추가
- 사용자 즐겨찾기 기능 (로컬스토리지)
