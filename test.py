"""
Test script for the Sales Call AI Learning System.
Run this to test both scenarios:
1. Human Manager closes a deal (saves lesson)
2. AI Agent handles a call (grades performance)
"""

from main import process_call_outcome

# Test Scenario 1: Human Manager closes a deal (saves to Redis)
print("=" * 60)
print("TEST 1: Human Manager - Closed Deal (Should save lesson)")
print("=" * 60)

transcript_human = """
Customer: I'm not sure if this software is right for our team. We have a very specific workflow.
Manager: I completely understand. Many teams feel that way initially. Can you tell me more about your specific workflow?
Customer: We need custom integrations with our legacy systems.
Manager: That's actually one of our strengths. We have an open API and we've integrated with dozens of legacy systems. 
        In fact, I can connect you with our solutions engineer who can show you exactly how that would work.
Customer: That would be helpful. Okay, let's move forward.
"""

result1 = process_call_outcome(
    transcript=transcript_human,
    speaker_role="HUMAN_MANAGER",
    outcome="CLOSED_DEAL",
    company_name="Acme Corp"
)
print(f"Result: {result1}")
print()

# Test Scenario 2: AI Agent handles a call (grades against stored lesson)
print("=" * 60)
print("TEST 2: AI Agent - Performance (Should grade)")
print("=" * 60)

transcript_ai = """
Customer: I'm worried about the price. It seems expensive compared to competitors.
AI Agent: I understand your concern about pricing. However, if you look at the total cost of ownership, 
          our solution actually saves you money in the long run because of our included support and maintenance.
Customer: Hmm, I see. Tell me more about those savings.
"""

result2 = process_call_outcome(
    transcript=transcript_ai,
    speaker_role="AI_AGENT",
    outcome="IN_PROGRESS",
    company_name="TechStart Inc"
)
print(f"Result: {result2}")
print()

# Test Scenario 3: Human Manager with low quality score (should NOT save)
print("=" * 60)
print("TEST 3: Human Manager - Low Quality (Should NOT save lesson)")
print("=" * 60)

transcript_low_quality = """
Customer: Yeah, maybe.
Manager: So, what do you think?
Customer: I don't know.
Manager: Okay, well, let me know if you want to buy it.
"""

result3 = process_call_outcome(
    transcript=transcript_low_quality,
    speaker_role="HUMAN_MANAGER",
    outcome="LOST_DEAL",
    company_name="BigBank Corp"
)
print(f"Result: {result3}")
print()

# Test Scenario 4: AI Agent loses a deal (should trigger optimization)
print("=" * 60)
print("TEST 4: AI Agent - Lost Deal (Should optimize prompt)")
print("=" * 60)

transcript_ai_lost = """
Customer: Your security certifications don't meet our compliance requirements.
AI Agent: I understand. We do have some security features.
Customer: That's not enough. We need ISO-27001 and SOC2 compliance.
AI Agent: Let me check on that.
Customer: I think we'll go with another vendor.
"""

result4 = process_call_outcome(
    transcript=transcript_ai_lost,
    speaker_role="AI_AGENT",
    outcome="LOST_DEAL",
    company_name="SecureTech Ltd"
)
print(f"Result: {result4}")
