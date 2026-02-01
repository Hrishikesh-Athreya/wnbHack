"""
Redis Vector Store search tool for Pipecat LLM function calling.
Allows the LLM to retrieve context during the call.
"""

from typing import Optional
from loguru import logger
from google import genai

from app.config import get_settings


async def search_context(
    query: str,
    k: int = 5,
    redis_service: Optional[any] = None
) -> str:
    """
    Search the Redis Vector Store for relevant context.
    
    This function is registered as a Pipecat tool for LLM function calling.
    The LLM can call this during conversation to retrieve context.
    
    Args:
        query: The search query (natural language)
        k: Number of results to return
        redis_service: Redis service instance (injected)
        
    Returns:
        Formatted string with relevant context documents
    """
    logger.info(f"Vector search requested: query='{query}', k={k}")
    
    try:
        # Import here to avoid circular imports
        if redis_service is None:
            from app.services.redis_service import get_redis_service
            redis_service = get_redis_service()
        
        # Get query embedding
        # Note: In production, use actual embedding model
        # For now, using placeholder
        query_embedding = await get_query_embedding(query)
        
        # Perform vector search
        results = await redis_service.vector_search(
            query_embedding=query_embedding,
            k=k
        )
        
        if not results:
            logger.info("No results found in vector search")
            return "No relevant context found."
        
        # Format results for LLM
        context_parts = []
        for i, doc in enumerate(results, 1):
            content = doc.get("content", "")
            score = doc.get("score", 0)
            source = doc.get("metadata", {}).get("source", "unknown")
            
            context_parts.append(
                f"[{i}] (score: {score:.2f}, source: {source})\n{content}"
            )
        
        context = "\n\n".join(context_parts)
        logger.info(f"Vector search returned {len(results)} results")
        
        return context
        
    except Exception as e:
        logger.error(f"Vector search failed: {e}")
        return f"Error performing search: {str(e)}"


async def get_query_embedding(query: str) -> list[float]:
    """
    Get embedding vector for a query string using Gemini.
    
    Args:
        query: The text to embed
        
    Returns:
        Embedding vector (list of floats) - 768 dimensions for Gemini
    """
    logger.debug(f"Getting Gemini embedding for query: {query[:50]}...")
    
    settings = get_settings()
    client = genai.Client(api_key=settings.gemini_api_key)
    
    # Clean the text
    text = query.replace("\n", " ")
    
    result = client.models.embed_content(
        model="models/embedding-001",
        contents=text
    )
    
    return result.embeddings[0].values


# Tool definition for Pipecat registration
VECTOR_SEARCH_TOOL_DEFINITION = {
    "type": "function",
    "function": {
        "name": "search_context",
        "description": "Search the knowledge base of lessons learned from successful sales calls. Use this to find proven objection handlers, rebuttals, and techniques that closed deals. Call this whenever you encounter customer objections like 'too expensive', 'need to think about it', 'not interested', etc.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The customer objection or concern to search for (e.g., 'price objection', 'customer says too expensive', 'need more time to decide')"
                },
                "k": {
                    "type": "integer",
                    "description": "Number of results to return (default: 3)",
                    "default": 3
                }
            },
            "required": ["query"]
        }
    }
}
