// backend/routes/poolSales.js
import express from "express";
import { randomUUID } from "crypto";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import jwt from "jsonwebtoken"; // ✅ adicionado

const router = express.Router();

const openDb = async () =>
  open({
    filename: "./pvd.sqlite",
    driver: sqlite3.Database,
  });

// 🧱 Garante que a tabela pool_sales existe
// Criar tabela
async function initDb() {
  const db = await openDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS pool_sales (
      id TEXT PRIMARY KEY,
      cliente TEXT,
      cpf TEXT,
      rg TEXT,
      telefone TEXT,
      endereco TEXT,
      numero_casa TEXT,
      referencia TEXT,
      cep TEXT,
      bairro TEXT,
      cidade TEXT,
      produto TEXT,
      marca TEXT,
      garantia_fabrica TEXT,
      garantia_3_meses TEXT,
      garantia_12_meses TEXT,
      produtos_inclusos TEXT,
      obs_incluso TEXT,
      observacoes_pagamento TEXT,
      cor TEXT,
      pastilha TEXT,
      tipo_pastilha TEXT,
      valor_total REAL,
      entrada REAL,
      vendedor TEXT,
      instalador TEXT,
      pagamento TEXT,
      observacoes TEXT,
      prazo_entrega TEXT,
      data_venda TEXT,
      status TEXT DEFAULT 'aguardando',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      delivered_products TEXT,
      owner_id INTEGER
    );
  `);
}
initDb();

// Verifica token
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Token ausente" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "segredo_super_forte");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Token inválido" });
  }
}

// ✅ Criar nova venda de piscina
router.post("/", verifyToken, async (req, res) => {
  try {
    const data = req.body;
    const db = await openDb();
    const id = randomUUID();

    const owner_id =
      req.user.role === "proprietario" ? req.user.id : req.user.owner_id;

    const result = await db.run(
      `INSERT INTO pool_sales (
        id, cliente, cpf, rg, telefone, endereco, numero_casa, referencia, cep, bairro, cidade,
        produto, marca, garantia_fabrica, garantia_3_meses, garantia_12_meses,
        produtos_inclusos, obs_incluso, observacoes_pagamento,
        cor, pastilha, tipo_pastilha,
        valor_total, entrada, vendedor, instalador, pagamento, observacoes,
        prazo_entrega, data_venda, status, owner_id
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        data.cliente,
        data.cpf,
        data.rg,
        data.telefone,
        data.endereco,
        data.numero_casa,
        data.referencia,
        data.cep,
        data.bairro,
        data.cidade,
        data.produto,
        data.marca,
        data.garantia_fabrica,
        data.garantia_3_meses,
        data.garantia_12_meses,
        data.produtos_inclusos || "",
        data.obs_incluso || "",
        data.observacoes_pagamento || "",
        data.cor,
        data.pastilha,
        data.tipo_pastilha,
        data.valor_total,
        data.entrada,
        data.vendedor,
        data.instalador || "",
        data.pagamento,
        data.observacoes,
        data.prazo_entrega,
        data.data_venda,
        data.status || "aguardando",
        owner_id
      ]
    );

    console.log("🟢 INSERT executado. Linhas inseridas:", result.changes);

    res.json({ success: true, id });

  } catch (err) {
    console.error("❌ ERRO NO POST /pool-sales:", err);
    res.status(500).json({ error: err.message });
  }
});


// ✅ Listar todas as vendas de piscinas (filtrado por role)
router.get("/", verifyToken, async (req, res) => {
  try {
    const db = await openDb();

    let rows = [];

    if (req.user.role === "proprietario") {
      rows = await db.all("SELECT * FROM pool_sales WHERE owner_id = ? ORDER BY created_at DESC", [
        req.user.id,
      ]);
    } else if (req.user.role === "vendedor") {
      rows = await db.all("SELECT * FROM pool_sales WHERE owner_id = ? ORDER BY created_at DESC", [
        req.user.owner_id,
      ]);
    } else {
      rows = await db.all("SELECT * FROM pool_sales ORDER BY created_at DESC");
    }

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Erro ao listar vendas" });
  }
});

// ✅ Atualizar status
router.put("/:id/status", verifyToken, async (req, res) => {
  console.log("🔵 PUT /pool-sales/:id RECEBIDO");
  console.log("➡️  ID recebido:", req.params.id);
  console.log("➡️  Payload recebido:", req.body);

  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = await openDb();
    await db.run(`UPDATE pool_sales SET status = ? WHERE id = ?`, [status, id]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao atualizar status:", err);
    res.status(500).json({ error: "Erro ao atualizar status" });
  }
});

// ✅ Cancelar venda
router.put("/:id/cancel", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await openDb();
    const result = await db.run(
      `UPDATE pool_sales SET status = 'cancelado' WHERE id = ?`,
      [id]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: "Venda não encontrada." });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao cancelar venda:", err);
    res.status(500).json({ error: "Erro ao cancelar venda de piscina" });
  }
});

// Atualizar venda
router.put("/:id", verifyToken, async (req, res) => {
  console.log("\n🔵 PUT /pool-sales/" + req.params.id + " RECEBIDO");
  console.log("➡️ ID recebido:", req.params.id);
  console.log("➡️ Payload recebido:", req.body);
  try {
    const data = req.body;
    const db = await openDb();

    await db.run(
      `UPDATE pool_sales SET
         cliente = ?,
         cpf = ?,
         rg = ?,
         telefone = ?,
         endereco = ?,
         numero_casa = ?,
         referencia = ?,
         cep = ?,
         bairro = ?,
         cidade = ?,
         produto = ?,
         marca = ?,
         garantia_fabrica = ?,
         garantia_3_meses = ?,
         garantia_12_meses = ?,
         produtos_inclusos = ?,
         obs_incluso = ?,
         observacoes_pagamento = ?,
         cor = ?,
         pastilha = ?,
         tipo_pastilha = ?,
         valor_total = ?,
         entrada = ?,
         vendedor = ?,
         instalador = ?,
         pagamento = ?,
         observacoes = ?,
         prazo_entrega = ?,
         data_venda = ?,
         status = ?
       WHERE id = ?`,
      [
        data.cliente,
        data.cpf,
        data.rg,
        data.telefone,
        data.endereco,
        data.numero_casa,
        data.referencia,
        data.cep,
        data.bairro,
        data.cidade,
        data.produto,
        data.marca,
        data.garantia_fabrica,
        data.garantia_3_meses,
        data.garantia_12_meses,
        data.produtos_inclusos,
        data.obs_incluso,
        data.observacoes_pagamento,
        data.cor,
        data.pastilha,
        data.tipo_pastilha,
        data.valor_total,
        data.entrada,
        data.vendedor,
        data.instalador,
        data.pagamento,
        data.observacoes,
        data.prazo_entrega,
        data.data_venda,
        data.status,
        req.params.id
      ]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("❌ ERRO NO UPDATE:", err);
    res.status(500).json({ error: "Erro ao atualizar venda" });
  }
});

router.get("/debug/all", async (req, res) => {
  const db = await openDb();
  const rows = await db.all("SELECT id, cliente FROM pool_sales");
  console.log("📘 DEBUG — IDS no banco:", rows);
  res.json(rows);
});

// ==========================
//   ESTATÍSTICAS PISCINAS
// ==========================

    router.get("/stats/summary", verifyToken, async (req, res) => {
      try {
        const db = await openDb();

        // 🧠 Determina owner_id dependendo do tipo de usuário
        const owner_id =
          req.user.role === "proprietario"
            ? req.user.id
            : req.user.owner_id;

        // Hoje
        const hojeQtd = await db.get(
          `SELECT COUNT(*) as total FROM pool_sales 
          WHERE DATE(data_venda) = DATE('now','localtime') 
          AND status != 'cancelado'
          AND owner_id = ?`,
          [owner_id]
        );

        const hojeValor = await db.get(
          `SELECT COALESCE(SUM(entrada), 0) AS total 
          FROM pool_sales 
          WHERE DATE(data_venda) = DATE('now','localtime')
          AND status != 'cancelado'
          AND owner_id = ?`,
          [owner_id]
        );

        // Semana
        const semanaQtd = await db.get(
          `SELECT COUNT(*) as total FROM pool_sales 
            WHERE DATE(data_venda) >= DATE('now','-7 days','localtime')
            AND status != 'cancelado'
            AND owner_id = ?`,
          [owner_id]
        );

        const semanaValor = await db.get(
          `SELECT COALESCE(SUM(entrada), 0) AS total 
            FROM pool_sales 
            WHERE DATE(data_venda) >= DATE('now','-7 days','localtime')
            AND status != 'cancelado'
            AND owner_id = ?`,
          [owner_id]
        );

        return res.json({
          hojeQtd: hojeQtd.total,
          semanaQtd: semanaQtd.total,
          hojeValor: hojeValor.total.toFixed(2),
          semanaValor: semanaValor.total.toFixed(2)
        });

      } catch (err) {
        console.error("Erro ao gerar estatísticas de piscinas:", err);
        return res.status(500).json({ error: "Erro interno" });
      }
    });

    // ✅ Buscar venda específica pelo ID
    router.get("/:id", verifyToken, async (req, res) => {
      console.log("\n🔍 GET /pool-sales/" + req.params.id);
      console.log("📌 ID recebido pelo backend:", req.params.id);
      console.log("📌 Tamanho:", req.params.id.length);
      try {
        const db = await openDb();
        const row = await db.get("SELECT * FROM pool_sales WHERE id = ?", [req.params.id]);
        console.log("📦 Resultado do SELECT:", row);

        if (!row) {
          console.log("❌ NENHUMA VENDA ENCONTRADA COM ESTE ID");
          return res.status(404).json({ error: "Venda não encontrada" });
        }

        res.json(row);
      } catch (err) {
        res.status(500).json({ error: "Erro ao buscar venda" });
      }
    });

export default router;
