from datetime import timedelta
import pytest

from app.core.security import (
    create_access_token,
    decode_token,
    get_password_hash,
    verify_password,
)


def test_password_hashing():
    raw_password = "SuperSecretPassword@123"
    hashed = get_password_hash(raw_password)
    assert hashed != raw_password
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword@123", hashed) is False


def test_jwt_token_encode_decode():
    payload_data = {"sub": "42", "email": "test@stockmanager.local"}
    token = create_access_token(data=payload_data, expires_delta=timedelta(minutes=10))
    decoded = decode_token(token)

    assert decoded is not None
    assert decoded["sub"] == "42"
    assert decoded["email"] == "test@stockmanager.local"
    assert decoded["type"] == "access"


def test_invalid_jwt_token():
    assert decode_token("invalid.token.structure") is None

