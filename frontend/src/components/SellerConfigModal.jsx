// frontend/src/components/SellerModal.jsx
import React, { useState } from "react";
import { addSellerConfig, updateSellerConfig } from "../api";

export default function SellerModal({ onClose, onSaved, seller }) {
  const [nome, setNome] = useState(seller ? seller.nome : "");
  const [telefone, setTelefone] = useState(seller ? seller.telefone : "");
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!nome.trim()) {
      setError("O nome do vendedor é obrigatório.");
      return;
    }

    try {
      if (seller) {
        await updateSellerConfig(seller.id, { nome, telefone });
      } else {
        await addSellerConfig({ nome, telefone });
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar vendedor.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">
          {seller ? "Editar Vendedor" : "Cadastrar Vendedor"}
        </h2>

        {error && <p className="text-red-600 mb-2">{error}</p>}

        <label className="block mb-2 font-medium">Nome</label>
        <input
          className="border rounded-md w-full p-2 mb-3"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Carlos Souza"
        />

        <label className="block mb-2 font-medium">Telefone</label>
        <input
          className="border rounded-md w-full p-2 mb-4"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          placeholder="(22) 99999-9999"
        />

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="bg-gray-300 px-4 py-2 rounded-md"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
