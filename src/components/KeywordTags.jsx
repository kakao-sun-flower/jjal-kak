import { useState } from 'react'

function KeywordTags({ keywords, onUpdate }) {
  const handleRemoveKeyword = (index) => {
    const updated = {
      korean: keywords.korean.filter((_, i) => i !== index)
    }
    onUpdate(updated)
  }

  const handleAddKeyword = (keyword) => {
    if (!keyword.trim()) return
    const updated = {
      korean: [...keywords.korean, keyword.trim()]
    }
    onUpdate(updated)
  }

  return (
    <div className="keyword-tags">
      <div className="keyword-section">
        <span className="keyword-label">키워드:</span>
        <div className="tags">
          {keywords.korean.map((keyword, index) => (
            <span key={`ko-${index}`} className="tag tag-korean">
              {keyword}
              <button
                className="tag-remove"
                onClick={() => handleRemoveKeyword(index)}
              >
                x
              </button>
            </span>
          ))}
          <AddTagInput
            placeholder="추가..."
            onAdd={handleAddKeyword}
          />
        </div>
      </div>
    </div>
  )
}

function AddTagInput({ placeholder, onAdd }) {
  const [value, setValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (value.trim()) {
      onAdd(value.trim())
      setValue('')
      setIsOpen(false)
    }
  }

  if (!isOpen) {
    return (
      <button className="add-tag-button" onClick={() => setIsOpen(true)}>
        +
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="add-tag-form">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="add-tag-input"
        autoFocus
        onBlur={() => {
          if (!value.trim()) setIsOpen(false)
        }}
      />
    </form>
  )
}

export default KeywordTags
