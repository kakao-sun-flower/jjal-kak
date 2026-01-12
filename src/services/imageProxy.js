// wsrv.nl 이미지 프록시 서비스
// 핫링크 차단을 우회하여 외부 이미지를 표시

export function getProxyUrl(originalUrl, options = {}) {
  if (!originalUrl) return ''

  const params = new URLSearchParams({
    url: originalUrl
  })

  // 이미지 크기 조절
  if (options.width) params.set('w', options.width)
  if (options.height) params.set('h', options.height)

  // 이미지 품질 (1-100)
  if (options.quality) params.set('q', options.quality)

  // 출력 포맷 (webp, png, jpg)
  if (options.format) params.set('output', options.format)

  // 이미지 맞춤 (contain, cover, fill)
  if (options.fit) params.set('fit', options.fit)

  return `https://wsrv.nl/?${params.toString()}`
}

// 썸네일용 프록시 URL
export function getThumbnailUrl(originalUrl, size = 300) {
  return getProxyUrl(originalUrl, {
    width: size,
    height: size,
    fit: 'cover',
    quality: 80
  })
}

// 원본 크기 프록시 URL
export function getFullSizeUrl(originalUrl) {
  return getProxyUrl(originalUrl, {
    quality: 90
  })
}
