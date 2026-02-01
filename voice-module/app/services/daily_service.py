"""
Daily.co service for room creation and token generation.
"""

import httpx
from typing import Optional
from datetime import datetime, timedelta
from loguru import logger

from app.config import get_settings


class DailyService:
    """Service for interacting with Daily.co REST API."""
    
    def __init__(self):
        settings = get_settings()
        self.api_key = settings.daily_api_key
        self.api_url = settings.daily_api_url
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    async def create_room(
        self,
        room_name: Optional[str] = None,
        expires_in_minutes: int = 60,
        enable_recording: bool = False
    ) -> dict:
        """
        Create a new Daily room.
        
        Args:
            room_name: Optional custom room name (auto-generated if not provided)
            expires_in_minutes: Room expiration time in minutes
            enable_recording: Whether to enable cloud recording
            
        Returns:
            Dictionary with room details including 'name' and 'url'
        """
        expiry = datetime.utcnow() + timedelta(minutes=expires_in_minutes)
        
        payload = {
            "properties": {
                "exp": int(expiry.timestamp()),
                "enable_chat": True,
                "enable_screenshare": False,
                "start_audio_off": False,
                "start_video_off": True,
                "enable_recording": "cloud" if enable_recording else None,
            }
        }
        
        if room_name:
            payload["name"] = room_name
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_url}/rooms",
                headers=self.headers,
                json=payload
            )
            
            if response.status_code != 200:
                logger.error(f"Failed to create room: {response.text}")
                raise Exception(f"Daily API error: {response.status_code}")
            
            room_data = response.json()
            logger.info(f"Created Daily room: {room_data.get('name')}")
            return room_data
    
    async def get_meeting_token(
        self,
        room_name: str,
        user_name: str = "user",
        is_owner: bool = False,
        expires_in_minutes: int = 60
    ) -> str:
        """
        Generate a meeting token for joining a room.
        
        Args:
            room_name: Name of the room to join
            user_name: Display name for the participant
            is_owner: Whether the participant should have owner privileges
            expires_in_minutes: Token expiration time in minutes
            
        Returns:
            Meeting token string
        """
        expiry = datetime.utcnow() + timedelta(minutes=expires_in_minutes)
        
        payload = {
            "properties": {
                "room_name": room_name,
                "user_name": user_name,
                "is_owner": is_owner,
                "exp": int(expiry.timestamp()),
                "enable_screenshare": False,
                "start_audio_off": False,
                "start_video_off": True,
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_url}/meeting-tokens",
                headers=self.headers,
                json=payload
            )
            
            if response.status_code != 200:
                logger.error(f"Failed to create token: {response.text}")
                raise Exception(f"Daily API error: {response.status_code}")
            
            token_data = response.json()
            logger.info(f"Created meeting token for room: {room_name}")
            return token_data.get("token")
    
    async def delete_room(self, room_name: str) -> bool:
        """
        Delete a Daily room.
        
        Args:
            room_name: Name of the room to delete
            
        Returns:
            True if successful, False otherwise
        """
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.api_url}/rooms/{room_name}",
                headers=self.headers
            )
            
            if response.status_code == 200:
                logger.info(f"Deleted Daily room: {room_name}")
                return True
            else:
                logger.warning(f"Failed to delete room {room_name}: {response.text}")
                return False


# Singleton instance
_daily_service: Optional[DailyService] = None


def get_daily_service() -> DailyService:
    """Get or create the Daily service singleton."""
    global _daily_service
    if _daily_service is None:
        _daily_service = DailyService()
    return _daily_service
