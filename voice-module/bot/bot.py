"""
Main Pipecat agent with DailyTransport.

This module implements the voice AI agent that:
1. Joins Daily rooms using DailyTransport
2. Handles voice input/output via Pipecat pipeline
3. Uses OpenAI for STT (Whisper), LLM, and TTS
4. Registers tools for function calling (vector search)
5. Implements presence detection via Daily events
"""

import asyncio
import os
from loguru import logger

# Pipecat imports
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.audio.vad.vad_analyzer import VADParams
from pipecat.frames.frames import LLMRunFrame, TranscriptionFrame, TextFrame, LLMFullResponseEndFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)
from pipecat.processors.frame_processor import FrameProcessor, FrameDirection
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.services.openai.tts import OpenAITTSService
from pipecat.services.openai.stt import OpenAISTTService
from pipecat.transports.daily.transport import DailyTransport, DailyParams

# Local imports
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.config import get_settings
from app.services.redis_service import get_redis_service
from app.services.daily_service import get_daily_service
from bot.handlers.presence import PresenceHandler
from bot.tools.vector_search import search_context, VECTOR_SEARCH_TOOL_DEFINITION


class TranscriptLogger(FrameProcessor):
    """Logs transcriptions and text frames to console and Redis.
    
    Buffers assistant responses and logs complete sentences when LLM finishes.
    """
    
    def __init__(self, call_id: str, redis_service, role: str = "user"):
        super().__init__()
        self.call_id = call_id
        self.redis_service = redis_service
        self.role = role  # "user" or "assistant"
        self.assistant_buffer = []  # Buffer for assistant words
    
    async def process_frame(self, frame, direction: FrameDirection):
        await super().process_frame(frame, direction)
        
        # Log transcription frames (user speech) - already comes as complete sentences
        if isinstance(frame, TranscriptionFrame):
            text = frame.text.strip()
            if text:
                logger.info(f"[TRANSCRIPT] 👤 User: \"{text}\"")
                # Store in Redis
                await self.redis_service.log_call_interaction(
                    self.call_id,
                    {"type": "user_speech", "text": text}
                )
        
        # Buffer text frames (assistant responses come word-by-word)
        elif isinstance(frame, TextFrame) and self.role == "assistant":
            text = frame.text
            if text:
                self.assistant_buffer.append(text)
        
        # When LLM finishes, log the complete response
        elif isinstance(frame, LLMFullResponseEndFrame) and self.role == "assistant":
            if self.assistant_buffer:
                complete_response = "".join(self.assistant_buffer).strip()
                if complete_response:
                    logger.info(f"[TRANSCRIPT] 🤖 Assistant: \"{complete_response}\"")
                    await self.redis_service.log_call_interaction(
                        self.call_id,
                        {"type": "assistant_speech", "text": complete_response}
                    )
                self.assistant_buffer = []  # Clear buffer
        
        # Pass frame through
        await self.push_frame(frame, direction)


def get_system_prompt(
    country: str = "US",
    industry: str = "general",
    research: dict = None,
    person_name: str = None,
    company_name: str = None
) -> str:
    """
    Build the system prompt for the agent, incorporating optimized prompt and research.
    
    Args:
        country: The prospect's country
        industry: The prospect's industry
        research: Pre-call research data from Browserbase
        person_name: Name of the prospect
        company_name: Name of the company
        
    Returns:
        Complete system prompt for the agent
    """
    # Try to get optimized prompt from Redis
    optimized_prompt = None
    try:
        from optimizer import get_prompt_for_segment
        optimized_prompt = get_prompt_for_segment(country, industry)
        logger.info(f"Loaded optimized prompt for {country}:{industry}")
    except ImportError:
        logger.warning("Could not import optimizer, using default prompt")
    except Exception as e:
        logger.warning(f"Error loading optimized prompt: {e}")
    
    # Build the complete system prompt
    if optimized_prompt and optimized_prompt != "You are a helpful sales agent.":
        sales_instructions = optimized_prompt
    else:
        sales_instructions = """You are an expert sales representative. Your goal is to understand customer needs, handle objections professionally, and guide them toward a solution."""
    
    # Build research context section
    research_context = ""
    if research and research.get("summary"):
        research_context = f"""
=== PRE-CALL RESEARCH ===
{research.get('summary', 'No research available.')}

Talking Points:
{chr(10).join('- ' + p for p in research.get('talking_points', [])) or '- None available'}
=========================
"""
    elif person_name or company_name:
        research_context = f"""
=== PROSPECT INFO ===
{f'Name: {person_name}' if person_name else ''}
{f'Company: {company_name}' if company_name else ''}
=====================
"""
    
    return f"""{sales_instructions}
{research_context}
You are on a VOICE CALL with {person_name or 'a prospect'}{f' from {company_name}' if company_name else ''}. Keep responses concise and conversational.

IMPORTANT - You have access to a knowledge base of lessons learned from successful sales calls. USE the search_context tool:
- When you encounter an objection (e.g., "too expensive", "need to think about it", "not the right time")
- When you need proven rebuttals or techniques that worked before
- When looking up how to handle specific customer concerns

The search_context tool searches through real objection/rebuttal pairs from closed deals. Always search before responding to difficult objections.

Guidelines:
- Be confident, friendly, and professional
- Listen carefully to customer concerns
- Use the knowledge base to give battle-tested responses
- Focus on value and solving their problems
- Keep responses SHORT for voice
- Reference the research above to personalize the conversation"""


async def run_agent(
    call_id: str,
    room_url: str,
    room_name: str
) -> None:
    """
    Run the Pipecat voice agent for a specific call.
    
    Args:
        call_id: Unique call identifier (for Redis state)
        room_url: Daily room URL to join
        room_name: Daily room name
    """
    logger.info(f"Starting agent for call {call_id} in room {room_name}")
    
    settings = get_settings()
    redis_service = get_redis_service()
    daily_service = get_daily_service()
    
    # Ensure Redis is connected
    await redis_service.connect()
    
    # Generate bot token
    bot_token = await daily_service.get_meeting_token(
        room_name=room_name,
        user_name="AI Assistant",
        is_owner=True
    )
    
    # Initialize presence handler
    presence_handler = PresenceHandler(
        call_id=call_id,
        redis_service=redis_service
    )
    
    try:
        # Configure Daily transport with audio enabled
        transport = DailyTransport(
            room_url=room_url,
            token=bot_token,
            bot_name="AI Assistant",
            params=DailyParams(
                audio_in_enabled=True,
                audio_out_enabled=True,
            )
        )
        
        # Configure OpenAI STT service (Speech-to-Text)
        stt = OpenAISTTService(
            api_key=settings.openai_api_key,
            model="whisper-1",
        )
        
        # Configure OpenAI TTS service (Text-to-Speech)
        tts = OpenAITTSService(
            api_key=settings.openai_api_key,
            voice="alloy",
            model="tts-1",
        )
        
        # Define the tools for the LLM
        tools = [VECTOR_SEARCH_TOOL_DEFINITION]
        
        # Configure OpenAI LLM service with tools
        llm = OpenAILLMService(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
            tools=tools,
        )
        
        # Register vector search tool handler
        async def handle_search_context(query: str, k: int = 5) -> str:
            """Tool handler for searching lessons learned from successful sales calls."""
            logger.info(f"[Tool Call] search_context: query='{query}', k={k}")
            result = await search_context(query=query, k=k, redis_service=redis_service)
            logger.info(f"[Tool Result] search_context returned {len(result)} chars")
            return result
        
        llm.register_function("search_context", handle_search_context)
        
        # Get call state to retrieve country/industry and research for prompt customization
        call_state = await redis_service.get_call_state(call_id)
        country = call_state.get("country", "US") if call_state else "US"
        industry = call_state.get("industry", "general") if call_state else "general"
        person_name = call_state.get("person_name") if call_state else None
        company_name = call_state.get("company_name") if call_state else None
        research = call_state.get("research") if call_state else None
        
        # Build system prompt from Redis (segment-specific optimizations + research)
        system_prompt = get_system_prompt(
            country=country,
            industry=industry,
            research=research,
            person_name=person_name,
            company_name=company_name
        )
        logger.info(f"Using system prompt for {person_name or 'prospect'} at {company_name or 'unknown'} ({country}:{industry})")
        if research:
            logger.info(f"Pre-call research included: {len(research.get('summary', ''))} chars")
        
        # Define conversation context with system message
        messages = [
            {
                "role": "system",
                "content": system_prompt
            }
        ]
        
        # Create LLM context and aggregators (CRITICAL for voice to work!)
        context = LLMContext(messages)
        user_aggregator, assistant_aggregator = LLMContextAggregatorPair(
            context,
            user_params=LLMUserAggregatorParams(
                # VAD detects when user stops speaking
                vad_analyzer=SileroVADAnalyzer(params=VADParams(stop_secs=0.3)),
            ),
        )
        
        # Create transcript loggers
        user_transcript_logger = TranscriptLogger(call_id, redis_service, role="user")
        assistant_transcript_logger = TranscriptLogger(call_id, redis_service, role="assistant")
        
        # Build the full voice pipeline
        # Audio In -> STT -> Log User -> Aggregate -> LLM -> Log Assistant -> TTS -> Audio Out -> Aggregate
        pipeline = Pipeline([
            transport.input(),              # Audio input from Daily
            stt,                            # OpenAI Whisper STT
            user_transcript_logger,         # Log user speech
            user_aggregator,                # Aggregate user speech to context
            llm,                            # OpenAI LLM for responses
            assistant_transcript_logger,    # Log assistant responses
            tts,                            # OpenAI TTS for voice output
            transport.output(),             # Audio output to Daily
            assistant_aggregator,           # Aggregate assistant responses to context
        ])
        
        # Create and run the pipeline task
        runner = PipelineRunner()
        task = PipelineTask(
            pipeline,
            params=PipelineParams(
                allow_interruptions=True,
                enable_metrics=True,
            ),
            idle_timeout_secs=300,  # Stay in room for 5 minutes
        )
        
        # Register Daily event handlers
        @transport.event_handler("on_participant_joined")
        async def on_participant_joined(transport, participant):
            await presence_handler.on_participant_joined(participant)
            participant_id = participant.get('id')
            is_local = participant.get('local', False)
            logger.info(f"[Presence] Participant joined: {participant_id}, local={is_local}")
            
            # Trigger greeting when a human (non-local) participant joins
            if not is_local:
                logger.info(f"[Voice] Triggering greeting for participant {participant_id}")
                messages.append({"role": "user", "content": "Please introduce yourself briefly."})
                await task.queue_frames([LLMRunFrame()])
        
        @transport.event_handler("on_participant_left")
        async def on_participant_left(transport, participant):
            await presence_handler.on_participant_left(participant)
            logger.info(f"[Presence] Participant left: {participant.get('id')}")
        
        @transport.event_handler("on_call_state_updated")
        async def on_call_state_updated(transport, state):
            logger.info(f"[Call State] Updated: {state}")
            if state == "left":
                await presence_handler.on_call_ended()
        
        logger.info(f"[Pipeline] Agent pipeline starting for call {call_id}")
        logger.info(f"[STT] Using OpenAI Whisper")
        logger.info(f"[TTS] Using OpenAI TTS with voice: alloy")
        logger.info(f"[VAD] Using SileroVADAnalyzer with stop_secs=0.3")
        
        # Run the pipeline
        await runner.run(task)
        
    except Exception as e:
        logger.error(f"Agent error for call {call_id}: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise
    
    finally:
        # Update call state when agent exits
        await presence_handler.on_call_ended()
        logger.info(f"Agent exited for call {call_id}")


async def main():
    """
    Main entry point for running the agent standalone.
    
    Usage:
        python -m bot.bot --room-url <url> --room-name <name> --call-id <id>
    """
    import argparse
    
    parser = argparse.ArgumentParser(description="Run Pipecat voice agent")
    parser.add_argument("--room-url", required=True, help="Daily room URL")
    parser.add_argument("--room-name", required=True, help="Daily room name")  
    parser.add_argument("--call-id", required=True, help="Call ID for Redis state")
    
    args = parser.parse_args()
    
    await run_agent(
        call_id=args.call_id,
        room_url=args.room_url,
        room_name=args.room_name
    )


if __name__ == "__main__":
    asyncio.run(main())
