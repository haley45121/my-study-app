import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { progressApi, setsApi } from '../utils/api';

export default function Progress() {
  const { id: setId } = useParams();
  const [dashboardStats, setDashboardStats] = useState(null);
  const [setProgress, setSetProgress] = useState(null);
  const [allSets, setAllSets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (setId) {
      loadSetProgress(setId);
    } else {
      loadDashboard();
    }
  }, [setId]);

  async function loadDashboard() {
    try {
      const [stats, sets] = await Promise.all([
        progressApi.getDashboard(),
        setsApi.getAll()
      ]);
      setDashboardStats(stats);
      setAllSets(sets);
    } catch (err) {
      console.error('Failed to load progress:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadSetProgress(id) {
    try {
      const data = await progressApi.getSetProgress(id);
      setSetProgress(data);
    } catch (err) {
      console.error('Failed to load set progress:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="loading"><div className="spinner"></div> Loading progress...</div>;

  // Per-set progress view
  if (setId && setProgress) {
    const accuracy = setProgress.totalReviews > 0
      ? Math.round((setProgress.correctReviews / setProgress.totalReviews) * 100) : 0;

    return (
      <div>
        <div className="breadcrumb">
          <Link to="/progress">Progress</Link>
          <span>/</span>
          <span>{setProgress.set.title}</span>
        </div>

        <div className="page-header">
          <h1>Progress: {setProgress.set.title}</h1>
          <Link to={`/sets/${setId}`} className="btn btn-secondary">View Set</Link>
        </div>

        <div className="grid-4" style={{ marginBottom: '2rem' }}>
          <div className="stat-card">
            <div className="stat-value">{setProgress.totalCards}</div>
            <div className="stat-label">Total Cards</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--accent-sage-bright)' }}>{setProgress.masteredCards}</div>
            <div className="stat-label">Mastered</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--accent-rose-bright)' }}>{setProgress.weakCards}</div>
            <div className="stat-label">Weak</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{setProgress.dueCards}</div>
            <div className="stat-label">Due</div>
          </div>
        </div>

        <div className="grid-3" style={{ marginBottom: '2rem' }}>
          <div className="stat-card">
            <div className="stat-value">{setProgress.newCards}</div>
            <div className="stat-label">New</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{accuracy}%</div>
            <div className="stat-label">Accuracy</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{setProgress.totalReviews}</div>
            <div className="stat-label">Total Reviews</div>
          </div>
        </div>

        {setProgress.totalCards > 0 && (
          <div className="panel" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Mastery Distribution</h3>
            <div style={{ display: 'flex', gap: '0.25rem', height: '24px', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              {setProgress.masteredCards > 0 && (
                <div style={{ flex: setProgress.masteredCards, background: 'var(--success)' }} title={`${setProgress.masteredCards} mastered`}></div>
              )}
              {(setProgress.totalCards - setProgress.masteredCards - setProgress.weakCards - setProgress.newCards) > 0 && (
                <div style={{ flex: setProgress.totalCards - setProgress.masteredCards - setProgress.weakCards - setProgress.newCards, background: 'var(--accent-gold)' }} title="Learning"></div>
              )}
              {setProgress.weakCards > 0 && (
                <div style={{ flex: setProgress.weakCards, background: 'var(--error)' }} title={`${setProgress.weakCards} weak`}></div>
              )}
              {setProgress.newCards > 0 && (
                <div style={{ flex: setProgress.newCards, background: 'var(--bg-tertiary)' }} title={`${setProgress.newCards} new`}></div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
              <span style={{ color: 'var(--success)' }}>Mastered</span>
              <span style={{ color: 'var(--accent-gold)' }}>Learning</span>
              <span style={{ color: 'var(--error)' }}>Weak</span>
              <span>New</span>
            </div>
          </div>
        )}

        {setProgress.cardProgress && setProgress.cardProgress.length > 0 && (
          <div className="panel">
            <h3 style={{ marginBottom: '1rem' }}>Card Details</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Term</th>
                    <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Reviews</th>
                    <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Correct</th>
                    <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Interval</th>
                    <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Next Review</th>
                    <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {setProgress.cardProgress.map(card => {
                    const status = !card.repetitions ? 'New' : card.interval >= 21 ? 'Mastered' : card.easeFactor < 2.0 ? 'Weak' : 'Learning';
                    const badgeClass = status === 'Mastered' ? 'badge-sage' : status === 'Weak' ? 'badge-rose' : status === 'New' ? '' : 'badge-gold';
                    return (
                      <tr key={card.id}>
                        <td style={{ padding: '0.6rem', borderBottom: '1px solid var(--border-primary)' }}>{card.term}</td>
                        <td style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '1px solid var(--border-primary)' }}>{card.reviewCount}</td>
                        <td style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '1px solid var(--border-primary)' }}>{card.correctCount}</td>
                        <td style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '1px solid var(--border-primary)' }}>{card.interval || 0}d</td>
                        <td style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-tertiary)' }}>
                          {card.nextReviewDate || 'Not started'}
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '1px solid var(--border-primary)' }}>
                          <span className={`badge ${badgeClass}`}>{status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {setProgress.sessions && setProgress.sessions.length > 0 && (
          <div className="panel" style={{ marginTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Study Sessions</h3>
            {setProgress.sessions.map(session => (
              <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border-primary)' }}>
                <div>
                  <span className={`badge ${session.mode === 'flashcard' ? 'badge-gold' : 'badge-sage'}`}>{session.mode}</span>
                  <span style={{ marginLeft: '0.75rem' }}>{session.cardsStudied} cards</span>
                </div>
                <span style={{ color: 'var(--text-tertiary)' }}>{new Date(session.startedAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Dashboard progress
  if (!dashboardStats) return <div className="empty-state"><h3>No progress data</h3></div>;

  const accuracy = dashboardStats.totalReviews > 0
    ? Math.round((dashboardStats.correctReviews / dashboardStats.totalReviews) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <h1>Progress</h1>
      </div>

      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-value">{dashboardStats.totalCards}</div>
          <div className="stat-label">Total Cards</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{dashboardStats.totalSessions}</div>
          <div className="stat-label">Sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{accuracy}%</div>
          <div className="stat-label">Accuracy</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: dashboardStats.dueCards > 0 ? 'var(--accent-rose-bright)' : 'var(--accent-sage-bright)' }}>
            {dashboardStats.dueCards}
          </div>
          <div className="stat-label">Due for Review</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="panel">
          <h3 style={{ marginBottom: '1rem' }}>Review Breakdown</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{dashboardStats.correctReviews}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Correct</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--error)' }}>{dashboardStats.incorrectReviews}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Incorrect</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-sage-bright)' }}>{dashboardStats.masteredCards}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Mastered</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-rose-bright)' }}>{dashboardStats.weakCards}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Weak</div>
            </div>
          </div>
        </div>

        <div className="panel">
          <h3 style={{ marginBottom: '1rem' }}>Recent Activity (7 Days)</h3>
          {dashboardStats.recentActivity && dashboardStats.recentActivity.length > 0 ? (
            dashboardStats.recentActivity.map(day => (
              <div key={day.date} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-primary)' }}>
                <span>{new Date(day.date).toLocaleDateString()}</span>
                <span>{day.reviews} reviews ({day.correct} correct)</span>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-tertiary)' }}>No recent activity</p>
          )}
        </div>
      </div>

      {allSets.length > 0 && (
        <div className="panel">
          <h3 style={{ marginBottom: '1rem' }}>Progress by Set</h3>
          <div className="item-list">
            {allSets.map(s => (
              <Link key={s.id} to={`/progress/sets/${s.id}`} className="item-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="item-card-info">
                  <h3>{s.title}</h3>
                  <p>{s.cardCount || 0} cards {s.folderName ? `in ${s.folderName}` : ''}</p>
                </div>
                <span className="btn btn-ghost btn-sm">View Details</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
