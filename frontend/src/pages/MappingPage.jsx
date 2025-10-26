import React, { useState, useEffect, useCallback } from "react";
import { CategoryAPI, MerchantMappingAPI } from "../api/api";

/**
 * MappingPage — grouped view with:
 * - parent category frames -> subcategories -> merchant names
 * - add / edit / delete mappings inline
 * - collapse all / expand all controls
 * - export CSV of mappings (UTF-8 BOM + readable category names)
 * - keyboard shortcuts while editing: Enter = save, Esc = cancel
 * - visual states: editing (blue), dirty/unsaved (yellow ring)
 *
 * Changes in this version:
 * 1) exportCSV now includes UTF-8 BOM so Excel and other tools read Hebrew correctly,
 *    and CSV rows include both category/subcategory names and IDs.
 * 2) Added buttons on each parent frame to expand/collapse all subcategories for that parent.
 * 3) Keyboard shortcuts implemented for inputs/selects while editing (Enter/Esc).
 * 4) Visual indicators: editing row = blue background; dirty/unsaved = yellow ring (still applied).
 */

export default function MappingPage() {
  const [categories, setCategories] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [newMapping, setNewMapping] = useState({ merchant_name: "", category_id: "", subcategory_id: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [editing, setEditing] = useState({}); // mappingId -> edit values
  const [collapsedParents, setCollapsedParents] = useState({}); // parentId -> bool (true = collapsed)
  const [collapsedSubs, setCollapsedSubs] = useState({}); // subId -> bool (true = collapsed)
  const [filter, setFilter] = useState(""); // optional quick search filter

  useEffect(() => {
    loadCategories();
    loadMappings();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await CategoryAPI.getCategories();
      setCategories(data);
    } catch (err) {
      setError(`שגיאה בטעינת קטגוריות: ${err?.message || err}`);
    }
  };

  const loadMappings = async () => {
    try {
      const data = await MerchantMappingAPI.getMappings();
      setMappings(data);
    } catch (err) {
      setError(`שגיאה בטעינת מיפויים: ${err?.message || err}`);
    }
  };

  // ---------- add / delete / edit ----------
  const addMapping = async () => {
    setError("");
    if (!newMapping.merchant_name || !newMapping.category_id) {
      setError("נא למלא שם בית העסק וקטגוריה");
      return;
    }
    try {
      await MerchantMappingAPI.createMapping({
        merchant_name: newMapping.merchant_name.trim(),
        category_id: Number(newMapping.category_id),
        subcategory_id: newMapping.subcategory_id ? Number(newMapping.subcategory_id) : null,
      });
      setNewMapping({ merchant_name: "", category_id: "", subcategory_id: "" });
      await loadMappings();
      setInfo("מיפוי נוצר בהצלחה");
      setTimeout(() => setInfo(""), 2500);
    } catch (err) {
      setError(`שגיאה ביצירת מיפוי: ${err?.message || err}`);
    }
  };

  const deleteMapping = async (id) => {
    if (!window.confirm("למחוק מיפוי זה?")) return;
    try {
      await MerchantMappingAPI.deleteMapping(id);
      await loadMappings();
      setInfo("מיפוי נמחק");
      setTimeout(() => setInfo(""), 2000);
    } catch (err) {
      setError(`שגיאה במחיקה: ${err?.message || err}`);
    }
  };

  const startEdit = (mapping) => {
    setEditing((prev) => ({
      ...prev,
      [mapping.id]: {
        merchant_name: mapping.merchant_name ?? "",
        category_id: mapping.category_id ? String(mapping.category_id) : "",
        subcategory_id: mapping.subcategory_id ? String(mapping.subcategory_id) : "",
      },
    }));
    setError("");
  };

  const cancelEdit = (id) => {
    setEditing((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setError("");
  };

  const saveEdit = async (id) => {
    const data = editing[id];
    if (!data || !data.merchant_name || !data.category_id) {
      setError("נא למלא שם בית העסק וקטגוריה");
      return;
    }
    try {
      await MerchantMappingAPI.updateMapping(Number(id), {
        merchant_name: data.merchant_name.trim(),
        category_id: Number(data.category_id),
        subcategory_id: data.subcategory_id ? Number(data.subcategory_id) : null,
      });
      await loadMappings();
      cancelEdit(id);
      setInfo("מיפוי עודכן בהצלחה");
      setTimeout(() => setInfo(""), 2500);
    } catch (err) {
      setError(`שגיאה בעדכון המיפוי: ${err?.message || err}`);
    }
  };

  // ---------- helpers for categories and grouping ----------
  const parentCategories = categories.filter((c) => !c.parent_id);
  const subcategoriesOf = (parentId) => categories.filter((c) => c.parent_id === parentId);

  // Build grouped map parent -> { parent, subs: { subId -> { sub, items } }, unassigned: [] }
  const buildGrouped = useCallback(() => {
    const map = {};
    parentCategories.forEach((p) => {
      map[p.id] = { parent: p, subs: {}, unassigned: [] };
      subcategoriesOf(p.id).forEach((s) => {
        map[p.id].subs[s.id] = { sub: s, items: [] };
      });
    });

    const orphans = [];
    const filterLower = filter.trim().toLowerCase();

    mappings.forEach((m) => {
      if (filterLower && !m.merchant_name.toLowerCase().includes(filterLower)) return;

      const cat = categories.find((c) => c.id === m.category_id);
      if (!cat) {
        orphans.push(m);
        return;
      }
      const parentId = cat.parent_id ? cat.parent_id : cat.id;
      if (!map[parentId]) {
        const parentRec = categories.find((c) => c.id === parentId) || { id: parentId, name: "לא ידוע" };
        map[parentId] = { parent: parentRec, subs: {}, unassigned: [] };
      }

      if (m.subcategory_id) {
        if (map[parentId].subs && map[parentId].subs[m.subcategory_id]) {
          map[parentId].subs[m.subcategory_id].items.push(m);
        } else {
          map[parentId].unassigned.push(m);
        }
      } else {
        map[parentId].unassigned.push(m);
      }
    });

    return { map, orphans };
  }, [categories, mappings, parentCategories, filter]);

  const { map: groupedMap, orphans } = buildGrouped();

  // ---------- collapse / expand ----------
  const toggleParent = (parentId) => {
    setCollapsedParents((s) => ({ ...s, [parentId]: !s[parentId] }));
  };
  const toggleSub = (subId) => {
    setCollapsedSubs((s) => ({ ...s, [subId]: !s[subId] }));
  };

  const expandAll = () => {
    const parents = {};
    const subs = {};
    Object.values(groupedMap).forEach((g) => {
      parents[g.parent.id] = false; // false = expanded
      Object.keys(g.subs).forEach((sid) => (subs[sid] = false));
    });
    setCollapsedParents(parents);
    setCollapsedSubs(subs);
  };

  const collapseAll = () => {
    const parents = {};
    const subs = {};
    Object.values(groupedMap).forEach((g) => {
      parents[g.parent.id] = true; // true = collapsed
      Object.keys(g.subs).forEach((sid) => (subs[sid] = true));
    });
    setCollapsedParents(parents);
    setCollapsedSubs(subs);
  };

  // Expand/collapse subcategories for a single parent (new per-request button)
  const expandParentSubs = (parentId) => {
    const subs = groupedMap[parentId]?.subs || {};
    setCollapsedSubs((prev) => {
      const copy = { ...prev };
      Object.keys(subs).forEach((sid) => (copy[sid] = false));
      return copy;
    });
  };
  const collapseParentSubs = (parentId) => {
    const subs = groupedMap[parentId]?.subs || {};
    setCollapsedSubs((prev) => {
      const copy = { ...prev };
      Object.keys(subs).forEach((sid) => (copy[sid] = true));
      return copy;
    });
  };

  // ---------- export CSV (UTF-8 BOM + names) ----------
  const exportCSV = () => {
    // headers: include names and ids so it's human-readable
    const headers = ["merchant_name", "parent_category_name", "parent_category_id", "subcategory_name", "subcategory_id"];
    const rows = [];

    mappings.forEach((m) => {
      const cat = categories.find((c) => c.id === m.category_id);
      const parent = cat ? (cat.parent_id ? categories.find((c) => c.id === cat.parent_id) : cat) : null;
      const sub = categories.find((c) => c.id === m.subcategory_id);

      const parentName = parent ? parent.name : (cat ? cat.name : "");
      const parentId = parent ? parent.id : (cat ? cat.id : "");
      const subName = sub ? sub.name : "";
      const subId = sub ? sub.id : "";

      rows.push({
        merchant_name: m.merchant_name,
        parent_category_name: parentName,
        parent_category_id: parentId,
        subcategory_name: subName,
        subcategory_id: subId,
      });
    });

    // Build CSV content and add BOM so Excel reads it as UTF-8 with Hebrew correctly
    const csvLines = [headers.join(",")].concat(
      rows.map((r) =>
        headers
          .map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
    );
    const csvContent = "\uFEFF" + csvLines.join("\n"); // prepend BOM

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filename = `merchant_mappings_${new Date().toISOString().slice(0, 10)}.csv`;
    a.setAttribute("download", filename);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ---------- helpers for UI states: dirty detection and styling ----------
  const isDirty = (mappingId) => {
    const edit = editing[mappingId];
    if (!edit) return false;
    const orig = mappings.find((m) => m.id === mappingId);
    if (!orig) return true;
    const origCat = orig.category_id ? String(orig.category_id) : "";
    const origSub = orig.subcategory_id ? String(orig.subcategory_id) : "";
    return (
      (edit.merchant_name ?? "").trim() !== (orig.merchant_name ?? "").trim() ||
      (edit.category_id ?? "") !== origCat ||
      (edit.subcategory_id ?? "") !== origSub
    );
  };

  // ---------- keyboard handling while editing: Enter to save, Esc to cancel ----------
  const handleEditKeyDown = (e, id) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit(id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit(id);
    }
  };

  const getCategoryName = (id) => categories.find((c) => c.id === id)?.name || "";
  const getSubcategoryName = (id) => categories.find((c) => c.id === id)?.name || "";

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white rounded-lg shadow-md" dir="rtl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-3">
        <h1 className="text-3xl font-extrabold text-purple-800">מיפוי בתי עסק לקטגוריות</h1>

        <div className="flex items-center gap-3">
          <input
            type="search"
            placeholder="חפש בית עסק..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border p-2 rounded w-64"
          />

          <button onClick={expandAll} className="bg-blue-100 text-blue-800 px-3 py-1 rounded border">
            הרחב הכל
          </button>
          <button onClick={collapseAll} className="bg-gray-100 text-gray-800 px-3 py-1 rounded border">
            כווץ הכל
          </button>

          <button onClick={exportCSV} className="bg-green-600 text-white px-3 py-1 rounded">
            יצא CSV
          </button>
        </div>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {info && <div className="bg-green-50 text-green-700 p-2 rounded mb-4">{info}</div>}

      {/* Add new mapping */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h3 className="text-xl font-bold mb-4">הוסף מיפוי חדש</h3>

        <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-3 items-end">
          <input
            type="text"
            placeholder="שם בית העסק"
            value={newMapping.merchant_name}
            onChange={(e) => setNewMapping((s) => ({ ...s, merchant_name: e.target.value }))}
            className="border p-2 rounded"
          />
          <select
            value={newMapping.category_id}
            onChange={(e) => setNewMapping((s) => ({ ...s, category_id: e.target.value, subcategory_id: "" }))}
            className="border p-2 rounded"
          >
            <option value="">בחר קטגוריה</option>
            {parentCategories.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={newMapping.subcategory_id}
            onChange={(e) => setNewMapping((s) => ({ ...s, subcategory_id: e.target.value }))}
            className="border p-2 rounded"
            disabled={!newMapping.category_id}
          >
            <option value="">תת-קטגוריה (אופציונלי)</option>
            {newMapping.category_id &&
              subcategoriesOf(Number(newMapping.category_id)).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>

          <button onClick={addMapping} className="bg-green-600 text-white px-4 py-2 rounded">
            הוסף
          </button>
        </div>
      </div>

      {/* Grid of parent category frames */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(groupedMap).map((group) => {
          const parent = group.parent;
          const subs = Object.values(group.subs);
          const collapsed = !!collapsedParents[parent.id];
          return (
            <div key={parent.id} className="border rounded-lg p-4 shadow-sm bg-white">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-bold">{parent.name}</h2>
                  <div className="text-sm text-gray-500">
                    תתי-קטגוריות: {subs.length} • מיפויים: {group.unassigned.length + subs.reduce((a, s) => a + s.items.length, 0)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleParent(parent.id)}
                    className="text-sm px-2 py-1 bg-gray-100 border rounded"
                    aria-expanded={!collapsed}
                  >
                    {collapsed ? "הצג" : "הסתר"}
                  </button>

                  {/* Expand/collapse subcategories for this parent */}
                  <button
                    onClick={() => expandParentSubs(parent.id)}
                    className="text-sm px-2 py-1 bg-blue-50 border rounded text-blue-800"
                    title="הרחב את כל תתי-הקטגוריות תחת קטגוריה זו"
                  >
                    הרחב תתי-קטגוריות
                  </button>
                  <button
                    onClick={() => collapseParentSubs(parent.id)}
                    className="text-sm px-2 py-1 bg-gray-50 border rounded"
                    title="כווץ את כל תתי-הקטגוריות תחת קטגוריה זו"
                  >
                    כווץ תתי-קטגוריות
                  </button>
                </div>
              </div>

              {!collapsed && (
                <div className="space-y-4">
                  {/* subcategories list */}
                  {subs.map((srec) => {
                    const sub = srec.sub;
                    const items = srec.items;
                    const subCollapsed = !!collapsedSubs[sub.id];
                    return (
                      <div key={sub.id} className="pl-2 border-l">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{sub.name}</h3>
                            <div className="text-xs text-gray-500">{items.length} מיפויים</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => toggleSub(sub.id)} className="text-xs px-2 py-1 bg-gray-50 border rounded">
                              {subCollapsed ? "הצג" : "הסתר"}
                            </button>
                          </div>
                        </div>

                        {!subCollapsed && (
                          <ul className="mt-2 space-y-1">
                            {items.length === 0 && <li className="text-sm text-gray-500">אין מיפויים</li>}
                            {items.map((m) => {
                              const isEditing = !!editing[m.id];
                              const dirty = isDirty(m.id);

                              // classes: editing row = blue; dirty = yellow ring
                              const rowClass = isEditing
                                ? `bg-blue-50 ${dirty ? "ring-2 ring-yellow-300" : "ring-0"} p-2 rounded`
                                : "";

                              return (
                                <li key={m.id} className={`flex items-center justify-between gap-3 py-1 ${rowClass}`}>
                                  {!isEditing ? (
                                    <>
                                      <div className="flex-1">
                                        <div className="font-medium">{m.merchant_name}</div>
                                        <div className="text-xs text-gray-600">קטגוריה: {parent.name} • תת-קטגוריה: {sub.name}</div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <button onClick={() => startEdit(m)} className="text-sm px-2 py-1 bg-yellow-50 border rounded text-yellow-800">ערוך</button>
                                        <button onClick={() => deleteMapping(m.id)} className="text-red-500 hover:text-red-700">❌</button>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="flex-1 grid grid-cols-[2fr_1fr_1fr] gap-2 items-center">
                                        <input
                                          type="text"
                                          value={editing[m.id]?.merchant_name ?? ""}
                                          onChange={(e) => setEditing((prev) => ({ ...prev, [m.id]: { ...prev[m.id], merchant_name: e.target.value } }))}
                                          className="border p-1 rounded"
                                          onKeyDown={(e) => handleEditKeyDown(e, m.id)}
                                        />
                                        <select
                                          value={editing[m.id]?.category_id ?? ""}
                                          onChange={(e) =>
                                            setEditing((prev) => ({ ...prev, [m.id]: { ...prev[m.id], category_id: e.target.value, subcategory_id: "" } }))
                                          }
                                          className="border p-1 rounded"
                                          onKeyDown={(e) => handleEditKeyDown(e, m.id)}
                                        >
                                          <option value="">בחר קטגוריה</option>
                                          {parentCategories.map((p) => (
                                            <option key={p.id} value={p.id}>
                                              {p.name}
                                            </option>
                                          ))}
                                        </select>

                                        <select
                                          value={editing[m.id]?.subcategory_id ?? ""}
                                          onChange={(e) => setEditing((prev) => ({ ...prev, [m.id]: { ...prev[m.id], subcategory_id: e.target.value } }))}
                                          className="border p-1 rounded"
                                          disabled={!editing[m.id]?.category_id}
                                          onKeyDown={(e) => handleEditKeyDown(e, m.id)}
                                        >
                                          <option value="">תת-קטגוריה (אופציונלי)</option>
                                          {editing[m.id]?.category_id &&
                                            subcategoriesOf(Number(editing[m.id].category_id)).map((sopt) => (
                                              <option key={sopt.id} value={sopt.id}>
                                                {sopt.name}
                                              </option>
                                            ))}
                                        </select>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <button onClick={() => saveEdit(m.id)} className="text-sm px-2 py-1 bg-green-600 text-white rounded">שמור</button>
                                        <button onClick={() => cancelEdit(m.id)} className="text-sm px-2 py-1 bg-gray-200 rounded">ביטול</button>
                                      </div>
                                    </>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    );
                  })}

                  {/* unassigned for parent */}
                  <div className="pt-2 border-t">
                    <h4 className="font-semibold mb-2">מיפויים ללא תת-קטגוריה</h4>
                    <ul className="space-y-1">
                      {group.unassigned.length === 0 && <li className="text-sm text-gray-500">אין מיפויים</li>}
                      {group.unassigned.map((m) => {
                        const isEditing = !!editing[m.id];
                        const dirty = isDirty(m.id);
                        const rowClass = isEditing ? `bg-blue-50 ${dirty ? "ring-2 ring-yellow-300" : "ring-0"} p-2 rounded` : "";

                        return (
                          <li key={m.id} className={`flex items-center justify-between gap-3 py-1 ${rowClass}`}>
                            {!isEditing ? (
                              <>
                                <div className="flex-1">
                                  <div className="font-medium">{m.merchant_name}</div>
                                  <div className="text-xs text-gray-600">קטגוריה: {parent.name}</div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button onClick={() => startEdit(m)} className="text-sm px-2 py-1 bg-yellow-50 border rounded text-yellow-800">ערוך</button>
                                  <button onClick={() => deleteMapping(m.id)} className="text-red-500 hover:text-red-700">❌</button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex-1 grid grid-cols-[2fr_1fr_1fr] gap-2 items-center">
                                  <input
                                    type="text"
                                    value={editing[m.id]?.merchant_name ?? ""}
                                    onChange={(e) => setEditing((prev) => ({ ...prev, [m.id]: { ...prev[m.id], merchant_name: e.target.value } }))}
                                    className="border p-1 rounded"
                                    onKeyDown={(e) => handleEditKeyDown(e, m.id)}
                                  />
                                  <select
                                    value={editing[m.id]?.category_id ?? ""}
                                    onChange={(e) =>
                                      setEditing((prev) => ({ ...prev, [m.id]: { ...prev[m.id], category_id: e.target.value, subcategory_id: "" } }))
                                    }
                                    className="border p-1 rounded"
                                    onKeyDown={(e) => handleEditKeyDown(e, m.id)}
                                  >
                                    <option value="">בחר קטגוריה</option>
                                    {parentCategories.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name}
                                      </option>
                                    ))}
                                  </select>

                                  <select
                                    value={editing[m.id]?.subcategory_id ?? ""}
                                    onChange={(e) => setEditing((prev) => ({ ...prev, [m.id]: { ...prev[m.id], subcategory_id: e.target.value } }))}
                                    className="border p-1 rounded"
                                    disabled={!editing[m.id]?.category_id}
                                    onKeyDown={(e) => handleEditKeyDown(e, m.id)}
                                  >
                                    <option value="">תת-קטגוריה (אופציונלי)</option>
                                    {editing[m.id]?.category_id &&
                                      subcategoriesOf(Number(editing[m.id].category_id)).map((sopt) => (
                                        <option key={sopt.id} value={sopt.id}>
                                          {sopt.name}
                                        </option>
                                      ))}
                                  </select>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button onClick={() => saveEdit(m.id)} className="text-sm px-2 py-1 bg-green-600 text-white rounded">שמור</button>
                                  <button onClick={() => cancelEdit(m.id)} className="text-sm px-2 py-1 bg-gray-200 rounded">ביטול</button>
                                </div>
                              </>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Orphans: mappings whose category record isn't found */}
      {orphans && orphans.length > 0 && (
        <div className="mt-6 p-4 border rounded">
          <h3 className="font-semibold mb-2">מיפויים לא משויכים</h3>
          <ul className="space-y-1">
            {orphans.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-1">
                <div>
                  <div className="font-medium">{m.merchant_name}</div>
                  <div className="text-xs text-gray-600">קטגוריה: {getCategoryName(m.category_id) || "לא ידוע"}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => startEdit(m)} className="text-sm px-2 py-1 bg-yellow-50 border rounded text-yellow-800">ערוך</button>
                  <button onClick={() => deleteMapping(m.id)} className="text-red-500 hover:text-red-700">❌</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}