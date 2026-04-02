export default function StudyGuideArena({ guideText, onExit }) {
  
  const parseSections = (text) => {
    if (!text) return { title: 'Study Guide', sections: [] };
    const lines = text.split('\n');
    let title = 'Study Guide';
    const sections = [];
    let currentSection = null;

    lines.forEach(line => {
      if (line.startsWith('# ') && !line.startsWith('## ')) {
        title = line.substring(2).trim();
      } else if (line.startsWith('## ')) {
        if (currentSection) sections.push(currentSection);
        currentSection = { title: line.substring(3).trim(), content: [] };
      } else if (currentSection) {
        currentSection.content.push(line);
      }
    });
    if (currentSection) sections.push(currentSection);
    
    return { title, sections };
  };

  const { title, sections } = parseSections(guideText);

  // Soft pastel backgrounds matching the aesthetic
  const pastels = [
    'rgba(125, 160, 125, 0.15)', // soft sage green
    'rgba(200, 138, 144, 0.15)', // dusty rose
    'rgba(192, 139, 92, 0.15)',  // warm beige
    'rgba(155, 142, 196, 0.15)'  // muted lavender
  ];

  const formatLine = (line, i) => {
    if (line.startsWith('### ')) return <h4 key={i}>{line.substring(4)}</h4>;
    
    let isList = false;
    let cleanLine = line;
    
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      isList = true;
      cleanLine = line.replace(/^\s*[-*]\s/, '');
    }
    
    if (!cleanLine.trim() && !isList) return null;

    const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
    const renderedLine = parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.substring(2, part.length - 2)}</strong>;
      }
      return part;
    });

    if (isList) return <li key={i}>{renderedLine}</li>;
    return <p key={i}>{renderedLine}</p>;
  };

  return (
    <div className="arena-container guide-arena">
      <div className="arena-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>{title}</h2>
          <p className="text-secondary">AI-generated comprehensive review</p>
        </div>
        <button className="btn btn-secondary" onClick={onExit}>
          Done
        </button>
      </div>
      
      <div className="guide-content">
        {sections.map((sec, idx) => (
          <div key={idx} className="guide-section card-panel" style={{ backgroundColor: pastels[idx % pastels.length] }}>
            <h3 className="section-title">{sec.title}</h3>
            <div className="section-body">
              {sec.content.map((line, i) => formatLine(line, i))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .guide-arena {
          max-width: 900px;
          margin: 0 auto;
          animation: fadeIn 0.4s ease-out;
          font-family: var(--font-display);
        }
        .guide-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding-bottom: 3rem;
        }
        .card-panel {
          border-radius: var(--radius-lg);
          padding: 2rem;
          box-shadow: var(--shadow-sm);
          color: var(--text-primary);
          border: 1px solid var(--border-primary);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .card-panel:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .section-title {
          color: var(--accent-primary);
          margin-bottom: 1rem;
          border-bottom: 1px solid var(--border-primary);
          padding-bottom: 0.5rem;
          font-weight: 600;
        }
        .section-body {
          line-height: 1.6;
        }
        .section-body h4 {
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }
        .section-body p {
          margin-bottom: 0.75rem;
        }
        .section-body li {
          margin-left: 1.5rem;
          margin-bottom: 0.4rem;
        }
        [data-theme="dark"] .section-title {
          color: var(--accent-primary-bright);
          border-color: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
