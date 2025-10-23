import React, { useState, useEffect } from "react";
import { BudgetItemAPI } from "../api/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function DashboardPage() {
  const [summaryData, setSummaryData] = useState({
    income: { planned: 0, actual: 0, difference: 0 },
    expenses: { planned: 0, actual: 0, difference: 0 },
    balance: { planned: 0, actual: 0, difference: 0 },
  });
  const [chartData, setChartData] = useState([]);
  const [globalError, setGlobalError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setGlobalError("");
      setIsLoading(true);
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      try {
        const summary = await BudgetItemAPI.getMonthlySummary(currentMonth, currentYear);
        setSummaryData(summary);

        const dataForChart = [];
        for (let i = 5; i >= 0; i--) {
          let month = currentMonth - i;
          let year = currentYear;
          if (month <= 0) {
            month += 12;
            year -= 1;
          }
          const monthlySummary = await BudgetItemAPI.getMonthlySummary(month, year);
          dataForChart.push({
            name: new Date(year, month - 1).toLocaleString("he-IL", {
              month: "short",
              year: "2-digit",
            }),
            הכנסה: monthlySummary.income.actual,
            הוצאה: monthlySummary.expenses.actual,
            מאזן: monthlySummary.balance.actual,
          });
        }
        setChartData(dataForChart);
      } catch (error) {
        setGlobalError(
          `שגיאה בטעינת נתוני לוח המחוונים: ${error.message}.`
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[300px]">
        <div className="loader ml-3"></div>
        <p className="text-gray-700 text-lg">טוען נתונים...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {globalError && (
        <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">
          {globalError}
        </div>
      )}

      <h1 className="text-3xl font-bold mb-6 text-purple-800">סקירה פיננסית</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-b-4 border-green-500 text-center">
          <div className="text-green-600 text-4xl mb-2">⬆️</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">הכנסות חודשיות</h3>
          <p className="text-3xl font-bold text-green-700">
            {formatCurrency(summaryData.income.actual)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-b-4 border-red-500 text-center">
          <div className="text-red-600 text-4xl mb-2">⬇️</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">הוצאות חודשיות</h3>
          <p className="text-3xl font-bold text-red-700">
            {formatCurrency(summaryData.expenses.actual)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-b-4 border-purple-500 text-center">
          <div className="text-purple-600 text-4xl mb-2">💰</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">יתרה כוללת</h3>
          <p
            className={`text-3xl font-bold ${
              summaryData.balance.actual >= 0 ? "text-green-700" : "text-red-700"
            }`}
          >
            {formatCurrency(summaryData.balance.actual)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-purple-800">סקירת 6 חודשים אחרונים</h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(val) => formatCurrency(val)} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="הכנסה" stroke="#82ca9d" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="הוצאה" stroke="#ff7300" />
              <Line type="monotone" dataKey="מאזן" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-600 text-center py-10">
            אין נתונים זמינים לגרף. אנא הזן נתונים ידנית.
          </p>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
