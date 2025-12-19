import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcrypt";

const db = await open({
  filename: "./pdv.sqlite",
  driver: sqlite3.Database
});

console.log("🔍 Limpando usuário antigo...");
await db.run("DELETE FROM users WHERE username = 'host'");

const hashed = await bcrypt.hash("123456", 10);

console.log("✅ Criando novo usuário 'host' com id autoincrementado...");
await db.run(
  "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
  ["host", hashed, "host"]
);

const users = await db.all("SELECT id, username, role FROM users");
console.table(users);

await db.close();
console.log("🎉 Correção concluída! Agora você pode logar com host / 123456.");
