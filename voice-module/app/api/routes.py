"""
API routes for call orchestration.
"""

import uuid
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from loguru import logger

from app.services.daily_service import get_daily_service
from app.services.redis_service import get_redis_service
from app.services.research_service import run_precall_research

router = APIRouter(prefix="/calls", tags=["calls"])


# ==================== Request/Response Models ====================

class CreateCallRequest(BaseModel):
    """Request model for creating a new call."""
    room_name: Optional[str] = None
    expires_in_minutes: int = 60
    country: str = "US"
    industry: str = "general"
    # Prospect info for pre-call research
    person_name: Optional[str] = None
    person_linkedin_url: Optional[str] = None
    company_name: Optional[str] = None
    company_website: Optional[str] = None


class CreateCallResponse(BaseModel):
    """Response model for create call endpoint."""
    call_id: str
    room_name: str
    room_url: str
    user_token: str
    status: str


class CallStatusResponse(BaseModel):
    """Response model for call status endpoint."""
    call_id: str
    status: str
    room_name: Optional[str] = None
    participants: int = 0


class JoinAgentRequest(BaseModel):
    """Request model for joining agent to call."""
    call_id: str


class JoinAgentResponse(BaseModel):
    """Response model for join agent endpoint."""
    success: bool
    message: str


# ==================== Endpoints ====================

@router.post("/create", response_model=CreateCallResponse)
async def create_call(request: CreateCallRequest, background_tasks: BackgroundTasks):
    """
    Create a new Daily room and store initial state in Redis.
    
    This endpoint:
    1. Creates a new Daily.co room
    2. Generates a user token for joining
    3. Stores initial call state (status: 'pending') in Redis
    4. Returns room details and token
    """
    try:
        call_id = str(uuid.uuid4())
        daily_service = get_daily_service()
        redis_service = get_redis_service()
        
        # Create Daily room
        room = await daily_service.create_room(
            room_name=request.room_name,
            expires_in_minutes=request.expires_in_minutes
        )
        
        room_name = room.get("name")
        room_url = room.get("url")
        
        # Generate user token
        user_token = await daily_service.get_meeting_token(
            room_name=room_name,
            user_name="user",
            is_owner=False
        )
        
        # Store initial state in Redis with status: 'pending'
        initial_state = {
            "call_id": call_id,
            "room_name": room_name,
            "room_url": room_url,
            "status": "pending",
            "participants": [],
            "agent_joined": False,
            "country": request.country,
            "industry": request.industry,
            "person_name": request.person_name,
            "person_linkedin_url": request.person_linkedin_url,
            "company_name": request.company_name,
            "company_website": request.company_website,
            "research": None  # Will be populated by pre-call research
        }
        await redis_service.set_call_state(call_id, initial_state)
        
        # Trigger pre-call research in background if prospect info provided
        if request.person_name or request.company_name:
            background_tasks.add_task(run_precall_research, call_id, initial_state)
        
        logger.info(f"Created call {call_id} with room {room_name}, status: pending")
        
        return CreateCallResponse(
            call_id=call_id,
            room_name=room_name,
            room_url=room_url,
            user_token=user_token,
            status="pending"
        )
        
    except Exception as e:
        logger.error(f"Failed to create call: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{call_id}/status", response_model=CallStatusResponse)
async def get_call_status(call_id: str):
    """
    Get the current status of a call from Redis.
    """
    redis_service = get_redis_service()
    state = await redis_service.get_call_state(call_id)
    
    if not state:
        raise HTTPException(status_code=404, detail="Call not found")
    
    return CallStatusResponse(
        call_id=call_id,
        status=state.get("status", "unknown"),
        room_name=state.get("room_name"),
        participants=len(state.get("participants", []))
    )


@router.post("/{call_id}/join-agent", response_model=JoinAgentResponse)
async def join_agent(call_id: str, background_tasks: BackgroundTasks):
    """
    Trigger the Pipecat agent to join the call.
    
    This endpoint is called when the user selects 'agent' from the frontend popup.
    The agent joining is handled as a background task.
    """
    redis_service = get_redis_service()
    state = await redis_service.get_call_state(call_id)
    
    if not state:
        raise HTTPException(status_code=404, detail="Call not found")
    
    if state.get("agent_joined"):
        return JoinAgentResponse(
            success=False,
            message="Agent has already joined this call"
        )
    
    # Start agent in background
    # Note: In production, you might use a task queue like Celery
    background_tasks.add_task(start_agent_for_call, call_id, state)
    
    logger.info(f"Agent join requested for call {call_id}")
    
    return JoinAgentResponse(
        success=True,
        message="Agent is joining the call"
    )


async def start_agent_for_call(call_id: str, state: dict):
    """
    Background task to start the Pipecat agent for a call.
    
    This imports and runs the bot module with the room details.
    """
    try:
        redis_service = get_redis_service()
        
        # Update state to show agent is joining
        state["agent_joined"] = True
        await redis_service.set_call_state(call_id, state)
        
        # Import and run the bot
        # Note: In production, this would spawn a separate process
        from bot.bot import run_agent
        
        room_url = state.get("room_url")
        room_name = state.get("room_name")
        
        logger.info(f"Starting agent for call {call_id} in room {room_name}")
        
        await run_agent(
            call_id=call_id,
            room_url=room_url,
            room_name=room_name
        )
        
    except Exception as e:
        logger.error(f"Failed to start agent for call {call_id}: {e}")
        # Update state to reflect failure
        redis_service = get_redis_service()
        state["agent_joined"] = False
        state["agent_error"] = str(e)
        await redis_service.set_call_state(call_id, state)
