import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { setsApi, studyApi } from '../utils/api';
import { gradeAnswer, isCorrect } from '../utils/grading';

export default function LearnMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const sessionCreated = useRef(false);
  const [set, setSet] = useState(null);
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [session, setSession] = useState(null);
  const [sessionStats, setSessionStats] = useState({ studied: 0, correct: 0, incorrect: 0 });
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    sessionCreated.current = false;

    async function loadSet() {
      try {
        const data = await setsApi.getOne(id);
        if (cancelled) return;
        setSet(data);
        const shuffledCards = [...(data.cards || [])].sort(() => Math.random() - 0.5);
        setCards(shuffledCards);
        if (!sessionCreated.current) {
          sessionCreated.current = true;
          const sess = await studyApi.createSession(Number(id), 'learn');
          if (cancelled) return;
          setSession(sess);
        }
      } catch (err) {
        console.error('Failed to load set:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSet();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (inputRef.current && !feedback && !revealed) {
      inputRef.current.focus();
    }
  }, [currentIndex, feedback, revealed]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!userAnswer.trim() || revealed) return;

    const card = cards[currentIndex];
    const result = gradeAnswer(userAnswer, card.term, card.aliases || []);
    const correct = isCorrect(result);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (correct) {
      setFeedback({
        type: result.result === 'close' ? 'close-enough' : 'correct',
        message: result.result === 'exact'
          ? 'Correct!'
          : result.result === 'alias'
            ? `Correct! (matched alias: "${result.matchedWith}")`
            : `Close enough! The exact answer is: "${card.term}"`,
        similarity: result.similarity
      });

      // Record review
      try {
        await studyApi.recordReview({
          cardId: card.id,
          sessionId: session?.id,
          wasCorrect: true,
          responseText: userAnswer,
          attempts: newAttempts,
          mode: 'learn'
        });
      } catch (err) {
        console.error('Failed to record review:', err);
      }

      setSessionStats(prev => ({ ...prev, studied: prev.studied + 1, correct: prev.correct + 1 }));

      // Auto advance after 1.5s
      setTimeout(() => {
        advanceCard();
      }, 1500);

    } else {
      if (newAttempts >= 2) {
        // Reveal after 2 incorrect attempts
        setRevealed(true);
        setFeedback({
          type: 'incorrect',
          message: `The correct answer is: "${card.term}"`
        });

        try {
          await studyApi.recordReview({
            cardId: card.id,
            sessionId: session?.id,
            wasCorrect: false,
            responseText: userAnswer,
            attempts: newAttempts,
            mode: 'learn'
          });
        } catch (err) {
          console.error('Failed to record review:', err);
        }

        setSessionStats(prev => ({ ...prev, studied: prev.studied + 1, incorrect: prev.incorrect + 1 }));
      } else {
        setFeedback({
          type: 'incorrect',
          message: `Incorrect. Try again! (${2 - newAttempts} attempt${2 - newAttempts !== 1 ? 's' : ''} remaining)`
        });
        setUserAnswer('');
      }
    }
  }

  function advanceCard() {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer('');
      setFeedback(null);
      setAttempts(0);
      setRevealed(false);
    } else {
      completeSession();
    }
  }

  async function completeSession() {
    setCompleted(true);
    if (session) {
      try {
        await studyApi.endSession(session.id, {
          cardsStudied: sessionStats.studied,
          correctCount: sessionStats.correct,
          incorrectCount: sessionStats.incorrect
        });
      } catch (err) {
        console.error('Failed to end session:', err);
      }
    }
  }

  function handleSkip() {
    setSessionStats(prev => ({ ...prev, studied: prev.studied + 1, incorrect: prev.incorrect + 1 }));
    advanceCard();
  }

  if (loading) return <div className="loading"><div className="spinner"></div> Loading learn mode...</div>;
  if (!set || cards.length === 0) {
    return (
      <div className="empty-state">
        <h3>No cards to study</h3>
        <p>This set has no cards. Add some cards first.</p>
        <Link to={`/sets/${id}/edit`} className="btn btn-primary">Add Cards</Link>
      </div>
    );
  }

  if (completed) {
    const total = sessionStats.studied;
    const accuracy = total > 0 ? Math.round((sessionStats.correct / total) * 100) : 0;
    return (
      <div className="learn-container">
        <div className="session-complete panel">
          <h2>Session Complete</h2>
          <div className="score">{accuracy}%</div>
          <div className="session-stats">
            <div><strong>{total}</strong> studied</div>
            <div style={{ color: 'var(--success)' }}><strong>{sessionStats.correct}</strong> correct</div>
            <div style={{ color: 'var(--error)' }}><strong>{sessionStats.incorrect}</strong> incorrect</div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            <button className="btn btn-secondary" onClick={() => navigate(`/sets/${id}`)}>Back to Set</button>
            <button className="btn btn-primary" onClick={() => { setCompleted(false); setCurrentIndex(0); setUserAnswer(''); setFeedback(null); setAttempts(0); setRevealed(false); setSessionStats({ studied: 0, correct: 0, incorrect: 0 }); loadSet(); }}>
              Study Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const card = cards[currentIndex];

  return (
    <div className="learn-container">
      <div className="breadcrumb">
        <Link to={`/sets/${id}`}>{set.title}</Link>
        <span>/</span>
        <span>Learn Mode</span>
      </div>

      <h2 style={{ marginBottom: '1.5rem' }}>Learn Mode</h2>

      <div className="flashcard-progress">
        <div className="progress-bar" style={{ marginBottom: '0.5rem' }}>
          <div className="progress-fill" style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}></div>
        </div>
        Card {currentIndex + 1} of {cards.length}
      </div>

      <div className="learn-prompt">
        <div className="learn-prompt-label">Definition</div>
        <div className="learn-prompt-text">{card.definition}</div>
      </div>

      {feedback && (
        <div className={`learn-feedback ${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      {!revealed && !feedback?.type?.includes('correct') && feedback?.type !== 'close-enough' ? (
        <form onSubmit={handleSubmit}>
          <div className="learn-input-area">
            <input
              ref={inputRef}
              type="text"
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              placeholder="Type the term..."
              autoFocus
            />
            <button type="submit" className="btn btn-primary">Check</button>
          </div>
        </form>
      ) : null}

      <div className="learn-stats">
        <div style={{ color: 'var(--success)' }}>Correct: {sessionStats.correct}</div>
        <div style={{ color: 'var(--error)' }}>Incorrect: {sessionStats.incorrect}</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
        {revealed && (
          <button className="btn btn-primary" onClick={advanceCard}>
            {currentIndex < cards.length - 1 ? 'Next Card' : 'Finish'}
          </button>
        )}
        {!revealed && !feedback?.type?.includes('correct') && feedback?.type !== 'close-enough' && (
          <button className="btn btn-ghost btn-sm" onClick={handleSkip}>Skip</button>
        )}
      </div>
    </div>
  );
}
