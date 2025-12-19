import express from "express";

export default function sellersConfigRoutes(db) {
  const router = express.Router();

  // 📋 Listar vendedores
  router.get("/", async (req, res) => {
    try {
      const sellers = await db.all("SELECT * FROM sellers_config ORDER BY nome ASC");
      res.json(sellers);
    } catch (err) {
      console.error("Erro ao listar vendedores:", err);
      res.status(500).json({ error: "Erro ao listar vendedores" });
    }
  });

  // ➕ Criar vendedor
  router.post("/", async (req, res) => {
    const { nome, telefone } = req.body;
    if (!nome) return res.status(400).json({ error: "Nome é obrigatório" });

    try {
      await db.run("INSERT INTO sellers_config (nome, telefone) VALUES (?, ?)", [
        nome,
        telefone || "",
      ]);
      res.json({ success: true, message: "Vendedor cadastrado com sucesso!" });
    } catch (err) {
      console.error("Erro ao criar vendedor:", err);
      res.status(500).json({ error: "Erro ao criar vendedor" });
    }
  });

  // ✏️ Atualizar vendedor
  router.put("/:id", async (req, res) => {
    const { nome, telefone } = req.body;
    if (!nome) return res.status(400).json({ error: "Nome é obrigatório" });

    try {
      await db.run("UPDATE sellers_config SET nome = ?, telefone = ? WHERE id = ?", [
        nome,
        telefone || "",
        req.params.id,
      ]);
      res.json({ success: true, message: "Vendedor atualizado com sucesso!" });
    } catch (err) {
      console.error("Erro ao atualizar vendedor:", err);
      res.status(500).json({ error: "Erro ao atualizar vendedor" });
    }
  });

  // ❌ Excluir vendedor
  router.delete("/:id", async (req, res) => {
    try {
      await db.run("DELETE FROM sellers_config WHERE id = ?", [req.params.id]);
      res.json({ success: true, message: "Vendedor excluído com sucesso!" });
    } catch (err) {
      console.error("Erro ao excluir vendedor:", err);
      res.status(500).json({ error: "Erro ao excluir vendedor" });
    }
  });

  return router;
}
