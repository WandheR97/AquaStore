import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcrypt";

const db = await open({
  filename: "./pvd.sqlite",
  driver: sqlite3.Database
});

console.log("🧹 Removendo tabela antiga de usuários...");
await db.exec("DROP TABLE IF EXISTS users;");

console.log("🧱 Criando tabela 'users' com ID autoincrementado...");
await db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('host', 'owner', 'seller')) NOT NULL
  );
`);

const hashed = await bcrypt.hash("123456", 10);

await db.run(
  "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
  ["host", hashed, "host"]
);

console.log("✅ Usuário 'host' criado com sucesso (senha: 123456)");

const users = await db.all("SELECT id, username, role FROM users;");
console.table(users);

await db.close();
console.log("🎉 Tabela corrigida e usuário pronto para login!");
