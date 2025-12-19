import React, { useState, useEffect } from "react";
import api from "../api";

import PoolModal from "./PoolModal";
import Notification from "./Notification";
import ConfirmModal from "./ConfirmModal";

export default function Pools() {
  const [pools, setPools] = useState([]);
  const [showPoolModal, setShowPoolModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [notification, setNotification] = useState(null);
  const [confirmItem, setConfirmItem] = useState(null);

  const fetchPools = async () => {
    try {
      const data = await api.getPools();
      setPools(data);
    } catch (err) {
      console.error("Erro ao carregar piscinas:", err);
    }
  };

  useEffect(() => {
    fetchPools();
  }, []);

  const handleEdit = (pool) => {
    setEditingItem(pool);
    setShowPoolModal(true);
  };

  const handleDelete = (pool) => {
    setConfirmItem(pool);
  };

  const confirmDelete = async () => {
    if (!confirmItem) return;

    try {
      await api.deletePool(confirmItem.id);
      fetchPools();
      setNotification({
        message: "✅ Piscina excluída com sucesso!",
        type: "success",
      });
    } catch (err) {
      console.error("Erro ao excluir piscina:", err);
      setNotification({
        message: "❌ Erro ao excluir piscina.",
        type: "error",
      });
    } finally {
      setConfirmItem(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade">
      <div className="flex justify-between items-center mb-6 animate-slide-up">
        <h1 className="text-3xl font-bold text-cyan-700">Gerenciar Piscinas</h1>

        <button
          onClick={() => {
            setEditingItem(null);
            setShowPoolModal(true);
          }}
          className="px-5 py-3 bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 
                    text-white rounded-xl font-medium shadow-md hover:shadow-lg 
                    transition-all transform hover:scale-[1.02]"
        >
          🏊‍♂️ Cadastrar Piscina
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">

        <div className="bg-white/80 backdrop-blur shadow-md rounded-2xl p-4 border border-gray-200 
                transition-all hover:shadow-lg hover:-translate-y-1 animate-fade-soft">
          <p className="text-gray-500 text-sm">Total de Piscinas</p>
          <h3 className="text-2xl font-bold text-cyan-700">{pools.length}</h3>
        </div>

        <div className="bg-white/80 backdrop-blur shadow-md rounded-2xl p-4 border border-gray-200 
                transition-all hover:shadow-lg hover:-translate-y-1 animate-fade-soft">
          <p className="text-gray-500 text-sm">Marcas</p>
          <h3 className="text-2xl font-bold text-blue-700">
            {[...new Set(pools.map(p => p.brand))].length}
          </h3>
        </div>

        <div className="bg-white/80 backdrop-blur shadow-md rounded-2xl p-4 border border-gray-200 
                transition-all hover:shadow-lg hover:-translate-y-1 animate-fade-soft">
          <p className="text-gray-500 text-sm">Maior Preço</p>
          <h3 className="text-2xl font-bold text-green-700">
            R$ {Math.max(...pools.map(p => Number(p.sale_price) || 0)).toFixed(2)}
          </h3>
        </div>

        <div className="bg-white/80 backdrop-blur shadow-md rounded-2xl p-4 border border-gray-200 
                transition-all hover:shadow-lg hover:-translate-y-1 animate-fade-soft">
          <p className="text-gray-500 text-sm">Menor Preço</p>
          <h3 className="text-2xl font-bold text-red-600">
            R$ {Math.min(...pools.map(p => Number(p.sale_price) || 0)).toFixed(2)}
          </h3>
        </div>

      </div>

      <div className="overflow-hidden rounded-2xl shadow-xl bg-white/80 backdrop-blur-lg border border-gray-200 animate-fade">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-cyan-100 to-blue-100 text-gray-700">
            <tr>
              <th className="p-3 text-left font-semibold">Modelo</th>
              <th className="p-3 text-left font-semibold">Marca</th>
              <th className="p-3 text-center font-semibold">Preço</th>
              <th className="p-3 text-center font-semibold">Dimensões</th>
              <th className="p-3 text-right font-semibold">Ações</th>
            </tr>
          </thead>

          <tbody>
            {pools.map((p) => (
              <tr
                key={p.id}
                className="border-b border-gray-200 hover:bg-blue-50/50 transition-all 
                            hover:shadow-sm hover:scale-[1.01] animate-fade-soft"
              >
                <td className="p-3 font-medium">{p.model}</td>
                <td className="p-3">{p.brand}</td>

                <td className="p-3 text-center font-semibold text-green-700">
                  R$ {p.sale_price}
                </td>

                <td className="p-3 text-center">
                  {p.length} × {p.width} × {p.depth}
                </td>

                <td className="p-3 text-right space-x-3">
                  <button
                    onClick={() => handleEdit(p)}
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

      {/* CAMADA DE MODAIS FIXA (BLUR TOTAL) */}
      <div className="fixed inset-0 z-[999999] pointer-events-none">

        {showPoolModal && (
          <PoolModal
            editingItem={editingItem}
            onClose={() => setShowPoolModal(false)}
            onSuccess={(msg, type) => {
              setNotification({ message: msg, type });
              fetchPools();
            }}
          />
        )}

        {confirmItem && (
          <ConfirmModal
            message={`Deseja excluir a piscina "${confirmItem.model}"?`}
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
