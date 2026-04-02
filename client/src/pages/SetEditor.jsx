import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { setsApi, cardsApi } from '../utils/api';

export default function SetEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';
  const [set, setSet] = useState(null);
  const [cards, setCards] = useState([{ term: '', definition: '', aliases: '' }]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      loadSet();
    }
  }, [id]);

  async function loadSet() {
    try {
      const data = await setsApi.getOne(id);
      setSet(data);
      setTitle(data.title);
      setDescription(data.description || '');
      if (data.cards && data.cards.length > 0) {
        setCards(data.cards.map(c => ({
          id: c.id,
          term: c.term,
          definition: c.definition,
          aliases: (c.aliases || []).join('; '),
          existing: true
        })));
      }
    } catch (err) {
      console.error('Failed to load set:', err);
    } finally {
      setLoading(false);
    }
  }

  function addCard() {
    setCards([...cards, { term: '', definition: '', aliases: '' }]);
  }

  function addBulkCards() {
    const newCards = Array(5).fill(null).map(() => ({ term: '', definition: '', aliases: '' }));
    setCards([...cards, ...newCards]);
  }

  function updateCard(index, field, value) {
    const updated = [...cards];
    updated[index] = { ...updated[index], [field]: value };
    setCards(updated);
  }

  function removeCard(index) {
    if (cards.length <= 1) return;
    setCards(cards.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Update title/description
      if (!isNew) {
        await setsApi.update(id, { title, description });
      }

      // Separate new cards from existing
      const newCards = cards
        .filter(c => !c.existing && c.term.trim() && c.definition.trim())
        .map(c => ({
          term: c.term.trim(),
          definition: c.definition.trim(),
          aliases: c.aliases ? c.aliases.split(';').map(a => a.trim()).filter(Boolean) : []
        }));

      // Update existing cards
      const existingCards = cards.filter(c => c.existing && c.id);
      for (const card of existingCards) {
        await cardsApi.update(card.id, {
          term: card.term.trim(),
          definition: card.definition.trim()
        });
      }

      // Add new cards
      if (newCards.length > 0 && !isNew) {
        await setsApi.addCards(id, newCards);
      }

      navigate(`/sets/${id}`);
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  // Delete a card that exists in DB
  async function deleteExistingCard(index) {
    const card = cards[index];
    if (card.existing && card.id) {
      try {
        await cardsApi.delete(card.id);
      } catch (err) {
        alert('Failed to delete card: ' + err.message);
        return;
      }
    }
    removeCard(index);
  }

  if (loading) return <div className="loading"><div className="spinner"></div> Loading...</div>;

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/folders">Folders</Link>
        <span>/</span>
        {set && set.folderName && <><Link to={`/folders/${set.folderId}`}>{set.folderName}</Link><span>/</span></>}
        {!isNew && <><Link to={`/sets/${id}`}>{set?.title || 'Set'}</Link><span>/</span></>}
        <span>Edit</span>
      </div>

      <div className="page-header">
        <h1>{isNew ? 'New Study Set' : `Edit: ${title}`}</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate(isNew ? '/folders' : `/sets/${id}`)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: '1.5rem' }}>
        <div className="grid-2">
          <div className="form-group">
            <label>Set Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter set title" />
          </div>
          <div className="form-group">
            <label>Description (optional)</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description" />
          </div>
        </div>
      </div>

      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Cards ({cards.filter(c => c.term.trim() || c.definition.trim()).length})</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={addBulkCards}>+ Add 5</button>
            <button className="btn btn-secondary btn-sm" onClick={addCard}>+ Add Card</button>
          </div>
        </div>

        {cards.map((card, index) => (
          <div key={index} className="card-editor-row">
            <div>
              <div className="card-editor-number">#{index + 1}</div>
              <input
                type="text"
                value={card.term}
                onChange={e => updateCard(index, 'term', e.target.value)}
                placeholder="Term"
              />
            </div>
            <div>
              <div className="card-editor-number">Definition</div>
              <input
                type="text"
                value={card.definition}
                onChange={e => updateCard(index, 'definition', e.target.value)}
                placeholder="Definition"
              />
              <input
                type="text"
                value={card.aliases || ''}
                onChange={e => updateCard(index, 'aliases', e.target.value)}
                placeholder="Aliases (semicolon separated)"
                style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}
              />
            </div>
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--error)', marginTop: '1.25rem' }}
              onClick={() => card.existing ? deleteExistingCard(index) : removeCard(index)}
            >
              &times;
            </button>
          </div>
        ))}

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={addCard}>+ Add Another Card</button>
        </div>
      </div>
    </div>
  );
}
