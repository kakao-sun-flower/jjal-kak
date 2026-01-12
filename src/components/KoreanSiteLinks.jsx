function KoreanSiteLinks({ links }) {
  if (!links || links.length === 0) {
    return null
  }

  return (
    <div className="korean-site-links">
      <p className="links-title">한국 사이트에서 직접 검색:</p>
      <div className="links-container">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="site-link"
          >
            <span className="link-icon">{link.icon}</span>
            <span className="link-name">{link.name}</span>
          </a>
        ))}
      </div>
    </div>
  )
}

export default KoreanSiteLinks
