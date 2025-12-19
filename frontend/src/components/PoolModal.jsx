// frontend/src/components/PoolModal.jsx
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import api from "../api";

export default function PoolModal({ editingItem, onClose, onSuccess }) {
  const [brands, setBrands] = useState([]);

  const [form, setForm] = useState({
    model: "",
    brand: "",
    length: "",
    width: "",
    depth: "",
    sale_price: "",
    sale_price_tile: "",
    sale_price_white: "",
    sale_price_white_tile: "",
  });

  useEffect(() => {
    fetchBrands();
    if (editingItem) setForm(editingItem);
  }, [editingItem]);

  const fetchBrands = async () => {
    try {
      const data = await api.getPoolBrands();
      setBrands(data);
    } catch (err) {
      console.error("Erro ao carregar marcas:", err);
    }
  };

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (editingItem) {
        await api.updatePool(editingItem.id, form);
        onSuccess("✅ Piscina atualizada com sucesso!", "success");
      } else {
        await api.addPool(form);
        onSuccess("✅ Piscina cadastrada com sucesso!", "success");
      }
      onClose();
    } catch (err) {
      console.error("Erro ao salvar piscina:", err);
      onSuccess("❌ Erro ao salvar piscina.", "error");
    }
  };

  // ================================
  // PORTAL + BLUR GLOBAL
  // ================================
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center">

      {/* CAMADA DE FUNDO / BLUR TOTAL */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      ></div>

      {/* JANELA */}
      <div className="relative z-[100001] bg-white rounded-2xl shadow-2xl p-7 w-[520px] 
                      border border-gray-200 animate-scale-in pointer-events-auto">

        <h3 className="text-2xl font-bold text-blue-700 mb-6 text-center">
          {editingItem ? "Editar Piscina" : "Cadastrar Piscina"}
        </h3>

        {/* FORM */}
        <div className="grid grid-cols-2 gap-4">

          {/* Modelo */}
          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-700">Modelo</label>
            <input
              className="border rounded-xl p-2 w-full shadow-sm focus:shadow-md transition-all
                         focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ex: Bahamas 6.0"
              value={form.model}
              onChange={(e) => handleChange("model", e.target.value)}
            />
          </div>

          {/* Marca */}
          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-700">Marca</label>
            <select
              value={form.brand}
              onChange={(e) => handleChange("brand", e.target.value)}
              className="border rounded-xl p-2 w-full shadow-sm focus:shadow-md transition-all
                         focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Selecione a marca</option>
              {brands.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dimensões */}
          <div>
            <label className="text-sm font-medium text-gray-700">Comprimento</label>
            <input
              className="border rounded-xl p-2 w-full shadow-sm focus:shadow-md transition-all
                         focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ex: 6.0"
              value={form.length}
              onChange={(e) => handleChange("length", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Largura</label>
            <input
              className="border rounded-xl p-2 w-full shadow-sm focus:shadow-md transition-all
                         focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ex: 3.0"
              value={form.width}
              onChange={(e) => handleChange("width", e.target.value)}
            />
          </div>

          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-700">Profundidade</label>
            <input
              className="border rounded-xl p-2 w-full shadow-sm focus:shadow-md transition-all
                         focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ex: 1.40"
              value={form.depth}
              onChange={(e) => handleChange("depth", e.target.value)}
            />
          </div>

          {/* PREÇOS */}
          <div>
            <label className="text-sm font-medium text-gray-700">Preço Azul</label>
            <input
              className="border rounded-xl p-2 w-full shadow-sm focus:shadow-md transition-all
                         focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ex: 16000"
              value={form.sale_price}
              onChange={(e) => handleChange("sale_price", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Azul + Pastilha</label>
            <input
              className="border rounded-xl p-2 w-full shadow-sm focus:shadow-md transition-all
                         focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ex: 17500"
              value={form.sale_price_tile}
              onChange={(e) => handleChange("sale_price_tile", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Branca</label>
            <input
              className="border rounded-xl p-2 w-full shadow-sm focus:shadow-md transition-all
                         focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ex: 16500"
              value={form.sale_price_white}
              onChange={(e) => handleChange("sale_price_white", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Branca + Pastilha</label>
            <input
              className="border rounded-xl p-2 w-full shadow-sm focus:shadow-md transition-all
                         focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ex: 18000"
              value={form.sale_price_white_tile}
              onChange={(e) => handleChange("sale_price_white_tile", e.target.value)}
            />
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 
                       rounded-xl transition shadow-sm hover:shadow-md"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 
                       text-white rounded-xl transition shadow-md hover:shadow-lg"
          >
            {editingItem ? "Salvar" : "Cadastrar"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
