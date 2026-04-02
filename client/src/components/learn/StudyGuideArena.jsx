export default function StudyGuideArena({ guideText, onExit }) {
  
  const parseSections = (text) => {
    if (!text) return { title: 'Study Guide', sections: [] };
    
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

  const formatLine = (line, i) => {
    let cleanLine = line;
    
    if (line.startsWith('### ')) {
      return <h4 key={i} className="sub-section-header">{line.substring(4).replace(/\*\*/g, '')}</h4>;
    }
    
    const bulletRegex = /^\s*[•○●◦▪️▫️\-*]\s+/;
    const isList = bulletRegex.test(line);
    if (isList) {
      cleanLine = line.replace(bulletRegex, '');
    }
    
    if (!cleanLine.trim() && !isList) return null;

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
          <span className="bullet-marker">—</span>
          <span className="list-content">{renderedLine}</span>
        </li>
      );
    }
    
    return <p key={i} className="paragraph">{renderedLine}</p>;
  };

  return (
    <div className="guide-document-container">
      <div className="document-header">
        <div className="header-main">
          <h1 className="document-title">{title}</h1>
          <div className="document-meta">Official Study Guide • AI-Synthesized Review</div>
        </div>
        <button className="btn-exit-minimal" onClick={onExit}>Close Document</button>
      </div>

      <div className="document-body">
        {sections.map((sec, idx) => (
          <div key={idx} className="document-section-block">
            <div className="section-label-container">
              <h2 className="section-label">{sec.title}</h2>
              <div className="section-divider"></div>
            </div>
            <div className="section-content-wrapper">
              <div className="section-body-text">
                {sec.content.map((line, i) => formatLine(line, i))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .guide-document-container {
          max-width: 850px;
          margin: 0 auto;
          padding: 4rem 2rem;
          font-family: "Times New Roman", Times, serif;
          color: #2d2a26;
          background: #fffcf9; /* subtle cream tint */
          min-height: 100vh;
          animation: fadeIn 0.6s ease-out;
        }

        .document-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 5rem;
          border-bottom: 3px double #d1c7bc;
          padding-bottom: 2rem;
        }

        .document-title {
          font-size: 2.8rem;
          font-weight: 700;
          color: #5d4e41;
          margin: 0;
          letter-spacing: -0.01em;
          text-transform: uppercase;
        }

        .document-meta {
          font-size: 0.9rem;
          color: #8c7e6d;
          margin-top: 0.5rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .btn-exit-minimal {
          background: transparent;
          border: 1px solid #d1c7bc;
          padding: 0.6rem 1.2rem;
          font-family: inherit;
          color: #8c7e6d;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
          font-size: 0.8rem;
          letter-spacing: 0.05em;
        }

        .btn-exit-minimal:hover {
          background: #5d4e41;
          color: white;
          border-color: #5d4e41;
        }

        .document-body {
          display: flex;
          flex-direction: column;
          gap: 4rem;
        }

        .document-section-block {
          position: relative;
          padding-left: 2.5rem;
          border-left: 2px solid #e8e2db;
        }

        .section-label-container {
          margin-bottom: 1.5rem;
        }

        .section-label {
          font-size: 1.1rem;
          font-weight: 700;
          color: #8c7e6d;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin: 0 0 0.5rem 0;
        }

        .section-divider {
          height: 1px;
          background: #eee8e0;
          width: 100%;
        }

        .section-content-wrapper {
          padding-top: 0.5rem;
        }

        .section-body-text {
          line-height: 1.8;
          font-size: 1.15rem;
          text-align: justify;
        }

        .paragraph {
          margin-bottom: 1.5rem;
        }

        .list-item {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.8rem;
          align-items: flex-start;
        }

        .bullet-marker {
          color: #8c7e6d;
          font-weight: bold;
        }

        .list-content {
          flex: 1;
        }

        .sub-section-header {
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #5d4e41;
          font-size: 1.3rem;
          font-weight: 700;
          text-decoration: underline;
          text-underline-offset: 4px;
          text-decoration-thickness: 1px;
        }

        strong {
          color: #443c35;
          font-weight: 700;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Dark mode overrides if needed */
        [data-theme="dark"] .guide-document-container {
          background: #1a1918;
          color: #d1c7bc;
        }
        [data-theme="dark"] .document-title { color: #e8e2db; }
        [data-theme="dark"] .document-header { border-color: #3d3b38; }
        [data-theme="dark"] .section-divider { background: #3d3b38; }
        [data-theme="dark"] .document-section-block { border-color: #3d3b38; }
        [data-theme="dark"] strong { color: #fff; }
      `}</style>
    </div>
  );
}
