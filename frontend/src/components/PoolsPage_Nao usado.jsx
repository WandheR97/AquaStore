import React, { useState, useEffect } from "react";
import PoolModal from "./PoolModal";
import Notification from "./Notification";
import api from "../api";

export default function PoolsPage() {
  const [pools, setPools] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [notification, setNotification] = useState({ message: "", type: "" });

  const loadPools = async () => {
    const data = await api.getPools();
    setPools(data);
  };

  useEffect(() => {
    loadPools();
  }, []);

  const handleSuccess = (message, type) => {
    setNotification({ message, type });
    loadPools();
  };

  return (
    <div className="p-6">
      {notification.message && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ message: "", type: "" })}
        />
      )}

      <h1 className="text-2xl font-bold mb-4">Piscinas</h1>
      <button
        onClick={() => {
          setEditingItem(null);
          setShowModal(true);
        }}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Nova Piscina
      </button>

      {showModal && (
        <PoolModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
          editingItem={editingItem}
        />
      )}

      <div className="mt-6">
        {pools.map((pool) => (
          <div key={pool.id} className="p-3 border rounded mb-2 flex justify-between">
            <div>{pool.model} - {pool.brand}</div>
            <button
              onClick={() => {
                setEditingItem(pool);
                setShowModal(true);
              }}
              className="text-blue-600"
            >
              Editar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
