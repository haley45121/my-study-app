import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { progressApi, studyApi } from '../utils/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const data = await progressApi.getDashboard();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div> Loading dashboard...</div>;
  }

  if (!stats) {
    return <div className="empty-state"><h3>Could not load dashboard</h3><p>Make sure the server is running.</p></div>;
  }

  const accuracy = (stats?.totalReviews || 0) > 0 
    ? Math.round(((stats?.correctReviews || 0) / stats.totalReviews) * 100) 
    : 0;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-value">{stats.totalFolders}</div>
          <div className="stat-label">Folders</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalSets}</div>
          <div className="stat-label">Study Sets</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalCards}</div>
          <div className="stat-label">Total Cards</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: stats.dueCards > 0 ? 'var(--accent-rose-bright)' : 'var(--accent-sage-bright)' }}>
            {stats.dueCards}
          </div>
          <div className="stat-label">Due for Review</div>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent-sage-bright)' }}>{stats.masteredCards}</div>
          <div className="stat-label">Mastered</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent-rose-bright)' }}>{stats.weakCards}</div>
          <div className="stat-label">Weak Cards</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{accuracy}%</div>
          <div className="stat-label">Accuracy</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="panel">
          <h3 style={{ marginBottom: '1rem' }}>Study Overview</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Total Sessions</span>
            <span>{stats.totalSessions}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Total Reviews</span>
            <span>{stats.totalReviews}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Correct</span>
            <span style={{ color: 'var(--success)' }}>{stats.correctReviews}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Incorrect</span>
            <span style={{ color: 'var(--error)' }}>{stats.incorrectReviews}</span>
          </div>
        </div>

        <div className="panel">
          <h3 style={{ marginBottom: '1rem' }}>Quick Access</h3>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <Link to="/folders" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              &#9776; Browse Folders
            </Link>
            <Link to="/notes" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              &#9998; Notes
            </Link>
            <Link to="/cornell-notes" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              &#9744; Cornell Notes
            </Link>
            <Link to="/import-export" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              &#8693; Import / Export
            </Link>
          </div>
        </div>
      </div>

      {stats.recentSessions && stats.recentSessions.length > 0 && (
        <div className="panel">
          <h3 style={{ marginBottom: '1rem' }}>Recent Activity</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.6rem 0.85rem', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Set</th>
                  <th style={{ textAlign: 'left', padding: '0.6rem 0.85rem', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Mode</th>
                  <th style={{ textAlign: 'center', padding: '0.6rem 0.85rem', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Cards</th>
                  <th style={{ textAlign: 'center', padding: '0.6rem 0.85rem', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Score</th>
                  <th style={{ textAlign: 'right', padding: '0.6rem 0.85rem', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentSessions.map(session => (
                  <tr key={session.id}>
                    <td style={{ padding: '0.6rem 0.85rem', borderBottom: '1px solid var(--border-primary)' }}>{session.setTitle}</td>
                    <td style={{ padding: '0.6rem 0.85rem', borderBottom: '1px solid var(--border-primary)' }}>
                      <span className={`badge ${session.mode === 'flashcard' ? 'badge-gold' : 'badge-sage'}`}>{session.mode}</span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '0.6rem 0.85rem', borderBottom: '1px solid var(--border-primary)' }}>{session.cardsStudied}</td>
                    <td style={{ textAlign: 'center', padding: '0.6rem 0.85rem', borderBottom: '1px solid var(--border-primary)' }}>
                      {session.cardsStudied > 0 ? `${session.correctCount}/${session.cardsStudied}` : '--'}
                    </td>
                    <td style={{ textAlign: 'right', padding: '0.6rem 0.85rem', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-tertiary)' }}>
                      {new Date(session.startedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
