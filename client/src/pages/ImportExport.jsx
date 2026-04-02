import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { foldersApi, setsApi, importExportApi } from '../utils/api';
import { FileText, BookOpen } from 'lucide-react';

export default function ImportExport() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('csv-import');
  const [folders, setFolders] = useState([]);
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Import state
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [newSetTitle, setNewSetTitle] = useState('');
  const [savingImport, setSavingImport] = useState(false);
  const fileInputRef = useRef(null);

  // Export state
  const [exportSetId, setExportSetId] = useState('');

  useEffect(() => {
    loadData();
    if (location.state?.textGenerationResult) {
      setImportResult({
        candidates: location.state.textGenerationResult,
        filename: location.state.filename || 'Generated from Note'
      });
      setNewSetTitle(location.state.filename || 'Note Flashcards');
      setActiveTab('csv-import');
      // Clear history state to avoid re-triggering on refresh
      navigate('.', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  async function loadData() {
    try {
      const [foldersData, setsData] = await Promise.all([foldersApi.getAll(), setsApi.getAll()]);
      setFolders(foldersData);
      setSets(setsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      let result;
      if (activeTab === 'csv-import') {
        result = await importExportApi.importCsv(file);
      } else {
        result = await importExportApi.importPdf(file);
      }
      setImportResult(result);
      setNewSetTitle(file.name.replace(/\.(csv|pdf)$/i, ''));
    } catch (err) {
      alert('Import failed: ' + err.message);
    } finally {
      setImporting(false);
    }
  }

  async function handleSaveImport() {
    if (!selectedFolder || !newSetTitle.trim() || !importResult?.candidates?.length) {
      alert('Please select a folder and set title');
      return;
    }

    setSavingImport(true);
    try {
      await importExportApi.saveImported({
        folderId: Number(selectedFolder),
        title: newSetTitle.trim(),
        cards: importResult.candidates
      });
      alert(`Successfully imported ${importResult.candidates.length} cards!`);
      setImportResult(null);
      setNewSetTitle('');
      loadData();
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSavingImport(false);
    }
  }

  async function handleExportCsv() {
    if (!exportSetId) { alert('Select a set to export'); return; }
    try {
      const blob = await importExportApi.exportCsv(exportSetId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'export.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  }

  async function handleExportJson() {
    if (!exportSetId) { alert('Select a set to export'); return; }
    try {
      const data = await importExportApi.exportJson(exportSetId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'export.json';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
  }

  function handleDragLeave(e) {
    e.currentTarget.classList.remove('dragover');
  }

  function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) {
      const input = fileInputRef.current;
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      handleFileUpload({ target: input });
    }
  }

  if (loading) return <div className="loading"><div className="spinner"></div> Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Import / Export</h1>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'csv-import' ? 'active' : ''}`} onClick={() => { setActiveTab('csv-import'); setImportResult(null); }}>CSV Import</button>
        <button className={`tab ${activeTab === 'pdf-import' ? 'active' : ''}`} onClick={() => { setActiveTab('pdf-import'); setImportResult(null); }}>PDF Import</button>
        <button className={`tab ${activeTab === 'export' ? 'active' : ''}`} onClick={() => setActiveTab('export')}>Export</button>
      </div>

      {/* CSV / PDF Import */}
      {(activeTab === 'csv-import' || activeTab === 'pdf-import') && (
        <div>
          <div
            className="upload-area"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="upload-icon" style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)' }}>
              {activeTab === 'csv-import' ? <FileText size={48} /> : <BookOpen size={48} />}
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>
              {importing ? 'Processing...' : `Drop ${activeTab === 'csv-import' ? 'CSV' : 'PDF'} file here or click to upload`}
            </h3>
            <p style={{ color: 'var(--text-tertiary)', marginBottom: 0 }}>
              {activeTab === 'csv-import'
                ? 'CSV should have "term" and "definition" columns'
                : 'PDF text will be parsed into candidate flashcards'}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={activeTab === 'csv-import' ? '.csv' : '.pdf'}
              onChange={handleFileUpload}
            />
          </div>

          {importResult && importResult.candidates && (
            <div style={{ marginTop: '2rem' }}>
              <div className="panel" style={{ marginBottom: '1rem' }}>
                <h3 style={{ marginBottom: '0.75rem' }}>Import Preview</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  File: {importResult.filename} &middot; {importResult.candidates.length} cards found
                  {importResult.totalPages && ` \u00b7 ${importResult.totalPages} pages`}
                </p>
                {importResult.candidates.length === 0 && (
                  <div className="alert alert-info" style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    <strong>Note:</strong> Automatic flashcard generation was skipped (API limit hit or no text found), but the document text has been saved as a source for the Learn module.
                  </div>
                )}
              </div>

              <div className="import-preview" style={{ marginBottom: '1.5rem' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>#</th>
                      <th>Term</th>
                      <th>Definition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.candidates.map((card, i) => (
                      <tr key={i}>
                        <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                        <td>{card.term}</td>
                        <td>{card.definition}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="panel">
                <h3 style={{ marginBottom: '1rem' }}>Save to Set</h3>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Folder</label>
                    <select value={selectedFolder} onChange={e => setSelectedFolder(e.target.value)}>
                      <option value="">Select folder</option>
                      {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Set Title</label>
                    <input type="text" value={newSetTitle} onChange={e => setNewSetTitle(e.target.value)} placeholder="Name for new set" />
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleSaveImport} disabled={savingImport}>
                  {savingImport ? 'Saving...' : `Save ${importResult.candidates.length} Cards`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Export */}
      {activeTab === 'export' && (
        <div className="panel">
          <h3 style={{ marginBottom: '1rem' }}>Export Study Set</h3>
          <div className="form-group">
            <label>Select Set</label>
            <select value={exportSetId} onChange={e => setExportSetId(e.target.value)}>
              <option value="">Select a set to export</option>
              {sets.map(s => <option key={s.id} value={s.id}>{s.title} ({s.cardCount || 0} cards)</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={handleExportCsv} disabled={!exportSetId}>
              Export as CSV
            </button>
            <button className="btn btn-secondary" onClick={handleExportJson} disabled={!exportSetId}>
              Export as JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
