/**
 * DayFlow — Local Express SQLite API Server
 * Hosts static frontend assets and connects endpoints to a local SQLite database file.
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'dayflow.db');

app.use(express.json());
app.use(express.static(__dirname));

// Initialize local SQLite Database connection
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log(`Successfully connected to SQLite database file at: ${DB_FILE}`);
    initializeDatabaseSchema();
  }
});

/**
 * Configure database tables schema
 */
function initializeDatabaseSchema() {
  db.serialize(() => {
    // Tasks table schema
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      startTime TEXT,
      endTime TEXT,
      category TEXT NOT NULL,
      priority TEXT NOT NULL,
      notes TEXT,
      completed INTEGER DEFAULT 0
    )`, (err) => {
      if (err) console.error('Failed to create tasks table:', err.message);
    });

    // Settings table schema (key-value storage for theme, activeView, activeSort, etc.)
    db.run(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`, (err) => {
      if (err) console.error('Failed to create settings table:', err.message);
    });

    // Jobs table schema
    db.run(`CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      jobTitle TEXT NOT NULL,
      dateApplied TEXT NOT NULL,
      skillsNeeded TEXT,
      skillsIHave TEXT,
      description TEXT,
      isImportant INTEGER DEFAULT 0,
      importantNotes TEXT
    )`, (err) => {
      if (err) {
        console.error('Failed to create jobs table:', err.message);
      } else {
        // Attempt to add new columns if table already existed without them
        db.run(`ALTER TABLE jobs ADD COLUMN isImportant INTEGER DEFAULT 0`, () => {});
        db.run(`ALTER TABLE jobs ADD COLUMN importantNotes TEXT`, () => {});
      }
    });

    // Cold Mails table schema
    db.run(`CREATE TABLE IF NOT EXISTS cold_mails (
      id TEXT PRIMARY KEY,
      companyName TEXT NOT NULL,
      email TEXT NOT NULL,
      description TEXT
    )`, (err) => {
      if (err) console.error('Failed to create cold_mails table:', err.message);
    });
  });
}

// ==========================================
// 1. Task API Routes
// ==========================================

// GET: Fetch all tasks
app.get('/api/tasks', (req, res) => {
  db.all('SELECT * FROM tasks', [], (err, rows) => {
    if (err) {
      console.error('Error fetching tasks:', err.message);
      return res.status(500).json({ error: err.message });
    }
    // Map completed (SQLite 0/1) back to Boolean
    const tasks = rows.map(row => ({
      ...row,
      completed: row.completed === 1
    }));
    res.json(tasks);
  });
});

// POST: Add a new task
app.post('/api/tasks', (req, res) => {
  const { id, title, date, startTime, endTime, category, priority, notes, completed } = req.body;
  const sql = `INSERT INTO tasks (id, title, date, startTime, endTime, category, priority, notes, completed) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [id, title, date, startTime, endTime, category, priority, notes, completed ? 1 : 0], function(err) {
    if (err) {
      console.error('Error adding task:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id, message: 'Task added successfully' });
  });
});

// PUT: Update an existing task
app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { title, date, startTime, endTime, category, priority, notes, completed } = req.body;
  const sql = `UPDATE tasks 
               SET title = ?, date = ?, startTime = ?, endTime = ?, category = ?, priority = ?, notes = ?, completed = ? 
               WHERE id = ?`;
  
  db.run(sql, [title, date, startTime, endTime, category, priority, notes, completed ? 1 : 0, id], function(err) {
    if (err) {
      console.error('Error updating task:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task updated successfully' });
  });
});

// DELETE: Delete a task
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM tasks WHERE id = ?`;
  
  db.run(sql, [id], function(err) {
    if (err) {
      console.error('Error deleting task:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  });
});

// DELETE: Clear all tasks for a specific date
app.delete('/api/tasks/date/:dateStr', (req, res) => {
  const { dateStr } = req.params;
  const sql = `DELETE FROM tasks WHERE date = ?`;
  
  db.run(sql, [dateStr], function(err) {
    if (err) {
      console.error('Error clearing tasks for day:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ cleared: this.changes });
  });
});

// POST: Bulk import tasks
app.post('/api/tasks/import', (req, res) => {
  const tasks = req.body;
  if (!Array.isArray(tasks)) {
    return res.status(400).json({ error: 'Expected an array of tasks' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    const sql = `INSERT OR REPLACE INTO tasks (id, title, date, startTime, endTime, category, priority, notes, completed) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const stmt = db.prepare(sql);
    
    let errorOccurred = null;
    tasks.forEach(task => {
      if (!errorOccurred) {
        stmt.run([task.id, task.title, task.date, task.startTime, task.endTime, task.category, task.priority, task.notes, task.completed ? 1 : 0], (err) => {
          if (err) errorOccurred = err;
        });
      }
    });

    stmt.finalize(() => {
      if (errorOccurred) {
        db.run('ROLLBACK');
        console.error('Bulk import failed, rolled back changes:', errorOccurred.message);
        return res.status(500).json({ error: errorOccurred.message });
      } else {
        db.run('COMMIT');
        res.json({ imported: tasks.length });
      }
    });
  });
});

// ==========================================
// 2. Settings API Routes
// ==========================================

// POST: Save settings
app.post('/api/settings', (req, res) => {
  const settings = req.body;
  const sql = `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`;
  
  db.run(sql, ['user_preferences', JSON.stringify(settings)], function(err) {
    if (err) {
      console.error('Error saving settings:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Settings saved successfully' });
  });
});

// GET: Load settings
app.get('/api/settings', (req, res) => {
  db.get('SELECT value FROM settings WHERE key = ?', ['user_preferences'], (err, row) => {
    if (err) {
      console.error('Error fetching settings:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.json({});
    }
    try {
      const settings = JSON.parse(row.value);
      res.json(settings);
    } catch (e) {
      res.status(500).json({ error: 'Failed to parse user preferences' });
    }
  });
});

// ==========================================
// 3. Jobs API Routes
// ==========================================

// GET: Fetch all jobs
app.get('/api/jobs', (req, res) => {
  db.all('SELECT * FROM jobs', [], (err, rows) => {
    if (err) {
      console.error('Error fetching jobs:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// POST: Add a new job
app.post('/api/jobs', (req, res) => {
  const { id, jobTitle, dateApplied, skillsNeeded, skillsIHave, description, isImportant, importantNotes } = req.body;
  const sql = `INSERT INTO jobs (id, jobTitle, dateApplied, skillsNeeded, skillsIHave, description, isImportant, importantNotes) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [id, jobTitle, dateApplied, skillsNeeded, skillsIHave, description, isImportant ? 1 : 0, importantNotes], function(err) {
    if (err) {
      console.error('Error adding job:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id, message: 'Job added successfully' });
  });
});

// DELETE: Delete a job
app.delete('/api/jobs/:id', (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM jobs WHERE id = ?`;
  
  db.run(sql, [id], function(err) {
    if (err) {
      console.error('Error deleting job:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json({ message: 'Job deleted successfully' });
  });
});

// ==========================================
// 4. Cold Mails API Routes
// ==========================================

// GET: Fetch all cold mails
app.get('/api/cold_mails', (req, res) => {
  db.all('SELECT * FROM cold_mails', [], (err, rows) => {
    if (err) {
      console.error('Error fetching cold mails:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// POST: Add a new cold mail
app.post('/api/cold_mails', (req, res) => {
  const { id, companyName, email, description } = req.body;
  const sql = `INSERT INTO cold_mails (id, companyName, email, description) 
               VALUES (?, ?, ?, ?)`;
  
  db.run(sql, [id, companyName, email, description], function(err) {
    if (err) {
      console.error('Error adding cold mail:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id, message: 'Cold mail added successfully' });
  });
});

// DELETE: Delete a cold mail
app.delete('/api/cold_mails/:id', (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM cold_mails WHERE id = ?`;
  
  db.run(sql, [id], function(err) {
    if (err) {
      console.error('Error deleting cold mail:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Cold mail not found' });
    }
    res.json({ message: 'Cold mail deleted successfully' });
  });
});

// ==========================================
// Server Start
// ==========================================
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`   DayFlow Server successfully running locally      `);
  console.log(`   URL: http://localhost:${PORT}                    `);
  console.log(`===================================================`);
});
