import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Folders from './pages/Folders';
import FolderDetail from './pages/FolderDetail';
import SetDetail from './pages/SetDetail';
import SetEditor from './pages/SetEditor';
import FlashcardMode from './pages/FlashcardMode';
import LearnMode from './pages/LearnMode';
import Progress from './pages/Progress';
import Notes from './pages/Notes';
import NoteEditor from './pages/NoteEditor';
import CornellNotes from './pages/CornellNotes';
import CornellNoteEditor from './pages/CornellNoteEditor';
import ImportExport from './pages/ImportExport';
import Learn from './pages/Learn';
import './App.css';

import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/folders" element={<Folders />} />
            <Route path="/folders/:id" element={<FolderDetail />} />
            <Route path="/sets/:id" element={<SetDetail />} />
            <Route path="/sets/:id/edit" element={<SetEditor />} />
            <Route path="/sets/new" element={<SetEditor />} />
            <Route path="/sets/:id/flashcards" element={<FlashcardMode />} />
            <Route path="/sets/:id/learn" element={<LearnMode />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/progress/sets/:id" element={<Progress />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/notes/new" element={<NoteEditor />} />
            <Route path="/notes/:id/edit" element={<NoteEditor />} />
            <Route path="/cornell-notes" element={<CornellNotes />} />
            <Route path="/cornell-notes/new" element={<CornellNoteEditor />} />
            <Route path="/cornell-notes/:id/edit" element={<CornellNoteEditor />} />
            <Route path="/import-export" element={<ImportExport />} />
            <Route path="/learn" element={<Learn />} />
          </Routes>
        </Layout>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
