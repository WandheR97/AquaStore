// frontend/src/components/InstallerModal.jsx
import React, { useState } from "react";
import { addInstaller, updateInstaller } from "../api";
import ModalPortal from "./ModalPortal";

export default function InstallerModal({ onClose, onSaved, installer }) {
  const [name, setName] = useState(installer ? installer.name : "");
  const [contact, setContact] = useState(installer ? installer.contact : "");
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) return setError("O nome do instalador é obrigatório.");

    try {
      if (installer) await updateInstaller(installer.id, { name, contact });
      else await addInstaller({ name, contact });

      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar instalador.");
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
            {installer ? "Editar Instalador" : "Cadastrar Instalador"}
          </h2>

          {error && <p className="text-red-600 mb-2 font-medium">{error}</p>}

          <label className="block text-sm font-medium mb-1">Nome</label>
          <input
            className="border rounded-lg w-full p-2 mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label className="block text-sm font-medium mb-1">Contato</label>
          <input
            className="border rounded-lg w-full p-2 mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
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
