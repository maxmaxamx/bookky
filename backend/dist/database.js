import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
const configuredPath = process.env['DATABASE_PATH'] ?? './data/bookky.sqlite';
const databasePath = configuredPath === ':memory:' ? configuredPath : resolve(configuredPath);
if (databasePath !== ':memory:') {
    mkdirSync(dirname(databasePath), { recursive: true });
}
export const database = new DatabaseSync(databasePath);
database.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES users(id),
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    guests INTEGER NOT NULL CHECK (guests BETWEEN 1 AND 12),
    table_id TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    comment TEXT,
    preorder TEXT,
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Confirmed', 'Cancelled')),
    created_at TEXT NOT NULL,
    table_label TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS bookings_date_time_idx ON bookings(date, time);
  CREATE INDEX IF NOT EXISTS bookings_owner_date_idx ON bookings(owner_id, date, time);
`);
try {
    database.exec(`ALTER TABLE bookings ADD COLUMN preorder TEXT;`);
}
catch {
    // column already exists
}
