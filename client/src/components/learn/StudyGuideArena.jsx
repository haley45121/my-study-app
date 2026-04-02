export default function StudyGuideArena({ guideText, onExit }) {
  
  const parseSections = (text) => {
    if (!text) return { title: 'Study Guide', sections: [] };
    
    // Comprehensive noise cleanup
    const cleanText = text
      .replace(/^```(markdown)?\n?/i, '')
      .replace(/```$/i, '')
      .replace(/--- Content from .*? ---\n?/g, '')
      .replace(/^---+\s*$/gm, '') // Remove horizontal lines
      .trim();
      
    const lines = cleanText.split('\n');
    let title = 'Study Guide';
    const sections = [];
    let currentSection = null;

    // Filter out common metadata and structural noise
    const isNoiseLine = (line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      // Common PDF/Note artifacts
      if (/^[-*=_]{3,}$/.test(trimmed)) return true; // Horizontal separators
      if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(trimmed)) return true; 
      if (/\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/i.test(trimmed)) return true;
      if (trimmed.toLowerCase().endsWith('.pdf')) return true;
      if (trimmed.toLowerCase().endsWith('.docx')) return true;
      if (trimmed.toLowerCase().startsWith('page ')) return true;
      return false;
    };

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (isNoiseLine(trimmedLine)) return;
      
      if (trimmedLine.startsWith('# ') && !trimmedLine.startsWith('## ')) {
        title = trimmedLine.substring(2).trim().replace(/\*/g, '');
      } else if (trimmedLine.startsWith('## ')) {
        if (currentSection && currentSection.content.some(c => c.trim())) {
          sections.push(currentSection);
        }
        // Normalize section title
        const secTitle = trimmedLine.substring(3).trim().replace(/\*/g, '').toUpperCase();
        currentSection = { title: secTitle, content: [] };
      } else {
        if (!currentSection && trimmedLine) {
          currentSection = { title: 'OVERVIEW', content: [] };
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

  const pastels = [
    'rgba(125, 160, 125, 0.15)', // sage green
    'rgba(200, 138, 144, 0.15)', // dusty rose
    'rgba(192, 139, 92, 0.15)',  // warm beige
    'rgba(155, 142, 196, 0.15)'  // muted lavender
  ];

  const formatLine = (line, i) => {
    // 1. Level 3 headers
    if (line.trim().startsWith('### ')) {
      return <h4 key={i} className="sub-header">{line.trim().substring(4).replace(/\*+/g, '')}</h4>;
    }
    
    // 2. Aggressive symbol cleanup
    // This regex catches sequences like "* —", "• —", "●", "○", "■", "---", "-", "*", etc.
    const bulletRegex = /^\s*([*•●○■◦▪️▫️\-]+\s*—?\s*|[-*•]\s+)/;
    const isList = bulletRegex.test(line);
    let cleanLine = line.replace(bulletRegex, '').replace(/^—\s*/, '').trim();
    
    // 3. Strip single asterisks (italics) but keep the text
    cleanLine = cleanLine.replace(/([^\*])\*([^\*]+)\*([^\*])/g, '$1$2$3') // middle of sentence
                         .replace(/^\*([^\*]+)\*/g, '$1') // start of sentence
                         .replace(/\*([^\*]+)\*$/g, '$1'); // end of sentence

    if (!cleanLine && !isList) return null;

    // 4. Handle bolding (keep as <strong>)
    const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
    const renderedLine = parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.substring(2, part.length - 2)}</strong>;
      }
      return part;
    });

    if (isList) {
      return (
        <div key={i} className="list-row">
          <span className="dot">•</span>
          <span className="text">{renderedLine}</span>
        </div>
      );
    }
    
    return <p key={i} className="content-para">{renderedLine}</p>;
  };

  return (
    <div className="study-guide-arena">
      <header className="arena-top-nav">
        <h1 className="main-title">{title}</h1>
        <button className="done-btn" onClick={onExit}>Done</button>
      </header>

      <main className="guide-stack">
        {sections.map((sec, idx) => (
          <section 
            key={idx} 
            className="guide-card animate-slide-up" 
            style={{ 
              backgroundColor: pastels[idx % pastels.length],
              animationDelay: `${idx * 0.05}s`
            }}
          >
            <div className="card-header">
              <h2 className="section-label">{sec.title}</h2>
              <hr className="header-divider" />
            </div>
            <div className="card-body">
              {sec.content.map((line, i) => formatLine(line, i))}
            </div>
          </section>
        ))}
      </main>

      <style>{`
        .study-guide-arena {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem 1rem 6rem;
          font-family: "Times New Roman", Times, serif;
          color: #2c2420;
          line-height: 1.6;
        }

        .arena-top-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(138, 123, 106, 0.2);
        }

        .main-title {
          font-size: 2.2rem;
          font-weight: 700;
          color: #5d4e41;
          margin: 0;
        }

        .done-btn {
          background: #8a7b6a;
          color: white;
          border: none;
          padding: 0.6rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.2s;
        }

        .done-btn:hover { background: #6b5e54; }

        .guide-stack {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        .guide-card {
          border-radius: 16px;
          padding: 2.5rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          border: 1px solid rgba(255,255,255,0.4);
        }

        .card-header {
          margin-bottom: 1.5rem;
        }

        .section-label {
          font-size: 0.9rem;
          font-weight: 800;
          letter-spacing: 0.15em;
          color: #8a7b6a; 
          margin: 0 0 0.5rem 0;
        }

        .header-divider {
          border: none;
          border-top: 1px solid rgba(138, 123, 106, 0.2);
          margin: 0;
        }

        .card-body {
          font-size: 1.15rem;
        }

        .content-para {
          margin-bottom: 1.2rem;
        }

        .list-row {
          display: flex;
          gap: 0.8rem;
          margin-bottom: 0.6rem;
          padding-left: 0.5rem;
        }

        .dot {
          color: #8a7b6a;
          font-size: 1.1rem;
          line-height: 1.3;
          font-weight: bold;
        }

        .text { flex: 1; }

        .sub-header {
          margin: 2rem 0 1rem 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #443c35;
        }

        strong {
          color: #2c2420;
          font-weight: 700;
        }

        .animate-slide-up {
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        [data-theme="dark"] .study-guide-arena { color: #d1c7bc; }
        [data-theme="dark"] .main-title { color: #e8e2db; }
        [data-theme="dark"] .section-label { color: #c08b5c; }
        [data-theme="dark"] .dot { color: #c08b5c; }
        [data-theme="dark"] .sub-header { color: #e8e2db; }
        [data-theme="dark"] .guide-card {
           background: rgba(44, 36, 32, 0.7) !important;
        }
      `}</style>
    </div>
  );
}
