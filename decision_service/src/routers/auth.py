from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
import logging

from ldap_client import ldap_client
from auth import create_access_token
from schemas.auth import RegisterRequest
from config import ACCESS_TOKEN_EXPIRE_MINUTES, AUTHENTIK_URL

logger = logging.getLogger(__name__)

router = APIRouter(tags=["authentication"])


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Authenticates the user against Authentik via LDAP and returns a JWT access token
    with the user's role determined from LDAP group memberships.
    """
    auth_result = ldap_client.authenticate(form_data.username, form_data.password)

    if not auth_result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_role = auth_result.get("role", "user")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username, "role": user_role},
        expires_delta=access_token_expires,
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user_role,
        "groups": auth_result.get("groups", []),
    }


@router.post("/register")
def register(req: RegisterRequest):
    """
    User registration is managed centrally through Authentik.
    Direct DB registration is deprecated in favor of Authentik IAM.
    """
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"User management is managed centrally via Authentik. Please create or manage accounts at {AUTHENTIK_URL}",
    )


@router.get("/auth-provider-info")
def auth_provider_info():
    """
    Returns information about the configured identity provider.
    """
    return {
        "provider": "authentik-ldap",
        "authentik_url": AUTHENTIK_URL,
        "ldap_server_url": ldap_client.server_url,
        "ldap_base_dn": ldap_client.base_dn,
        "ldap_healthy": ldap_client.is_healthy(),
    }
