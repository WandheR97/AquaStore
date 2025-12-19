import express from "express";
import db from "../db.js";

const router = express.Router();

// ✅ Garante que a tabela exista com os nomes usados no frontend
await db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    weight TEXT,
    cost_price REAL NOT NULL,
    sale_price REAL NOT NULL,
    stock INTEGER NOT NULL,
    low_stock_alert INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// ✅ Listar todos os produtos
router.get("/", async (req, res) => {
  try {
    const products = await db.all("SELECT * FROM products ORDER BY id DESC");
    res.json(products);
  } catch (err) {
    console.error("❌ Erro ao listar produtos:", err);
    res.status(500).json({ error: "Erro ao listar produtos" });
  }
});

// ✅ Cadastrar novo produto
router.post("/", async (req, res) => {
  const { name, brand, weight, cost_price, sale_price, stock, low_stock_alert } = req.body;

  try {
    await db.run(
      `INSERT INTO products 
        (name, brand, weight, cost_price, sale_price, stock, low_stock_alert, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))`,
      [name, brand, weight, cost_price, sale_price, stock, low_stock_alert]
    );

    res.json({ success: true, message: "✅ Produto cadastrado com sucesso!" });
  } catch (err) {
    console.error("❌ Erro ao cadastrar produto:", err);
    res.status(500).json({ error: "Erro ao cadastrar produto" });
  }
});

// ✅ Atualizar produto existente
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, brand, weight, cost_price, sale_price, stock, low_stock_alert } = req.body;

  try {
    const result = await db.run(
      `UPDATE products
       SET 
         name = ?, 
         brand = ?, 
         weight = ?, 
         cost_price = ?, 
         sale_price = ?, 
         stock = ?, 
         low_stock_alert = ?, 
         updated_at = datetime('now', 'localtime')
       WHERE id = ?`,
      [name, brand, weight, cost_price, sale_price, stock, low_stock_alert, id]
    );

    if (result.changes === 0) {
      console.warn(`⚠️ Produto com id ${id} não encontrado.`);
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    res.json({ success: true, message: "✅ Produto atualizado com sucesso!" });
  } catch (err) {
    console.error("❌ Erro ao atualizar produto:", err);
    res.status(500).json({ error: "Erro ao atualizar produto" });
  }
});

// ✅ Excluir produto
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.run("DELETE FROM products WHERE id = ?", [id]);

    if (result.changes === 0) {
      console.warn(`⚠️ Produto com id ${id} não encontrado para exclusão.`);
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    res.json({ success: true, message: "✅ Produto excluído com sucesso!" });
  } catch (err) {
    console.error("❌ Erro ao excluir produto:", err);
    res.status(500).json({ error: "Erro ao excluir produto" });
  }
});

export default router;
