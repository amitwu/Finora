from app.database import SessionLocal
from app.models import CategoryDB

# Parent -> list of subcategories
INCOME_CATEGORIES = {
    "מקורות הכנסה": [
        "משכורת  ראשונה",
        "משכורת  שניה",
        "הכנסה נוספת",
        "קצבה ביטוח לאומי",
        "הכנסה משכירות",
        "תמיכה",
        "בונוסים מתנות",
        "שונות",
    ],
}

EXPENSE_CATEGORIES = {
    "בית שוטף": ["השכרת דירה / משכנתא", "ביטוח משכנתא", "ועד בית", "אחזקת בית", "ביטוחים חיים", "ביטוחים בריאות"],
    "ספקי שירות": ["חשמל", "ארנונה + מים", "גז", "יס / הוט", "בזק + בזק בינלאומי", "פרטנר / סלולרי", "ניקיון בית / עוזרת"],
    "קניות": ["סופר פארם וכד'", "ביגוד והנעלה", "מזון לבית", "קוסמטיקה", "קפה", "אלקטרוניקה ומחשוב", "תספורת"],
    "רכב": ["תיקוני רכב", "ביטוח רכב", "טסט", "הוצאות דלק", "חניה", "כביש 6"],
    "פנאי ובילויים": ["חדר כושר / מנוי", "אירועים ומתנות", "תרומות", "מסעדות ובתי קפה", "סיגריות / אלכוהול"],
    "בנק": ["הלוואות", "עמלות וריביות"],
    "שונות": ["רפואה פרטית", "חופשה / טיול", "יהדות וחגים", "תשלומי עיריה", "דמי כרטיס אשראי", "מזומן", "בלתי צפויות"],
}

def seed_categories():
    db = SessionLocal()
    try:
        print("🔄 Clearing existing categories...")
        db.query(CategoryDB).delete()

        # --- Income: create parent + subcategories ---
        print("📥 Seeding income categories (parent + subcategories)...")
        for parent_name, subcats in INCOME_CATEGORIES.items():
            parent = CategoryDB(name=parent_name, type="income", parent_id=None)
            db.add(parent)
            db.flush()  # get parent.id
            for sub in subcats:
                db.add(CategoryDB(name=sub, type="income", parent_id=parent.id))

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