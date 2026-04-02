import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cornellNotesApi } from '../utils/api';
import ConfirmDialog from '../components/ConfirmDialog';

export default function CornellNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteNote, setDeleteNote] = useState(null);

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
    try {
      const data = await cornellNotesApi.getAll();
      setNotes(data);
    } catch (err) {
      console.error('Failed to load Cornell notes:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    try {
      await cornellNotesApi.delete(deleteNote.id);
      setDeleteNote(null);
      loadNotes();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  }

  if (loading) return <div className="loading"><div className="spinner"></div> Loading Cornell notes...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Cornell Notes</h1>
        <Link to="/cornell-notes/new" className="btn btn-primary">+ New Cornell Note</Link>
      </div>

      {notes.length === 0 ? (
        <div className="empty-state">
          <h3>No Cornell notes yet</h3>
          <p>Create your first Cornell note with the structured cue/notes/summary format.</p>
          <Link to="/cornell-notes/new" className="btn btn-primary">Create Cornell Note</Link>
        </div>
      ) : (
        <div className="item-list">
          {notes.map(note => (
            <div key={note.id} className="item-card">
              <Link to={`/cornell-notes/${note.id}/edit`} style={{ flex: 1, textDecoration: 'none', color: 'inherit' }}>
                <div className="item-card-info">
                  <h3>{note.title}</h3>
                  <p>
                    {note.folderName && <span className="badge badge-gold" style={{ marginRight: '0.5rem' }}>{note.folderName}</span>}
                    {note.setTitle && <span className="badge badge-sage" style={{ marginRight: '0.5rem' }}>{note.setTitle}</span>}
                    {note.summary ? note.summary.substring(0, 100) + (note.summary.length > 100 ? '...' : '') : 'No summary'}
                  </p>
                </div>
              </Link>
              <div className="item-card-actions">
                <Link to={`/cornell-notes/${note.id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={(e) => { e.stopPropagation(); setDeleteNote(note); }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteNote && (
        <ConfirmDialog
          title="Delete Cornell Note"
          message={`Are you sure you want to delete "${deleteNote.title}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteNote(null)}
        />
      )}
    </div>
  );
}
