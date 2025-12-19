// frontend/src/components/Layout.jsx
import React, { useState } from "react";
import { Menu as MenuIcon, LogOut } from "lucide-react";
import Menu from "./Menu";

export default function Layout({ children, user, onLogout, onChangePage, currentPage }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 
                    dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">

      {/* SIDEBAR FIXA */}
      <div
        className={`h-screen fixed left-0 top-0 transition-all duration-300 z-50
                    ${sidebarOpen ? "w-64" : "w-20"} 
                    bg-white/80 dark:bg-gray-900/80 border-r border-gray-200 dark:border-gray-700`}
      >
        <Menu
          user={user}
          onChangePage={onChangePage}
          sidebarOpen={sidebarOpen}
          currentPage={currentPage}
        />
      </div>

      {/* PRINCIPAL */}
      <div
        className={`
          flex-1 flex flex-col transition-all duration-300
          ${sidebarOpen ? "ml-64" : "ml-20"}
        `}
      >

        {/* HEADER FIXO */}
        <header className="fixed top-0 left-0 w-full h-16 flex items-center justify-between 
    px-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg shadow-md 
    border-b border-gray-200 dark:border-gray-700 z-[1]">

          
          {/* Observação: o botão foi removido de dentro do fluxo do header
              e transformado em elemento 'fixed' logo abaixo para escapar do stacking context */}
          <div /> {/* placeholder para manter estrutura - o botão real está fora do header */}

          <div className="hidden md:block">
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white 
                        px-4 py-2 rounded-xl shadow transition"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </header>

        {/* BOTÃO FIXO (fora do stacking context do header, sempre visível acima do menu) */}
        <button
  onClick={toggleSidebar}
  className={`
    fixed top-[15px]
    left-0
    transform
    ${sidebarOpen ? "translate-x-[280px]" : "translate-x-[90px]"}
    transition-all duration-300
    p-2 rounded-xl 
    bg-white dark:bg-gray-800 
    shadow hover:shadow-lg
    z-[9]
  `}
>
  <MenuIcon size={22} />
</button>


        <main className="pt-20 p-6">{children}</main>
      </div>
    </div>
  );
}
