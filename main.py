import os
from dotenv import load_dotenv

load_dotenv()

import weave
from google import genai
from google.genai import types
import redis
import json
import struct

# Initialize Gemini client
weave.init('hrishikesha40-sjsu/hackathon-project')
gemini_client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))
redis_password = os.getenv('REDIS_PASSWORD')
redis_kwargs = {
    'host': os.getenv('REDIS_HOST', 'localhost'),
    'port': int(os.getenv('REDIS_PORT', 6379)),
    'db': int(os.getenv('REDIS_DB', 0)),
    'decode_responses': False
}
if redis_password:
    redis_kwargs['password'] = redis_password
r = redis.Redis(**redis_kwargs)

def determine_call_outcome(transcript: str) -> str:
    """
    Use LLM to analyze transcript and determine if the call was a success or failure.
    
    Args:
        transcript: The full call transcript
        
    Returns:
        "CLOSED_DEAL" or "LOST_DEAL"
    """
    prompt = f"""
    Analyze this sales call transcript and determine the outcome.
    
    Transcript:
    {transcript}
    
    Based on the conversation, did the sales agent successfully close the deal or move the prospect forward?
    Consider:
    - Did the prospect agree to next steps (demo, meeting, purchase)?
    - Did the prospect express clear interest or commitment?
    - Did the call end positively with action items?
    
    Return JSON: {{ "outcome": "CLOSED_DEAL" or "LOST_DEAL", "confidence": float, "reason": str }}
    """
    
    response = gemini_client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
        config=types.GenerateContentConfig(response_mime_type="application/json")
    )
    
    try:
        result = json.loads(response.text)
        outcome = result.get("outcome", "LOST_DEAL")
        confidence = result.get("confidence", 0.0)
        reason = result.get("reason", "")
        print(f"📊 Outcome analysis: {outcome} (confidence: {confidence:.2f}) - {reason}")
        return outcome
    except:
        print("⚠️ Could not parse outcome, defaulting to LOST_DEAL")
        return "LOST_DEAL"

@weave.op
def process_call_outcome(transcript: str, speaker_role: str, outcome: str = None, country: str = "US", industry: str = "general"):
    """
    The Universal 'Refinery' Function.
    Args:
        transcript: The full text of the call.
        speaker_role: "HUMAN_MANAGER" or "AI_AGENT".
        outcome: "CLOSED_DEAL" or "LOST_DEAL" (auto-determined if None).
        country: The country of the prospect (for prompt optimization).
        industry: The industry of the prospect (for prompt optimization).
    """
    # Auto-determine outcome if not provided
    if outcome is None:
        outcome = determine_call_outcome(transcript)
        print(f"🎯 Auto-determined outcome: {outcome}")
    
    # Create segment key for prompt optimization
    segment_key = f"{country}:{industry}"
    # Import optimizer functions
    from optimizer import add_test_case_from_lesson, optimize_and_verify
    
    # 1. THE JUDGE: Analyze the transcript regardless of who spoke
    # We ask the LLM to identify the "Pivot Point" of the call.
    prompt = f"""
    Analyze this sales call.
    Identify the main OBJECTION the customer had.
    Identify the REBUTTAL used to solve it.
    
    Transcript: {transcript}
    
    Return JSON: {{ "objection": str, "rebuttal": str, "quality_score": float }}
    """
    
    response = gemini_client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
        config=types.GenerateContentConfig(response_mime_type="application/json")
    )
    analysis = json.loads(response.text)
    
    # 2. THE ROUTER: Decide what to do based on who spoke
    
    # SCENARIO A: The Human "Teacher" (Mining New Lessons)
    if speaker_role == "HUMAN_MANAGER" and outcome == "CLOSED_DEAL":
        if analysis['quality_score'] > 0.8:
            print(f"💎 Gold Found! Saving new lesson for: {analysis['objection']}")
            store_lesson_in_redis(analysis)
            # Also add as a test case for future prompt optimization
            add_test_case_from_lesson(analysis['objection'], analysis['rebuttal'])
            return {"status": "learned_new_skill", "data": analysis, "segment": segment_key}

    # SCENARIO B: The AI "Student" (Grading Performance)
    elif speaker_role == "AI_AGENT":
        # Check if the AI followed the known best practice
        known_best = r.hget(f"skill:{hash(analysis['objection'])}", "rebuttal")
        
        grading_score = 1.0 if analysis['rebuttal'] == known_best else 0.5
        
        print(f"📝 Grading AI: Score {grading_score}")
        
        # If AI lost the deal, trigger prompt optimization
        if outcome == "LOST_DEAL":
            print(f"🔧 Triggering prompt optimization for {segment_key}...")
            optimized_prompt = optimize_and_verify(segment_key, transcript, outcome)
            return {"status": "graded_agent", "score": grading_score, "optimized": True, "segment": segment_key}
        
        return {"status": "graded_agent", "score": grading_score}

    # SCENARIO C: Any LOST_DEAL triggers optimization
    if outcome == "LOST_DEAL":
        print(f"🔧 Lost deal - optimizing prompt for {segment_key}...")
        optimized_prompt = optimize_and_verify(segment_key, transcript, outcome)
        return {"status": "prompt_optimized", "segment": segment_key}

    return {"status": "no_action_needed"}

def store_lesson_in_redis(analysis):
    """Helper to push the vector to Redis"""
    # Create embedding (Vector) for the Objection
    vector = get_embedding(analysis['objection'])
    
    # Convert list of floats to bytes
    vector_bytes = struct.pack(f'{len(vector)}f', *vector)

    # Save as a Hash in Redis
    r.hset(
        name=f"skill:{hash(analysis['objection'])}",
        mapping={
            "trigger": analysis['objection'].encode(),
            "rebuttal": analysis['rebuttal'].encode(),
            "vector": vector_bytes
        }
    )
def get_embedding(text: str, model="embedding-001"):
    """
    Converts text into a vector (list of floats) using Gemini embeddings.
    """
    text = text.replace("\n", " ")
    
    result = gemini_client.models.embed_content(
        model=f"models/{model}",
        contents=text
    )
    return result.embeddings[0].values