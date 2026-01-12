import { useState } from 'react'
import SearchInput from './components/SearchInput'
import KeywordTags from './components/KeywordTags'
import ImageGrid from './components/ImageGrid'
import ImageEditor from './components/ImageEditor'
import { extractKeywords } from './services/openai'
import { searchImages, searchByQuery, getKoreanSiteLinks } from './services/imageSources'

const MIN_RESULTS = 5 // 최소 결과 수

function App() {
  const [sentence, setSentence] = useState('')
  const [keywords, setKeywords] = useState({ korean: [] })
  const [images, setImages] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSearch = async (inputSentence) => {
    setSentence(inputSentence)
    setIsLoading(true)
    setError(null)
    setKeywords({ korean: [] })

    try {
      // 1단계: 검색어 + "짤"/"밈"으로 직접 검색
      console.log('1단계: 문장으로 직접 검색')
      let searchResults = await searchByQuery(inputSentence, 10)

      // 2단계: 결과가 부족하면 키워드 추출 후 재검색
      if (searchResults.length < MIN_RESULTS) {
        console.log(`결과 부족 (${searchResults.length}개), 키워드 추출 시도...`)
        const extractedKeywords = await extractKeywords(inputSentence)
        setKeywords(extractedKeywords)

        if (extractedKeywords.korean.length > 0) {
          const keywordResults = await searchImages(extractedKeywords, 10)
          // 기존 결과와 합치고 중복 제거
          const allResults = [...searchResults, ...keywordResults]
          const uniqueResults = allResults.filter((item, index, self) =>
            index === self.findIndex(t => t.full === item.full)
          )
          searchResults = uniqueResults.slice(0, 10)
        }
      }

      setImages(searchResults)
    } catch (err) {
      setError(err.message || '검색 중 오류가 발생했습니다.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeywordUpdate = async (updatedKeywords) => {
    setKeywords(updatedKeywords)
    setIsLoading(true)

    try {
      const searchResults = await searchImages(updatedKeywords, 10)
      setImages(searchResults)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageSelect = (image) => {
    setSelectedImage(image)
  }

  const handleCloseEditor = () => {
    setSelectedImage(null)
  }

  const handleReset = () => {
    setSentence('')
    setKeywords({ korean: [] })
    setImages([])
    setSelectedImage(null)
    setError(null)
  }

  // 키워드가 없으면 문장을 키워드로 사용
  const displayKeywords = keywords.korean.length > 0 ? keywords.korean : (sentence ? [sentence] : [])
  const koreanSiteLinks = displayKeywords.length > 0
    ? getKoreanSiteLinks(displayKeywords)
    : []

  return (
    <div className="app">
      <header className="header">
        <h1 onClick={handleReset} style={{ cursor: 'pointer' }}>짤-칵!</h1>
        <p>AI가 찾아주는 짤 생성기</p>
      </header>

      <main className="main">
        <SearchInput onSearch={handleSearch} isLoading={isLoading} />

        {error && <div className="error-message">{error}</div>}

        {keywords.korean.length > 0 && (
          <KeywordTags
            keywords={keywords}
            onUpdate={handleKeywordUpdate}
          />
        )}

        {isLoading ? (
          <div className="loading">이미지 검색 중...</div>
        ) : images.length > 0 ? (
          <ImageGrid
            images={images}
            onSelect={handleImageSelect}
          />
        ) : sentence ? (
          <div className="no-results">
            <p>검색 결과를 가져오지 못했습니다.</p>
            <p className="no-results-hint">아래 사이트에서 직접 검색해보세요!</p>
            <div className="korean-site-buttons">
              {koreanSiteLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="korean-site-button"
                >
                  <span className="button-icon">{link.icon}</span>
                  <span className="button-name">{link.name}</span>
                  <span className="button-arrow">→</span>
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>문장을 입력하면 AI가 적절한 짤을 찾아드립니다</p>
          </div>
        )}
      </main>

      {selectedImage && (
        <ImageEditor
          image={selectedImage}
          defaultText={sentence}
          onClose={handleCloseEditor}
        />
      )}
    </div>
  )
}

export default App
