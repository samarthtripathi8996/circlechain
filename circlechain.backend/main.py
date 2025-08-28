from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, producer, consumer, recycler, admin

from models import *
# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Marketplace API",
    description="Circular Economy Marketplace Backend",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(producer.router)
app.include_router(consumer.router)
app.include_router(recycler.router)
app.include_router(admin.router)

@app.get("/")
def root():
    return {"message": "Circular Economy Marketplace API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)