// backend/routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default function authRoutes(db) {
  const router = express.Router();

  // 🔐 Login com verificação de hash
  router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
      const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);
      if (!user) return res.status(401).json({ error: "Usuário não encontrado" });

      const passwordOk = await bcrypt.compare(password, user.password);
      if (!passwordOk) return res.status(401).json({ error: "Senha incorreta" });

      // 🔁 Corrige o owner_id de acordo com o papel do usuário
      let ownerId = user.owner_id;
      if (user.role === "proprietario") ownerId = user.id; // Proprietário é dono de si mesmo
      if (user.role === "host") ownerId = 1;               // Host tem owner_id fixo 1 por padrão

      // 🔒 Cria o token JWT com o owner_id correto
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role,
          owner_id: ownerId,
        },
        process.env.JWT_SECRET || "segredo_super_forte",
        { expiresIn: "8h" }
      );

      // ✅ Retorna tudo que o frontend precisa
      res.json({
        token,
        id: user.id,
        username: user.username,
        role: user.role,
        owner_id: ownerId,
      });

    } catch (err) {
      console.error("Erro no login:", err);
      res.status(500).json({ error: "Erro interno no servidor" });
    }
  });

  return router;
}
