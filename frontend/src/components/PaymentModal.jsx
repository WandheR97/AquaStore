import React, { useState } from "react";

export default function PaymentModal({ total, onCancel, onConfirm }) {
  const [method, setMethod] = useState("dinheiro");
  const [cashGiven, setCashGiven] = useState("");

  const troco = Math.max(
    0,
    parseFloat((cashGiven + "").replace(",", ".") || 0) - total
  ).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-7 w-[650px] border border-gray-200 animate-scale-in">
        
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Pagamento</h2>

        <div className="flex flex-wrap gap-3 mb-6">
          {[
            ["dinheiro", "💵 Dinheiro"],
            ["pix", "⚡ Pix"],
            ["credito", "💳 Crédito"],
            ["debito", "💳 Débito"],
            ["pendente", "🕒 Pendente"],
            ["interno", "🏢 Uso Interno"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setMethod(value)}
              className={`px-4 py-2 rounded-lg border font-medium transition ${
                method === value
                  ? "bg-blue-100 border-blue-600 shadow"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="text-xl font-bold mb-5 text-blue-700">
          Total: R$ {total.toFixed(2)}
        </div>

        {method === "dinheiro" && (
          <div className="mb-6">
            <label className="block text-sm text-gray-700 mb-1 font-medium">
              Valor entregue
            </label>
            <input
              value={cashGiven}
              onChange={(e) => setCashGiven(e.target.value)}
              className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ex: 100.00"
            />
            <p className="mt-2 text-gray-700">
              Troco: <strong className="text-green-700">R$ {troco}</strong>
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg transition"
          >
            Cancelar
          </button>

          <button
            onClick={() =>
              onConfirm(method, parseFloat(cashGiven.replace(",", ".")) || 0)
            }
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold shadow-md transition"
          >
            Confirmar (F4)
          </button>
        </div>
      </div>
    </div>
  );
}
