// backend/recreate_host.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcrypt";

const db = await open({
  filename: "./pdv.sqlite",
  driver: sqlite3.Database
});

const password = "123456";
const hashed = await bcrypt.hash(password, 10);

// Garante que a tabela users exista
await db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT CHECK(role IN ('host', 'owner', 'seller'))
  )
`);

// Remove o usuário antigo
await db.run("DELETE FROM users WHERE username = ?", ["host"]);

// Cria novamente com role válido
await db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [
  "host",
  hashed,
  "host"
]);

console.log("✅ Usuário 'host' recriado com senha 123456 e papel 'host'.");

await db.close();
