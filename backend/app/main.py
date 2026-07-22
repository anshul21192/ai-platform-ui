from fastapi import FastAPI
from app.database import engine, Base
from app.routers import behaviour, verification, incidents, telemetry

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Core Anomaly Analytics Hub",
    description="Banking behavior evaluation system framework infrastructure engine.",
    version="1.0.0"
)


app.include_router(verification.router, prefix="/api")
app.include_router(incidents.router, prefix="/api")
app.include_router(telemetry.router, prefix="/api")

@app.get("/")
async def status_check():
    return {"status": "Operational", "documentation": "/docs"}
