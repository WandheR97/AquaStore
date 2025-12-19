// frontend/src/components/OwnerEditModal.jsx
import React, { useState } from "react";
import ModalPortal from "./ModalPortal";

export default function OwnerEditModal({ owner, onClose, onSave }) {
  const [username, setUsername] = useState(owner?.username || "");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ username, password });
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100000] flex items-center justify-center">

        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-md z-[99999]"
          onClick={onClose}
        ></div>

        <div className="relative z-[100001] bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 animate-scale-in">

          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            ✏️ Editar Proprietário
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="text-sm">Nome de usuário</label>
              <input
                type="text"
                required
                className="w-full border p-2 rounded-lg mt-1"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm">Nova senha (opcional)</label>
              <input
                type="password"
                className="w-full border p-2 rounded-lg mt-1"
                placeholder="Deixe em branco para manter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 rounded-lg"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
