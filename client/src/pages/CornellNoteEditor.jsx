import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { cornellNotesApi, foldersApi, setsApi, importExportApi } from '../utils/api';
import { Sparkles } from 'lucide-react';

export default function CornellNoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const [title, setTitle] = useState('');
  const [cues, setCues] = useState('');
  const [mainNotes, setMainNotes] = useState('');
  const [summary, setSummary] = useState('');
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
      const note = await cornellNotesApi.getOne(id);
      setTitle(note.title);
      setCues(note.cues || '');
      setMainNotes(note.mainNotes || '');
      setSummary(note.summary || '');
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
        cues,
        mainNotes,
        summary,
        folderId: folderId || null,
        setId: setId || null
      };
      if (isNew) {
        await cornellNotesApi.create(data);
      } else {
        await cornellNotesApi.update(id, data);
      }
      navigate('/cornell-notes');
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateFlashcards() {
    const fullText = `Cues/Questions:\n${cues}\n\nMain Notes:\n${mainNotes}\n\nSummary:\n${summary}`;
    
    if (!cues.trim() && !mainNotes.trim() && !summary.trim()) { 
      alert('Add some content first to generate flashcards!'); 
      return; 
    }
    
    setGenerating(true);
    try {
      const result = await importExportApi.generateFromText({ text: fullText, filename: title || 'Cornell Note' });
      if (result.candidates && result.candidates.length > 0) {
        navigate('/import-export', { 
          state: { 
            textGenerationResult: result.candidates,
            filename: title || 'Cornell Note'
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
        <Link to="/cornell-notes">Cornell Notes</Link>
        <span>/</span>
        <span>{isNew ? 'New' : 'Edit'}</span>
      </div>

      <div className="page-header">
        <h1>{isNew ? 'New Cornell Note' : `Edit: ${title}`}</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" className="btn btn-secondary" onClick={handleGenerateFlashcards} disabled={generating || (!cues.trim() && !mainNotes.trim() && !summary.trim())} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} /> {generating ? 'Generating...' : 'Generate Flashcards'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/cornell-notes')}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: '1.5rem' }}>
        <div className="form-group">
          <label>Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Cornell note title" autoFocus />
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

      <div className="cornell-layout">
        <div className="cornell-cues">
          <div className="cornell-section-label">Cues / Questions</div>
          <textarea
            value={cues}
            onChange={e => setCues(e.target.value)}
            placeholder="Write key questions, cues, or prompts here. These serve as recall triggers for the main notes."
          />
        </div>
        <div className="cornell-main">
          <div className="cornell-section-label">Main Notes</div>
          <textarea
            value={mainNotes}
            onChange={e => setMainNotes(e.target.value)}
            placeholder="Record detailed notes, explanations, diagrams, and key information during lectures or study sessions."
          />
        </div>
        <div className="cornell-summary">
          <div className="cornell-section-label">Summary</div>
          <textarea
            value={summary}
            onChange={e => setSummary(e.target.value)}
            placeholder="After reviewing, write a concise summary of the main ideas and key takeaways in your own words."
          />
        </div>
      </div>
    </div>
  );
}
