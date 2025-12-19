import React, { useState, useEffect, useCallback } from "react";
import * as api from "../api";
import { saveOfflineSale } from "../indexeddb";
import PaymentModal from "./PaymentModal";

export default function ProductSale({ onClose }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.getProducts();
      setProducts(res || []);
    } catch (err) {
      setMessage("⚠️ Erro ao carregar produtos.");
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const addToCart = (prod) => {
    const existing = cart.find((p) => p.id === prod.id);
    if (existing) {
      setCart(cart.map((p) => (p.id === prod.id ? { ...p, qty: p.qty + 1 } : p)));
    } else {
      setCart([...cart, { ...prod, qty: 1 }]);
    }
  };

  const changeQty = (id, qty) => {
    if (qty <= 0) setCart(cart.filter((p) => p.id !== id));
    else setCart(cart.map((p) => (p.id === id ? { ...p, qty } : p)));
  };

  const total = cart.reduce((s, p) => s + (p.sale_price || 0) * p.qty, 0);

  const handleConfirmPayment = async (method, cashGiven) => {
    // 🚫 Verifica se há algum produto sem estoque suficiente
    for (const item of cart) {
      const product = products.find(p => p.id === item.id);
      if (!product) continue;

      if (product.stock < item.qty) {
        setMessage(`⚠️ O produto "${product.name}" possui apenas ${product.stock} em estoque.`);
        setPaymentOpen(false);
        return;
      }
    }

    const payload = {
      items: cart.map((p) => ({
        product_id: p.id,
        qty: p.qty,
        unit_price: p.sale_price, // ✅ backend espera "unit_price"
      })),
      total,
      payment_method: method,
    };

    if (method === "interno") payload.internal_use = 1;
    if (method === "dinheiro") payload.paid_amount = cashGiven;
    if (method === "pendente") payload.payment_method = "pendente";

    try {
      const res = await fetch("http://localhost:5000/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Falha no envio");

      const data = await res.json();

      // 🧮 Atualiza o estoque local com o retorno do servidor
      if (data.updatedProducts) {
        setProducts(prev =>
          prev.map(p => {
            const updated = data.updatedProducts.find(u => u.id === p.id);
            return updated ? { ...p, stock: updated.stock } : p;
          })
        );
      }

      setMessage("✅ Venda registrada com sucesso!");
      setCart([]);
      setPaymentOpen(false);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      console.error("❌ Erro ao registrar venda:", err);
      await saveOfflineSale(payload);
      setMessage("💾 Venda salva offline!");
      setCart([]);
      setPaymentOpen(false);
      setTimeout(() => onClose(), 1500);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6 bg-blue-600 text-white p-5 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          🛒 Venda de Produtos
        </h2>

        <button
          onClick={onClose}
          className="px-5 py-2 bg-white/20 hover:bg-white/30 active:bg-white/40 
                    text-white rounded-xl transition shadow-sm hover:shadow-md"
        >
          Voltar
        </button>
      </div>

      <div className="flex mb-4 gap-3">
        <input
          placeholder="🔍 Buscar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border-2 border-gray-300 rounded-xl p-3 shadow-sm 
                    focus:border-blue-600 transition"
          />

        <button
          onClick={() => setPaymentOpen(true)}
          disabled={cart.length === 0}
          className={`px-5 py-2 rounded-xl text-white font-medium shadow-md transition 
                      transform hover:scale-[1.03] ${
                        cart.length 
                          ? "bg-green-600 hover:bg-green-700" 
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
        >
          💳 Finalizar Venda (F4)
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white p-4 rounded shadow max-h-[60vh] overflow-y-auto">
          <h3 className="font-semibold mb-2">Produtos</h3>
          <div className="grid grid-cols-2 gap-3">
            {products
              .filter((p) =>
                p.name.toLowerCase().includes(search.toLowerCase())
              )
              .map((p) => (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="border rounded-xl p-4 shadow-sm bg-white hover:shadow-md 
                            hover:bg-blue-50 cursor-pointer transition-all relative"
                >
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-gray-600">
                    R$ {Number(p.sale_price || 0).toFixed(2)}
                  </div>

                  {/* 👇 Mostra o estoque no canto inferior direito */}
                  <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                    🧮 {p.stock ?? 0} em estoque
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow max-h-[60vh] overflow-y-auto">
          <h3 className="font-semibold mb-2">Carrinho</h3>
          {cart.length === 0 ? (
            <p className="text-gray-500">Nenhum produto adicionado.</p>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center border-b py-3 hover:bg-gray-50 
                            rounded-xl transition-all px-2"
              >
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-600">
                    R$ {Number(item.sale_price || 0).toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changeQty(item.id, item.qty - 1)}
                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-xl shadow-sm transition"
                  >
                    -
                  </button>
                  <div>{item.qty}</div>
                  <button
                    onClick={() => changeQty(item.id, item.qty + 1)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition"
                  >
                    +
                  </button>
                  <span className="w-20 text-right">
                    R$ {(item.qty * item.sale_price).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}

          <div className="mt-4 flex justify-between items-center bg-blue-50 p-3 rounded-xl shadow-inner">
            <strong className="text-blue-700">Total:</strong>
            <span className="text-lg font-bold text-blue-700">R$ {total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {paymentOpen && (
        <PaymentModal
          total={total}
          onCancel={() => setPaymentOpen(false)}
          onConfirm={handleConfirmPayment}
        />
      )}

      {message && (
        <div className="fixed bottom-6 right-6 bg-blue-600 text-white px-5 py-3 rounded-xl 
                shadow-xl animate-slide-up font-medium">
          {message}
        </div>
      )}
    </div>
  );
}
