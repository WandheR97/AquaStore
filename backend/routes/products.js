import express from "express";
import db from "../db.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// ===============================
// 🔐 Middleware de verificação de token
// ===============================
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log("🚫 Token ausente");
    return res.status(401).json({ error: "Token ausente" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "segredo_super_forte");
    req.user = decoded;
    console.log("✅ Token verificado:", decoded);
    next();
  } catch (err) {
    console.error("❌ Erro no token:", err.message);
    return res.status(403).json({ error: "Token inválido" });
  }
}

router.use(verifyToken);

// ===============================
// 🧱 Criação da tabela
// ===============================
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

console.log("🧱 Tabela products pronta!");

// ===============================
// 📦 Listar produtos
// ===============================
router.get("/", async (req, res) => {
  console.log("📩 GET /api/products recebido de:", req.user);

  try {
    const products = await db.all("SELECT * FROM products ORDER BY id DESC");
    console.log(`✅ ${products.length} produtos encontrados.`);
    res.json(products);
  } catch (err) {
    console.error("❌ Erro ao listar produtos:", err);
    res.status(500).json({ error: "Erro ao listar produtos" });
  }
});

// ===============================
// ➕ Cadastrar produto
// ===============================
router.post("/", async (req, res) => {
  console.log("🧾 POST /api/products - Dados recebidos:", req.body);

  const { name, brand, weight, cost_price, sale_price, stock, low_stock_alert } = req.body;

  try {
    await db.run(
      `INSERT INTO products 
        (name, brand, weight, cost_price, sale_price, stock, low_stock_alert, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))`,
      [name, brand, weight, cost_price, sale_price, stock, low_stock_alert]
    );

    console.log("✅ Produto cadastrado com sucesso!");
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao cadastrar produto:", err);
    res.status(500).json({ error: "Erro ao cadastrar produto" });
  }
});

export default router;
