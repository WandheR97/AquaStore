import sqlite3 from "sqlite3";
import { open } from "sqlite";

const db = await open({
  filename: "./pdv.sqlite",
  driver: sqlite3.Database
});

const users = await db.all("SELECT id, username, role FROM users");
console.log("Usuários cadastrados:");
console.table(users);

await db.close();
