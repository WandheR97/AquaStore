import React, { useEffect, useState } from "react";
import api from "../api";
import { Trash2, Pencil, Plus } from "lucide-react";
import SellerModal from "./SellerConfigModal";
import ConfirmDialog from "./ConfirmDialog";

export default function ConfigVendedores() {
  const [vendedores, setVendedores] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSeller, setEditingSeller] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchVendedores = async () => {
    const data = await api.getSellersConfig();
    setVendedores(data);
  };

  useEffect(() => {
    fetchVendedores();
  }, []);

  const handleAdd = () => {
    setEditingSeller(null);
    setShowModal(true);
  };

  const handleEdit = (vendedor) => {
    setEditingSeller(vendedor);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    setConfirmDelete(id);
  };

  const confirmDeletion = async () => {
    await api.deleteSellerConfig(confirmDelete);
    setConfirmDelete(null);
    fetchVendedores();
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-800">🧾 Vendedores</h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-md transition"
        >
          <Plus size={16} /> Novo vendedor
        </button>
      </div>

      {vendedores.length === 0 ? (
        <p className="text-gray-500 text-sm italic bg-gray-50 p-3 rounded-lg text-center">
          Nenhum vendedor cadastrado.
        </p>
      ) : (
        vendedores.map((v) => (
          <div
            key={v.id}
            className="flex justify-between items-center bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-3 mb-2 transition"
          >
            <div>
              <span className="font-semibold text-gray-800">{v.nome}</span>
              {v.telefone && (
                <span className="text-sm text-gray-500 ml-2">({v.telefone})</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleEdit(v)}
                className="text-blue-600 hover:text-blue-800"
              >
                <Pencil size={20} />
              </button>
              <button
                onClick={() => handleDelete(v.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))
      )}

      {showModal && (
        <SellerModal
          onClose={() => setShowModal(false)}
          onSaved={fetchVendedores}
          seller={editingSeller}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          message="Tem certeza que deseja excluir este vendedor?"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmDeletion}
        />
      )}
    </div>
  );
}
