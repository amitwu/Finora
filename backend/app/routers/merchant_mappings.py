from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import schemas, crud
from app.database import get_db

router = APIRouter(prefix="/merchant-mappings", tags=["merchant-mappings"])

@router.get("/", response_model=List[schemas.MerchantMapping])
def list_merchant_mappings(db: Session = Depends(get_db)):
    return crud.get_merchant_mappings(db)

@router.post("/", response_model=schemas.MerchantMapping)
def create_merchant_mapping(mapping: schemas.MerchantMappingCreate, db: Session = Depends(get_db)):
    return crud.create_merchant_mapping(db, mapping)

@router.put("/{mapping_id}", response_model=schemas.MerchantMapping)
def update_merchant_mapping(mapping_id: int, mapping: schemas.MerchantMappingCreate, db: Session = Depends(get_db)):
    updated = crud.update_merchant_mapping(db, mapping_id, mapping)
    if not updated:
        raise HTTPException(status_code=404, detail="Merchant mapping not found")
    return updated

@router.delete("/{mapping_id}", status_code=204)
def delete_merchant_mapping(mapping_id: int, db: Session = Depends(get_db)):
    success = crud.delete_merchant_mapping(db, mapping_id)
    if not success:
        raise HTTPException(status_code=404, detail="Merchant mapping not found")

@router.get("/search/{merchant_name}", response_model=schemas.MerchantMapping)
def search_merchant_mapping(merchant_name: str, db: Session = Depends(get_db)):
    mapping = crud.get_merchant_mapping(db, merchant_name)
    if not mapping:
        raise HTTPException(status_code=404, detail="Merchant mapping not found")
    return mapping

