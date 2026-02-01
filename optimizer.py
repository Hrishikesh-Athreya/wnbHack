import os
from dotenv import load_dotenv

load_dotenv()

import weave
from weave import Scorer
from google import genai
from google.genai import types
import redis
import json
import asyncio

# Setup Redis with proper config
redis_password = os.getenv('REDIS_PASSWORD')
redis_kwargs = {
    'host': os.getenv('REDIS_HOST', 'localhost'),
    'port': int(os.getenv('REDIS_PORT', 6379)),
    'db': int(os.getenv('REDIS_DB', 0)),
    'decode_responses': True
}
if redis_password:
    redis_kwargs['password'] = redis_password
r = redis.Redis(**redis_kwargs)

gemini_client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))
weave.init('hrishikesha40-sjsu/hackathon-project')

# LLM-based Scorer that uses Gemini to evaluate if a response handles objections well
class LLMPromptQualityScorer(Scorer):
    """Uses Gemini to judge if a prompt-generated response handles the objection properly."""
    
    @weave.op
    def score(self, output: str, input: str, target: str) -> dict:
        """
        Score how well the output handles the input objection.
        Args:
            output: The response generated using the candidate prompt
            input: The customer objection/question
            target: The expected approach/rebuttal
        """
        evaluation_prompt = f"""
        You are evaluating a sales agent's response to a customer objection.
        
        CUSTOMER OBJECTION: "{input}"
        AGENT RESPONSE: "{output}"
        EXPECTED APPROACH: "{target}"
        
        Evaluate:
        1. Does the response address the objection? (yes/no)
        2. Is the tone professional and empathetic? (yes/no)
        3. Does it align with the expected approach? (yes/no)
        
        Return JSON: {{"addresses_objection": bool, "professional_tone": bool, "aligns_with_target": bool, "overall_score": float}}
        The overall_score should be between 0.0 and 1.0.
        """
        
        response = gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=evaluation_prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        
        try:
            result = json.loads(response.text)
            return {
                "addresses_objection": result.get("addresses_objection", False),
                "professional_tone": result.get("professional_tone", False),
                "aligns_with_target": result.get("aligns_with_target", False),
                "overall_score": result.get("overall_score", 0.0)
            }
        except:
            return {
                "addresses_objection": False,
                "professional_tone": False,
                "aligns_with_target": False,
                "overall_score": 0.0
            }


# Model class that simulates using a prompt to respond to objections
class PromptSimulator(weave.Model):
    """Simulates an AI agent using a given prompt to respond to customer objections."""
    prompt: str
    
    @weave.op
    def predict(self, input: str) -> str:
        """Generate a response to the input using the candidate prompt."""
        full_prompt = f"""
        {self.prompt}
        
        Customer says: "{input}"
        
        Respond as the sales agent:
        """
        
        response = gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=full_prompt
        )
        return response.text.strip()


def initialize_default_test_cases():
    """Initialize default test cases in Redis if none exist."""
    if not r.exists("test_cases:list"):
        default_cases = [
            {"input": "Hello, who are you?", "target": "I am a sales representative"},
            {"input": "It is too expensive.", "target": "Value proposition and ROI"},
            {"input": "I need to think about it.", "target": "Address hesitation with urgency"}
        ]
        for case in default_cases:
            r.rpush("test_cases:list", json.dumps(case))
        print(f"📋 Initialized {len(default_cases)} default test cases in Redis")


def add_test_case_from_lesson(objection: str, rebuttal: str):
    """
    Add a new test case to Redis based on a successful lesson learned.
    Called when a human manager closes a deal with a high-quality response.
    """
    test_case = {
        "input": objection,
        "target": rebuttal
    }
    r.rpush("test_cases:list", json.dumps(test_case))
    print(f"📝 Added new test case: '{objection[:50]}...'")
    return test_case


def get_test_cases_from_redis():
    """Fetch all test cases from Redis."""
    cases = r.lrange("test_cases:list", 0, -1)
    return [json.loads(case) for case in cases]

@weave.op
def optimize_and_verify(segment_key: str, transcript: str, outcome: str):
    """
    The 'Optimizer' Loop with Safety Checks.
    Generates a candidate prompt, tests it, and only deploys if it passes.
    
    Args:
        segment_key: Format "country:industry" (e.g., "US:healthcare", "UK:fintech")
        transcript: The call transcript that triggered optimization
        outcome: "CLOSED_DEAL" or "LOST_DEAL"
    """
    # 1. Generate the Candidate Prompt (The "Mutation")
    current_prompt = r.get(f"prompt:segment:{segment_key}")
    if not current_prompt:
        current_prompt = r.get("prompt:base") or "You are a helpful sales agent."

    # Parse segment for context
    parts = segment_key.split(":")
    country = parts[0] if len(parts) > 0 else "US"
    industry = parts[1] if len(parts) > 1 else "general"

    # Build instructions for Gemini to improve the prompt
    instructions = f"""
    You are a Lead Sales Manager optimizing a script for prospects in {industry} industry, {country} region.
    
    CURRENT PROMPT:
    "{current_prompt}"
    
    CALL TRANSCRIPT:
    "{transcript}"
    
    TASK:
    The call outcome was: {outcome}.
    Identify ONE specific missing instruction or weakness in the Current Prompt that caused friction.
    Rewrite the prompt to include a specific rule to handle this company better next time.
    
    CRITICAL: Keep the prompt concise. Only add high-value instructions.
    
    Return ONLY the new full prompt text.
    """

    response = gemini_client.models.generate_content(
        model="gemini-2.0-flash",
        contents=instructions
    )
    candidate_prompt = response.text.strip()

    # 2. THE SAFETY CHECK using W&B Evaluation
    # Fetch test cases from Redis (lessons learned from successful calls)
    test_cases = get_test_cases_from_redis()
    if not test_cases:
        initialize_default_test_cases()
        test_cases = get_test_cases_from_redis()
    
    print(f"🧪 Running W&B Evaluation with {len(test_cases)} test cases...")
    
    # Create a PromptSimulator model with the candidate prompt
    model = PromptSimulator(prompt=candidate_prompt)
    
    # Create W&B Evaluation
    evaluation = weave.Evaluation(
        dataset=test_cases,
        scorers=[LLMPromptQualityScorer()]
    )
    
    # Run the evaluation
    results = asyncio.run(evaluation.evaluate(model))
    
    # Extract the overall score from results
    scorer_results = results.get("LLMPromptQualityScorer", {})
    avg_score = scorer_results.get("overall_score", {}).get("mean", 0.0)
    
    print(f"📊 Evaluation Results: avg_score={avg_score:.2f}")
    
    # 3. The Decision Gate
    if avg_score >= 0.5:
        print(f"✅ Improvement Verified! Updating Redis for segment {segment_key}")
        r.set(f"prompt:segment:{segment_key}", candidate_prompt)
    else:
        print(f"⚠️ New prompt failed safety checks (score: {avg_score:.2f}). Discarding.")

    return candidate_prompt


def get_prompt_for_segment(country: str = "US", industry: str = "general") -> str:
    """
    Get the optimized prompt for a specific country/industry segment.
    Falls back to base prompt if no segment-specific prompt exists.
    
    Args:
        country: The country code (e.g., "US", "UK", "DE")
        industry: The industry (e.g., "healthcare", "fintech", "retail")
        
    Returns:
        The optimized prompt string for that segment
    """
    segment_key = f"{country}:{industry}"
    
    # Try segment-specific prompt first
    prompt = r.get(f"prompt:segment:{segment_key}")
    if prompt:
        return prompt
    
    # Fall back to industry-only prompt
    prompt = r.get(f"prompt:segment:*:{industry}")
    if prompt:
        return prompt
    
    # Fall back to base prompt
    prompt = r.get("prompt:base")
    if prompt:
        return prompt
    
    return "You are a helpful sales agent."