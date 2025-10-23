// src/pages/CategoriesPage.jsx
import React, { useEffect, useState } from "react";
import { CategoryAPI } from "../api/api";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: "", parent_id: null, type: "expense" });
  const [newSubcategory, setNewSubcategory] = useState({ name: "", parent_id: null, type: "expense" });
  const [error, setError] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await CategoryAPI.getCategories();
      setCategories(data);
    } catch (err) {
      setError(`שגיאה בטעינת קטגוריות: ${err.message}`);
    }
  };

  const addCategory = async () => {
    try {
      await CategoryAPI.createCategory(newCategory);
      setNewCategory({ name: "", parent_id: null, type: "expense" });
      loadCategories();
    } catch (err) {
      setError(`שגיאה ביצירת קטגוריה: ${err.message}`);
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("למחוק קטגוריה זו?")) return;
    try {
      await CategoryAPI.deleteCategory(id);
      loadCategories();
    } catch (err) {
      setError(`שגיאה במחיקה: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md" dir="rtl">
      <h1 className="text-3xl font-bold mb-4 text-purple-800 text-right">ניהול קטגוריות</h1>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="שם קטגוריה חדשה"
          value={newCategory.name}
          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
          className="border p-2 rounded flex-grow"
        />
        <select
          value={newCategory.type}
          onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="income">הכנסה</option>
          <option value="expense">הוצאה</option>
        </select>
        <button onClick={addCategory} className="bg-green-600 text-white px-4 py-2 rounded">
          הוסף
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {["income", "expense"].map((type) => (
          <div key={type}>
            <h2 className="text-xl font-bold mb-2">
              {type === "income" ? "הכנסות" : "הוצאות"}
            </h2>
            <ul>
              {categories
                .filter((c) => c.type === type && !c.parent_id)
                .map((cat) => (
                  <li key={cat.id} className="border-b py-2 flex justify-between items-center">
                    <span>{cat.name}</span>
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => deleteCategory(cat.id)}
                    >
                      ❌
                    </button>
                    <ul className="mr-6 mt-1 w-full">
                      {categories
                        .filter((sub) => sub.parent_id === cat.id)
                        .map((sub) => (
                          <li key={sub.id} className="text-sm text-gray-700 flex justify-between items-center">
                            <span>↳ {sub.name}</span>
                            <button
                              className="text-red-500 hover:text-red-700"
                              onClick={() => deleteCategory(sub.id)}
                            >
                              ❌
                            </button>
                          </li>
                        ))}
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          placeholder="שם תת-קטגוריה"
                          value={newSubcategory.parent_id === cat.id ? newSubcategory.name : ""}
                          onChange={(e) => setNewSubcategory({ name: e.target.value, parent_id: cat.id, type })}
                          className="border p-1 rounded flex-grow"
                        />
                        <button
                          className="bg-blue-600 text-white px-3 py-1 rounded"
                          onClick={async () => {
                            if (!newSubcategory.name) return;
                            try {
                              await CategoryAPI.createCategory(newSubcategory);
                              setNewSubcategory({ name: "", parent_id: null, type: "expense" });
                              loadCategories();
                            } catch (err) {
                              setError(`שגיאה ביצירת תת-קטגוריה: ${err.message}`);
                            }
                          }}
                        >
                          הוסף תת-קטגוריה
                        </button>
                      </div>
                    </ul>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
