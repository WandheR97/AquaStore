// frontend/src/components/DeliveredProducts.jsx
import React, { useEffect, useState } from "react";

export default function DeliveredProducts({ poolSale }) {
  const [products, setProducts] = useState([]);
  const [observacaoGeral, setObservacaoGeral] = useState("");

  // 🟢 Produtos padrão (pode ajustar a lista conforme necessário)
  const productList = [
    "Casa de Máquina",
    "Flange de Passagem",
    "Bomba",
    "Filtro",
    "Cascata",
    "Peneira de Limpeza",
    "Cabo de Alumínio",
    "Carrinho Aspiração",
    "Escovão",
    "Mangueira",
    "Bocal de Mangueira",
    "Dispositivo Hidromassagem",
    "Dispositivo de Retorno",
    "Dispositivo de Aspiração",
    "Nicho",
    "LED",
    "Central de Comando",
    "Fonte",
    "Barrilha",
    "Sulfato",
    "Balde de Cloro",
    "Pedra de Cloro",
    "Flutuador",
    "Areia",
    "Skimmer",
  ];

  // 🔹 Busca dados salvos ao abrir o componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/pool-sales/${poolSale.id}/delivered-products`
        );
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
          setObservacaoGeral(data.observacaoGeral || "");
        }
      } catch (err) {
        console.error("Erro ao carregar produtos entregues:", err);
      }
    };
    fetchData();
  }, [poolSale.id]);

  // 🔸 Atualiza produto e salva no backend automaticamente
  const handleProductChange = async (name, checked, observacao) => {
    const updated = products.filter((p) => p.name !== name);
    if (checked || observacao) {
      updated.push({ name, checked, observacao });
    }
    setProducts(updated);

    try {
      await fetch(
        `http://localhost:5000/pool-sales/${poolSale.id}/delivered-products`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ products: updated, observacaoGeral }),
        }
      );
    } catch (err) {
      console.error("Erro ao salvar produto entregue:", err);
    }
  };

  // 🔸 Atualiza observação geral e salva
  const handleObservacaoChange = async (text) => {
    setObservacaoGeral(text);
    try {
      await fetch(
        `http://localhost:5000/pool-sales/${poolSale.id}/delivered-products`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ products, observacaoGeral: text }),
        }
      );
    } catch (err) {
      console.error("Erro ao salvar observação geral:", err);
    }
  };

  return (
    <div className="mt-4">
      <details className="border border-gray-300 rounded-xl overflow-hidden shadow-sm">
        <summary className="cursor-pointer px-4 py-3 bg-blue-100 text-blue-800 font-semibold select-none text-lg border-b border-blue-200">
          📦 Produtos Entregues
        </summary>

        <div className="p-4 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productList.map((produto) => {
              const saved = products.find((p) => p.name === produto);
              return (
                <div
                  key={produto}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 shadow-sm"
                >
                  <input
                    type="checkbox"
                    checked={saved?.checked || false}
                    onChange={(e) =>
                      handleProductChange(produto, e.target.checked, saved?.observacao)
                    }
                    className="accent-blue-600 w-4 h-4"
                  />

                  <span className="text-gray-700 font-medium flex-1">{produto}</span>

                  <textarea
                    placeholder="Obs..."
                    value={saved?.observacao || ""}
                    onChange={(e) =>
                      handleProductChange(
                        produto,
                        saved?.checked || false,
                        e.target.value
                      )
                    }
                    className="border border-gray-300 rounded-md text-sm p-2 w-40 resize-none bg-white shadow-inner"
                    style={{ height: "32px" }}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <label className="block text-gray-700 font-semibold mb-2">
              📝 Observações gerais:
            </label>

            <textarea
              placeholder="Escreva observações sobre a entrega..."
              value={observacaoGeral}
              onChange={(e) => handleObservacaoChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none bg-gray-50 shadow-inner"
              style={{ height: "120px" }}
            />
          </div>
        </div>
      </details>
    </div>
  );
}
