import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import sellersConfigRoutes from "./routes/sellersConfig.js";
import ownersRoutes from "./routes/owners.js";
import sellersRoutes from "./routes/sellers.js";
import salesRoutes from "./routes/sales.js";
import { randomUUID } from "crypto";
import poolSalesRoutes from "./routes/poolSales.js";
import authRoutes from "./routes/auth.js";

process.env.TZ = "America/Sao_Paulo";
dotenv.config();
process.env.JWT_SECRET = process.env.JWT_SECRET || "segredo_super_forte";
const app = express();

const PORT = process.env.PORT || 5000;

// Permite requisições do frontend
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json()); // ✅ ESSENCIAL — sem isso o req.body vem undefined

// Log das requisições
app.use((req, res, next) => {
  console.log(`📩 ${req.method} ${req.url}`);
  next();
});

// ==========================================
// CONFIGURAÇÃO JWT E BANCO DE DADOS
// ==========================================
const SECRET = process.env.JWT_SECRET || "segredo_super_forte";

const db = await open({
  filename: "./pvd.sqlite", // ✅ nome padronizado
  driver: sqlite3.Database,
});

app.use("/auth", authRoutes(db));

// ==========================
// 🔄 ROTAS EXTERNAS
// ==========================
app.use("/api/owners", ownersRoutes(db));
app.use("/api/sellers", sellersRoutes(db));
app.use("/sales", salesRoutes);
app.use("/pool-sales", poolSalesRoutes);
app.use("/api/sellers-config", sellersConfigRoutes);


// ==========================================
// CRIAÇÃO DAS TABELAS
// ==========================================
await db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  role TEXT CHECK(role IN ('host', 'proprietario', 'vendedor')),
  owner_id INTEGER
);

CREATE TABLE IF NOT EXISTS sellers_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  telefone TEXT,
  owner_id INTEGER
);

CREATE TABLE IF NOT EXISTS brands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  supplier TEXT,
  owner_id INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS pool_brands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  supplier TEXT,
  owner_id INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS installers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact TEXT,
  owner_id INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  weight TEXT,
  cost_price REAL NOT NULL,
  sale_price REAL NOT NULL,
  stock INTEGER NOT NULL,
  low_stock_alert INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT,
  owner_id INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS pools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model TEXT NOT NULL,
  brand TEXT NOT NULL,
  length REAL NOT NULL,
  width REAL NOT NULL,
  depth REAL NOT NULL,
  cost_price REAL NOT NULL,
  cost_white REAL,
  cost_with_tile REAL,
  cost_white_with_tile REAL,
  sale_price REAL NOT NULL,
  sale_white REAL,
  sale_with_tile REAL,
  sale_white_with_tile REAL,
  created_at TEXT,
  updated_at TEXT,
  owner_id INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  store_id INTEGER,
  created_by INTEGER,
  customer_id INTEGER,
  total REAL,
  discount REAL,
  payment_method TEXT,
  internal_use INTEGER,
  seller_id INTEGER,
  owner_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT,
  product_id INTEGER,
  qty INTEGER,
  unit_price REAL,
  cost_at_sale REAL
);
`);

// ==========================================
// USUÁRIO PADRÃO HOST
// ==========================================
if (process.env.NODE_ENV !== "production") {
  const hostExists = await db.get(
    "SELECT * FROM users WHERE role = 'host'"
  );

  if (!hostExists) {
    const hash = await bcrypt.hash("123456", 10);
    await db.run(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      ["host", hash, "host"]
    );
    console.log("✅ Usuário host criado (DEV)");
  }
}

// ==========================================
// MIDDLEWARE DE AUTENTICAÇÃO (corrigido)
// ==========================================
async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Token ausente" });

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);

    // ✅ Garante que todos os papéis tenham owner_id correto
    if (decoded.role === "host") {
      decoded.owner_id = Number(decoded.id);
    } else if (decoded.role === "proprietario" && !decoded.owner_id) {
      decoded.owner_id = Number(decoded.id);
    } else if (decoded.role === "vendedor" && !decoded.owner_id) {
      const user = await db.get("SELECT owner_id FROM users WHERE id = ?", [decoded.id]);
      decoded.owner_id = Number(user?.owner_id || 0);
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error("Erro de autenticação:", err.message);
    return res.status(403).json({ error: "Token inválido" });
  }
}

// ==========================================
// LOGIN (corrigido com owner_id garantido)
// ==========================================
app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: "Usuário e senha são obrigatórios." });

  const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);
  if (!user) return res.status(401).json({ error: "Usuário ou senha incorretos." });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Usuário ou senha incorretos." });

  // 🔧 Corrige o owner_id conforme o tipo de conta
  let ownerId = user.owner_id;

  if (user.role === "host" || user.role === "proprietario") {
    // proprietario/host são donos de si mesmos
    ownerId = user.id;
    await db.run("UPDATE users SET owner_id = ? WHERE id = ?", [ownerId, user.id]);
  } else if (user.role === "vendedor") {
    // vendedor precisa ter owner_id vinculado
    const owner = await db.get("SELECT owner_id FROM users WHERE id = ?", [user.id]);
    ownerId = owner?.owner_id || user.owner_id;
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      owner_id: ownerId,
    },
    SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    username: user.username,
    role: user.role,
    owner_id: ownerId,
  });
});

app.use((req, res, next) => {
  console.log(`📩 ${req.method} ${req.url}`);
  next();
});

function getOwnerId(user) {
  if (user.role === "host" || user.role === "proprietario") return Number(user.id);
  return Number(user.owner_id); // 🔧 força ser número
}

// ----------- VENDEDORES CONFIG (proprietário + vendedores do mesmo owner) -----------
app.get("/api/sellers-config", auth, async (req, res) => {
  try {
    const ownerId = getOwnerId(req.user);

    // 🔹 Pega o proprietário
    const owner = await db.get(
      "SELECT id, username AS nome, role FROM users WHERE id = ? AND role = 'proprietario'",
      [ownerId]
    );

    // 🔹 Pega os vendedores vinculados a ele
    const sellers = await db.all(
      "SELECT id, username AS nome, role FROM users WHERE owner_id = ? AND role = 'vendedor'",
      [ownerId]
    );

    // 🔹 Retorna ambos na lista (proprietário + vendedores)
    const result = [];
    if (owner) result.push(owner);
    result.push(...sellers);

    res.json(result);
  } catch (err) {
    console.error("Erro ao listar vendedores:", err);
    res.status(500).json({ error: "Erro ao listar vendedores" });
  }
});


// ✅ Rotas de vendas de piscinas (CRUD completo)
app.use("/pool-sales", poolSalesRoutes);

// ==========================================
// ROTAS DE PRODUTOS (MODELO PADRÃO)
// ==========================================
app.get("/api/products", auth, async (req, res) => {
  try {
    // 🔹 Se for proprietário, ele mesmo é o dono
    // 🔹 Se for vendedor, usa o owner_id do proprietário
    const ownerId = getOwnerId(req.user);

    const products = await db.all(
      "SELECT * FROM products WHERE owner_id = ? ORDER BY name ASC",
      [ownerId]
    );

    res.json(products);
  } catch (err) {
    console.error("Erro ao buscar produtos:", err);
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
});

app.post("/api/products", auth, async (req, res) => {
  const { name, brand, cost_price, sale_price, stock } = req.body;

  if (!name || typeof name !== "string")
    return res.status(400).json({ error: "Nome inválido" });

  if (!brand || !cost_price || !sale_price || !stock)
    return res.status(400).json({ error: "Campos obrigatórios ausentes." });

  const now = new Date().toISOString();

  await db.run(
    `INSERT INTO products 
    (name, brand, weight, cost_price, sale_price, stock, low_stock_alert, created_at, updated_at, owner_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.body.name,
      req.body.brand,
      req.body.weight || "",
      req.body.cost_price,
      req.body.sale_price,
      req.body.stock,
      req.body.low_stock_alert || 0,
      now,
      now,
      req.user.owner_id,
    ]
  );

  res.json({ success: true });
});

// GET produtos entregues
app.get("/pool-sales/:id/delivered-products", async (req, res) => {
  const { id } = req.params;
  const sale = await db.get("SELECT delivered_products FROM pool_sales WHERE id = ?", [id]);
  if (!sale) return res.status(404).json({ error: "Venda não encontrada" });
  const data = JSON.parse(sale.delivered_products || "{}");
  res.json(data);
});

// PUT para salvar alterações
app.put("/pool-sales/:id/delivered-products", async (req, res) => {
  const { id } = req.params;
  const { products, observacaoGeral } = req.body;
  const data = JSON.stringify({ products, observacaoGeral });
  await db.run("UPDATE pool_sales SET delivered_products = ? WHERE id = ?", [data, id]);
  res.json({ success: true });
});

// ==========================================
// ATUALIZAR PRODUTO (PUT /api/products/:id)
// ==========================================
app.put("/api/products/:id", auth, async (req, res) => {
  try {
    const {
      name,
      brand,
      weight,
      cost_price,
      sale_price,
      stock,
      low_stock_alert,
    } = req.body;

    const result = await db.run(
      `UPDATE products SET
        name = ?, brand = ?, weight = ?, cost_price = ?, sale_price = ?, 
        stock = ?, low_stock_alert = ?, updated_at = datetime('now','localtime')
       WHERE id = ? AND owner_id = ?`,
      [
        name,
        brand,
        weight,
        cost_price,
        sale_price,
        stock,
        low_stock_alert,
        req.params.id,
        req.user.owner_id,
      ]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao atualizar produto:", err);
    res.status(500).json({ error: "Erro ao atualizar produto" });
  }
});

// ==========================================
// EXCLUIR PRODUTO (DELETE /api/products/:id)
// ==========================================
app.delete("/api/products/:id", auth, async (req, res) => {
  try {
    const result = await db.run(
      "DELETE FROM products WHERE id = ? AND owner_id = ?",
      [req.params.id, req.user.owner_id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao excluir produto:", err);
    res.status(500).json({ error: "Erro ao excluir produto" });
  }
});

// ==========================================
// 💰 REGISTRA VENDA NORMAL
// ==========================================
app.post("/sales", auth, async (req, res) => {
  try {
    const { items, total, discount, payment_method } = req.body;

    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: "Nenhum item na venda." });

    if (!total || typeof total !== "number")
      return res.status(400).json({ error: "Valor total inválido." });

    const saleId = Date.now().toString();

    await db.run(
      "INSERT INTO sales (id, store_id, created_by, total, discount, payment_method, internal_use) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [saleId, req.user.owner_id, req.user.id, total, discount || 0, payment_method, 0]
    );

    for (const item of items) {
      console.log("📦 Salvando item:", item);

      await db.run(
        `INSERT INTO sale_items (id, sale_id, product_id, qty, unit_price, cost_at_sale)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [randomUUID(), saleId, item.product_id, item.qty, item.unit_price, 0]
      );

      // ✅ Corrigido — coluna é stock, não stock_quantity
      await db.run(
        "UPDATE products SET stock = stock - ? WHERE id = ?",
        [item.qty, item.product_id]
      );
    }

    const updatedProducts = await db.all("SELECT id, name, stock FROM products");
    res.json({ success: true, sale_id: saleId, updatedProducts });
  } catch (err) {
    console.error("❌ Erro ao registrar venda:", err);
    res.status(500).json({ error: "Erro ao registrar venda" });
  }
});

app.post("/sync/offline", auth, async (req, res) => {
  const sales = req.body;

  if (!Array.isArray(sales))
    return res.status(400).json({ error: "Formato de dados inválido." });

  for (const s of sales) {
    try {
      await db.run(
        "INSERT INTO sales (id, store_id, created_by, total, discount, payment_method, internal_use) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [Date.now().toString(), req.user.owner_id, req.user.id, s.total, s.discount || 0, s.payment_method, 1]
      );
    } catch (err) {
      console.error("Erro ao sincronizar venda offline:", err);
    }
  }

  res.json({ success: true });
});

// ============================
// 💧 Rota para vendas de piscina
// ============================



// ==========================================
// ROTAS DE CONFIGURAÇÕES (MARCAS, INSTALADORES, ETC.)
// ==========================================

// ----------- MARCAS DE PRODUTOS -----------
app.get("/api/brands", auth, async (req, res) => {
  const brands = await db.all("SELECT * FROM brands WHERE owner_id = ?", req.user.owner_id);
  res.json(brands);
});

app.post("/api/brands", auth, async (req, res) => {
  console.log("🧾 Token decodificado:", req.user);
  console.log("📦 Dados recebidos:", req.body);

  const { name, supplier } = req.body;
  if (!name || typeof name !== "string") 
    return res.status(400).json({ error: "Nome inválido" });

  await db.run(
    "INSERT INTO brands (name, supplier, owner_id) VALUES (?, ?, ?)",
    [name, supplier || "", req.user.owner_id]
  );

  res.json({ success: true });
});


app.put("/api/brands/:id", auth, async (req, res) => {
  const { name, supplier } = req.body;
  await db.run("UPDATE brands SET name = ?, supplier = ? WHERE id = ?", [name, supplier, req.params.id]);
  res.json({ success: true });
});

app.delete("/api/brands/:id", auth, async (req, res) => {
  await db.run("DELETE FROM brands WHERE id = ?", req.params.id);
  res.json({ success: true });
});


// ----------- MARCAS DE PISCINAS -----------
app.get("/api/pool-brands", auth, async (req, res) => {
  const brands = await db.all("SELECT * FROM pool_brands WHERE owner_id = ?", req.user.owner_id);
  res.json(brands);
});

app.post("/api/pool-brands", auth, async (req, res) => {
  const { name, supplier } = req.body;
  if (!name || typeof name !== "string") return res.status(400).json({ error: "Nome inválido" });
  await db.run(
    "INSERT INTO pool_brands (name, supplier, owner_id) VALUES (?, ?, ?)",
    [name, supplier || "", req.user.owner_id]
  );
  res.json({ success: true });
});

app.put("/api/pool-brands/:id", auth, async (req, res) => {
  const { name, supplier } = req.body;
  await db.run("UPDATE pool_brands SET name = ?, supplier = ? WHERE id = ?", [name, supplier, req.params.id]);
  res.json({ success: true });
});

app.delete("/api/pool-brands/:id", auth, async (req, res) => {
  await db.run("DELETE FROM pool_brands WHERE id = ?", req.params.id);
  res.json({ success: true });
});


// ----------- INSTALADORES (com vínculo proprietário/vendedor) -----------
app.get("/api/installers", auth, async (req, res) => {
  try {
    // 🔹 Proprietário vê os próprios instaladores
    // 🔹 Vendedores veem os do proprietário ao qual estão vinculados
    const ownerId = getOwnerId(req.user);

    const installers = await db.all(
      "SELECT * FROM installers WHERE owner_id = ? ORDER BY name ASC",
      [ownerId]
    );

    res.json(installers);
  } catch (err) {
    console.error("Erro ao listar instaladores:", err);
    res.status(500).json({ error: "Erro ao listar instaladores" });
  }
});

app.post("/api/installers", auth, async (req, res) => {
  try {
    const { name, contact } = req.body;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Nome inválido" });
    }

    // 🔹 Se for vendedor, usa o owner_id do proprietário
    // 🔹 Se for proprietário, usa o próprio id
    const ownerId = getOwnerId(req.user);

    await db.run(
      "INSERT INTO installers (name, contact, owner_id) VALUES (?, ?, ?)",
      [name, contact || "", ownerId]
    );

    res.json({ success: true, message: "Instalador cadastrado com sucesso!" });
  } catch (err) {
    console.error("Erro ao cadastrar instalador:", err);
    res.status(500).json({ error: "Erro ao cadastrar instalador" });
  }
});

app.put("/api/installers/:id", auth, async (req, res) => {
  try {
    const { name, contact } = req.body;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Nome inválido" });
    }

    // 🔒 Garante que o instalador pertença ao mesmo owner
    const result = await db.run(
      "UPDATE installers SET name = ?, contact = ? WHERE id = ? AND owner_id = ?",
      [name, contact, req.params.id, req.user.owner_id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Instalador não encontrado." });
    }

    res.json({ success: true, message: "Instalador atualizado com sucesso!" });
  } catch (err) {
    console.error("Erro ao atualizar instalador:", err);
    res.status(500).json({ error: "Erro ao atualizar instalador" });
  }
});

app.delete("/api/installers/:id", auth, async (req, res) => {
  try {
    // 🔒 Só pode excluir instaladores do mesmo owner
    const result = await db.run(
      "DELETE FROM installers WHERE id = ? AND owner_id = ?",
      [req.params.id, req.user.owner_id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Instalador não encontrado." });
    }

    res.json({ success: true, message: "Instalador excluído com sucesso!" });
  } catch (err) {
    console.error("Erro ao excluir instalador:", err);
    res.status(500).json({ error: "Erro ao excluir instalador" });
  }
});

// ============================
// ROTAS DE PISCINAS
// ============================
app.get("/api/pools", auth, async (req, res) => {
  try {
    // 🔹 Proprietário vê as próprias piscinas
    // 🔹 Vendedor vê as piscinas do seu proprietário
    const ownerId = getOwnerId(req.user);
    console.log(`🔎 Buscando produtos/piscinas do owner_id: ${ownerId} (usuário: ${req.user.username}, role: ${req.user.role})`);

    const pools = await db.all(
      "SELECT * FROM pools WHERE owner_id = ? ORDER BY id DESC",
      [ownerId]
    );

    res.json(pools);
  } catch (err) {
    console.error("Erro ao buscar piscinas:", err);
    res.status(500).json({ error: "Erro ao buscar piscinas" });
  }
});

app.post("/api/pools", auth, async (req, res) => {
  console.log("📤 Dados recebidos no backend:", req.body); // 👈 ADICIONE AQUI
  try {
    const {
      model,
      brand,
      length,
      width,
      depth,
      cost_price,
      cost_white,
      cost_with_tile,
      cost_white_with_tile,
      sale_price,
      sale_price_white,
      sale_price_tile,
      sale_price_white_tile,
    } = req.body;

    // Validação básica
    if (!model || !brand) {
      return res.status(400).json({ error: "Modelo e marca são obrigatórios." });
    }

    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO pools (
        model, brand, length, width, depth,
        cost_price, cost_white, cost_with_tile, cost_white_with_tile,
        sale_price, sale_white, sale_with_tile, sale_white_with_tile,
        created_at, updated_at, owner_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        model,
        brand,
        length,
        width,
        depth,
        cost_price || 0,
        cost_white || 0,
        cost_with_tile || 0,
        cost_white_with_tile || 0,
        sale_price || 0,
        sale_price_white || 0,
        sale_price_tile || 0,
        sale_price_white_tile || 0,
        now,
        now,
        req.user.owner_id,
      ]
    );

    res.json({ success: true, message: "Piscina cadastrada com sucesso!" });
  } catch (err) {
    console.error("Erro ao cadastrar piscina:", err);
    res.status(500).json({ error: "Erro ao cadastrar piscina" });
  }
});

app.put("/api/pools/:id", auth, async (req, res) => {
  try {
    const {
      model,
      brand,
      length,
      width,
      depth,
      cost_price,
      cost_white,
      cost_with_tile,
      cost_white_with_tile,
      sale_price,
      sale_price_white,
      sale_price_tile,
      sale_price_white_tile,
    } = req.body;

    await db.run(
      `UPDATE pools SET
        model = ?, brand = ?, length = ?, width = ?, depth = ?,
        cost_price = ?, cost_white = ?, cost_with_tile = ?, cost_white_with_tile = ?,
        sale_price = ?, sale_white = ?, sale_with_tile = ?, sale_white_with_tile = ?,
        updated_at = ?
      WHERE id = ?`,
      [
        model,
        brand,
        length,
        width,
        depth,
        cost_price,
        cost_white,
        cost_with_tile,
        cost_white_with_tile,
        sale_price,
        sale_price_white,
        sale_price_tile,
        sale_price_white_tile,
        new Date().toISOString(),
        req.params.id,
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao atualizar piscina:", err);
    res.status(500).json({ error: "Erro ao atualizar piscina." });
  }
});

app.delete("/api/pools/:id", auth, async (req, res) => {
  try {
    await db.run("DELETE FROM pools WHERE id = ?", req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao excluir piscina:", err);
    res.status(500).json({ error: "Erro ao excluir piscina." });
  }
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

// ======================================================
// 🧾 Retorna os itens de uma venda específica
// ======================================================
app.get("/sales/:id/items", auth, async (req, res) => {
  try {
    const saleId = req.params.id;
    const items = await db.all(
      `SELECT si.*, p.name 
         FROM sale_items si 
         LEFT JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?`,
      [saleId]
    );

    res.json(items || []);
  } catch (err) {
    console.error("Erro ao buscar itens da venda:", err);
    res.status(500).json({ error: "Erro ao buscar itens da venda" });
  }
});