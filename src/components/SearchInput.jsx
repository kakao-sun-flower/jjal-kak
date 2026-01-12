import { useState, useMemo } from 'react'

const PLACEHOLDERS = [
  '월요일 출근하기 싫어',
  '퇴근하고 싶다',
  '배고파 죽겠어',
  '커피 없이 못 살아'
]

function SearchInput({ onSearch, isLoading }) {
  const [input, setInput] = useState('')

  // 컴포넌트 마운트 시 한 번만 랜덤 선택
  const placeholder = useMemo(() =>
    PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)],
  [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isLoading) return

    // 입력값이 없으면 placeholder 사용
    const searchText = input.trim() || placeholder
    onSearch(searchText)
  }

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <div className="search-input-wrapper">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="search-input"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="search-button"
          disabled={isLoading}
        >
          {isLoading ? '검색 중...' : '짤 찾기'}
        </button>
      </div>
      <p className="search-hint">
        그냥 버튼을 누르면 "{placeholder}" 검색!
      </p>
    </form>
  )
}

export default SearchInput
