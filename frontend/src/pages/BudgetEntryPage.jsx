import React, { useEffect, useState } from "react";
import { BudgetItemAPI, CategoryAPI } from "../api/api";
import { Button } from "../components/ui/button";

export default function BudgetEntryPage() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [categories, setCategories] = useState([]);
  const [budgetData, setBudgetData] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      loadBudgetItems();
    }
  }, [month, year, categories]);

  const loadCategories = async () => {
    try {
      const data = await CategoryAPI.getCategories();
      setCategories(data);
    } catch (err) {
      setError(`שגיאה בטעינת קטגוריות: ${err.message}`);
    }
  };

  const loadBudgetItems = async () => {
    try {
      const items = await BudgetItemAPI.getBudgetItems(month, year);
      const mapped = {};
      
      // Initialize with existing data from DB
      for (const item of items) {
        mapped[item.category_id] = {
          planned: item.planned || 0,
          actual: item.actual || 0,
        };
      }
      
      // Also initialize empty entries for categories that don't have data yet
      const allCategories = categories.filter(c => c.type === "income" || c.type === "expense");
      for (const cat of allCategories) {
        if (!mapped[cat.id]) {
          mapped[cat.id] = {
            planned: 0,
            actual: 0,
          };
        }
      }
      
      setBudgetData(mapped);
    } catch (err) {
      setError(`שגיאה בטעינת נתוני תקציב: ${err.message}`);
    }
  };

  const handleValueChange = (categoryId, field, value) => {
    // evaluate arithmetic expressions safely
    let evaluatedValue = 0;
    try {
      if (value.trim() === "") {
        evaluatedValue = 0;
      } else {
        // allow arithmetic like "200+100-50", "200*1.5", "1000/2"
        // Replace common operators and handle parentheses
        const cleanValue = value.replace(/[^\d+\-*/().\s]/g, ''); // Remove non-numeric chars except operators
        evaluatedValue = Function(`"use strict";return (${cleanValue})`)();
        // Ensure it's a valid number
        if (isNaN(evaluatedValue) || !isFinite(evaluatedValue)) {
          evaluatedValue = 0;
        }
      }
    } catch {
      evaluatedValue = 0; // Default to 0 if invalid
    }

    setBudgetData((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [field]: evaluatedValue,
      },
    }));
  };

  const handleSave = async () => {
    try {
      const payload = Object.entries(budgetData).map(([category_id, values]) => ({
        category_id: Number(category_id),
        // save with current date as requested
        date: new Date().toISOString().slice(0, 10),
        planned: Number(values.planned) || 0,
        actual: Number(values.actual) || 0,
      }));

      await Promise.all(payload.map((item) => BudgetItemAPI.saveBudgetItem(item)));
      alert("✅ הנתונים נשמרו בהצלחה");
    } catch (err) {
      setError(`שגיאה בשמירת הנתונים: ${err.message}`);
    }
  };

  const incomeCategories = categories.filter((c) => c.type === "income" && !c.parent_id);
  const expenseCategories = categories.filter((c) => c.type === "expense" && !c.parent_id);

  const calcTotals = (categoryList) => {
    let planned = 0;
    let actual = 0;
    for (const cat of categoryList) {
      const subs = categories.filter((s) => s.parent_id === cat.id);
      if (subs.length === 0) {
        // If no subcategories, use parent category data
        planned += Number(budgetData[cat.id]?.planned || 0);
        actual += Number(budgetData[cat.id]?.actual || 0);
      } else {
        // If has subcategories, sum subcategory data
        for (const sub of subs) {
          planned += Number(budgetData[sub.id]?.planned || 0);
          actual += Number(budgetData[sub.id]?.actual || 0);
        }
      }
    }
    return { planned, actual, diff: actual - planned };
  };

  const renderCategorySection = (categoryList, title, color) => (
    <div className="flex-1">
      <h2 className={`text-xl font-bold mb-3 ${color}`}>{title}</h2>
      <div className="grid grid-cols-[1fr_100px_100px_100px] gap-2 items-center pr-2">
        <div className="text-sm text-gray-500">קטגוריה</div>
        <div className="text-sm text-gray-500 text-center">מתוכנן</div>
        <div className="text-sm text-gray-500 text-center">בפועל</div>
        <div className="text-sm text-gray-500 text-center">סכום</div>
      </div>
      {categoryList.map((cat) => {
        const subcategories = categories.filter((sub) => sub.parent_id === cat.id);
        
        return (
          <div key={cat.id} className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">{cat.name}</h3>
            
            {/* Show parent category if no subcategories */}
            {subcategories.length === 0 ? (
              (() => {
                const planned = Number(budgetData[cat.id]?.planned || 0);
                const actual = Number(budgetData[cat.id]?.actual || 0);
                const diff = actual - planned;
                return (
                  <div className="grid grid-cols-[1fr_100px_100px_100px] gap-2 items-center border-b pb-1">
                    <span className="text-gray-700">{cat.name}</span>
                    <input
                      type="text"
                      value={budgetData[cat.id]?.planned ?? ""}
                      onChange={(e) => handleValueChange(cat.id, "planned", e.target.value)}
                      placeholder="מתוכנן"
                      className="w-24 text-center border rounded p-1 justify-self-center"
                    />
                    <input
                      type="text"
                      value={budgetData[cat.id]?.actual ?? ""}
                      onChange={(e) => handleValueChange(cat.id, "actual", e.target.value)}
                      placeholder="בפועל"
                      className="w-24 text-center border rounded p-1 justify-self-center"
                    />
                    <div className={`text-center ${diff >= 0 ? "text-green-700" : "text-red-700"}`}>
                      {diff.toLocaleString("he-IL")}
                    </div>
                  </div>
                );
              })()
            ) : (
              /* Show subcategories */
              subcategories.map((sub) => {
                const planned = Number(budgetData[sub.id]?.planned || 0);
                const actual = Number(budgetData[sub.id]?.actual || 0);
                const diff = actual - planned;
                return (
                  <div key={sub.id} className="grid grid-cols-[1fr_100px_100px_100px] gap-2 items-center border-b pb-1">
                    <span className="text-gray-700">{sub.name}</span>
                    <input
                      type="text"
                      value={budgetData[sub.id]?.planned ?? ""}
                      onChange={(e) => handleValueChange(sub.id, "planned", e.target.value)}
                      placeholder="מתוכנן"
                      className="w-24 text-center border rounded p-1 justify-self-center"
                    />
                    <input
                      type="text"
                      value={budgetData[sub.id]?.actual ?? ""}
                      onChange={(e) => handleValueChange(sub.id, "actual", e.target.value)}
                      placeholder="בפועל"
                      className="w-24 text-center border rounded p-1 justify-self-center"
                    />
                    <div className={`text-center ${diff >= 0 ? "text-green-700" : "text-red-700"}`}>
                      {diff.toLocaleString("he-IL")}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        );
      })}
      {/* Section totals */}
      {(() => {
        const t = calcTotals(categoryList);
        return (
          <div className="grid grid-cols-[1fr_100px_100px_100px] gap-2 items-center font-semibold mt-2">
            <div className="text-right">סיכום {title}</div>
            <div className="text-center">{t.planned.toLocaleString("he-IL")}</div>
            <div className="text-center">{t.actual.toLocaleString("he-IL")}</div>
            <div className={`text-center ${t.diff >= 0 ? "text-green-700" : "text-red-700"}`}>
              {t.diff.toLocaleString("he-IL")}
            </div>
          </div>
        );
      })()}
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white rounded-lg shadow-md" dir="rtl">
      <h1 className="text-3xl font-extrabold mb-6 text-purple-800 text-right">הזנת נתונים ידנית</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Month/Year Selectors */}
      <div className="flex gap-4 mb-6 items-end">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">חודש</label>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="border p-2 rounded"
        >
          {[
            "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
            "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
          ].map((m, i) => (
            <option key={i + 1} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">שנה</label>
          <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border p-2 rounded"
        >
          {[2024, 2025, 2026].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
          </select>
        </div>

        <Button onClick={handleSave} className="bg-blue-600 text-white">
          שמור נתונים
        </Button>
      </div>

      <div className="flex gap-8">
        {renderCategorySection(expenseCategories, "הוצאות", "text-red-600")}
        {renderCategorySection(incomeCategories, "הכנסות", "text-green-600")}
      </div>

      {/* Overall totals */}
      {(() => {
        const tIncome = calcTotals(incomeCategories);
        const tExpenses = calcTotals(expenseCategories);
        const planned = tIncome.planned - tExpenses.planned;
        const actual = tIncome.actual - tExpenses.actual;
        const diff = actual - planned;
        return (
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-2 text-right">סיכום חודשי</h3>
            <div className="grid grid-cols-[1fr_100px_100px_100px] gap-2 items-center font-semibold">
              <div className="text-right">סה"כ</div>
              <div className="text-center">{planned.toLocaleString("he-IL")}</div>
              <div className="text-center">{actual.toLocaleString("he-IL")}</div>
              <div className={`text-center ${diff >= 0 ? "text-green-700" : "text-red-700"}`}>{diff.toLocaleString("he-IL")}</div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
