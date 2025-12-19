// backend/routes/sellers.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default function sellersRoutes(db) {
  const router = express.Router();

  // ============================
  // 🛡️ Middleware para autenticação
  // ============================
  function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ error: "Token ausente" });

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "segredo_super_forte");
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(403).json({ error: "Token inválido" });
    }
  }

  // ============================
  // 📋 Listar vendedores
  // ============================
  router.get("/", verifyToken, async (req, res) => {
    try {
      const user = req.user;

      let sellers = [];

      if (user.role === "host") {
        sellers = await db.all(`
          SELECT id, username, owner_id 
          FROM users 
          WHERE role = 'vendedor'
        `);
      }

      else if (user.role === "proprietario") {
        sellers = await db.all(
          "SELECT id, username, owner_id FROM users WHERE role = 'vendedor' AND owner_id = ?",
          [user.id]
        );
      }

      else if (user.role === "vendedor") {
        sellers = await db.all(
          "SELECT id, username, owner_id FROM users WHERE role = 'vendedor' AND owner_id = ?",
          [user.owner_id]
        );
      }

      else {
        return res.status(403).json({ error: "Acesso negado" });
      }

      res.json(sellers);
    } catch (err) {
      res.status(500).json({ error: "Erro ao listar vendedores" });
    }
  });

  // ============================
  // 📋 Listar vendedores por proprietário
  // ============================
  router.get("/by-owner/:ownerId", verifyToken, async (req, res) => {
    try {
      const ownerId = Number(req.params.ownerId);
      const user = req.user;

      if (user.role === "proprietario" && user.id !== ownerId)
        return res.status(403).json({ error: "Acesso negado" });

      if (user.role === "vendedor" && user.owner_id !== ownerId)
        return res.status(403).json({ error: "Acesso negado" });

      const sellers = await db.all(
        "SELECT id, username, owner_id FROM users WHERE role = 'vendedor' AND owner_id = ?",
        [ownerId]
      );

      res.json(sellers);
    } catch (err) {
      res.status(500).json({ error: "Erro ao listar vendedores por proprietário" });
    }
  });

  // ============================
  // ➕ Criar vendedor
  // ============================
  router.post("/", verifyToken, async (req, res) => {
    const { username, password, owner_id: bodyOwnerId } = req.body;
    const user = req.user;

    if (!username || !password)
      return res.status(400).json({ error: "Usuário e senha obrigatórios" });

    try {
      let owner_id = null;

      if (user.role === "host") {
        if (!bodyOwnerId)
          return res.status(400).json({ error: "owner_id é obrigatório" });

        owner_id = Number(bodyOwnerId);
      }

      else if (user.role === "proprietario") {
        owner_id = user.id;
      }

      else {
        return res.status(403).json({ error: "Apenas host ou proprietário podem criar vendedores" });
      }

      // ❗ Impede duplicados dentro do mesmo proprietário
      const exists = await db.get(
       "SELECT * FROM users WHERE username = ? AND role = 'vendedor'",
        [username]
      );

      if (exists) {
        return res.status(400).json({
          error: `O nome de vendedor "${username}" já está registrado`
        });
      }

      const hash = await bcrypt.hash(password, 10);

      await db.run(
        "INSERT INTO users (username, password, role, owner_id) VALUES (?, ?, 'vendedor', ?)",
        [username, hash, owner_id]
      );

      res.json({ success: true, message: "Vendedor criado com sucesso!" });

    } catch (err) {
      res.status(500).json({ error: "Erro ao criar vendedor" });
    }
  });

  // ============================
  // ✏️ Atualizar vendedor
  // ============================
  router.put("/:id", verifyToken, async (req, res) => {
    const sellerId = Number(req.params.id);
    const { username, password } = req.body;
    const user = req.user;

    try {
      const seller = await db.get(
        "SELECT * FROM users WHERE id = ? AND role = 'vendedor'",
        [sellerId]
      );

      if (!seller)
        return res.status(404).json({ error: "Vendedor não encontrado" });

      if (user.role === "vendedor")
        return res.status(403).json({ error: "Vendedor não pode editar perfis" });

      if (user.role === "proprietario" && seller.owner_id !== user.id)
        return res.status(403).json({ error: "Acesso negado" });

      const updates = [];
      const values = [];

      if (username) {
        const exists = await db.get(
          "SELECT * FROM users WHERE username = ? AND owner_id = ? AND id <> ? AND role = 'vendedor'",
          [username, seller.owner_id, sellerId]
        );

        if (exists)
          return res.status(400).json({ error: "Já existe outro vendedor com esse nome neste proprietário" });

        updates.push("username = ?");
        values.push(username);
      }

      if (password) {
        const hash = await bcrypt.hash(password, 10);
        updates.push("password = ?");
        values.push(hash);
      }

      if (updates.length === 0)
        return res.status(400).json({ error: "Nada para atualizar" });

      values.push(sellerId);

      await db.run(
        `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
        values
      );

      res.json({ success: true });

    } catch (err) {
      res.status(500).json({ error: "Erro ao atualizar vendedor" });
    }
  });

  // ============================
  // ❌ Excluir vendedor
  // ============================
  router.delete("/:id", verifyToken, async (req, res) => {
    try {
      const seller = await db.get(
        "SELECT * FROM users WHERE id = ? AND role = 'vendedor'",
        [req.params.id]
      );

      if (!seller)
        return res.status(404).json({ error: "Vendedor não encontrado" });

      if (req.user.role === "proprietario" && seller.owner_id !== req.user.id)
        return res.status(403).json({ error: "Acesso negado" });

      await db.run("DELETE FROM users WHERE id = ?", [req.params.id]);

      res.json({ success: true, message: "Vendedor excluído!" });

    } catch (err) {
      res.status(500).json({ error: "Erro ao excluir vendedor" });
    }
  });

  return router;
}
