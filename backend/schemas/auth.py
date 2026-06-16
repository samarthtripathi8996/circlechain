from pydantic import BaseModel, EmailStr
from models.user import UserRole

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    role: UserRole

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None
