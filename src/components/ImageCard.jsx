import { useState, useRef, useEffect } from 'react'

function ImageCard({ image, onClick }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(image.thumbnail)
  const retryCount = useRef(0)

  useEffect(() => {
    // 이미지가 바뀌면 상태 리셋
    retryCount.current = 0
    setIsLoaded(false)
    setHasError(false)
    setCurrentSrc(image.thumbnail)
  }, [image.thumbnail])

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    retryCount.current++
    const originalUrl = image.originalUrl || image.full

    if (retryCount.current === 1) {
      // 1차 재시도: images.weserv.nl 프록시
      setCurrentSrc(`https://images.weserv.nl/?url=${encodeURIComponent(originalUrl)}&w=300&h=300&fit=cover&default=1`)
    } else if (retryCount.current === 2) {
      // 2차 재시도: wsrv.nl 프록시 (다른 옵션)
      setCurrentSrc(`https://wsrv.nl/?url=${encodeURIComponent(originalUrl)}&w=300&h=300&fit=cover`)
    } else {
      // 모든 시도 실패
      setHasError(true)
    }
  }

  if (hasError) {
    return (
      <div className="image-card image-card-error">
        <span>로드 실패</span>
      </div>
    )
  }

  return (
    <div className="image-card" onClick={onClick}>
      {!isLoaded && <div className="image-card-loading">로딩...</div>}
      <img
        src={currentSrc}
        alt="짤 이미지"
        onLoad={handleLoad}
        onError={handleError}
        style={{ opacity: isLoaded ? 1 : 0 }}
      />
      <div className="image-card-overlay">
        <span className="image-source">{image.source}</span>
        <span className="image-action">클릭하여 편집</span>
      </div>
    </div>
  )
}

export default ImageCard
