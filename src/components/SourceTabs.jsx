function SourceTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'all', label: '전체', icon: '🌐' },
    { id: 'global', label: '해외', icon: '🌍' },
    { id: 'korean', label: '국내', icon: '🇰🇷' }
  ]

  return (
    <div className="source-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`source-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

export default SourceTabs
