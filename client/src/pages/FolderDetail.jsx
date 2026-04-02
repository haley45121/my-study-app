import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { foldersApi, setsApi } from '../utils/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function FolderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [folder, setFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateSet, setShowCreateSet] = useState(false);
  const [setTitle, setSetTitle] = useState('');
  const [setDescription, setSetDescription] = useState('');
  const [deleteSet, setDeleteSet] = useState(null);

  useEffect(() => {
    loadFolder();
  }, [id]);

  async function loadFolder() {
    try {
      const data = await foldersApi.getOne(id);
      setFolder(data);
    } catch (err) {
      console.error('Failed to load folder:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSet(e) {
    e.preventDefault();
    if (!setTitle.trim()) return;
    try {
      const newSet = await setsApi.create({ folderId: Number(id), title: setTitle.trim(), description: setDescription });
      setSetTitle('');
      setSetDescription('');
      setShowCreateSet(false);
      navigate(`/sets/${newSet.id}/edit`);
    } catch (err) {
      alert('Failed to create set: ' + err.message);
    }
  }

  async function handleDeleteSet() {
    try {
      await setsApi.delete(deleteSet.id);
      setDeleteSet(null);
      loadFolder();
    } catch (err) {
      alert('Failed to delete set: ' + err.message);
    }
  }

  if (loading) return <div className="loading"><div className="spinner"></div> Loading...</div>;
  if (!folder) return <div className="empty-state"><h3>Folder not found</h3><Link to="/folders">Back to Folders</Link></div>;

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/folders">Folders</Link>
        <span>/</span>
        <span>{folder.name}</span>
      </div>

      <div className="page-header">
        <h1>{folder.name}</h1>
        <button className="btn btn-primary" onClick={() => { setSetTitle(''); setSetDescription(''); setShowCreateSet(true); }}>
          + New Set
        </button>
      </div>

      {(!folder.sets || folder.sets.length === 0) ? (
        <div className="empty-state">
          <h3>No study sets yet</h3>
          <p>Create your first study set in this folder.</p>
          <button className="btn btn-primary" onClick={() => { setSetTitle(''); setSetDescription(''); setShowCreateSet(true); }}>
            Create Study Set
          </button>
        </div>
      ) : (
        <div className="item-list">
          {folder.sets.map(s => (
            <div key={s.id} className="item-card">
              <Link to={`/sets/${s.id}`} style={{ flex: 1, textDecoration: 'none', color: 'inherit' }}>
                <div className="item-card-info">
                  <h3>{s.title}</h3>
                  <p>{s.cardCount || 0} cards {s.description ? `\u2014 ${s.description}` : ''}</p>
                </div>
              </Link>
              <div className="item-card-actions">
                <Link to={`/sets/${s.id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => setDeleteSet(s)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateSet && (
        <Modal title="New Study Set" onClose={() => setShowCreateSet(false)}>
          <form onSubmit={handleCreateSet}>
            <div className="form-group">
              <label>Title</label>
              <input type="text" value={setTitle} onChange={e => setSetTitle(e.target.value)} placeholder="Set title" autoFocus />
            </div>
            <div className="form-group">
              <label>Description (optional)</label>
              <input type="text" value={setDescription} onChange={e => setSetDescription(e.target.value)} placeholder="Brief description" />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreateSet(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create and Add Cards</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteSet && (
        <ConfirmDialog
          title="Delete Set"
          message={`Are you sure you want to delete "${deleteSet.title}"? All cards in this set will be permanently removed.`}
          onConfirm={handleDeleteSet}
          onCancel={() => setDeleteSet(null)}
        />
      )}
    </div>
  );
}
