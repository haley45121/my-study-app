import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { setsApi, studyApi } from '../utils/api';

export default function FlashcardMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [set, setSet] = useState(null);
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [session, setSession] = useState(null);
  const [sessionStats, setSessionStats] = useState({ studied: 0, correct: 0, incorrect: 0 });
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const sessionCreated = useRef(false);

  useEffect(() => {
    let cancelled = false;
    sessionCreated.current = false;

    async function loadSet() {
      try {
        const data = await setsApi.getOne(id);
        if (cancelled) return;
        setSet(data);
        setCards(data.cards || []);
        if (!sessionCreated.current) {
          sessionCreated.current = true;
          const sess = await studyApi.createSession(Number(id), 'flashcard');
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

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (completed) return;
    switch (e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault();
        setIsFlipped(f => !f);
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (currentIndex < cards.length - 1) {
          setCurrentIndex(i => i + 1);
          setIsFlipped(false);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (currentIndex > 0) {
          setCurrentIndex(i => i - 1);
          setIsFlipped(false);
        }
        break;
      case '1':
        handleRate(2);
        break;
      case '2':
        handleRate(3);
        break;
      case '3':
        handleRate(5);
        break;
    }
  }, [currentIndex, cards.length, completed]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  function shuffle() {
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShuffled(true);
  }

  function nextCard() {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  }

  function prevCard() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  }

  async function handleRate(quality) {
    const card = cards[currentIndex];
    const wasCorrect = quality >= 3;

    try {
      await studyApi.recordReview({
        cardId: card.id,
        sessionId: session?.id,
        wasCorrect,
        rating: quality,
        mode: 'flashcard'
      });

      setSessionStats(prev => ({
        studied: prev.studied + 1,
        correct: prev.correct + (wasCorrect ? 1 : 0),
        incorrect: prev.incorrect + (wasCorrect ? 0 : 1)
      }));

      // Move to next card or complete
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
      } else {
        completeSession();
      }
    } catch (err) {
      console.error('Failed to record review:', err);
    }
  }

  async function completeSession() {
    setCompleted(true);
    if (session) {
      try {
        await studyApi.endSession(session.id, {
          cardsStudied: sessionStats.studied + 1,
          correctCount: sessionStats.correct,
          incorrectCount: sessionStats.incorrect
        });
      } catch (err) {
        console.error('Failed to end session:', err);
      }
    }
  }

  if (loading) return <div className="loading"><div className="spinner"></div> Loading flashcards...</div>;
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
      <div className="flashcard-container">
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
            <button className="btn btn-primary" onClick={() => { setCompleted(false); setCurrentIndex(0); setIsFlipped(false); setSessionStats({ studied: 0, correct: 0, incorrect: 0 }); loadSet(); }}>
              Study Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const card = cards[currentIndex];

  return (
    <div className="flashcard-container">
      <div className="breadcrumb">
        <Link to={`/sets/${id}`}>{set.title}</Link>
        <span>/</span>
        <span>Flashcards</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Flashcard Mode</h2>
        <button className="btn btn-ghost btn-sm" onClick={shuffle}>
          {shuffled ? 'Reshuffled' : 'Shuffle'}
        </button>
      </div>

      <div className="flashcard-progress">
        <div className="progress-bar" style={{ marginBottom: '0.5rem' }}>
          <div className="progress-fill" style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}></div>
        </div>
        Card {currentIndex + 1} of {cards.length}
      </div>

      <div className="flashcard" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`flashcard-inner ${isFlipped ? 'flipped' : ''}`}>
          <div className="flashcard-front">
            <div className="flashcard-label">Term</div>
            <div className="flashcard-text">{card.term}</div>
          </div>
          <div className="flashcard-back">
            <div className="flashcard-label">Definition</div>
            <div className="flashcard-text">{card.definition}</div>
          </div>
        </div>
      </div>

      <div className="flashcard-controls">
        <button className="btn btn-secondary" onClick={prevCard} disabled={currentIndex === 0}>
          Previous
        </button>
        <button className="btn btn-primary" onClick={() => setIsFlipped(!isFlipped)}>
          {isFlipped ? 'Show Term' : 'Show Definition'}
        </button>
        <button className="btn btn-secondary" onClick={nextCard} disabled={currentIndex === cards.length - 1}>
          Next
        </button>
      </div>

      {isFlipped && (
        <div className="flashcard-rating">
          <button className="rating-btn rating-hard" onClick={() => handleRate(2)}>
            Needs Work (1)
          </button>
          <button className="rating-btn rating-good" onClick={() => handleRate(3)}>
            Good (2)
          </button>
          <button className="rating-btn rating-easy" onClick={() => handleRate(5)}>
            Easy (3)
          </button>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        Space/Enter to flip &middot; Arrow keys to navigate &middot; 1/2/3 to rate
      </div>
    </div>
  );
}
