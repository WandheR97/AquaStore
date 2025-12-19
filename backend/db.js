import sqlite3 from "sqlite3";
import { open } from "sqlite";

const dbPromise = open({
  filename: "./pvd.sqlite",
  driver: sqlite3.Database,
});

async function createTables() {
  const db = await dbPromise;

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'user'
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand TEXT,
      weight TEXT,
      cost_price REAL NOT NULL,
      sale_price REAL NOT NULL,
      stock INTEGER NOT NULL,
      stock_alert INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS pools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model TEXT NOT NULL,
      brand TEXT,
      length REAL,
      width REAL,
      depth REAL,
      cost_price REAL,
      cost_price_white REAL,
      cost_price_tile REAL,
      cost_price_white_tile REAL,
      sale_price REAL,
      sale_price_white REAL,
      sale_price_tile REAL,
      sale_price_white_tile REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      supplier TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS pool_brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      supplier TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS installers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Cria usuário padrão
  const user = await db.get("SELECT * FROM users WHERE username = ?", ["host"]);
  if (!user) {
    await db.run(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      ["host", "123456", "admin"]
    );
    console.log("✅ Usuário padrão criado: host / 123456");
  }
}

createTables();

export default dbPromise;
