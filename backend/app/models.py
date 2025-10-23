from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, DateTime
from sqlalchemy.orm import relationship
from .database import Base

class CategoryDB(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # "income" or "expense"
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)

    parent = relationship("CategoryDB", remote_side=[id], backref="subcategories")

class BudgetItemDB(Base):
    __tablename__ = "budget_items"
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    date = Column(Date, nullable=False)
    planned = Column(Float, default=0)
    actual = Column(Float, default=0)
    type = Column(String, nullable=False)  # "income" or "expense" (copied from category)

    category = relationship("CategoryDB", backref="budget_items")

class MerchantMappingDB(Base):
    __tablename__ = "merchant_mappings"
    id = Column(Integer, primary_key=True, index=True)
    merchant_name = Column(String, nullable=False, unique=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    subcategory_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)

    category = relationship("CategoryDB", foreign_keys=[category_id], backref="merchant_mappings")
    subcategory = relationship("CategoryDB", foreign_keys=[subcategory_id])
