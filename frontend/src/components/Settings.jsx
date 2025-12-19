import React, { useState, useEffect } from "react";

import BrandModal from "../components/BrandModal";
import PoolBrandModal from "../components/PoolBrandModal";
import InstallerModal from "../components/InstallerModal";

import ConfirmModal from "../components/ConfirmModal";
import * as api from "../api";

import { Plus, Pencil, Trash2 } from "lucide-react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("brands");

  const [brands, setBrands] = useState([]);
  const [poolBrands, setPoolBrands] = useState([]);
  const [installers, setInstallers] = useState([]);

  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedPoolBrand, setSelectedPoolBrand] = useState(null);
  const [selectedInstaller, setSelectedInstaller] = useState(null);

  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showPoolBrandModal, setShowPoolBrandModal] = useState(false);
  const [showInstallerModal, setShowInstallerModal] = useState(false);

  const [confirmData, setConfirmData] = useState(null);

  const loadData = async () => {
    try {
      const [brandsRes, poolBrandsRes, installersRes] = await Promise.all([
        api.getBrands(),
        api.getPoolBrands(),
        api.getInstallers(),
      ]);

      setBrands(brandsRes || []);
      setPoolBrands(poolBrandsRes || []);
      setInstallers(installersRes || []);
    } catch (err) {
      console.error(err);
      alert("❌ Erro ao carregar dados.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = (type, id) => {
    setConfirmData({ type, id, message: "Tem certeza que deseja excluir este item?" });
  };

  const confirmDelete = async () => {
    if (!confirmData) return;

    try {
      if (confirmData.type === "brands") await api.deleteBrand(confirmData.id);
      if (confirmData.type === "poolBrands") await api.deletePoolBrand(confirmData.id);
      if (confirmData.type === "installers") await api.deleteInstaller(confirmData.id);

      await loadData();
    } catch (err) {
      alert("Erro ao excluir.");
    } finally {
      setConfirmData(null);
    }
  };

  // --------------------------
  // COMPONENTE DE TABELA PREMIUM
  // --------------------------
  const PremiumTable = ({ columns, data, onEdit, onDelete }) => (
    <div className="overflow-hidden rounded-2xl shadow-xl bg-white/80 backdrop-blur-lg border border-gray-200 animate-fade">
      <table className="w-full text-sm">
        <thead className="bg-gradient-to-r from-blue-100 to-blue-200 text-gray-700">
          <tr>
            {columns.map((c) => (
              <th key={c} className="p-3 text-left font-semibold">
                {c}
              </th>
            ))}
            <th className="p-3 text-right font-semibold">Ações</th>
          </tr>
        </thead>

        <tbody>
          {data?.length ? (
            data.map((item) => (
              <tr
                key={item.id}
                className="border-b border-gray-200 hover:bg-blue-50/50 transition-all hover:shadow-sm hover:scale-[1.01] animate-fade-soft"
              >
                {Object.entries(item).map(([key, value], index) =>
                  key !== "id" ? (
                    <td key={index} className="p-3">
                      {value || "-"}
                    </td>
                  ) : null
                )}

                <td className="p-3 text-right space-x-3">
                  <button
                    onClick={() => onEdit(item)}
                    className="text-blue-600 hover:text-blue-800 transition text-lg"
                  >
                    <Pencil size={20} />
                  </button>

                  <button
                    onClick={() => onDelete(item)}
                    className="text-red-600 hover:text-red-800 transition text-lg"
                  >
                    <Trash2 size={20} />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length + 1} className="p-4 text-center text-gray-500">
                Nenhum item encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 animate-slide-up">
        <h1 className="text-3xl font-bold text-blue-700">⚙️ Configurações</h1>
      </div>

      {/* CARDS DE INFORMAÇÃO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white/80 backdrop-blur shadow-md rounded-2xl p-4 border border-gray-200
                        hover:shadow-lg hover:-translate-y-1 transition-all animate-fade-soft">
          <p className="text-gray-500 text-sm">Marcas de Produtos</p>
          <h3 className="text-2xl font-bold text-blue-600">{brands.length}</h3>
        </div>

        <div className="bg-white/80 backdrop-blur shadow-md rounded-2xl p-4 border border-gray-200
                        hover:shadow-lg hover:-translate-y-1 transition-all animate-fade-soft">
          <p className="text-gray-500 text-sm">Marcas de Piscinas</p>
          <h3 className="text-2xl font-bold text-cyan-600">{poolBrands.length}</h3>
        </div>

        <div className="bg-white/80 backdrop-blur shadow-md rounded-2xl p-4 border border-gray-200
                        hover:shadow-lg hover:-translate-y-1 transition-all animate-fade-soft">
          <p className="text-gray-500 text-sm">Instaladores</p>
          <h3 className="text-2xl font-bold text-green-600">{installers.length}</h3>
        </div>
      </div>

      {/* TABS PREMIUM */}
      <div className="flex flex-wrap gap-3 mb-8">
        {[
          { id: "brands", label: "Marca Produtos" },
          { id: "poolBrands", label: "Marca Piscinas" },
          { id: "installers", label: "Instaladores" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl shadow-md transition-all font-medium
                       ${
                         activeTab === tab.id
                           ? "bg-blue-600 text-white scale-[1.03] shadow-lg"
                           : "bg-white/60 backdrop-blur border border-gray-300 text-gray-700 hover:bg-gray-100"
                       }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ---------------------------- */}
      {/* TABELA MARCAS DE PRODUTOS */}
      {/* ---------------------------- */}
      {activeTab === "brands" && (
        <div className="animate-fade">
          <button
            onClick={() => {
              setSelectedBrand(null);
              setShowBrandModal(true);
            }}
            className="mb-4 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md
                       hover:shadow-lg transition-all transform hover:scale-[1.02]"
          >
            <Plus className="inline mr-1" size={20} /> Nova Marca
          </button>

          <PremiumTable
            columns={["Nome", "Fornecedor"]}
            data={brands.map((b) => ({
              id: b.id,
              name: b.name,
              supplier: b.supplier,
            }))}
            onEdit={(b) => {
              setSelectedBrand(b);
              setShowBrandModal(true);
            }}
            onDelete={(b) => handleDelete("brands", b.id)}
          />
        </div>
      )}

      {/* ---------------------------- */}
      {/* TABELA MARCAS DE PISCINAS */}
      {/* ---------------------------- */}
      {activeTab === "poolBrands" && (
        <div className="animate-fade">
          <button
            onClick={() => {
              setSelectedPoolBrand(null);
              setShowPoolBrandModal(true);
            }}
            className="mb-4 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md
                       hover:shadow-lg transition-all transform hover:scale-[1.02]"
          >
            <Plus className="inline mr-1" size={20} /> Nova Marca de Piscina
          </button>

          <PremiumTable
            columns={["Nome", "Fornecedor"]}
            data={poolBrands.map((b) => ({
              id: b.id,
              name: b.name,
              supplier: b.supplier,
            }))}
            onEdit={(b) => {
              setSelectedPoolBrand(b);
              setShowPoolBrandModal(true);
            }}
            onDelete={(b) => handleDelete("poolBrands", b.id)}
          />
        </div>
      )}

      {/* ---------------------------- */}
      {/* TABELA INSTALADORES */}
      {/* ---------------------------- */}
      {activeTab === "installers" && (
        <div className="animate-fade">
          <button
            onClick={() => {
              setSelectedInstaller(null);
              setShowInstallerModal(true);
            }}
            className="mb-4 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md
                       hover:shadow-lg transition-all transform hover:scale-[1.02]"
          >
            <Plus className="inline mr-1" size={20} /> Novo Instalador
          </button>

          <PremiumTable
            columns={["Nome", "Contato"]}
            data={installers.map((i) => ({
              id: i.id,
              name: i.name,
              contact: i.contact,
            }))}
            onEdit={(i) => {
              setSelectedInstaller(i);
              setShowInstallerModal(true);
            }}
            onDelete={(i) => handleDelete("installers", i.id)}
          />
        </div>
      )}

      {/* MODAIS */}
      {showBrandModal && (
        <BrandModal
          onClose={() => setShowBrandModal(false)}
          onSaved={loadData}
          brand={selectedBrand}
        />
      )}

      {showPoolBrandModal && (
        <PoolBrandModal
          onClose={() => setShowPoolBrandModal(false)}
          onSaved={loadData}
          brand={selectedPoolBrand}
        />
      )}

      {showInstallerModal && (
        <InstallerModal
          onClose={() => setShowInstallerModal(false)}
          onSaved={loadData}
          installer={selectedInstaller}
        />
      )}

      {confirmData && (
        <ConfirmModal
          message={confirmData.message}
          onCancel={() => setConfirmData(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
