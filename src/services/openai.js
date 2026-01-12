import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
})

export async function extractKeywords(sentence) {
  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    // API 키가 없으면 간단한 키워드 추출 (폴백)
    return fallbackExtract(sentence)
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: `다음 문장에서 짤/밈 검색에 적합한 한국어 키워드를 추출해줘.
반드시 아래 JSON 형식으로만 응답해:
{"korean": ["키워드1", "키워드2", "키워드3"]}

문장: "${sentence}"`
      }],
      temperature: 0.7,
      max_tokens: 100
    })

    const content = response.choices[0].message.content
    // JSON 파싱 시도
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return { korean: parsed.korean || [] }
    }
    return fallbackExtract(sentence)
  } catch (error) {
    console.error('OpenAI API 오류:', error)
    return fallbackExtract(sentence)
  }
}

// API 키 없을 때 폴백 키워드 추출
function fallbackExtract(sentence) {
  // 간단한 한글 키워드 추출 (조사 제거)
  const koreanWords = sentence
    .replace(/[은는이가을를의와과에서로부터까지]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 2)
    .slice(0, 5)

  return {
    korean: koreanWords.length > 0 ? koreanWords : ['짤', '밈']
  }
}
