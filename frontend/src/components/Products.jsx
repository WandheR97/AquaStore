import React, { useState, useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";

import ProductModal from "./ProductModal";
import Notification from "./Notification";
import ConfirmModal from "./ConfirmModal";
import api from "../api";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [notification, setNotification] = useState(null);
  const [confirmItem, setConfirmItem] = useState(null);

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
      setNotification({
        message: "❌ Erro ao carregar produtos.",
        type: "error",
      });
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSuccess = (message, type) => {
    setNotification({ message, type });
    loadProducts();
  };

  const handleDelete = (product) => {
    setConfirmItem(product);
  };

  const confirmDelete = async () => {
    if (!confirmItem) return;

    try {
      await api.deleteProduct(confirmItem.id);
      setNotification({
        message: "✅ Produto excluído com sucesso!",
        type: "success",
      });
      loadProducts();
    } catch (err) {
      console.error("Erro ao excluir produto:", err);
      setNotification({
        message: "❌ Erro ao excluir produto.",
        type: "error",
      });
    } finally {
      setConfirmItem(null);
    }
  };

  // ============================
  // 🧮 ESTATÍSTICAS (IGUAL ABA PISCINAS)
  // ============================

  const totalProdutos = products.length;

  const totalMarcas = [...new Set(products.map((p) => p.brand || "Sem Marca"))].length;

  const maiorPreco =
    products.length > 0
      ? Math.max(...products.map((p) => Number(p.sale_price) || 0)).toFixed(2)
      : "0.00";

  const menorPreco =
    products.length > 0
      ? Math.min(...products.map((p) => Number(p.sale_price) || 0)).toFixed(2)
      : "0.00";

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade">

      {/* NOTIFICAÇÃO */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 animate-slide-up">
        <h1 className="text-3xl font-bold text-blue-700">Gerenciar Produtos</h1>

        <button
          onClick={() => {
            setEditingItem(null);
            setShowModal(true);
          }}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 
                     text-white rounded-xl font-medium shadow-md hover:shadow-lg 
                     transition-all transform hover:scale-[1.02]"
        >
          ➕ Novo Produto
        </button>
      </div>

      {/* =============================== */}
      {/* ESTATÍSTICAS - IGUAL ABA PISCINAS */}
      {/* =============================== */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">

        <div className="bg-white/80 backdrop-blur shadow-md rounded-2xl p-4 border border-gray-200 
                        transition-all hover:shadow-lg hover:-translate-y-1 animate-fade-soft">
          <p className="text-gray-500 text-sm">Total de Produtos</p>
          <h3 className="text-2xl font-bold text-blue-700">{totalProdutos}</h3>
        </div>

        <div className="bg-white/80 backdrop-blur shadow-md rounded-2xl p-4 border border-gray-200 
                        transition-all hover:shadow-lg hover:-translate-y-1 animate-fade-soft">
          <p className="text-gray-500 text-sm">Marcas</p>
          <h3 className="text-2xl font-bold text-cyan-700">{totalMarcas}</h3>
        </div>

        <div className="bg-white/80 backdrop-blur shadow-md rounded-2xl p-4 border border-gray-200 
                        transition-all hover:shadow-lg hover:-translate-y-1 animate-fade-soft">
          <p className="text-gray-500 text-sm">Maior Preço</p>
          <h3 className="text-2xl font-bold text-green-700">R$ {maiorPreco}</h3>
        </div>

        <div className="bg-white/80 backdrop-blur shadow-md rounded-2xl p-4 border border-gray-200 
                        transition-all hover:shadow-lg hover:-translate-y-1 animate-fade-soft">
          <p className="text-gray-500 text-sm">Menor Preço</p>
          <h3 className="text-2xl font-bold text-red-600">R$ {menorPreco}</h3>
        </div>

      </div>

      {/* LISTA */}
      <div className="overflow-hidden rounded-2xl shadow-xl bg-white/80 backdrop-blur-lg 
                      border border-gray-200 animate-fade">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-blue-100 to-cyan-100 text-gray-700">
            <tr>
              <th className="p-3 text-left font-semibold">Nome</th>
              <th className="p-3 text-left font-semibold">Marca</th>
              <th className="p-3 text-center font-semibold">Preço</th>
              <th className="p-3 text-right font-semibold">Ações</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => (
              <tr
                key={p.id}
                className="border-b border-gray-200 hover:bg-blue-50/50 transition-all 
                           hover:shadow-sm hover:scale-[1.01] animate-fade-soft"
              >
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3 text-gray-600">{p.brand || "Sem marca"}</td>

                <td className="p-3 text-center font-semibold text-green-700">
                  R$ {Number(p.sale_price).toFixed(2)}
                </td>

                <td className="p-3 text-right space-x-3">
                  <button
                    onClick={() => {
                      setEditingItem(p);
                      setShowModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 transition text-lg"
                    title="Editar"
                  >
                    ✏️
                  </button>

                  <button
                    onClick={() => handleDelete(p)}
                    className="text-red-600 hover:text-red-800 transition text-lg"
                    title="Excluir"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CAMADA GLOBAL DE MODAIS */}
      <div className="fixed inset-0 z-[999999] pointer-events-none">
        {showModal && (
          <ProductModal
            editingItem={editingItem}
            onClose={() => setShowModal(false)}
            onSuccess={handleSuccess}
          />
        )}

        {confirmItem && (
          <ConfirmModal
            message={`Deseja realmente excluir o produto "${confirmItem.name}"?`}
            onConfirm={confirmDelete}
            onCancel={() => setConfirmItem(null)}
          />
        )}

        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </div>
  );
}
