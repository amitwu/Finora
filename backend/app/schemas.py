from pydantic import BaseModel
from datetime import date, datetime
from typing import List, Optional

class SubCategory(BaseModel):
    id: int
    name: str
    parent_id: Optional[int] = None

    class Config:
        from_attributes = True

class Category(BaseModel):
    id: int
    name: str
    type: str
    parent_id: Optional[int] = None
    subcategories: List[SubCategory] = []

    class Config:
        from_attributes = True

class CategoryCreate(BaseModel):
    name: str
    type: str
    parent_id: Optional[int] = None

class BudgetItemBase(BaseModel):
    category_id: int
    planned: float
    actual: float
    date: date

class BudgetItemCreate(BudgetItemBase):
    pass

class BudgetItem(BudgetItemBase):
    id: int
    class Config:
        from_attributes = True

class MonthlySummary(BaseModel):
    income: dict
    expenses: dict
    balance: dict

class MerchantMappingBase(BaseModel):
    merchant_name: str
    category_id: int
    subcategory_id: Optional[int] = None

class MerchantMappingCreate(MerchantMappingBase):
    pass

class MerchantMapping(MerchantMappingBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
