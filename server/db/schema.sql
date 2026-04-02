-- MISBA Study App Database Schema

CREATE TABLE IF NOT EXISTS folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  folderId INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (folderId) REFERENCES folders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setId INTEGER NOT NULL,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  source TEXT DEFAULT '',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (setId) REFERENCES sets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS card_aliases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cardId INTEGER NOT NULL,
  alias TEXT NOT NULL,
  FOREIGN KEY (cardId) REFERENCES cards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS study_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setId INTEGER NOT NULL,
  mode TEXT NOT NULL CHECK(mode IN ('flashcard', 'learn')),
  startedAt TEXT NOT NULL DEFAULT (datetime('now')),
  endedAt TEXT,
  cardsStudied INTEGER DEFAULT 0,
  correctCount INTEGER DEFAULT 0,
  incorrectCount INTEGER DEFAULT 0,
  FOREIGN KEY (setId) REFERENCES sets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS review_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cardId INTEGER NOT NULL,
  sessionId INTEGER,
  rating INTEGER CHECK(rating BETWEEN 1 AND 5),
  wasCorrect INTEGER NOT NULL DEFAULT 0,
  responseText TEXT DEFAULT '',
  reviewedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (cardId) REFERENCES cards(id) ON DELETE CASCADE,
  FOREIGN KEY (sessionId) REFERENCES study_sessions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS spaced_repetition (
  cardId INTEGER PRIMARY KEY,
  easeFactor REAL NOT NULL DEFAULT 2.5,
  interval INTEGER NOT NULL DEFAULT 0,
  repetitions INTEGER NOT NULL DEFAULT 0,
  nextReviewDate TEXT NOT NULL DEFAULT (date('now')),
  lastReviewedAt TEXT,
  FOREIGN KEY (cardId) REFERENCES cards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  folderId INTEGER,
  setId INTEGER,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (folderId) REFERENCES folders(id) ON DELETE SET NULL,
  FOREIGN KEY (setId) REFERENCES sets(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS cornell_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  cues TEXT DEFAULT '',
  mainNotes TEXT DEFAULT '',
  summary TEXT DEFAULT '',
  folderId INTEGER,
  setId INTEGER,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (folderId) REFERENCES folders(id) ON DELETE SET NULL,
  FOREIGN KEY (setId) REFERENCES sets(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('pdf', 'csv')),
  content TEXT, -- Extracted text or JSON representation for caching
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sets_folderId ON sets(folderId);
CREATE INDEX IF NOT EXISTS idx_cards_setId ON cards(setId);
CREATE INDEX IF NOT EXISTS idx_card_aliases_cardId ON card_aliases(cardId);
CREATE INDEX IF NOT EXISTS idx_review_history_cardId ON review_history(cardId);
CREATE INDEX IF NOT EXISTS idx_review_history_sessionId ON review_history(sessionId);
CREATE INDEX IF NOT EXISTS idx_study_sessions_setId ON study_sessions(setId);
CREATE INDEX IF NOT EXISTS idx_spaced_repetition_nextReview ON spaced_repetition(nextReviewDate);
CREATE INDEX IF NOT EXISTS idx_notes_folderId ON notes(folderId);
CREATE INDEX IF NOT EXISTS idx_notes_setId ON notes(setId);
CREATE INDEX IF NOT EXISTS idx_cornell_notes_folderId ON cornell_notes(folderId);
CREATE INDEX IF NOT EXISTS idx_cornell_notes_setId ON cornell_notes(setId);
CREATE INDEX IF NOT EXISTS idx_files_name ON files(name);
