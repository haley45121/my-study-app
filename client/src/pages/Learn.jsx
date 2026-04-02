import { useState, useEffect } from 'react';
import { learnApi, importExportApi } from '../utils/api';
import QuizArena from '../components/learn/QuizArena';
import RecallArena from '../components/learn/RecallArena';
import MatchingGame from '../components/learn/MatchingGame';
import { FileText, FolderArchive, Target, Brain, Puzzle, Trash2 } from 'lucide-react';

export default function Learn() {
  const [files, setFiles] = useState([]);
  const [sets, setSets] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedSets, setSelectedSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeMode, setActiveMode] = useState('quiz'); // quiz, recall, game
  const [studyData, setStudyData] = useState(null);

  useEffect(() => {
    loadSources();
  }, []);

  async function loadSources() {
    try {
      const [filesData, setsData] = await Promise.all([
        learnApi.getFiles(),
        learnApi.getSets()
      ]);
      setFiles(filesData);
      setSets(setsData);
    } catch (err) {
      console.error('Failed to load sources:', err);
    } finally {
      setLoading(false);
    }
  }

  const toggleFile = (id) => {
    setSelectedFiles(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleDeleteFile = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this file completely?')) return;
    
    try {
      await learnApi.deleteFile(id);
      setSelectedFiles(prev => prev.filter(fId => fId !== id));
      await loadSources();
    } catch (err) {
      alert('Failed to delete file: ' + err.message);
    }
  };

  const toggleSet = (id) => {
    setSelectedSets(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };
  
  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'pdf' && ext !== 'csv') {
      alert('Please upload a PDF or CSV file.');
      return;
    }

    setUploading(true);
    try {
      if (ext === 'pdf') {
        await importExportApi.importPdf(file);
      } else {
        await importExportApi.importCsv(file);
      }
      await loadSources(); // Refresh list
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleStart() {
    if (selectedFiles.length === 0 && selectedSets.length === 0) {
      alert('Please select at least one source (File or Set)');
      return;
    }

    setGenerating(true);
    try {
      const result = await learnApi.generate({
        fileIds: selectedFiles,
        setIds: selectedSets,
        mode: activeMode
      });
      setStudyData(result.data);
    } catch (err) {
      alert('Generation failed: ' + err.message);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return <div className="loading"><div className="spinner"></div> Loading sources...</div>;

  if (studyData) {
    return (
      <div className="learn-session">
        <button className="btn btn-ghost btn-sm" onClick={() => setStudyData(null)} style={{ marginBottom: '1rem' }}>
          &larr; Exit {activeMode}
        </button>
        
        {activeMode === 'quiz' && <QuizArena questions={studyData} onExit={() => setStudyData(null)} />}
        {activeMode === 'recall' && <RecallArena pairs={studyData} onExit={() => setStudyData(null)} />}
        {activeMode === 'game' && <MatchingGame pairs={studyData} onExit={() => setStudyData(null)} />}
      </div>
    );
  }

  return (
    <div className="learn-page">
      <div className="page-header">
        <h1>Learn</h1>
        <p className="text-secondary">Generate advanced study materials from your documents and sets.</p>
      </div>

      <div className="grid-2" style={{ gap: '2rem', alignItems: 'start' }}>
        {/* Left: Source Selection */}
        <div className="panel animate-in">
          <h3 style={{ marginBottom: '1.5rem' }}>1. Select Sources</h3>
          
          <div className="source-section" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <span><FileText size={18} /></span> My Files
              </h4>
              <label className="btn btn-ghost btn-xs" style={{ cursor: 'pointer', margin: 0 }}>
                {uploading ? <div className="spinner spinner-xs"></div> : '+ Upload'}
                <input type="file" hidden accept=".pdf,.csv" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
            {files.length === 0 ? (
              <p className="text-muted small">No PDF or CSV files uploaded yet.</p>
            ) : (
              <div className="source-list">
                {files.map(file => (
                  <div 
                    key={file.id} 
                    className={`source-item ${selectedFiles.includes(file.id) ? 'selected' : ''}`}
                    onClick={() => toggleFile(file.id)}
                  >
                    <div className="source-checkbox"></div>
                    <div className="source-info" style={{ flex: 1 }}>
                      <div className="source-name">{file.name}</div>
                      <div className="source-meta">{file.type.toUpperCase()} &middot; {new Date(file.createdAt).toLocaleDateString()}</div>
                    </div>
                    <button 
                      className="btn btn-ghost btn-xs" 
                      onClick={(e) => handleDeleteFile(e, file.id)}
                      title="Delete File"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="source-section">
            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span><FolderArchive size={18} /></span> Study Sets
            </h4>
            {sets.length === 0 ? (
              <p className="text-muted small">No flashcard sets created yet.</p>
            ) : (
              <div className="source-list">
                {sets.map(set => (
                  <div 
                    key={set.id} 
                    className={`source-item ${selectedSets.includes(set.id) ? 'selected' : ''}`}
                    onClick={() => toggleSet(set.id)}
                  >
                    <div className="source-checkbox"></div>
                    <div className="source-info">
                      <div className="source-name">{set.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Mode Selection */}
        <div className="panel animate-in" style={{ animationDelay: '0.1s' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>2. Choose Mode</h3>
          
          <div className="mode-selection" style={{ marginBottom: '2rem' }}>
            <div 
              className={`mode-card ${activeMode === 'quiz' ? 'active' : ''}`}
              onClick={() => setActiveMode('quiz')}
            >
              <div className="mode-icon"><Target size={32} /></div>
              <div className="mode-info">
                <div className="mode-title">AI Quiz</div>
                <div className="mode-desc">Multiple choice questions generated from your material.</div>
              </div>
            </div>

            <div 
              className={`mode-card ${activeMode === 'recall' ? 'active' : ''}`}
              onClick={() => setActiveMode('recall')}
            >
              <div className="mode-icon"><Brain size={32} /></div>
              <div className="mode-info">
                <div className="mode-title">Smart Recall</div>
                <div className="mode-desc">Free-response practice with AI-powered semantic grading.</div>
              </div>
            </div>

            <div 
              className={`mode-card ${activeMode === 'game' ? 'active' : ''}`}
              onClick={() => setActiveMode('game')}
            >
              <div className="mode-icon"><Puzzle size={32} /></div>
              <div className="mode-info">
                <div className="mode-title">Matching Game</div>
                <div className="mode-desc">A fast-paced term and definition pairing challenge.</div>
              </div>
            </div>
          </div>

          <button 
            className="btn btn-primary btn-lg" 
            style={{ width: '100%' }}
            onClick={handleStart}
            disabled={generating || (selectedFiles.length === 0 && selectedSets.length === 0)}
          >
            {generating ? (
              <><div className="spinner spinner-white"></div> Generating...</>
            ) : 'Start Learning'}
          </button>
        </div>
      </div>

      <style>{`
        .source-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 300px;
          overflow-y: auto;
          padding-right: 0.5rem;
        }
        .source-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .source-item:hover {
          background: var(--bg-secondary);
          border-color: var(--border-highlight);
        }
        .source-item.selected {
          background: var(--bg-tertiary);
          border-color: var(--accent-primary);
          box-shadow: var(--shadow-sm);
        }
        .source-checkbox {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          border: 2px solid var(--text-muted);
          position: relative;
        }
        .source-item.selected .source-checkbox {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
        }
        .source-item.selected .source-checkbox::after {
          content: '✓';
          color: white;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 12px;
        }
        .source-name {
          font-weight: 500;
          font-size: 0.95rem;
        }
        .source-meta {
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }

        .mode-selection {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .mode-card {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1.25rem;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: var(--bg-panel);
        }
        .mode-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--border-highlight);
        }
        .mode-card.active {
          border-color: var(--accent-primary);
          background: var(--bg-secondary);
          box-shadow: var(--shadow-lg), inset 0 0 0 1px var(--accent-primary);
        }
        .mode-icon {
          font-size: 2rem;
          background: var(--bg-tertiary);
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
        }
        .mode-title {
          font-weight: 600;
          font-size: 1.1rem;
          margin-bottom: 0.25rem;
        }
        .mode-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .learn-session {
          max-width: 900px;
          margin: 0 auto;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
