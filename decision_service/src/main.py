from os import getenv
from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile, Form
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from requests.exceptions import RequestException
import sqlite3
from jwt import encode as jwt_encode
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from ceph import CephClient
from opa import OPAClient

# Configuration
OPA_URL = getenv("OPA_URL", "http://localhost:8181")
CEPH_API_URL = getenv("CEPH_API_URL", "http://localhost:8081/api")
CEPH_USERNAME = getenv("CEPH_USERNAME", "admin")
CEPH_PASSWORD = getenv("CEPH_PASSWORD", "ceph-password")

ceph_client = CephClient(CEPH_API_URL, CEPH_USERNAME, CEPH_PASSWORD)
opa_client = OPAClient(OPA_URL)

app = FastAPI(title="Ceph OPA Decision Layer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT Configuration
SECRET_KEY = getenv("JWT_SECRET_KEY", "super-secret-key-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt_encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Database Setup
def init_db():
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            role TEXT NOT NULL
        )
    ''')
    # Seed default admin user
    cursor.execute("SELECT * FROM users WHERE username = ?", ("admin",))
    if not cursor.fetchone():
        hashed_pw = get_password_hash("admin")
        cursor.execute("INSERT INTO users (username, hashed_password, role) VALUES (?, ?, ?)", ("admin", hashed_pw, "admin"))
    conn.commit()
    conn.close()

init_db()

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = sqlite3.connect("users.db")
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

class RegisterRequest(BaseModel):
    username: str
    password: str
    role: str = "user"

@app.post("/register")
def register(req: RegisterRequest):
    conn = sqlite3.connect("users.db")
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

class ProvisionRequest(BaseModel):
    tenant: str
    workload: str
    pool_name: str
    pg_num: int

class DataManagementRequest(BaseModel):
    category: str
    applied_policies: list[str] = []


@app.post("/provision")
def provision_ceph_pool(req: ProvisionRequest):
    print(f"Received provision request for tenant {req.tenant}, workload {req.workload}, pool {req.pool_name}")
    
    decision = opa_client.get_decision(req.tenant, req.workload)
    if decision.get("allow", False):
        pool_type = decision.get("pool_type", "replicated")
    else:
        raise HTTPException(status_code=403, detail="Not allowed by OPA")

    ceph_response = ceph_client.create_pool(req.pool_name, req.pg_num, pool_type, [req.workload])

    return {
        "status": "success",
        "message": f"Successfully processed provisioning for {req.pool_name}",
        "ceph_response": ceph_response,
    }

@app.post("/validate-data")
def validate_data(req: DataManagementRequest):
    print(f"Received validation request for category {req.category}")
    
    result = opa_client.validate_data_management(req.category, req.applied_policies)
    opa_result = result.get("result", {})
    
    if opa_result.get("allow", False):
        return {
            "status": "success",
            "message": "Data management request is fully compliant.",
            "details": opa_result
        }
    else:
        violations = opa_result.get("violations", [])
        raise HTTPException(status_code=403, detail={
            "message": "Not allowed by Data Management Policy", 
            "violations": violations,
            "details": opa_result
        })

@app.get("/number_of_artifacts")
def get_number_of_artifacts():
    return 12281311

@app.get("/number_of_curators")
def get_number_of_curators():
    return 12

@app.get("/storage_size")
def get_storage_size():
    return "3,31 TB"

@app.get("/storage_location")
def get_storage_location():
    geo_coordinates = [
        {"city": "Cairo", "latitude": 30.0444, "longitude": 31.2357},
        {"city": "Alexandria", "latitude": 31.2001, "longitude": 29.9187},
        {"city": "Baghdad", "latitude": 33.3152, "longitude": 44.3661},
        {"city": "Basra", "latitude": 30.5081, "longitude": 47.7835}
    ]
    
    return geo_coordinates

@app.post("/upload-data")
async def upload_data(
    file: UploadFile = File(...),
    category: str = Form(...),
    author: str = Form(None),
    accessionIdentifier: str = Form(None),
    appliedPolicies: str = Form("")
):
    print(f"Received upload request for file {file.filename}, category {category}")
    
    # Parse applied policies from the request
    if appliedPolicies:
        applied_policies = [p.strip() for p in appliedPolicies.split(",") if p.strip()]
    else:
        # Fallback to defaults based on category for demonstration purposes
        applied_policies = ["encryption"] if category == "restricted" else []

    # Map frontend categories to OPA policy categories if they differ
    category_mapping = {
        "restricted": "sensitive_restricted",
        "master": "curated_master",
        "primary": "raw_primary",
        "manifest": "metadata_manifests",
        "access": "derived_access",
        "audit": "operational_audit"
    }
    
    opa_category = category_mapping.get(category, category)

    result = opa_client.validate_data_management(opa_category, applied_policies, author)
    opa_result = result.get("result", {})
    
    target_zone = opa_result.get("target_zone", "ägypten")
    
    if opa_result.get("allow", False):
        # Choose the correct S3 client based on the target zone
        s3_client = s3_iraq if target_zone == "irak" else s3_egypt
        target_endpoint = S3_ENDPOINT_IRAQ if target_zone == "irak" else S3_ENDPOINT_EGYPT
        
        # Define a bucket name (using the category as bucket for demonstration)
        bucket_name = opa_category.replace("_", "-")
        
        # Object Lock & Retention logic
        use_object_lock = False
        retention_days = 0
        
        if opa_category == "metadata_manifests":
            use_object_lock = True
            retention_days = 30 # 30 days retention for manifests

        try:
            # Stream the file to S3
            s3_client.upload_file(
                file.file, 
                bucket_name, 
                file.filename, 
                use_object_lock=use_object_lock,
                retention_days=retention_days
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"S3 Upload failed: {str(e)}")

        return {
            "status": "success",
            "message": f"File '{file.filename}' successfully uploaded to {target_zone.upper()}.",
            "details": opa_result,
            "filename": file.filename,
            "routing": {
                "target_zone": target_zone.upper(),
                "endpoint": target_endpoint
            }
        }
    else:
        violations = opa_result.get("violations", [])
        raise HTTPException(status_code=403, detail={
            "message": "Not allowed by Data Management Policy", 
            "violations": violations,
            "details": opa_result
        })

@app.get("/health")
def health_check():
    return {"status": "ok"}

