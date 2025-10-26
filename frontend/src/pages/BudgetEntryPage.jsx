import React, { useEffect, useState } from "react";
import { BudgetItemAPI, CategoryAPI } from "../api/api";
import { Button } from "../components/ui/button";
import { Parser } from "expr-eval";

export default function BudgetEntryPage() {
  const parser = new Parser();

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [categories, setCategories] = useState([]);
  const [budgetData, setBudgetData] = useState({});
  const [error, setError] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);

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

      for (const item of items) {
        mapped[item.category_id] = {
          exprPlanned: item.planned != null ? String(item.planned) : "",
          planned: Number(item.planned) || 0,
          savedPlanned: Number(item.planned) || 0,
          exprActual: item.actual != null ? String(item.actual) : "",
          actual: Number(item.actual) || 0,
          savedActual: Number(item.actual) || 0,
          dirtyPlanned: false,
          dirtyActual: false,
          showPlannedValue: false,
          showActualValue: false,
          invalidPlanned: false,
          invalidActual: false,
        };
      }

      const allCategories = categories.filter((c) => c.type === "income" || c.type === "expense");
      for (const cat of allCategories) {
        if (!mapped[cat.id]) {
          mapped[cat.id] = {
            exprPlanned: "",
            planned: 0,
            savedPlanned: 0,
            exprActual: "",
            actual: 0,
            savedActual: 0,
            dirtyPlanned: false,
            dirtyActual: false,
            showPlannedValue: false,
            showActualValue: false,
            invalidPlanned: false,
            invalidActual: false,
          };
        }
      }

      setBudgetData(mapped);
    } catch (err) {
      setError(`שגיאה בטעינת נתוני תקציב: ${err.message}`);
    }
  };

  const allowedCharsRegex = /^[0-9+\-*/().\s^]*$/;
  const singleCharAllowed = /[0-9+\-*/().\s^]/;

  const evaluateExpression = (expr) => {
    if (!expr || expr.trim() === "") return 0;
    if (!allowedCharsRegex.test(expr)) {
      throw new Error("תווים לא חוקיים בביטוי");
    }
    const value = parser.evaluate(expr);
    if (typeof value !== "number" || !isFinite(value) || Number.isNaN(value)) {
      throw new Error("תוצאה לא תקינה");
    }
    return value;
  };

  const moveCaretToEnd = (el) => {
    try {
      const len = el.value?.length ?? 0;
      el.setSelectionRange(len, len);
      el.scrollLeft = el.scrollWidth;
    } catch {
      // ignore
    }
  };

  const handleInputChange = (categoryId, field /* 'planned' | 'actual' */, exprString) => {
    const exprField = field === "planned" ? "exprPlanned" : "exprActual";
    const valueField = field === "planned" ? "planned" : "actual";
    const savedField = field === "planned" ? "savedPlanned" : "savedActual";
    const dirtyField = field === "planned" ? "dirtyPlanned" : "dirtyActual";
    const showField = field === "planned" ? "showPlannedValue" : "showActualValue";
    const invalidField = field === "planned" ? "invalidPlanned" : "invalidActual";

    const hasOnlyAllowed = allowedCharsRegex.test(exprString);
    if (!hasOnlyAllowed) {
      setBudgetData((prev) => ({
        ...prev,
        [categoryId]: {
          ...(prev[categoryId] || {}),
          [exprField]: exprString,
          [invalidField]: true,
          [showField]: false,
        },
      }));
      return;
    }

    let evaluated = 0;
    let dirty = false;
    try {
      evaluated = evaluateExpression(exprString);
      const saved = Number(budgetData[categoryId]?.[savedField] ?? 0);
      dirty = Number(evaluated) !== Number(saved);
    } catch {
      evaluated = 0;
      const saved = Number(budgetData[categoryId]?.[savedField] ?? 0);
      dirty = saved !== 0;
    }

    setBudgetData((prev) => ({
      ...prev,
      [categoryId]: {
        ...(prev[categoryId] || {}),
        [exprField]: exprString,
        [valueField]: evaluated,
        [dirtyField]: dirty,
        [showField]: false,
        [invalidField]: false,
      },
    }));
  };

  const handleKeyPress = (e, categoryId, field) => {
    const char = e.key;
    if (char.length === 1 && !singleCharAllowed.test(char)) {
      e.preventDefault();
      const invalidField = field === "planned" ? "invalidPlanned" : "invalidActual";
      setBudgetData((prev) => ({
        ...prev,
        [categoryId]: {
          ...(prev[categoryId] || {}),
          [invalidField]: true,
        },
      }));
    }
  };

  const handlePaste = (e, categoryId, field) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text") || "";
    const sanitized = text.split("").filter((ch) => singleCharAllowed.test(ch)).join("");
    const target = e.target;
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    const newValue = target.value.slice(0, start) + sanitized + target.value.slice(end);
    handleInputChange(categoryId, field, newValue);
  };

  const handleInputKeyDown = (e, categoryId, field) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const exprField = field === "planned" ? "exprPlanned" : "exprActual";
      const valueField = field === "planned" ? "planned" : "actual";
      const savedField = field === "planned" ? "savedPlanned" : "savedActual";
      const dirtyField = field === "planned" ? "dirtyPlanned" : "dirtyActual";
      const showField = field === "planned" ? "showPlannedValue" : "showActualValue";
      const invalidField = field === "planned" ? "invalidPlanned" : "invalidActual";

      const entry = budgetData[categoryId] || {};
      const exprString = entry[exprField] ?? "";

      if (!allowedCharsRegex.test(exprString)) {
        setBudgetData((prev) => ({
          ...prev,
          [categoryId]: {
            ...(prev[categoryId] || {}),
            [invalidField]: true,
            [showField]: false,
          },
        }));
        return;
      }

      let evaluated = 0;
      let dirty = false;
      try {
        evaluated = evaluateExpression(exprString);
        dirty = Number(evaluated) !== Number(entry?.[savedField] ?? 0);
      } catch {
        evaluated = 0;
        dirty = Number(entry?.[savedField] ?? 0) !== 0;
      }

      // set preview and dirty, then blur the field so preview state is obvious
      setBudgetData((prev) => ({
        ...prev,
        [categoryId]: {
          ...(prev[categoryId] || {}),
          [valueField]: evaluated,
          [dirtyField]: dirty,
          [showField]: true,
          [invalidField]: false,
        },
      }));

      // blur the input so the preview state is clear (this also prevents onFocus from hiding preview)
      try {
        // e.target may be the input element
        e.target.blur();
      } catch {
        // ignore
      }
    }
  };

  const handleInputFocus = (e, categoryId, field) => {
    const showField = field === "planned" ? "showPlannedValue" : "showActualValue";
    const invalidField = field === "planned" ? "invalidPlanned" : "invalidActual";
    setBudgetData((prev) => ({
      ...prev,
      [categoryId]: {
        ...(prev[categoryId] || {}),
        [showField]: false,
        [invalidField]: false,
      },
    }));
    const el = e.target;
    el.style.textAlign = "right";
    moveCaretToEnd(el);
  };

  const handleSave = async () => {
    try {
      const payload = Object.entries(budgetData).map(([category_id, values]) => ({
        category_id: Number(category_id),
        date: new Date().toISOString().slice(0, 10),
        planned: Number(values.planned) || 0,
        actual: Number(values.actual) || 0,
      }));

      await Promise.all(payload.map((item) => BudgetItemAPI.saveBudgetItem(item)));

      setBudgetData((prev) => {
        const next = { ...prev };
        for (const [cid, vals] of Object.entries(next)) {
          next[cid] = {
            ...vals,
            savedPlanned: Number(vals.planned || 0),
            savedActual: Number(vals.actual || 0),
            dirtyPlanned: false,
            dirtyActual: false,
            showPlannedValue: false,
            showActualValue: false,
            exprPlanned: String(Number(vals.planned || 0)),
            exprActual: String(Number(vals.actual || 0)),
            invalidPlanned: false,
            invalidActual: false,
          };
        }
        return next;
      });

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
        planned += Number(budgetData[cat.id]?.planned || 0);
        actual += Number(budgetData[cat.id]?.actual || 0);
      } else {
        for (const sub of subs) {
          planned += Number(budgetData[sub.id]?.planned || 0);
          actual += Number(budgetData[sub.id]?.actual || 0);
        }
      }
    }
    return { planned, actual, diff: actual - planned };
  };

  const LegendTooltip = () => (
    <div
      className="absolute z-50 right-0 mt-2 w-56 bg-white border border-gray-200 rounded shadow-lg p-2 text-sm"
      role="tooltip"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="font-semibold mb-1">מקרא צבעים</div>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-3 h-3 bg-yellow-100 border border-yellow-400 rounded-sm" />
        <div>ערך שונה (לא נשמר)</div>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-3 h-3 bg-green-50 border border-green-400 rounded-sm" />
        <div>תצוגת תוצאה לאחר Enter (תצוגה מקדימה)</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-red-50 border border-red-500 rounded-sm" />
        <div>קלט לא חוקי (מכיל תווים בלתי מורשים)</div>
      </div>
    </div>
  );

  const renderCategorySection = (categoryList, title, color) => (
    <div className="flex-1">
      <h2 className={`text-xl font-bold mb-3 ${color}`}>{title}</h2>
      <div className="grid grid-cols-[1fr_120px_120px_100px] gap-2 items-center pr-2">
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

            {subcategories.length === 0 ? (
              (() => {
                const entry = budgetData[cat.id] || {
                  exprPlanned: "",
                  planned: 0,
                  savedPlanned: 0,
                  exprActual: "",
                  actual: 0,
                  savedActual: 0,
                  dirtyPlanned: false,
                  dirtyActual: false,
                  showPlannedValue: false,
                  showActualValue: false,
                  invalidPlanned: false,
                  invalidActual: false,
                };
                const planned = Number(entry.planned || 0);
                const actual = Number(entry.actual || 0);
                const diff = actual - planned;

                // Prioritize preview (green) over dirty (yellow). Invalid (red) overrides both.
                const plannedInputClass = `w-28 text-right border rounded p-1 justify-self-center ${
                  entry.invalidPlanned
                    ? "border-red-500 bg-red-50"
                    : entry.showPlannedValue
                    ? "bg-green-50 border-green-400"
                    : entry.dirtyPlanned
                    ? "bg-yellow-100 border-yellow-400"
                    : ""
                }`;
                const actualInputClass = `w-28 text-right border rounded p-1 justify-self-center ${
                  entry.invalidActual
                    ? "border-red-500 bg-red-50"
                    : entry.showActualValue
                    ? "bg-green-50 border-green-400"
                    : entry.dirtyActual
                    ? "bg-yellow-100 border-yellow-400"
                    : ""
                }`;

                return (
                  <div className="grid grid-cols-[1fr_120px_120px_100px] gap-2 items-center border-b pb-1">
                    <span className="text-gray-700">{cat.name}</span>

                    <div className="flex flex-col items-center">
                      <input
                        type="text"
                        value={entry.exprPlanned ?? ""}
                        onChange={(e) => handleInputChange(cat.id, "planned", e.target.value)}
                        onKeyDown={(e) => handleInputKeyDown(e, cat.id, "planned")}
                        onKeyPress={(e) => handleKeyPress(e, cat.id, "planned")}
                        onPaste={(e) => handlePaste(e, cat.id, "planned")}
                        onFocus={(e) => handleInputFocus(e, cat.id, "planned")}
                        placeholder="מספר או ביטוי"
                        className={plannedInputClass}
                      />
                      {entry.invalidPlanned && <div className="text-xs text-red-600 mt-1">תווים לא חוקיים</div>}
                      {entry.showPlannedValue && (
                        <div className="text-xs text-green-700 mt-1">{Number(entry.planned || 0).toLocaleString("he-IL")}</div>
                      )}
                    </div>

                    <div className="flex flex-col items-center">
                      <input
                        type="text"
                        value={entry.exprActual ?? ""}
                        onChange={(e) => handleInputChange(cat.id, "actual", e.target.value)}
                        onKeyDown={(e) => handleInputKeyDown(e, cat.id, "actual")}
                        onKeyPress={(e) => handleKeyPress(e, cat.id, "actual")}
                        onPaste={(e) => handlePaste(e, cat.id, "actual")}
                        onFocus={(e) => handleInputFocus(e, cat.id, "actual")}
                        placeholder="מספר או ביטוי"
                        className={actualInputClass}
                      />
                      {entry.invalidActual && <div className="text-xs text-red-600 mt-1">תווים לא חוקיים</div>}
                      {entry.showActualValue && (
                        <div className="text-xs text-green-700 mt-1">{Number(entry.actual || 0).toLocaleString("he-IL")}</div>
                      )}
                    </div>

                    <div className={`text-center ${diff >= 0 ? "text-green-700" : "text-red-700"}`}>
                      {diff.toLocaleString("he-IL")}
                    </div>
                  </div>
                );
              })()
            ) : (
              subcategories.map((sub) => {
                const entry = budgetData[sub.id] || {
                  exprPlanned: "",
                  planned: 0,
                  savedPlanned: 0,
                  exprActual: "",
                  actual: 0,
                  savedActual: 0,
                  dirtyPlanned: false,
                  dirtyActual: false,
                  showPlannedValue: false,
                  showActualValue: false,
                  invalidPlanned: false,
                  invalidActual: false,
                };
                const planned = Number(entry.planned || 0);
                const actual = Number(entry.actual || 0);
                const diff = actual - planned;

                const plannedInputClass = `w-28 text-right border rounded p-1 justify-self-center ${
                  entry.invalidPlanned
                    ? "border-red-500 bg-red-50"
                    : entry.showPlannedValue
                    ? "bg-green-50 border-green-400"
                    : entry.dirtyPlanned
                    ? "bg-yellow-100 border-yellow-400"
                    : ""
                }`;
                const actualInputClass = `w-28 text-right border rounded p-1 justify-self-center ${
                  entry.invalidActual
                    ? "border-red-500 bg-red-50"
                    : entry.showActualValue
                    ? "bg-green-50 border-green-400"
                    : entry.dirtyActual
                    ? "bg-yellow-100 border-yellow-400"
                    : ""
                }`;

                return (
                  <div key={sub.id} className="grid grid-cols-[1fr_120px_120px_100px] gap-2 items-center border-b pb-1">
                    <span className="text-gray-700">{sub.name}</span>

                    <div className="flex flex-col items-center">
                      <input
                        type="text"
                        value={entry.exprPlanned ?? ""}
                        onChange={(e) => handleInputChange(sub.id, "planned", e.target.value)}
                        onKeyDown={(e) => handleInputKeyDown(e, sub.id, "planned")}
                        onKeyPress={(e) => handleKeyPress(e, sub.id, "planned")}
                        onPaste={(e) => handlePaste(e, sub.id, "planned")}
                        onFocus={(e) => handleInputFocus(e, sub.id, "planned")}
                        placeholder="מספר או ביטוי"
                        className={plannedInputClass}
                      />
                      {entry.invalidPlanned && <div className="text-xs text-red-600 mt-1">תווים לא חוקיים</div>}
                      {entry.showPlannedValue && (
                        <div className="text-xs text-green-700 mt-1">{Number(entry.planned || 0).toLocaleString("he-IL")}</div>
                      )}
                    </div>

                    <div className="flex flex-col items-center">
                      <input
                        type="text"
                        value={entry.exprActual ?? ""}
                        onChange={(e) => handleInputChange(sub.id, "actual", e.target.value)}
                        onKeyDown={(e) => handleInputKeyDown(e, sub.id, "actual")}
                        onKeyPress={(e) => handleKeyPress(e, sub.id, "actual")}
                        onPaste={(e) => handlePaste(e, sub.id, "actual")}
                        onFocus={(e) => handleInputFocus(e, sub.id, "actual")}
                        placeholder="מספר או ביטוי"
                        className={actualInputClass}
                      />
                      {entry.invalidActual && <div className="text-xs text-red-600 mt-1">תווים לא חוקיים</div>}
                      {entry.showActualValue && (
                        <div className="text-xs text-green-700 mt-1">{Number(entry.actual || 0).toLocaleString("he-IL")}</div>
                      )}
                    </div>

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
      {(() => {
        const t = calcTotals(categoryList);
        return (
          <div className="grid grid-cols-[1fr_120px_120px_100px] gap-2 items-center font-semibold mt-2">
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-purple-800 text-right">הזנת נתונים ידנית</h1>

        <div
          className="relative flex items-center gap-2"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <button
            aria-label="מקרא צבעים"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 border"
            onClick={() => setShowTooltip((s) => !s)}
            type="button"
          >
            <span className="text-gray-700 font-bold">i</span>
          </button>

          {showTooltip && <LegendTooltip />}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex gap-4 mb-6 items-end">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">חודש</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border p-2 rounded"
          >
            {[
              "ינואר",
              "פברואר",
              "מרץ",
              "אפריל",
              "מאי",
              "יוני",
              "יולי",
              "אוגוסט",
              "ספטמבר",
              "אוקטובר",
              "נובמבר",
              "דצמבר",
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

      {(() => {
        const tIncome = calcTotals(incomeCategories);
        const tExpenses = calcTotals(expenseCategories);
        const planned = tIncome.planned - tExpenses.planned;
        const actual = tIncome.actual - tExpenses.actual;
        const diff = actual - planned;
        return (
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-2 text-right">סיכום חודשי</h3>
            <div className="grid grid-cols-[1fr_120px_120px_100px] gap-2 items-center font-semibold">
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