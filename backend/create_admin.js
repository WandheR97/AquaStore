import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import db from "./db.js";

const username = "host";
const password = "123456";
const role = "host";

const createAdmin = async () => {
  const hashed = await bcrypt.hash(password, 10);
  await db.run(
    "INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)",
    [randomUUID(), username, hashed, role]
  );
  console.log("✅ Usuário host criado com sucesso!");
  console.log("Usuário:", username);
  console.log("Senha:", password);
};

createAdmin();
