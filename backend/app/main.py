from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import verification, incidents, telemetry

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Core Anomaly Analytics Hub",
    description="Banking behavior evaluation system framework infrastructure engine.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(verification.router, prefix="/api")
app.include_router(incidents.router, prefix="/api")
app.include_router(telemetry.router, prefix="/api")

@app.get("/")
async def status_check():
    return {"status": "Operational", "documentation": "/docs"}
