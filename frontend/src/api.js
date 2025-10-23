//const API_BASE = "http://127.0.0.1:8000";
//const API_BASE = "https://localhost/api"
const API_BASE = "/api";


// Helper: check response
async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `API error: ${res.status}`);
  }
  return res.json();
}

export const BudgetItemAPI = {
  // --- Categories ---
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

  // --- Budget Items ---
  getBudgetItems: ({ month, year }) =>
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

  // --- Dashboard summary ---
  getMonthlySummary: ({ month, year }) =>
    fetchJSON(`${API_BASE}/budget/summary/?month=${month}&year=${year}`),
};


export const MerchantMappingAPI = {
  getAll: () => axios.get(`${API_BASE_URL}/merchant-mappings`),
  getById: (id) => axios.get(`${API_BASE_URL}/merchant-mappings/${id}`),
  create: (data) => axios.post(`${API_BASE_URL}/merchant-mappings`, data),
  update: (id, data) => axios.put(`${API_BASE_URL}/merchant-mappings/${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/merchant-mappings/${id}`),
};

// ensure other APIs are exported too
export { BudgetItemAPI, CategoryAPI };

