from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.permissions import RoleEnum
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
)
from app.dependencies.auth import get_current_user, record_audit_log
from app.models.auth import RefreshToken, Role, User
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    RefreshTokenRequest,
    Token,
    UserResponse,
)
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(User)
        .options(selectinload(User.roles).selectinload(Role.permissions))
        .where(User.email == login_data.email)
    )
    user = (await db.execute(stmt)).scalar_one_or_none()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không chính xác",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản đã bị tạm khóa, vui lòng liên hệ quản trị viên",
        )

    # Update last login
    user.last_login_at = datetime.now(timezone.utc)

    # Issue tokens
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=access_token_expires,
    )
    refresh_token_val = create_refresh_token()
    refresh_token_expires = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    refresh_token_obj = RefreshToken(
        token=refresh_token_val,
        user_id=user.id,
        expires_at=refresh_token_expires,
    )
    db.add(refresh_token_obj)

    await record_audit_log(
        db,
        action="LOGIN",
        entity_name="User",
        entity_id=str(user.id),
        user_id=user.id,
        request=request,
    )
    await db.commit()

    return Token(
        access_token=access_token,
        token_type="bearer",
        refresh_token=refresh_token_val,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(RefreshToken)
        .options(selectinload(RefreshToken.user))
        .where(
            RefreshToken.token == payload.refresh_token,
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
    )
    token_record = (await db.execute(stmt)).scalar_one_or_none()
    if not token_record or not token_record.user or not token_record.user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token không hợp lệ hoặc đã hết hạn",
        )

    # Revoke old refresh token (token rotation)
    token_record.revoked_at = datetime.now(timezone.utc)

    # Issue new pair
    access_token = create_access_token(
        data={"sub": str(token_record.user.id), "email": token_record.user.email}
    )
    new_refresh_val = create_refresh_token()
    new_refresh_expires = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    new_token_record = RefreshToken(
        token=new_refresh_val,
        user_id=token_record.user.id,
        expires_at=new_refresh_expires,
    )
    db.add(new_token_record)
    await db.commit()

    return Token(
        access_token=access_token,
        token_type="bearer",
        refresh_token=new_refresh_val,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    request: Request,
    payload: Optional[RefreshTokenRequest] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if payload and payload.refresh_token:
        stmt = select(RefreshToken).where(
            RefreshToken.token == payload.refresh_token,
            RefreshToken.user_id == current_user.id,
        )
        token_record = (await db.execute(stmt)).scalar_one_or_none()
        if token_record:
            token_record.revoked_at = datetime.now(timezone.utc)

    await record_audit_log(
        db,
        action="LOGOUT",
        entity_name="User",
        entity_id=str(current_user.id),
        user_id=current_user.id,
        request=request,
    )
    await db.commit()
    return MessageResponse(message="Đăng xuất thành công")


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu hiện tại không đúng",
        )

    current_user.hashed_password = get_password_hash(data.new_password)
    await db.commit()
    return MessageResponse(message="Đổi mật khẩu thành công")

