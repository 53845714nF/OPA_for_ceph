from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta

from database import get_db_connection
from auth import verify_password, get_password_hash, create_access_token
from schemas.auth import RegisterRequest
from config import ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(tags=["authentication"])

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT hashed_password, role FROM users WHERE username = ?", (form_data.username,))
    user = cursor.fetchone()
    conn.close()

    if not user or not verify_password(form_data.password, user[0]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username, "role": user[1]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register")
def register(req: RegisterRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (req.username,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_pw = get_password_hash(req.password)
    cursor.execute("INSERT INTO users (username, hashed_password, role) VALUES (?, ?, ?)", (req.username, hashed_pw, req.role))
    conn.commit()
    conn.close()
    return {"status": "success", "message": f"User {req.username} registered successfully"}
