import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcrypt";

async function recreateHost() {
  const db = await open({
    filename: "./pdv.sqlite",
    driver: sqlite3.Database,
  });

  console.log("🧹 Removendo usuário antigo 'host'...");
  await db.run("DELETE FROM users WHERE username = 'host'");

  const hashedPassword = await bcrypt.hash("123456", 10);
  console.log("🔐 Senha criptografada com bcrypt.");

  await db.run(
    "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
    ["host", hashedPassword, "host"]
  );

  console.log("✅ Usuário 'host' recriado com sucesso!");
  const users = await db.all("SELECT id, username, role FROM users;");
  console.table(users);

  await db.close();
  console.log("🎉 Agora você pode logar com:\nUsuário: host\nSenha: 123456");
}

recreateHost().catch(console.error);
