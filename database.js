const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');

    // Create users table and seed default users
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'staff'
    )`, async (err) => {
      if (err) {
        console.error('Error creating users table:', err.message);
      } else {
        try {
          const adminPassword = await bcrypt.hash('admin123', 10);
          const staffPassword = await bcrypt.hash('staff123', 10);
          
          db.run("INSERT OR IGNORE INTO users (username, password, role) VALUES ('admin', ?, 'admin')", [adminPassword]);
          db.run("INSERT OR IGNORE INTO users (username, password, role) VALUES ('staff', ?, 'staff')", [staffPassword]);
        } catch (hashErr) {
          console.error('Error hashing passwords:', hashErr);
        }
      }
    });

    db.run(`CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT
    )`);

    // Create items table
    db.run(`CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      quantity INTEGER DEFAULT 0,
      cost_price REAL DEFAULT 0.0,
      price REAL DEFAULT 0.0,
      description TEXT,
      FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      quantity_sold INTEGER NOT NULL,
      total_revenue REAL NOT NULL,
      total_profit REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
    )`);
  }
});

module.exports = db;
