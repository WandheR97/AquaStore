// frontend/src/pages/Sales.jsx — PARTE 1/3
import React, { useEffect, useState } from "react";
import * as api from "../api";
import { ChevronDown, ChevronUp, ShoppingBag } from "lucide-react";
import PoolSale from "../components/PoolSale";
import DeliveredProducts from "../components/DeliveredProducts";
import SaleDetailsModal from "../components/SaleDetailsModal";
import ModalPortal from "../components/ModalPortal";
import PoolSaleCreate from "../components/PoolSaleCreate";

export default function Sales() {
  // ---------- states ----------
  const [sales, setSales] = useState([]);
  const [poolSales, setPoolSales] = useState([]);
  const [filter, setFilter] = useState("todas");
  const [expanded, setExpanded] = useState(null);
  const [activeTab, setActiveTab] = useState("produtos");
  const [loading, setLoading] = useState(true);
  const [modalPagamento, setModalPagamento] = useState({ open: false, id: null });
  const [editingSale, setEditingSale] = useState(null);
  const [notificacao, setNotificacao] = useState(null);
  const [modalPiscina, setModalPiscina] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [editingPool, setEditingPool] = useState(null);   // controla a edição
  const [creatingPool, setCreatingPool] = useState(false);
  const [returnToPoolId, setReturnToPoolId] = useState(null); // ID da piscina para reabrir depois

  // Global modal confirm state (single modal rendered once)
  const [confirmSale, setConfirmSale] = useState(null); // object { id, type: 'product'|'pool', sale }

  // Stats
  const [statsProdutos, setStatsProdutos] = useState({
    hojeQtd: 0,
    semanaQtd: 0,
    hojeValor: "0.00",
    semanaValor: "0.00",
  });
  const [statsPiscinas, setStatsPiscinas] = useState({
    hojeQtd: 0,
    semanaQtd: 0,
    hojeValor: "0.00",
    semanaValor: "0.00",
  });

  // ---------- helpers ----------
  function getUserRole() {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    try {
      const u = JSON.parse(raw);
      const role =
        u.role ||
        u.user?.role ||
        u.dados?.role ||
        u.data?.role ||
        u.info?.role ||
        null;
      if (!role) return null;
      return role.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    } catch {
      return null;
    }
  }
  const userRole = getUserRole();
  const isOwner = userRole === "proprietario";

  const formatDateTime = (isoDate) => {
    if (!isoDate) return "-";
    try {
      return new Date(isoDate).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour12: false,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (e) {
      console.error("Erro ao formatar data:", e);
      return isoDate;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "aguardando":
        return "border-r-4 border-orange-500";
      case "instalando":
        return "border-r-4 border-cyan-600";   // azul claro
      case "entregue":
        return "border-r-4 border-green-500";
      case "cancelado":
        return "border-r-4 border-red-500";
      default:
        return "border-r-4 border-gray-300";
    }
  };

  // ---------- carga de dados (funções reutilizáveis) ----------
  const loadStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/sales/stats/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setStatsProdutos(data);
    } catch (err) {
      console.error("Erro ao buscar stats:", err);
    }
  };

  const loadPoolStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/pool-sales/stats/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setStatsPiscinas(data);
    } catch (err) {
      console.error("Erro ao buscar stats de piscinas:", err);
    }
  };

  const loadSales = async () => {
    try {
      const salesData = await api.getSales();
      // pega itens de cada venda (mantendo seu comportamento)
      const enrichedSales = await Promise.all(
        salesData.map(async (s) => {
          try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/sales/${s.id}/items`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) return { ...s, items: [] };
            const items = await res.json();
            return { ...s, items };
          } catch {
            return { ...s, items: [] };
          }
        })
      );
      enrichedSales.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setSales(enrichedSales);
    } catch (err) {
      console.error("Erro ao carregar vendas:", err);
      setSales([]);
    }
  };

  const loadPoolSales = async () => {
    try {
      const pools = await api.request("/pool-sales");
      pools.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setPoolSales(pools);
    } catch (err) {
      console.error("Erro ao carregar vendas de piscina:", err);
      setPoolSales([]);
    }
  };

  // ---------- useEffect inicial ----------
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await loadSales();
        await loadPoolSales();
        await loadStats();
        await loadPoolStats();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // frontend/src/pages/Sales.jsx — PARTE 2/3 (Aba PRODUTOS)
  // ---------- filtros ----------
  const filteredSales = sales.filter((s) => {
    if (filter === "todas") {
      return true;
    }
    if (["dinheiro", "pix", "cartao_credito", "cartao_debito"].includes(filter)) {
      return s.payment_method === filter;
    }

    if (filter === "pendente") {
      return s.status === "nao_pago";
    }
    if (filter === "interno") {
      return (
        s.payment_method?.toLowerCase().includes("interno") ||
        s.status === "interno" ||
        s.payment_method === "uso interno"
      );
    }
    return true;
  });

  const toggleExpand = (id) => setExpanded(expanded === id ? null : id);

  // ---------- cancelar venda (usa endpoints existentes) ----------
  const handleCancelSale = async ({ id, type }) => {
    // type: 'product' or 'pool' — backend should handle estoque & stats
    try {
      if (type === "product") {
        await api.request(`/sales/${id}/cancel`, "PUT");
      } else {
        await api.request(`/pool-sales/${id}/cancel`, "PUT");
      }

      // recarrega tudo para garantir contadores corretos
      await loadSales();
      await loadPoolSales();
      await loadStats();
      await loadPoolStats();

      setNotificacao("❌ Venda cancelada com sucesso!");
      setTimeout(() => setNotificacao(null), 3500);
    } catch (err) {
      console.error("Erro ao cancelar venda:", err);
      setNotificacao("❌ Erro ao cancelar a venda.");
      setTimeout(() => setNotificacao(null), 3500);
    } finally {
      setConfirmSale(null);
      document.body.style.overflow = "auto";
    }
  };

  const handleStatusChange = async (id, novoStatus) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`http://localhost:5000/pool-sales/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: novoStatus }),
      });

      if (!res.ok) {
        console.error("Erro ao atualizar status da piscina");
        return;
      }

      await loadPoolSales();
      await loadPoolStats();

    } catch (err) {
      console.error("Erro ao alterar status da piscina:", err);
    }
  };

  // ---------- JSX render (produtos) ----------
  return (
    <>
    {/* ================= MODAL GLOBAL DE CONFIRMAÇÃO ================= */}
        {confirmSale && (
          <ModalPortal>
              <div
                onClick={() => {
                  setConfirmSale(null);
                  document.body.style.overflow = "auto";
                }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              ></div>

              <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-[90%] max-w-md border border-gray-200 animate-fade z-[9999999]">
                <h2 className="text-xl font-bold text-red-700 mb-4">
                  Cancelar Venda?
                </h2>

                <p className="text-gray-700 mb-6">
                  Tem certeza que deseja cancelar a venda?
                  <br />
                  Todos os produtos serão devolvidos ao estoque e o faturamento será ajustado.
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setConfirmSale(null);
                      document.body.style.overflow = "auto";
                    }}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                  >
                    Voltar
                  </button>

                  <button
                    onClick={() => handleCancelSale(confirmSale)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                  >
                    Cancelar Venda
                  </button>
                </div>
              </div>
            </ModalPortal>
          )}

          {modalPagamento.open && (
          <ModalPortal>
           <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => {
                setModalPagamento({ open: false, id: null });
                document.body.style.overflow = "auto";
              }}
            />

            <div className="relative bg-white p-6 rounded-2xl shadow-2xl w-[90%] max-w-sm mx-auto">
              <h2 className="text-xl font-bold text-green-700 mb-4">Registrar Pagamento</h2>

              <p className="text-gray-700 mb-3">Selecione o método de pagamento:</p>

              <div className="flex flex-col gap-3">
                {["dinheiro", "pix", "debito", "credito"].map((metodo) => (
                  <button
                    key={metodo}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem("token");

                        await fetch(`http://localhost:5000/sales/${modalPagamento.id}`, {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({
                            payment_method: metodo,
                            status: ["dinheiro", "pix", "cartao_debito", "cartao_credito"].includes(metodo)
                              ? "pago"
                              : "nao_pago"
                          }),
                        });

                        await loadSales();
                        await loadStats(); // total passa a contar agora
                        setNotificacao("Pagamento registrado com sucesso!");

                        setModalPagamento({ open: false, id: null });
                        document.body.style.overflow = "auto";

                        setTimeout(() => setNotificacao(null), 3000);
                      } catch (err) {
                        console.error("Erro ao registrar pagamento:", err);
                      }
                    }}
                  >
                    {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
                  </button>
                ))}
              </div>

              <button
                className="mt-4 w-full py-2 bg-gray-300 hover:bg-gray-400 rounded-lg"
                onClick={() => {
                  setModalPagamento({ open: false, id: null });
                  document.body.style.overflow = "auto";
                }}
              >
                Cancelar
              </button>
            </div>
          </ModalPortal>
        )}
    

      {/* Notificação flutuante */}
      {notificacao && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-fade-in-out notification-success shadow-2xl px-5 py-3 rounded-xl">
          {notificacao}
        </div>
      )}

      <div className="p-6 max-w-7xl mx-auto animate-fade">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 animate-slide-up">
          <h2 className="text-2xl font-bold flex items-center gap-2">📊 Histórico de Vendas</h2>

          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab("produtos")}
                className={`px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all hover:shadow-lg hover:scale-[1.02] ${activeTab === "produtos" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                🛍️ Produtos
              </button>

              <button
                onClick={() => setActiveTab("piscinas")}
                className={`px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all hover:shadow-lg hover:scale-[1.02] ${activeTab === "piscinas" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                🏊 Piscinas
              </button>
            </div>

            {activeTab === "produtos" && (
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="mt-3 w-48 px-4 py-2 rounded-xl bg-white shadow-md border border-gray-200 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="todas">Todas</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">Pix</option>
                <option value="credito">Crédito</option>
                <option value="debito">Débito</option>
                <option value="pendente">Pendentes</option>
                <option value="interno">Uso Interno</option>
              </select>
            )}
          </div>
        </div>

        {/* CARDS ESTATÍSTICAS (produtos) */}
        {activeTab === "produtos" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
            <div className="bg-white/80 shadow-md rounded-2xl p-4 border border-gray-200 transition-all hover:shadow-lg hover:-translate-y-1 animate-fade-soft">
              <p className="text-gray-500 text-sm">Vendidos Hoje</p>
              <h3 className="text-2xl font-bold text-blue-700">{statsProdutos.hojeQtd}</h3>
            </div>

            <div className="bg-white/80 shadow-md rounded-2xl p-4 border border-gray-200 transition-all hover:shadow-lg hover:-translate-y-1 animate-fade-soft">
              <p className="text-gray-500 text-sm">Vendidos na Semana</p>
              <h3 className="text-2xl font-bold text-cyan-700">{statsProdutos.semanaQtd}</h3>
            </div>

            <div className="bg-white/80 shadow-md rounded-2xl p-4 border border-gray-200 transition-all hover:shadow-lg hover:-translate-y-1 animate-fade-soft">
              <p className="text-gray-500 text-sm">Faturado Hoje</p>
              <h3 className="text-2xl font-bold text-green-700">R$ {statsProdutos.hojeValor}</h3>
            </div>

            <div className="bg-white/80 shadow-md rounded-2xl p-4 border border-gray-200 transition-all hover:shadow-lg hover:-translate-y-1 animate-fade-soft">
              <p className="text-gray-500 text-sm">Faturado na Semana</p>
              <h3 className="text-2xl font-bold text-red-600">R$ {statsProdutos.semanaValor}</h3>
            </div>
          </div>
        )}

        {/* Lista de vendas (produtos) */}
        {loading ? (
          <p className="text-gray-500">Carregando vendas...</p>
        ) : activeTab === "produtos" ? (
          filteredSales.length === 0 ? (
            <p className="text-gray-500">Nenhuma venda registrada.</p>
          ) : (
            <div className="space-y-3">
              {filteredSales.map((s) => (
                <div
                  key={s.id}
                  className="bg-white/70 backdrop-blur-xl border border-gray-200/70 rounded-3xl shadow-lg hover:shadow-2xl transition-all hover:scale-[1.01] hover:bg-white/90"
                >
                  <div
                    className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-100 active:bg-gray-200 transition-all rounded-xl"
                    onClick={() => toggleExpand(s.id)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                      <div className="flex items-center gap-2">
                        <ShoppingBag size={18} className="text-blue-500" />
                        <span className="font-semibold text-gray-800">{formatDateTime(s.created_at)}</span>
                      </div>

                      {expanded !== s.id && s.items?.length > 0 && (
                        <span className="text-sm text-gray-600 truncate max-w-[160px]">
                          {s.items[0].name} x{s.items[0].qty}
                          {s.items.length > 1 && ` +${s.items.length - 1} itens`}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-6">
                      {s.status === "cancelado" && (
                        <span className="text-red-600 font-bold bg-red-100 px-2 py-1 rounded-lg text-sm shadow">
                          ❌ Cancelada
                        </span>
                      )}

                      <div className="text-sm capitalize font-medium text-gray-700">
                        {(() => {
                          const metodo = s.payment_method?.toLowerCase() || "";
                          if (metodo === "pendente") return `Pendente — ${s.created_by || "-"}`;
                          if (["interno", "uso interno"].includes(metodo) || metodo === "uso interno") return `Uso interno — ${s.created_by || "-"}`;
                          return s.payment_method || "—";
                        })()}
                      </div>

                      {(() => {
                          const metodo = (s.payment_method || "").toLowerCase();

                            // 1) USO INTERNO → nunca exibe "aguardando"
                            if (metodo === "interno" || metodo === "uso interno") {
                              return (
                                <div className="text-blue-600 font-medium">
                                  Uso Interno
                                </div>
                              );
                            }

                            // 2) PENDENTE → só mostra aguardando antes de registrar pagamento
                            if (metodo === "pendente" && s.status !== "pago") {
                              return (
                                <div className="text-yellow-600 font-medium">
                                  Aguardando Pagamento
                                </div>
                              );
                            }

                            // 3) PAGOS → exibe valor
                            if (s.status === "pago") {
                              return (
                                <div className="text-green-600 font-semibold">
                                  R$ {Number(s.total || 0).toFixed(2)}
                                </div>
                              );
                            }

                            // fallback (não deve acontecer, mas é seguro)
                            return null;
                        })()}
                      {expanded === s.id ? <ChevronUp className="text-gray-600" /> : <ChevronDown className="text-gray-600" />}
                    </div>
                  </div>

                  {expanded === s.id && (
                    <div className="bg-white/80 border-t border-gray-200 rounded-b-3xl px-6 py-5 shadow-inner backdrop-blur-md">

                    {/* AVISO DE VENDA CANCELADA */}
                    {s.status === "cancelado" && (
                    <div className="bg-red-200 text-red-800 font-semibold text-center py-2 rounded-xl mb-4 shadow">
                      ❌ ESTA VENDA FOI CANCELADA
                    </div>
                  )}

                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Vendedor:</strong> {s.seller_name || "-"}
                  </p>

                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Método de pagamento:</strong>{" "}
                        {(() => {
                          const metodo = s.payment_method?.toLowerCase() || "";
                          if (metodo === "pendente") return `Pendente — ${s.created_by || "-"}`;
                          if (["interno", "uso interno"].includes(metodo) || metodo === "uso interno") return `Uso interno${s.observation ? ` — (${s.observation})` : ""}`;
                          return s.payment_method || "—";
                        })()}
                      </p>

                      <h4 className="font-semibold text-gray-700 mt-3 mb-1">🧾 Itens vendidos:</h4>

                      {Array.isArray(s.items) &&
                        s.items.map((it, idx) => {
                          const valorUnitario = it.unit_price ?? it.price ?? it.sale_price ?? 0;
                          const totalItem = valorUnitario * (it.qty || 1);
                          return (
                            <div key={idx} className="flex justify-between items-center py-2 text-sm border-b border-gray-200 hover:bg-white/60 rounded-lg transition-all px-2">
                              <span>{it.name} x{it.qty}</span>
                              <span>R$ {totalItem.toFixed(2)}</span>
                            </div>
                          );
                        })}

                      <div className="mt-4 flex justify-between items-center gap-4">
                      {/* botão cancelar só proprietário */}
                      <div className="flex gap-3">

                      {/* BOTÃO REGISTRAR PAGAMENTO (só aparece se status for pendente) */}
                      {s.payment_method === "pendente" && s.status !== "cancelado" && (
                        <button
                          onClick={async () => {
                            setModalPagamento({ open: true, id: s.id, total: s.total });
                          }}
                          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow"
                        >
                          Registrar Pagamento
                        </button>
                      )}

                      {/* BOTÃO CANCELAR VENDA (só proprietário) */}
                      {isOwner && s.status !== "cancelado" && (
                        <button
                          onClick={() => {
                            setConfirmSale({ id: s.id, type: "product", sale: s });
                            document.body.style.overflow = "hidden";
                          }}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow"
                        >
                          Cancelar Venda
                        </button>
                      )}
                    </div>

                        {/* total */}
                        <span className="font-bold text-green-700 text-lg bg-green-50 px-3 py-1 rounded-lg shadow-inner">
                          Total: R$ {Number(s.total).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          // proxima parte (piscinas) será renderizada na parte 3
          null
        )}
        {/* --- ABA PISCINAS --- */}
        {activeTab === "piscinas" && (
          <div className="space-y-3">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setCreatingPool(true)}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition"
              >
                ➕ Nova Venda de Piscina
              </button>
            </div>

            {/* CARDS PISCINAS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
              <div className="bg-white/80 backdrop-blur shadow-md rounded-2xl p-4 border border-gray-200">
                <p className="text-gray-500 text-sm">Piscinas Vendidas Hoje</p>
                <h3 className="text-2xl font-bold text-blue-700">{statsPiscinas.hojeQtd}</h3>
              </div>

              <div className="bg-white/80 backdrop-blur shadow-md rounded-2xl p-4 border border-gray-200">
                <p className="text-gray-500 text-sm">Vendidas na Semana</p>
                <h3 className="text-2xl font-bold text-cyan-700">{statsPiscinas.semanaQtd}</h3>
              </div>

              <div className="bg-white/80 backdrop-blur shadow-md rounded-2xl p-4 border border-gray-200">
                <p className="text-gray-500 text-sm">Valor Pago Hoje</p>
                <h3 className="text-2xl font-bold text-green-700">R$ {statsPiscinas.hojeValor}</h3>
              </div>

              <div className="bg-white/80 backdrop-blur shadow-md rounded-2xl p-4 border border-gray-200">
                <p className="text-gray-500 text-sm">Valor Pago na Semana</p>
                <h3 className="text-2xl font-bold text-red-600">R$ {statsPiscinas.semanaValor}</h3>
              </div>
            </div>

            {/* LISTA PISCINAS */}
            {poolSales.length === 0 ? (
              <p className="text-gray-500">Nenhuma venda de piscina registrada.</p>
            ) : (
              poolSales.map((p) => (
                <div
                  key={p.id}
                  className={`bg-white/80 shadow-md rounded-2xl border-r-4 border-gray-300 transition-all hover:shadow-lg hover:scale-[1.01] ${getStatusColor(p.status)}`}
                >
                  <div
                    onClick={() => toggleExpand(p.id)}
                    className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-100 active:bg-gray-200 transition-all rounded-xl"
                  >
                    <div>
                      <div className="font-semibold text-gray-800 text-[16px]">{formatDateTime(p.created_at)} — {p.cliente}</div>
                      <div className="text-sm text-gray-600 text-[14px]">Produto: {p.produto}</div>
                      <div className="text-sm text-gray-600 text-[14px]">Vendedor: {p.vendedor || "-"}</div>
                    </div>

                    <div className="text-right">
                      {p.status === "cancelado" ? (
                        <p className="text-red-700 font-semibold text-sm bg-red-100 px-3 py-1 rounded-xl shadow-sm">❌ CANCELADO</p>
                      ) : (
                        <div className="text-green-600 font-semibold">Valor Pago: R$ {Number(p.entrada).toFixed(2)}</div>
                      )}

                      {expanded === p.id ? <ChevronUp className="text-gray-600 inline ml-2" /> : <ChevronDown className="text-gray-600 inline ml-2" />}
                    </div>
                  </div>

                  {expanded === p.id && (
                    <div className="bg-gradient-to-br from-blue-50 via-white to-blue-100 border-t border-blue-200/60 rounded-b-3xl px-6 py-5 shadow-inner backdrop-blur-md">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-gray-600 mb-2"><strong>Cliente:</strong> {p.cliente}</p>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">🏷️ Status:</span>
                          {p.status === "cancelado" ? (
                            <span className="text-red-600 font-semibold">❌ CANCELADO</span>
                          ) : (
                            <select value={p.status} onChange={(e) => handleStatusChange(p.id, e.target.value)} className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                              <option value="aguardando">Aguardando Fábrica</option>
                              <option value="instalando">Instalando</option>
                              <option value="entregue">Entregue</option>
                            </select>
                          )}
                        </div>
                      </div>

                      <div className="pl-2 space-y-1 text-[14px]">
                        <p><strong>Marca:</strong> {p.marca}</p>
                        <p><strong>Produto:</strong> {p.produto}</p>
                        <p><strong>Valor Total:</strong> R$ {Number(p.valor_total).toFixed(2)}</p>
                        <p><strong>Entrada:</strong> R$ {Number(p.entrada).toFixed(2)}</p>
                        <p><strong>Vendedor:</strong> {p.vendedor || "-"}</p>
                        <p><strong>Instalador:</strong> {p.instalador || "-"}</p>
                      </div>

                      <div className="flex justify-end mt-4">
                        <button
                          onClick={(e) => {
                          e.stopPropagation();
                          setModalPiscina({
                            ...p,   // 💥 ESSENCIAL: GARANTE QUE NADA DO OBJETO SOME
                            id: p.id,

                            // 🔹 DADOS DO CLIENTE
                            cliente: p.cliente,
                            cpf: p.cpf,
                            rg: p.rg,
                            telefone: p.telefone,
                            endereco: p.endereco,
                            numero_casa: p.numero_casa,
                            bairro: p.bairro,
                            cidade: p.cidade,
                            referencia: p.referencia,

                            // 🔹 PRODUTO
                            produto: p.produto,
                            marca: p.marca,
                            garantia_fabrica: p.garantia_fabrica,
                            cor: p.cor,
                            pastilha: p.pastilha,
                            tipo_pastilha: p.tipo_pastilha,
                            valor_total: p.valor_total,
                            entrada: p.entrada,
                            observacoes_pagamento: p.observacoes_pagamento,

                            // 🔹 PRODUTOS INCLUSOS
                            produtos_inclusos: p.produtos_inclusos,
                            observacoes_inclusos: p.observacoes_inclusos,

                            // 🔹 GARANTIAS
                            garantia_3_meses: p.garantia_3_meses,
                            garantia_12_meses: p.garantia_12_meses,

                            // 🔹 OBSERVAÇÕES
                            observacoes: p.observacoes,

                            // 🔹 ENTREGA
                            prazo_entrega: p.prazo_entrega,

                            // 🔹 EQUIPE
                            instalador: p.instalador,
                            vendedor: p.vendedor,
                          });
        
                          document.body.style.overflow = "hidden";
                        }}

                          className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl shadow-lg hover:bg-blue-700 transition-all"
                        >
                          🔎 Detalhes
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ======= MODAL PREMIUM DE DETALHES PARA PISCINAS (quando expanded começa com modal-) ======= */}

            {/* ================= MODAL DE DETALHES DA PISCINA (CORRIGIDO) ================= */}
            {modalPiscina && (
              <ModalPortal>
                <div
                  className="absolute inset-0 bg-black/40 backdrop-blur-xl"
                  onClick={() => {
                    setModalPiscina(null);
                    document.body.style.overflow = "auto";
                  }}
                />

                <div className="relative bg-white w-[90%] max-w-lg p-8 rounded-3xl shadow-2xl border border-gray-200 max-h-[95vh] overflow-y-auto custom-scroll animate-fade-up">

                  <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">
                    🏊 Detalhes da Piscina Vendida
                  </h2>

                  {/* =============== DADOS DO CLIENTE =============== */}
                  <div className="mb-6">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">📌 Dados do Cliente</h3>

                    {[
                      ["Nome", modalPiscina.cliente],
                      ["CPF", modalPiscina.cpf],
                      ["RG", modalPiscina.rg],
                      ["Telefone", modalPiscina.telefone],
                      ["Endereço", modalPiscina.endereco],
                      ["Número", modalPiscina.numero_casa],
                      ["Bairro", modalPiscina.bairro],
                      ["Cidade", modalPiscina.cidade],
                      ["Referência", modalPiscina.referencia],
                    ].map(([label, value]) => (
                      <p key={label} className="text-gray-700 text-[15px]">
                        <strong>{label}:</strong> {value || "-"}
                      </p>
                    ))}
                  </div>

                  {/* =============== DADOS DO PRODUTO =============== */}
                  <div className="mb-6">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">📦 Produto</h3>

                    {[
                      ["Produto", modalPiscina.produto],
                      ["Marca", modalPiscina.marca],
                      ["Garantia da Fábrica", modalPiscina.garantia_fabrica],
                      ["Cor do Produto", modalPiscina.cor],
                      [
                        "Possui Pastilha?",
                        ["sim", "Sim", "SIM", "true", true, 1].includes(
                          String(modalPiscina.pastilha).trim()
                        )
                          ? "Sim"
                          : "Não"
                      ],
                      ["Tipo da Pastilha", modalPiscina.tipo_pastilha],
                      ["Valor Total", `R$ ${Number(modalPiscina.valor_total).toFixed(2)}`],
                      ["Valor Pago", `R$ ${Number(modalPiscina.entrada).toFixed(2)}`],
                      ["Obs. de Pagamento", modalPiscina.observacoes_pagamento],
                    ].map(([label, value]) => (
                      <p key={label} className="text-gray-700 text-[15px]">
                        <strong>{label}:</strong> {value || "-"}
                      </p>
                    ))}
                  </div>

                  {/* =============== PRODUTOS INCLUSOS =============== */}
                  <div className="mb-6">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">📦 Produtos Inclusos</h3>

                    {(() => {
                      let bruto = modalPiscina.produtos_inclusos || "";
                      let inclusos = {};

                      // 1️⃣ Tenta ler como JSON
                      try {
                        const parsed = JSON.parse(bruto);
                        if (typeof parsed === "object" && parsed !== null) {
                          inclusos = parsed;
                        }
                      } catch (e) {
                        // 2️⃣ Se não for JSON, trata como lista separada por vírgulas
                        const lista = bruto
                          .split(",")
                          .map((i) => i.trim())
                          .filter((i) => i.length > 0);

                        lista.forEach((item) => {
                          inclusos[item] = true;
                        });
                      }

                      const selecionados = Object.keys(inclusos);

                      return (
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                          {selecionados.length === 0 ? (
                            <p className="text-gray-600 text-sm">Nenhum item incluso.</p>
                          ) : (
                            <details className="cursor-pointer">
                              <summary className="text-blue-600 font-semibold mb-2">
                                Ver itens inclusos ({selecionados.length})
                              </summary>

                              <ul className="list-disc pl-6 text-gray-700">
                                {selecionados.map((k) => (
                                  <li key={k} className="text-sm">{k}</li>
                                ))}
                              </ul>

                              {modalPiscina.observacoes_inclusos && (
                                <p className="mt-3 text-sm text-gray-700">
                                  <strong>Observações:</strong> {modalPiscina.observacoes_inclusos}
                                </p>
                              )}
                            </details>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* =============== PRODUTOS ENTREGUES =============== */}
                  <div className="mb-6">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">📦 Produtos Entregues</h3>

                    {(() => {
                      const listaProdutos = [
                        "Casa de Máquina",
                        "Bomba",
                        "Filtro",
                        "Cascata",
                        "Skimmer",
                        "Bocal de Hidro",
                        "Sistema de Hidro",
                        "Bocal de Aspiração",
                        "Nicho",
                        "LED",
                        "Central de Comando",
                        "Fonte 12v",
                        "Kit Limpeza",
                        "Cabo de Alumínio",
                        "Carrinho Aspiração",
                        "Escovão",
                        "Peneira",
                        "Mangueira",
                        "Adaptador de Mangueira",
                        "Adaptador de Cabo",
                        "Flutuador",
                        "Outros"
                      ];

                      // ---- Lê JSON salvo no banco ----
                      let delivered = {};
                      try {
                        delivered = JSON.parse(modalPiscina.delivered_products || "{}");
                      } catch {
                        delivered = {};
                      }

                      const toggleItem = async (itemName, checked) => {
                        const newDelivered = { ...delivered, [itemName]: checked };

                        // envia para o backend
                        const token = localStorage.getItem("token");
                        await fetch(
                          `http://localhost:5000/pool-sales/${modalPiscina.id}/delivered-products`,
                          {
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ delivered_products: newDelivered }),
                          }
                        );

                        // atualiza modal local
                        setModalPiscina((prev) => ({
                          ...prev,
                          delivered_products: JSON.stringify(newDelivered),
                        }));
                      };

                      return (
                        <details className="bg-gray-50 rounded-xl p-3 border border-gray-200 cursor-pointer">
                          <summary className="text-blue-600 font-semibold mb-2">
                            Ver / Editar Produtos Entregues
                          </summary>

                          <div className="mt-3 space-y-3">
                            {listaProdutos.map((nome) => (
                              <div key={nome} className="flex flex-col gap-1">
                                <label className="flex items-center gap-3 text-gray-700 text-sm">
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4"
                                    checked={delivered[nome] === true}
                                    onChange={(e) => toggleItem(nome, e.target.checked)}
                                  />
                                  {nome}
                                </label>

                                {/* CAMPO DE OBS PARA CADA ITEM */}
                                {delivered[nome] === true && nome !== "Outros" && (
                                  <input
                                    type="text"
                                    placeholder="Observações..."
                                    className="w-full px-3 py-1 text-sm rounded-lg border border-gray-300"
                                    value={delivered[`${nome}_obs`] || ""}
                                    onChange={async (e) => {
                                      const newDelivered = {
                                        ...delivered,
                                        [`${nome}_obs`]: e.target.value,
                                      };

                                      const token = localStorage.getItem("token");
                                      await fetch(
                                        `http://localhost:5000/pool-sales/${modalPiscina.id}/delivered-products`,
                                        {
                                          method: "PUT",
                                          headers: {
                                            "Content-Type": "application/json",
                                            Authorization: `Bearer ${token}`,
                                          },
                                          body: JSON.stringify({ delivered_products: newDelivered }),
                                        }
                                      );

                                      setModalPiscina((prev) => ({
                                        ...prev,
                                        delivered_products: JSON.stringify(newDelivered),
                                      }));
                                    }}
                                  />
                                )}

                                {/* CAMPO ESPECIAL PARA “Outros” */}
                                {nome === "Outros" && delivered["Outros"] === true && (
                                  <textarea
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                                    placeholder="Descreva os itens adicionais..."
                                    value={delivered["Outros_obs"] || ""}
                                    onChange={async (e) => {
                                      const newDelivered = {
                                        ...delivered,
                                        Outros_obs: e.target.value,
                                      };

                                      const token = localStorage.getItem("token");
                                      await fetch(
                                        `http://localhost:5000/pool-sales/${modalPiscina.id}/delivered-products`,
                                        {
                                          method: "PUT",
                                          headers: {
                                            "Content-Type": "application/json",
                                            Authorization: `Bearer ${token}`,
                                          },
                                          body: JSON.stringify({ delivered_products: newDelivered }),
                                        }
                                      );

                                      setModalPiscina((prev) => ({
                                        ...prev,
                                        delivered_products: JSON.stringify(newDelivered),
                                      }));
                                    }}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </details>
                      );
                    })()}
                  </div>
                          
                  {/* =============== GARANTIAS =============== */}
                  <div className="mb-6">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">🛡️ Garantias</h3>

                    <p className="text-[15px] text-gray-700">
                      <strong>Garantia 3 meses:</strong> {modalPiscina.garantia_3_meses || "-"}
                    </p>
                    <p className="text-[15px] text-gray-700">
                      <strong>Garantia 12 meses:</strong> {modalPiscina.garantia_12_meses || "-"}
                    </p>
                  </div>

                  {/* =============== INFORMAÇÕES GERAIS =============== */}
                  <div className="mb-6">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">📋 Informações Gerais</h3>

                    <p className="text-gray-700 text-[15px] whitespace-pre-line">
                      {modalPiscina.observacoes || "-"}
                    </p>
                  </div>

                  {/* =============== PRAZO DE ENTREGA =============== */}
                  <div className="mb-6">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">⏳ Prazo de Entrega</h3>
                    <p className="text-gray-700 text-[15px]">
                      {modalPiscina.prazo_entrega || "-"}
                    </p>
                  </div>
                            
                  {/* =============== INSTALADOR E VENDEDOR =============== */}
                  <div className="mb-6">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">👷 Equipe</h3>
                    <p className="text-gray-700"><strong>Instalador:</strong> {modalPiscina.instalador || "-"}</p>
                    <p className="text-gray-700"><strong>Vendedor:</strong> {modalPiscina.vendedor || "-"}</p>
                  </div>

                  <button
                    onClick={() => {
                      setModalPiscina(null);
                      document.body.style.overflow = "auto";
                    }}
                    className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition"
                  >
                    Fechar
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => {
                        console.log("🟦 Abrindo edição da piscina ID:", modalPiscina.id);

                        setEditingPool({ ...modalPiscina, id: modalPiscina.id });
                        setReturnToPoolId(modalPiscina.id);
                        setModalPiscina(null);
                      }}

                      className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-semibold transition mb-3"
                    >
                      ✏️ Editar
                    </button>
                  )}
                </div>
              </ModalPortal>
            )}
          {editingPool && (
          <ModalPortal>
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setEditingPool(null)}
            />

            <div className="relative bg-white w-[95%] max-w-3xl p-6 rounded-3xl shadow-2xl max-h-[95vh] overflow-y-auto custom-scroll">

              <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center">
                ✏️ Editar Venda de Piscina
              </h2>

              <PoolSale
                initialData={editingPool}
                onCancel={() => setEditingPool(null)}
                onSuccess={
                  editingPool
                    ? async () => {
                        setEditingPool(null);

                        await loadPoolSales();
                        await loadPoolStats();

                        // EDITAR TERÁ APENAS UMA ATUALIZAÇÃO, SEM ABRIR NADA
                      }
                    : undefined
                }
              />
            </div>
          </ModalPortal>
        )}
    
        {creatingPool && (
        <ModalPortal>
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setCreatingPool(false)}
          />

          <PoolSaleCreate
            onClose={() => setCreatingPool(false)}
            onCreated={async () => {
              await loadPoolSales();
              await loadPoolStats();
            }}
          />
        </ModalPortal>
      )}
      </div>
    </>
  );
}