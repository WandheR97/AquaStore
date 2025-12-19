// backend/routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);
    if (!user) return res.status(401).json({ error: "Usuário não encontrado" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Senha incorreta" });

    // 🔹 Gera token com todos os dados importantes
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        owner_id: user.owner_id,
      },
      process.env.JWT_SECRET || "segredo_super_forte",
      { expiresIn: "7d" }
    );

    // 🔹 Retorna tudo no JSON para o frontend salvar corretamente
    res.json({
      token,
      id: user.id,
      username: user.username,
      role: user.role,
      owner_id: user.owner_id,
    });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

export default router;
