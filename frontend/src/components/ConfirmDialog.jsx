import React from "react";

export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-80 text-center border border-gray-200 animate-scale-in">
        <h2 className="text-lg font-bold mb-2 text-gray-800">Confirmação</h2>

        <p className="text-gray-600 mb-5 leading-relaxed">{message}</p>

        <div className="flex justify-center gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white shadow-md transition"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
