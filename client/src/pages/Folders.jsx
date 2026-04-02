import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { foldersApi } from '../utils/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Folders() {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editFolder, setEditFolder] = useState(null);
  const [deleteFolder, setDeleteFolder] = useState(null);
  const [folderName, setFolderName] = useState('');

  useEffect(() => {
    loadFolders();
  }, []);

  async function loadFolders() {
    try {
      const data = await foldersApi.getAll();
      setFolders(data);
    } catch (err) {
      console.error('Failed to load folders:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!folderName.trim()) return;
    try {
      await foldersApi.create(folderName.trim());
      setFolderName('');
      setShowCreate(false);
      loadFolders();
    } catch (err) {
      alert('Failed to create folder: ' + err.message);
    }
  }

  async function handleRename(e) {
    e.preventDefault();
    if (!folderName.trim()) return;
    try {
      await foldersApi.update(editFolder.id, folderName.trim());
      setFolderName('');
      setEditFolder(null);
      loadFolders();
    } catch (err) {
      alert('Failed to rename folder: ' + err.message);
    }
  }

  async function handleDelete() {
    try {
      await foldersApi.delete(deleteFolder.id);
      setDeleteFolder(null);
      loadFolders();
    } catch (err) {
      alert('Failed to delete folder: ' + err.message);
    }
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div> Loading folders...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Folders</h1>
        <button className="btn btn-primary" onClick={() => { setFolderName(''); setShowCreate(true); }}>
          + New Folder
        </button>
      </div>

      {folders.length === 0 ? (
        <div className="empty-state">
          <h3>No folders yet</h3>
          <p>Create your first folder to organize your study sets.</p>
          <button className="btn btn-primary" onClick={() => { setFolderName(''); setShowCreate(true); }}>
            Create Folder
          </button>
        </div>
      ) : (
        <div className="item-list">
          {folders.map(folder => (
            <div key={folder.id} className="item-card">
              <Link to={`/folders/${folder.id}`} style={{ flex: 1, textDecoration: 'none', color: 'inherit' }}>
                <div className="item-card-info">
                  <h3>&#9776; {folder.name}</h3>
                  <p>{folder.setCount || 0} {folder.setCount === 1 ? 'set' : 'sets'}</p>
                </div>
              </Link>
              <div className="item-card-actions">
                <button className="btn btn-ghost btn-sm" onClick={(e) => {
                  e.stopPropagation();
                  setFolderName(folder.name);
                  setEditFolder(folder);
                }}>Rename</button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={(e) => {
                  e.stopPropagation();
                  setDeleteFolder(folder);
                }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="New Folder" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Folder Name</label>
              <input
                type="text"
                value={folderName}
                onChange={e => setFolderName(e.target.value)}
                placeholder="Enter folder name"
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create</button>
            </div>
          </form>
        </Modal>
      )}

      {editFolder && (
        <Modal title="Rename Folder" onClose={() => setEditFolder(null)}>
          <form onSubmit={handleRename}>
            <div className="form-group">
              <label>Folder Name</label>
              <input
                type="text"
                value={folderName}
                onChange={e => setFolderName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setEditFolder(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteFolder && (
        <ConfirmDialog
          title="Delete Folder"
          message={`Are you sure you want to delete "${deleteFolder.name}"? All sets and cards within this folder will be permanently removed.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteFolder(null)}
        />
      )}
    </div>
  );
}
