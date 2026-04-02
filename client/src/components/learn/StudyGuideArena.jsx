export default function StudyGuideArena({ guideText, onExit }) {
  
  const parseSections = (text) => {
    if (!text) return { title: 'Study Guide', sections: [] };
    
    // Clean up potential markdown code block wrappers and raw source markers
    const cleanText = text
      .replace(/^```(markdown)?\n?/i, '')
      .replace(/```$/i, '')
      .replace(/--- Content from .*? ---\n?/g, '')
      .trim();
      
    const lines = cleanText.split('\n');
    let title = 'Study Guide';
    const sections = [];
    let currentSection = null;

    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('# ') && !trimmedLine.startsWith('## ')) {
        title = trimmedLine.substring(2).trim();
      } else if (trimmedLine.startsWith('## ')) {
        if (currentSection && currentSection.content.some(c => c.trim())) {
          sections.push(currentSection);
        }
        currentSection = { title: trimmedLine.substring(3).trim(), content: [] };
      } else {
        if (!currentSection && trimmedLine) {
          currentSection = { title: 'Introduction', content: [] };
        }
        if (currentSection) {
          currentSection.content.push(line);
        }
      }
    });

    if (currentSection && currentSection.content.some(c => c.trim())) {
      sections.push(currentSection);
    }
    
    return { title, sections };
  };

  const { title, sections } = parseSections(guideText);

  // Soft pastel backgrounds matching the aesthetic
  const pastels = [
    'rgba(125, 160, 125, 0.12)', // soft sage green
    'rgba(200, 138, 144, 0.12)', // dusty rose
    'rgba(192, 139, 92, 0.12)',  // warm beige
    'rgba(155, 142, 196, 0.12)'  // muted lavender
  ];

  const formatLine = (line, i) => {
    let cleanLine = line;
    
    // Handle level 3 headers
    if (line.startsWith('### ')) {
      return <h4 key={i} className="sub-section-header">{line.substring(4).replace(/\*\*/g, '')}</h4>;
    }
    
    // Detect and strip bullet points
    const bulletRegex = /^\s*[•○●◦▪️▫️\-*]\s+/;
    const isList = bulletRegex.test(line);
    if (isList) {
      cleanLine = line.replace(bulletRegex, '');
    }
    
    if (!cleanLine.trim() && !isList) return null;

    // Handle bolding
    const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
    const renderedLine = parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.substring(2, part.length - 2)}</strong>;
      }
      return part;
    });

    if (isList) {
      return (
        <li key={i} className="list-item">
          <span className="bullet-dot">•</span>
          <span className="list-content">{renderedLine}</span>
        </li>
      );
    }
    
    return <p key={i} className="paragraph">{renderedLine}</p>;
  };

  return (
    <div className="arena-container guide-arena">
      <div className="arena-header study-guide-header">
        <div className="header-left">
          <h1 className="guide-main-title">{title}</h1>
          <p className="subtitle">AI-generated comprehensive review</p>
        </div>
        <button className="btn btn-secondary exit-btn" onClick={onExit}>
          Done
        </button>
      </div>
      
      <div className="guide-content">
        {sections.map((sec, idx) => (
          <div key={idx} className="guide-section card-panel" style={{ backgroundColor: pastels[idx % pastels.length] }}>
            <h2 className="section-title">{sec.title}</h2>
            <div className="section-body">
              {sec.content.map((line, i) => formatLine(line, i))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .guide-arena {
          max-width: 950px;
          margin: 0 auto;
          animation: fadeIn 0.4s ease-out;
          font-family: "Times New Roman", Times, serif;
          color: var(--text-primary);
        }
        .study-guide-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 2.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 2px solid var(--border-primary);
        }
        .guide-main-title {
          font-size: 3rem;
          font-weight: 700;
          color: var(--accent-primary);
          line-height: 1.1;
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }
        .subtitle {
          font-size: 1.1rem;
          font-style: italic;
          opacity: 0.8;
        }
        .guide-content {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
          padding-bottom: 6rem;
        }
        .card-panel {
          border-radius: var(--radius-lg);
          padding: 3rem;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
          color: var(--text-primary);
          border: 1px solid rgba(var(--accent-rgb), 0.1);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          background-color: var(--bg-panel);
        }
        .card-panel:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.06);
        }
        .section-title {
          color: var(--accent-primary);
          font-size: 1.8rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid rgba(var(--accent-rgb), 0.15);
          padding-bottom: 1rem;
          font-weight: 700;
        }
        .section-body {
          line-height: 1.8;
          font-size: 1.15rem;
        }
        .paragraph {
          margin-bottom: 1.25rem;
        }
        .list-item {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.75rem;
          align-items: flex-start;
          padding-left: 0.5rem;
        }
        .bullet-dot {
          color: var(--accent-primary);
          font-weight: bold;
          font-size: 1.3rem;
          line-height: 1;
          margin-top: 2px;
        }
        .list-content {
          flex: 1;
        }
        .sub-section-header {
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: var(--text-primary);
          font-size: 1.35rem;
          font-weight: 700;
        }
        strong {
          color: #2c2c2c;
          font-weight: 800;
        }
        .exit-btn {
          min-width: 120px;
          height: 44px;
        }
        [data-theme="dark"] .section-title,
        [data-theme="dark"] .guide-main-title,
        [data-theme="dark"] .bullet-dot {
          color: var(--accent-primary-bright);
        }
        [data-theme="dark"] strong {
          color: #f0f0f0;
        }
        [data-theme="dark"] .card-panel {
          border-color: rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  );
}
