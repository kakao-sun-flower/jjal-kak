// 캔버스를 이미지 파일로 다운로드
export function downloadImage(canvas, filename = 'jjal-kak.png') {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('이미지 생성 실패'))
          return
        }

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        resolve()
      }, 'image/png')
    } catch (error) {
      reject(error)
    }
  })
}

// 캔버스를 클립보드에 복사
export async function copyImageToClipboard(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('이미지 생성 실패'))
        return
      }

      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ])
        resolve()
      } catch (error) {
        // 클립보드 API 지원하지 않는 경우
        reject(new Error('클립보드 복사를 지원하지 않는 브라우저입니다.'))
      }
    }, 'image/png')
  })
}

// Blob을 Base64로 변환
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
