from app.database import SessionLocal
from app.models import CategoryDB

INCOME_CATEGORIES = [
    "משכורת 1",
    "משכורת 2",
    "הכנסה נוספת",
    "קצבה ביטוח לאומי",
    "הכנסה משכירות",
    "תמיכה",
    "בונוסים מתנות",
]

EXPENSE_CATEGORIES = {
    "בית שוטף": ["השכרת דירה / משכנתא", "ביטוח משכנתא", "ועד בית", "אחזקת בית", "ביטוחים חיים", "ביטוחים בריאות"],
    "ספקי שירות": ["חשמל", "ארנונה + מים", "גז", "יס / הוט", "בזק + בזק בינלאומי", "פרטנר / סלולרי", "ניקיון בית / עוזרת"],
    "קניות": ["סופר פארם וכד'", "ביגוד והנעלה", "מזון לבית", "קוסמטיקה", "קפה", "אלקטרוניקה ומחשוב", "תספורת"],
    "רכב": ["תיקוני רכב", "ביטוח רכב", "טסט", "הוצאות דלק", "חניה", "כביש 6"],
    "פנאי ובילויים": ["חדר כושר / מנוי", "אירועים ומתנות", "תרומות", "מסעדות ובתי קפה", "סיגריות / אלכוהול"],
    "בנק": ["הלוואות", "עמלות וריביות"],
    "שונות": ["רפואה פרטית", "חופשה / טיול", "יהדות וחגים", "תשלומי עירייה", "דמי כרטיס אשראי", "מזומן", "בלתי צפויות"],
}

def seed_categories():
    db = SessionLocal()
    try:
        print("🔄 Clearing existing categories...")
        db.query(CategoryDB).delete()

        # --- Income ---
        print("📥 Seeding income categories...")
        for name in INCOME_CATEGORIES:
            db.add(CategoryDB(name=name, type="income", parent_id=None))

        # --- Expenses ---
        print("📥 Seeding expense categories & subcategories...")
        for main_cat, subcats in EXPENSE_CATEGORIES.items():
            parent = CategoryDB(name=main_cat, type="expense", parent_id=None)
            db.add(parent)
            db.flush()  # get parent.id

            for sub in subcats:
                db.add(CategoryDB(name=sub, type="expense", parent_id=parent.id))

        db.commit()
        print("✅ Categories & subcategories seeded successfully!")

    except Exception as e:
        db.rollback()
        print("❌ Error while seeding:", e)
    finally:
        db.close()


if __name__ == "__main__":
    seed_categories()
