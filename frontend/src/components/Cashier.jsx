// frontend/src/components/Cashier.jsx
import React, { useState, useEffect, useCallback } from "react";
import * as api from "../api";
import { saveOfflineSale } from "../indexeddb";
import ProductSale from "./ProductSale";
import PoolSale from "./PoolSale";

export default function Cashier({ user }) {
  const [view, setView] = useState("home");
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("dinheiro");
  const [cashGiven, setCashGiven] = useState("");
  const [savingSale, setSavingSale] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountType, setDiscountType] = useState(null); // "valor" ou "percent"
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountValue, setDiscountValue] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [observation, setObservation] = useState("");
  const [horaSP, setHoraSP] = useState("");

  const token = localStorage.getItem("token");

  const fetchProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const res = await api.getProducts();
      setProducts(res || []);
    } catch {
      setMessage("⚠️ Erro ao carregar produtos (offline?)");
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // 🔄 Carrega produtos automaticamente ao entrar na tela de produtos
useEffect(() => {
  if (view === "product") {
    fetchProducts();
  }
}, [view, fetchProducts]);

  // ⏰ Atualiza hora de São Paulo
  useEffect(() => {
    const atualizarHora = () => {
      const agora = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
      setHoraSP(agora);
    };
    atualizarHora();
    const timer = setInterval(atualizarHora, 1000);
    return () => clearInterval(timer);
  }, []);

  // 🧭 Atalhos de navegação e eventos de teclado
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "F1") {
        e.preventDefault();
        setView("product");
      } else if (e.key === "F2") {
        e.preventDefault();
        setView("pool");
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (paymentOpen) setPaymentOpen(false);
        else cancelSale();
      } else if (e.key === "F4" && paymentOpen) {
        e.preventDefault();
        if (!savingSale) handleConfirmPayment(); // ✅ evita clique duplo
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // ✅ sem dependências que causem múltiplos listeners
  }, [paymentOpen, savingSale]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function addToCart(prod) {
    setCart((prevCart) => {
      const existing = prevCart.find((c) => c.id === prod.id);
      if (existing) {
        // Atualiza a quantidade apenas 1x
        return prevCart.map((c) =>
          c.id === prod.id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      // Adiciona novo produto ao carrinho
      return [...prevCart, { ...prod, qty: 1 }];
    });

    // Apenas limpa busca, não recarrega produtos (isso causava o bug)
    setSearch("");
  }

  function changeQty(id, newQty) {
    if (newQty <= 0) {
      setCart(cart.filter((c) => c.id !== id));
    } else {
      setCart(cart.map((c) => (c.id === id ? { ...c, qty: newQty } : c)));
    }
  }

  function removeFromCart(id) {
    setCart(cart.filter((c) => c.id !== id));
  }

  const total = cart.reduce((s, p) => s + Number(p.sale_price || 0) * p.qty, 0);

  function openPayment(method = "dinheiro") {
    if (cart.length === 0) {
      setMessage("⚠️ Adicione ao menos 1 produto ao carrinho.");
      setTimeout(() => setMessage(""), 2500);
      return;
    }

    setShowDiscount(false);
    setDiscountType(null);
    setDiscountAmount("");
    setDiscountValue(0);
    setCustomerName("");
    setPaymentMethod(method);
    setCashGiven("");
    setPaymentOpen(true);
  }

  // ✅ Notificação global e retorno à home ajustado
    async function handleConfirmPayment() {
    if (savingSale) return;
    setSavingSale(true);

    const items = cart.map((p) => ({
      product_id: p.id,
      qty: p.qty,
      unit_price: Number(p.sale_price || 0),
      cost_at_sale: 0, // adiciona o campo esperado pelo backend
    }));

    const payload = {
      store_id: 1,
      created_by: user?.username || "vendedor",
      seller_name: user?.username || "vendedor",
      items,
      total: Number(total - discountValue),
      discount: discountValue,
      payment_method: paymentMethod,
    };

    // Campos adicionais
    if (paymentMethod === "interno") {
      payload.internal_use = 1;
      payload.created_by = user?.username || "vendedor"; // mantém o vendedor logado
      if (observation.trim()) payload.observation = observation.trim();
    }

    if (paymentMethod === "pendente") {
      payload.payment_method = "pendente";
      payload.created_by = customerName.trim();
    }

    if (paymentMethod === "dinheiro") {
      payload.paid_amount = Number((cashGiven + "").replace(",", ".") || 0);
    }

    try {
      console.log("🧾 Itens enviados para o servidor:", payload.items);
      await api.createSale(payload);

      await fetchProducts(); // 🔄 Atualiza estoque visível
      setMessage("✅ Venda registrada com sucesso!");
      setCart([]);
      setPaymentOpen(false);
      setView("home");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
        console.error("Resposta do servidor:", err?.response || err?.message || err);
        console.error("Erro ao salvar venda:", err);
      await saveOfflineSale(payload);
      setMessage("💾 Venda salva offline!");
      setCart([]);
      setPaymentOpen(false);
      setView("home");
      setTimeout(() => setMessage(""), 3500);
    } finally {
      setSavingSale(false);
    }
  }

  
  function cancelSale() {
    setCart([]);
    setPaymentOpen(false);
    setView("home");
  }

  if (view === "home") {
    return (
      <div className="max-w-4xl mx-auto p-10 text-center relative">

        <h2 className="text-4xl font-bold text-blue-700 dark:text-blue-300 mb-10 drop-shadow">
          💼 Caixa
        </h2>

        <div className="flex justify-center gap-8">

          <button
            onClick={() => setView("product")}
            className="flex-1 max-w-[280px] bg-gradient-to-br from-blue-600 to-blue-700 
            hover:from-blue-700 hover:to-blue-800 text-white py-10 rounded-2xl 
            text-2xl font-semibold shadow-xl transition transform hover:scale-105"
          >
            🧾 Vender Produtos  
            <div className="text-sm mt-1 opacity-80">(F1)</div>
          </button>

          <button
            onClick={() => setView("pool")}
            className="flex-1 max-w-[280px] bg-gradient-to-br from-cyan-600 to-cyan-700 
            hover:from-cyan-700 hover:to-cyan-800 text-white py-10 rounded-2xl 
            text-2xl font-semibold shadow-xl transition transform hover:scale-105"
          >
            🏊 Vender Piscina  
            <div className="text-sm mt-1 opacity-80">(F2)</div>
          </button>

        </div>

        {/* Mensagem flutuante */}
        {message && (
          <div className="fixed bottom-6 right-6 bg-white/90 dark:bg-gray-800
            px-4 py-3 rounded-xl shadow-xl border-l-4 border-blue-500 
            animate-fade-in-out text-gray-800 dark:text-gray-200 font-medium">
            {message}
          </div>
        )}
      </div>
    );
  }
  
  if (view === "pool") {
  return <PoolSale onBack={() => setView("home")} />;
}

  // === Tela de produtos ===
return (
  <div className="max-w-6xl mx-auto p-6 flex flex-col h-[90vh]">
    {/* 🕒 Relógio no canto superior direito */}
    <div className="absolute top-4 right-6 text-sm text-gray-600 bg-white/70 px-3 py-1 rounded-lg shadow">
      🕒 {horaSP}
    </div>

    <div className="flex justify-between items-center mb-4">
      <h2 className="text-3xl font-bold text-blue-700 dark:text-blue-300 drop-shadow">
        🧾 Vender Produtos
      </h2>
      <button
        onClick={() => fetchProducts()}
        className="bg-blue-600 text-white px-3 py-2 rounded"
      >
        Atualizar
      </button>
    </div>

    {/* Busca */}
    <div className="mb-4 flex gap-3">
      <input
        placeholder="Buscar produto..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="flex-1 border rounded p-2"
      />
    </div>

    <div className="grid grid-cols-3 gap-4 flex-grow overflow-hidden">
      {/* Produtos */}
      <div className="col-span-2 bg-white p-4 rounded shadow overflow-y-auto">
        <h3 className="font-semibold mb-2">Produtos</h3>
        {loadingProducts ? (
          <p>Carregando produtos...</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="relative border border-gray-200 dark:border-gray-700 rounded-xl p-4 
                hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer shadow-sm transition"
                onClick={() => addToCart(p)}
              >
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-gray-600">
                  R$ {Number(p.sale_price || 0).toFixed(2)}
                </div>

                {/* 👇 Mostra o estoque no canto inferior direito */}
                <div
                  className={`absolute bottom-2 right-2 text-xs ${
                    (p.stock ?? 0) <= 2 ? "text-red-500 font-semibold" : "text-gray-500"
                  }`}
                >
                  🧮 {p.stock ?? 0} em estoque
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Carrinho */}
      <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-lg 
      rounded-2xl shadow-xl flex flex-col h-[70vh] border border-white/30 dark:border-gray-700">

        {/* Cabeçalho fixo */}
        <div className="border-b pb-2 bg-white sticky top-0 z-10">
          <h3 className="font-semibold text-lg">Carrinho</h3>
        </div>

        {/* Lista de produtos rolável */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-sm mt-2">
              Carrinho vazio. Clique em um produto para adicionar.
            </p>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b pb-2"
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
                      className="px-2 py-1 border rounded"
                    >
                      -
                    </button>
                    <div className="px-3">{item.qty}</div>
                    <button
                      onClick={() => changeQty(item.id, item.qty + 1)}
                      className="px-2 py-1 border rounded"
                    >
                      +
                    </button>
                    <div className="w-20 text-right">
                      R$ {(item.qty * Number(item.sale_price || 0)).toFixed(2)}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 ml-2"
                      title="Remover"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé fixo com total e botões */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white/90 
        dark:bg-gray-900/70 backdrop-blur-md sticky bottom-0 z-20 rounded-b-2xl">
          <div className="flex justify-between text-lg font-semibold mb-3">
            <span>Total:</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => cancelSale()}
              className="flex-1 bg-gray-300 text-gray-800 py-2 rounded"
            >
              Cancelar (ESC)
            </button>
            <button
              onClick={() => openPayment('dinheiro')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded"
            >
              Finalizar (F4)
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Modal de pagamento */}
    {paymentOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white/90 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl 
        p-8 w-[720px] shadow-2xl border border-white/30 dark:border-gray-700">
          <h3 className="text-xl font-semibold mb-6 text-center text-gray-800">
            Pagamento
          </h3>

          {/* Métodos de pagamento */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              ["dinheiro", "💵 Dinheiro"],
              ["pix", "⚡ Pix"],
              ["credito", "💳 Crédito"],
              ["debito", "💳 Débito"],
              ["pendente", "⏳ Pendente"],
              ["interno", "🏢 Uso Interno"],
            ].map(([key, label]) => (
              <label
                key={key}
                onClick={() => setPaymentMethod(key)}
                className={`cursor-pointer text-center border rounded-lg py-3 font-medium transition ${
                  paymentMethod === key
                    ? "bg-blue-100 border-blue-400 text-blue-700"
                    : "hover:bg-gray-50"
                }`}
              >
                {label}
              </label>
            ))}
          </div>

          {/* Valor total e desconto */}
          <div className="mb-4 text-center relative">
            <div className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
              {discountValue > 0 && (
                <span className="text-gray-400 text-2xl line-through">
                  R$ {total.toFixed(2)}
                </span>
              )}
              <span>R$ {(total - discountValue).toFixed(2)}</span>
            </div>

            {/* Botão para abrir campos de desconto */}
            <button
              onClick={() => setShowDiscount((prev) => !prev)}
              className="text-gray-500 hover:text-gray-700 mt-2 transition"
              title="Aplicar desconto"
            >
              {showDiscount ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m18 15-6-6-6 6"></path>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6"></path>
                </svg>
              )}
            </button>

            {/* Campos de desconto */}
            {showDiscount && (
              <div className="mt-3 border-t pt-3 flex flex-col items-center">
                <div className="flex gap-3 justify-center">
                  {/* Desconto em R$ */}
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">
                      Desconto (R$)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={discountType === "valor" ? discountAmount : ""}
                      disabled={discountType === "percent" && discountValue > 0}
                      onChange={(e) => {
                        const v = Math.max(0, Number(e.target.value) || 0);
                        if (v === 0) {
                          setDiscountType(null);
                          setDiscountAmount("");
                          setDiscountValue(0);
                          return;
                        }
                        setDiscountType("valor");
                        setDiscountAmount(v);
                        setDiscountValue(v);
                      }}
                      className="border rounded p-1 w-28 text-center"
                      placeholder="Ex: 10.00"
                    />
                  </div>

                  {/* Desconto em % */}
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">
                      Desconto (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={discountType === "percent" ? discountAmount : ""}
                      disabled={discountType === "valor" && discountValue > 0}
                      onChange={(e) => {
                        const v = Math.max(0, Number(e.target.value) || 0);
                        if (v === 0) {
                          setDiscountType(null);
                          setDiscountAmount("");
                          setDiscountValue(0);
                          return;
                        }
                        setDiscountType("percent");
                        setDiscountAmount(v);
                        const desconto = (total * v) / 100;
                        setDiscountValue(desconto);
                      }}
                      className="border rounded p-1 w-28 text-center"
                      placeholder="Ex: 10"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Campo Nome (pendente ou interno) */}
          {(paymentMethod === "pendente" || paymentMethod === "interno") && (
            <div className="mt-4 border-t pt-4">
              <label className="block text-sm text-gray-700 mb-1">
                Nome do Cliente <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Digite o nome do cliente"
                className="border rounded p-2 w-full text-center text-lg font-medium"
              />
            </div>
          )}

          {/* Campo Observação (somente para uso interno) */}
          {paymentMethod === "interno" && (
            <div className="mt-3">
              <label className="block text-sm text-gray-700 mb-1">
                Observação
              </label>
              <input
                type="text"
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Digite uma observação (opcional)"
                className="border rounded p-2 w-full text-center text-lg font-medium"
              />
            </div>
          )}

          {/* Campo de dinheiro e troco */}
          {paymentMethod === "dinheiro" && (
            <div className="mt-4 border-t pt-4">
              <label className="block text-sm text-gray-700 mb-1">
                Valor Recebido (R$)
              </label>
              <input
                type="number"
                value={cashGiven}
                onChange={(e) => setCashGiven(e.target.value)}
                placeholder="Ex: 100.00"
                className="border rounded p-2 w-full text-center text-lg font-medium"
              />

              {cashGiven && (
                <div className="mt-2 text-center">
                  {(() => {
                    const troco =
                      Number((cashGiven + "").replace(",", ".")) -
                      (total - discountValue);
                    const trocoColor =
                      troco < 0 ? "text-red-600" : "text-green-700";
                    return (
                      <p className="text-gray-700 font-medium">
                        Troco:{" "}
                        <span className={`${trocoColor} font-semibold`}>
                          R$ {Math.abs(troco).toFixed(2)}
                        </span>
                      </p>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Botões finais */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setPaymentOpen(false)}
              className="px-6 py-2 rounded bg-gray-200 text-gray-700 font-medium"
            >
              Cancelar
            </button>

            <button
              onClick={handleConfirmPayment}
              disabled={
                savingSale ||
                (paymentMethod === "dinheiro" &&
                  Number((cashGiven + "").replace(",", ".") || 0) <
                    total - discountValue) ||
                ((paymentMethod === "pendente" || paymentMethod === "interno") &&
                  !customerName.trim())
              }
              className={`px-6 py-2 rounded font-semibold text-white transition ${
                savingSale
                  ? "bg-gray-400 cursor-not-allowed"
                  : (paymentMethod === "dinheiro" &&
                      Number((cashGiven + "").replace(",", ".") || 0) <
                        total - discountValue) ||
                    ((paymentMethod === "pendente" ||
                      paymentMethod === "interno") &&
                      !customerName.trim())
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {savingSale ? "Salvando..." : "Confirmar Pagamento (F4)"}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Mensagem flutuante */}
    {message && (
      <div className="fixed bottom-6 right-6 bg-white p-3 rounded shadow">
        {message}
      </div>
    )}
  </div>
);
}
