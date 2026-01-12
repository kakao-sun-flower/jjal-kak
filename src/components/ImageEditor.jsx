import { useState, useRef, useEffect } from 'react'
import { downloadImage, copyImageToClipboard } from '../utils/download'

function ImageEditor({ image, defaultText, onClose }) {
  const canvasRef = useRef(null)
  const [text, setText] = useState(defaultText || '')
  const [fontSize, setFontSize] = useState(32)
  const [textColor, setTextColor] = useState('#ffffff')
  const [strokeColor, setStrokeColor] = useState('#000000')
  const [textPosition, setTextPosition] = useState('bottom') // top, center, bottom
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const imageRef = useRef(new Image())

  useEffect(() => {
    const img = imageRef.current
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setImageLoaded(true)
      drawCanvas()
    }
    img.onerror = () => {
      console.error('이미지 로드 실패')
    }
    // 프록시 URL 사용
    img.src = `https://wsrv.nl/?url=${encodeURIComponent(image.full)}`
  }, [image.full])

  useEffect(() => {
    if (imageLoaded) {
      drawCanvas()
    }
  }, [text, fontSize, textColor, strokeColor, textPosition, imageLoaded])

  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas || !imageLoaded) return

    const ctx = canvas.getContext('2d')
    const img = imageRef.current

    // 캔버스 크기 설정
    canvas.width = img.width
    canvas.height = img.height

    // 이미지 그리기
    ctx.drawImage(img, 0, 0)

    if (!text) return

    // 텍스트 스타일 설정
    ctx.font = `bold ${fontSize}px 'Noto Sans KR', sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // 텍스트 위치 계산
    let y
    switch (textPosition) {
      case 'top':
        y = fontSize + 20
        break
      case 'center':
        y = canvas.height / 2
        break
      case 'bottom':
      default:
        y = canvas.height - fontSize - 20
    }
    const x = canvas.width / 2

    // 텍스트 그림자 (가독성)
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = fontSize / 8
    ctx.lineJoin = 'round'
    ctx.strokeText(text, x, y)

    // 텍스트 본체
    ctx.fillStyle = textColor
    ctx.fillText(text, x, y)
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      await downloadImage(canvasRef.current, 'jjal-kak.png')
    } catch (error) {
      alert('다운로드 실패: ' + error.message)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await copyImageToClipboard(canvasRef.current)
      alert('클립보드에 복사되었습니다!')
    } catch (error) {
      alert('복사 실패: ' + error.message)
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="image-editor-backdrop" onClick={handleBackdropClick}>
      <div className="image-editor">
        <button className="editor-close" onClick={onClose}>X</button>

        <div className="editor-canvas-container">
          <canvas ref={canvasRef} className="editor-canvas" />
          {!imageLoaded && <div className="editor-loading">이미지 로딩 중...</div>}
        </div>

        <div className="editor-controls">
          <div className="control-group">
            <label>텍스트</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="텍스트 입력..."
              className="text-input"
            />
          </div>

          <div className="control-row">
            <div className="control-group">
              <label>크기</label>
              <input
                type="range"
                min="16"
                max="72"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
              />
              <span>{fontSize}px</span>
            </div>

            <div className="control-group">
              <label>위치</label>
              <select
                value={textPosition}
                onChange={(e) => setTextPosition(e.target.value)}
              >
                <option value="top">상단</option>
                <option value="center">중앙</option>
                <option value="bottom">하단</option>
              </select>
            </div>
          </div>

          <div className="control-row">
            <div className="control-group">
              <label>글자색</label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
              />
            </div>

            <div className="control-group">
              <label>테두리</label>
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
              />
            </div>
          </div>

          <div className="editor-actions">
            <button
              className="action-button download"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? '저장 중...' : '다운로드'}
            </button>
            <button
              className="action-button copy"
              onClick={handleCopy}
            >
              복사
            </button>
          </div>

          <div className="editor-source">
            출처: <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer">
              {image.source}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImageEditor
