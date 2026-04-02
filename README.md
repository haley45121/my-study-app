# MISBA Study Application

A full-stack study application with flashcards, learn mode, spaced repetition, notes, Cornell Notes, and import/export functionality. Built with React + Vite on the frontend and Node.js + Express + SQLite on the backend.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router |
| Backend | Node.js, Express |
| Database | SQLite (via better-sqlite3) |
| Styling | Vanilla CSS (dark mode, Times New Roman) |
| File Upload | Multer |
| CSV Parsing | PapaParse |
| PDF Parsing | pdf-parse |

## Prerequisites

- **Node.js** 18+ installed
- **npm** 9+ installed

## Installation

```bash
cd my-study-app
npm run install:all
```

This runs `npm install` in the root, `server/`, and `client/` directories.

## Running Locally

```bash
npm run dev
```

This starts both the backend (port 3001) and frontend (port 5173) concurrently.

Open **http://localhost:5173** in your browser.

## Project Structure

```
my-study-app/
├── client/                   # React + Vite frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components (Layout, Modal, etc.)
│   │   ├── pages/            # Route-level pages (14 pages)
│   │   ├── utils/            # API client, grading logic
│   │   ├── App.jsx           # Router and app shell
│   │   ├── App.css           # Component styles
│   │   └── index.css         # Design system / global styles
│   ├── index.html
│   └── vite.config.js        # Vite config with API proxy
├── server/                   # Node.js + Express backend
│   ├── db/
│   │   ├── schema.sql        # SQLite schema (9 tables)
│   │   └── database.js       # DB connection singleton
│   ├── routes/               # API route handlers (8 files)
│   ├── services/             # Business logic (spaced repetition, PDF parser)
│   ├── uploads/              # Temp upload directory
│   └── index.js              # Express entry point
└── package.json              # Root scripts
```

## Database

SQLite database is created automatically at `server/misba.db` on first run. The schema includes 9 tables:

- **folders** - Folder organization
- **sets** - Study sets within folders
- **cards** - Flashcards with term/definition
- **card_aliases** - Alternative accepted answers
- **study_sessions** - Session tracking
- **review_history** - Per-card review logs
- **spaced_repetition** - SM-2 scheduling per card
- **notes** - General study notes
- **cornell_notes** - Cornell-format notes (cues/notes/summary)

## Features

### Folder and Set Management
Create folders to organize study sets. Each set contains flashcards with terms, definitions, and optional aliases.

### Flashcard Mode
Standard flashcard study with card flip, shuffle, keyboard shortcuts (Space/Enter to flip, Arrow keys to navigate, 1/2/3 to rate), and SR rating (Needs Work / Good / Easy).

### Learn Mode
Type-the-answer study mode with:
- Levenshtein distance grading for typo tolerance (80% similarity threshold)
- Alias and alternate answer support
- 2-attempt reveal (answer revealed after 2 wrong tries)
- Session tracking with correct/incorrect counts

### Spaced Repetition
SM-2 algorithm implementation:
- Ease factor adjustment per card
- Increasing intervals on correct answers (1d, 6d, then factor-based)
- Reset on incorrect answers
- Due card tracking

### Notes and Cornell Notes
- General notes with optional folder/set linking
- Cornell Notes with three-section layout: Cues/Questions, Main Notes, Summary

### Import / Export
- **CSV Import**: Upload CSV with term/definition columns, preview before saving
- **PDF Import**: Extract text from PDF, generate candidate flashcards, review before saving
- **CSV Export**: Download any set as CSV
- **JSON Export**: Download any set as JSON

### Progress Tracking
- Dashboard with total stats, accuracy, mastery metrics
- Per-set progress with card-level detail
- Mastery distribution visualization
- Session history

## How to Use

1. **Create a folder** from the Folders page
2. **Create a study set** within the folder
3. **Add cards** with terms and definitions (optionally add aliases)
4. **Study** using Flashcard Mode or Learn Mode
5. **Track progress** from the Progress page
6. **Import** cards from CSV or PDF files
7. **Export** sets as CSV or JSON

## Vercel Deployment Notes

The frontend can be deployed to Vercel by building the client and serving static files. However, there are important limitations:

### SQLite Limitation on Vercel

Vercel serverless functions have a **read-only filesystem**. This means:
- SQLite writes will fail in production on Vercel
- The database cannot persist data between serverless invocations

### Recommended Workarounds

1. **Turso** (SQLite-compatible, edge-hosted): Replace `better-sqlite3` with `@libsql/client` and connect to a Turso database. Minimal code changes required.
2. **PlanetScale or Neon** (MySQL/PostgreSQL): Migrate the schema to a hosted relational database.
3. **Vercel KV or Upstash Redis**: Use for simpler key-value storage if restructuring.
4. **Deploy backend separately**: Host the Express backend on Railway, Render, or Fly.io where the filesystem is persistent.

For local development and personal use, SQLite works perfectly.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start both frontend and backend |
| `npm run server` | Start backend only |
| `npm run client` | Start frontend only |
| `npm run build` | Build frontend for production |
| `npm run install:all` | Install all dependencies |
