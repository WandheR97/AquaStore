// frontend/src/components/SellerModal.jsx
import React, { useState } from "react";
import api from "../api";
import ModalPortal from "./ModalPortal";

export default function SellerModal({ onClose, onSaved, ownerId }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.addSeller({ username, password, owner_id: ownerId });

      if (res.success) {
        onSaved();
        onClose();
      } else {
        setError(res.error || "Erro ao cadastrar vendedor.");
      }
    } catch (err) {
      setError(err.message || "Erro no servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100000] flex items-center justify-center">

        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-md z-[99999]"
          onClick={onClose}
        ></div>

        <div className="relative z-[100001] bg-white p-6 rounded-2xl shadow-xl w-[380px] animate-scale-in">

          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Cadastrar Vendedor
          </h2>

          {error && <p className="text-red-600 mb-2">{error}</p>}

          <label className="block mb-1 font-medium">Usuário</label>
          <input
            type="text"
            className="border p-2 w-full rounded-lg mb-3"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label className="block mb-1 font-medium">Senha</label>
          <input
            type="password"
            className="border p-2 w-full rounded-lg mb-5"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-lg">
              Cancelar
            </button>

            <button
              onClick={handleSave}
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-white ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
