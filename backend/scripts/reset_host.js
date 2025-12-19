// backend/reset_host.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcrypt";

const db = await open({
  filename: "./pdv.sqlite",
  driver: sqlite3.Database
});

const newPass = "123456";
const hashed = await bcrypt.hash(newPass, 10);

await db.run("UPDATE users SET password = ? WHERE username = ?", [hashed, "host"]);

console.log("✅ Senha do usuário 'host' redefinida para:", newPass);

await db.close();
