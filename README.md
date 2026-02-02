# AI Sales Agent with Self-Improving Learning Loop

An intelligent voice-based sales agent that learns from every call, stores lessons in Redis, and continuously optimizes its prompts using Weights & Biases evaluations.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│  Voice Module   │────▶│     Redis       │
│   (React)       │     │  (Pipecat/Daily)│     │   (Cloud)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │                        │
                               ▼                        ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │  Learning Loop  │────▶│  W&B Weave      │
                        │  (main.py)      │     │  (Evaluation)   │
                        └─────────────────┘     └─────────────────┘
```

## Redis Usage

Redis serves as the central nervous system for this application, handling **state management**, **knowledge storage**, **vector search**, and **prompt optimization**. We use Redis Cloud for persistence.

### Key Schema

| Key Pattern | Type | Purpose |
|-------------|------|---------|
| `call:{call_id}` | String (JSON) | Call state and metadata |
| `call:{call_id}:interactions` | List | Transcript log (user/agent turns) |
| `skill:{hash}` | Hash | Learned objection/rebuttal pairs with vectors |
| `test_cases:list` | List | Test cases for prompt evaluation |
| `prompt:segment:{country}:{industry}` | String | Optimized prompts per segment |
| `prompt:base` | String | Default fallback prompt |

---

### 1. Call State Management

**Location:** `voice-module/app/services/redis_service.py`

Stores the complete state of each voice call including participants, status, and pre-call research.

```python
# Key: call:{call_id}
# Type: String (JSON)
{
    "call_id": "abc123",
    "room_name": "sales-call-xyz",
    "room_url": "https://daily.co/sales-call-xyz",
    "status": "active",  # pending | active | waiting | completed
    "participants": ["user_123"],
    "agent_joined": true,
    "country": "US",
    "industry": "healthcare",
    "person_name": "John Smith",
    "company_name": "Acme Corp",
    "research": { ... },  # Pre-call Browserbase research
    "updated_at": "2024-01-15T10:30:00Z"
}
```

**Operations:**
- `set_call_state(call_id, state)` - Store/update call state
- `get_call_state(call_id)` - Retrieve call state
- `update_call_status(call_id, status)` - Update status field only
- `delete_call_state(call_id)` - Clean up after call ends

---

### 2. Conversation Transcript Logging

**Location:** `voice-module/app/services/redis_service.py`

Logs every interaction during a call for later analysis by the learning loop.

```python
# Key: call:{call_id}:interactions
# Type: List (JSON items)
[
    {"type": "user_speech", "text": "It's too expensive", "timestamp": "..."},
    {"type": "assistant_speech", "text": "I understand budget is important...", "timestamp": "..."},
    ...
]
```

**Operations:**
- `log_call_interaction(call_id, interaction)` - Append to transcript
- `get_call_interactions(call_id)` - Retrieve full transcript

---

### 3. Learned Skills (Vector Store)

**Location:** `main.py` → `store_lesson_in_redis()`

When a human sales manager closes a deal with a high-quality response, the system extracts the objection/rebuttal pair and stores it with a vector embedding for semantic search.

```python
# Key: skill:{hash(objection)}
# Type: Hash
{
    "trigger": b"It's too expensive",           # The customer objection
    "rebuttal": b"Focus on ROI and value...",   # The winning response
    "vector": b"<768 floats packed as bytes>"   # Gemini embedding
}
```

**How it works:**
1. Human manager closes deal → `process_call_outcome()` called
2. LLM extracts objection/rebuttal from transcript
3. Gemini generates 768-dim embedding for the objection
4. Stored in Redis hash with packed float vector

**Vector Search Flow:**
```
Agent encounters objection
    ↓
search_context("too expensive") tool called
    ↓
Gemini embeds query → 768-dim vector
    ↓
Scan all skill:* keys in Redis
    ↓
Compute cosine similarity with stored vectors
    ↓
Return top-k matching rebuttals
```

---

### 4. Test Cases for Prompt Evaluation

**Location:** `optimizer.py`

Stores test cases used by W&B Weave to evaluate candidate prompts before deployment.

```python
# Key: test_cases:list
# Type: List (JSON items)
[
    {"input": "It is too expensive.", "target": "Value proposition and ROI"},
    {"input": "I need to think about it.", "target": "Address hesitation with urgency"},
    ...
]
```

**Operations:**
- `add_test_case_from_lesson(objection, rebuttal)` - Add from successful call
- `get_test_cases_from_redis()` - Fetch all for evaluation
- `initialize_default_test_cases()` - Seed initial cases

---

### 5. Segment-Specific Optimized Prompts

**Location:** `optimizer.py` → `optimize_and_verify()`

Stores optimized system prompts per country/industry segment. The learning loop continuously improves these based on call outcomes.

```python
# Key: prompt:segment:{country}:{industry}
# Example: prompt:segment:US:healthcare
# Type: String

"You are an expert sales representative specializing in healthcare solutions. 
When prospects mention budget constraints, emphasize ROI and compliance benefits.
Always acknowledge their time pressures before presenting solutions..."
```

**Optimization Flow:**
```
AI agent loses deal
    ↓
process_call_outcome() triggered
    ↓
optimize_and_verify(segment_key, transcript, outcome)
    ↓
Gemini generates improved prompt candidate
    ↓
W&B Weave evaluates against test_cases:list
    ↓
If score >= 0.5: Deploy to prompt:segment:{key}
    ↓
Next call uses improved prompt
```

**Prompt Retrieval Hierarchy:**
1. `prompt:segment:{country}:{industry}` (most specific)
2. `prompt:segment:*:{industry}` (industry fallback)
3. `prompt:base` (default fallback)

---

## Data Flow Example

### Successful Human Call → Learning

```
1. Human manager on call with prospect
2. Prospect: "It's too expensive"
3. Manager: "Let me show you the ROI calculation..."
4. Deal closes ✓

5. process_call_outcome(transcript, "HUMAN_MANAGER", "CLOSED_DEAL")
6. LLM extracts: {objection: "too expensive", rebuttal: "ROI calculation..."}
7. store_lesson_in_redis() → skill:{hash} with vector
8. add_test_case_from_lesson() → test_cases:list
```

### AI Agent Call → Optimization

```
1. AI agent joins call, loads prompt from prompt:segment:US:healthcare
2. Agent encounters objection → calls search_context() tool
3. Vector search finds matching skill:{hash} → returns rebuttal
4. Call ends (win or lose)

5. process_call_outcome(transcript, "AI_AGENT", outcome)
6. If LOST_DEAL: optimize_and_verify() triggered
7. New prompt evaluated against test_cases:list
8. If passes: Updated in prompt:segment:US:healthcare
```

---

## Environment Variables

```bash
# Redis Cloud
REDIS_HOST=redis-xxxxx.c1.us-east-1-2.ec2.redns.redis-cloud.com
REDIS_PORT=16379
REDIS_PASSWORD=your_password
REDIS_DB=0

# APIs
GEMINI_API_KEY=your_key
OPENAI_API_KEY=your_key
DAILY_API_KEY=your_key
BROWSERBASE_API_KEY=your_key
BROWSERBASE_PROJECT_ID=your_project
```

---

## Key Files

| File | Redis Usage |
|------|-------------|
| `main.py` | Stores skills, triggers optimization |
| `optimizer.py` | Manages test cases, prompts |
| `voice-module/app/services/redis_service.py` | Call state, transcripts, vector search |
| `voice-module/bot/tools/vector_search.py` | LLM tool for semantic search |
| `voice-module/bot/bot.py` | Loads prompts before calls |

---

## Running the System

```bash
# Backend (voice module)
cd voice-module
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

The system will automatically:
- Connect to Redis Cloud on startup
- Load optimized prompts per segment
- Perform vector search during calls
- Trigger learning loop on call completion
