"""
FastAPI application entry point for the voice interaction backend.
"""

import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.config import get_settings
from app.api.routes import router as calls_router
from app.services.redis_service import get_redis_service


def setup_logging():
    """Configure loguru for structured logging."""
    settings = get_settings()
    
    # Remove default handler
    logger.remove()
    
    # Add console handler with structured format
    logger.add(
        sys.stderr,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level=settings.log_level,
        colorize=True
    )
    
    # Add file handler for persistent logs
    logger.add(
        settings.log_file,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level=settings.log_level,
        rotation="10 MB",
        retention="7 days",
        compression="gz"
    )
    
    logger.info("Logging configured successfully")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown."""
    # Startup
    setup_logging()
    logger.info("Starting Voice Interaction Backend")
    
    # Initialize Redis connection
    redis_service = get_redis_service()
    await redis_service.connect()
    
    yield
    
    # Shutdown
    logger.info("Shutting down Voice Interaction Backend")
    await redis_service.disconnect()


# Create FastAPI application
app = FastAPI(
    title="Voice Interaction Backend",
    description="Backend API for voice interaction system using Pipecat, Daily.co, and Redis",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(calls_router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Voice Interaction Backend API", "status": "ok"}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "voice-interaction-backend"
    }


if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )
