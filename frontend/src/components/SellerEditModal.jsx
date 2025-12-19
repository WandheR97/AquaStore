// frontend/src/components/SellerEditModal.jsx
import React, { useState } from "react";
import ModalPortal from "./ModalPortal";

export default function SellerEditModal({ seller, onClose, onSave }) {
  const [username, setUsername] = useState(seller?.username || seller?.name || "");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave({ username, password });
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100000] flex items-center justify-center">

        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-md z-[99999]"
          onClick={onClose}
        ></div>

        <div className="relative z-[100001] bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-scale-in">

          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
            ✏️ Editar Vendedor
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block mb-1 text-sm font-medium">Nome de usuário</label>
              <input
                type="text"
                required
                className="w-full border rounded-lg px-3 py-2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Nova senha (opcional)</label>
              <input
                type="password"
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Deixe em branco para manter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
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
