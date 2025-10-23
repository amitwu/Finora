from sqlalchemy.orm import Session
from datetime import date, datetime
from . import models, schemas

# --- Categories ---
def get_categories(db: Session):
    # Return all categories (parents and subcategories) so the UI can render hierarchy
    return db.query(models.CategoryDB).all()

def create_category(db: Session, category: schemas.CategoryCreate):
    db_cat = models.CategoryDB(**category.dict())
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat

def update_category(db: Session, category_id: int, category: schemas.CategoryCreate):
    db_cat = db.query(models.CategoryDB).get(category_id)
    if not db_cat:
        return None
    for field, value in category.dict().items():
        setattr(db_cat, field, value)
    db.commit()
    return db_cat

def delete_category(db: Session, category_id: int):
    db_cat = db.query(models.CategoryDB).get(category_id)
    if not db_cat:
        return False
    db.delete(db_cat)
    db.commit()
    return True

# --- Budget Items ---
def get_budget_items(db: Session, start_date: date, end_date: date):
    return db.query(models.BudgetItemDB).filter(
        models.BudgetItemDB.date >= start_date,
        models.BudgetItemDB.date <= end_date
    ).all()

def create_or_update_budget_item(db: Session, item: schemas.BudgetItemCreate):
    # Ensure type is set from category
    category = db.query(models.CategoryDB).get(item.category_id)
    if not category:
        raise ValueError(f"Category {item.category_id} not found")

    db_item = db.query(models.BudgetItemDB).filter_by(
        category_id=item.category_id,
        date=item.date
    ).first()
    if db_item:
        db_item.planned = item.planned
        db_item.actual = item.actual
        db_item.type = category.type
    else:
        db_item = models.BudgetItemDB(
            category_id=item.category_id,
            date=item.date,
            planned=item.planned,
            actual=item.actual,
            type=category.type,
        )
        db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def delete_budget_item(db: Session, item_id: int):
    db_item = db.query(models.BudgetItemDB).get(item_id)
    if not db_item:
        return False
    db.delete(db_item)
    db.commit()
    return True

# --- Merchant Mappings ---
def get_merchant_mappings(db: Session):
    return db.query(models.MerchantMappingDB).all()

def get_merchant_mapping(db: Session, merchant_name: str):
    return db.query(models.MerchantMappingDB).filter(
        models.MerchantMappingDB.merchant_name.ilike(f"%{merchant_name}%")
    ).first()

def create_merchant_mapping(db: Session, mapping: schemas.MerchantMappingCreate):
    now = datetime.now()
    db_mapping = models.MerchantMappingDB(
        merchant_name=mapping.merchant_name,
        category_id=mapping.category_id,
        subcategory_id=mapping.subcategory_id,
        created_at=now,
        updated_at=now
    )
    db.add(db_mapping)
    db.commit()
    db.refresh(db_mapping)
    return db_mapping

def update_merchant_mapping(db: Session, mapping_id: int, mapping: schemas.MerchantMappingCreate):
    db_mapping = db.query(models.MerchantMappingDB).get(mapping_id)
    if not db_mapping:
        return None
    db_mapping.merchant_name = mapping.merchant_name
    db_mapping.category_id = mapping.category_id
    db_mapping.subcategory_id = mapping.subcategory_id
    db_mapping.updated_at = datetime.now()
    db.commit()
    return db_mapping

def delete_merchant_mapping(db: Session, mapping_id: int):
    db_mapping = db.query(models.MerchantMappingDB).get(mapping_id)
    if not db_mapping:
        return False
    db.delete(db_mapping)
    db.commit()
    return True
