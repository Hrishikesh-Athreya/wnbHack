"""
Daily event handlers for presence detection.
Updates Redis state when participants join or leave.
On call end, triggers process_call_outcome for the learning loop.
"""

import sys
import os
from typing import Any
from loguru import logger

# Add parent directory to path for importing main module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))


class PresenceHandler:
    """
    Handler for Daily participant events.
    Updates Redis state when humans join or leave the call.
    """
    
    def __init__(self, call_id: str, redis_service: Any):
        self.call_id = call_id
        self.redis_service = redis_service
        logger.info(f"PresenceHandler initialized for call {call_id}")
    
    async def on_participant_joined(self, participant: dict) -> None:
        """
        Handle participant joined event.
        
        When a human participant joins (not the bot), update Redis state to 'active'.
        
        Args:
            participant: Participant info from Daily event
        """
        participant_id = participant.get("id", "unknown")
        user_name = participant.get("info", {}).get("userName", "unknown")
        is_local = participant.get("info", {}).get("isLocal", False)
        
        logger.info(
            f"Participant joined call {self.call_id}: "
            f"id={participant_id}, name={user_name}, is_local={is_local}"
        )
        
        # Skip if this is the local bot participant
        if is_local:
            logger.debug("Skipping local participant (bot)")
            return
        
        # Update call state in Redis
        state = await self.redis_service.get_call_state(self.call_id)
        if state:
            # Add participant to list
            participants = state.get("participants", [])
            if participant_id not in participants:
                participants.append(participant_id)
                state["participants"] = participants
            
            # Update status to 'active' when human joins
            if state.get("status") == "pending":
                state["status"] = "active"
                logger.info(f"Call {self.call_id} status updated to 'active'")
            
            await self.redis_service.set_call_state(self.call_id, state)
            
            logger.info(
                f"Call {self.call_id} updated: "
                f"participants={len(participants)}, status={state['status']}"
            )
    
    async def on_participant_left(self, participant: dict) -> None:
        """
        Handle participant left event.
        
        Updates participant list and potentially changes status.
        
        Args:
            participant: Participant info from Daily event
        """
        participant_id = participant.get("id", "unknown")
        user_name = participant.get("info", {}).get("userName", "unknown")
        is_local = participant.get("info", {}).get("isLocal", False)
        
        logger.info(
            f"Participant left call {self.call_id}: "
            f"id={participant_id}, name={user_name}"
        )
        
        # Skip if this is the local bot participant
        if is_local:
            return
        
        # Update call state in Redis
        state = await self.redis_service.get_call_state(self.call_id)
        if state:
            # Remove participant from list
            participants = state.get("participants", [])
            if participant_id in participants:
                participants.remove(participant_id)
                state["participants"] = participants
            
            # If no human participants left, update status
            if len(participants) == 0 and state.get("status") == "active":
                state["status"] = "waiting"
                logger.info(f"Call {self.call_id} status updated to 'waiting' (no participants)")
            
            await self.redis_service.set_call_state(self.call_id, state)
    
    async def on_call_ended(self) -> None:
        """
        Handle call ended event.
        
        Updates call status to 'completed' and triggers the learning loop.
        """
        logger.info(f"Call {self.call_id} ended")
        
        state = await self.redis_service.get_call_state(self.call_id)
        if state:
            state["status"] = "completed"
            await self.redis_service.set_call_state(self.call_id, state)
            logger.info(f"Call {self.call_id} status updated to 'completed'")
            
            # Trigger the learning loop with the call transcript
            await self._process_call_for_learning(state)
    
    async def _process_call_for_learning(self, state: dict) -> None:
        """
        Process the completed call through the learning/optimization pipeline.
        
        Collects the transcript from Redis interactions and calls process_call_outcome.
        """
        try:
            # Get all interactions (transcript) for this call
            interactions = await self.redis_service.get_call_interactions(self.call_id)
            
            if not interactions:
                logger.info(f"No interactions found for call {self.call_id}, skipping learning")
                return
            
            # Build transcript from interactions
            transcript_parts = []
            for interaction in interactions:
                interaction_type = interaction.get("type", "")
                text = interaction.get("text", "")
                
                if interaction_type == "user_speech":
                    transcript_parts.append(f"Customer: {text}")
                elif interaction_type == "assistant_speech":
                    transcript_parts.append(f"Agent: {text}")
            
            if not transcript_parts:
                logger.info(f"No speech interactions for call {self.call_id}, skipping learning")
                return
            
            full_transcript = "\n".join(transcript_parts)
            logger.info(f"Built transcript for call {self.call_id}: {len(full_transcript)} chars")
            
            # Get country/industry from call state
            country = state.get("country", "US")
            industry = state.get("industry", "general")
            
            # Import and call process_call_outcome
            try:
                from main import process_call_outcome
                
                logger.info(f"Calling process_call_outcome for {country}:{industry}")
                result = process_call_outcome(
                    transcript=full_transcript,
                    speaker_role="AI_AGENT",
                    outcome=None,  # Auto-determine from transcript
                    country=country,
                    industry=industry
                )
                logger.info(f"process_call_outcome result: {result}")
                
                # Store result in call state
                state["learning_result"] = result
                await self.redis_service.set_call_state(self.call_id, state)
                
            except ImportError as e:
                logger.warning(f"Could not import main module: {e}")
            except Exception as e:
                logger.error(f"Error calling process_call_outcome: {e}")
                import traceback
                logger.error(traceback.format_exc())
                
        except Exception as e:
            logger.error(f"Error processing call for learning: {e}")
            import traceback
            logger.error(traceback.format_exc())
