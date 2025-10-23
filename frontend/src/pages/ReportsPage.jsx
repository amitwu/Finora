import React, { useEffect, useState } from "react";
import { BudgetItemAPI, CategoryAPI } from "../api/api";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function ReportsPage() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [summary, setSummary] = useState({
    income: { planned: 0, actual: 0, difference: 0 },
    expenses: { planned: 0, actual: 0, difference: 0 },
    balance: { planned: 0, actual: 0, difference: 0 },
  });
  const [budgetItems, setBudgetItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [aiInsights, setAiInsights] = useState("");

  const loadData = async () => {
    setError("");
    try {
      const [summaryData, itemsData, categoriesData] = await Promise.all([
        BudgetItemAPI.getMonthlySummary(month, year, startDate || undefined, endDate || undefined),
        BudgetItemAPI.getBudgetItems(month, year, startDate || undefined, endDate || undefined),
        CategoryAPI.getCategories()
      ]);
      setSummary(summaryData);
      setBudgetItems(itemsData);
      setCategories(categoriesData);
      
      // Generate AI insights
      generateAIInsights(summaryData, itemsData, categoriesData);
    } catch (e) {
      setError(e.message);
    }
  };

  const generateAIInsights = (summary, items, cats) => {
    const insights = [];
    
    if (summary.expenses.actual > summary.income.actual) {
      insights.push("⚠️ ההוצאות עולות על ההכנסות - מומלץ לבדוק הוצאות מיותרות");
    }
    
    if (summary.balance.actual < 0) {
      insights.push("📉 המאזן שלילי - כדאי לחסוך יותר או להגדיל הכנסות");
    }
    
    const topExpense = items
      .filter(item => cats.find(c => c.id === item.category_id)?.type === 'expense')
      .sort((a, b) => b.actual - a.actual)[0];
    
    if (topExpense) {
      const catName = cats.find(c => c.id === topExpense.category_id)?.name || 'לא ידוע';
      insights.push(`💰 הקטגוריה הכי יקרה: ${catName} (${topExpense.actual.toLocaleString()} ₪)`);
    }
    
    if (summary.income.difference > 0) {
      insights.push(`✅ ההכנסות בפועל גבוהות מהמתוכנן ב-${summary.income.difference.toLocaleString()} ₪`);
    }
    
    setAiInsights(insights.join('\n'));
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = (amount) => new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(amount || 0);

  // Prepare chart data
  const expenseData = budgetItems
    .filter(item => categories.find(c => c.id === item.category_id)?.type === 'expense')
    .map(item => ({
      name: categories.find(c => c.id === item.category_id)?.name || 'לא ידוע',
      value: item.actual,
      planned: item.planned
    }));

  const incomeData = budgetItems
    .filter(item => categories.find(c => c.id === item.category_id)?.type === 'income')
    .map(item => ({
      name: categories.find(c => c.id === item.category_id)?.name || 'לא ידוע',
      value: item.actual,
      planned: item.planned
    }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white rounded-lg shadow-md" dir="rtl">
      <h1 className="text-3xl font-extrabold mb-6 text-purple-800 text-right">דו"ח חודשי</h1>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      <div className="flex gap-4 mb-6 items-end">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">מתאריך</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border p-2 rounded" />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">עד תאריך</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border p-2 rounded" />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">חודש</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="border p-2 rounded">
            {["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"].map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">שנה</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border p-2 rounded">
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <button onClick={loadData} className="bg-blue-600 text-white px-4 py-2 rounded">רענן</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-b-4 border-green-500 text-center">
          <div className="text-green-600 text-4xl mb-2">⬆️</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">הכנסות</h3>
          <p className="text-3xl font-bold text-green-700">{formatCurrency(summary.income.actual)}</p>
          <p className="text-sm text-gray-500">מתוכנן: {formatCurrency(summary.income.planned)} | הפרש: {formatCurrency(summary.income.difference)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-b-4 border-red-500 text-center">
          <div className="text-red-600 text-4xl mb-2">⬇️</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">הוצאות</h3>
          <p className="text-3xl font-bold text-red-700">{formatCurrency(summary.expenses.actual)}</p>
          <p className="text-sm text-gray-500">מתוכנן: {formatCurrency(summary.expenses.planned)} | הפרש: {formatCurrency(summary.expenses.difference)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-b-4 border-purple-500 text-center">
          <div className="text-purple-600 text-4xl mb-2">💰</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">מאזן</h3>
          <p className={`text-3xl font-bold ${summary.balance.actual >= 0 ? "text-green-700" : "text-red-700"}`}>{formatCurrency(summary.balance.actual)}</p>
          <p className="text-sm text-gray-500">מתוכנן: {formatCurrency(summary.balance.planned)} | הפרש: {formatCurrency(summary.balance.difference)}</p>
        </div>
      </div>

      {/* AI Insights */}
      {aiInsights && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-lg">
          <h3 className="text-lg font-bold text-blue-800 mb-2">🤖 תובנות AI</h3>
          <div className="text-blue-700 whitespace-pre-line">{aiInsights}</div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Expenses Pie Chart */}
        {expenseData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4 text-right">הוצאות לפי קטגוריה</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Income Bar Chart */}
        {incomeData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4 text-right">הכנסות לפי קטגוריה</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incomeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(val) => formatCurrency(val)} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4 text-right">פירוט לפי קטגוריות</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b">
                <th className="p-2">קטגוריה</th>
                <th className="p-2">סוג</th>
                <th className="p-2">מתוכנן</th>
                <th className="p-2">בפועל</th>
                <th className="p-2">הפרש</th>
              </tr>
            </thead>
            <tbody>
              {budgetItems.map((item) => {
                const category = categories.find(c => c.id === item.category_id);
                const diff = item.actual - item.planned;
                return (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">{category?.name || 'לא ידוע'}</td>
                    <td className="p-2">{category?.type === 'income' ? 'הכנסה' : 'הוצאה'}</td>
                    <td className="p-2">{formatCurrency(item.planned)}</td>
                    <td className="p-2">{formatCurrency(item.actual)}</td>
                    <td className={`p-2 ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(diff)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


