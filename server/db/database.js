const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'misba.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let dbWrapper = null;

/**
 * Compatibility wrapper around sql.js to provide
 * the same API as better-sqlite3 used by all route files.
 * sql.js is pure JS/WASM — no native build tools needed.
 */
class DatabaseWrapper {
  constructor(sqlDb) {
    this._db = sqlDb;
    this._inTransaction = false;
  }

  prepare(sql) {
    const self = this;
    return {
      run(...params) {
        self._db.run(sql, params);
        const rowid = self._db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0] || 0;
        const changes = self._db.getRowsModified();
        // Only save to disk if NOT inside a transaction (transaction saves on commit)
        if (!self._inTransaction) self._save();
        return { lastInsertRowid: rowid, changes };
      },
      get(...params) {
        const stmt = self._db.prepare(sql);
        if (params.length > 0) stmt.bind(params);
        let result = undefined;
        if (stmt.step()) {
          result = stmt.getAsObject();
        }
        stmt.free();
        return result;
      },
      all(...params) {
        const stmt = self._db.prepare(sql);
        if (params.length > 0) stmt.bind(params);
        const results = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      }
    };
  }

  exec(sql) {
    this._db.exec(sql);
    if (!this._inTransaction) this._save();
  }

  pragma(setting) {
    try {
      this._db.run(`PRAGMA ${setting}`);
    } catch (e) {
      // Some pragmas may not be supported in sql.js
    }
  }

  transaction(fn) {
    const self = this;
    return function (...args) {
      self._db.run("BEGIN TRANSACTION");
      self._inTransaction = true;
      try {
        const result = fn(...args);
        self._db.run("COMMIT");
        self._inTransaction = false;
        self._save();
        return result;
      } catch (e) {
        self._inTransaction = false;
        try {
          self._db.run("ROLLBACK");
        } catch (rollbackErr) {
          // Already rolled back or no transaction active — safe to ignore
        }
        throw e;
      }
    };
  }

  _save() {
    const data = this._db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }

  close() {
    this._save();
    this._db.close();
    dbWrapper = null;
  }
}

async function initDb() {
  if (dbWrapper) return dbWrapper;

  const SQL = await initSqlJs();

  let db;
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  dbWrapper = new DatabaseWrapper(db);
  dbWrapper.pragma('foreign_keys = ON');

  // Initialize schema
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  dbWrapper.exec(schema);
  console.log('Database schema initialized.');

  return dbWrapper;
}

function getDb() {
  if (!dbWrapper) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return dbWrapper;
}

function closeDb() {
  if (dbWrapper) {
    dbWrapper.close();
  }
}

module.exports = { initDb, getDb, closeDb };
