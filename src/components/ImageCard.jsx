import { useState } from 'react'

function ImageCard({ image, onClick }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    setHasError(true)
  }

  if (hasError) {
    return (
      <div className="image-card image-card-error">
        <span>이미지 로드 실패</span>
      </div>
    )
  }

  return (
    <div className="image-card" onClick={onClick}>
      {!isLoaded && <div className="image-card-loading">로딩...</div>}
      <img
        src={image.thumbnail}
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
