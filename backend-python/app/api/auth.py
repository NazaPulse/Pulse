"""Controlador de autenticación. Rutas idénticas a openapi.yaml y al Backend A:
`POST /api/auth/register` (201) y `POST /api/auth/login` (200).
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import (
    ErrorResponse,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    UserPublic,
)
from app.services.auth import auth_service

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    response_model=UserPublic,
    response_model_exclude_none=False,
    summary="Registrar un nuevo usuario",
    operation_id="registerUser",
    responses={400: {"model": ErrorResponse}},
)
def register(dto: RegisterRequest, db: Session = Depends(get_db)) -> UserPublic:
    return auth_service.register(db, dto)


@router.post(
    "/login",
    status_code=status.HTTP_200_OK,
    response_model=LoginResponse,
    summary="Autenticar un usuario y emitir un token de acceso",
    operation_id="loginUser",
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}},
)
def login(dto: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    return auth_service.login(db, dto)
