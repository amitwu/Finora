from datetime import datetime
from app.database import SessionLocal
from app.models import CategoryDB, MerchantMappingDB
from sqlalchemy.orm import Session

# List of default mappings (merchant_name -> parent category name -> subcategory name)
DEFAULT_MAPPINGS = [
    {"merchant_name": "שופרסל", "category": "קניות", "subcategory": "מזון לבית"},
    {"merchant_name": "חצי חינם", "category": "קניות", "subcategory": "מזון לבית"},
    {"merchant_name": "רמי לוי", "category": "קניות", "subcategory": "מזון לבית"},
    {"merchant_name": "יוחננוף", "category": "קניות", "subcategory": "מזון לבית"},
    {"merchant_name": "אושר עד", "category": "קניות", "subcategory": "מזון לבית"},
    {"merchant_name": "סופר פארם", "category": "קניות", "subcategory": "סופר פארם וכד'"},
    {"merchant_name": "פז", "category": "רכב", "subcategory": "הוצאות דלק"},
    {"merchant_name": "פז אפליקציה יילו", "category": "רכב", "subcategory": "הוצאות דלק"},
    {"merchant_name": "דלק", "category": "רכב", "subcategory": "הוצאות דלק"},
    {"merchant_name": "עיריית תל אביב", "category": "שונות", "subcategory": "תשלומי עירייה"},
    {"merchant_name": "עיריית ראשון לציון", "category": "שונות", "subcategory": "תשלומי עירייה"},
    {"merchant_name": "בזק", "category": "ספקי שירות", "subcategory": "בזק + בזק בינלאומי"},
    {"merchant_name": "חברת פרטנר תקשורת בע", "category": "ספקי שירות", "subcategory": "פרטנר / סלולרי"},
    {"merchant_name": "הוט", "category": "ספקי שירות", "subcategory": "פרטנר / סלולרי"},
    {"merchant_name": "יס", "category": "ספקי שירות", "subcategory": "פרטנר / סלולרי"},
    {"merchant_name": "חשמל", "category": "ספקי שירות", "subcategory": "חשמל"},
    {"merchant_name": "בנק לאומי", "category": "בנק", "subcategory": "עמלות וריביות"},
    {"merchant_name": "בנק מזרחי", "category": "בנק", "subcategory": "עמלות וריביות"},
    {"merchant_name": "קפה קפה", "category": "פנאי ובילויים", "subcategory": "מסעדות ובתי קפה"},
    {"merchant_name": "ארומה", "category": "פנאי ובילויים", "subcategory": "מסעדות ובתי קפה"},
    {"merchant_name": "ארט קפה", "category": "פנאי ובילויים", "subcategory": "מסעדות ובתי קפה"},
]

def seed_mappings():
    db: Session = SessionLocal()
    try:
        print("🔄 Clearing existing merchant mappings...")
        db.query(MerchantMappingDB).delete()
        db.commit()

        now = datetime.utcnow()

        for m in DEFAULT_MAPPINGS:
            merchant_name = m["merchant_name"].strip()
            parent_name = m.get("category", "").strip()
            sub_name = m.get("subcategory", "").strip() if m.get("subcategory") else None

            # Find parent category (top-level) by name
            parent = db.query(CategoryDB).filter(
                CategoryDB.name == parent_name,
                CategoryDB.parent_id.is_(None)
            ).first()

            if not parent:
                print(f"⚠️ Parent category '{parent_name}' not found for merchant '{merchant_name}', creating it.")
                parent = CategoryDB(name=parent_name, type="expense", parent_id=None)
                db.add(parent)
                db.flush()  # get parent.id

            # Find subcategory under the parent by name; create if missing
            subcat = None
            if sub_name:
                subcat = db.query(CategoryDB).filter(
                    CategoryDB.name == sub_name,
                    CategoryDB.parent_id == parent.id
                ).first()
                if not subcat:
                    print(f"⚠️ Subcategory '{sub_name}' not found under '{parent_name}'. Creating it.")
                    subcat = CategoryDB(name=sub_name, type=parent.type, parent_id=parent.id)
                    db.add(subcat)
                    db.flush()

            # Upsert: update existing mapping (case-insensitive) or create new with timestamps
            existing = db.query(MerchantMappingDB).filter(
                MerchantMappingDB.merchant_name.ilike(merchant_name)
            ).first()

            if existing:
                existing.category_id = parent.id
                existing.subcategory_id = subcat.id if subcat else None
                existing.updated_at = now
                print(f"🔁 Updated mapping for '{merchant_name}'")
            else:
                mapping = MerchantMappingDB(
                    merchant_name=merchant_name,
                    category_id=parent.id,
                    subcategory_id=subcat.id if subcat else None,
                    created_at=now,
                    updated_at=now
                )
                db.add(mapping)
                print(f"➕ Created mapping for '{merchant_name}'")

        db.commit()
        print("✅ Merchant mappings seeded successfully!")

    except Exception as e:
        db.rollback()
        print("❌ Error while seeding mappings:", e)
    finally:
        db.close()

if __name__ == "__main__":
    seed_mappings()