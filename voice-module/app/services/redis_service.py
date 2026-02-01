"""
Redis service for state management and vector search.
Uses actual Redis connection with your Redis Cloud credentials.
"""

import json
import struct
import numpy as np
from typing import Any, Optional
from datetime import datetime
from loguru import logger
import redis.asyncio as redis

from app.config import get_settings


class RedisService:
    """
    Redis service for managing call state and vector search.
    Connected to Redis Cloud.
    """
    
    def __init__(self):
        settings = get_settings()
        self.redis_url = settings.redis_url
        self.redis_password = settings.redis_password
        self.client: Optional[redis.Redis] = None
        logger.info(f"Redis service initialized with URL: {self.redis_url}")
    
    async def connect(self) -> None:
        """Connect to Redis (local or cloud)."""
        try:
            # Parse URL and connect
            # Ensure URL has redis:// prefix
            url = self.redis_url
            if not url.startswith("redis://"):
                url = f"redis://{url}"
            
            # Only pass password if it's not empty
            connect_kwargs = {
                "decode_responses": True
            }
            if self.redis_password:  # Only add password if non-empty
                connect_kwargs["password"] = self.redis_password
            
            self.client = redis.from_url(url, **connect_kwargs)
            # Test connection
            await self.client.ping()
            logger.info(f"Redis connection established successfully! ({url})")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            logger.warning("Falling back to placeholder mode")
            self.client = None
    
    async def disconnect(self) -> None:
        """Disconnect from Redis."""
        if self.client:
            await self.client.close()
            logger.info("Redis connection closed")
    
    def _is_connected(self) -> bool:
        """Check if Redis is connected."""
        return self.client is not None
    
    # ==================== Call State Management ====================
    
    async def set_call_state(self, call_id: str, state: dict[str, Any]) -> None:
        """
        Store the complete call state in Redis.
        
        Args:
            call_id: Unique identifier for the call
            state: Dictionary containing call state
        """
        key = f"call:{call_id}"
        state["updated_at"] = datetime.utcnow().isoformat()
        
        if self._is_connected():
            await self.client.set(key, json.dumps(state))
            logger.debug(f"[Redis] Set call state for {call_id}: status={state.get('status')}")
        else:
            logger.warning(f"[Redis] Not connected, state not persisted for {call_id}")
    
    async def get_call_state(self, call_id: str) -> Optional[dict[str, Any]]:
        """
        Retrieve call state from Redis.
        
        Args:
            call_id: Unique identifier for the call
            
        Returns:
            Call state dictionary or None if not found
        """
        key = f"call:{call_id}"
        
        if self._is_connected():
            data = await self.client.get(key)
            if data:
                return json.loads(data)
        return None
    
    async def update_call_status(self, call_id: str, status: str) -> None:
        """
        Update only the status field of a call.
        
        Args:
            call_id: Unique identifier for the call
            status: New status value (e.g., 'pending', 'active', 'completed')
        """
        state = await self.get_call_state(call_id)
        if state:
            state["status"] = status
            await self.set_call_state(call_id, state)
            logger.info(f"[Redis] Updated call {call_id} status to: {status}")
        else:
            logger.warning(f"[Redis] Call {call_id} not found, cannot update status")
    
    async def delete_call_state(self, call_id: str) -> None:
        """Delete call state from Redis."""
        key = f"call:{call_id}"
        if self._is_connected():
            await self.client.delete(key)
            logger.debug(f"[Redis] Deleted call state for {call_id}")
    
    async def log_call_interaction(self, call_id: str, interaction: dict[str, Any]) -> None:
        """
        Log a call interaction event to Redis.
        
        Args:
            call_id: Unique identifier for the call
            interaction: Dictionary with interaction details (type, content, timestamp, etc.)
        """
        key = f"call:{call_id}:interactions"
        interaction["timestamp"] = datetime.utcnow().isoformat()
        
        if self._is_connected():
            await self.client.rpush(key, json.dumps(interaction))
            logger.info(f"[Redis] Logged interaction for call {call_id}: {interaction.get('type')}")
    
    async def get_call_interactions(self, call_id: str) -> list[dict[str, Any]]:
        """
        Get all logged interactions for a call.
        
        Args:
            call_id: Unique identifier for the call
            
        Returns:
            List of interaction dictionaries
        """
        key = f"call:{call_id}:interactions"
        
        if self._is_connected():
            data = await self.client.lrange(key, 0, -1)
            return [json.loads(item) for item in data]
        return []
    
    # ==================== Vector Search ====================
    
    async def vector_search(
        self,
        query_embedding: list[float],
        index_name: str = "voice_context_idx",
        k: int = 5
    ) -> list[dict[str, Any]]:
        """
        Perform vector similarity search on Redis skill: keys.
        
        Searches the skill:{hash} keys created by main.py's store_lesson_in_redis.
        Each key contains: trigger (objection), rebuttal, vector (768-dim Gemini embedding).
        
        Args:
            query_embedding: Query vector (768-dim Gemini embedding)
            index_name: Name of the Redis vector index (unused, searches skill: keys)
            k: Number of results to return
            
        Returns:
            List of documents with similarity scores
        """
        logger.info(f"[Redis] Vector search with k={k}")
        
        if not self._is_connected():
            logger.warning("[Redis] Not connected, returning empty results")
            return []
        
        try:
            # Get all skill: keys
            cursor = 0
            all_keys = []
            while True:
                cursor, keys = await self.client.scan(cursor, match="skill:*", count=100)
                all_keys.extend(keys)
                if cursor == 0:
                    break
            
            if not all_keys:
                logger.info("[Redis] No skill keys found")
                return []
            
            logger.info(f"[Redis] Found {len(all_keys)} skill keys")
            
            # Convert query embedding to numpy for cosine similarity
            query_vec = np.array(query_embedding)
            query_norm = np.linalg.norm(query_vec)
            if query_norm == 0:
                return []
            
            results = []
            for key in all_keys:
                try:
                    # Get the hash data (using raw bytes)
                    data = await self.client.hgetall(key)
                    if not data:
                        continue
                    
                    # Extract vector bytes and convert to floats
                    vector_bytes = data.get(b"vector") or data.get("vector")
                    if not vector_bytes:
                        continue
                    
                    # Handle bytes vs string keys
                    if isinstance(vector_bytes, str):
                        vector_bytes = vector_bytes.encode('latin-1')
                    
                    # Unpack the vector (768 floats for Gemini)
                    num_floats = len(vector_bytes) // 4
                    stored_vec = np.array(struct.unpack(f'{num_floats}f', vector_bytes))
                    
                    # Compute cosine similarity
                    stored_norm = np.linalg.norm(stored_vec)
                    if stored_norm == 0:
                        continue
                    
                    similarity = np.dot(query_vec, stored_vec) / (query_norm * stored_norm)
                    
                    # Get trigger and rebuttal
                    trigger = data.get(b"trigger") or data.get("trigger") or b""
                    rebuttal = data.get(b"rebuttal") or data.get("rebuttal") or b""
                    
                    if isinstance(trigger, bytes):
                        trigger = trigger.decode('utf-8', errors='ignore')
                    if isinstance(rebuttal, bytes):
                        rebuttal = rebuttal.decode('utf-8', errors='ignore')
                    
                    results.append({
                        "content": f"Objection: {trigger}\nRebuttal: {rebuttal}",
                        "metadata": {"source": "learned_skill", "key": key},
                        "score": float(similarity)
                    })
                    
                except Exception as e:
                    logger.debug(f"[Redis] Error processing key {key}: {e}")
                    continue
            
            # Sort by similarity score and return top k
            results.sort(key=lambda x: x["score"], reverse=True)
            return results[:k]
            
        except Exception as e:
            logger.error(f"[Redis] Vector search failed: {e}")
            return []


# Singleton instance
_redis_service: Optional[RedisService] = None


def get_redis_service() -> RedisService:
    """Get or create the Redis service singleton."""
    global _redis_service
    if _redis_service is None:
        _redis_service = RedisService()
    return _redis_service
