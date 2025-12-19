import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import api from "../api";

export default function ProductModal({ onClose, onSuccess, editingItem }) {
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState({
    name: "",
    brand: "",
    weight: "",
    cost_price: "",
    sale_price: "",
    stock: "",
    low_stock_alert: "",
  });

  // 🔹 Carrega marcas
  useEffect(() => {
    const loadBrands = async () => {
      try {
        const data = await api.getBrands();
        setBrands(data);
      } catch (err) {
        console.error("Erro ao carregar marcas:", err);
      }
    };
    loadBrands();
  }, []);

  // 🔹 Preenche ao editar
  useEffect(() => {
    if (editingItem) {
      setForm({
        name: editingItem.name || "",
        brand: editingItem.brand || "",
        weight: editingItem.weight || "",
        cost_price: editingItem.cost_price || "",
        sale_price: editingItem.sale_price || "",
        stock: editingItem.stock || "",
        low_stock_alert: editingItem.low_stock_alert || "",
      });
    }
  }, [editingItem]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.updateProduct(editingItem.id, form);
        onSuccess("✅ Produto atualizado com sucesso!", "success");
      } else {
        await api.addProduct(form);
        onSuccess("✅ Produto cadastrado com sucesso!", "success");
      }
      onClose();
    } catch (err) {
      console.error("Erro ao salvar produto:", err);
      onSuccess("❌ Erro ao salvar produto.", "error");
    }
  };

  // ===============================
  // 🌟 PORTAL — GARANTE BLUR GLOBAL
  // ===============================
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[999999]">
      {/* Fundo escuro com blur TOTAL */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative z-[1000000] flex items-center justify-center h-full p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-7 w-[520px] border border-gray-200 animate-scale-in">
          <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">
            {editingItem ? "Editar Produto" : "Cadastrar Produto"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              name="name"
              placeholder="Nome"
              value={form.name}
              onChange={handleChange}
              className="border rounded-xl p-2 w-full shadow-sm focus:shadow-md 
                         transition-all focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />

            <select
              name="brand"
              value={form.brand}
              onChange={handleChange}
              className="border rounded-xl p-2 w-full shadow-sm focus:shadow-md 
                         transition-all focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              <option value="">Selecione a marca</option>
              {brands.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>

            <input
              name="weight"
              placeholder="Peso"
              value={form.weight}
              onChange={handleChange}
              className="border rounded-xl p-2 w-full shadow-sm focus:shadow-md 
                         transition-all focus:ring-2 focus:ring-blue-500 outline-none"
            />

            <input
              name="cost_price"
              placeholder="Preço de custo"
              value={form.cost_price}
              onChange={handleChange}
              className="border rounded-xl p-2 w-full shadow-sm focus:shadow-md 
                         transition-all focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />

            <input
              name="sale_price"
              placeholder="Preço de venda"
              value={form.sale_price}
              onChange={handleChange}
              className="border rounded-xl p-2 w-full shadow-sm focus:shadow-md 
                         transition-all focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />

            <input
              name="stock"
              placeholder="Estoque atual"
              value={form.stock}
              onChange={handleChange}
              className="border rounded-xl p-2 w-full shadow-sm focus:shadow-md 
                         transition-all focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />

            <input
              name="low_stock_alert"
              placeholder="Avisar quando estoque for menor que..."
              value={form.low_stock_alert}
              onChange={handleChange}
              className="border rounded-xl p-2 w-full shadow-sm focus:shadow-md 
                         transition-all focus:ring-2 focus:ring-blue-500 outline-none"
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 
                           rounded-xl transition shadow-sm hover:shadow-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 
                           text-white rounded-xl transition shadow-md hover:shadow-lg"
              >
                {editingItem ? "Salvar Alterações" : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
