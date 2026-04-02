import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';

export default function MatchingGame({ pairs, onExit }) {
  const [cards, setCards] = useState([]);
  const [selected, setSelected] = useState(null);
  const [matches, setMatches] = useState([]);
  const [wrong, setWrong] = useState(null);
  const [startTime] = useState(Date.now());
  const [endTime, setEndTime] = useState(null);

  useEffect(() => {
    // Take up to 6 random pairs for a quick game
    const gamePairs = [...pairs].sort(() => Math.random() - 0.5).slice(0, 6);
    
    // Create 12 cards (6 terms, 6 definitions)
    const cardSet = [];
    gamePairs.forEach((p, idx) => {
      cardSet.push({ id: `t-${idx}`, val: p.term, type: 'term', pairId: idx });
      cardSet.push({ id: `d-${idx}`, val: p.definition, type: 'def', pairId: idx });
    });

    setCards(cardSet.sort(() => Math.random() - 0.5));
  }, [pairs]);

  const handleCardClick = (card) => {
    if (matches.includes(card.id) || (wrong && (wrong.c1 === card.id || wrong.c2 === card.id))) return;
    if (selected && selected.id === card.id) {
      setSelected(null);
      return;
    }

    if (!selected) {
      setSelected(card);
    } else {
      // Check match
      if (selected.pairId === card.pairId && selected.type !== card.type) {
        const newMatches = [...matches, selected.id, card.id];
        setMatches(newMatches);
        setSelected(null);
        
        if (newMatches.length === cards.length) {
          setEndTime(Date.now());
        }
      } else {
        // Mismatch
        setWrong({ c1: selected.id, c2: card.id });
        setSelected(null);
        setTimeout(() => setWrong(null), 1000);
      }
    }
  };

  if (endTime) {
    const timeTaken = Math.round((endTime - startTime) / 1000);
    return (
      <div className="summary-view panel animate-in">
        <div className="confetti-container">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="confetti-piece" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              backgroundColor: ['#ffcd3c', '#ff4d6d', '#4cc9f0', '#7209b7', '#4895ef'][Math.floor(Math.random() * 5)]
            }}></div>
          ))}
        </div>
        <div className="game-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--accent-primary)' }}>
          <Trophy size={64} />
        </div>
        <h2>Amazing Performance!</h2>
        <p className="text-secondary" style={{ marginBottom: '2rem' }}>You matched all pairs in record time.</p>
        
        <div className="accuracy-circle">
          <div className="accuracy-value">{timeTaken}s</div>
          <div className="accuracy-label">Time</div>
        </div>

        <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={onExit}>
          Finish Game
        </button>
      </div>
    );
  }

  return (
    <div className="game-arena animate-in">
      <div className="game-header">
        <div className="match-counter">Matches: {matches.length / 2} / {cards.length / 2}</div>
      </div>

      <div className="matching-grid">
        {cards.map(card => {
          const isMatched = matches.includes(card.id);
          const isSelected = selected?.id === card.id;
          const isWrong = wrong?.c1 === card.id || wrong?.c2 === card.id;
          
          let className = "game-card";
          if (isMatched) className += " matched";
          if (isSelected) className += " selected";
          if (isWrong) className += " wrong";
          if (card.type === 'def') className += " definition-card";

          return (
            <div 
              key={card.id} 
              className={className}
              onClick={() => handleCardClick(card)}
            >
              <div className="card-content">{card.val}</div>
            </div>
          );
        })}
      </div>

      <style>{`
        .game-arena { max-width: 900px; margin: 0 auto; }
        .game-header { margin-bottom: 2rem; text-align: center; }
        .match-counter { font-weight: 700; color: var(--accent-primary); font-size: 1.25rem; }
        
        .matching-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }
        .game-card {
          height: 140px;
          background: var(--bg-panel);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 0.9rem;
          font-weight: 500;
          box-shadow: var(--shadow-sm);
        }
        .game-card:hover:not(.matched) {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: var(--border-highlight);
        }
        .game-card.selected {
          border-color: var(--accent-primary);
          background: var(--bg-secondary);
          box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.1);
          transform: translateY(-4px);
        }
        .game-card.matched {
          opacity: 0.3;
          cursor: default;
          pointer-events: none;
          transform: scale(0.95);
        }
        .game-card.wrong {
          background: rgba(239, 68, 68, 0.1);
          border-color: #ef4444;
          animation: shake 0.5s ease;
        }
        .definition-card {
          font-size: 0.8rem;
          font-weight: 400;
        }

        .summary-view {
          max-width: 500px;
          margin: 4rem auto;
          text-align: center;
          padding: 3rem;
          position: relative;
          overflow: hidden;
        }
        .accuracy-circle {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          border: 8px solid var(--accent-primary);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 0 auto 2rem;
        }
        .accuracy-value { font-size: 2.5rem; font-weight: 800; }
        .accuracy-label { font-size: 0.85rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; }

        /* Confetti Animation */
        .confetti-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
        }
        .confetti-piece {
          position: absolute;
          width: 10px;
          height: 10px;
          top: -10px;
          opacity: 0;
          animation: fall 3s linear forwards;
        }
        @keyframes fall {
          0% { transform: translateY(0) rotate(0); opacity: 1; }
          100% { transform: translateY(400px) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
