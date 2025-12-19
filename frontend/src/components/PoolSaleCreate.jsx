import React from "react";
import PoolSale from "./PoolSale";

export default function PoolSaleCreate({ onClose, onCreated }) {
  return (
    <div className="relative bg-white w-[95%] max-w-3xl p-6 rounded-3xl shadow-2xl max-h-[95vh] overflow-y-auto custom-scroll">
      <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center">
        🏊 Nova Venda de Piscina
      </h2>

      <PoolSale
        initialData={null}            // criação
        onCancel={onClose}            // fecha modal
        onSuccess={async () => {      // ao salvar
          await onCreated();          // atualiza dados + fecha modal
          onClose();                  // garante fechamento
        }}
      />
    </div>
  );
}
