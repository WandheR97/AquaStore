import React, { useState, useEffect } from "react";
import api from "../api";

import OwnerModal from "./OwnerModal";
import SellerModal from "./SellerModal";
import SellerEditModal from "./SellerEditModal";
import OwnerEditModal from "./OwnerEditModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

import { Trash2, Pencil, Plus } from "lucide-react";

export default function Users() {
  const [owners, setOwners] = useState([]);
  const [sellers, setSellers] = useState({});
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 2500);
      return () => clearTimeout(t);
    }
  }, [notification]);

  // Modais
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);

  // Edição
  const [editingOwner, setEditingOwner] = useState(null);
  const [editingSeller, setEditingSeller] = useState(null);
  const [editingSellerOwnerId, setEditingSellerOwnerId] = useState(null);

  // Dono do novo vendedor
  const [currentOwnerId, setCurrentOwnerId] = useState(null);

  // Exclusão
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Usuário logado
  const currentUser = {
    id: Number(localStorage.getItem("id")) || null,
    username: localStorage.getItem("username") || "",
    role: localStorage.getItem("role") || "",
  };

  // ===============================
  // FETCH OWNERS + SELLERS
  // ===============================
  const loadData = async () => {
    try {
      const ownersData = await api.getOwners();
      setOwners(ownersData);

      const sellerData = {};
      for (const owner of ownersData) {
        const data = await api.getSellersByOwner(owner.id);
        sellerData[owner.id] = data;
      }

      setSellers(sellerData);
    } catch {
      setNotification({
        message: "❌ Erro ao carregar dados.",
        type: "error",
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ===============================
  // DELETE OWNER OR SELLER
  // ===============================
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === "owner") {
        await api.deleteOwner(deleteTarget.id);

        setOwners((prev) => prev.filter((o) => o.id !== deleteTarget.id));

        const updated = { ...sellers };
        delete updated[deleteTarget.id];
        setSellers(updated);

        setNotification({
          message: "✔ Proprietário excluído!",
          type: "success",
        });
      } else {
        await api.deleteSeller(deleteTarget.id);

        setSellers((prev) => ({
          ...prev,
          [deleteTarget.ownerId]: prev[deleteTarget.ownerId]?.filter(
            (s) => s.id !== deleteTarget.id
          ) || [],
        }));

        setNotification({
          message: "✔ Vendedor excluído!",
          type: "success",
        });
      }
    } catch {
      setNotification({
        message: "Erro ao excluir.",
        type: "error",
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  // ===============================
  // FILTER OWNERS
  // ===============================
  const visibleOwners = owners.filter((o) => {
    if (currentUser.role === "host") return true;
    if (currentUser.role === "proprietario") return o.id === currentUser.id;
    return false;
  });

  // ===============================
  // RENDER
  // ===============================
  return (
  <>
    <div className="p-6 max-w-7xl mx-auto animate-fade">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 animate-slide-up">
        <h1 className="text-3xl font-bold text-blue-700">Gerenciar Usuários</h1>

        {currentUser.role === "host" && (
          <button
            onClick={() => setShowOwnerModal(true)}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 
                       text-white rounded-xl font-medium shadow-md hover:shadow-lg
                       transition-all transform hover:scale-[1.02]"
          >
            <Plus className="inline mr-1" size={20} /> Novo Proprietário
          </button>
        )}
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

        <div className="bg-white/80 backdrop-blur shadow-md rounded-2xl p-4 border border-gray-200">
          <p className="text-gray-500 text-sm">Total de Proprietários</p>
          <h3 className="text-2xl font-bold text-blue-600">{visibleOwners.length}</h3>
        </div>

        <div className="bg-white/80 backdrop-blur shadow-md rounded-2xl p-4 border border-gray-200">
          <p className="text-gray-500 text-sm">Total de Vendedores</p>
          <h3 className="text-2xl font-bold text-green-600">
            {Object.values(sellers).flat().length}
          </h3>
        </div>

        <div className="bg-white/80 backdrop-blur shadow-md rounded-2xl p-4 border border-gray-200">
          <p className="text-gray-500 text-sm">Última atualização</p>
          <h3 className="text-lg font-semibold text-gray-700">
            {new Date().toLocaleDateString()}
          </h3>
        </div>

      </div>

      {/* TABELA */}
      <div className="overflow-hidden rounded-2xl shadow-xl bg-white/80 backdrop-blur-lg border border-gray-200 animate-fade">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-blue-100 to-blue-200 text-gray-700">
            <tr>
              <th className="p-3 text-left font-semibold">Proprietário</th>
              <th className="p-3 text-center font-semibold">Vendedores</th>
              <th className="p-3 text-right font-semibold">Ações</th>
            </tr>
          </thead>

          <tbody>

            {visibleOwners.map((owner) => (
              <React.Fragment key={owner.id}>

                <tr className="border-b border-gray-200 hover:bg-blue-50/50 transition-all hover:shadow-sm hover:scale-[1.01]">
                  <td className="p-3 font-medium text-blue-700">{owner.username}</td>

                  <td className="p-3 text-center font-semibold text-gray-700">
                    {sellers[owner.id]?.length ?? 0}
                  </td>

                  <td className="p-3 text-right space-x-3">
                    {currentUser.role === "host" && (
                      <>
                        <button
                          onClick={() => setEditingOwner(owner)}
                          className="text-blue-600 hover:text-blue-800 transition"
                        >
                          <Pencil size={20} />
                        </button>

                        <button
                          onClick={() =>
                            setDeleteTarget({
                              type: "owner",
                              id: owner.id,
                              name: owner.username,
                            })
                          }
                          className="text-red-600 hover:text-red-800 transition"
                        >
                          <Trash2 size={20} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>

                {/* VENDEDORES */}
                <tr className="bg-gray-50/80 animate-fade-soft">
                  <td colSpan="3" className="p-4">

                    <button
                      onClick={() => {
                        setCurrentOwnerId(owner.id);
                        setShowSellerModal(true);
                      }}
                      className="mb-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white 
                                 rounded-xl shadow-md transition-all"
                    >
                      <Plus size={16} className="inline mr-2" /> Novo vendedor
                    </button>

                    <div className="space-y-2">
                      {!sellers[owner.id] || sellers[owner.id].length === 0 ? (
                        <p className="text-gray-500 italic">Nenhum vendedor cadastrado.</p>
                      ) : (
                        sellers[owner.id].map((seller) => (
                          <div
                            key={seller.id}
                            className="flex justify-between items-center p-3 bg-white rounded-xl 
                                       shadow-sm border border-gray-200 hover:bg-blue-50 transition"
                          >
                            <span className="font-medium text-gray-700">{seller.username}</span>

                            <div className="flex items-center gap-3">
                              {(currentUser.role === "host" ||
                                currentUser.id === owner.id) && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingSeller(seller);
                                      setEditingSellerOwnerId(owner.id);
                                    }}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <Pencil size={18} />
                                  </button>

                                  <button
                                    onClick={() =>
                                      setDeleteTarget({
                                        type: "seller",
                                        id: seller.id,
                                        ownerId: owner.id,
                                        name: seller.username,
                                      })
                                    }
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                  </td>
                </tr>

              </React.Fragment>
            ))}

          </tbody>
        </table>
      </div>

      {/* MODAIS */}
      <div className="fixed inset-0 z-[999999] pointer-events-none">

        {showOwnerModal && (
          <OwnerModal
            onClose={() => {
              setShowOwnerModal(false);
              loadData();
            }}
          />
        )}

        {showSellerModal && (
          <SellerModal
            ownerId={currentOwnerId}
            onClose={() => setShowSellerModal(false)}
            onSaved={async () => {
              const updated = await api.getSellersByOwner(currentOwnerId);
              setSellers((prev) => ({ ...prev, [currentOwnerId]: updated }));

              setNotification({
                message: "✔ Vendedor cadastrado!",
                type: "success",
              });

              setShowSellerModal(false);
            }}
          />
        )}

        {editingOwner && (
          <OwnerEditModal
            owner={editingOwner}
            onClose={() => setEditingOwner(null)}
            onSave={async () => {
              await loadData();
              setEditingOwner(null);
            }}
          />
        )}

        {editingSeller && (
          <SellerEditModal
            seller={editingSeller}
            onClose={() => setEditingSeller(null)}
            onSave={async () => {
              const updated = await api.getSellersByOwner(editingSellerOwnerId);
              setSellers((prev) => ({
                ...prev,
                [editingSellerOwnerId]: updated,
              }));

              setNotification({
                message: "Cadastro atualizado!",
                type: "success",
              });

              setEditingSeller(null);
              setEditingSellerOwnerId(null);
            }}
          />
        )}


        {deleteTarget && (
          <ConfirmDeleteModal
            isOpen={true}
            title="Confirmar exclusão"
            message={`Deseja excluir ${
              deleteTarget.type === "owner" ? "o proprietário" : "o vendedor"
            } "${deleteTarget.name}"?`}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={handleConfirmDelete}
          />
        )}

      </div>
    </div>
  </>
  );
}