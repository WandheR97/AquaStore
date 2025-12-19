// frontend/src/components/OwnerModal.jsx
import React, { useState } from "react";
import api from "../api";
import Notification from "./Notification";
import ModalPortal from "./ModalPortal";

export default function OwnerModal({ onClose }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.addOwner(form);
      if (res.success) {
        setNotification({
          message: "✅ Proprietário criado com sucesso!",
          type: "success",
        });
        setTimeout(onClose, 1200);
      } else {
        setNotification({ message: "❌ " + res.error, type: "error" });
      }
    } catch {
      setNotification({ message: "❌ Erro no servidor.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100000] flex items-center justify-center">

        {/* BLUR TOTAL */}
        <div
          className="absolute inset-0 backdrop-blur-md bg-black/40 z-[99999]"
          onClick={onClose}
        ></div>

        {/* JANELA */}
        <div className="relative z-[100001] bg-white p-8 rounded-2xl shadow-2xl w-[400px] text-center border border-gray-200 animate-scale-in">

          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            Cadastrar Proprietário
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="text-sm text-gray-700">Nome de Usuário</label>
              <input
                type="text"
                name="username"
                required
                className="w-full border rounded-lg p-2 mt-1"
                value={form.username}
                onChange={handleChange}
                placeholder="Ex: joaosilva"
              />
            </div>

            <div>
              <label className="text-sm text-gray-700">Senha</label>
              <input
                type="password"
                name="password"
                required
                className="w-full border rounded-lg p-2 mt-1"
                value={form.password}
                onChange={handleChange}
                placeholder="Digite uma senha segura"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-3 py-2 rounded-lg text-white font-semibold transition
                ${loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {loading ? "Cadastrando..." : "Cadastrar"}
            </button>
          </form>

          <button
            onClick={onClose}
            className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
          >
            Cancelar
          </button>

          {notification && (
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification(null)}
            />
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
