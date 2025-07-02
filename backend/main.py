from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import users, register, face_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    users.router,
    prefix="/api/users",
    tags=["users"],
)

app.include_router(
    register.router,
    prefix="/api/register",
    tags=["register"],
)

app.include_router(
    face_router.router,
    prefix="/api/face",
    tags=["face"],
)

@app.get("/")
async def root():
    return {"message": "Hello World"}