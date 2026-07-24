from typing import Generic, TypeVar, Optional, List, Any
from pydantic import BaseModel

T = TypeVar('T')

class FilterMeta(BaseModel):
    applied_stores: Optional[List[int]] = None
    applied_months: Optional[List[str]] = None
    total_records: int = 0

class StandardResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Success"
    data: Optional[T] = None
    meta: Optional[FilterMeta] = None
