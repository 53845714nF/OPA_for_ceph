from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers.auth import router as auth_router
from routers.provision import router as provision_router
from routers.artifacts import router as artifacts_router
from routers.ceph_events import router as ceph_events_router

# Initialize Database
init_db()

app = FastAPI(title="Ceph OPA Decision Layer")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth_router)
app.include_router(provision_router)
app.include_router(artifacts_router)
app.include_router(ceph_events_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
