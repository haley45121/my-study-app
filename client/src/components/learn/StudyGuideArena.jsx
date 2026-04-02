export default function StudyGuideArena({ guideText, onExit }) {
  
  const formatText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# ')) return <h1 key={i}>{line.substring(2)}</h1>;
      if (line.startsWith('## ')) return <h2 key={i}>{line.substring(3)}</h2>;
      if (line.startsWith('### ')) return <h3 key={i}>{line.substring(4)}</h3>;
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) return <li key={i} style={{ marginLeft: '1.5rem' }}>{line.replace(/^[-*]\s/, '')}</li>;
      if (!line.trim()) return <br key={i} />;
      return <p key={i}>{line}</p>;
    });
  };

  return (
    <div className="arena-container guide-arena">
      <div className="arena-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Study Guide</h2>
          <p className="text-secondary">AI-generated comprehensive review</p>
        </div>
        <button className="btn btn-secondary" onClick={onExit}>
          Done
        </button>
      </div>
      
      <div className="panel" style={{ padding: '2rem' }}>
        <div className="markdown-body">
          {formatText(guideText)}
        </div>
      </div>

      <style>{`
        .guide-arena {
          max-width: 900px;
          margin: 0 auto;
          animation: fadeIn 0.4s ease-out;
        }
        .markdown-body {
          font-family: var(--font-primary);
          line-height: 1.6;
        }
        .markdown-body h1, .markdown-body h2, .markdown-body h3 {
          margin-top: 1.5rem;
          margin-bottom: 1rem;
        }
        .markdown-body p {
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
}
