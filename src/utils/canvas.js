// 이미지 URL을 Canvas에 로드
export function loadImageToCanvas(imageUrl, canvas) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      resolve(img)
    }

    img.onerror = () => {
      reject(new Error('이미지 로드 실패'))
    }

    // 프록시 URL 사용
    img.src = `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}`
  })
}

// Canvas에 텍스트 그리기
export function drawTextOnCanvas(canvas, text, options = {}) {
  const ctx = canvas.getContext('2d')

  const {
    fontSize = 32,
    fontFamily = "'Noto Sans KR', sans-serif",
    textColor = '#ffffff',
    strokeColor = '#000000',
    position = 'bottom', // top, center, bottom
    padding = 20
  } = options

  // 텍스트 스타일 설정
  ctx.font = `bold ${fontSize}px ${fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // 위치 계산
  let y
  switch (position) {
    case 'top':
      y = fontSize + padding
      break
    case 'center':
      y = canvas.height / 2
      break
    case 'bottom':
    default:
      y = canvas.height - fontSize - padding
  }
  const x = canvas.width / 2

  // 테두리 (가독성)
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = fontSize / 8
  ctx.lineJoin = 'round'
  ctx.strokeText(text, x, y)

  // 텍스트 본체
  ctx.fillStyle = textColor
  ctx.fillText(text, x, y)
}

// 전체 짤 생성 (이미지 + 텍스트)
export async function generateMeme(imageUrl, text, options = {}) {
  const canvas = document.createElement('canvas')

  await loadImageToCanvas(imageUrl, canvas)

  if (text) {
    drawTextOnCanvas(canvas, text, options)
  }

  return canvas
}
