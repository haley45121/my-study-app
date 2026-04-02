import { useState, useRef, useEffect } from 'react';
import { learnApi } from '../../utils/api';
import { Trophy, Sparkles, CheckCircle, XCircle } from 'lucide-react';

export default function RecallArena({ pairs, onExit }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [grading, setGrading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [scores, setScores] = useState({ correct: 0, total: 0 });
  const [showSummary, setShowSummary] = useState(false);
  const inputRef = useRef(null);

  const pair = pairs[currentIndex];

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [currentIndex, grading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userAnswer.trim() || feedback) return;

    setGrading(true);
    try {
      const result = await learnApi.grade(userAnswer, pair.term);
      setFeedback(result);
      setScores(prev => ({
        total: prev.total + 1,
        correct: result.isCorrect ? prev.correct + 1 : prev.correct
      }));
    } catch (err) {
      alert('Grading failed: ' + err.message);
    } finally {
      setGrading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < pairs.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer('');
      setFeedback(null);
    } else {
      setShowSummary(true);
    }
  };

  if (showSummary) {
    const accuracy = Math.round((scores.correct / scores.total) * 100);
    const isPerfect = accuracy === 100;
    
    return (
      <div className="summary-view panel animate-in">
        {accuracy >= 80 && (
          <div className="confetti-container">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="confetti-piece" style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                backgroundColor: ['#ffcd3c', '#ff4d6d', '#4cc9f0', '#7209b7', '#4895ef'][Math.floor(Math.random() * 5)]
              }}></div>
            ))}
          </div>
        )}
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          {isPerfect ? <><Trophy size={28} className="text-accent-primary" /> Absolute Perfection!</> : accuracy >= 80 ? <><Sparkles size={28} className="text-accent-primary" /> Brilliant Effort!</> : 'Recall Results'}
        </h2>
        <div className="accuracy-circle">
          <div className="accuracy-value" style={{ color: accuracy >= 80 ? 'var(--accent-primary)' : 'inherit' }}>{accuracy}%</div>
          <div className="accuracy-label">Accuracy</div>
        </div>
        <div className="summary-stats">
          <div className="stat">
            <div className="stat-value">{scores.correct}</div>
            <div className="stat-label">Correct</div>
          </div>
          <div className="stat">
            <div className="stat-value">{scores.total - scores.correct}</div>
            <div className="stat-label">Incorrect</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={onExit}>Finish</button>
        </div>
      </div>
    );
  }

  return (
    <div className="recall-arena animate-in">
      <div className="quiz-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${((currentIndex + 1) / pairs.length) * 100}%` }}></div>
        </div>
        <div className="progress-text">Concept {currentIndex + 1} of {pairs.length}</div>
      </div>

      <div className="panel" style={{ padding: '2.5rem' }}>
        <div className="recall-prompt-box">
          <div className="label">DEFINITION</div>
          <div className="definition-content">{pair.definition}</div>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
          <div className="recall-input-container">
            <input
              ref={inputRef}
              type="text"
              className={`recall-input ${feedback ? (feedback.isCorrect ? 'correct' : 'incorrect') : ''}`}
              placeholder="Type the term..."
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              disabled={grading || feedback}
              autoComplete="off"
            />
            {!feedback && (
              <button type="submit" className="btn btn-primary recall-submit-btn" disabled={grading || !userAnswer.trim()}>
                {grading ? <div className="spinner spinner-white"></div> : 'Check'}
              </button>
            )}
          </div>
        </form>

        {feedback && (
          <div className={`recall-feedback-box ${feedback.isCorrect ? 'correct' : 'incorrect'} animate-in`}>
            <div className="feedback-content">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                {feedback.isCorrect ? (feedback.score > 0.95 ? <><Trophy size={24} /> Perfect!</> : <><Sparkles size={24} /> Correct!</>) : <><XCircle size={24} /> Incorrect</>}
              </h3>
              <p className="feedback-text" style={{ textAlign: 'center' }}>{feedback.feedback}</p>
              
              {!feedback.isCorrect && (
                <div className="correct-answer-reveal">
                  Correct answer: <strong>{pair.term}</strong>
                </div>
              )}
            </div>
            
            <button className="btn btn-primary" onClick={handleNext} style={{ marginTop: '1.5rem', width: '100%' }}>
              {currentIndex < pairs.length - 1 ? 'Next Concept' : 'View Results'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .recall-arena { max-width: 700px; margin: 0 auto; }
        .recall-prompt-box {
          text-align: center;
          padding: 2rem;
          background: var(--bg-secondary);
          border-radius: 12px;
          border: 1px solid var(--border-color);
          position: relative;
        }
        .recall-prompt-box .label {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--accent-primary);
          color: white;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 4px 12px;
          border-radius: 20px;
          letter-spacing: 1px;
        }
        .definition-content {
          font-size: 1.25rem;
          line-height: 1.4;
          font-weight: 500;
        }
        .recall-input-container {
          display: flex;
          gap: 0.75rem;
          position: relative;
        }
        .recall-input {
          flex: 1;
          font-size: 1.1rem;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          border: 2px solid var(--border-color);
          background: var(--bg-panel);
          transition: all 0.2s ease;
        }
        .recall-input:focus {
          border-color: var(--accent-primary);
          outline: none;
          box-shadow: 0 0 0 4px rgba(var(--accent-rgb), 0.1);
        }
        .recall-input.correct { border-color: #22c55e; background: rgba(34, 197, 94, 0.05); }
        .recall-input.incorrect { border-color: #ef4444; background: rgba(239, 68, 68, 0.05); }
        
        .recall-feedback-box {
          margin-top: 1.5rem;
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid transparent;
        }
        .recall-feedback-box.correct { background: rgba(34, 197, 94, 0.05); border-color: rgba(34, 197, 94, 0.2); }
        .recall-feedback-box.incorrect { background: rgba(239, 68, 68, 0.05); border-color: rgba(239, 68, 68, 0.2); }
        
        .feedback-text {
          font-size: 0.95rem;
          margin: 0.5rem 0;
          color: var(--text-secondary);
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
        .summary-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .stat-value { font-size: 1.5rem; font-weight: 700; }
        .stat-label { font-size: 0.85rem; color: var(--text-muted); }

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
