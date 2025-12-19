// frontend/src/components/PoolBrandModal.jsx
import React, { useState } from "react";
import { addPoolBrand, updatePoolBrand } from "../api";
import ModalPortal from "./ModalPortal";

export default function PoolBrandModal({ onClose, onSaved, brand }) {
  const [name, setName] = useState(brand ? brand.name : "");
  const [supplier, setSupplier] = useState(brand ? brand.supplier : "");
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) return setError("O nome da marca da piscina é obrigatório.");

    try {
      if (brand) await updatePoolBrand(brand.id, { name, supplier });
      else await addPoolBrand({ name, supplier });

      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar marca de piscina.");
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100000] flex items-center justify-center">

        {/* BLUR TOTAL */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-md z-[99999]"
          onClick={onClose}
        ></div>

        {/* JANELA */}
        <div className="relative z-[100001] bg-white rounded-2xl shadow-2xl p-6 w-[400px] 
                        border border-white/20 animate-scale-in">

          <h2 className="text-xl font-bold mb-4 text-gray-800">
            {brand ? "Editar Marca de Piscina" : "Cadastrar Marca de Piscina"}
          </h2>

          {error && <p className="text-red-600 font-medium mb-2">{error}</p>}

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome
          </label>
          <input
            className="border rounded-lg w-full p-2 mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fornecedor
          </label>
          <input
            className="border rounded-lg w-full p-2 mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
          />

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
            >
              Cancelar
            </button>

            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow transition"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
