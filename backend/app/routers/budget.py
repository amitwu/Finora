from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from calendar import monthrange
from app import schemas, crud
from app.database import get_db

router = APIRouter(prefix="/budget", tags=["budget"])

def month_date_range(month: int, year: int):
    start = date(year, month, 1)
    end = date(year, month, monthrange(year, month)[1])
    return start, end

@router.get("/", response_model=List[schemas.BudgetItem])
def get_budget_items(
    month: Optional[int] = None,
    year: Optional[int] = None,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    # If explicit date range provided, use it; otherwise, require month/year
    if start_date and end_date:
        start, end = start_date, end_date
    else:
        if month is None or year is None:
            raise HTTPException(status_code=400, detail="Provide either month/year or start_date & end_date")
        start, end = month_date_range(month, year)
    return crud.get_budget_items(db, start, end)

@router.post("/", response_model=schemas.BudgetItem)
def create_budget_item(item: schemas.BudgetItemCreate, db: Session = Depends(get_db)):
    return crud.create_or_update_budget_item(db, item)

@router.delete("/{item_id}", status_code=204)
def delete_budget_item(item_id: int, db: Session = Depends(get_db)):
    success = crud.delete_budget_item(db, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found")

@router.get("/summary/", response_model=schemas.MonthlySummary)
def get_summary(
    month: Optional[int] = None,
    year: Optional[int] = None,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    if start_date and end_date:
        start, end = start_date, end_date
    else:
        if month is None or year is None:
            raise HTTPException(status_code=400, detail="Provide either month/year or start_date & end_date")
        start, end = month_date_range(month, year)
    items = crud.get_budget_items(db, start, end)
    income_planned = sum(i.planned for i in items if i.category.type == "income")
    income_actual = sum(i.actual for i in items if i.category.type == "income")
    expense_planned = sum(i.planned for i in items if i.category.type == "expense")
    expense_actual = sum(i.actual for i in items if i.category.type == "expense")
    return {
        "income": {"planned": income_planned, "actual": income_actual, "difference": income_actual - income_planned},
        "expenses": {"planned": expense_planned, "actual": expense_actual, "difference": expense_actual - expense_planned},
        "balance": {"planned": income_planned - expense_planned, "actual": income_actual - expense_actual, "difference": (income_actual - expense_actual) - (income_planned - expense_planned)},
    }
