import { useState, useEffect, useRef, useCallback } from "react";

interface SpeechRecognitionResult {
    isListening: boolean;
    transcript: string;
    interimText: string;
    startListening: () => void;
    stopListening: () => void;
    isSupported: boolean;
    error: string | null;
}

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResultItem;
    [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultItem {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
    onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
    onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
    onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
}

interface SpeechRecognitionConstructor {
    new(): SpeechRecognitionInstance;
}

// Extend Window interface for speech recognition
declare global {
    interface Window {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
    }
}

export function useSpeechRecognition(): SpeechRecognitionResult {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [interimText, setInterimText] = useState("");
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

    const isSupported =
        typeof window !== "undefined" &&
        (window.SpeechRecognition !== undefined || window.webkitSpeechRecognition !== undefined);

    useEffect(() => {
        if (!isSupported) {
            return;
        }

        const SpeechRecognitionAPI =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognitionAPI) return;

        recognitionRef.current = new SpeechRecognitionAPI();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
            let interimTranscript = "";
            let finalTranscript = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcriptPiece = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcriptPiece;
                } else {
                    interimTranscript += transcriptPiece;
                }
            }

            setInterimText(interimTranscript);
            if (finalTranscript) {
                setTranscript(finalTranscript);
                setInterimText("");
            }
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error("Speech recognition error:", event.error);
            setError(event.error);
            setIsListening(false);
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
        };

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [isSupported]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            setTranscript("");
            setInterimText("");
            setError(null);
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Failed to start speech recognition:", e);
                setError("Failed to start");
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    }, [isListening]);

    return {
        isListening,
        transcript,
        interimText,
        startListening,
        stopListening,
        isSupported,
        error,
    };
}
