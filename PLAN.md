# 짤-칵! 구현 계획

## 원본 기획서

### 1. 핵심 컨셉
사용자가 문장을 입력하면 AI가 키워드를 뽑고, 외부 사이트의 이미지를 실시간으로 긁어오거나 프록시를 통해 화면에 강제로 띄워주는 No-DB 검색/생성 서비스.

### 2. '핫링크 차단' 해결 전략
| 방법 | 내용 | 적용 대상 |
|------|------|----------|
| 공식 API 활용 | 외부 노출용 전용 URL 제공 | GIPHY, Tenor |
| 이미지 프록시 | wsrv.nl 등 프록시로 차단 우회 | 핀짤, 짤방닷컴 등 |
| OpenGraph 파싱 | 대표 이미지 주소 추출 | 커뮤니티 게시글 |

### 3. 서비스 아키텍처 (No-DB Flow)
1. **입력**: 사용자가 "부장님한테 혼나서 우는 중" 입력
2. **분석**: GPT API가 핵심 키워드(혼남, 우는짤, 억울) 및 영어 키워드(Cry, Scolded) 추출
3. **URL 생성**: API 쿼리 및 검색 결과 페이지 URL 생성
4. **이미지 렌더링**: 프록시 서버 경유 주소를 `<img>` 태그에 삽입
5. **텍스트 합성**: Canvas API로 이미지 위에 문구 덮어씌움

### 4. 주요 기능
- **실시간 짤 보드**: 키워드 수정 시 실시간 새로고침
- **핫링크 프리 뷰어**: 서비스 내 풀스크린 표시 + 텍스트 편집
- **텍스트 오버레이 생성**: 클라이언트에서 이미지+글자 합성 후 다운로드

---

## 구현 계획

### 기술 스택
- **Frontend**: React + Vite
- **AI**: OpenAI API (GPT-3.5-turbo)
- **이미지 프록시**: wsrv.nl (무료)
- **이미지 합성**: html2canvas / Canvas API
- **스타일**: 일반 CSS

### 프로젝트 구조
```
jjal-kak/
├── index.html
├── package.json
├── vite.config.js
├── .env                    # VITE_OPENAI_API_KEY
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── App.css
│   ├── components/
│   │   ├── SearchInput.jsx      # 문장 입력
│   │   ├── KeywordTags.jsx      # 키워드 태그
│   │   ├── ImageGrid.jsx        # 이미지 그리드
│   │   ├── ImageCard.jsx        # 개별 이미지
│   │   └── ImageEditor.jsx      # 텍스트 오버레이 편집기
│   ├── services/
│   │   ├── openai.js            # OpenAI API
│   │   ├── imageProxy.js        # 프록시 URL 생성
│   │   └── imageSources.js      # 이미지 검색
│   └── utils/
│       ├── canvas.js            # Canvas 합성
│       └── download.js          # 다운로드/복사
```

### 구현 단계

#### Step 1: 프로젝트 초기 설정
- Vite + React 프로젝트 생성
- 패키지 설치: `openai`, `html2canvas`
- `.env` 파일에 `VITE_OPENAI_API_KEY` 설정

#### Step 2: 기본 UI 레이아웃
- `App.jsx`: 전체 레이아웃
- `SearchInput.jsx`: 문장 입력창 + 검색 버튼
- `KeywordTags.jsx`: 추출된 키워드 태그 (수정 가능)

#### Step 3: OpenAI 키워드 추출
```js
// services/openai.js
export async function extractKeywords(sentence) {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{
      role: 'user',
      content: `다음 문장에서 짤/밈 검색에 적합한 키워드를 JSON으로 추출:
      형식: { "korean": [], "english": [] }
      문장: "${sentence}"`
    }]
  });
  return JSON.parse(response.choices[0].message.content);
}
```

#### Step 4: 이미지 프록시 설정
```js
// services/imageProxy.js
export function getProxyUrl(originalUrl, options = {}) {
  const params = new URLSearchParams({ url: originalUrl });
  if (options.width) params.set('w', options.width);
  if (options.height) params.set('h', options.height);
  return `https://wsrv.nl/?${params.toString()}`;
}
```

#### Step 5: 이미지 소스 연동
- Lorem Picsum (무료, 테스트용)
- Unsplash Source (무료)
- 추후 국내 사이트 크롤링 추가 가능

#### Step 6: 이미지 그리드 표시
- `ImageGrid.jsx`: 검색 결과 그리드
- `ImageCard.jsx`: 개별 카드 (프록시 URL 사용)

#### Step 7: 이미지 편집기
- `ImageEditor.jsx`: 모달 편집기
- 텍스트 입력/폰트 크기/색상/위치 조절
- Canvas API로 실시간 렌더링

#### Step 8: 다운로드 기능
- `utils/canvas.js`: 이미지+텍스트 합성
- `utils/download.js`: PNG 다운로드, 클립보드 복사

---

## 검증 방법

1. `npm run dev`로 개발 서버 실행
2. 테스트:
   - "부장님한테 혼나서 우는 중" 입력
   - 키워드 추출 확인
   - 이미지 그리드 결과 표시
   - 이미지 클릭 → 편집기
   - 텍스트 입력 → 오버레이
   - 다운로드 → PNG 저장

---

## 참고사항
- **CORS**: wsrv.nl 프록시가 해결
- **API 키 보안**: 프로덕션에서는 백엔드 프록시 권장
- **저작권**: 출처 표기 필수
