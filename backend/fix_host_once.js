import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcrypt";

const db = await open({ filename: "./pdv.sqlite", driver: sqlite3.Database });

await db.run("DELETE FROM users WHERE username = ?", ["host"]);
const hashed = await bcrypt.hash("123456", 10);
await db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", ["host", hashed, "host"]);
console.log("host reset ok");
await db.close();
