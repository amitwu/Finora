# backend/app/seed/seed_mappings.py
from app.database import SessionLocal
from app.models import CategoryDB, MerchantMappingDB

DEFAULT_MAPPINGS = [
    {"merchant_name": "שופרסל", "category": "קניות", "subcategory": "מזון לבית"},
    {"merchant_name": "סופר פארם", "category": "קניות", "subcategory": "סופר פארם וכד'"},
    {"merchant_name": "פז", "category": "רכב", "subcategory": "הוצאות דלק"},
    {"merchant_name": "דלק", "category": "רכב", "subcategory": "הוצאות דלק"},
    {"merchant_name": "עיריית תל אביב", "category": "שונות", "subcategory": "תשלומי עירייה"},
    {"merchant_name": "בזק", "category": "ספקי שירות", "subcategory": "בזק + בזק בינלאומי"},
    {"merchant_name": "פרטנר", "category": "ספקי שירות", "subcategory": "פרטנר / סלולרי"},
    {"merchant_name": "חשמל", "category": "ספקי שירות", "subcategory": "חשמל"},
    {"merchant_name": "לאומי", "category": "בנק", "subcategory": "עמלות וריביות"},
    {"merchant_name": "מזרחי", "category": "בנק", "subcategory": "הלוואות"},
    {"merchant_name": "קפה קפה", "category": "פנאי ובילויים", "subcategory": "מסעדות ובתי קפה"},
]

def seed_mappings():
    db = SessionLocal()
    try:
        print("🔄 Clearing existing merchant mappings...")
        db.query(MerchantMappingDB).delete()

        for m in DEFAULT_MAPPINGS:
            category = db.query(CategoryDB).filter(CategoryDB.name == m["category"]).first()
            subcategory = db.query(CategoryDB).filter(CategoryDB.name == m["subcategory"]).first()

            if category:
                db.add(
                    MerchantMappingDB(
                        merchant_name=m["merchant_name"],
                        category_id=category.id,
                        subcategory_id=subcategory.id if subcategory else None,
                    )
                )
            else:
                print(f"⚠️ Category '{m['category']}' not found for merchant '{m['merchant_name']}'")

        db.commit()
        print("✅ Merchant mappings seeded successfully!")

    except Exception as e:
        db.rollback()
        print("❌ Error while seeding mappings:", e)
    finally:
        db.close()

if __name__ == "__main__":
    seed_mappings()
