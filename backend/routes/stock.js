import express from 'express';
import db from '../db.js';


const router = express.Router();


// Registrar movimento de estoque
router.post('/movement', async (req, res) => {
const { product_id, qty, type, reason, performed_by } = req.body;
try {
await db.run(
`INSERT INTO stock_movements (product_id, qty, type, reason, performed_by)
VALUES (?, ?, ?, ?, ?)`,
[product_id, qty, type, reason, performed_by]
);


// Atualiza estoque
const mult = type === 'IN' ? 1 : -1;
await db.run(`UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?`, [qty * mult, product_id]);


res.json({ message: 'Movimento registrado com sucesso' });
} catch (err) {
console.error(err);
res.status(500).json({ message: 'Erro ao registrar movimento de estoque' });
}
});


export default router;