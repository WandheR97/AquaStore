const API_URL = "http://localhost:5000";

// =============================
// 🔒 Função auxiliar para requisições autenticadas
// =============================
// ✅ api.js
export async function authFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("⚠️ Nenhum token encontrado no localStorage!");
  }

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}

// =============================
// 🔐 Cabeçalho de autenticação
// =============================
function getAuthHeader() {
const token = localStorage.getItem("token");
return token ? { Authorization: `Bearer ${token}` } : {};
}

// =============================
// 🌐 Função genérica de requisições
// =============================
async function request(endpoint, method = "GET", body = null, requireAuth = true) {
const headers = {
  "Content-Type": "application/json",
  ...(requireAuth ? getAuthHeader() : {}),
};

const options = { method, headers };
if (body) options.body = JSON.stringify(body);

const response = await fetch(`${API_URL}${endpoint}`, options);

let data;
try {
  data = await response.json();
} catch {
  data = { error: "Erro inesperado no servidor" };
}

if (!response.ok) {
  const message = data.error || data.message || "Erro na requisição";
  throw new Error(message);
}

return data;
}

export { request };

// =============================
// 🔑 LOGIN / LOGOUT / USUÁRIO
// =============================
export async function login(username, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) throw new Error("Login inválido");

  const data = await res.json();

  // ⚙️ Salva corretamente no localStorage
  localStorage.setItem("token", data.token || "");
  localStorage.setItem("id", data.id || "");
  localStorage.setItem("username", data.username || "");
  localStorage.setItem("role", data.role || "");
  localStorage.setItem("owner_id", data.owner_id ?? "");

  console.log("📦 Retorno do login():", data);

  // 🔹 Retorna exatamente o objeto retornado pelo backend
  return data;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("role");
  localStorage.removeItem("owner_id");
}

export function getUser() {
  return {
    username: localStorage.getItem("username"),
    role: localStorage.getItem("role"),
    owner_id: parseInt(localStorage.getItem("owner_id")),
  };
}

// =============================
// 🏷️ MARCAS DE PRODUTOS
// =============================
export const getBrands = () => request("/api/brands");
export const addBrand = (brand) => request("/api/brands", "POST", brand);
export const updateBrand = (id, brand) => request(`/api/brands/${id}`, "PUT", brand);
export const deleteBrand = (id) => request(`/api/brands/${id}`, "DELETE");

// =============================
// 🏷️ MARCAS DE PISCINAS
// =============================
export const getPoolBrands = () => request("/api/pool-brands");
export const addPoolBrand = (brand) => request("/api/pool-brands", "POST", brand);
export const updatePoolBrand = (id, brand) => request(`/api/pool-brands/${id}`, "PUT", brand);
export const deletePoolBrand = (id) => request(`/api/pool-brands/${id}`, "DELETE");

// =============================
// 👷 INSTALADORES
// =============================
export const getInstallers = () => request("/api/installers");
export const addInstaller = (installer) => request("/api/installers", "POST", installer);
export const updateInstaller = (id, installer) => request(`/api/installers/${id}`, "PUT", installer);
export const deleteInstaller = (id) => request(`/api/installers/${id}`, "DELETE");

// =============================
// 📦 PRODUTOS
// =============================
export const getProducts = () => request("/api/products");
export const addProduct = (product) => request("/api/products", "POST", product);
export const updateProduct = (id, product) => request(`/api/products/${id}`, "PUT", product);
export const deleteProduct = (id) => request(`/api/products/${id}`, "DELETE");

// =============================
// 🏊‍♂️ PISCINAS
// =============================
export const getPools = () => request("/api/pools");
export const addPool = (pool) => request("/api/pools", "POST", pool);
export const updatePool = (id, pool) => request(`/api/pools/${id}`, "PUT", pool);
export const deletePool = (id) => request(`/api/pools/${id}`, "DELETE");

// =============================
// 💰 VENDAS DE PRODUTOS
// =============================
export const getSales = () => request("/sales"); // usa token automaticamente
export const createSale = (data) => request("/sales", "POST", data);

// =============================
// 🏊‍♂️ VENDAS DE PISCINAS
// =============================
export const getPoolSales = () => request("/pool-sales"); // rota certa
export const createPoolSale = (data) => request("/pool-sales", "POST", data);
export const updatePoolStatus = (id, status) => request(`/pool-sales/${id}/status`, "PUT", { status });

// ============================
// Configuração - Vendedores (para aba de Configurações)
// ============================
export async function getSellersConfig() {
return request("/api/sellers-config");
}

export async function addSellerConfig(data) {
return request("/api/sellers-config", "POST", data);
}

export async function updateSellerConfig(id, data) {
return request(`/api/sellers-config/${id}`, "PUT", data);
}

export async function deleteSellerConfig(id) {
return request(`/api/sellers-config/${id}`, "DELETE");
}

// =============================
// 👤 USUÁRIOS (Proprietários / Vendedores)
// =============================

// Cadastrar proprietário
export const addOwner = (user) => request("/api/owners", "POST", user);

// Atualizar proprietário
export const updateOwner = (id, user) => request(`/api/owners/${id}`, "PUT", user);

// Atualizar vendedor
export const updateSeller = (id, user) => request(`/api/sellers/${id}`, "PUT", user);

// Listar proprietários
export const getOwners = () => request("/api/owners");

// Cadastrar vendedor (feito por proprietário)
export const addSeller = (user) => request("/api/sellers", "POST", user);

// Listar vendedores
export const getSellers = () => request("/api/sellers");

// Deletar proprietário
export const deleteOwner = (id) => request(`/api/owners/${id}`, "DELETE");

// Deletar vendedor
export const deleteSeller = (id) => request(`/api/sellers/${id}`, "DELETE");

// Buscar vendedores de um proprietário
export const getSellersByOwner = (ownerId) => request(`/api/sellers/by-owner/${ownerId}`);

// =============================
// 🌟 Export default (objeto completo)
// =============================
const api = {
login,
logout,
getUser,

getBrands,
addBrand,
updateBrand,
deleteBrand,

getPoolBrands,
addPoolBrand,
updatePoolBrand,
deletePoolBrand,

getInstallers,
addInstaller,
updateInstaller,
deleteInstaller,

getProducts,
addProduct,
updateProduct,
deleteProduct,

getPools,
addPool,
updatePool,
deletePool,

  // ✅ Funções de vendas
getSales,
createSale,

addOwner,
getOwners,
addSeller,
getSellers,
updateOwner,
updateSeller,
deleteOwner,
deleteSeller,
getSellersByOwner,

// ✅ Adicione aqui as funções da aba Configurações
getSellersConfig,
addSellerConfig,
updateSellerConfig,
deleteSellerConfig,
};

export default api;

