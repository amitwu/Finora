import React, { useState } from "react";
import { BudgetItemAPI, CategoryAPI, MerchantMappingAPI } from "../api/api";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [parsedData, setParsedData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [mappings, setMappings] = useState([]);

  React.useEffect(() => {
    CategoryAPI.getCategories().then(setCategories);
    // Load mappings from database
    MerchantMappingAPI.getMappings().then(setMappings).catch(() => {
      // If API fails, fallback to empty array
      setMappings([]);
    });
  }, []);

  const parseBankStatement = (text) => {
    const lines = text.split(/\r?\n/).filter(Boolean);
    const transactions = [];
    
    for (const line of lines) {
      // Skip header lines
      if (line.includes('פירוט עסקאות') || line.includes('תאריך') || line.includes('שם בית עסק')) continue;
      
      // Parse Hebrew bank statement format: תאריך, שם בית עסק, סוג עסקה, סכום עסקה, סכום חיוב, ענף, הערות
      const parts = line.split(/\t+/); // Tab-separated
      if (parts.length >= 5) {
        const [dateStr, merchant, type, amountStr, chargeStr, category, notes] = parts;
        
        // Parse date (DD/MM/YY format)
        const dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{2})/);
        if (!dateMatch) continue;
        
        const [, day, month, year] = dateMatch;
        const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
        const isoDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        // Parse amount (remove ₪ and commas)
        const amount = parseFloat(amountStr.replace(/[₪,]/g, '')) || 0;
        
        // Find mapping for this merchant
        const merchantName = merchant.trim();
        const mapping = mappings.find(m => 
          merchantName.toLowerCase().includes(m.merchant_name.toLowerCase()) ||
          m.merchant_name.toLowerCase().includes(merchantName.toLowerCase())
        );
        
        transactions.push({
          date: isoDate,
          merchant: merchantName,
          type: type.trim(),
          amount,
          category: category?.trim() || 'לא ידוע',
          notes: notes?.trim() || '',
          // Use mapping if found, otherwise default to expense category
          category_id: mapping ? mapping.category_id : (categories.find(c => c.type === 'expense')?.id || 1),
          subcategory_id: mapping?.subcategory_id || null,
          mapped: !!mapping
        });
      }
    }
    
    return transactions;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFile(file);
    setStatus("מעבד קובץ...");
    
    try {
      const text = await file.text();
      const transactions = parseBankStatement(text);
      setParsedData(transactions);
      setStatus(`נמצאו ${transactions.length} עסקאות`);
    } catch (err) {
      setStatus(`שגיאה בעיבוד הקובץ: ${err.message}`);
    }
  };

  const handleSave = async () => {
    if (parsedData.length === 0) return;
    
    setStatus("שומר נתונים...");
    try {
      const payload = parsedData.map(t => ({
        date: t.date,
        category_id: t.category_id,
        planned: 0,
        actual: t.amount
      }));
      
      await Promise.all(payload.map(item => BudgetItemAPI.saveBudgetItem(item)));
      setStatus(`נשמרו ${payload.length} עסקאות בהצלחה`);
      setParsedData([]);
    } catch (err) {
      setStatus(`שגיאה בשמירה: ${err.message}`);
    }
  };

  const updateCategory = (index, categoryId) => {
    setParsedData(prev => prev.map((item, i) => 
      i === index ? { ...item, category_id: Number(categoryId) } : item
    ));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-md" dir="rtl">
      <h1 className="text-3xl font-extrabold mb-6 text-purple-800 text-right">העלאת תדפיסים</h1>
      
      <div className="mb-6">
        <input 
          type="file" 
          accept=".txt,.csv" 
          onChange={handleFileUpload}
          className="border p-2 rounded"
        />
        <p className="text-sm text-gray-600 mt-2">
          העלה קובץ תדפיס בנק בפורמט טקסט. הקובץ צריך להכיל עמודות: תאריך, שם בית עסק, סוג עסקה, סכום עסקה, סכום חיוב, ענף, הערות
        </p>
      </div>

      {status && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded">
          {status}
        </div>
      )}

      {parsedData.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-4">עסקאות שזוהו ({parsedData.length})</h3>
          <div className="max-h-96 overflow-y-auto border rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="p-2 text-right">תאריך</th>
                  <th className="p-2 text-right">בית עסק</th>
                  <th className="p-2 text-right">סכום</th>
                  <th className="p-2 text-right">קטגוריה</th>
                  <th className="p-2 text-right">מיפוי</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.map((transaction, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{transaction.date}</td>
                    <td className="p-2">{transaction.merchant}</td>
                    <td className="p-2">{transaction.amount.toLocaleString()} ₪</td>
                    <td className="p-2">
                      <select 
                        value={transaction.category_id} 
                        onChange={(e) => updateCategory(index, e.target.value)}
                        className="border rounded p-1"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name} ({cat.type === 'income' ? 'הכנסה' : 'הוצאה'})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        transaction.mapped ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transaction.mapped ? 'ממופה' : 'לא ממופה'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button 
            onClick={handleSave}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
          >
            שמור עסקאות
          </button>
        </div>
      )}
    </div>
  );
}


