import React, { useState } from "react";
import * as api from "../api";
import { Waves } from "lucide-react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await api.login(username, password);

      // 🔐 Salva o token
      localStorage.setItem("token", data.token);

      // 🔐 Salva tudo em um único objeto (ESSENCIAL)
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.id,
          username: data.username,
          role: data.role,
          owner_id: data.owner_id ?? null,
        })
      );

      onLogin(data);

    } catch (err) {
      console.error("Erro no login:", err);
      setError("Usuário ou senha incorretos");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300 dark:from-gray-900 dark:to-gray-800 transition-all duration-500 p-4">
      
      <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl shadow-2xl p-10 w-full max-w-md border border-white/30 dark:border-gray-700">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <Waves className="w-12 h-12 text-blue-600 dark:text-blue-300" />
          <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-200 mt-3">
            AquaStore
          </h1>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-gray-700 dark:text-gray-300 font-medium">Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 mt-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="Digite seu usuário"
              required
            />
          </div>

          <div>
            <label className="text-gray-700 dark:text-gray-300 font-medium">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 mt-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="Digite sua senha"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-center font-medium animate-fade-in-out">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold shadow-md transition"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
