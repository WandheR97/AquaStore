import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default function ownersRoutes(db) {
  const router = express.Router();

  // ✅ Middleware para autenticação
  function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Token ausente" });

    const token = authHeader.split(" ")[1];
    try {
      console.log("🔍 Verificando token com segredo:", process.env.JWT_SECRET);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "segredo_super_forte");
      req.user = decoded;
      console.log("✅ Token decodificado:", decoded);
      next();
    } catch (err) {
      console.error("❌ Token inválido:", err);
      res.status(403).json({ error: "Token inválido" });
    }
  }

  // 📋 Listar proprietários (com controle de acesso)
  router.get("/", verifyToken, async (req, res) => {
    try {
      let owners;

      if (req.user.role === "host") {
        // 👑 Host pode ver todos os proprietários
        owners = await db.all("SELECT id, username, role, owner_id FROM users WHERE role = 'proprietario'");
      } else if (req.user.role === "proprietario") {
        // 🧑‍💼 Proprietário vê apenas a própria conta
        const owner = await db.get("SELECT id, username, role FROM users WHERE id = ?", [req.user.id]);
        owners = owner ? [owner] : [];
      }
      else {
         // 🧑‍🔧 Vendedor não tem permissão
         return res.status(403).json({ error: "Acesso negado" });
      }

      res.json(owners);
    } catch (err) {
      console.error("Erro ao listar proprietários:", err);
      res.status(500).json({ error: "Erro ao listar proprietários" });
    }
  });

  // ➕ Criar novo proprietário (apenas host)
  router.post("/", verifyToken, async (req, res) => {
    const { username, password } = req.body;

    if (req.user.role !== "host") {
      return res.status(403).json({ error: "Apenas o host pode criar proprietários" });
    }

    if (!username || !password)
      return res.status(400).json({ error: "Campos obrigatórios" });

    try {
      const exists = await db.get("SELECT * FROM users WHERE username = ?", [username]);
      if (exists) return res.status(400).json({ error: "Usuário já existe" });

      const hash = await bcrypt.hash(password, 10);
      const result = await db.run(
        "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
        [username, hash, "proprietario"]
      );

      const newOwnerId = result.lastID;
      await db.run("UPDATE users SET owner_id = ? WHERE id = ?", [newOwnerId, newOwnerId]);

      res.json({ success: true, message: "Proprietário criado com sucesso!" });
    } catch (err) {
      console.error("Erro ao criar proprietário:", err);
      res.status(500).json({ error: "Erro ao criar proprietário" });
    }
  });

  // ✏️ Atualizar proprietário (apenas o próprio ou o host)
  router.put("/:id", verifyToken, async (req, res) => {
    const { username, password } = req.body;
    const { id } = req.params;

    if (req.user.role !== "host" && req.user.id !== Number(id)) {
      return res.status(403).json({ error: "Você não tem permissão para editar este proprietário" });
    }


    const updates = [];
    const values = [];

    if (username) {
      updates.push("username = ?");
      values.push(username);
    }

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updates.push("password = ?");
      values.push(hash);
    }

    if (!updates.length)
      return res.status(400).json({ error: "Nada para atualizar" });

    try {
      values.push(id);
      const result = await db.run(
        `UPDATE users SET ${updates.join(", ")} WHERE id = ? AND role = 'proprietario'`,
        values
      );

      if (result.changes === 0)
        return res.status(404).json({ error: "Proprietário não encontrado" });

      res.json({ success: true, message: "Proprietário atualizado!" });
    } catch (err) {
      console.error("Erro ao atualizar proprietário:", err);
      res.status(500).json({ error: "Erro ao atualizar proprietário" });
    }
  });

  // ❌ Excluir proprietário (apenas host)
  router.delete("/:id", verifyToken, async (req, res) => {
    if (req.user.role !== "host") {
      return res.status(403).json({ error: "Apenas o host pode excluir proprietários" });
    }

    try {
      const { id } = req.params;
      await db.run("DELETE FROM users WHERE owner_id = ?", [id]);
      const result = await db.run(
        "DELETE FROM users WHERE id = ? AND role = 'proprietario'",
        [id]
      );

      if (result.changes === 0)
        return res.status(404).json({ error: "Proprietário não encontrado" });

      res.json({ success: true, message: "Proprietário excluído com sucesso!" });
    } catch (err) {
      console.error("Erro ao excluir proprietário:", err);
      res.status(500).json({ error: "Erro ao excluir proprietário" });
    }
  });

  // 📋 Buscar proprietário pelo ID (para incluir ele como opção de vendedor)
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const owner = await db.get("SELECT id, username, role FROM users WHERE id = ? AND role = 'proprietario'", [id]);
    if (!owner) return res.status(404).json({ error: "Proprietário não encontrado" });
    res.json(owner);
  } catch (err) {
    console.error("Erro ao buscar proprietário:", err);
    res.status(500).json({ error: "Erro ao buscar proprietário" });
  }
});

  return router;
}
