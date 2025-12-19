// backend/routes/sales.js
import express from "express";
import { randomUUID } from "crypto";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import moment from "moment-timezone";
import jwt from "jsonwebtoken";

const router = express.Router();

const openDb = async () => {
  return open({
    filename: "./pvd.sqlite",
    driver: sqlite3.Database,
  });
};

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Token ausente" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "segredo_super_forte");
    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ Token inválido:", err);
    return res.status(403).json({ error: "Token inválido" });
  }
}

async function ensureColumns() {
  const db = await openDb();
  try {
    const cols = await db.all(`PRAGMA table_info(sales)`);
    const names = cols.map(c => c.name);
    if (!names.includes("seller_id")) {
      await db.exec(`ALTER TABLE sales ADD COLUMN seller_id INTEGER;`);
      console.log("➡️ Coluna seller_id adicionada em sales");
    }
    if (!names.includes("owner_id")) {
      await db.exec(`ALTER TABLE sales ADD COLUMN owner_id INTEGER;`);
      console.log("➡️ Coluna owner_id adicionada em sales");
    }
    if (!names.includes("seller_name")) {
      await db.exec(`ALTER TABLE sales ADD COLUMN seller_name TEXT;`);
      console.log("➡️ Coluna seller_name adicionada em sales");
    }
    if (!names.includes("status")) {
      await db.exec(`ALTER TABLE sales ADD COLUMN status TEXT;`);
      console.log("➡️ Coluna status adicionada em sales");
    }
    if (!names.includes("delivered_products")) {
      await db.exec(`ALTER TABLE sales ADD COLUMN delivered_products TEXT;`);
      console.log("➡️ Coluna delivered_products adicionada em sales");
    }
  } catch (err) {
    console.warn("⚠️ Erro ao garantir colunas em sales (pode já existir):", err.message || err);
  } finally {
    await db.close();
  }
}

// inicializa schema e garante colunas extras se necessário
(async () => {
  const db = await openDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      store_id INTEGER,
      created_by TEXT,
      customer_id TEXT,
      total REAL,
      discount REAL,
      payment_method TEXT,
      internal_use INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT,
      product_id INTEGER,
      qty INTEGER,
      unit_price REAL,
      cost_at_sale REAL,
      FOREIGN KEY (sale_id) REFERENCES sales(id)
    );
  `);

  await db.close();
  await ensureColumns();
})();

// ---------------------------
// POST /  -> Criar venda
// ---------------------------
router.post("/", verifyToken, async (req, res) => {
  try {
    const data = req.body;
    const db = await openDb();

    // valida itens
    if (!Array.isArray(data.items) || data.items.length === 0) {
      await db.close();
      return res.status(400).json({ error: "Nenhum item recebido na venda." });
    }

    const saleId = randomUUID();
    const createdAtSP = moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss");

    // determina seller_id e owner_id pelo token
    const seller_id = req.user?.id || null;
    // se for proprietario, o owner_id = próprio id; se for vendedor, owner_id vem do token
    let owner_id = null;
    if (req.user?.role === "proprietario") owner_id = req.user.id;
    else owner_id = req.user?.owner_id ?? null;

    // fallback para seller_name
    const seller_name = data.seller_name || req.user?.username || data.created_by || "Sem nome";

    // insere venda com seller_id e owner_id
    // regra: determina status baseado no método
    const metodo = (data.payment_method || "").toLowerCase();

    const statusVenda =
      ["pendente", "interno", "uso interno"].includes(metodo)
        ? "nao_pago"
        : "pago";

    await db.run(
      `INSERT INTO sales (
          id, store_id, created_by, total, discount, payment_method, internal_use, created_at,
          seller_name, seller_id, owner_id, status, delivered_products
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        saleId,
        data.store_id || 1,
        data.created_by || (req.user?.username ?? "desconhecido"),
        data.total || 0,
        data.discount || 0,
        data.payment_method || "pendente",
        data.internal_use ? 1 : 0,
        createdAtSP,
        seller_name,
        seller_id,
        owner_id,
        statusVenda, // ← agora está correto!
        data.delivered_products ? JSON.stringify(data.delivered_products) : null,
      ]
    );

    // insere itens
    for (const item of data.items) {
      await db.run(
        `INSERT INTO sale_items (id, sale_id, product_id, qty, unit_price, cost_at_sale)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [randomUUID(), saleId, item.product_id, item.qty, item.unit_price, item.cost_at_sale || 0]
      );

      // atualiza estoque (se existir)
      await db.run(
        `UPDATE products SET stock = MAX(stock - ?, 0) WHERE id = ?`,
        [item.qty, item.product_id]
      );
    }

    await db.close();
    return res.json({ success: true, sale_id: saleId });
  } catch (err) {
    console.error("❌ Erro ao registrar venda:", err);
    return res.status(500).json({ error: "Erro ao registrar venda" });
  }
});

// ---------------------------
// GET /  -> Listar vendas (filtradas por role/owner)
// ---------------------------
router.get("/", verifyToken, async (req, res) => {
  try {
    const db = await openDb();
    let sales = [];

    if (req.user.role === "host") {
      // host não vê vendas (se quiser alterar, troque aqui)
      sales = [];
    } else if (req.user.role === "proprietario") {
      // Proprietário vê todas as vendas do owner (owner_id = proprietario.id)
      sales = await db.all(
        `SELECT * FROM sales WHERE owner_id = ? ORDER BY created_at DESC`,
        [req.user.id]
      );
    } else if (req.user.role === "vendedor") {
      // Vendedor vê as vendas do mesmo proprietário (owner_id do vendedor)
      const oid = req.user.owner_id;
      if (oid == null) {
        sales = []; // segurança: se vendedor não tem owner_id cadastrado
      } else {
        sales = await db.all(
          `SELECT * FROM sales WHERE owner_id = ? ORDER BY created_at DESC`,
          [oid]
        );
      }
    }

    // anexa itens a cada venda
    for (const sale of sales) {
      const items = await db.all(
        `SELECT si.*, p.name AS product_name
         FROM sale_items si
         LEFT JOIN products p ON p.id = si.product_id
         WHERE sale_id = ?`,
        [sale.id]
      );
      sale.items = items;
    }

    await db.close();
    res.json(sales);
  } catch (err) {
    console.error("❌ Erro ao listar vendas:", err);
    res.status(500).json({ error: "Erro ao listar vendas" });
  }
});

// ---------------------------
// GET /:id/items -> itens da venda
// ---------------------------
router.get("/:id/items", verifyToken, async (req, res) => {
  try {
    const db = await openDb();
    const { id } = req.params;
    const items = await db.all(
      `SELECT si.*, p.name
       FROM sale_items si
       LEFT JOIN products p ON p.id = si.product_id
       WHERE si.sale_id = ?`,
      [id]
    );
    await db.close();
    res.json(items);
  } catch (err) {
    console.error("❌ Erro ao buscar itens da venda:", err);
    res.status(500).json({ error: "Erro ao buscar itens da venda" });
  }
});

// ---------------------------
// PUT /sales/:id/cancel  -> cancelar venda + devolver estoque
// ---------------------------
router.put("/:id/cancel", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const db = await openDb();

    // busca venda
    const sale = await db.get(`SELECT * FROM sales WHERE id = ?`, [id]);

    if (!sale) {
      await db.close();
      return res.status(404).json({ error: "Venda não encontrada" });
    }

    // regras de permissão
    if (user.role === "proprietario") {
      if (sale.owner_id !== user.id) {
        await db.close();
        return res.status(403).json({ error: "Esta venda não pertence a você." });
      }
    } 
    
    if (user.role === "vendedor") {
      if (sale.owner_id !== user.owner_id) {
        await db.close();
        return res.status(403).json({ error: "Acesso negado (owner diferente)." });
      }
      if (sale.seller_id !== user.id) {
        await db.close();
        return res.status(403).json({ error: "Você não pode cancelar venda de outro vendedor." });
      }
    }

    // já cancelada?
    if (sale.status === "cancelado") {
      await db.close();
      return res.json({ success: true, message: "Venda já estava cancelada." });
    }

    // busca itens
    const items = await db.all(
      `SELECT * FROM sale_items WHERE sale_id = ?`,
      [id]
    );

    // devolve estoque item a item
    for (const item of items) {
      await db.run(
        `UPDATE products SET stock = stock + ? WHERE id = ?`,
        [item.qty, item.product_id]
      );
    }

    // marca venda como cancelada
    await db.run(
      `UPDATE sales SET status = 'cancelado' WHERE id = ?`,
      [id]
    );

    await db.close();
    return res.json({
      success: true,
      message: "Venda cancelada e estoque devolvido.",
      restored_items: items.length
    });

  } catch (err) {
    console.error("❌ Erro ao cancelar venda:", err);
    return res.status(500).json({ error: "Erro inesperado ao cancelar venda" });
  }
});


// ---------------------------
// outros endpoints (atualizar status, delivered-products) com verifyToken
// ---------------------------
router.put("/:id/delivered-products", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { delivered_products } = req.body;
  try {
    const db = await openDb();
    await db.run(
      `UPDATE sales SET delivered_products = ? WHERE id = ?`,
      [JSON.stringify(delivered_products || {}), id]
    );
    await db.close();
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao salvar produtos entregues:", err);
    res.status(500).json({ error: "Erro ao salvar produtos entregues" });
  }
});

router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method, status } = req.body;
    const db = await openDb();
    const newStatus = status ?? null;

    await db.run(
      `UPDATE sales SET payment_method = ?, status = COALESCE(?, status) WHERE id = ?`,
      [payment_method, newStatus, id]
    );

    await db.close();
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao atualizar pagamento:", err);
    res.status(500).json({ error: "Erro ao atualizar pagamento" });
  }
});

router.get("/stats/summary", verifyToken, async (req, res) => {
  try {
    const db = await openDb();

    const ownerId = req.user.role === "proprietario" ? req.user.id : req.user.owner_id;

    const hoje = moment().tz("America/Sao_Paulo").startOf('day').format("YYYY-MM-DD HH:mm:ss");
    const semana = moment().tz("America/Sao_Paulo").subtract(7, "days").format("YYYY-MM-DD HH:mm:ss");

    const stats = {
      hojeQtd: 0,
      semanaQtd: 0,
      hojeValor: 0,
      semanaValor: 0
    };

    // Quantidade hoje
    const hojeRows = await db.get(
      `SELECT COUNT(*) AS qtd, SUM(total) AS valor
      FROM sales     
      WHERE owner_id = ?
        AND created_at >= ?
        AND status = 'pago'
        AND internal_use = 0
        AND payment_method IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito')`,
      [ownerId, hoje]
    );

    const semanaRows = await db.get(
      `SELECT COUNT(*) AS qtd, SUM(total) AS valor
      FROM sales     
      WHERE owner_id = ?
        AND created_at >= ?
        AND status = 'pago'
        AND internal_use = 0
        AND payment_method IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito')`,
      [ownerId, semana]
    );

    stats.hojeQtd = hojeRows.qtd || 0;
    stats.hojeValor = (hojeRows.valor || 0).toFixed(2);

    stats.semanaQtd = semanaRows.qtd || 0;
    stats.semanaValor = (semanaRows.valor || 0).toFixed(2);

    await db.close();
    res.json(stats);

  } catch (err) {
    console.error("Erro ao buscar stats", err);
    res.status(500).json({ error: "Erro ao buscar estatísticas" });
  }
});

export default router;
