// frontend/src/components/SaleDetailsModal.jsx
import React from "react";

export default function SaleDetailsModal({ sale, onClose }) {
  if (!sale) return null;

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center pointer-events-auto">
      {/* OVERLAY COM BLUR */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* CONTEÚDO DO MODAL */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-[95%] max-w-xl animate-fade border border-gray-200 z-[999999]">
        <h2 className="text-2xl font-bold text-blue-700 mb-4">
          Detalhes da Venda #{sale.id}
        </h2>

        <p className="text-gray-700 mb-2">
          <strong>Data:</strong> {formatDate(sale.created_at)}
        </p>

        <p className="text-gray-700 mb-2">
          <strong>Vendedor:</strong> {sale.seller_name || "-"}
        </p>

        <p className="text-gray-700 mb-4">
          <strong>Método de Pagamento:</strong> {sale.payment_method}
        </p>

        <h3 className="font-semibold text-gray-800 mb-2">Itens vendidos:</h3>

        <div className="max-h-60 overflow-y-auto pr-2">
          {sale.items?.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center text-sm py-2 border-b border-gray-200"
            >
              <span>{item.name} x{item.qty}</span>
              <span>R$ {(item.unit_price * item.qty).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-between items-center">
          <span className="font-bold text-lg text-green-700">
            Total: R$ {Number(sale.total).toFixed(2)}
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
