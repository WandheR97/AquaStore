// frontend/src/components/BrandModal.jsx
import React, { useState } from "react";
import { addBrand, updateBrand } from "../api";
import ModalPortal from "./ModalPortal";

export default function BrandModal({ onClose, onSaved, brand }) {
  const [name, setName] = useState(brand ? brand.name : "");
  const [supplier, setSupplier] = useState(brand ? brand.supplier : "");
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) {
      setError("O nome da marca é obrigatório.");
      return;
    }

    try {
      if (brand) await updateBrand(brand.id, { name, supplier });
      else await addBrand({ name, supplier });

      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar marca.");
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
        <div className="relative z-[100001] bg-white rounded-2xl p-6 w-96 shadow-2xl 
                        border border-white/20 animate-scale-in">

        <h2 className="text-2xl font-bold mb-4 text-blue-700">
          {brand ? "Editar Marca" : "Cadastrar Marca"}
        </h2>

        {error && (
          <p className="text-red-600 font-medium bg-red-50 border border-red-200 p-2 rounded-md mb-3">
            {error}
          </p>
        )}

        <label className="block mb-1 font-medium">Nome</label>
        <input
          className="border rounded-lg w-full p-2 mb-4 focus:ring-2 focus:ring-blue-500 outline-none transition"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label className="block mb-1 font-medium">Fornecedor</label>
        <input
          className="border rounded-lg w-full p-2 mb-5 focus:ring-2 focus:ring-blue-500 outline-none transition"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  </ModalPortal>
);
}
