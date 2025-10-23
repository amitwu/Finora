import React, { useState, useEffect } from "react";
import { CategoryAPI, MerchantMappingAPI } from "../api/api";

export default function MappingPage() {
  const [categories, setCategories] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [newMapping, setNewMapping] = useState({ merchant_name: "", category_id: "", subcategory_id: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    loadCategories();
    loadMappings();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await CategoryAPI.getCategories();
      setCategories(data);
    } catch (err) {
      setError(`שגיאה בטעינת קטגוריות: ${err.message}`);
    }
  };

  const loadMappings = async () => {
    try {
      const data = await MerchantMappingAPI.getMappings();
      setMappings(data);
    } catch (err) {
      setError(`שגיאה בטעינת מיפויים: ${err.message}`);
    }
  };

  const addMapping = async () => {
    if (!newMapping.merchant_name || !newMapping.category_id) return;
    
    try {
      await MerchantMappingAPI.createMapping({
        merchant_name: newMapping.merchant_name.trim(),
        category_id: Number(newMapping.category_id),
        subcategory_id: newMapping.subcategory_id ? Number(newMapping.subcategory_id) : null,
      });
      setNewMapping({ merchant_name: "", category_id: "", subcategory_id: "" });
      loadMappings();
    } catch (err) {
      setError(`שגיאה ביצירת מיפוי: ${err.message}`);
    }
  };

  const deleteMapping = async (id) => {
    if (!window.confirm("למחוק מיפוי זה?")) return;
    try {
      await MerchantMappingAPI.deleteMapping(id);
      loadMappings();
    } catch (err) {
      setError(`שגיאה במחיקה: ${err.message}`);
    }
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || 'לא ידוע';
  };

  const getSubcategoryName = (subcategoryId) => {
    const sub = categories.find(c => c.id === subcategoryId);
    return sub?.name || '';
  };

  const parentCategories = categories.filter(c => !c.parent_id);
  const subcategories = categories.filter(c => c.parent_id);

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-md" dir="rtl">
      <h1 className="text-3xl font-extrabold mb-6 text-purple-800 text-right">מיפוי בתי עסק לקטגוריות</h1>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      )}

      {/* Add new mapping */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h3 className="text-xl font-bold mb-4">הוסף מיפוי חדש</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם בית עסק</label>
            <input
              type="text"
              value={newMapping.merchant_name}
              onChange={(e) => setNewMapping({ ...newMapping, merchant_name: e.target.value })}
              placeholder="כל בו חצי חינם המרכבה"
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה ראשית</label>
            <select
              value={newMapping.category_id}
              onChange={(e) => setNewMapping({ ...newMapping, category_id: e.target.value, subcategory_id: "" })}
              className="w-full border p-2 rounded"
            >
              <option value="">בחר קטגוריה</option>
              {parentCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.type === 'income' ? 'הכנסה' : 'הוצאה'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תת-קטגוריה</label>
            <select
              value={newMapping.subcategory_id}
              onChange={(e) => setNewMapping({ ...newMapping, subcategory_id: e.target.value })}
              className="w-full border p-2 rounded"
              disabled={!newMapping.category_id}
            >
              <option value="">בחר תת-קטגוריה (אופציונלי)</option>
              {subcategories
                .filter(sub => sub.parent_id === Number(newMapping.category_id))
                .map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={addMapping}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              הוסף מיפוי
            </button>
          </div>
        </div>
      </div>

      {/* Existing mappings */}
      <div>
        <h3 className="text-xl font-bold mb-4">מיפויים קיימים ({mappings.length})</h3>
        {mappings.length === 0 ? (
          <p className="text-gray-600 text-center py-8">אין מיפויים עדיין</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-right">בית עסק</th>
                  <th className="p-3 text-right">קטגוריה</th>
                  <th className="p-3 text-right">תת-קטגוריה</th>
                  <th className="p-3 text-right">נוצר</th>
                  <th className="p-3 text-right">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map(mapping => (
                  <tr key={mapping.id} className="border-b">
                    <td className="p-3">{mapping.merchant_name}</td>
                    <td className="p-3">{getCategoryName(mapping.category_id)}</td>
                    <td className="p-3">{mapping.subcategory_id ? getSubcategoryName(mapping.subcategory_id) : '-'}</td>
                    <td className="p-3">{new Date(mapping.created_at).toLocaleDateString('he-IL')}</td>
                    <td className="p-3">
                      <button
                        onClick={() => deleteMapping(mapping.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        מחק
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
        <h4 className="font-bold text-blue-800 mb-2">איך זה עובד?</h4>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• הוסף מיפויים בין שמות בתי עסק לקטגוריות</li>
          <li>• בעת העלאת תדפיסים, המערכת תשתמש במיפויים האלה</li>
          <li>• לדוגמה: "כל בו חצי חינם המרכבה" → קטגוריה: קניות, תת-קטגוריה: מזון לבית</li>
          <li>• המיפויים נשמרים במסד הנתונים</li>
        </ul>
      </div>
    </div>
  );
}
