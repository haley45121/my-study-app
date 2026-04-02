import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notesApi } from '../utils/api';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteNote, setDeleteNote] = useState(null);

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
    try {
      const data = await notesApi.getAll();
      setNotes(data);
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    try {
      await notesApi.delete(deleteNote.id);
      setDeleteNote(null);
      loadNotes();
    } catch (err) {
      alert('Failed to delete note: ' + err.message);
    }
  }

  if (loading) return <div className="loading"><div className="spinner"></div> Loading notes...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Notes</h1>
        <Link to="/notes/new" className="btn btn-primary">+ New Note</Link>
      </div>

      {notes.length === 0 ? (
        <div className="empty-state">
          <h3>No notes yet</h3>
          <p>Create your first note for studying.</p>
          <Link to="/notes/new" className="btn btn-primary">Create Note</Link>
        </div>
      ) : (
        <div className="item-list">
          {notes.map(note => (
            <div key={note.id} className="item-card">
              <Link to={`/notes/${note.id}/edit`} style={{ flex: 1, textDecoration: 'none', color: 'inherit' }}>
                <div className="item-card-info">
                  <h3>{note.title}</h3>
                  <p>
                    {note.folderName && <span className="badge badge-gold" style={{ marginRight: '0.5rem' }}>{note.folderName}</span>}
                    {note.setTitle && <span className="badge badge-sage" style={{ marginRight: '0.5rem' }}>{note.setTitle}</span>}
                    {note.content ? note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '') : 'Empty note'}
                  </p>
                </div>
              </Link>
              <div className="item-card-actions">
                <Link to={`/notes/${note.id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
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
          title="Delete Note"
          message={`Are you sure you want to delete "${deleteNote.title}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteNote(null)}
        />
      )}
    </div>
  );
}
