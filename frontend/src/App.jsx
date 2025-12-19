// frontend/src/App.jsx
import React, { useState, useEffect } from "react";

import Layout from "./components/Layout"; // ✅ agora tudo usa o Layout Premium

// Páginas
import Login from "./components/Login";
import Cashier from "./components/Cashier";
import Products from "./components/Products";
import Pools from "./components/Pools";
import Settings from "./components/Settings";
import Users from "./components/Users";
import Sales from "./components/Sales";

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("caixa");

  // 🔄 Restaura sessão
  useEffect(() => {
    const token = localStorage.getItem("token");
    const id = localStorage.getItem("id");
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");
    const owner_id = localStorage.getItem("owner_id");

    if (token && username && role) {
      setUser({
        token,
        id: id ? Number(id) : null,
        username,
        role,
        owner_id: owner_id ? Number(owner_id) : null,
      });
    }
  }, []);

  // 🔐 Login
  const handleLogin = (userData) => {
    if (userData) {
      localStorage.setItem("token", userData.token);
      localStorage.setItem("id", userData.id);
      localStorage.setItem("username", userData.username);
      localStorage.setItem("role", userData.role);
      localStorage.setItem("owner_id", userData.owner_id ?? "");

      setUser(userData);
    }
  };

  // 🚪 Logout
  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  // 🟦 NÃO logado → Login
  if (!user) return <Login onLogin={handleLogin} />;

  // ⭐ LOGADO → usa o Layout Premium em tudo
  return (
    <>
      {/* CAMADA GLOBAL DE MODAIS – sempre acima de tudo */}

      <Layout
        user={user}
        onLogout={handleLogout}
        onChangePage={setPage}
        currentPage={page}
      >
        {page === "caixa" && <Cashier user={user} />}
        {page === "produtos" && <Products user={user} />}
        {page === "piscinas" && <Pools user={user} />}
        {page === "usuarios" && user.role !== "vendedor" && <Users user={user} />}
        {page === "sales" && <Sales user={user} />}
        {page === "config" && <Settings />}
      </Layout>
    </>
  );
}
