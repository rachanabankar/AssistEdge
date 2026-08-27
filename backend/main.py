from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import session, simulate
from routers import auth
from routers import profile
from routers import support
from fastapi.staticfiles import StaticFiles
import os
from models.database import Base, engine
from models import models
from routers import notifications
from routers import analytics

Base.metadata.create_all(bind=engine)

os.makedirs("static/avatars", exist_ok=True)

os.makedirs("static/support_screenshots", exist_ok=True)

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

from routers import manual
app.include_router(manual.router)

# Allow the React frontend (localhost:5173) AND the standalone demo HTML
# (opened directly via file://, which sends an origin of "null")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "null",
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(session.router)
app.include_router(simulate.router)
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(support.router)
app.include_router(notifications.router)
app.include_router(analytics.router)

@app.get("/")
def root():
    print("### ROOT RUNNING ###")
    return {"message": "Backend is running"}