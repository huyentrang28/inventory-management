from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas.auth import UserResponse


class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    entity_name: str
    entity_id: Optional[str] = None
    old_values: Optional[str] = None
    new_values: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class SystemSettingResponse(BaseModel):
    id: int
    key: str
    value: str
    description: Optional[str] = None
    is_public: bool

    class Config:
        from_attributes = True


class SystemSettingUpdate(BaseModel):
    value: str
    description: Optional[str] = None

