import React from "react";
import {
  PackageSearch,
  Fish,
  Users,
  BarChart2,
  Settings,
  ShoppingCart,
} from "lucide-react";

export default function Menu({
  user,
  onChangePage,
  sidebarOpen,
  currentPage,
}) {
  
  const menuItems = [
    {
      label: "Caixa",
      icon: ShoppingCart,
      page: "caixa",
      color: "text-blue-600",
    },
    {
      label: "Produtos",
      icon: PackageSearch,
      page: "produtos",
      color: "text-purple-600",
    },
    {
      label: "Piscinas",
      icon: Fish,
      page: "piscinas",
      color: "text-cyan-600",
    },
    ...(user.role !== "vendedor"
      ? [
          {
            label: "Usuários",
            icon: Users,
            page: "usuarios",
            color: "text-blue-800",
          },
        ]
      : []),
    {
      label: "Vendas",
      icon: BarChart2,
      page: "sales",
      color: "text-yellow-600",
    },
    {
      label: "Configurações",
      icon: Settings,
      page: "config",
      color: "text-gray-600",
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-20
                  bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r 
                  border-gray-200 dark:border-gray-700 shadow-xl flex flex-col py-6 
                  transition-all duration-300
                  ${sidebarOpen ? "w-64" : "w-20"}`}
    >

      {/* TÍTULO */}
      <div
        className={`
          px-4 mb-6 overflow-hidden transition-all duration-300 transform
          ${sidebarOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}
        `}
      >
        <h1 className="text-lg font-bold text-blue-700 dark:text-blue-300 tracking-wide text-center">
          💠 AquaStore – {user.role.toUpperCase()}
        </h1>
      </div>

      {/* LISTA DE MENUS */}
      <nav className="flex flex-col gap-2 px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.page;

          return (
            <button
              key={item.page}
              onClick={() => onChangePage(item.page)}
              className={`
                flex items-center px-4 py-3 rounded-xl transition-all group shadow-sm
                ${isActive
                  ? "bg-blue-600 text-white shadow-lg scale-[1.02]"
                  : "bg-white/70 dark:bg-gray-800/70 hover:bg-blue-100 dark:hover:bg-gray-700"}
              `}
            >
              {/* ÍCONE */}
              <Icon
                className={`
                  transition-transform duration-300
                  ${sidebarOpen ? "scale-100" : "scale-150"}
                  ${isActive ? "text-white" : item.color}
                `}
              />

              {/* TEXTO */}
              <span
                className={`
                  ml-3 font-medium whitespace-nowrap transition-all duration-300
                  ${sidebarOpen ? "opacity-100" : "opacity-0 w-0 ml-0"}
                  ${isActive ? "text-white" : "text-gray-800 dark:text-gray-300"}
                `}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
