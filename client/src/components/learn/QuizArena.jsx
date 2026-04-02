import { useState } from 'react';
import { Trophy, Sparkles, Lightbulb } from 'lucide-react';

export default function QuizArena({ questions, onExit }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [scores, setScores] = useState({ correct: 0, total: 0 });
  const [showSummary, setShowSummary] = useState(false);

  const question = questions[currentIndex];

  const handleOptionClick = (option) => {
    if (feedback) return;
    setSelectedOption(option);
    
    const isCorrect = option === question.correctAnswer;
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setScores(prev => ({
      total: prev.total + 1,
      correct: isCorrect ? prev.correct + 1 : prev.correct
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
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
          {isPerfect ? <><Trophy size={28} className="text-accent-primary" /> Absolute Perfection!</> : accuracy >= 80 ? <><Sparkles size={28} className="text-accent-primary" /> Great Job!</> : 'Quiz Results'}
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
    <div className="quiz-arena animate-in">
       <div className="quiz-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}></div>
        </div>
        <div className="progress-text">Question {currentIndex + 1} of {questions.length}</div>
      </div>

      <div className="panel" style={{ padding: '2rem' }}>
        <h2 className="question-text">{question.question}</h2>
        
        <div className="options-grid">
          {question.options.map((option, idx) => {
            let className = "option-card";
            if (selectedOption === option) {
              className += feedback === 'correct' ? " correct" : " incorrect";
            } else if (feedback && option === question.correctAnswer) {
              className += " revealed";
            }

            return (
              <div 
                key={idx} 
                className={className}
                onClick={() => handleOptionClick(option)}
              >
                <div className="option-letter">{String.fromCharCode(65 + idx)}</div>
                <div className="option-content">{option}</div>
              </div>
            );
          })}
        </div>

        {feedback && (
          <div className={`quiz-feedback-box ${feedback} animate-in`}>
            <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {feedback === 'correct' ? <><Sparkles size={24} /> Brilliant!</> : <><Lightbulb size={24} /> Not quite...</>}
            </h3>
            {feedback === 'incorrect' && (
              <p>The correct answer was: <strong>{question.correctAnswer}</strong></p>
            )}
            {question.explanation && <p className="explanation">{question.explanation}</p>}
            <button className="btn btn-primary" onClick={handleNext} style={{ marginTop: '1rem' }}>
              {currentIndex < questions.length - 1 ? 'Next Question' : 'View Results'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .quiz-arena {
          max-width: 800px;
          margin: 0 auto;
        }
        .quiz-progress {
          margin-bottom: 1.5rem;
        }
        .progress-text {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-top: 0.5rem;
          text-align: right;
        }
        .question-text {
          font-weight: 700;
          line-height: 1.3;
          margin-bottom: 2rem;
          text-align: center;
        }
        .options-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: 1fr 1fr;
        }
        .option-card {
          padding: 1.25rem;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 1rem;
          background: var(--bg-secondary);
        }
        .option-card:hover:not(.correct):not(.incorrect):not(.revealed) {
          border-color: var(--accent-primary);
          background: var(--bg-tertiary);
          transform: scale(1.02);
        }
        .option-letter {
          width: 32px;
          height: 32px;
          background: var(--bg-panel);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }
        .option-card.correct {
          background: rgba(34, 197, 94, 0.1);
          border-color: #22c55e;
          box-shadow: 0 0 15px rgba(34, 197, 94, 0.15);
        }
        .option-card.incorrect {
          background: rgba(239, 68, 68, 0.1);
          border-color: #ef4444;
        }
        .option-card.revealed {
          background: rgba(34, 197, 94, 0.05);
          border-color: #22c55e;
          border-style: dashed;
        }
        
        .quiz-feedback-box {
          margin-top: 2rem;
          padding: 1.5rem;
          border-radius: 12px;
          text-align: center;
        }
        .quiz-feedback-box.correct { background: rgba(34, 197, 94, 0.05); border: 1px solid rgba(34, 197, 94, 0.2); }
        .quiz-feedback-box.incorrect { background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); }
        
        .explanation {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-top: 0.75rem;
          font-style: italic;
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
        .summary-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .stat-value { font-size: 1.5rem; font-weight: 700; }
        .stat-label { font-size: 0.85rem; color: var(--text-muted); }

        @media (max-width: 600px) {
          .options-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
