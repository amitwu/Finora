אפליקציית ניהול תקציב (Fullstack) - FastAPI & React
פרויקט זה מציג אפליקציית ניהול תקציב מודרנית עם Backend ב-Python FastAPI ו-Frontend ב-React. האפליקציה מאפשרת ניהול תקציב חודשי, צפייה בסיכומים, ואף קבלת תובנות תקציביות באמצעות מודל שפה גדול (LLM) של Gemini API.

מבנה ה-Repository
המבנה החדש מאפשר הפרדה ברורה בין ה-Backend ל-Frontend ומקל על פיתוח ותחזוקה:

budget-app/
├── backend/
│   ├── app/
│   │   ├── main.py           # נקודת כניסה ראשית של אפליקציית ה-FastAPI
│   │   ├── models.py         # הגדרות ORM למסד הנתונים (SQLAlchemy)
│   │   ├── schemas.py        # הגדרות סכימות נתונים (Pydantic)
│   │   ├── crud.py           # פונקציות CRUD לטיפול בנתונים
│   │   ├── database.py       # לוגיקה לחיבור למסד הנתונים (SQLite)
│   │   └── routers/          # מודולים נפרדים לנקודות קצה (API endpoints)
│   │       └── budget.py
│   └── requirements.txt      # תלויות Python
├── frontend/
│   ├── public/               # קבצים סטטיים (למשל, index.html בסיסי, favicon)
│   ├── src/                  # קוד המקור של אפליקציית React
│   │   ├── components/       # רכיבי UI קטנים וניתנים לשימוש חוזר (תיקייה ריקה כרגע)
│   │   ├── pages/            # רכיבים של דפים שלמים
│   │   │   ├── DashboardPage.jsx
│   │   │   └── BudgetEntryPage.jsx
│   │   ├── utils/            # קבצי עזר
│   │   │   └── index.js
│   │   ├── Layout.jsx        # רכיב ה-React הראשי ופריסת האפליקציה
│   │   ├── main.jsx          # נקודת כניסה של React (מפעיל את Layout.jsx)
│   │   ├── index.css         # קובץ CSS גלובלי ותצורת Tailwind
│   │   └── api.js            # לוגיקה לקריאות API ל-Backend
│   ├── tailwind.config.js    # קונפיגורציה של Tailwind CSS
│   ├── index.html            # קובץ ה-HTML הראשי (נבנה ע"י Vite)
│   └── package.json          # תלויות וסקריפטים של Node.js/React
└── README.md

הגדרת סביבת עבודה והפעלה
כדי להפעיל את הפרויקט, עליך להגדיר ולהפעיל את ה-Backend וה-Frontend בנפרד.

1. הגדרת והפעלת ה-Backend (FastAPI)
FastAPI הוא פריימוורק Python קל משקל ומהיר לבניית APIs.

נווט לתיקיית ה-Backend:
פתח טרמינל (שורת פקודה/CMD/Bash) ונווט לתיקייה backend בתוך budget-app:

cd budget-app/backend

צור סביבה וירטואלית (מומלץ בחום):
ניהול תלויות ב-Python מתבצע באמצעות סביבות וירטואליות.

python -m venv venv

או (במק):

python3 -m venv venv

הפעל את הסביבה הווירטואלית:

Windows:

.\venv\Scripts\activate

macOS/Linux:

source venv/bin/activate

תראה (venv) בתחילת שורת הפקודה, מה שמעיד שהסביבה הופעלה.

התקן תלויות:
התקן את כל הספריות הנדרשות מפני קובץ requirements.txt:

pip install -r requirements.txt

הפעל את שרת ה-FastAPI:
נשתמש ב-uvicorn, שרת ASGI מהיר, כדי להריץ את אפליקציית FastAPI:

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

app.main:app: מציין להריץ את האובייקט app מתוך הקובץ main.py שבתוך תיקיית app.

--reload: מאפשר טעינה אוטומטית של השרת בכל שינוי קוד (נוח לפיתוח).

--host 0.0.0.0: מאפשר גישה לשרת מכל ממשק רשת (נדרש גם לגישה מה-Frontend).

--port 8000: מריץ את השרת על פורט 8000.

השרת אמור להיות זמין בכתובת http://127.0.0.1:8000 או http://localhost:8000.
השאר את הטרמינל הזה פתוח ופעיל.

2. הגדרת והפעלת ה-Frontend (React עם Vite)
ה-Frontend ייבנה באמצעות React ויופעל עם Vite, כלי Build מהיר.

נווט לתיקיית ה-Frontend:
פתח טרמינל חדש (בנפרד מהטרמינל של ה-backend) ונווט לתיקייה frontend בתוך budget-app:

cd budget-app/frontend

התקן תלויות Node.js:
ודא ש-Node.js ו-npm (או yarn/pnpm) מותקנים במחשב שלך.

npm install

הפעל את שרת הפיתוח של React:

npm run dev

שרת הפיתוח יופעל בדרך כלל בכתובת http://localhost:5173 (או פורט אחר זמין).

השאר את הטרמינל הזה פתוח ופעיל.

3. גישה לאפליקציה
לאחר שגם ה-Backend וגם ה-Frontend פועלים, תוכל לגשת לאפליקציה דרך כתובת ה-Frontend (לדוגמה http://localhost:5173) בדפדפן שלך. ה-Frontend ייצור קשר עם ה-Backend (FastAPI) בכתובת http://localhost:8000 לקבלת וניהול נתונים.

חשוב:

אם אתה נתקל בשגיאת "Failed to fetch" (כשל בטעינה) ב-frontend, זה ככל הנראה בגלל שהדפדפן שלך (או סביבת ה-Canvas שבה אתה מריץ) אינו יכול לגשת ל-"localhost" מסיבות אבטחה. במקרה כזה, תצטרך להשתמש בכלי כמו ngrok כדי לחשוף את ה-backend שלך לכתובת ציבורית:

התקן ngrok.

בטרמינל חדש (בנוסף לטרמינל שבו ה-FastAPI פועל), הרץ: ngrok http 8000

ngrok יספק לך כתובת URL ציבורית (לדוגמה, https://abcdef12345.ngrok.io).

שנה את הערך של API_BASE_URL בקובץ frontend/src/api.js לכתובת ה-URL שקיבלת מ-ngrok.

שמור את הקובץ ורענן את הדפדפן.

תכונות האפליקציה
לוח מחוונים: סקירה פיננסית חודשית הכוללת כרטיסי סיכום (הכנסות, הוצאות, מאזן) וגרף מגמה של 6 חודשים אחרונים.

ייבוא דפי בנק: אזור המיועד לייבוא אוטומטי של נתונים (פונקציונליות בפיתוח).

הזנת נתונים ידנית: טבלאות להזנה ועדכון של הכנסות והוצאות באופן ידני.

הגדרת מיפויים: אזור להגדרת כללים למיפוי אוטומטי של טרנזקציות לקטגוריות (פונקציונליות בפיתוח).

דו"ח חודשי: אזור להצגת דוחות חודשיים מפורטים (פונקציונליות בפיתוח).

דו"ח שנתי: אזור להצגת דוחות שנתיים מקיפים (פונקציונליות בפיתוח).

תובנות תקציביות (באמצעות Gemini API): לחץ על כפתור "קבל תובנות תקציביות ✨" באזור הסיכום (בדף הזנת נתונים ידנית) כדי לקבל ניתוח מפורט והמלצות מותאמות אישית ממודל שפה גדול (LLM) על בסיס נתוני התקציב שלך.

תהנה מניהול התקציב שלך!