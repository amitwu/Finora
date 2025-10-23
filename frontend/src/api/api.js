// src/api/api.js
// Use relative /api path so requests go through Nginx reverse proxy in Docker and localhost
const API_BASE = "/api";

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error: ${res.status}`);
  }
  return res.json();
}

export const CategoryAPI = {
  getCategories: () => fetchJSON(`${API_BASE}/categories/`),
  createCategory: (data) =>
    fetchJSON(`${API_BASE}/categories/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCategory: (id, data) =>
    fetchJSON(`${API_BASE}/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteCategory: (id) =>
    fetchJSON(`${API_BASE}/categories/${id}`, { method: "DELETE" }),
};

export const BudgetItemAPI = {
  getBudgetItems: (month, year) =>
    fetchJSON(`${API_BASE}/budget/?month=${month}&year=${year}`),
  saveBudgetItem: (data) =>
    fetchJSON(`${API_BASE}/budget/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateBudgetItem: (id, data) =>
    fetchJSON(`${API_BASE}/budget/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteBudgetItem: (id) =>
    fetchJSON(`${API_BASE}/budget/${id}`, { method: "DELETE" }),
  getMonthlySummary: (month, year) =>
    fetchJSON(`${API_BASE}/budget/summary/?month=${month}&year=${year}`),
};


export const MerchantMappingAPI = {
  getMappings: () => fetchJSON(`${API_BASE}/merchant-mappings/`),
  createMapping: (data) =>
    fetchJSON(`${API_BASE}/merchant-mappings/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateMapping: (id, data) =>
    fetchJSON(`${API_BASE}/merchant-mappings/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteMapping: (id) =>
    fetchJSON(`${API_BASE}/merchant-mappings/${id}`, { method: "DELETE" }),
  searchMapping: (merchantName) =>
    fetchJSON(`${API_BASE}/merchant-mappings/search/${merchantName}`),
};