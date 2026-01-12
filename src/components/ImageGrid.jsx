import ImageCard from './ImageCard'

function ImageGrid({ images, onSelect }) {
  if (!images || images.length === 0) {
    return (
      <div className="image-grid-empty">
        <p>검색 결과가 없습니다.</p>
        <p>문장을 입력해서 짤을 찾아보세요!</p>
      </div>
    )
  }

  return (
    <div className="image-grid">
      {images.map((image) => (
        <ImageCard
          key={image.id}
          image={image}
          onClick={() => onSelect(image)}
        />
      ))}
    </div>
  )
}

export default ImageGrid
