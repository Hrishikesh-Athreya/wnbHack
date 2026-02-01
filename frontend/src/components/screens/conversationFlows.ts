// conversationFlows.ts
export interface ActivityItem {
    id?: string;
    icon: string;
    text: string;
    type: "info" | "warning" | "error" | "success";
    detail?: string;
    highlight?: boolean;
    confidence?: number;
    timestamp?: string;
}

export interface ConversationStep {
    id: string;
    audioFile?: string;
    speaker?: "agent" | "customer";
    text?: string;
    activity?: ActivityItem;
    activityDelay?: number;
    waitForUser?: boolean;
    quickResponses?: string[];
    autoAdvanceDelay?: number;
    isEnd?: boolean;
    endType?: "escalate" | "success";
    showLearningModal?: boolean;
    showCelebration?: boolean;
}

export interface ConversationFlow {
    id: string;
    title: string;
    steps: ConversationStep[];
}

export const conversationFlows = {
    call1: {
        id: "call1",
        title: "Call 1 - Agent Alpha (Learning)",
        steps: [
            {
                id: "greeting",
                audioFile: "call1_greeting.mp3",
                speaker: "agent" as const,
                text: "Hi, this is Alex from SalesMind. Thanks for taking my call. How are you today?",
                activity: { icon: "📞", text: "Call initiated", type: "info" as const },
                waitForUser: true,
                quickResponses: ["Good, thanks", "I'm busy, make it quick"],
            },
            {
                id: "intro",
                audioFile: "call1_intro.mp3",
                speaker: "agent" as const,
                text: "Great! I saw you requested a demo of our sales automation platform. What interested you most?",
                activity: { icon: "❓", text: "Discovery question", type: "info" as const },
                waitForUser: true,
                quickResponses: [
                    "We need better sales automation",
                    "We're evaluating different platforms",
                ],
            },
            {
                id: "discovery",
                audioFile: "call1_discovery.mp3",
                speaker: "agent" as const,
                text: "Perfect. Tell me a bit about your current sales workflow.",
                activity: { icon: "🔍", text: "Needs analysis", type: "info" as const },
                waitForUser: true,
                quickResponses: [
                    "We use spreadsheets, it's messy",
                    "We have a CRM but don't use it much",
                ],
            },
            {
                id: "feature_pitch",
                audioFile: "call1_feature_pitch.mp3",
                speaker: "agent" as const,
                text: "Our platform helps teams like yours automate follow-ups, track conversations, and close deals faster. Would you like to see a quick demo?",
                activity: {
                    icon: "💡",
                    text: "Value proposition delivered",
                    type: "info" as const,
                },
                waitForUser: true,
                quickResponses: [
                    "Sure, but are you HIPAA compliant?",
                    "Yes, show me the demo",
                ],
            },
            {
                id: "handling_hipaa_unknown",
                audioFile: "call1_handling_hipaa_unknown.mp3",
                speaker: "agent" as const,
                text: "That's a great question about HIPAA compliance. Let me... um... let me check on that for you.",
                activity: {
                    icon: "⚠️",
                    text: "Objection detected: HIPAA Compliance",
                    type: "warning" as const,
                    highlight: true,
                },
                waitForUser: false,
                autoAdvanceDelay: 1500,
            },
            {
                id: "checking",
                audioFile: "call1_checking.mp3",
                speaker: "agent" as const,
                text: "I'm searching our documentation now...",
                activity: {
                    icon: "🔍",
                    text: "Searching knowledge base...",
                    type: "info" as const,
                    confidence: 35,
                },
                waitForUser: false,
                autoAdvanceDelay: 2000,
            },
            {
                id: "no_result",
                activity: {
                    icon: "❌",
                    text: "No matching pattern found",
                    type: "error" as const,
                    highlight: true,
                },
                waitForUser: false,
                autoAdvanceDelay: 1000,
            },
            {
                id: "escalate",
                audioFile: "call1_escalate.mp3",
                speaker: "agent" as const,
                text: "I want to give you accurate information rather than guess. Let me connect you with our compliance specialist who can walk through our certifications in detail. Would that work?",
                activity: {
                    icon: "🚨",
                    text: "Escalating to human (confidence: 35%)",
                    type: "warning" as const,
                    highlight: true,
                },
                waitForUser: true,
                quickResponses: [
                    "Okay, I'll wait for the callback",
                    "Can't you just check now?",
                ],
            },
            {
                id: "closing_failed",
                audioFile: "call1_closing_failed.mp3",
                speaker: "agent" as const,
                text: "Perfect, they'll reach out within the hour. Thanks for your time!",
                activity: {
                    icon: "📞",
                    text: "Call ended - Escalated to human",
                    type: "error" as const,
                },
                isEnd: true,
                endType: "escalate" as const,
                showLearningModal: true,
            },
        ] as ConversationStep[],
    },

    call2: {
        id: "call2",
        title: "Call 2 - Agent Beta (Using Learned Knowledge)",
        steps: [
            {
                id: "greeting",
                audioFile: "call2_greeting.mp3",
                speaker: "agent" as const,
                text: "Hi, this is Jamie from SalesMind. Is this a good time to chat?",
                activity: { icon: "📞", text: "Call initiated", type: "info" as const },
                waitForUser: true,
                quickResponses: ["Yes, I have a few minutes", "Make it quick"],
            },
            {
                id: "intro",
                audioFile: "call2_intro.mp3",
                speaker: "agent" as const,
                text: "Excellent! I understand you're looking at sales automation tools for your team. What's your biggest challenge right now?",
                activity: { icon: "🔍", text: "Discovery mode", type: "info" as const },
                waitForUser: true,
                quickResponses: [
                    "Are you HIPAA compliant? We need BAA agreements",
                    "We need better pipeline tracking",
                ],
            },
            {
                id: "searching",
                activity: {
                    icon: "🔍",
                    text: "Searching collective knowledge base...",
                    type: "info" as const,
                },
                waitForUser: false,
                autoAdvanceDelay: 800,
            },
            {
                id: "found_knowledge",
                activity: {
                    icon: "💾",
                    text: "Retrieved Response #1 (from Agent A-1)",
                    detail: "Added 5 minutes ago | Success Rate: N/A (first use)",
                    type: "success" as const,
                    highlight: true,
                    confidence: 95,
                },
                waitForUser: false,
                autoAdvanceDelay: 1000,
            },
            {
                id: "handling_hipaa_confident",
                audioFile: "call2_handling_hipaa_confident.mp3",
                speaker: "agent" as const,
                text: "Absolutely! We're HIPAA compliant with SOC2 Type II certification. We provide Business Associate Agreements as standard, and all data is encrypted at rest and in transit. I can send you our complete security documentation right now. Would you like me to email that over?",
                activity: {
                    icon: "✅",
                    text: "Using collective knowledge!",
                    type: "success" as const,
                    highlight: true,
                },
                waitForUser: true,
                quickResponses: [
                    "Perfect, yes please send that",
                    "Great, that's exactly what I needed",
                ],
            },
            {
                id: "sentiment_improved",
                activity: {
                    icon: "😊",
                    text: "Sentiment improved: 45 → 85",
                    type: "success" as const,
                },
                waitForUser: false,
                autoAdvanceDelay: 500,
            },
            {
                id: "demo_transition",
                audioFile: "call2_demo_transition.mp3",
                speaker: "agent" as const,
                text: "Perfect, I just sent that. Now let me show you how our platform specifically helps healthcare and medical device companies close deals faster.",
                activity: { icon: "🎯", text: "Demo phase", type: "info" as const },
                waitForUser: false,
                autoAdvanceDelay: 1000,
            },
            {
                id: "features",
                audioFile: "call2_features.mp3",
                speaker: "agent" as const,
                text: "You'll see real-time conversation tracking, automated follow-ups that are HIPAA-compliant, and analytics on your pipeline. Most healthcare clients see a thirty percent increase in close rates within the first quarter.",
                activity: {
                    icon: "📊",
                    text: "Delivering value proposition",
                    type: "info" as const,
                },
                waitForUser: true,
                quickResponses: ["This sounds great", "Tell me more about pricing"],
            },
            {
                id: "trial_close",
                audioFile: "call2_trial_close.mp3",
                speaker: "agent" as const,
                text: "Does this sound like something that could help your team?",
                activity: { icon: "🎯", text: "Trial close", type: "info" as const },
                waitForUser: true,
                quickResponses: [
                    "Yes, this looks perfect for our needs",
                    "I need to think about it",
                ],
            },
            {
                id: "closing_detected",
                activity: {
                    icon: "🎉",
                    text: "Close detected - Probability: 91%",
                    type: "success" as const,
                    highlight: true,
                },
                waitForUser: false,
                autoAdvanceDelay: 800,
            },
            {
                id: "closing_won",
                audioFile: "call2_closing_won.mp3",
                speaker: "agent" as const,
                text: "Fantastic! I'll send over the contract and implementation timeline right now. When would be best to kick off - this week or next?",
                activity: { icon: "📝", text: "Contract stage", type: "info" as const },
                waitForUser: true,
                quickResponses: ["This week works - Wednesday", "Next week is better"],
            },
            {
                id: "final",
                audioFile: "call2_final.mp3",
                speaker: "agent" as const,
                text: "Perfect, I'll get everything scheduled. Looking forward to working with you!",
                activity: {
                    icon: "✅",
                    text: "Call ended - Closed Won $95K",
                    type: "success" as const,
                },
                isEnd: true,
                endType: "success" as const,
                showCelebration: true,
            },
        ] as ConversationStep[],
    },
};

// Export individual flows for convenience
export const call1Flow = conversationFlows.call1.steps;
export const call2Flow = conversationFlows.call2.steps;
