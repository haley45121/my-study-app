import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { setsApi } from '../utils/api';

export default function SetDetail() {
  const { id } = useParams();
  const [set, setSet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSet();
  }, [id]);

  async function loadSet() {
    try {
      const data = await setsApi.getOne(id);
      setSet(data);
    } catch (err) {
      console.error('Failed to load set:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="loading"><div className="spinner"></div> Loading...</div>;
  if (!set) return <div className="empty-state"><h3>Set not found</h3><Link to="/folders">Back to Folders</Link></div>;

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/folders">Folders</Link>
        <span>/</span>
        {set.folderName && <><Link to={`/folders/${set.folderId}`}>{set.folderName}</Link><span>/</span></>}
        <span>{set.title}</span>
      </div>

      <div className="page-header">
        <div>
          <h1>{set.title}</h1>
          {set.description && <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{set.description}</p>}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to={`/sets/${id}/edit`} className="btn btn-secondary">Edit Cards</Link>
          <Link to={`/sets/${id}/flashcards`} className="btn btn-primary">Flashcard Mode</Link>
          <Link to={`/sets/${id}/learn`} className="btn btn-primary" style={{ background: 'var(--accent-sage)', color: 'var(--bg-primary)' }}>Learn Mode</Link>
          <Link to={`/progress/sets/${id}`} className="btn btn-secondary">View Progress</Link>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-value">{set.cards ? set.cards.length : 0}</div>
          <div className="stat-label">Cards</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent-sage-bright)' }}>
            {set.cards ? set.cards.filter(c => c.sr && c.sr.interval >= 21).length : 0}
          </div>
          <div className="stat-label">Mastered</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent-rose-bright)' }}>
            {set.cards ? set.cards.filter(c => c.sr && c.sr.nextReviewDate <= new Date().toISOString().split('T')[0]).length : 0}
          </div>
          <div className="stat-label">Due</div>
        </div>
      </div>

      {set.cards && set.cards.length > 0 ? (
        <div className="panel">
          <h3 style={{ marginBottom: '1rem' }}>Cards ({set.cards.length})</h3>
          {set.cards.map((card, index) => (
            <div key={card.id} style={{ 
              display: 'grid', 
              gridTemplateColumns: '2rem 1fr 1fr', 
              gap: '1rem', 
              padding: '0.75rem 0',
              borderBottom: index < set.cards.length - 1 ? '1px solid var(--border-primary)' : 'none',
              alignItems: 'start'
            }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>{index + 1}</span>
              <div>
                <div style={{ fontWeight: 500 }}>{card.term}</div>
                {card.aliases && card.aliases.length > 0 && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
                    Aliases: {card.aliases.join(', ')}
                  </div>
                )}
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>{card.definition}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No cards in this set</h3>
          <p>Add cards to start studying.</p>
          <Link to={`/sets/${id}/edit`} className="btn btn-primary">Add Cards</Link>
        </div>
      )}
    </div>
  );
}
