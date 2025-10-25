// src/App.jsx

import React from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom'; // ייבא גם Link ו-useLocation עבור ה-Sidebar
import Layout from './Layout.jsx'; // וודא שהנתיב ל-Layout.jsx נכון
import DashboardPage from './pages/DashboardPage'; // וודא שהנתיב נכון
import BudgetEntryPage from './pages/BudgetEntryPage';
//import BudgetEntryPage from './pages/BudgetEntryPage_jsxNOTGOOD.TXT/index.js'; // וודא שהנתיב נכון
import './index.css'; 
import CategoriesPage from './pages/CategoriesPage'; // Add this import near the top
import ReportsPage from './pages/ReportsPage';
import UploadPage from './pages/UploadPage';
import MappingPage from './pages/MappingPage';


// ייבא רכיבים נוספים של עמודים אם יש לך כאלה
// לדוגמה, אם קובץ `import` הוא עמוד בפני עצמו, צור לו קובץ ב-pages
// import ImportPage from './pages/ImportPage';
// import MappingConfigPage from './pages/MappingConfigPage';
// import MonthlyReportPage from './pages/MonthlyReportPage';
// import YearlyReportPage from './pages/YearlyReportPage';

// רכיב ה-App הראשי שמגדיר את הניתוב ואת הפריסה (Layout)
function App() {
  const location = useLocation(); // Hook לקבלת הנתיב הנוכחי

  // הגדרת שמות העמודים עבור התפריט הפעיל
  const currentPageName = {
    '/': 'Dashboard',
    '/dashboard': 'Dashboard', // הוסף את /dashboard אם זה הנתיב הנפרד
    '/import': 'Import',
    '/manual-entry': 'ManualEntry',
    '/Categories': 'Categories',
    '/mapping-config': 'MappingConfig',
    '/monthly-report': 'Monthly',
    '/yearly-report': 'Yearly',
  }[location.pathname] || 'Dashboard'; // ברירת מחדל ל-Dashboard

  return (
    // ה-Layout עוטף את כל העמודים ומספק את המבנה הכללי (כולל סרגל הצד)
    <Layout currentPageName={currentPageName}>
      <Routes>
        {/* נתיב עמוד הבית. כרגע מפנה ל-DashboardPage, שנה במידת הצורך */}
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} /> {/* נתיב מפורש ללוח המחוונים */}

        {/* עמוד ייבוא דפי בנק */}
        <Route path="/import" element={
          <div className="p-6 max-w-7xl mx-auto bg-white rounded-lg shadow-md">
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 text-purple-800">ייבוא דפי בנק</h1>
            <p className="text-lg text-gray-700 mb-4">כאן תוכל לייבא נתונים אוטומטית מדפי הבנק שלך.</p>
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mt-8 rounded-lg" role="alert">
              <p className="font-bold">פונקציונליות בפיתוח</p>
              <p>האזור הזה יאפשר בעתיד חיבור לנתוני בנק אוטומטי. כרגע הוא משמש כדוגמה לניווט בתפריט.</p>
            </div>
          </div>
        } />

        {/* עמוד הזנת נתונים ידנית */}
        <Route path="/manual-entry" element={<BudgetEntryPage />} />

        {/* עמוד הגדרת מיפויים */}
        <Route path="/mapping-config" element={
          <div className="p-6 max-w-7xl mx-auto bg-white rounded-lg shadow-md">
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 text-purple-800">הגדרת מיפויים</h1>
            <p className="text-lg text-gray-700 mb-4">כאן תוכל להגדיר כללים למיפוי אוטומטי של טרנזקציות לקטגוריות תקציב.</p>
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mt-8 rounded-lg" role="alert">
              <p className="font-bold">פונקציונליות בפיתוח</p>
              <p>אזור זה מיועד להגדרת כללי מיפוי מתקדמים. כרגע הוא משמש כדוגמה לניווט בתפריט.</p>
            </div>
          </div>
        } />

        {/* עמוד דוח חודשי */}
        <Route path="/monthly-report" element={<ReportsPage />} />

        {/* עמוד דוח שנתי */}
        <Route path="/yearly-report" element={
          <div className="p-6 max-w-7xl mx-auto bg-white rounded-lg shadow-md">
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 text-purple-800">דו"ח שנתי</h1>
            <p className="text-lg text-gray-700 mb-4">כאן יוצג דו"ח שנתי מקיף של המצב הפיננסי.</p>
            <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg" role="alert">
              <p className="font-bold">פונקציונליות בפיתוח</p>
              <p>האזור הזה יכיל דוחות שנתיים מתקדמים בעתיד. כרגע הוא משמש כדוגמה לניווט בתפריט.</p>
            </div>
          </div>
        } />

        {/* עמוד קטגוריות  */}
        <Route path="/categories" element={<CategoriesPage />} />

        {/* העלאת תדפיסים */}
        <Route path="/upload" element={<UploadPage />} />

        {/* מיפוי בתי עסק */}
        <Route path="/mapping" element={<MappingPage />} />
        

        {/* נתיב לטיפול בעמודים לא קיימים (404) */}
        <Route path="*" element={
          <div className="p-6 max-w-7xl mx-auto bg-white rounded-lg shadow-md text-center">
            <h1 className="text-4xl font-extrabold mb-4 text-red-600">404 - עמוד לא נמצא</h1>
            <p className="text-lg text-gray-700">מצטערים, העמוד שחיפשת לא קיים.</p>
            <Link to="/" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200">
              חזור לדף הבית
            </Link>
          </div>
        } />
      </Routes>
    </Layout>
  );
}

export default App;
