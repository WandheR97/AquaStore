import React, { useState, useEffect, useRef } from "react";
import * as api from "../api";

export default function PoolSale({ initialData, onCancel, onSuccess }) {

  const [pools, setPools] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [installers, setInstallers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPool, setSelectedPool] = useState(null);
  const [message, setMessage] = useState("");
  const searchRef = useRef(null);

  // ✅ Correto: declarar só uma vez
  const isEditing = !!initialData;
  const existingSale = initialData ?? null;

  // 🔹 Preenche automaticamente o formulário ao editar uma venda existente
  useEffect(() => {
  if (initialData) {
    const existingSale = initialData;
      let inclusos = {};
      let garantias = {};

      // tenta converter os JSONs salvos do banco
      try {
        inclusos = existingSale.produtos_inclusos
          ? JSON.parse(existingSale.produtos_inclusos)
          : {};
      } catch {
        inclusos = {};
      }

      try {
        garantias = {
          "3 meses": existingSale.garantia_3_meses
            ? { ativo: true, texto: existingSale.garantia_3_meses }
            : { ativo: false, texto: "" },
          "12 meses": existingSale.garantia_12_meses
            ? { ativo: true, texto: existingSale.garantia_12_meses }
            : { ativo: false, texto: "" },
        };
      } catch {
        garantias = {};
      }

      // tenta identificar a piscina correta da lista para atualizar automaticamente o valor
      const pool = pools.find(
        (p) =>
          existingSale.produto?.includes(p.model) &&
          existingSale.marca?.toLowerCase() === p.brand?.toLowerCase()
      );

      setSelectedPool(pool || null);

      setForm((prev) => ({
        ...prev,
        nome: existingSale.cliente ?? "",
        cpf: existingSale.cpf ?? "",
        rg: existingSale.rg ?? "",
        telefone: existingSale.telefone ?? "",
        endereco: existingSale.endereco ?? "",
        numero: existingSale.numero_casa ?? "",
        referencia: existingSale.referencia ?? prev.referencia ?? "",
        cep: existingSale.cep ?? "",
        bairro: existingSale.bairro ?? "",
        cidade: existingSale.cidade ?? "",
        produto: existingSale.produto ?? "",
        marca: existingSale.marca ?? "",
        garantia: existingSale.garantia_fabrica ?? "",
        cor: existingSale.cor ?? "Azul",
        pastilha: existingSale.pastilha ?? "Não",
        tipoPastilha: existingSale.tipo_pastilha ?? "",
        valor: existingSale.valor_total ?? pool?.sale_price ?? "",
        entrada: existingSale.entrada ?? "",
        instalador: existingSale.instalador ?? "",
        vendedor: existingSale.vendedor ?? "",
        formaPagamento: existingSale.pagamento ?? "",
        obsPagamento: existingSale.observacoes_pagamento ?? "",
        observacoes: existingSale.observacoes ?? prev.observacoes ?? "",
        obsIncluso: existingSale.obs_incluso ?? "",
        prazo: existingSale.prazo_entrega ?? "",
        dataVenda: existingSale.data_venda
          ? existingSale.data_venda.split("T")[0]
          : new Date().toISOString().split("T")[0],
        incluso: inclusos,
        garantias,
      }));
    }
  }, [initialData, pools]);

  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    rg: "",
    telefone: "",
    endereco: "",
    referencia: "",
    cep: "",
    bairro: "",
    numero: "",
    cidade: "",
    dataVenda: new Date().toISOString().split("T")[0],
    produto: "",
    marca: "",
    garantia: "",
    cor: "",
    pastilha: "Não",
    tipoPastilha: "",
    valor: "",
    incluso: {},
    garantias: {},
    observacoes: "",
    prazo: "",
    entrada: "",
    formaPagamento: "",
    obsPagamento: "",
    obsIncluso: "",
    instalador: "",
    vendedor: "",
  });

  // 🔹 Carrega piscinas e vendedores ao iniciar
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [poolsData, installersData] = await Promise.all([
          api.getPools(),
          api.getInstallers(),
        ]);

        setPools(poolsData || []);
        setInstallers(installersData || []);

        // 🔹 Busca o usuário logado
        const user = JSON.parse(localStorage.getItem("user")) || {
          id: localStorage.getItem("id"),
          username: localStorage.getItem("username"),
          role: localStorage.getItem("role"),
          owner_id: localStorage.getItem("owner_id"),
        };

        // 🔹 Busca vendedores do proprietário
        let sellersList = [];

        if (user.role === "host") {
          // Host vê todos
          sellersList = await api.request("/api/sellers");
        } else if (user.role === "proprietario") {
          sellersList = await api.request(`/api/sellers?owner_id=${user.id}`);
        } else if (user.role === "vendedor") {
          sellersList = await api.request(`/api/sellers?owner_id=${user.owner_id}`);
        }

        // 🔹 Adiciona o próprio proprietário como opção
          if ((user.role === "proprietario" || user.role === "vendedor") && (user.owner_id || user.id)) {
            const ownerId = user.role === "proprietario" ? user.id : user.owner_id;
            try {
              const owner = await api.request(`/api/owners/${ownerId}`);
              if (owner && !sellersList.some(s => s.id === owner.id)) {
  
              // limpa nome
              let ownerName = (owner.username || owner.name || "").trim();

              // se ainda estiver vazio, define padrão
              if (!ownerName) ownerName = "Proprietário";

              sellersList.push({
                id: owner.id,
                nome: ownerName,
                isOwner: true,
              });
            }

            } catch (err) {
              console.warn("⚠️ Não foi possível adicionar o proprietário:", err);
            }
          }
                  
        setSellers(
          (sellersList || []).map(s => ({
            ...s,
            nome: (s.nome || s.username || s.name || "").trim(),
          }))
        );
        console.log("👥 Vendedores disponíveis:", sellersList);
      } catch (err) {
        console.error("Erro ao carregar piscinas ou vendedores:", err);
      }
    };

    fetchData();
  }, []);

// 🧠 Atualiza valor automaticamente conforme cor e pastilha (também ao editar)
useEffect(() => {
  if (!selectedPool) return;

  let novoValor = selectedPool.sale_price; // padrão azul sem pastilha

  if (form.cor === "Branca" && form.pastilha === "Sim") {
    novoValor =
      selectedPool.sale_white_with_tile ||
      selectedPool.sale_white ||
      selectedPool.sale_price;
  } else if (form.cor === "Branca" && form.pastilha === "Não") {
    novoValor = selectedPool.sale_white || selectedPool.sale_price;
  } else if (form.cor === "Azul" && form.pastilha === "Sim") {
    novoValor = selectedPool.sale_with_tile || selectedPool.sale_price;
  }

  // só atualiza se o valor for diferente do atual
  setForm((prev) => {
    if (String(prev.valor) !== String(novoValor)) {
      return { ...prev, valor: novoValor };
    }
    return prev;
  });
}, [form.cor, form.pastilha, selectedPool]);

  // 🔹 Selecionar piscina
  const handleSelect = (pool) => {
    setSelectedPool(pool);
    setForm((f) => ({
      ...f,
      produto: `Piscina ${pool.model} (${pool.length} x ${pool.width} x ${pool.depth})`,
      marca: pool.brand,
      garantia: "",
      valor: pool.sale_price || "",
      cor: "Azul", // padrão
      pastilha: "Não",
      tipoPastilha: "",
    }));
    setSearch("");
    searchRef.current?.blur();
  };

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleColorSelect = (cor) => {
    setForm((f) => ({ ...f, cor }));
  };

  const handlePastilhaSelect = (valor) => {
    setForm((f) => ({
      ...f,
      pastilha: valor,
      tipoPastilha: valor === "Não" ? "" : f.tipoPastilha,
    }));
  };

  const handleTipoPastilha = (tipo) => {
    setForm((f) => ({ ...f, tipoPastilha: tipo }));
  };

  const handleInclusoChange = (item, checked, text = "") => {
    setForm((f) => ({
      ...f,
      incluso: {
        ...f.incluso,
        [item]: { ativo: checked, texto: text },
      },
    }));
  };

  const handleGarantiaChange = (tipo, checked, texto = "") => {
    setForm((f) => ({
      ...f,
      garantias: {
        ...f.garantias,
        [tipo]: { ativo: checked, texto },
      },
    }));
  };

  const handleSubmit = async () => {
    if (!form.nome || !form.produto || !form.valor) {
      setMessage("⚠️ Preencha nome, produto e valor.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    const payload = {
      cliente: form.nome,
      cpf: form.cpf,
      rg: form.rg,
      telefone: form.telefone,
      endereco: form.endereco,
      numero_casa: form.numero,
      referencia: form.referencia,
      cep: form.cep,
      bairro: form.bairro,
      cidade: form.cidade,
      produto: form.produto,
      marca: form.marca,
      garantia_fabrica: form.garantia,
      garantia_3_meses: form.garantias["3 meses"]?.texto || "",
      garantia_12_meses: form.garantias["12 meses"]?.texto || "",
      produtos_inclusos: JSON.stringify(form.incluso || {}),
      obs_incluso: form.obsIncluso,
      observacoes_pagamento: form.obsPagamento,
      pagamento: form.formaPagamento, // <-- AGORA É CORRETO
      cor: form.cor,
      pastilha: form.pastilha,
      tipo_pastilha: form.tipoPastilha,
      valor_total: Number(form.valor),
      entrada: Number(form.entrada) || 0,
      instalador: form.instalador,
      vendedor: form.vendedor,
      observacoes: form.observacoes,
      prazo_entrega: form.prazo,
      data_venda: form.dataVenda,
      status: "aguardando",
    };

    try {
      let url = "http://localhost:5000/pool-sales";
      let method = "POST";

      if (isEditing) {
        if (!existingSale?.id) {
          console.error("❌ ERRO: existingSale.id está vazio na edição!");
          setMessage("❌ Erro interno: ID da venda não encontrado.");
          return;
        }

        url = `http://localhost:5000/pool-sales/${existingSale.id}`;
        method = "PUT";
      }

      console.log("📌 Salvando venda com URL:", url);

      const resp = await api.authFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      // Ler o JSON APENAS UMA VEZ
      const respData = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        throw new Error(respData.error || "Erro ao salvar venda de piscina");
      }

      // Se estiver criando uma nova venda, o backend retorna o ID
      if (!isEditing && respData?.id) {
        console.log("🆕 Nova venda criada com ID:", respData.id);
      }

      setMessage(isEditing ? "✅ Venda atualizada com sucesso!" : "✅ Venda registrada!");

      setTimeout(() => {
      setMessage("");

      if (!isEditing) {
        // ✔ criação → FECHAR modal
        if (onCancel) onCancel();
        return;
      }

      // ✔ edição → atualizar lista
      if (onSuccess) onSuccess();

    }, 800);

  } catch (err) {
    console.error(err);
    setMessage("❌ Erro ao salvar venda!");
    setTimeout(() => setMessage(""), 1200);
  }
};

  // 🔹 Filtra piscinas conforme o texto digitado na busca
  const filtered = Array.isArray(pools)
    ? pools.filter((pool) =>
        (pool.model?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (pool.brand?.toLowerCase() || "").includes(search.toLowerCase())
      )
    : [];

  return (
    <div className="
      max-w-6xl mx-auto p-6 md:p-8 lg:p-10
      bg-white/90 dark:bg-gray-900/80
      rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700
      backdrop-blur-2xl 
      animate-scale-in
    ">
      {/* 🔵 CABEÇALHO PREMIUM PADRÃO */}
        <div className="mb-10 bg-gradient-to-r from-cyan-600 via-blue-600 to-blue-700 
                        text-white p-6 rounded-3xl shadow-xl border border-white/20 
                        backdrop-blur-lg flex justify-between items-center">

          {/* Título */}
          <h2 className="text-3xl font-bold tracking-wide flex items-center gap-3 drop-shadow">
            🏊‍♂️ Venda de Piscina
          </h2>

          {/* Data */}
          <div className="flex items-center gap-3 bg-white/20 px-4 py-2 rounded-2xl shadow-inner backdrop-blur">
            <label className="text-sm font-medium opacity-90">Data:</label>
            <input
              type="date"
              value={form.dataVenda}
              onChange={(e) => handleChange("dataVenda", e.target.value)}
              className="px-3 py-2 rounded-xl bg-white text-gray-800 shadow 
                        border border-gray-200 focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </div>
        </div>

      {/* 🔍 BUSCA PREMIUM */}
      <div className="mb-8">
        <div className="relative">
          <input
            ref={searchRef}
            type="text"
            placeholder="🔍 Buscar piscina por modelo ou marca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-gray-300 
                      bg-white/80 shadow-md focus:ring-2 focus:ring-blue-500 
                      focus:border-blue-500 outline-none transition-all 
                      placeholder-gray-500"
          />

          {/* Ícone dentro do input */}
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            🔎
          </span>
        </div>

        {/* LISTA DE RESULTADOS */}
        {search && (
          <div className="mt-3 bg-white/95 dark:dark-card backdrop-blur-2xl 
                border border-gray-200 dark:dark-border
                rounded-3xl shadow-[0_6px_24px_rgba(0,0,0,0.12)]
                max-h-72 overflow-y-auto animate-fade-soft">

            {filtered.length === 0 ? (
              <p className="p-4 text-gray-500 text-center">Nenhum modelo encontrado.</p>
            ) : (
              filtered.map((pool) => (
                <div
                  key={pool.id}
                  onClick={() => handleSelect(pool)}
                  className="p-4 border-b border-gray-100 dark:dark-border cursor-pointer
                            transition-all rounded-xl hover:bg-blue-50/60 dark:hover:bg-gray-700
                            hover:shadow-md hover:-translate-y-[1px]"
                >
                  <div className="font-semibold">{pool.model}</div>
                  <div className="text-sm text-gray-600 flex justify-between">
                    <span>{pool.brand}</span>
                    <span>
                      {pool.length} x {pool.width} x {pool.depth}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 🔵 DADOS DO CLIENTE — PREMIUM */}
      <h3 className="text-xl font-bold text-blue-700 mb-4">👤 Dados do Cliente</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">

        <input
          placeholder="Nome do Cliente"
          value={form.nome}
          onChange={(e) => handleChange("nome", e.target.value)}
          className="premium-input w-full"
        />

        <input
          placeholder="CPF"
          value={form.cpf}
          onChange={(e) => handleChange("cpf", e.target.value)}
          className="premium-input w-full"
/>

        <input
          placeholder="RG"
          value={form.rg}
          onChange={(e) => handleChange("rg", e.target.value)}
          className="premium-input w-full"
/>

        <input
          placeholder="Telefone"
          value={form.telefone}
          onChange={(e) => handleChange("telefone", e.target.value)}
          className="premium-input w-full"
/>

        <input
          placeholder="Endereço"
          value={form.endereco}
          onChange={(e) => handleChange("endereco", e.target.value)}
          className="premium-input w-full"
/>

        <input
          placeholder="Número"
          value={form.numero}
          onChange={(e) => handleChange("numero", e.target.value)}
          className="premium-input w-full"
/>

        <input
          placeholder="Bairro"
          value={form.bairro}
          onChange={(e) => handleChange("bairro", e.target.value)}
          className="premium-input w-full"
/>

        <input
          placeholder="Cidade"
          value={form.cidade}
          onChange={(e) => handleChange("cidade", e.target.value)}
          className="premium-input w-full"
/>

        {/* Referência — ocupa linha inteira */}
        <input
          placeholder="Referência / Observações do Endereço"
          value={form.referencia}
          onChange={(e) => handleChange("referencia", e.target.value)}
          className="premium-input w-full"
/>
      </div>

      {/* 🔵 PRODUTO — PREMIUM */}
      <h3 className="text-xl font-bold text-blue-700 mb-4">📦 Informações do Produto</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Produto</label>
          <input
            placeholder="Ex: Piscina 8m x 3m"
            value={form.produto}
            onChange={(e) => handleChange("produto", e.target.value)}
            className="premium-input w-full"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Marca</label>
          <input
            placeholder="Marca"
            value={form.marca}
            onChange={(e) => handleChange("marca", e.target.value)}
            className="premium-input w-full"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Garantia de Fábrica</label>
          <input
            placeholder="Ex: 5 anos"
            value={form.garantia}
            onChange={(e) => handleChange("garantia", e.target.value)}
            className="premium-input w-full"
          />
        </div>

      </div>
        
      {/* 🎨 CORES — PREMIUM */}
      <h3 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-3 
                    drop-shadow-sm border-l-4 border-blue-500 pl-3">
        🎨 Escolha a Cor da Piscina
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">

        {[
          { nome: "Azul", cor: "bg-blue-500" },
          { nome: "Branca", cor: "bg-gray-200" },
        ].map((item) => (
          <div
            key={item.nome}
            onClick={() => handleColorSelect(item.nome)}
            className={`
              premium-card cursor-pointer flex flex-col items-center gap-4
              ${form.cor === item.nome ? "premium-card-active" : ""}
            `}
          >
            <div
              className={`w-14 h-14 rounded-full border shadow-inner ${item.cor} group-hover:scale-110 transition`}
            ></div>

            <span
              className={`text-lg font-semibold ${
                form.cor === item.nome ? "text-blue-700" : "text-gray-700"
              }`}
            >
              {item.nome}
            </span>
          </div>
        ))}
      </div>

      {/* 🧱 PASTILHAS — PREMIUM */}
      <h3 className="text-xl font-bold text-blue-700 mb-3 flex items-center gap-2">
        🧱 Pastilhas
      </h3>

      {/* Seleção Sim/Não */}
      <div className="flex gap-4 mb-6">
        {["Sim", "Não"].map((opcao) => (
          <div
            key={opcao}
            onClick={() => handlePastilhaSelect(opcao)}
            className={`
              cursor-pointer px-5 py-2 rounded-xl border-2 text-sm font-medium transition-all
              ${
                form.pastilha === opcao
                  ? "border-blue-600 bg-blue-50 shadow-md scale-[1.03]"
                  : "border-gray-300 bg-white hover:bg-gray-50 hover:shadow-sm"
              }
            `}
          >
            {opcao}
          </div>
        ))}
      </div>

      {/* Tipos de Pastilha */}
      {form.pastilha === "Sim" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 bg-gray-50 p-6 rounded-2xl shadow-inner mb-8">

          {[
            { nome: "Loulé", cor: "bg-cyan-300" },
            { nome: "Una", cor: "bg-blue-900" },
            { nome: "Blend", cor: "bg-blue-500" },
            { nome: "Blend 2", cor: "bg-blue-400" },
            { nome: "Saona", cor: "bg-teal-400" },
          ].map((tile) => (
            <div
              key={tile.nome}
              onClick={() => handleTipoPastilha(tile.nome)}
              className={`
                premium-card cursor-pointer flex flex-col items-center justify-center
                ${form.tipoPastilha === tile.nome ? "premium-card-active" : ""}
              `}
            >
              <div className={`w-14 h-14 rounded-xl border shadow-inner mb-3 ${tile.cor}`}></div>
              <span className="text-sm font-semibold text-gray-700 text-center">
                {tile.nome}
              </span>
            </div>
          ))}

        </div>
      )}
 
      {/* 🎁 INCLUSOS — PREMIUM */}
      <div className="bg-white/90 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.08)] 
           rounded-3xl p-8 mb-10 border border-white/40 
           hover:shadow-[0_4px_45px_rgba(0,0,0,0.12)] transition-all">
        <h3 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-2">
          🎁 Inclusos no Pacote
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {[
            "Filtro",
            "Bomba",
            "Casa de máquina (alvenaria)",
            "Casa de máquina (fibra)",
            "Efeito de hidromassagem",
            "Lâmpada de LED",
            "Kit limpeza",
            "Retorno",
            "Cascata",
            "Instalação",
          ].map((item) => (
            <div
              key={item}
              className="flex flex-col gap-2 p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.incluso[item]?.ativo || false}
                  onChange={(e) =>
                    handleInclusoChange(item, e.target.checked, form.incluso[item]?.texto || "")
                  }
                  className="premium-checkbox"
                />
                <span className="font-medium text-gray-700">{item}</span>
              </div>

              <input
                type="text"
                placeholder="Detalhe opcional"
                disabled={!form.incluso[item]?.ativo}
                value={form.incluso[item]?.texto || ""}
                onChange={(e) => handleInclusoChange(item, true, e.target.value)}
                className={`border rounded-xl p-2 text-sm transition-all shadow-sm ${
                  !form.incluso[item]?.ativo
                    ? "bg-gray-100 text-gray-400"
                    : "bg-white focus:ring-2 focus:ring-blue-500"
                }`}
              />
            </div>
          ))}
        </div>
      </div>
          
      {/* 📝 OBSERVAÇÕES DOS INCLUSOS — PREMIUM */}
      <div className="mb-10">
        <label className="block text-lg font-semibold text-blue-700 mb-2">
          📝 Observações sobre os Inclusos
        </label>

        <textarea
          value={form.obsIncluso}
          onChange={(e) => handleChange("obsIncluso", e.target.value)}
          rows="3"
          placeholder="Descreva detalhes importantes sobre os itens inclusos..."
          className="premium-input w-full min-h-[120px]"
        />
      </div>
              
      {/* 🛡 GARANTIAS — PREMIUM */}
      <div className="bg-gradient-to-br from-white to-blue-50 border rounded-3xl shadow-xl p-8 mb-10">
        <h3 className="text-2xl font-bold text-blue-700 mb-5 flex items-center gap-3">
          🛡 Garantias dos Acessórios e Instalação
        </h3>

        <div className="flex flex-col gap-5">
          {["3 meses", "12 meses"].map((g) => (
            <div
              key={g}
              className="flex items-center gap-4 p-4 rounded-2xl border-2 shadow-sm transition-all 
                        hover:border-blue-400 hover:bg-blue-50/40"
            >
              {/* Checkbox correto */}
              <input
                type="checkbox"
                checked={form.garantias[g]?.ativo || false}
                onChange={(e) => handleGarantiaChange(g, e.target.checked, form.garantias[g]?.texto || "")}
                className="premium-checkbox"
              />

              {/* Nome da garantia */}
              <span className="font-semibold w-28 text-gray-700">{g}</span>

              {/* Texto da garantia */}
              <input
                type="text"
                placeholder="Detalhes da garantia"
                disabled={!form.garantias[g]?.ativo}
                value={form.garantias[g]?.texto || ""}
                onChange={(e) => handleGarantiaChange(g, true, e.target.value)}
                className={`border-2 rounded-xl p-3 flex-1 text-sm transition-all 
                  ${
                    !form.garantias[g]?.ativo 
                      ? "bg-gray-100 text-gray-400 border-gray-300"
                      : "bg-white border-blue-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-400"
                  }
                `}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 📝 OBSERVAÇÕES GERAIS — PREMIUM */}
      <div className="bg-gradient-to-br from-white to-blue-50 border rounded-3xl shadow-xl p-8 mb-10">
        <h3 className="text-2xl font-bold text-blue-700 mb-4 flex items-center gap-3">
          📝 Observações Gerais
        </h3>

        <textarea
          value={form.observacoes}
          onChange={(e) => handleChange("observacoes", e.target.value)}
          rows="4"
          className="premium-input w-full min-h-[120px]"
        />
      </div>
        
      {/* 📦 PRAZO DE ENTREGA — PREMIUM */}
      <div className="mb-10">
        <label className="block text-lg font-semibold text-blue-700 mb-2">
          📦 Prazo de Entrega
        </label>

        <input
          type="text"
          placeholder="Ex: 15 dias úteis"
          value={form.prazo}
          onChange={(e) => handleChange("prazo", e.target.value)}
          className="premium-input w-full"
        />
      </div>
      
      {/* 💰 PAGAMENTO — PREMIUM */}
      <div className="bg-gradient-to-br from-white to-green-50 border rounded-3xl shadow-xl p-8 mb-10">
        <h3 className="text-2xl font-bold text-green-700 mb-6 text-center">
          💰 Condições de Pagamento
        </h3>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total</label>
            <input
              placeholder="Valor total"
              value={form.valor}
              onChange={(e) => handleChange("valor", e.target.value)}
              className="border-2 rounded-2xl p-4 w-full bg-white shadow-md 
                        focus:border-green-600 focus:ring-4 focus:ring-green-200
                        hover:shadow-lg transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entrada</label>
            <input
              placeholder="Entrada"
              value={form.entrada}
              onChange={(e) => handleChange("entrada", e.target.value)}
              className="border-2 rounded-2xl p-4 w-full bg-white shadow-md 
                        focus:border-green-600 focus:ring-4 focus:ring-green-200
                        hover:shadow-lg transition-all"
            />
          </div>
        </div>

        <label className="block text-sm text-gray-800 mt-6 mb-1 font-medium">
          Observações sobre o pagamento
        </label>

        <label className="block text-sm text-gray-800 mt-6 mb-1 font-medium">
          Forma de Pagamento
        </label>

        <input
          type="text"
          value={form.formaPagamento}
          onChange={(e) => handleChange("formaPagamento", e.target.value)}
          placeholder="Ex: Pix, Cartão, Dinheiro, Boleto..."
          className="border-2 rounded-2xl p-4 w-full bg-white shadow-md
                    focus:border-green-600 focus:ring-4 focus:ring-green-200
                    hover:shadow-lg transition-all mb-4"
        />

        <textarea
          value={form.obsPagamento || ""}
          onChange={(e) => handleChange("obsPagamento", e.target.value)}
          rows="4"
          placeholder="Ex: condições combinadas, forma de pagamento, detalhes da entrada..."
          className="border-2 rounded-2xl p-4 w-full bg-white shadow-md
                    focus:border-green-600 focus:ring-4 focus:ring-green-200
                    hover:shadow-lg transition-all"
        /> 
      </div>

            
      {/* 🔧 INSTALADOR — PREMIUM */}
      <div className="mb-10">
        <label className="block text-lg font-semibold text-blue-700 mb-2">🔧 Instalador</label>

        <select
          value={form.instalador}
          onChange={(e) => handleChange("instalador", e.target.value)}
          className="premium-input w-full cursor-pointer"
        >

        <option value="">Selecione o instalador</option>
        {installers.map((i) => (
          <option key={i.id} value={i.name}>
            {i.name}
          </option>
        ))}
      </select>
      </div>

      {/* 👤 VENDEDOR — PREMIUM */}
      <div className="mb-10">
        <label className="block text-lg font-semibold text-blue-700 mb-2">👤 Vendedor</label>

        <select
          value={form.vendedor}
          onChange={(e) => handleChange("vendedor", e.target.value)}
          className="premium-input w-full cursor-pointer"
        >

        <option value="">Selecione o vendedor</option>
        {sellers.map((s) => (
          <option key={s.id} value={s.nome}>
            {s.isOwner ? `${s.nome} (Proprietário)` : s.nome}
          </option>
        ))}
      </select>
      </div>

      {/* 🟦 BOTÕES DE AÇÃO — PREMIUM DELUXE */}
      <div className="flex justify-between mt-12">

        {/* FECHAR SEM SALVAR */}
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-3 rounded-xl bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold"
        >
          ❌ Fechar
        </button>

        {/* SALVAR ALTERAÇÕES */}
        <button
          type="button"
          onClick={() => {
            console.log("🆔 ID da venda em edição:", existingSale?.id);
            handleSubmit();
          }}
          className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold"
        >
          💾 Salvar
        </button>
      </div>
          
      {/* 🟦 TOAST PREMIUM */}
      {message && (
        <div className="notification-success animate-fade-in-out fixed bottom-6 right-6">
          {message}
        </div>
      )}
    </div>
  );
}
