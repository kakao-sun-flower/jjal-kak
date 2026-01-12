import { getProxyUrl } from './imageProxy'

// 한국 짤 사이트 검색 링크 생성
export function getKoreanSiteLinks(keywords) {
  const query = keywords.join(' ')
  const encodedQuery = encodeURIComponent(query)

  return [
    {
      id: 'naver-image',
      name: '네이버 이미지',
      url: `https://search.naver.com/search.naver?where=image&query=${encodedQuery}+짤`,
      icon: '🟢'
    },
    {
      id: 'google-image-kr',
      name: '구글 이미지',
      url: `https://www.google.com/search?q=${encodedQuery}+짤&tbm=isch&hl=ko`,
      icon: '🔵'
    },
    {
      id: 'dcinside',
      name: 'DC인사이드',
      url: `https://search.dcinside.com/combine/q/${encodedQuery}`,
      icon: '🟠'
    },
    {
      id: 'fmkorea',
      name: '에펨코리아',
      url: `https://www.fmkorea.com/search.php?mid=home&search_keyword=${encodedQuery}`,
      icon: '🔴'
    }
  ]
}

// CORS 프록시 목록 (여러 개 시도)
const CORS_PROXIES = [
  {
    name: 'allorigins-json',
    getUrl: (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    parseResponse: async (response) => {
      const json = await response.json()
      return json.contents
    }
  },
  {
    name: 'corsproxy-io',
    getUrl: (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    parseResponse: async (response) => response.text()
  },
  {
    name: 'cors-proxy-shs',
    getUrl: (url) => `https://proxy.cors.sh/${url}`,
    parseResponse: async (response) => response.text()
  }
]

// 여러 프록시 시도
async function fetchWithProxy(url) {
  console.log(`원본 URL: ${url}`)

  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxy = CORS_PROXIES[i]
    try {
      const proxyUrl = proxy.getUrl(url)
      console.log(`프록시 [${proxy.name}] 시도...`)

      const response = await fetch(proxyUrl, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'x-cors-api-key': 'temp_' + Math.random().toString(36).substring(7)
        }
      })

      console.log(`프록시 [${proxy.name}] 응답 상태: ${response.status}`)

      if (response.ok) {
        const text = await proxy.parseResponse(response)
        if (text && text.length > 500) {
          console.log(`프록시 [${proxy.name}] 성공! HTML 길이: ${text.length}`)
          // HTML 내용 일부 출력 (디버깅용)
          console.log(`HTML 샘플:`, text.substring(0, 300))
          return text
        } else {
          console.log(`프록시 [${proxy.name}] 응답이 너무 짧음: ${text?.length || 0}`)
        }
      }
    } catch (error) {
      console.log(`프록시 [${proxy.name}] 에러:`, error.message)
    }
  }

  console.log('모든 프록시 실패!')
  return null
}

// 네이버 이미지 검색 (키워드 + suffix)
async function searchNaver(keywords, count = 5, suffix = '짤') {
  const mainKeyword = keywords[0] || keywords.join(' ')
  const searchQuery = `${mainKeyword} ${suffix}`
  const searchUrl = `https://search.naver.com/search.naver?where=image&query=${encodeURIComponent(searchQuery)}`

  console.log(`=== 네이버 검색: "${searchQuery}" ===`)

  try {
    const html = await fetchWithProxy(searchUrl)

    if (!html) {
      console.error('네이버: 모든 프록시 실패')
      return []
    }

    console.log(`HTML 전체 길이: ${html.length}`)

    const foundUrls = []

    // 다양한 패턴 시도
    const patterns = [
      // 네이버 이미지 검색 결과 패턴 (search.pstatic.net 프록시 URL)
      { name: 'pstatic-src', regex: /src="(https:\/\/search\.pstatic\.net\/common\/\?src=[^"]+)"/gi },
      // 썸네일 JSON 패턴
      { name: 'thumb', regex: /"thumb":"([^"]+)"/g },
      { name: 'originalUrl', regex: /"originalUrl":"([^"]+)"/g },
      // 일반 이미지 URL
      { name: 'src-https', regex: /src="(https:\/\/[^"]+\.(?:jpg|jpeg|png|gif|webp)[^"]*)"/gi },
      { name: 'data-lazy-src', regex: /data-lazy-src="([^"]+)"/g }
    ]

    for (const { name, regex } of patterns) {
      let match
      let patternCount = 0
      while ((match = regex.exec(html)) !== null) {
        let url = match[1]
        url = url.replace(/\\u002F/g, '/').replace(/\\/g, '').replace(/&amp;/g, '&')

        // search.pstatic.net URL에서 원본 src 추출
        if (url.includes('search.pstatic.net/common/?src=')) {
          const srcMatch = url.match(/src=([^&]+)/)
          if (srcMatch) {
            const originalSrc = decodeURIComponent(srcMatch[1])
            if (originalSrc.startsWith('http')) {
              foundUrls.push(originalSrc)
              patternCount++
              continue
            }
          }
        }

        // 일반 URL 처리
        if (url.startsWith('http') && !url.includes('static.naver.net') && !url.includes('pstatic.net/sstatic')) {
          foundUrls.push(url)
          patternCount++
        }
      }
      if (patternCount > 0) {
        console.log(`패턴 [${name}]: ${patternCount}개 발견`)
      }
    }

    console.log(`네이버 총 파싱된 URL 개수: ${foundUrls.length}`)

    if (foundUrls.length === 0) {
      const hasThumb = html.includes('thumb')
      const hasImage = html.includes('image')
      console.log(`HTML 분석 - thumb포함: ${hasThumb}, image포함: ${hasImage}`)
      console.log('HTML 샘플 (500자):', html.substring(0, 500))
      return []
    }

    // 중복 제거
    const uniqueUrls = [...new Set(foundUrls)]
    console.log(`중복 제거 후: ${uniqueUrls.length}개`)

    // 랜덤 셔플
    for (let i = uniqueUrls.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [uniqueUrls[i], uniqueUrls[j]] = [uniqueUrls[j], uniqueUrls[i]]
    }

    // 상위 count개 선택
    const images = uniqueUrls.slice(0, count).map((imgUrl, idx) => {
      console.log(`선택 ${idx + 1}: ${imgUrl.substring(0, 60)}...`)
      return {
        id: `naver-${idx}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        thumbnail: getProxyUrl(imgUrl, { width: 300, height: 300 }),
        full: getProxyUrl(imgUrl),
        originalUrl: imgUrl, // 원본 URL 저장 (ImageEditor에서 사용)
        source: '네이버',
        sourceUrl: searchUrl
      }
    })

    console.log(`=== "${searchQuery}" 검색 완료: ${images.length}개 ===`)
    return images
  } catch (error) {
    console.error('네이버 검색 오류:', error)
    return []
  }
}

// URL 정규화 (중복 비교용)
function normalizeUrl(url) {
  try {
    // 프로토콜 통일
    let normalized = url.replace(/^https?:\/\//, '')
    // www 제거
    normalized = normalized.replace(/^www\./, '')
    // 쿼리스트링의 일부 파라미터 제거 (사이즈, 캐시 관련)
    normalized = normalized.replace(/[?&](w|h|width|height|size|quality|q|fit|crop|auto|format|f)=[^&]*/gi, '')
    // 빈 쿼리스트링 정리
    normalized = normalized.replace(/\?$/, '').replace(/\?&/, '?').replace(/&&+/g, '&')
    // 끝의 슬래시 제거
    normalized = normalized.replace(/\/$/, '')
    return normalized.toLowerCase()
  } catch {
    return url
  }
}

// 결과 중복 제거 (정규화된 URL 기준)
function deduplicateResults(results) {
  const seen = new Set()
  return results.filter(item => {
    const key = normalizeUrl(item.originalUrl || item.full)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// 문장으로 직접 검색 (짤 + 밈)
export async function searchByQuery(query, count = 10) {
  console.log(`=== 문장 직접 검색: "${query}" ===`)

  try {
    // "짤"과 "밈" 두 가지로 병렬 검색 (여유있게 가져와서 중복 제거 후 선택)
    const [jjalResults, memeResults] = await Promise.all([
      searchNaver([query], count, '짤').catch(() => []),
      searchNaver([query], count, '밈').catch(() => [])
    ])

    const combined = [...jjalResults, ...memeResults]
    const unique = deduplicateResults(combined)
    const final = unique.slice(0, count)

    console.log(`문장 검색 결과: ${final.length}개 (원본: ${combined.length}, 중복제거: ${unique.length})`)
    return final
  } catch (error) {
    console.error('문장 검색 오류:', error)
    return []
  }
}

// 키워드로 검색 (추출된 키워드 사용)
export async function searchImages(keywordsObj, count = 10) {
  const korean = Array.isArray(keywordsObj) ? keywordsObj : (keywordsObj.korean || [])

  if (korean.length === 0) {
    console.log('키워드 없음')
    return []
  }

  console.log('키워드 검색:', korean)

  try {
    // 키워드로 "짤"과 "밈" 병렬 검색
    const [jjalResults, memeResults] = await Promise.all([
      searchNaver(korean, count, '짤').catch(() => []),
      searchNaver(korean, count, '밈').catch(() => [])
    ])

    const combined = [...jjalResults, ...memeResults]
    const unique = deduplicateResults(combined)
    const final = unique.slice(0, count)

    console.log(`키워드 검색 결과: ${final.length}개 (원본: ${combined.length}, 중복제거: ${unique.length})`)
    return final
  } catch (error) {
    console.error('검색 오류:', error)
    return []
  }
}
