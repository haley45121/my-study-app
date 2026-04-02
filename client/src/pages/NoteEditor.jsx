import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { notesApi, foldersApi, setsApi, importExportApi } from '../utils/api';
import { Sparkles } from 'lucide-react';

export default function NoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folderId, setFolderId] = useState('');
  const [setId, setSetId] = useState('');
  const [folders, setFolders] = useState([]);
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadOptions();
    if (!isNew) loadNote();
  }, [id]);

  async function loadOptions() {
    try {
      const [foldersData, setsData] = await Promise.all([foldersApi.getAll(), setsApi.getAll()]);
      setFolders(foldersData);
      setSets(setsData);
    } catch (err) {
      console.error('Failed to load options:', err);
    }
  }

  async function loadNote() {
    try {
      const note = await notesApi.getOne(id);
      setTitle(note.title);
      setContent(note.content || '');
      setFolderId(note.folderId || '');
      setSetId(note.setId || '');
    } catch (err) {
      console.error('Failed to load note:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!title.trim()) { alert('Title is required'); return; }
    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        content,
        folderId: folderId || null,
        setId: setId || null
      };
      if (isNew) {
        await notesApi.create(data);
      } else {
        await notesApi.update(id, data);
      }
      navigate('/notes');
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateFlashcards() {
    if (!content.trim()) { alert('Add some content first to generate flashcards!'); return; }
    setGenerating(true);
    try {
      const result = await importExportApi.generateFromText({ text: content, filename: title || 'Note' });
      if (result.candidates && result.candidates.length > 0) {
        navigate('/import-export', { 
          state: { 
            textGenerationResult: result.candidates,
            filename: title || 'Note'
          } 
        });
      } else {
        alert('Could not generate any flashcards from this text.');
      }
    } catch (err) {
      alert('Generation failed: ' + err.message);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return <div className="loading"><div className="spinner"></div> Loading...</div>;

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/notes">Notes</Link>
        <span>/</span>
        <span>{isNew ? 'New Note' : 'Edit'}</span>
      </div>

      <div className="page-header">
        <h1>{isNew ? 'New Note' : `Edit: ${title}`}</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" className="btn btn-secondary" onClick={handleGenerateFlashcards} disabled={generating || !content.trim()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} /> {generating ? 'Generating...' : 'Generate Flashcards'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/notes')}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="panel" style={{ marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label>Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Note title" autoFocus />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Link to Folder (optional)</label>
              <select value={folderId} onChange={e => setFolderId(e.target.value)}>
                <option value="">None</option>
                {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Link to Set (optional)</label>
              <select value={setId} onChange={e => setSetId(e.target.value)}>
                <option value="">None</option>
                {sets.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="form-group">
            <label>Content</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write your study notes here..."
              rows={20}
              style={{ minHeight: '400px' }}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
