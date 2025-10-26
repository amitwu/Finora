// src/pages/CategoriesPage.jsx
import React, { useEffect, useState } from "react";
import { CategoryAPI } from "../api/api";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: "", parent_id: null, type: "expense" });
  const [newSubcategory, setNewSubcategory] = useState({ name: "", parent_id: null, type: "expense" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  // editing state: map categoryId -> { name, parent_id, type }
  const [editing, setEditing] = useState({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setError("");
    try {
      const data = await CategoryAPI.getCategories();
      setCategories(data);
    } catch (err) {
      setError(`שגיאה בטעינת קטגוריות: ${err.message}`);
    }
  };

  const addCategory = async () => {
    setError("");
    if (!newCategory.name || newCategory.name.trim() === "") {
      setError("השם לא יכול להיות ריק");
      return;
    }
    try {
      await CategoryAPI.createCategory(newCategory);
      setNewCategory({ name: "", parent_id: null, type: "expense" });
      loadCategories();
      setInfo("הקטגוריה נוצרה בהצלחה");
      setTimeout(() => setInfo(""), 2000);
    } catch (err) {
      setError(`שגיאה ביצירת קטגוריה: ${err.message}`);
    }
  };

  const addSubcategory = async (parentId, type) => {
    setError("");
    if (!newSubcategory.name || newSubcategory.name.trim() === "" || newSubcategory.parent_id !== parentId) {
      setError("אנא מלא שם תקין עבור תת-הקטגוריה");
      return;
    }
    try {
      await CategoryAPI.createCategory(newSubcategory);
      setNewSubcategory({ name: "", parent_id: null, type: "expense" });
      loadCategories();
      setInfo("תת-הקטגוריה נוצרה בהצלחה");
      setTimeout(() => setInfo(""), 2000);
    } catch (err) {
      setError(`שגיאה ביצירת תת-קטגוריה: ${err.message}`);
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("למחוק קטגוריה זו?")) return;
    setError("");
    try {
      await CategoryAPI.deleteCategory(id);
      loadCategories();
      setInfo("הקטגוריה נמחקה");
      setTimeout(() => setInfo(""), 2000);
    } catch (err) {
      setError(`שגיאה במחיקה: ${err.message}`);
    }
  };

  // start inline editing for category
  const startEdit = (cat) => {
    setEditing((prev) => ({
      ...prev,
      [cat.id]: { name: cat.name ?? "", parent_id: cat.parent_id ?? null, type: cat.type ?? "expense" },
    }));
    setError("");
  };

  // cancel editing
  const cancelEdit = (id) => {
    setEditing((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setError("");
  };

  // save updated category (name/type/parent)
  const saveEdit = async (id) => {
    setError("");
    const values = editing[id];
    if (!values || !values.name || values.name.trim() === "") {
      setError("השם לא יכול להיות ריק");
      return;
    }

    // prepare payload; backend expects name, parent_id and type
    const payload = {
      name: values.name.trim(),
      parent_id: values.parent_id === null ? null : Number(values.parent_id),
      type: values.type,
    };

    try {
      await CategoryAPI.updateCategory(id, payload);
      // update local state (optimistic) or reload
      await loadCategories();
      // remove editing entry
      cancelEdit(id);
      setInfo("הקטגוריה עודכנה בהצלחה");
      setTimeout(() => setInfo(""), 2000);
    } catch (err) {
      setError(`שגיאה בעדכון הקטגוריה: ${err.message}`);
    }
  };

  // UI helpers
  const topLevelCategories = (type) => categories.filter((c) => c.type === type && !c.parent_id);
  const subcategoriesOf = (parentId) => categories.filter((s) => s.parent_id === parentId);

  // returns true if the editing values for id differ from original category values
  const isEditingDirty = (id) => {
    const edit = editing[id];
    if (!edit) return false;
    const orig = categories.find((c) => c.id === id);
    if (!orig) return true; // new-ish (shouldn't happen)
    const origParent = orig.parent_id === null ? null : Number(orig.parent_id);
    const editParent = edit.parent_id === "" ? null : edit.parent_id === null ? null : Number(edit.parent_id);
    return (
      (edit.name ?? "").trim() !== (orig.name ?? "").trim() ||
      (edit.type ?? "") !== (orig.type ?? "") ||
      (editParent !== origParent)
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md" dir="rtl">
      <h1 className="text-3xl font-bold mb-4 text-purple-800 text-right">ניהול קטגוריות</h1>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {info && <div className="bg-green-50 text-green-700 p-2 rounded mb-4">{info}</div>}

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
            <h2 className="text-xl font-bold mb-2">{type === "income" ? "הכנסות" : "הוצאות"}</h2>

            <ul>
              {topLevelCategories(type).map((cat) => {
                const editingRow = !!editing[cat.id];
                const dirty = isEditingDirty(cat.id);

                return (
                  <li
                    key={cat.id}
                    className={`border-b py-2 ${editingRow ? "bg-blue-50 border-blue-200" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {!editingRow ? (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-gray-800 font-medium truncate">{cat.name}</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => startEdit(cat)}
                                className="text-sm px-2 py-1 bg-yellow-50 border rounded text-yellow-800"
                              >
                                ערוך
                              </button>
                              <button
                                className="text-red-500 hover:text-red-700"
                                onClick={() => deleteCategory(cat.id)}
                              >
                                ❌
                              </button>
                            </div>
                          </div>
                        ) : (
                          // edit row: input grows, selects fixed, buttons aligned right; prevents layout distortion with long names
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editing[cat.id].name}
                              onChange={(e) =>
                                setEditing((prev) => ({ ...prev, [cat.id]: { ...prev[cat.id], name: e.target.value } }))
                              }
                              className={`border p-1 rounded min-w-0 flex-1 truncate ${dirty ? "ring-2 ring-yellow-300" : ""}`}
                              placeholder="שם הקטגוריה"
                            />

                            <div className="flex items-center gap-2 flex-none">
                              <select
                                value={editing[cat.id].type}
                                onChange={(e) =>
                                  setEditing((prev) => ({ ...prev, [cat.id]: { ...prev[cat.id], type: e.target.value } }))
                                }
                                className="border p-1 rounded"
                              >
                                <option value="income">הכנסה</option>
                                <option value="expense">הוצאה</option>
                              </select>

                              <select
                                value={editing[cat.id].parent_id ?? ""}
                                onChange={(e) =>
                                  setEditing((prev) => ({
                                    ...prev,
                                    [cat.id]: { ...prev[cat.id], parent_id: e.target.value === "" ? null : Number(e.target.value) },
                                  }))
                                }
                                className="border p-1 rounded"
                              >
                                <option value="">ללא הורה</option>
                                {/* allow selecting other top-level categories as parent (same type) */}
                                {categories
                                  .filter((c) => c.type === editing[cat.id].type && !c.parent_id && c.id !== cat.id)
                                  .map((opt) => (
                                    <option key={opt.id} value={opt.id}>
                                      {opt.name}
                                    </option>
                                  ))}
                              </select>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => saveEdit(cat.id)}
                                  className="text-sm px-2 py-1 bg-green-600 text-white rounded"
                                >
                                  שמור
                                </button>
                                <button onClick={() => cancelEdit(cat.id)} className="text-sm px-2 py-1 bg-gray-200 rounded">
                                  ביטול
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Subcategories list */}
                    <ul className="mr-6 mt-2">
                      {subcategoriesOf(cat.id).map((sub) => {
                        const editingSub = !!editing[sub.id];
                        const dirtySub = isEditingDirty(sub.id);

                        return (
                          <li key={sub.id} className="text-sm text-gray-700 flex items-center justify-between py-1">
                            {!editingSub ? (
                              <>
                                <span className="flex-1 truncate">↳ {sub.name}</span>
                                <div className="flex items-center gap-2 flex-none">
                                  <button
                                    onClick={() => startEdit(sub)}
                                    className="text-sm px-2 py-1 bg-yellow-50 border rounded text-yellow-800"
                                  >
                                    ערוך
                                  </button>
                                  <button
                                    className="text-red-500 hover:text-red-700"
                                    onClick={() => deleteCategory(sub.id)}
                                  >
                                    ❌
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className={`flex items-center gap-2 w-full ${editingSub ? "bg-blue-50 p-1 rounded" : ""}`}>
                                <input
                                  type="text"
                                  value={editing[sub.id].name}
                                  onChange={(e) =>
                                    setEditing((prev) => ({ ...prev, [sub.id]: { ...prev[sub.id], name: e.target.value } }))
                                  }
                                  className={`border p-1 rounded min-w-0 flex-1 truncate ${dirtySub ? "ring-2 ring-yellow-300" : ""}`}
                                  placeholder="שם תת-קטגוריה"
                                />

                                <select
                                  value={editing[sub.id].type}
                                  onChange={(e) =>
                                    setEditing((prev) => ({ ...prev, [sub.id]: { ...prev[sub.id], type: e.target.value } }))
                                  }
                                  className="border p-1 rounded flex-none"
                                >
                                  <option value="income">הכנסה</option>
                                  <option value="expense">הוצאה</option>
                                </select>

                                <select
                                  value={editing[sub.id].parent_id ?? ""}
                                  onChange={(e) =>
                                    setEditing((prev) => ({
                                      ...prev,
                                      [sub.id]: { ...prev[sub.id], parent_id: e.target.value === "" ? null : Number(e.target.value) },
                                    }))
                                  }
                                  className="border p-1 rounded flex-none"
                                >
                                  <option value="">ללא הורה</option>
                                  {categories
                                    .filter((c) => c.type === editing[sub.id].type && !c.parent_id && c.id !== sub.id)
                                    .map((opt) => (
                                      <option key={opt.id} value={opt.id}>
                                        {opt.name}
                                      </option>
                                    ))}
                                </select>

                                <div className="flex items-center gap-2 flex-none">
                                  <button onClick={() => saveEdit(sub.id)} className="text-sm px-2 py-1 bg-green-600 text-white rounded">
                                    שמור
                                  </button>
                                  <button onClick={() => cancelEdit(sub.id)} className="text-sm px-2 py-1 bg-gray-200 rounded">
                                    ביטול
                                  </button>
                                </div>
                              </div>
                            )}
                          </li>
                        );
                      })}

                      {/* add subcategory input */}
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
                          onClick={async () => await addSubcategory(cat.id, type)}
                        >
                          הוסף תת-קטגוריה
                        </button>
                      </div>
                    </ul>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}